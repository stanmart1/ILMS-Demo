/**
 * report-engine.ts
 * Pure-TypeScript report computation layer.
 * All compute functions derive results directly from mock-data arrays.
 * No UI dependencies — importable from any component or test.
 */

import {
  checkouts, patrons, fines, budgets, purchaseOrders, bibRecords,
  subscriptions, serialIssues, invoices,
} from "@/lib/mock-data";

// ─── Core types ───────────────────────────────────────────────────────────────

export type ReportModule =
  | "Circulation"
  | "Patrons"
  | "Acquisitions"
  | "Serials"
  | "Catalog";

export type ChartType =
  | "bar"
  | "horizontal-bar"
  | "area"
  | "line"
  | "pie"
  | "table";

export type ColumnType = "string" | "number" | "currency" | "percent" | "date" | "badge";

export type ReportColumn = {
  key: string;
  label: string;
  type: ColumnType;
};

export type SummaryStat = {
  label: string;
  value: string | number;
  accent?: "default" | "success" | "warning" | "destructive";
};

export type ChartBar = {
  key: string;
  label: string;
  color: string; // CSS var string, e.g. "var(--color-chart-1)"
};

export type ChartConfig = {
  /** The key in chartData used for the category axis (x-axis or pie name) */
  xKey: string;
  /** For bar / area / line: which data keys to render as series */
  bars?: ChartBar[];
  /** For pie: the numeric value key */
  pieValueKey?: string;
};

export type ReportResult = {
  rows: Record<string, unknown>[];
  columns: ReportColumn[];
  summaryStats: SummaryStat[];
  chartData: Record<string, unknown>[];
  chartConfig: ChartConfig;
};

export type ReportDefinition = {
  id: string;
  name: string;
  module: ReportModule;
  description: string;
  chartType: ChartType;
  /** Compute derives real results from mock-data. dateFrom/dateTo are ISO date strings. */
  compute: (dateFrom?: string, dateTo?: string) => ReportResult;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$$(n: number) {
  return `₦${n.toFixed(2)}`;
}

function pct(num: number, denom: number) {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 1000) / 10; // 1 decimal
}

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

// ─── 14 pre-built report compute functions ────────────────────────────────────

// 1. Items currently on loan
function computeOnLoan(): ReportResult {
  const active = checkouts.filter((c) => c.status !== "Returned");
  const overdue = active.filter((c) => c.status === "Overdue").length;
  const onLoan = active.filter((c) => c.status === "On loan").length;

  const statusGroups = countBy(active, (c) => c.status);
  const chartData = Object.entries(statusGroups).map(([status, count]) => ({ status, count }));

  return {
    rows: active.map((c) => ({ ...c })),
    columns: [
      { key: "patron", label: "Patron", type: "string" },
      { key: "cardNumber", label: "Card no.", type: "string" },
      { key: "title", label: "Title", type: "string" },
      { key: "barcode", label: "Barcode", type: "string" },
      { key: "checkedOut", label: "Checked out", type: "date" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "status", label: "Status", type: "badge" },
      { key: "renewals", label: "Renewals", type: "number" },
    ],
    summaryStats: [
      { label: "Total on loan", value: active.length },
      { label: "Overdue", value: overdue, accent: overdue > 0 ? "destructive" : "success" },
      { label: "On loan", value: onLoan, accent: "default" },
    ],
    chartData,
    chartConfig: {
      xKey: "status",
      bars: [{ key: "count", label: "Items", color: "var(--color-chart-1)" }],
    },
  };
}

// 2. Overdue items
function computeOverdue(): ReportResult {
  const rows = checkouts.filter((c) => c.status === "Overdue");
  const today = new Date();
  const totalDaysOverdue = rows.reduce((sum, c) => {
    const diff = Math.floor((today.getTime() - new Date(c.dueDate).getTime()) / 86400000);
    return sum + Math.max(0, diff);
  }, 0);

  const byPatron = countBy(rows, (c) => c.patron);
  const chartData = Object.entries(byPatron).map(([patron, count]) => ({ patron, count }));

  return {
    rows: rows.map((c) => {
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - new Date(c.dueDate).getTime()) / 86400000));
      return { ...c, daysOverdue };
    }),
    columns: [
      { key: "patron", label: "Patron", type: "string" },
      { key: "cardNumber", label: "Card no.", type: "string" },
      { key: "title", label: "Title", type: "string" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "daysOverdue", label: "Days overdue", type: "number" },
      { key: "renewals", label: "Renewals used", type: "number" },
    ],
    summaryStats: [
      { label: "Overdue items", value: rows.length, accent: rows.length > 0 ? "destructive" : "success" },
      { label: "Total overdue days", value: totalDaysOverdue, accent: "warning" },
      { label: "Avg days overdue", value: rows.length ? Math.round(totalDaysOverdue / rows.length) : 0 },
    ],
    chartData,
    chartConfig: {
      xKey: "patron",
      bars: [{ key: "count", label: "Items overdue", color: "var(--color-chart-4)" }],
    },
  };
}

// 3. Most active borrowers
function computeMostActiveBorrowers(): ReportResult {
  const all = checkouts.filter((c) => c.status !== "Returned");
  const byCard: Record<string, { patron: string; cardNumber: string; total: number; active: number; overdue: number }> = {};

  checkouts.forEach((c) => {
    if (!byCard[c.cardNumber]) {
      byCard[c.cardNumber] = { patron: c.patron, cardNumber: c.cardNumber, total: 0, active: 0, overdue: 0 };
    }
    byCard[c.cardNumber].total++;
    if (c.status !== "Returned") byCard[c.cardNumber].active++;
    if (c.status === "Overdue") byCard[c.cardNumber].overdue++;
  });

  const rows = Object.values(byCard).sort((a, b) => b.total - a.total);
  const chartData = rows.slice(0, 8).map((r) => ({ patron: r.patron.split(" ")[0], totalCheckouts: r.total }));

  return {
    rows,
    columns: [
      { key: "patron", label: "Patron", type: "string" },
      { key: "cardNumber", label: "Card no.", type: "string" },
      { key: "total", label: "Total checkouts", type: "number" },
      { key: "active", label: "Active loans", type: "number" },
      { key: "overdue", label: "Overdue", type: "number" },
    ],
    summaryStats: [
      { label: "Unique borrowers", value: rows.length },
      { label: "Total checkouts", value: checkouts.length },
      { label: "Avg per borrower", value: rows.length ? (checkouts.length / rows.length).toFixed(1) : 0 },
    ],
    chartData,
    chartConfig: {
      xKey: "patron",
      bars: [{ key: "totalCheckouts", label: "Total checkouts", color: "var(--color-chart-2)" }],
    },
  };
}

// 4. Renewal utilisation
function computeRenewalUtilisation(): ReportResult {
  const counts = countBy(checkouts, (c) => String(c.renewals));
  const total = checkouts.length;
  const rows = Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([renewals, count]) => ({
      renewals: Number(renewals),
      count,
      pct: pct(count, total),
    }));

  const renewed = checkouts.filter((c) => c.renewals > 0).length;

  return {
    rows,
    columns: [
      { key: "renewals", label: "Renewals used", type: "number" },
      { key: "count", label: "Items", type: "number" },
      { key: "pct", label: "% of total", type: "percent" },
    ],
    summaryStats: [
      { label: "Total checkouts", value: total },
      { label: "Renewed at least once", value: renewed, accent: "default" },
      { label: "Renewal rate", value: `${pct(renewed, total)}%`, accent: "success" },
    ],
    chartData: rows,
    chartConfig: {
      xKey: "renewals",
      bars: [{ key: "count", label: "Items", color: "var(--color-chart-3)" }],
    },
  };
}

// 5. Patron status breakdown
function computePatronStatus(): ReportResult {
  const groups = countBy(patrons, (p) => p.status);
  const total = patrons.length;
  const rows = Object.entries(groups).map(([status, count]) => ({
    status,
    count,
    pct: pct(count, total),
  }));

  return {
    rows,
    columns: [
      { key: "status", label: "Status", type: "badge" },
      { key: "count", label: "Patrons", type: "number" },
      { key: "pct", label: "% of total", type: "percent" },
    ],
    summaryStats: [
      { label: "Total patrons", value: total },
      { label: "Active", value: groups["Active"] ?? 0, accent: "success" },
      { label: "Suspended", value: groups["Suspended"] ?? 0, accent: "destructive" },
      { label: "Expired", value: groups["Expired"] ?? 0, accent: "warning" },
    ],
    chartData: rows.map((r) => ({ name: r.status, value: r.count })),
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 6. Outstanding fines by patron
function computeOutstandingFines(): ReportResult {
  const unpaid = fines.filter((f) => !f.paid);
  const byPatron: Record<string, { patronName: string; cardNumber: string; count: number; totalOwed: number }> = {};

  unpaid.forEach((f) => {
    if (!byPatron[f.patronId]) {
      byPatron[f.patronId] = { patronName: f.patronName, cardNumber: f.cardNumber, count: 0, totalOwed: 0 };
    }
    byPatron[f.patronId].count++;
    byPatron[f.patronId].totalOwed += f.amount;
  });

  const rows = Object.values(byPatron).sort((a, b) => b.totalOwed - a.totalOwed);
  const totalOwed = rows.reduce((s, r) => s + r.totalOwed, 0);
  const chartData = rows.map((r) => ({ patron: r.patronName.split(" ")[0], totalOwed: r.totalOwed }));

  return {
    rows: rows.map((r) => ({ ...r, totalOwed: r.totalOwed })),
    columns: [
      { key: "patronName", label: "Patron", type: "string" },
      { key: "cardNumber", label: "Card no.", type: "string" },
      { key: "count", label: "Fine items", type: "number" },
      { key: "totalOwed", label: "Amount owed", type: "currency" },
    ],
    summaryStats: [
      { label: "Patrons with fines", value: rows.length, accent: rows.length > 0 ? "warning" : "success" },
      { label: "Total outstanding", value: fmt$$(totalOwed), accent: "destructive" },
      { label: "Avg per patron", value: rows.length ? fmt$$(totalOwed / rows.length) : "₦0.00" },
    ],
    chartData,
    chartConfig: {
      xKey: "patron",
      bars: [{ key: "totalOwed", label: "Amount owed", color: "var(--color-chart-4)" }],
    },
  };
}

// 7. Patron category distribution
function computePatronCategories(): ReportResult {
  const groups = countBy(patrons, (p) => p.category);
  const total = patrons.length;
  const rows = Object.entries(groups).map(([category, count]) => ({
    category,
    count,
    pct: pct(count, total),
  }));

  return {
    rows,
    columns: [
      { key: "category", label: "Category", type: "badge" },
      { key: "count", label: "Patrons", type: "number" },
      { key: "pct", label: "% of total", type: "percent" },
    ],
    summaryStats: [
      { label: "Total patrons", value: total },
      { label: "Categories", value: rows.length },
    ],
    chartData: rows.map((r) => ({ name: r.category, value: r.count })),
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 8. Budget utilisation by fund
function computeBudgetUtilisation(): ReportResult {
  const rows = budgets.map((b) => ({
    fund: b.fund,
    allocated: b.allocated,
    spent: b.spent,
    encumbered: b.encumbered,
    remaining: b.allocated - b.spent - b.encumbered,
    utilPct: pct(b.spent, b.allocated),
  }));

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return {
    rows,
    columns: [
      { key: "fund", label: "Fund", type: "string" },
      { key: "allocated", label: "Allocated", type: "currency" },
      { key: "spent", label: "Spent", type: "currency" },
      { key: "encumbered", label: "Encumbered", type: "currency" },
      { key: "remaining", label: "Remaining", type: "currency" },
      { key: "utilPct", label: "Utilisation %", type: "percent" },
    ],
    summaryStats: [
      { label: "Total allocated", value: fmt$$(totalAllocated) },
      { label: "Total spent", value: fmt$$(totalSpent), accent: "warning" },
      { label: "Overall utilisation", value: `${pct(totalSpent, totalAllocated)}%` },
      { label: "Funds tracked", value: budgets.length },
    ],
    chartData: rows.map((r) => ({ fund: r.fund.split(" ")[0], allocated: r.allocated, spent: r.spent })),
    chartConfig: {
      xKey: "fund",
      bars: [
        { key: "allocated", label: "Allocated", color: "var(--color-chart-2)" },
        { key: "spent", label: "Spent", color: "var(--color-chart-4)" },
      ],
    },
  };
}

// 9. Pending & approved invoices
function computePendingInvoices(): ReportResult {
  const rows = invoices.filter((i) => i.status === "Pending" || i.status === "Approved" || i.status === "Disputed");
  const totalPending = rows.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
  const totalApproved = rows.filter((i) => i.status === "Approved").reduce((s, i) => s + i.amount, 0);
  const byStatus = countBy(rows, (i) => i.status);
  const chartData = Object.entries(byStatus).map(([status, count]) => ({ name: status, value: count }));

  return {
    rows,
    columns: [
      { key: "id", label: "Invoice ID", type: "string" },
      { key: "poId", label: "PO #", type: "string" },
      { key: "vendor", label: "Vendor", type: "string" },
      { key: "fund", label: "Fund", type: "string" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "invoiceDate", label: "Invoice date", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    summaryStats: [
      { label: "Open invoices", value: rows.length, accent: "warning" },
      { label: "Pending total", value: fmt$$(totalPending), accent: "warning" },
      { label: "Approved total", value: fmt$$(totalApproved), accent: "default" },
    ],
    chartData,
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 10. Purchase order status summary
function computePOStatus(): ReportResult {
  const groups: Record<string, { status: string; count: number; totalValue: number }> = {};
  purchaseOrders.forEach((po) => {
    if (!groups[po.status]) groups[po.status] = { status: po.status, count: 0, totalValue: 0 };
    groups[po.status].count++;
    groups[po.status].totalValue += po.total;
  });

  const rows = Object.values(groups).sort((a, b) => b.count - a.count);
  const total = purchaseOrders.length;
  const totalValue = purchaseOrders.reduce((s, po) => s + po.total, 0);

  return {
    rows,
    columns: [
      { key: "status", label: "Status", type: "badge" },
      { key: "count", label: "Orders", type: "number" },
      { key: "totalValue", label: "Total value", type: "currency" },
    ],
    summaryStats: [
      { label: "Total orders", value: total },
      { label: "Total value", value: fmt$$(totalValue) },
      { label: "Draft orders", value: groups["Draft"]?.count ?? 0, accent: "warning" },
      { label: "Submitted", value: groups["Submitted"]?.count ?? 0, accent: "default" },
    ],
    chartData: rows.map((r) => ({ name: r.status, value: r.count })),
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 11. Lapsed / renewing subscriptions
function computeLapsedSubscriptions(): ReportResult {
  const rows = subscriptions.filter((s) => s.status !== "Active");
  const lapsed = rows.filter((s) => s.status === "Lapsed").length;
  const renewing = rows.filter((s) => s.status === "Renewing").length;
  const byStatus = countBy(rows, (s) => s.status);
  const chartData = Object.entries(byStatus).map(([status, count]) => ({ name: status, value: count }));

  return {
    rows,
    columns: [
      { key: "title", label: "Title", type: "string" },
      { key: "issn", label: "ISSN", type: "string" },
      { key: "vendor", label: "Vendor", type: "string" },
      { key: "frequency", label: "Frequency", type: "string" },
      { key: "status", label: "Status", type: "badge" },
      { key: "lastReceived", label: "Last received", type: "date" },
    ],
    summaryStats: [
      { label: "Non-active subscriptions", value: rows.length, accent: rows.length > 0 ? "warning" : "success" },
      { label: "Lapsed", value: lapsed, accent: "destructive" },
      { label: "Renewing", value: renewing, accent: "warning" },
    ],
    chartData,
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 12. Serial claims summary
function computeSerialClaims(): ReportResult {
  const rows = serialIssues.filter((i) => i.status === "Late" || i.status === "Claimed");
  const late = rows.filter((i) => i.status === "Late").length;
  const claimed = rows.filter((i) => i.status === "Claimed").length;
  const today = new Date();
  const byStatus = countBy(rows, (i) => i.status);
  const chartData = Object.entries(byStatus).map(([status, count]) => ({ name: status, value: count }));

  return {
    rows: rows.map((i) => ({
      ...i,
      daysLate: Math.max(0, Math.floor((today.getTime() - new Date(i.expected).getTime()) / 86400000)),
    })),
    columns: [
      { key: "title", label: "Title", type: "string" },
      { key: "issue", label: "Issue", type: "string" },
      { key: "expected", label: "Expected", type: "date" },
      { key: "daysLate", label: "Days late", type: "number" },
      { key: "status", label: "Status", type: "badge" },
    ],
    summaryStats: [
      { label: "Issues requiring action", value: rows.length, accent: rows.length > 0 ? "destructive" : "success" },
      { label: "Late (unclaimed)", value: late, accent: "destructive" },
      { label: "Claim sent", value: claimed, accent: "warning" },
    ],
    chartData,
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 13. Collection by format
function computeCollectionByFormat(): ReportResult {
  const groups: Record<string, { format: string; titles: number; totalCopies: number; available: number }> = {};
  bibRecords.forEach((b) => {
    if (!groups[b.format]) groups[b.format] = { format: b.format, titles: 0, totalCopies: 0, available: 0 };
    groups[b.format].titles++;
    groups[b.format].totalCopies += b.copies;
    groups[b.format].available += b.available;
  });

  const rows = Object.values(groups);
  const totalTitles = bibRecords.length;
  const totalCopies = bibRecords.reduce((s, b) => s + b.copies, 0);

  return {
    rows,
    columns: [
      { key: "format", label: "Format", type: "badge" },
      { key: "titles", label: "Titles", type: "number" },
      { key: "totalCopies", label: "Copies", type: "number" },
      { key: "available", label: "Available", type: "number" },
    ],
    summaryStats: [
      { label: "Total titles", value: totalTitles },
      { label: "Total copies", value: totalCopies },
      { label: "Formats catalogued", value: rows.length },
    ],
    chartData: rows.map((r) => ({ name: r.format, value: r.titles })),
    chartConfig: { xKey: "name", pieValueKey: "value" },
  };
}

// 14. Item availability ratio
function computeAvailability(): ReportResult {
  const rows = bibRecords.map((b) => ({
    title: b.title,
    author: b.author,
    callNumber: b.callNumber,
    format: b.format,
    copies: b.copies,
    available: b.available,
    onLoan: b.copies - b.available,
    availPct: pct(b.available, b.copies),
  }));

  const totalCopies = bibRecords.reduce((s, b) => s + b.copies, 0);
  const totalAvailable = bibRecords.reduce((s, b) => s + b.available, 0);

  return {
    rows,
    columns: [
      { key: "title", label: "Title", type: "string" },
      { key: "author", label: "Author", type: "string" },
      { key: "format", label: "Format", type: "badge" },
      { key: "copies", label: "Copies", type: "number" },
      { key: "available", label: "Available", type: "number" },
      { key: "onLoan", label: "On loan", type: "number" },
      { key: "availPct", label: "Availability %", type: "percent" },
    ],
    summaryStats: [
      { label: "Total titles", value: bibRecords.length },
      { label: "Total copies", value: totalCopies },
      { label: "Available now", value: totalAvailable, accent: "success" },
      { label: "Overall availability", value: `${pct(totalAvailable, totalCopies)}%`, accent: "success" },
    ],
    chartData: rows.map((r) => ({ title: r.title.split(":")[0].slice(0, 20), available: r.available, onLoan: r.onLoan })),
    chartConfig: {
      xKey: "title",
      bars: [
        { key: "available", label: "Available", color: "var(--color-chart-3)" },
        { key: "onLoan", label: "On loan", color: "var(--color-chart-4)" },
      ],
    },
  };
}

// ─── Report library ────────────────────────────────────────────────────────────

export const REPORT_LIBRARY: ReportDefinition[] = [
  {
    id: "on-loan",
    name: "Items currently on loan",
    module: "Circulation",
    description: "All active checkouts (on loan + overdue), grouped by status.",
    chartType: "bar",
    compute: computeOnLoan,
  },
  {
    id: "overdue",
    name: "Overdue items",
    module: "Circulation",
    description: "Checkouts past their due date with days-overdue calculation.",
    chartType: "bar",
    compute: computeOverdue,
  },
  {
    id: "active-borrowers",
    name: "Most active borrowers",
    module: "Circulation",
    description: "Patrons ranked by total checkout count, including active and overdue loans.",
    chartType: "horizontal-bar",
    compute: computeMostActiveBorrowers,
  },
  {
    id: "renewals",
    name: "Renewal utilisation",
    module: "Circulation",
    description: "Distribution of how many renewals patrons have used per checkout.",
    chartType: "bar",
    compute: computeRenewalUtilisation,
  },
  {
    id: "patron-status",
    name: "Patron status breakdown",
    module: "Patrons",
    description: "Count of active, suspended, and expired patrons.",
    chartType: "pie",
    compute: computePatronStatus,
  },
  {
    id: "outstanding-fines",
    name: "Outstanding fines by patron",
    module: "Patrons",
    description: "Patrons with unpaid fines ranked by total amount owed.",
    chartType: "horizontal-bar",
    compute: computeOutstandingFines,
  },
  {
    id: "patron-categories",
    name: "Patron category distribution",
    module: "Patrons",
    description: "Breakdown of the patron register by borrower category.",
    chartType: "pie",
    compute: computePatronCategories,
  },
  {
    id: "budget-utilisation",
    name: "Budget utilisation by fund",
    module: "Acquisitions",
    description: "Allocated vs spent vs encumbered amounts for every acquisitions fund.",
    chartType: "bar",
    compute: computeBudgetUtilisation,
  },
  {
    id: "pending-invoices",
    name: "Pending & approved invoices",
    module: "Acquisitions",
    description: "Open invoices that still require approval, payment, or dispute resolution.",
    chartType: "pie",
    compute: computePendingInvoices,
  },
  {
    id: "po-status",
    name: "Purchase order status",
    module: "Acquisitions",
    description: "Count and total value of POs grouped by workflow status.",
    chartType: "pie",
    compute: computePOStatus,
  },
  {
    id: "lapsed-subs",
    name: "Lapsed & renewing subscriptions",
    module: "Serials",
    description: "Serial subscriptions that are no longer active and need attention.",
    chartType: "pie",
    compute: computeLapsedSubscriptions,
  },
  {
    id: "serial-claims",
    name: "Serial claims summary",
    module: "Serials",
    description: "Issues that are late or have had a claim letter sent to the vendor.",
    chartType: "pie",
    compute: computeSerialClaims,
  },
  {
    id: "collection-format",
    name: "Collection by format",
    module: "Catalog",
    description: "Distribution of the catalog across MARC21, UNIMARC, and other formats.",
    chartType: "pie",
    compute: computeCollectionByFormat,
  },
  {
    id: "availability",
    name: "Item availability ratio",
    module: "Catalog",
    description: "Available vs on-loan copies per title — highlights high-demand items.",
    chartType: "bar",
    compute: computeAvailability,
  },
];

// ─── CSV export ────────────────────────────────────────────────────────────────

export function toCSV(result: ReportResult): string {
  const header = result.columns.map((c) => `"${c.label}"`).join(",");
  const rowLines = result.rows.map((row) =>
    result.columns
      .map((col) => {
        const val = row[col.key];
        if (val == null) return "";
        if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(",")
  );
  return [header, ...rowLines].join("\n");
}

// ─── Analytics helpers (used by the analytics tab) ───────────────────────────

/** Monthly circulation aggregated from checkouts (uses checkedOut date) */
export function getCirculationByMonth() {
  const months: Record<string, { month: string; checkouts: number; overdue: number }> = {};
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  checkouts.forEach((c) => {
    const d = new Date(c.checkedOut);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${labels[d.getMonth()]} ${d.getFullYear()}`;
    if (!months[key]) months[key] = { month: labels[d.getMonth()], checkouts: 0, overdue: 0 };
    months[key].checkouts++;
    if (c.status === "Overdue") months[key].overdue++;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

/** Top N most-checked-out titles derived from checkouts */
export function getTopTitles(n = 5) {
  const counts = countBy(checkouts, (c) => c.title);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([title, checkouts]) => ({ title: title.slice(0, 22), checkouts }));
}

/** Fines assessed vs collected per patron category (proxy: assessed = all, collected = paid) */
export function getFinesByType() {
  const groups: Record<string, { type: string; assessed: number; collected: number }> = {};
  fines.forEach((f) => {
    if (!groups[f.type]) groups[f.type] = { type: f.type, assessed: 0, collected: 0 };
    groups[f.type].assessed += f.amount;
    if (f.paid) groups[f.type].collected += f.amount;
  });
  return Object.values(groups);
}
