import { Router, type IRouter } from "express";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db, clientsTable, transactionsTable } from "@workspace/db";
import {
  ListClientsQueryParams,
  ListClientsResponse,
  CreateClientBody,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  DeleteClientParams,
  ListClientTransactionsParams,
  ListClientTransactionsResponse,
  ListTerritoriesResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { getClientBalance, getClientBalances } from "../lib/ledger";

const router: IRouter = Router();

router.get("/territories", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ territory: clientsTable.territory })
    .from(clientsTable)
    .orderBy(clientsTable.territory);
  res.json(ListTerritoriesResponse.parse(rows.map((r) => r.territory)));
});

router.get("/clients", requireAuth, async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search, territory, responsiblePerson } = query.data;

  const conditions = [];
  if (search) {
    conditions.push(ilike(clientsTable.name, `%${search}%`));
  }
  if (territory) {
    conditions.push(eq(clientsTable.territory, territory));
  }
  if (responsiblePerson) {
    conditions.push(ilike(clientsTable.responsiblePerson, `%${responsiblePerson}%`));
  }

  const clients = await db
    .select()
    .from(clientsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(clientsTable.name);

  const balances = await getClientBalances(clients.map((c) => c.id));

  res.json(
    ListClientsResponse.parse(
      clients.map((c) => ({ ...c, balance: balances.get(c.id) ?? 0 })),
    ),
  );
});

router.post("/clients", requireAuth, async (req, res): Promise<void> => {
  const body = CreateClientBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [client] = await db.insert(clientsTable).values(body.data).returning();
  res.status(201).json(GetClientResponse.parse({ ...client, balance: 0 }));
});

router.get("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  if (!client) {
    res.status(404).json({ error: "Klient topilmadi" });
    return;
  }

  const balance = await getClientBalance(client.id);
  res.json(GetClientResponse.parse({ ...client, balance }));
});

router.patch("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateClientBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set(body.data)
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Klient topilmadi" });
    return;
  }

  const balance = await getClientBalance(client.id);
  res.json(UpdateClientResponse.parse({ ...client, balance }));
});

router.delete(
  "/clients/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteClientParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [client] = await db
      .delete(clientsTable)
      .where(eq(clientsTable.id, params.data.id))
      .returning();

    if (!client) {
      res.status(404).json({ error: "Klient topilmadi" });
      return;
    }

    res.sendStatus(204);
  },
);

router.get(
  "/clients/:id/transactions",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListClientTransactionsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

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
      .where(eq(transactionsTable.clientId, params.data.id))
      .orderBy(sql`${transactionsTable.date} desc, ${transactionsTable.id} desc`);

    res.json(
      ListClientTransactionsResponse.parse(
        rows.map((r) => ({ ...r, amount: Number(r.amount) })),
      ),
    );
  },
);

export default router;
