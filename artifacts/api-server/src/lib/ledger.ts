import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, clientsTable, transactionsTable } from "@workspace/db";

/**
 * Domain convention: for a given client,
 *   balance = sum(expense amounts) - sum(income amounts)
 * "expense" (chiqim) = business gave goods/money to the client -> client owes more (receivable up)
 * "income" (kirim) = client paid back -> client owes less (receivable down)
 *
 * Positive balance  => haqdorlik (client owes the business, receivable)
 * Negative balance  => qarzdorlik (business owes the client, payable)
 */

const BALANCE_EXPR = sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE -${transactionsTable.amount} END), 0)`;

export async function getClientBalances(
  clientIds?: number[],
): Promise<Map<number, number>> {
  const rows = await db
    .select({
      clientId: transactionsTable.clientId,
      balance: BALANCE_EXPR,
    })
    .from(transactionsTable)
    .where(
      clientIds && clientIds.length > 0
        ? inArray(transactionsTable.clientId, clientIds)
        : undefined,
    )
    .groupBy(transactionsTable.clientId);

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.clientId, Number(row.balance));
  }
  return map;
}

export async function getClientBalance(clientId: number): Promise<number> {
  const [row] = await db
    .select({ balance: BALANCE_EXPR })
    .from(transactionsTable)
    .where(eq(transactionsTable.clientId, clientId));
  return Number(row?.balance ?? 0);
}

export async function getDashboardSummary(): Promise<{
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
  cashFlow: { date: string; income: number; expense: number }[];
}> {
  const balances = await getClientBalances();
  let totalReceivable = 0;
  let totalPayable = 0;
  for (const balance of balances.values()) {
    if (balance > 0) totalReceivable += balance;
    else totalPayable += -balance;
  }

  const since = new Date();
  since.setDate(since.getDate() - 29);
  const sinceStr = since.toISOString().slice(0, 10);

  const cashFlowRows = await db
    .select({
      date: transactionsTable.date,
      income: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
    })
    .from(transactionsTable)
    .where(gte(transactionsTable.date, sinceStr))
    .groupBy(transactionsTable.date)
    .orderBy(asc(transactionsTable.date));

  const byDate = new Map(
    cashFlowRows.map((r) => [
      r.date,
      { income: Number(r.income), expense: Number(r.expense) },
    ]),
  );

  const cashFlow: { date: string; income: number; expense: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr) ?? { income: 0, expense: 0 };
    cashFlow.push({ date: dateStr, income: entry.income, expense: entry.expense });
  }

  return {
    totalReceivable,
    totalPayable,
    netBalance: totalReceivable - totalPayable,
    cashFlow,
  };
}

export interface AktSverkaRowData {
  date: string;
  comment: string | null;
  responsiblePerson: string;
  paymentType: "cash" | "card" | "transfer";
  debit: number;
  credit: number;
  balance: number;
}

export async function getAktSverka(
  clientId: number,
  from: string,
  to: string,
): Promise<{
  clientId: number;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  rows: AktSverkaRowData[];
} | null> {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId));
  if (!client) return null;

  const [openingRow] = await db
    .select({ balance: BALANCE_EXPR })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.clientId, clientId),
        sql`${transactionsTable.date} < ${from}`,
      ),
    );
  const openingBalance = Number(openingRow?.balance ?? 0);

  const periodTransactions = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.clientId, clientId),
        gte(transactionsTable.date, from),
        lte(transactionsTable.date, to),
      ),
    )
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));

  let runningBalance = openingBalance;
  const rows: AktSverkaRowData[] = periodTransactions.map((t) => {
    const amount = Number(t.amount);
    const debit = t.type === "expense" ? amount : 0;
    const credit = t.type === "income" ? amount : 0;
    runningBalance += debit - credit;
    return {
      date: t.date,
      comment: t.comment,
      responsiblePerson: t.responsiblePerson,
      paymentType: t.paymentType,
      debit,
      credit,
      balance: runningBalance,
    };
  });

  return {
    clientId: client.id,
    clientName: client.name,
    periodStart: from,
    periodEnd: to,
    openingBalance,
    closingBalance: runningBalance,
    rows,
  };
}
