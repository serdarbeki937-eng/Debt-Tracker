import { Router, type IRouter } from "express";
import { and, eq, gte, ilike, lte } from "drizzle-orm";
import { db, clientsTable, transactionsTable } from "@workspace/db";
import {
  ExportClientsQueryParams,
  ExportTransactionsQueryParams,
  ExportAktSverkaExcelQueryParams,
  ExportAktSverkaPdfQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { getClientBalances, getAktSverka } from "../lib/ledger";
import {
  buildClientsWorkbook,
  buildTransactionsWorkbook,
  buildAktSverkaWorkbook,
  buildAktSverkaPdf,
} from "../lib/export";

const router: IRouter = Router();

router.get("/export/clients", requireAuth, async (req, res): Promise<void> => {
  const query = ExportClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search, territory, responsiblePerson } = query.data;

  const conditions = [];
  if (search) conditions.push(ilike(clientsTable.name, `%${search}%`));
  if (territory) conditions.push(eq(clientsTable.territory, territory));
  if (responsiblePerson) conditions.push(ilike(clientsTable.responsiblePerson, `%${responsiblePerson}%`));

  const clients = await db
    .select()
    .from(clientsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(clientsTable.name);

  const balances = await getClientBalances(clients.map((c) => c.id));
  const buffer = await buildClientsWorkbook(
    clients.map((c) => ({ ...c, balance: balances.get(c.id) ?? 0 })),
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="klientlar.xlsx"',
  );
  res.send(Buffer.from(buffer));
});

router.get(
  "/export/transactions",
  requireAuth,
  async (req, res): Promise<void> => {
    const query = ExportTransactionsQueryParams.safeParse(req.query);
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
      conditions.push(
        ilike(transactionsTable.responsiblePerson, `%${responsiblePerson}%`),
      );
    if (dateFrom)
      conditions.push(gte(transactionsTable.date, dateFrom.toISOString().slice(0, 10)));
    if (dateTo)
      conditions.push(lte(transactionsTable.date, dateTo.toISOString().slice(0, 10)));

    const rows = await db
      .select({
        id: transactionsTable.id,
        clientName: clientsTable.name,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        date: transactionsTable.date,
        paymentType: transactionsTable.paymentType,
        responsiblePerson: transactionsTable.responsiblePerson,
        comment: transactionsTable.comment,
      })
      .from(transactionsTable)
      .innerJoin(clientsTable, eq(transactionsTable.clientId, clientsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(transactionsTable.date, transactionsTable.id);

    const buffer = await buildTransactionsWorkbook(
      rows.map((r) => ({ ...r, amount: Number(r.amount) })),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="operatsiyalar.xlsx"',
    );
    res.send(Buffer.from(buffer));
  },
);

router.get(
  "/export/akt-sverka/excel",
  requireAuth,
  async (req, res): Promise<void> => {
    const query = ExportAktSverkaExcelQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const result = await getAktSverka(
      query.data.clientId,
      query.data.from.toISOString().slice(0, 10),
      query.data.to.toISOString().slice(0, 10),
    );
    if (!result) {
      res.status(404).json({ error: "Klient topilmadi" });
      return;
    }

    const buffer = await buildAktSverkaWorkbook(result);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="akt-sverka-${result.clientName}.xlsx"`,
    );
    res.send(Buffer.from(buffer));
  },
);

router.get(
  "/export/akt-sverka/pdf",
  requireAuth,
  async (req, res): Promise<void> => {
    const query = ExportAktSverkaPdfQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const result = await getAktSverka(
      query.data.clientId,
      query.data.from.toISOString().slice(0, 10),
      query.data.to.toISOString().slice(0, 10),
    );
    if (!result) {
      res.status(404).json({ error: "Klient topilmadi" });
      return;
    }

    const buffer = await buildAktSverkaPdf(result);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="akt-sverka-${result.clientName}.pdf"`,
    );
    res.send(buffer);
  },
);

export default router;
