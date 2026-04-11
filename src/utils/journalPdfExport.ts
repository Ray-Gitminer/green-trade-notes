import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { addThaiFont } from "./pdfThaiFont";

const ENTRY_CONDITIONS_MAP: Record<string, string> = {
  break_m5: "เบรค M5",
  daily_frame: "กรอบวัน",
  sw_frame: "กรอบ SW",
  sig: "SIG",
  ath_frame: "กรอบ ATH",
};

const SESSION_LABEL: Record<string, string> = {
  asia: "เช้าเอเชีย",
  london: "บ่ายลอนดอน",
  us: "ค่ำอเมริกา",
};

function conditionsText(conditions: any): string {
  if (!conditions || typeof conditions !== "object") return "-";
  const labels = Object.entries(ENTRY_CONDITIONS_MAP)
    .filter(([key]) => conditions[key])
    .map(([, label]) => label);
  if (conditions.other) labels.push(`อื่นๆ: ${conditions.other}`);
  return labels.join(", ") || "-";
}

export async function exportJournalPDF(trades: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await addThaiFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;

  // === Header ===
  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 120, 60);
  doc.text("บันทึกการเทรด ระบบแม่ปลาปากกาเขียว", pageW / 2, 15, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`วันที่พิมพ์: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin, 15, { align: "right" });

  // === Reminder box ===
  const boxY = 20;
  doc.setFillColor(255, 248, 220);
  doc.setDrawColor(200, 170, 50);
  doc.roundedRect(margin, boxY, pageW - margin * 2, 16, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(180, 130, 0);
  doc.text("เตือนสติ:", margin + 3, boxY + 5);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(120, 90, 0);
  doc.text("• รอเทรดกราฟเมื่อเข้าเงื่อนไขเท่านั้น (รอบ กรอบ ซิก) ไม่ตรงไม่เทรด เทรดไม่เกิน 3 ครั้ง / วัน", margin + 3, boxY + 10);
  doc.text("• ถ้าได้ตามเป้าพอใจกำไร *****ออกตลาดได้เลย เปิดกราฟ ไปทำอะไรทำ", margin + 3, boxY + 14);

  // === Table ===
  const tableStartY = boxY + 20;

  const head = [[
    "วัน/เดือน/ปี",
    "เงื่อนไขเข้าเทรด",
    "ช่วงเวลา",
    "ล็อตไซด์",
    "Buy/Sell",
    "ราคาเข้า",
    "TP",
    "SL",
    "ผลกำไร/ขาดทุน",
    "อารมณ์",
    "ความมั่นใจ",
  ]];

  const body = trades.map((t) => [
    t.trade_date ? format(new Date(t.trade_date), "dd/MM/yyyy") : "-",
    conditionsText(t.entry_conditions),
    t.trading_session ? (SESSION_LABEL[t.trading_session] || t.trading_session) : "-",
    t.lot_size != null ? String(t.lot_size) : "-",
    t.trade_type === "buy" ? "Buy" : "Sell",
    t.entry_price != null ? String(t.entry_price) : "-",
    t.take_profit != null ? String(t.take_profit) : "-",
    t.stop_loss != null ? String(t.stop_loss) : "-",
    t.profit_loss != null ? `${t.profit_loss >= 0 ? "+" : ""}$${Number(t.profit_loss).toFixed(2)}` : "-",
    t.emotional_state || "-",
    t.confidence_level != null ? `${t.confidence_level}%` : "-",
  ]);

  const totalPL = trades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);

  // Footer row
  const foot = [[
    { content: `ผลรวม (${trades.length} เทรด)`, colSpan: 8, styles: { halign: "right" as const, fontStyle: "bold" as const } },
    { content: `${totalPL >= 0 ? "+" : ""}$${totalPL.toFixed(2)}`, styles: { halign: "center" as const, fontStyle: "bold" as const, textColor: totalPL >= 0 ? [16, 140, 60] : [200, 50, 50] } },
    { content: "", colSpan: 2 },
  ]];

  (doc as any).autoTable({
    startY: tableStartY,
    head,
    body,
    foot,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: "Sarabun",
      fontSize: 8,
      cellPadding: 2,
      valign: "middle" as const,
    },
    headStyles: {
      fillColor: [16, 120, 60],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center" as const,
      fontSize: 8,
    },
    bodyStyles: {
      halign: "center" as const,
    },
    footStyles: {
      fillColor: [230, 245, 230],
      textColor: [30, 30, 30],
      fontSize: 9,
    },
    columnStyles: {
      1: { halign: "left" as const, cellWidth: 40 },
      8: { fontStyle: "bold" },
    },
    didParseCell: (data: any) => {
      // Color profit/loss cells
      if (data.section === "body" && data.column.index === 8) {
        const val = trades[data.row.index]?.profit_loss;
        if (val != null) {
          data.cell.styles.textColor = val >= 0 ? [16, 140, 60] : [200, 50, 50];
        }
      }
      // Color Buy/Sell
      if (data.section === "body" && data.column.index === 4) {
        const type = trades[data.row.index]?.trade_type;
        data.cell.styles.textColor = type === "buy" ? [16, 140, 60] : [200, 50, 50];
      }
    },
    didDrawPage: (data: any) => {
      // Page number footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(7);
      doc.setFont("Sarabun", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`หน้า ${currentPage} / ${pageCount}`, pageW / 2, pageH - 5, { align: "center" });
    },
  });

  return doc;
}
