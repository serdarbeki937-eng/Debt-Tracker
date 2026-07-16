import { Router, type IRouter } from "express";
import { and, eq, gte, ilike, lte } from "drizzle-orm";
import { db, clientsTable, transactionsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  CreateTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadTransactionWithClientName(id: number) {
  const [row] = await db
    .select({
      id: transactionsTable.id,
      clientId: transactionsTable.clientId,
      clientName: clientsTable.name,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      date: transactionsTable.date,
      paymentType: transactionsTable.paymentType,
      responsiblePerson: transactionsTable.responsiblePerson,
      comment: transactionsTable.comment,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .innerJoin(clientsTable, eq(transactionsTable.clientId, clientsTable.id))
    .where(eq(transactionsTable.id, id));
  return row ? { ...row, amount: Number(row.amount) } : row;
}

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { clientId, search, paymentType, responsiblePerson, dateFrom, dateTo } =
    query.data;

  const conditions = [];
  if (clientId != null) conditions.push(eq(transactionsTable.clientId, clientId));
  if (search) conditions.push(ilike(clientsTable.name, `%${search}%`));
  if (paymentType) conditions.push(eq(transactionsTable.paymentType, paymentType));
  if (responsiblePerson)
    conditions.push(ilike(transactionsTable.responsiblePerson, `%${responsiblePerson}%`));
  if (dateFrom) conditions.push(gte(transactionsTable.date, toDateStr(dateFrom)));
  if (dateTo) conditions.push(lte(transactionsTable.date, toDateStr(dateTo)));

  const rows = await db
    .select({
      id: transactionsTable.id,
      clientId: transactionsTable.clientId,
      clientName: clientsTable.name,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      date: transactionsTable.date,
      paymentType: transactionsTable.paymentType,
      responsiblePerson: transactionsTable.responsiblePerson,
      comment: transactionsTable.comment,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .innerJoin(clientsTable, eq(transactionsTable.clientId, clientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(transactionsTable.date, transactionsTable.id);

  res.json(
    ListTransactionsResponse.parse(
      rows.reverse().map((r) => ({ ...r, amount: Number(r.amount) })),
    ),
  );
});

router.post("/transactions", requireAuth, async (req, res): Promise<void> => {
  const body = CreateTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, body.data.clientId));
  if (!client) {
    res.status(400).json({ error: "Klient topilmadi" });
    return;
  }

  const [created] = await db
    .insert(transactionsTable)
    .values({
      clientId: body.data.clientId,
      type: body.data.type,
      amount: String(body.data.amount),
      date: toDateStr(body.data.date),
      paymentType: body.data.paymentType,
      responsiblePerson: body.data.responsiblePerson,
      comment: body.data.comment,
    })
    .returning();

  const full = await loadTransactionWithClientName(created.id);
  res.status(201).json(CreateTransactionResponse.parse(full));
});

router.patch("/transactions/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (body.data.clientId != null) {
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, body.data.clientId));
    if (!client) {
      res.status(400).json({ error: "Klient topilmadi" });
      return;
    }
  }

  const updates: Record<string, unknown> = { ...body.data };
  if (body.data.amount != null) updates.amount = String(body.data.amount);
  if (body.data.date != null) updates.date = toDateStr(body.data.date);

  const [updated] = await db
    .update(transactionsTable)
    .set(updates)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Operatsiya topilmadi" });
    return;
  }

  const full = await loadTransactionWithClientName(updated.id);
  res.json(UpdateTransactionResponse.parse(full));
});

router.delete(
  "/transactions/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteTransactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [deleted] = await db
      .delete(transactionsTable)
      .where(eq(transactionsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Operatsiya topilmadi" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
