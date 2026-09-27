/**
 * Renders the fake sample bills in lib/samples.ts to PNGs in public/samples/.
 * Usage: npm run samples   (set CHROME_PATH if Chrome/Edge isn't at the default location)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SAMPLE_BILLS, type SampleBill } from "../lib/samples";

const BROWSER =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome");

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const usDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

function billHtml({ bill }: SampleBill) {
  const rows = bill.lineItems
    .map(
      (item) => `<tr>
        <td>${usDate(item.dateOfService)}</td><td>${item.code}</td><td>${item.description}</td>
        <td class="num">${item.quantity}</td><td class="num">${money(item.charge)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; font: 14px/1.4 Arial, sans-serif; color: #1f2937; background: #fff; }
    .page { width: 760px; padding: 40px; }
    header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; }
    h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .muted { color: #6b7280; font-size: 12px; }
    .sample { background: #fef3c7; color: #92400e; font-size: 11px; font-weight: bold; padding: 4px 8px; display: inline-block; margin-top: 8px; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
    .meta div { background: #f3f4f6; padding: 8px 10px; }
    .meta b { display: block; font-size: 11px; color: #6b7280; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: #fff; text-align: left; padding: 8px; font-size: 12px; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .num { text-align: right; }
    .totals { margin-left: auto; width: 300px; margin-top: 16px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .due { border-top: 2px solid #1e3a5f; font-weight: bold; font-size: 16px; margin-top: 4px; padding-top: 8px !important; }
  </style></head><body><div class="page">
    <header>
      <div><h1>${bill.provider}</h1><div class="muted">100 Example Ave · Columbia, MO 65201 · (555) 010-0199</div>
        <div class="sample">SAMPLE — FICTIONAL BILL FOR DEMO PURPOSES</div></div>
      <div class="muted" style="text-align:right">PATIENT STATEMENT<br>Statement date: ${usDate(bill.dateOfService.replace(/-\d\d$/, "-28"))}</div>
    </header>
    <div class="meta">
      <div><b>Account number</b>${bill.patientRef}</div>
      <div><b>Patient</b>Alex Example</div>
      <div><b>Date of service</b>${usDate(bill.dateOfService)}</div>
    </div>
    <table><thead><tr><th>Date</th><th>Code</th><th>Description</th><th class="num">Qty</th><th class="num">Charges</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="totals">
      <div><span>Total charges</span><span>${money(bill.totalBilled)}</span></div>
      <div><span>Insurance payments</span><span>-${money(bill.insurancePaid)}</span></div>
      <div class="due"><span>Amount due</span><span>${money(bill.patientOwes)}</span></div>
    </div>
  </div></body></html>`;
}

const outDir = path.join(process.cwd(), "public", "samples");
const workDir = mkdtempSync(path.join(tmpdir(), "billbuster-"));
mkdirSync(outDir, { recursive: true });

for (const sample of SAMPLE_BILLS) {
  const htmlPath = path.join(workDir, `${sample.id}.html`);
  const pngPath = path.join(outDir, `${sample.id}.png`);
  writeFileSync(htmlPath, billHtml(sample));
  const height = 520 + sample.bill.lineItems.length * 38;
  execFileSync(BROWSER, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--window-size=840,${height}`,
    `--screenshot=${pngPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ]);
  console.log(`Rendered ${path.relative(process.cwd(), pngPath)}`);
}
