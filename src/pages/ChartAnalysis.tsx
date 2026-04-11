import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  Save,
  Calendar,
  Download,
  FileText,
  File,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import "jspdf-autotable";
import SessionCardContent, { type SessionData } from "@/components/chart-analysis/SessionCardContent";
import GreenPenTable, { type TimeframeExtended } from "@/components/chart-analysis/GreenPenTable";
import { addThaiFont, preloadThaiFont } from "@/utils/pdfThaiFont";

const SESSION_TIMES = ["07:00", "11:00", "15:00", "19:00"];

interface LogData {
  id?: string;
  logDate: Date;
  mn: TimeframeExtended;
  w: TimeframeExtended;
  d: TimeframeExtended;
  h4: TimeframeExtended;
  h1: TimeframeExtended;
  mainResistance: string;
  minorSr: string;
  mainSupport: string;
  sessions: SessionData[];
}

const emptyTimeframe = (): TimeframeExtended => ({
  signal: "", pattern: "", marketStructure: "", imageUrl: "",
  tp1: "", tp2: "", checkpoint: "",
});

const emptySession = (time: string): SessionData => ({
  sessionTime: time,
  h1Analysis: "",
  h4Analysis: "",
  chartNotes: "",
  h1ImageUrl: "",
  h4ImageUrl: "",
});

export default function ChartAnalysis() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>(new Date());
  const [exportEndDate, setExportEndDate] = useState<Date>(new Date());
  const [pdfFontSize, setPdfFontSize] = useState<number>(14);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [currentLog, setCurrentLog] = useState<LogData>({
    logDate: new Date(),
    mn: emptyTimeframe(),
    w: emptyTimeframe(),
    d: emptyTimeframe(),
    h4: emptyTimeframe(),
    h1: emptyTimeframe(),
    mainResistance: "",
    minorSr: "",
    mainSupport: "",
    sessions: SESSION_TIMES.map(time => emptySession(time)),
  });

  // Fetch log for selected date
  const fetchLogForDate = useCallback(async (date: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const { data: logData, error: logError } = await supabase
        .from("chart_analysis_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateStr)
        .maybeSingle();

      if (logError) throw logError;

      if (logData) {
        const { data: sessionsData } = await supabase
          .from("chart_analysis_sessions")
          .select("*")
          .eq("log_id", logData.id)
          .order("session_time");

        const sessions = SESSION_TIMES.map(time => {
          const existing = sessionsData?.find(s => s.session_time === time);
          return existing ? {
            id: existing.id,
            sessionTime: existing.session_time,
            h1Analysis: existing.h1_analysis || "",
            h4Analysis: existing.h4_analysis || "",
            chartNotes: existing.chart_notes || "",
            h1ImageUrl: existing.h1_image_url || "",
            h4ImageUrl: existing.h4_image_url || "",
          } : emptySession(time);
        });

        const mapTf = (prefix: string): TimeframeExtended => ({
          signal: (logData as any)[`${prefix}_signal`] || "",
          pattern: (logData as any)[`${prefix}_pattern`] || "",
          marketStructure: (logData as any)[`${prefix}_market_structure`] || "",
          imageUrl: (logData as any)[`${prefix}_image_url`] || "",
          tp1: (logData as any)[`${prefix}_tp1`] || "",
          tp2: (logData as any)[`${prefix}_tp2`] || "",
          checkpoint: (logData as any)[`${prefix}_checkpoint`] || "",
        });

        setCurrentLog({
          id: logData.id,
          logDate: date,
          mn: mapTf("mn"),
          w: mapTf("w"),
          d: mapTf("d"),
          h4: mapTf("h4"),
          h1: mapTf("h1"),
          mainResistance: logData.main_resistance || "",
          minorSr: logData.minor_sr || "",
          mainSupport: logData.main_support || "",
          sessions,
        });
      } else {
        setCurrentLog({
          logDate: date,
          mn: emptyTimeframe(),
          w: emptyTimeframe(),
          d: emptyTimeframe(),
          h4: emptyTimeframe(),
          h1: emptyTimeframe(),
          mainResistance: "",
          minorSr: "",
          mainSupport: "",
          sessions: SESSION_TIMES.map(time => emptySession(time)),
        });
      }
    } catch (error) {
      console.error("Error fetching log:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogForDate(selectedDate);
  }, [selectedDate, fetchLogForDate]);

  useEffect(() => {
    preloadThaiFont();
  }, []);

  // Auto-save every 30 seconds
  const [lastSavedLog, setLastSavedLog] = useState<string>("");

  useEffect(() => {
    const currentLogStr = JSON.stringify(currentLog);
    if (!user || loading || currentLogStr === lastSavedLog) return;

    const autoSaveTimer = setInterval(async () => {
      const latestLogStr = JSON.stringify(currentLog);
      if (latestLogStr !== lastSavedLog) {
        try {
          await saveLog(false);
          setLastSavedLog(latestLogStr);
          console.log("Auto-saved at", new Date().toLocaleTimeString());
        } catch (error) {
          console.error("Auto-save error:", error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [user, loading, currentLog, lastSavedLog]);

  useEffect(() => {
    if (!loading && currentLog) {
      setLastSavedLog(JSON.stringify(currentLog));
    }
  }, [loading]);

  // Upload image
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const mimeExt = file.type?.split("/")?.[1] || "png";
    const nameExt = file.name?.includes(".") ? file.name.split(".").pop() : undefined;
    const ext = (nameExt || mimeExt || "png").toLowerCase();
    const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chart-images").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("chart-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Global paste target
  const pasteTargetRef = useRef<null | { folder: string; updateFn: (url: string) => void }>(null);
  const setPasteTarget = useCallback((folder: string, updateFn: (url: string) => void) => {
    pasteTargetRef.current = { folder, updateFn };
  }, []);

  useEffect(() => {
    const onWindowPaste = async (e: ClipboardEvent) => {
      const target = pasteTargetRef.current;
      if (!target) return;
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      const imageItem = Array.from(items).find((it) => it.type.startsWith("image/"));
      if (!imageItem) {
        toast({ title: "ไม่พบรูปในคลิปบอร์ด", variant: "destructive" });
        return;
      }
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      try {
        const url = await uploadImage(file, target.folder);
        target.updateFn(url);
        toast({ title: "วาง/อัพโหลดรูปสำเร็จ" });
      } catch (error) {
        console.error("Paste upload error:", error);
        toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
      }
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [toast, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, updateFn: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file, "charts");
      updateFn(url);
      toast({ title: "อัพโหลดรูปสำเร็จ" });
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  // Build save payload
  const buildLogPayload = () => {
    const dateStr = format(currentLog.logDate, "yyyy-MM-dd");
    return {
      user_id: user!.id,
      log_date: dateStr,
      mn_signal: currentLog.mn.signal,
      mn_pattern: currentLog.mn.pattern,
      mn_market_structure: currentLog.mn.marketStructure,
      mn_image_url: currentLog.mn.imageUrl,
      mn_tp1: currentLog.mn.tp1,
      mn_tp2: currentLog.mn.tp2,
      mn_checkpoint: currentLog.mn.checkpoint,
      w_signal: currentLog.w.signal,
      w_pattern: currentLog.w.pattern,
      w_market_structure: currentLog.w.marketStructure,
      w_image_url: currentLog.w.imageUrl,
      w_tp1: currentLog.w.tp1,
      w_tp2: currentLog.w.tp2,
      w_checkpoint: currentLog.w.checkpoint,
      d_signal: currentLog.d.signal,
      d_pattern: currentLog.d.pattern,
      d_market_structure: currentLog.d.marketStructure,
      d_image_url: currentLog.d.imageUrl,
      d_tp1: currentLog.d.tp1,
      d_tp2: currentLog.d.tp2,
      d_checkpoint: currentLog.d.checkpoint,
      h4_signal: currentLog.h4.signal,
      h4_pattern: currentLog.h4.pattern,
      h4_market_structure: currentLog.h4.marketStructure,
      h4_image_url: currentLog.h4.imageUrl,
      h4_tp1: currentLog.h4.tp1,
      h4_tp2: currentLog.h4.tp2,
      h4_checkpoint: currentLog.h4.checkpoint,
      h1_signal: currentLog.h1.signal,
      h1_pattern: currentLog.h1.pattern,
      h1_market_structure: currentLog.h1.marketStructure,
      h1_image_url: currentLog.h1.imageUrl,
      h1_tp1: currentLog.h1.tp1,
      h1_tp2: currentLog.h1.tp2,
      h1_checkpoint: currentLog.h1.checkpoint,
      main_resistance: currentLog.mainResistance,
      minor_sr: currentLog.minorSr,
      main_support: currentLog.mainSupport,
    };
  };

  const saveLog = async (showToast = true) => {
    if (!user) return;
    const logPayload = buildLogPayload();
    let logId = currentLog.id;

    if (logId) {
      await supabase.from("chart_analysis_logs").update(logPayload).eq("id", logId);
    } else {
      const { data } = await supabase.from("chart_analysis_logs").insert(logPayload).select("id").single();
      logId = data?.id;
      if (logId) {
        setCurrentLog(prev => ({ ...prev, id: logId }));
      }
    }

    if (logId) {
      for (const session of currentLog.sessions) {
        const sessionPayload = {
          user_id: user.id,
          log_id: logId,
          session_time: session.sessionTime,
          h1_analysis: session.h1Analysis,
          h4_analysis: session.h4Analysis,
          chart_notes: session.chartNotes,
          h1_image_url: session.h1ImageUrl,
          h4_image_url: session.h4ImageUrl,
        };
        if (session.id) {
          await supabase.from("chart_analysis_sessions").update(sessionPayload).eq("id", session.id);
        } else {
          const { data } = await supabase.from("chart_analysis_sessions").insert(sessionPayload).select("id").single();
          if (data?.id) {
            setCurrentLog(prev => ({
              ...prev,
              sessions: prev.sessions.map(s =>
                s.sessionTime === session.sessionTime ? { ...s, id: data.id } : s
              ),
            }));
          }
        }
      }
    }

    if (showToast) {
      toast({ title: "บันทึกสำเร็จ", description: `บันทึกวันที่ ${format(currentLog.logDate, "dd/MM/yyyy")}` });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLog(true);
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // TP auto-calculation config
  const TP_OFFSETS: Record<string, { tp1: number; tp2?: number }> = {
    mn: { tp1: 300 },
    w: { tp1: 150, tp2: 300 },
    d: { tp1: 50, tp2: 100 },
    h4: { tp1: 15, tp2: 30 },
    h1: { tp1: 10 },
  };

  const calcTP = (signal: string, marketStructure: string, tfKey: string) => {
    const base = parseFloat(marketStructure);
    const offsets = TP_OFFSETS[tfKey];
    if (!signal || isNaN(base) || !offsets) return { tp1: "", tp2: "" };
    const mult = signal === "Buy" ? 1 : -1;
    return {
      tp1: String(base + offsets.tp1 * mult),
      tp2: offsets.tp2 != null ? String(base + offsets.tp2 * mult) : "",
    };
  };

  // Update timeframe data with auto TP calculation
  const handleTableUpdate = useCallback((tf: string, field: string, value: string) => {
    setCurrentLog(prev => {
      const tfData = { ...(prev as any)[tf], [field]: value };

      // Recalculate TP when signal or marketStructure changes
      if (field === "signal" || field === "marketStructure") {
        const signal = field === "signal" ? value : tfData.signal;
        const ms = field === "marketStructure" ? value : tfData.marketStructure;
        const offsets = TP_OFFSETS[tf];
        const base = parseFloat(ms);
        if (signal && !isNaN(base) && offsets) {
          const mult = signal === "Buy" ? 1 : -1;
          tfData.tp1 = String(base + offsets.tp1 * mult);
          tfData.tp2 = offsets.tp2 != null ? String(base + offsets.tp2 * mult) : tfData.tp2;
        } else if (!signal || !ms) {
          tfData.tp1 = "";
          tfData.tp2 = "";
        }
      }

      return { ...prev, [tf]: tfData };
    });
  }, []);

  // Auto-calculate กรอบวัน from รับต้านย่อย
  const handleSrUpdate = useCallback((field: string, value: string) => {
    setCurrentLog(prev => {
      const next = { ...prev, [field]: value };
      if (field === "minorSr") {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          next.mainResistance = String(num + 5);
          next.mainSupport = String(num - 5);
        } else {
          next.mainResistance = "";
          next.mainSupport = "";
        }
      }
      return next;
    });
  }, []);

  const updateSession = (index: number, field: keyof SessionData, value: string) => {
    setCurrentLog(prev => ({
      ...prev,
      sessions: prev.sessions.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const clearSessionNotes = (index: number) => {
    setCurrentLog(prev => ({
      ...prev,
      sessions: prev.sessions.map((s, i) => i === index ? { ...s, chartNotes: "" } : s),
    }));
    toast({ title: "ล้างบันทึกสำเร็จ" });
  };

  // Export functions
  const fetchLogsForExport = async (startDate: Date, endDate: Date) => {
    if (!user) return [];
    const { data } = await supabase
      .from("chart_analysis_logs")
      .select("*, chart_analysis_sessions(*)")
      .eq("user_id", user.id)
      .gte("log_date", format(startDate, "yyyy-MM-dd"))
      .lte("log_date", format(endDate, "yyyy-MM-dd"))
      .order("log_date");
    return data || [];
  };

  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url) { resolve(null); return; }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const generatePDFDocument = async () => {
    const data = await fetchLogsForExport(exportStartDate, exportEndDate);
    if (!data.length) {
      toast({ title: "ไม่มีข้อมูล", variant: "destructive" });
      return null;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    await addThaiFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const baseFontSize = pdfFontSize;
    const titleFontSize = baseFontSize + 4;
    const headerFontSize = baseFontSize + 2;
    const smallFontSize = baseFontSize - 2;
    const lineHeight = baseFontSize * 0.5;

    const checkPageBreak = (yPos: number, requiredSpace: number): number => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };

    let logoData: string | null = null;
    try {
      const logoModule = await import("@/assets/logo-report.png");
      logoData = await loadImageAsBase64(logoModule.default);
    } catch {
      console.log("Logo not found");
    }

    for (let logIndex = 0; logIndex < data.length; logIndex++) {
      const log = data[logIndex];
      if (logIndex > 0) doc.addPage();

      let yPos = margin;
      const logoSize = 18;
      if (logoData) {
        try { doc.addImage(logoData, "PNG", margin, yPos - 3, logoSize, logoSize); } catch {}
      }

      doc.setFont("Sarabun", "bold");
      doc.setFontSize(titleFontSize);
      doc.setTextColor(0, 0, 0);
      const titleX = logoData ? margin + logoSize + 4 : margin;
      doc.text("บันทึกการเดินทางของกราฟ", titleX, yPos + 4);
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(baseFontSize);
      doc.text(`วันที่ ${log.log_date}`, titleX, yPos + 4 + lineHeight + 2);
      yPos += logoSize + 4;

      // TF table
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(headerFontSize);
      doc.text("เช็ค Sig / วงจรกราฟของทุก TF", margin, yPos);
      yPos += lineHeight + 3;

      const timeframes = [
        { name: "MN", signal: log.mn_signal || "-", pattern: (log as any).mn_pattern || "-", structure: log.mn_market_structure || "-", tp1: (log as any).mn_tp1 || "", tp2: (log as any).mn_tp2 || "", checkpoint: (log as any).mn_checkpoint || "-" },
        { name: "W", signal: log.w_signal || "-", pattern: (log as any).w_pattern || "-", structure: log.w_market_structure || "-", tp1: (log as any).w_tp1 || "", tp2: (log as any).w_tp2 || "", checkpoint: (log as any).w_checkpoint || "-" },
        { name: "D", signal: log.d_signal || "-", pattern: (log as any).d_pattern || "-", structure: log.d_market_structure || "-", tp1: (log as any).d_tp1 || "", tp2: (log as any).d_tp2 || "", checkpoint: (log as any).d_checkpoint || "-" },
        { name: "H4", signal: log.h4_signal || "-", pattern: (log as any).h4_pattern || "-", structure: log.h4_market_structure || "-", tp1: (log as any).h4_tp1 || "", tp2: (log as any).h4_tp2 || "", checkpoint: (log as any).h4_checkpoint || "-" },
        { name: "H1", signal: log.h1_signal || "-", pattern: (log as any).h1_pattern || "-", structure: log.h1_market_structure || "-", tp1: (log as any).h1_tp1 || "", tp2: (log as any).h1_tp2 || "", checkpoint: (log as any).h1_checkpoint || "-" },
      ];

      const colWidths = { tf: 14, signal: 14, pattern: 22, details: 42, tp: 48, checkpoint: 20 };
      const tableWidth = colWidths.tf + colWidths.signal + colWidths.pattern + colWidths.details + colWidths.tp + colWidths.checkpoint;
      const rowHeight = 10;

      // Header
      doc.setFillColor(40, 60, 45);
      doc.rect(margin, yPos, tableWidth, lineHeight + 2, "F");
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(smallFontSize - 1);
      doc.setTextColor(255, 255, 255);
      let xPos = margin + 2;
      doc.text("TF", xPos, yPos + lineHeight - 1);
      xPos += colWidths.tf;
      doc.text("Sig", xPos, yPos + lineHeight - 1);
      xPos += colWidths.signal;
      doc.text("Pattern", xPos, yPos + lineHeight - 1);
      xPos += colWidths.pattern;
      doc.text("ไส้หลัง Sig", xPos, yPos + lineHeight - 1);
      xPos += colWidths.details;
      doc.text("Take Profit", xPos, yPos + lineHeight - 1);
      xPos += colWidths.tp;
      doc.text("จุดเช็ค", xPos, yPos + lineHeight - 1);
      yPos += lineHeight + 3;
      doc.setTextColor(0, 0, 0);

      for (let i = 0; i < timeframes.length; i++) {
        const tf = timeframes[i];
        const wrappedLines = doc.splitTextToSize(tf.structure, colWidths.details - 4);
        const dynamicHeight = Math.max(rowHeight, wrappedLines.length * 4 + 4);

        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPos, tableWidth, dynamicHeight, "F");
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, tableWidth, dynamicHeight, "S");

        xPos = margin + 2;
        const centerY = yPos + dynamicHeight / 2 + 1.5;
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(smallFontSize - 1);
        doc.text(tf.name, xPos, centerY);
        xPos += colWidths.tf;

        // Signal with color
        doc.setFont("Sarabun", "normal");
        if (tf.signal === "Buy") doc.setTextColor(16, 185, 129);
        else if (tf.signal === "Sell") doc.setTextColor(220, 38, 38);
        else doc.setTextColor(100, 100, 100);
        doc.text(tf.signal, xPos, centerY);
        doc.setTextColor(0, 0, 0);
        xPos += colWidths.signal;

        // Pattern
        doc.text(tf.pattern, xPos, centerY);
        xPos += colWidths.pattern;

        // ไส้หลัง Sig (details)
        let detailsY = yPos + 4;
        for (const line of wrappedLines) {
          doc.text(line, xPos, detailsY + 3);
          detailsY += 4;
        }
        xPos += colWidths.details;

        // TP
        doc.text(tf.tp1 ? `TP1: ${tf.tp1}` : "-", xPos, centerY - 2);
        if (tf.tp2) doc.text(`TP2: ${tf.tp2}`, xPos, centerY + 2);
        xPos += colWidths.tp;

        // Checkpoint
        doc.text(tf.checkpoint, xPos, centerY);

        yPos += dynamicHeight;
      }

      // กรอบวัน - 3 columns below table
      yPos += 3;
      const srBoxWidth = tableWidth / 3;
      const srBoxHeight = 14;
      const srLabels = [
        { label: "ต้านหลัก", value: log.main_resistance || "-", color: [16, 185, 129] },
        { label: "รับต้านย่อย", value: log.minor_sr || "-", color: [234, 179, 8] },
        { label: "รับหลัก", value: log.main_support || "-", color: [16, 185, 129] },
      ];
      
      // Header row
      doc.setFillColor(40, 60, 45);
      doc.rect(margin, yPos, tableWidth, lineHeight + 2, "F");
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(smallFontSize - 1);
      doc.setTextColor(255, 255, 255);
      for (let i = 0; i < srLabels.length; i++) {
        const cx = margin + i * srBoxWidth + srBoxWidth / 2;
        doc.text(srLabels[i].label, cx, yPos + lineHeight - 1, { align: "center" });
      }
      yPos += lineHeight + 2;

      // Value row
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, yPos, tableWidth, srBoxHeight, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, tableWidth, srBoxHeight, "S");
      for (let i = 0; i < srLabels.length; i++) {
        if (i > 0) {
          doc.line(margin + i * srBoxWidth, yPos, margin + i * srBoxWidth, yPos + srBoxHeight);
        }
        const cx = margin + i * srBoxWidth + srBoxWidth / 2;
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(baseFontSize);
        doc.setTextColor(srLabels[i].color[0], srLabels[i].color[1], srLabels[i].color[2]);
        doc.text(srLabels[i].value, cx, yPos + srBoxHeight / 2 + 2, { align: "center" });
      }
      doc.setTextColor(0, 0, 0);
      yPos += srBoxHeight;

      yPos += 4;

      // Sessions
      const sessions = log.chart_analysis_sessions || [];
      const sessionTimes = ["07:00", "11:00", "15:00", "19:00"];

      for (const sessionTime of sessionTimes) {
        const session = sessions.find((s: any) => s.session_time === sessionTime);
        const hasContent = session?.h4_analysis || session?.h1_analysis || session?.chart_notes;
        if (!hasContent) continue;

        yPos = checkPageBreak(yPos, 20);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(smallFontSize);
        doc.text(`${sessionTime.replace(":", ".")}น.`, margin, yPos);
        yPos += lineHeight;

        doc.setFont("Sarabun", "normal");
        doc.setFontSize(smallFontSize - 1);

        const noteContents = [
          { label: "H4:", text: session?.h4_analysis || "" },
          { label: "H1:", text: session?.h1_analysis || "" },
          { label: "โน้ต:", text: session?.chart_notes || "" },
        ];

        for (const note of noteContents) {
          if (note.text) {
            doc.setFont("Sarabun", "bold");
            doc.text(note.label, margin + 3, yPos);
            doc.setFont("Sarabun", "normal");
            const labelWidth = doc.getTextWidth(note.label + " ");
            const maxTextWidth = contentWidth - 8 - labelWidth;
            let displayText = note.text;
            while (doc.getTextWidth(displayText) > maxTextWidth && displayText.length > 0) {
              displayText = displayText.slice(0, -1);
            }
            if (displayText !== note.text && displayText.length > 3) {
              displayText = displayText.slice(0, -3) + "...";
            }
            doc.text(displayText, margin + 3 + labelWidth, yPos);
            yPos += lineHeight - 1;
          }
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 3;
      }
    }

    return doc;
  };

  const previewPDF = async () => {
    setGeneratingPreview(true);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    try {
      const doc = await generatePDFDocument();
      if (doc) {
        const pdfBlob = doc.output("blob");
        const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
        setPdfPreviewUrl(blobUrl);
        setPdfPreviewOpen(true);
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const downloadPDFFromPreview = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = `chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "ส่งออก PDF สำเร็จ" });
    }
  };

  const exportToPDF = async () => {
    toast({ title: "กำลังสร้าง PDF..." });
    try {
      const doc = await generatePDFDocument();
      if (doc) {
        doc.save(`chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`);
        setExportDialogOpen(false);
        closePdfPreview();
        toast({ title: "ส่งออก PDF สำเร็จ" });
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 บันทึกการเดินทางของกราฟ</h1>
          <p className="text-muted-foreground">ธีมปากกาเขียว — เช็ค Sig ทุก TF และจดบันทึกทุกเซสชัน</p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {format(selectedDate, "dd MMM yyyy", { locale: th })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                ส่งออก
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ส่งออกบันทึก</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>วันที่เริ่ม</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(exportStartDate, "dd/MM/yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={exportStartDate} onSelect={(date) => date && setExportStartDate(date)} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่สิ้นสุด</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(exportEndDate, "dd/MM/yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={exportEndDate} onSelect={(date) => date && setExportEndDate(date)} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ขนาดตัวอักษร PDF</Label>
                  <Select value={String(pdfFontSize)} onValueChange={(v) => setPdfFontSize(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12pt (เล็ก)</SelectItem>
                      <SelectItem value="14">14pt (ปกติ)</SelectItem>
                      <SelectItem value="16">16pt (ใหญ่)</SelectItem>
                      <SelectItem value="18">18pt (ใหญ่มาก)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={previewPDF} variant="secondary" className="gap-2" disabled={generatingPreview}>
                    {generatingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    ดูตัวอย่าง PDF
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" className="gap-2">
                    <File className="h-4 w-4" />
                    ดาวน์โหลด PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ===== SECTION 1: ตารางวิเคราะห์หลัก (Green Pen Table) ===== */}
          <Card className="border-emerald-800/40 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2 border-b border-emerald-800/30">
              <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                🖊️ ตารางวิเคราะห์ — ปากกาเขียว
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <GreenPenTable
                mn={currentLog.mn}
                w={currentLog.w}
                d={currentLog.d}
                h4={currentLog.h4}
                h1={currentLog.h1}
                mainResistance={currentLog.mainResistance}
                minorSr={currentLog.minorSr}
                mainSupport={currentLog.mainSupport}
                onUpdate={handleTableUpdate}
                onSrUpdate={handleSrUpdate}
              />
            </CardContent>
          </Card>

          {/* ===== SECTION 2: Timeline บันทึกรายชั่วโมง ===== */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              ⏰ บันทึกรอบวัน — Timeline
            </h2>
            {currentLog.sessions.map((session, index) => (
              <SessionCardContent
                key={session.sessionTime}
                session={session}
                index={index}
                updateSession={updateSession}
                clearSessionNotes={clearSessionNotes}
                setPasteTarget={setPasteTarget}
                uploadImage={uploadImage}
                handleFileUpload={handleFileUpload}
                setLightboxUrl={setLightboxUrl}
                toast={toast}
              />
            ))}
          </div>
        </div>
      )}

      {/* Save Plan Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        size="lg"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        💾 Save Plan — บันทึกแผน
      </Button>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <div className="relative flex items-center justify-center">
            {lightboxUrl && (
              <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfPreviewOpen} onOpenChange={(open) => {
        if (!open) { closePdfPreview(); setPdfFullscreen(false); setPdfZoom(100); }
      }}>
        <DialogContent className={`p-0 flex flex-col overflow-hidden transition-all duration-200 ${
          pdfFullscreen
            ? 'max-w-[100vw] w-[100vw] h-[100vh] rounded-none'
            : 'max-w-[95vw] w-[95vw] h-[90vh]'
        }`}>
          <DialogHeader className="p-3 pb-2 border-b shrink-0 bg-white text-gray-900">
            <DialogTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-lg font-bold text-gray-900">📄 ตัวอย่าง PDF</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                  <Button variant="ghost" size="sm" onClick={() => setPdfZoom(prev => Math.max(50, prev - 25))} disabled={pdfZoom <= 50} className="h-7 w-7 p-0 text-gray-700 hover:bg-gray-200">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">{pdfZoom}%</span>
                  <Button variant="ghost" size="sm" onClick={() => setPdfZoom(prev => Math.min(200, prev + 25))} disabled={pdfZoom >= 200} className="h-7 w-7 p-0 text-gray-700 hover:bg-gray-200">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPdfFullscreen(prev => !prev)} className="h-8 gap-1 text-gray-700 border-gray-300 hover:bg-gray-100">
                  {pdfFullscreen ? <><Minimize2 className="h-4 w-4" /><span className="hidden sm:inline">ย่อ</span></> : <><Maximize2 className="h-4 w-4" /><span className="hidden sm:inline">เต็มจอ</span></>}
                </Button>
                <Button onClick={downloadPDFFromPreview} size="sm" className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto bg-white">
            <div className="h-full p-4" style={{ minWidth: `${1000 * (pdfZoom / 100)}px`, transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top left', width: `${100 / (pdfZoom / 100)}%` }}>
              {pdfPreviewUrl ? (
                <object data={pdfPreviewUrl} type="application/pdf" className="w-full rounded-lg border border-gray-300 bg-white" style={{ height: `${100 / (pdfZoom / 100)}%`, minHeight: '100%' }}>
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-300 py-16">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2 text-gray-900">เบราว์เซอร์ไม่รองรับการแสดง PDF</p>
                    <Button onClick={downloadPDFFromPreview} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Download className="h-5 w-5" />
                      ดาวน์โหลด PDF
                    </Button>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
