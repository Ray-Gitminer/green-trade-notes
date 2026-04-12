import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

// ──────────── helpers for summary page ────────────
function computeStats(trades: any[]) {
  const totalLots = trades.reduce((s, t) => s + (t.lot_size || 0), 0);
  const totalTrades = trades.length;
  const buyTrades = trades.filter(t => t.trade_type === "buy").length;
  const sellTrades = trades.filter(t => t.trade_type === "sell").length;
  const winTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
  const loseTrades = trades.filter(t => (t.profit_loss || 0) < 0).length;
  const totalPL = trades.reduce((s, t) => s + (t.profit_loss || 0), 0);
  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : "0";
  return { totalLots, totalTrades, buyTrades, sellTrades, winTrades, loseTrades, totalPL, winRate };
}

function computeStrategies(trades: any[]) {
  const counts: Record<string, { count: number; wins: number; profit: number }> = {};
  trades.forEach(t => {
    const ec = t.entry_conditions;
    if (!ec || typeof ec !== "object") {
      const label = "ไม่ได้ระบุ";
      if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
      counts[label].count++;
      if ((t.profit_loss || 0) > 0) counts[label].wins++;
      counts[label].profit += (t.profit_loss || 0);
      return;
    }
    const usedKeys = Object.keys(ec).filter(k => ec[k] && k !== "other");
    if (ec.other) {
      const label = `อื่นๆ: ${ec.other}`;
      if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
      counts[label].count++;
      if ((t.profit_loss || 0) > 0) counts[label].wins++;
      counts[label].profit += (t.profit_loss || 0);
    }
    if (usedKeys.length === 0 && !ec.other) {
      const label = "ไม่ได้ระบุ";
      if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
      counts[label].count++;
      if ((t.profit_loss || 0) > 0) counts[label].wins++;
      counts[label].profit += (t.profit_loss || 0);
    }
    usedKeys.forEach(key => {
      const label = ENTRY_CONDITIONS_MAP[key] || key;
      if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
      counts[label].count++;
      if ((t.profit_loss || 0) > 0) counts[label].wins++;
      counts[label].profit += (t.profit_loss || 0);
    });
  });
  const total = trades.length;
  return Object.entries(counts)
    .map(([name, d]) => ({
      name,
      count: d.count,
      wins: d.wins,
      profit: d.profit,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
      pct: total > 0 ? (d.count / total) * 100 : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

function computeSessions(trades: any[]) {
  const sessions: Record<string, { count: number; profit: number; wins: number }> = {};
  trades.forEach(t => {
    const s = t.trading_session || "unknown";
    if (!sessions[s]) sessions[s] = { count: 0, profit: 0, wins: 0 };
    sessions[s].count++;
    sessions[s].profit += (t.profit_loss || 0);
    if ((t.profit_loss || 0) > 0) sessions[s].wins++;
  });
  return Object.entries(sessions)
    .filter(([k]) => k !== "unknown")
    .map(([k, d]) => ({
      name: SESSION_LABEL[k] || k,
      count: d.count,
      profit: d.profit,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
    }));
}

function computeGrowth(trades: any[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let cum = 0;
  return sorted.map((t, i) => {
    cum += (t.profit_loss || 0);
    return { label: t.trade_date ? format(new Date(t.trade_date), "dd/MM") : `#${i + 1}`, value: cum };
  });
}

// ──────────── drawing helpers ────────────

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor: [number, number, number]) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

function drawStatCard(doc: jsPDF, x: number, y: number, w: number, h: number, value: string, label: string, valueColor: [number, number, number]) {
  drawRoundedRect(doc, x, y, w, h, 2, [30, 40, 35]);
  doc.setFontSize(14);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(...valueColor);
  doc.text(value, x + w / 2, y + h / 2 - 1, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(160, 170, 165);
  doc.text(label, x + w / 2, y + h / 2 + 6, { align: "center" });
}

function drawProgressBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number) {
  doc.setFillColor(40, 55, 45);
  doc.roundedRect(x, y, w, h, 1, 1, "F");
  if (pct > 0) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(x, y, Math.max(w * Math.min(pct, 100) / 100, 2), h, 1, 1, "F");
  }
}

function drawMiniLineChart(doc: jsPDF, x: number, y: number, w: number, h: number, data: { value: number }[]) {
  if (data.length < 2) return;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);

  // zero line
  const zeroY = y + h - ((0 - min) / range) * h;
  doc.setDrawColor(60, 75, 65);
  doc.setLineWidth(0.2);
  doc.line(x, zeroY, x + w, zeroY);

  // line
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  for (let i = 0; i < data.length - 1; i++) {
    const x1 = x + i * stepX;
    const y1 = y + h - ((vals[i] - min) / range) * h;
    const x2 = x + (i + 1) * stepX;
    const y2 = y + h - ((vals[i + 1] - min) / range) * h;
    doc.line(x1, y1, x2, y2);
  }

  // labels
  doc.setFontSize(6);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(130, 140, 135);
  // first and last x labels
  if (data.length > 0) {
    const firstD = data[0] as any;
    const lastD = data[data.length - 1] as any;
    doc.text(firstD.label || "", x, y + h + 4);
    doc.text(lastD.label || "", x + w, y + h + 4, { align: "right" });
  }
  // min/max y labels
  doc.text(`$${max.toFixed(0)}`, x - 2, y + 3, { align: "right" });
  doc.text(`$${min.toFixed(0)}`, x - 2, y + h, { align: "right" });
}

// ──────────── MAIN EXPORT ────────────

export async function exportJournalPDF(trades: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await addThaiFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageW - margin * 2;

  // ═══════════════════════════════════════════
  //  PAGE 1: SUMMARY
  // ═══════════════════════════════════════════

  // Background
  doc.setFillColor(15, 23, 20);
  doc.rect(0, 0, pageW, pageH, "F");

  // Header
  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("สรุปบันทึกการเทรด ระบบแม่ปลาปากกาเขียว", pageW / 2, 14, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(130, 140, 135);
  doc.text(`วันที่พิมพ์: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin, 14, { align: "right" });

  const stats = computeStats(trades);
  const strategies = computeStrategies(trades);
  const sessions = computeSessions(trades);
  const growth = computeGrowth(trades);

  // ── Stat cards row ──
  const cardY = 20;
  const cardH = 18;
  const cardGap = 3;
  const cardW = (contentW - cardGap * 5) / 6;

  const statCards: { value: string; label: string; color: [number, number, number] }[] = [
    { value: stats.totalLots.toFixed(2), label: "ล็อตไซด์รวม", color: [16, 185, 129] },
    { value: String(stats.totalTrades), label: "จำนวนเทรด", color: [220, 230, 225] },
    { value: String(stats.buyTrades), label: "Buy", color: [52, 211, 153] },
    { value: String(stats.sellTrades), label: "Sell", color: [248, 113, 113] },
    { value: String(stats.winTrades), label: "ชนะ", color: [52, 211, 153] },
    { value: String(stats.loseTrades), label: "แพ้", color: [248, 113, 113] },
  ];

  statCards.forEach((c, i) => {
    drawStatCard(doc, margin + i * (cardW + cardGap), cardY, cardW, cardH, c.value, c.label, c.color);
  });

  // ── LEFT COLUMN: Equity Curve + Session Profitability ──
  const col1X = margin;
  const col2X = margin + contentW / 2 + 2;
  const colW = contentW / 2 - 2;

  // Equity Curve
  const chartBoxY = cardY + cardH + 5;
  const chartBoxH = 55;
  drawRoundedRect(doc, col1X, chartBoxY, colW, chartBoxH, 2, [22, 33, 28]);

  doc.setFontSize(9);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("📈 แนวโน้มการเติบโต (Equity Curve)", col1X + 4, chartBoxY + 7);

  if (growth.length > 1) {
    drawMiniLineChart(doc, col1X + 18, chartBoxY + 13, colW - 26, chartBoxH - 20, growth);
  } else {
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 135);
    doc.text("ข้อมูลไม่เพียงพอ", col1X + colW / 2, chartBoxY + chartBoxH / 2, { align: "center" });
  }

  // Session Profitability
  const sessBoxY = chartBoxY + chartBoxH + 4;
  const sessBoxH = pageH - sessBoxY - margin - 5;
  drawRoundedRect(doc, col1X, sessBoxY, colW, sessBoxH, 2, [22, 33, 28]);

  doc.setFontSize(9);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("🕐 กำไรตามช่วงเวลา", col1X + 4, sessBoxY + 7);

  let sy = sessBoxY + 13;
  sessions.forEach(s => {
    drawRoundedRect(doc, col1X + 4, sy, colW - 8, 12, 2, [30, 42, 36]);
    doc.setFontSize(8);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(220, 230, 225);
    doc.text(s.name, col1X + 7, sy + 5);
    doc.setFontSize(7);
    doc.setFont("Sarabun", "normal");
    doc.setTextColor(130, 140, 135);
    doc.text(`${s.count} เทรด | Win Rate: ${s.winRate.toFixed(1)}%`, col1X + 7, sy + 10);
    // profit on right
    const profitColor: [number, number, number] = s.profit >= 0 ? [52, 211, 153] : [248, 113, 113];
    doc.setFontSize(9);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(...profitColor);
    doc.text(`${s.profit >= 0 ? "+" : ""}$${s.profit.toFixed(2)}`, col1X + colW - 7, sy + 7, { align: "right" });
    sy += 15;
  });
  if (sessions.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 135);
    doc.text("ยังไม่มีข้อมูล", col1X + colW / 2, sessBoxY + 20, { align: "center" });
  }

  // ── RIGHT COLUMN: Strategy Breakdown ──
  const stratBoxY = chartBoxY;
  const stratBoxH = pageH - stratBoxY - margin - 5;
  drawRoundedRect(doc, col2X, stratBoxY, colW, stratBoxH, 2, [22, 33, 28]);

  doc.setFontSize(9);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("🎯 กลยุทธ์ที่ใช้ (เรียงตาม Win Rate)", col2X + 4, stratBoxY + 7);

  let stratY = stratBoxY + 13;
  strategies.forEach((s, i) => {
    if (stratY + 16 > pageH - margin) return; // safety
    drawRoundedRect(doc, col2X + 4, stratY, colW - 8, 14, 2, [30, 42, 36]);

    // rank
    doc.setFontSize(7);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(130, 140, 135);
    doc.text(`#${i + 1}`, col2X + 7, stratY + 5);

    // name
    doc.setFontSize(8);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(220, 230, 225);
    doc.text(s.name, col2X + 15, stratY + 5);

    // profit on right
    const profitColor: [number, number, number] = s.profit >= 0 ? [52, 211, 153] : [248, 113, 113];
    doc.setFontSize(8);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(...profitColor);
    doc.text(`${s.profit >= 0 ? "+" : ""}$${s.profit.toFixed(2)}`, col2X + colW - 7, stratY + 5, { align: "right" });

    // sub info
    doc.setFontSize(6.5);
    doc.setFont("Sarabun", "normal");
    doc.setTextColor(130, 140, 135);
    doc.text(`ใช้ ${s.count} ครั้ง (${s.pct.toFixed(1)}%)  |  Win Rate: ${s.winRate.toFixed(1)}%`, col2X + 7, stratY + 10);

    // progress bar
    drawProgressBar(doc, col2X + 7, stratY + 11.5, colW - 18, 1.5, s.winRate);

    stratY += 17;
  });
  if (strategies.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 135);
    doc.text("ยังไม่มีข้อมูล", col2X + colW / 2, stratBoxY + 25, { align: "center" });
  }

  // Page number
  doc.setFontSize(7);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(100, 110, 105);
  doc.text("หน้า 1", pageW / 2, pageH - 4, { align: "center" });

  // ═══════════════════════════════════════════
  //  PAGE 2+: TRADE DETAILS TABLE
  // ═══════════════════════════════════════════

  doc.addPage("a4", "landscape");

  // Header on page 2
  doc.setFillColor(15, 23, 20);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFontSize(14);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("บันทึกการเทรด ระบบแม่ปลาปากกาเขียว", pageW / 2, 14, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(130, 140, 135);
  doc.text(`วันที่พิมพ์: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW - margin, 14, { align: "right" });

  // Reminder box
  const boxY = 18;
  doc.setFillColor(45, 40, 20);
  doc.setDrawColor(180, 150, 40);
  doc.roundedRect(margin, boxY, contentW, 14, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("Sarabun", "bold");
  doc.setTextColor(220, 180, 50);
  doc.text("เตือนสติ:", margin + 3, boxY + 4.5);
  doc.setFont("Sarabun", "normal");
  doc.setTextColor(200, 160, 40);
  doc.text("• รอเทรดกราฟเมื่อเข้าเงื่อนไขเท่านั้น (รอบ กรอบ ซิก) ไม่ตรงไม่เทรด เทรดไม่เกิน 3 ครั้ง / วัน", margin + 3, boxY + 9);
  doc.text("• ถ้าได้ตามเป้าพอใจกำไร *****ออกตลาดได้เลย เปิดกราฟ ไปทำอะไรทำ", margin + 3, boxY + 12.5);

  // Table
  const tableStartY = boxY + 18;

  const head = [[
    "วัน/เดือน/ปี", "เงื่อนไขเข้าเทรด", "ช่วงเวลา", "ล็อตไซด์",
    "Buy/Sell", "ราคาเข้า", "TP", "SL", "ผลกำไร/ขาดทุน", "อารมณ์", "ความมั่นใจ",
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

  const foot = [[
    { content: `ผลรวม (${trades.length} เทรด)`, colSpan: 8, styles: { halign: "right" as const, fontStyle: "bold" as const } },
    { content: `${totalPL >= 0 ? "+" : ""}$${totalPL.toFixed(2)}`, styles: { halign: "center" as const, fontStyle: "bold" as const, textColor: (totalPL >= 0 ? [16, 140, 60] : [200, 50, 50]) as [number, number, number] } },
    { content: "", colSpan: 2 },
  ]];

  autoTable(doc, {
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
      textColor: [220, 230, 225],
      fillColor: [20, 30, 25],
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
    alternateRowStyles: {
      fillColor: [25, 38, 30],
    },
    footStyles: {
      fillColor: [20, 50, 35],
      textColor: [220, 230, 225],
      fontSize: 9,
    },
    columnStyles: {
      1: { halign: "left" as const, cellWidth: 40 },
      8: { fontStyle: "bold" },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 8) {
        const val = trades[data.row.index]?.profit_loss;
        if (val != null) {
          data.cell.styles.textColor = val >= 0 ? [52, 211, 153] : [248, 113, 113];
        }
      }
      if (data.section === "body" && data.column.index === 4) {
        const type = trades[data.row.index]?.trade_type;
        data.cell.styles.textColor = type === "buy" ? [52, 211, 153] : [248, 113, 113];
      }
    },
    didDrawPage: (data: any) => {
      // Dark bg on new pages
      const pg = (doc as any).internal.getCurrentPageInfo().pageNumber;
      if (pg > 2) {
        // bg already drawn by autoTable continuation
      }
      // page number
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(7);
      doc.setFont("Sarabun", "normal");
      doc.setTextColor(100, 110, 105);
      doc.text(`หน้า ${currentPage} / ${pageCount}`, pageW / 2, pageH - 4, { align: "center" });
    },
  });

  return doc;
}
