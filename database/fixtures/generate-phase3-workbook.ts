import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";

const workbook = new ExcelJS.Workbook();
workbook.creator = "Planora certification fixture";
workbook.created = new Date("2026-08-31T00:00:00.000Z");

const pnl = workbook.addWorksheet("P&L");
pnl.addRow(["GL_ACCT", "COST_CENTER", "MONTH", "ACTUAL", "FCST"]);
const rows = [
  ["Revenue", "NA-IND", "P01", 67_000_000, 70_000_000], ["Revenue", "NA-SVC", "P01", 29_000_000, 30_000_000],
  ["Revenue", "EU-IND", "P01", 25_000_000, 25_000_000], ["Revenue", "EU-SVC", "P01", 24_000_000, 25_000_000],
  ["COGS", "NA-IND", "P01", 21_000_000, 20_000_000], ["COGS", "NA-SVC", "P01", 10_000_000, 10_000_000],
  ["COGS", "EU-IND", "P01", 5_000_000, 5_000_000], ["COGS", "EU-SVC", "P01", 5_000_000, 5_000_000],
  ["Operating Expense", "NA-IND", "P01", 11_000_000, 10_000_000], ["Operating Expense", "NA-SVC", "P01", 5_000_000, 5_000_000],
  ["Operating Expense", "EU-IND", "P01", 4_000_000, 4_000_000], ["Shared Programs", "EU-SVC", "P01", 5_000_000, 4_000_000],
];
rows.forEach((row) => pnl.addRow(row));
pnl.getRow(1).font = { bold: true }; pnl.columns.forEach((column) => { column.width = 18; });

const revenue = workbook.addWorksheet("Revenue");
revenue.addRow(["Product", "Region", "Jan", "Feb", "Q1 Run Rate"]); revenue.addRow(["Industrial", "North America", 70_000_000, 72_000_000, { formula: "SUM(C2:D2)", result: 142_000_000 }]); revenue.addRow(["Services", "Europe", 25_000_000, 26_000_000, { formula: "SUM(C3:D3)", result: 51_000_000 }]);
const headcount = workbook.addWorksheet("Headcount"); headcount.addRow(["Dept", "Period", "Amount"]); headcount.addRow(["Corporate", "P01", 420]);
const opex = workbook.addWorksheet("Opex"); opex.addRow(["GL Account", "Dept", "Jan", "Feb"]); opex.addRow(["Operating Expense", "Corporate", 23_000_000, { formula: "C2*1.02", result: 23_460_000 }]);
const assumptions = workbook.addWorksheet("Assumptions"); assumptions.addRow(["Assumption", "Value", "Unit"]); assumptions.addRow(["Price growth", 0.03, "Percent"]); assumptions.addRow(["Hiring growth", 0.02, "Percent"]);

await mkdir("tests/fixtures", { recursive: true });
await workbook.xlsx.writeFile("tests/fixtures/FY26_Forecast.xlsx");
workbook.getWorksheet("P&L")!.getCell("E2").value = 70_500_000;
await workbook.xlsx.writeFile("tests/fixtures/FY26_Forecast_Revision.xlsx");
const csv = [pnl.getRow(1).values, ...rows.map((row) => [undefined, ...row])].map((row) => (row as unknown[]).slice(1).join(",")).join("\n");
await import("node:fs/promises").then(({ writeFile }) => writeFile("tests/fixtures/FY26_Forecast.csv", csv));
