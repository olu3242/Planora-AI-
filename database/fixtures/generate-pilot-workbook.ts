import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";

const workbook = new ExcelJS.Workbook();
workbook.creator = "Planora synthetic pilot fixture";
workbook.created = new Date("2026-08-31T00:00:00.000Z");

const forecast = workbook.addWorksheet("Forecast");
forecast.addRow(["PERIOD", "GL_ACCOUNT", "COST_CENTER", "ACTUAL", "PRIOR_FORECAST", "CURRENT_FORECAST"]);
const rows = [
  ["P01", "Revenue", "NA-IND", 67_000_000, 70_000_000, 70_500_000], ["P01", "Revenue", "NA-SVC", 29_000_000, 30_000_000, 30_000_000],
  ["P01", "Revenue", "EU-IND", 25_000_000, 25_000_000, 25_000_000], ["P01", "Revenue", "EU-SVC", 24_000_000, 25_000_000, 25_000_000],
  ["P01", "COGS", "NA-IND", 21_000_000, 20_000_000, 20_000_000], ["P01", "COGS", "NA-SVC", 10_000_000, 10_000_000, 10_000_000],
  ["P01", "COGS", "EU-IND", 5_000_000, 5_000_000, 5_000_000], ["P01", "COGS", "EU-SVC", 5_000_000, 5_000_000, 5_000_000],
  ["P01", "Operating Expense", "NA-IND", 11_000_000, 10_000_000, 10_000_000], ["P01", "Operating Expense", "NA-SVC", 5_000_000, 5_000_000, 5_000_000],
  ["P01", "Operating Expense", "EU-IND", 4_000_000, 4_000_000, 4_000_000], ["P01", "Shared Programs", "EU-SVC", 5_000_000, 4_000_000, 4_000_000],
];
rows.forEach((row) => forecast.addRow(row));
forecast.getRow(1).font = { bold: true }; forecast.views = [{ state: "frozen", ySplit: 1 }]; forecast.autoFilter = "A1:F13"; forecast.columns.forEach((column) => { column.width = 20; });

const expenseDetail = workbook.addWorksheet("Expense Detail");
expenseDetail.addRow(["PERIOD", "CATEGORY", "DEPARTMENT", "CURRENT_FORECAST"]);
[["P01", "Payroll and people expense", "Corporate", 14_000_000], ["P01", "Software and services", "Corporate", 4_000_000], ["P01", "Travel", "Commercial", 2_000_000], ["P01", "Facilities and operating expense", "Operations", 3_000_000]].forEach((row) => expenseDetail.addRow(row));
expenseDetail.getRow(1).font = { bold: true }; expenseDetail.columns.forEach((column) => { column.width = 30; });

const instructions = workbook.addWorksheet("Read Me");
instructions.addRows([["Planora synthetic FP&A pilot workbook"], ["Use the Forecast sheet for upload and mapping."], ["Shared Programs intentionally requires a human mapping decision."], ["All values and organization labels are synthetic."]]);

await mkdir("tests/fixtures", { recursive: true });
await workbook.xlsx.writeFile("tests/fixtures/Planora_Pilot_Monthly_Forecast.xlsx");
