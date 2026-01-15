import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  Save,
  Calendar,
  Image,
  Upload,
  X,
  Download,
  Share2,
  FileSpreadsheet,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  File,
  ClipboardPaste,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import "jspdf-autotable";
import SessionCardContent, { type SessionData } from "@/components/chart-analysis/SessionCardContent";
import { addThaiFont, preloadThaiFont } from "@/utils/pdfThaiFont";

const SIGNALS = ["Buy", "Sell", "Neutral"];
const SESSION_TIMES = ["07:00", "11:00", "15:00", "19:00"];

interface TimeframeData {
  signal: string;
  marketStructure: string;
  imageUrl: string;
}

// SessionData is imported from SessionCardContent

interface LogData {
  id?: string;
  logDate: Date;
  mn: TimeframeData;
  w: TimeframeData;
  d: TimeframeData;
  h4: TimeframeData;
  h1: TimeframeData;
  mainResistance: string;
  minorSr: string;
  mainSupport: string;
  sessions: SessionData[];
}

const emptyTimeframe = (): TimeframeData => ({ signal: "", marketStructure: "", imageUrl: "" });
const emptySession = (time: string): SessionData => ({
  sessionTime: time,
  h1Analysis: "",
  h4Analysis: "",
  chartNotes: "",
  h1ImageUrl: "",
  h4ImageUrl: "",
});

const parseSigTrail = (raw: string): string[] =>
  raw
    .split(/[,\n\t ]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

const formatSigTrail = (items: string[]): string => items.join(",");

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
  const [logs, setLogs] = useState<LogData[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const [autoPasteOpen, setAutoPasteOpen] = useState(false);
  const [autoPasteTf, setAutoPasteTf] = useState<keyof Pick<LogData, "mn" | "w" | "d" | "h4" | "h1">>("mn");

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
    sessions: SESSION_TIMES.map(time => emptySession(time))
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
            h4ImageUrl: existing.h4_image_url || ""
          } : emptySession(time);
        });

        setCurrentLog({
          id: logData.id,
          logDate: date,
          mn: { signal: logData.mn_signal || "", marketStructure: logData.mn_market_structure || "", imageUrl: logData.mn_image_url || "" },
          w: { signal: logData.w_signal || "", marketStructure: logData.w_market_structure || "", imageUrl: logData.w_image_url || "" },
          d: { signal: logData.d_signal || "", marketStructure: logData.d_market_structure || "", imageUrl: logData.d_image_url || "" },
          h4: { signal: logData.h4_signal || "", marketStructure: logData.h4_market_structure || "", imageUrl: logData.h4_image_url || "" },
          h1: { signal: logData.h1_signal || "", marketStructure: logData.h1_market_structure || "", imageUrl: logData.h1_image_url || "" },
          mainResistance: logData.main_resistance || "",
          minorSr: logData.minor_sr || "",
          mainSupport: logData.main_support || "",
          sessions
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
          sessions: SESSION_TIMES.map(time => emptySession(time))
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

  // Preload Thai font for PDF export
  useEffect(() => {
    preloadThaiFont();
  }, []);

  // Upload image
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    const mimeExt = file.type?.split("/")?.[1] || "png";
    const nameExt = file.name?.includes(".") ? file.name.split(".").pop() : undefined;
    const ext = (nameExt || mimeExt || "png").toLowerCase();

    const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("chart-images")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("chart-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Global paste target (because paste events on <div> are unreliable across browsers)
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
        toast({
          title: "ไม่พบรูปในคลิปบอร์ด",
          description: "ให้คัดลอกรูปจาก TradingView ก่อน แล้วค่อยวาง (Ctrl+V)",
          variant: "destructive",
        });
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
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัพโหลดรูปได้", variant: "destructive" });
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [toast, user]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, updateFn: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, "charts");
      updateFn(url);
      toast({ title: "อัพโหลดรูปสำเร็จ" });
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัพโหลดรูปได้", variant: "destructive" });
    } finally {
      // allow re-select same file
      e.target.value = "";
    }
  };

  // Save log
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const dateStr = format(currentLog.logDate, "yyyy-MM-dd");
      
      // Upsert main log
      const logPayload = {
        user_id: user.id,
        log_date: dateStr,
        mn_signal: currentLog.mn.signal,
        mn_market_structure: currentLog.mn.marketStructure,
        mn_image_url: currentLog.mn.imageUrl,
        w_signal: currentLog.w.signal,
        w_market_structure: currentLog.w.marketStructure,
        w_image_url: currentLog.w.imageUrl,
        d_signal: currentLog.d.signal,
        d_market_structure: currentLog.d.marketStructure,
        d_image_url: currentLog.d.imageUrl,
        h4_signal: currentLog.h4.signal,
        h4_market_structure: currentLog.h4.marketStructure,
        h4_image_url: currentLog.h4.imageUrl,
        h1_signal: currentLog.h1.signal,
        h1_market_structure: currentLog.h1.marketStructure,
        h1_image_url: currentLog.h1.imageUrl,
        main_resistance: currentLog.mainResistance,
        minor_sr: currentLog.minorSr,
        main_support: currentLog.mainSupport
      };

      let logId = currentLog.id;
      
      if (logId) {
        await supabase.from("chart_analysis_logs").update(logPayload).eq("id", logId);
      } else {
        const { data } = await supabase.from("chart_analysis_logs").insert(logPayload).select("id").single();
        logId = data?.id;
      }

      if (logId) {
        // Upsert sessions
        for (const session of currentLog.sessions) {
          const sessionPayload = {
            user_id: user.id,
            log_id: logId,
            session_time: session.sessionTime,
            h1_analysis: session.h1Analysis,
            h4_analysis: session.h4Analysis,
            chart_notes: session.chartNotes,
            h1_image_url: session.h1ImageUrl,
            h4_image_url: session.h4ImageUrl
          };

          if (session.id) {
            await supabase.from("chart_analysis_sessions").update(sessionPayload).eq("id", session.id);
          } else {
            await supabase.from("chart_analysis_sessions").insert(sessionPayload);
          }
        }

        setCurrentLog(prev => ({ ...prev, id: logId }));
        toast({ title: "บันทึกสำเร็จ", description: `บันทึกวันที่ ${format(currentLog.logDate, "dd/MM/yyyy")}` });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกได้", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

  const exportToCSV = async () => {
    const data = await fetchLogsForExport(exportStartDate, exportEndDate);
    if (!data.length) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลในช่วงวันที่เลือก", variant: "destructive" });
      return;
    }

    const headers = [
      "วันที่", "MN Signal", "MN Structure", "W Signal", "W Structure", 
      "D Signal", "D Structure", "H4 Signal", "H4 Structure", "H1 Signal", "H1 Structure",
      "แนวต้านหลัก", "รับ-ต้านย่อย", "รับหลัก"
    ];
    
    const rows = data.map(log => [
      log.log_date,
      log.mn_signal || "",
      log.mn_market_structure || "",
      log.w_signal || "",
      log.w_market_structure || "",
      log.d_signal || "",
      log.d_market_structure || "",
      log.h4_signal || "",
      log.h4_market_structure || "",
      log.h1_signal || "",
      log.h1_market_structure || "",
      log.main_resistance || "",
      log.minor_sr || "",
      log.main_support || ""
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.csv`;
    link.click();
    setExportDialogOpen(false);
    toast({ title: "ส่งออกสำเร็จ" });
  };

  // Helper function to load image and convert to base64
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
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
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Generate PDF document (reusable for preview and download)
  const generatePDFDocument = async () => {
    const data = await fetchLogsForExport(exportStartDate, exportEndDate);
    if (!data.length) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลในช่วงวันที่เลือก", variant: "destructive" });
      return null;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Add Thai font support for proper character rendering
    await addThaiFont(doc);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    // Font sizes based on user selection
    const baseFontSize = pdfFontSize;
    const titleFontSize = baseFontSize + 4;
    const headerFontSize = baseFontSize + 2;
    const smallFontSize = baseFontSize - 2;
    const lineHeight = baseFontSize * 0.5;

    // Helper to draw dotted line
    const drawDottedLine = (y: number, startX: number = margin, endX: number = pageWidth - margin) => {
      doc.setDrawColor(150, 150, 150);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(startX, y, endX, y);
      doc.setLineDashPattern([], 0);
    };

    // Helper to add page break if needed
    const checkPageBreak = (yPos: number, requiredSpace: number): number => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };

    for (let logIndex = 0; logIndex < data.length; logIndex++) {
      const log = data[logIndex];
      if (logIndex > 0) doc.addPage();

      let yPos = margin;

      // ========== HEADER SECTION ==========
      // Title: "บันทึกการเดินทางของกราฟ"
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(titleFontSize);
      doc.setTextColor(0, 0, 0);
      doc.text("บันทึกการเดินทางของกราฟ", pageWidth / 2, yPos, { align: "center" });
      yPos += lineHeight + 2;

      // Date
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(baseFontSize);
      doc.text(`วันที่ ${log.log_date}`, pageWidth / 2, yPos, { align: "center" });
      yPos += lineHeight + 6;

      // ========== TF CHECK TABLE ==========
      // Section header
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(headerFontSize);
      doc.text("เช็ค Sig / วงจรกราฟของทุก TF (07.00น.)", margin, yPos);
      yPos += lineHeight + 3;

      // TF data array
      const timeframes = [
        { name: "MN", signal: log.mn_signal || "", structure: log.mn_market_structure || "" },
        { name: "Week", signal: log.w_signal || "", structure: log.w_market_structure || "" },
        { name: "Day", signal: log.d_signal || "", structure: log.d_market_structure || "" },
        { name: "H4", signal: log.h4_signal || "", structure: log.h4_market_structure || "" },
        { name: "H1", signal: log.h1_signal || "", structure: log.h1_market_structure || "" },
      ];

      doc.setFont("Sarabun", "normal");
      doc.setFontSize(baseFontSize);

      for (const tf of timeframes) {
        const signalText = tf.signal || "___";
        const structureText = tf.structure || "___";
        const tfLine = `${tf.name.padEnd(6)} Sig ${signalText} ไล้หลัง Sig ${structureText}`;
        doc.text(tfLine, margin + 5, yPos);
        
        // Draw dotted line to fill the rest
        const textWidth = doc.getTextWidth(tfLine);
        drawDottedLine(yPos, margin + 5 + textWidth + 5);
        yPos += lineHeight + 2;
      }

      yPos += 4;

      // ========== SUPPORT/RESISTANCE SECTION ==========
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(headerFontSize);
      doc.text("กรอบวัน :", margin, yPos);
      yPos += lineHeight + 3;

      doc.setFont("Sarabun", "normal");
      doc.setFontSize(baseFontSize);

      // Main Resistance
      const resistanceText = log.main_resistance || "________________";
      doc.text(`ต้านหลัก: ${resistanceText}`, margin + 20, yPos);
      drawDottedLine(yPos, margin + 20 + doc.getTextWidth(`ต้านหลัก: ${resistanceText}`) + 5);
      yPos += lineHeight + 2;

      // Minor S/R
      const minorSrText = log.minor_sr || "________________";
      doc.text(`รับ-ต้าน ย่อย: ${minorSrText}`, margin + 20, yPos);
      drawDottedLine(yPos, margin + 20 + doc.getTextWidth(`รับ-ต้าน ย่อย: ${minorSrText}`) + 5);
      yPos += lineHeight + 2;

      // Main Support
      const supportText = log.main_support || "________________";
      doc.text(`รับหลัก: ${supportText}`, margin + 20, yPos);
      drawDottedLine(yPos, margin + 20 + doc.getTextWidth(`รับหลัก: ${supportText}`) + 5);
      yPos += lineHeight + 8;

      // ========== SESSIONS SECTION ==========
      const sessions = log.chart_analysis_sessions || [];
      const sessionTimes = ["07:00", "11:00", "15:00", "19:00"];

      for (const sessionTime of sessionTimes) {
        yPos = checkPageBreak(yPos, 40);

        const session = sessions.find((s: { session_time: string }) => s.session_time === sessionTime);

        // Session header
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(headerFontSize);
        doc.text(`${sessionTime.replace(":", ".")} น. H1 / H4`, margin, yPos);
        
        // "ราคากราฟ:" label
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(baseFontSize);
        doc.text("ราคากราฟ:", margin + 50, yPos);
        yPos += lineHeight + 3;

        // Notes lines (H4 Analysis, H1 Analysis, Chart Notes)
        const noteContents = [
          { label: "H4:", text: session?.h4_analysis || "" },
          { label: "H1:", text: session?.h1_analysis || "" },
          { label: "โน้ต:", text: session?.chart_notes || "" },
        ];

        doc.setFont("Sarabun", "normal");
        doc.setFontSize(smallFontSize);

        for (const note of noteContents) {
          if (note.text) {
            // Print label
            doc.setFont("Sarabun", "bold");
            doc.text(note.label, margin + 5, yPos);
            doc.setFont("Sarabun", "normal");
            
            // Split long text into multiple lines using jsPDF's splitTextToSize
            const labelWidth = doc.getTextWidth(note.label + " ");
            const maxTextWidth = contentWidth - 10 - labelWidth;
            const wrappedLines = doc.splitTextToSize(note.text, maxTextWidth);
            
            // Print first line after label
            if (wrappedLines.length > 0) {
              doc.text(wrappedLines[0], margin + 5 + labelWidth, yPos);
            }
            yPos += lineHeight + 1;
            
            // Print remaining lines
            for (let lineIdx = 1; lineIdx < wrappedLines.length; lineIdx++) {
              yPos = checkPageBreak(yPos, lineHeight + 2);
              doc.text(wrappedLines[lineIdx], margin + 10, yPos);
              yPos += lineHeight + 1;
            }
          }
        }

        // Add some spacing after notes
        drawDottedLine(yPos);
        yPos += lineHeight + 6;
      }

      // ========== IMAGES PAGE ==========
      // Add images on a separate page for each log
      const timeframeImages = [
        { name: "MN", url: log.mn_image_url },
        { name: "W", url: log.w_image_url },
        { name: "D", url: log.d_image_url },
        { name: "H4", url: log.h4_image_url },
        { name: "H1", url: log.h1_image_url },
      ].filter(tf => tf.url);

      const sessionImages = sessions.flatMap((s: { session_time: string; h4_image_url?: string; h1_image_url?: string }) => [
        s.h4_image_url ? { name: `${s.session_time} H4`, url: s.h4_image_url } : null,
        s.h1_image_url ? { name: `${s.session_time} H1`, url: s.h1_image_url } : null,
      ]).filter(Boolean);

      const allImages = [...timeframeImages, ...sessionImages];

      if (allImages.length > 0) {
        doc.addPage();
        yPos = margin;

        doc.setFont("Sarabun", "bold");
        doc.setFontSize(titleFontSize);
        doc.text(`รูปภาพประกอบ - ${log.log_date}`, pageWidth / 2, yPos, { align: "center" });
        yPos += lineHeight + 8;

        const imgWidth = (contentWidth - 10) / 2;
        const imgHeight = 50;

        for (let i = 0; i < allImages.length; i += 2) {
          yPos = checkPageBreak(yPos, imgHeight + 15);

          for (let j = 0; j < 2 && i + j < allImages.length; j++) {
            const img = allImages[i + j];
            const xPos = margin + j * (imgWidth + 10);

            // Image label
            doc.setFont("Sarabun", "bold");
            doc.setFontSize(smallFontSize);
            doc.text(img!.name, xPos, yPos);

            // Load and add image
            const imgData = await loadImageAsBase64(img!.url || "");
            if (imgData) {
              try {
                doc.addImage(imgData, "JPEG", xPos, yPos + 3, imgWidth, imgHeight);
              } catch {
                doc.setFillColor(220, 220, 220);
                doc.rect(xPos, yPos + 3, imgWidth, imgHeight, "F");
                doc.setFont("Sarabun", "normal");
                doc.setFontSize(smallFontSize);
                doc.text("ไม่สามารถโหลดรูปได้", xPos + imgWidth / 2, yPos + imgHeight / 2 + 3, { align: "center" });
              }
            }
          }
          yPos += imgHeight + 15;
        }
      }
    }

    return doc;
  };

  // Preview PDF before download
  const previewPDF = async () => {
    setGeneratingPreview(true);
    // Clean up previous URL if exists
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    
    try {
      const doc = await generatePDFDocument();
      if (doc) {
        // Create blob with explicit PDF mime type
        const pdfBlob = doc.output("blob");
        const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
        setPdfPreviewUrl(blobUrl);
        setPdfPreviewOpen(true);
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถสร้าง Preview ได้", variant: "destructive" });
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Download PDF from preview or generate new
  const downloadPDFFromPreview = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = `chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "ส่งออก PDF สำเร็จ", description: "รูปแบบสมุดบันทึก พร้อมรูปภาพ" });
    }
  };

  // Download PDF directly (without preview)
  const exportToPDF = async () => {
    toast({ title: "กำลังสร้าง PDF...", description: "รอสักครู่" });
    try {
      const doc = await generatePDFDocument();
      if (doc) {
        doc.save(`chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`);
        setExportDialogOpen(false);
        closePdfPreview();
        toast({ title: "ส่งออก PDF สำเร็จ", description: "รูปแบบสมุดบันทึก พร้อมรูปภาพ" });
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถส่งออก PDF ได้", variant: "destructive" });
    }
  };

  // Cleanup preview URL on close
  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  };

  // Share PDF via LINE or native share
  const sharePDF = async () => {
    if (!pdfPreviewUrl) return;
    
    try {
      // Convert blob URL to actual blob
      const response = await fetch(pdfPreviewUrl);
      const pdfBlob = await response.blob();
      const fileName = `chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`;
      const file = new (window as any).File([pdfBlob], fileName, { type: "application/pdf" }) as File;
      
      // Check if Web Share API is supported with files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Chart Analysis Report",
          text: `รายงานการวิเคราะห์กราฟ ${format(exportStartDate, "dd/MM/yyyy", { locale: th })} - ${format(exportEndDate, "dd/MM/yyyy", { locale: th })}`
        });
        toast({ title: "แชร์สำเร็จ", description: "ส่งไฟล์ PDF เรียบร้อยแล้ว" });
      } else if (navigator.share) {
        // Fallback: share without file (just text/link)
        await navigator.share({
          title: "Chart Analysis Report",
          text: `รายงานการวิเคราะห์กราฟ ${format(exportStartDate, "dd/MM/yyyy", { locale: th })} - ${format(exportEndDate, "dd/MM/yyyy", { locale: th })}\n\nกรุณาดาวน์โหลด PDF จากแอป`
        });
        toast({ title: "แชร์สำเร็จ", description: "ส่งข้อความเรียบร้อยแล้ว" });
      } else {
        // Fallback for desktop: download and show message
        downloadPDFFromPreview();
        toast({ 
          title: "ไม่รองรับการแชร์โดยตรง", 
          description: "ดาวน์โหลดไฟล์แล้ว กรุณาแชร์ผ่าน LINE ด้วยตนเอง",
          variant: "default"
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Error sharing PDF:", error);
        toast({ 
          title: "เกิดข้อผิดพลาด", 
          description: "ไม่สามารถแชร์ไฟล์ได้ กรุณาดาวน์โหลดและแชร์ด้วยตนเอง", 
          variant: "destructive" 
        });
      }
    }
  };

  // Update timeframe data
  const updateTimeframe = (tf: keyof Pick<LogData, "mn" | "w" | "d" | "h4" | "h1">, field: keyof TimeframeData, value: string) => {
    setCurrentLog(prev => ({
      ...prev,
      [tf]: { ...prev[tf], [field]: value }
    }));
  };

  // Update session data
  const updateSession = (index: number, field: keyof SessionData, value: string) => {
    setCurrentLog(prev => ({
      ...prev,
      sessions: prev.sessions.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const SignalIcon = ({ signal }: { signal: string }) => {
    if (signal === "Buy") return <TrendingUp className="h-4 w-4 text-profit" />;
    if (signal === "Sell") return <TrendingDown className="h-4 w-4 text-loss" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const SigTrailChips = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (next: string) => void;
  }) => {
    const items = useMemo(() => parseSigTrail(value), [value]);
    const [draft, setDraft] = useState("");

    const commitDraft = useCallback(() => {
      const nextItems = [...items, ...parseSigTrail(draft)];
      const uniq = Array.from(new Set(nextItems));
      const trimmed = uniq.map((x) => x.trim()).filter(Boolean).slice(0, 12); // กันยาวเกิน
      onChange(formatSigTrail(trimmed));
      setDraft("");
    }, [draft, items, onChange]);

    const removeItem = useCallback(
      (it: string) => {
        onChange(formatSigTrail(items.filter((x) => x !== it)));
      },
      [items, onChange],
    );

    return (
      <div className="min-h-9 rounded-md border border-input bg-background px-2 py-1 flex flex-wrap items-center gap-1">
        {items.map((it) => (
          <Badge key={it} variant="secondary" className="gap-1">
            <span className="text-xs">{it}</span>
            <button
              type="button"
              className="rounded-sm hover:opacity-80"
              onClick={() => removeItem(it)}
              aria-label={`ลบ ${it}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Backspace" && !draft && items.length) {
              removeItem(items[items.length - 1]);
            }
          }}
          onBlur={() => {
            if (draft.trim()) commitDraft();
          }}
          placeholder={items.length ? "เพิ่ม... (Enter)" : "ไล้หลัง Sig เช่น 1,2,3,4"}
          className="flex-1 min-w-[70px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          inputMode="numeric"
        />
      </div>
    );
  };

  // Compact Table Row for each Timeframe
  const TimeframeRow = ({ 
    label, 
    tf 
  }: { 
    label: string; 
    tf: keyof Pick<LogData, "mn" | "w" | "d" | "h4" | "h1">; 
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    
    return (
      <div className="grid grid-cols-[60px_100px_1fr_auto] sm:grid-cols-[80px_110px_1fr_auto] gap-2 items-center py-3 px-2 border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
        {/* TF Label */}
        <div className="flex items-center gap-1.5">
          <SignalIcon signal={currentLog[tf].signal} />
          <span className="font-semibold text-sm">{label}</span>
        </div>

        {/* Signal Select */}
        <Select 
          value={currentLog[tf].signal} 
          onValueChange={(v) => updateTimeframe(tf, "signal", v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Sig" />
          </SelectTrigger>
          <SelectContent>
            {SIGNALS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Details / Market Structure */}
        <SigTrailChips
          value={currentLog[tf].marketStructure}
          onChange={(next) => updateTimeframe(tf, "marketStructure", next)}
        />

        {/* Image Upload */}
        <div
          ref={dropZoneRef}
          tabIndex={0}
          className="flex items-center gap-1"
          onClick={() => {
            setPasteTarget("charts", (url) => updateTimeframe(tf, "imageUrl", url));
            dropZoneRef.current?.focus();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) {
              try {
                const url = await uploadImage(file, "charts");
                updateTimeframe(tf, "imageUrl", url);
                toast({ title: "อัพโหลดรูปสำเร็จ" });
              } catch {
                toast({ title: "อัพโหลดล้มเหลว", variant: "destructive" });
              }
            }
          }}
        >
          {currentLog[tf].imageUrl ? (
            <div className="relative group">
              <img
                src={currentLog[tf].imageUrl}
                alt={label}
                className="h-10 w-14 object-cover rounded border border-border cursor-pointer hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxUrl(currentLog[tf].imageUrl);
                }}
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTimeframe(tf, "imageUrl", "");
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="h-3 w-3" />
              <span className="hidden sm:inline">รูป</span>
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e, (url) => updateTimeframe(tf, "imageUrl", url))}
        />
      </div>
    );
  };

  // Session Card - extracted as a stable render function to avoid inline component re-creation
  const renderSessionCard = (session: SessionData, index: number) => {
    return (
      <SessionCardContent
        key={session.sessionTime}
        session={session}
        index={index}
        updateSession={updateSession}
        setPasteTarget={setPasteTarget}
        uploadImage={uploadImage}
        handleFileUpload={handleFileUpload}
        setLightboxUrl={setLightboxUrl}
        toast={toast}
      />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 บันทึกการเดินทางของกราฟ</h1>
          <p className="text-muted-foreground">เช็ค Sig ทุก TF และจดบันทึกทุกเซสชัน</p>
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
                        <CalendarComponent
                          mode="single"
                          selected={exportStartDate}
                          onSelect={(date) => date && setExportStartDate(date)}
                        />
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
                        <CalendarComponent
                          mode="single"
                          selected={exportEndDate}
                          onSelect={(date) => date && setExportEndDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>ขนาดตัวอักษร PDF</Label>
                  <Select 
                    value={String(pdfFontSize)} 
                    onValueChange={(v) => setPdfFontSize(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12pt (เล็ก)</SelectItem>
                      <SelectItem value="14">14pt (ปกติ)</SelectItem>
                      <SelectItem value="16">16pt (ใหญ่)</SelectItem>
                      <SelectItem value="18">18pt (ใหญ่มาก)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button onClick={exportToCSV} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    ส่งออก CSV (Excel/Google Sheets)
                  </Button>
                  <Button onClick={previewPDF} variant="secondary" className="gap-2" disabled={generatingPreview}>
                    {generatingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    ดูตัวอย่าง PDF
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" className="gap-2">
                    <File className="h-4 w-4" />
                    ดาวน์โหลด PDF (แบบสมุด)
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
        <Tabs defaultValue="morning" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="morning">เช็ค Sig เช้า (07:00)</TabsTrigger>
            <TabsTrigger value="sessions">บันทึกรอบวัน</TabsTrigger>
          </TabsList>

          <TabsContent value="morning" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">เช็ค Sig / วงจรกราฟ (07:00 น.)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-[60px_100px_1fr_auto] sm:grid-cols-[80px_110px_1fr_auto] gap-2 items-center py-2 px-2 bg-muted/50 border-b border-border/50 text-xs font-medium text-muted-foreground">
                  <span>TF</span>
                  <span>Signal</span>
                  <span>บันทึกไส้ใน</span>
                  <span>Chart</span>
                </div>
                {/* Table Rows */}
                <div className="divide-y divide-border/30">
                  <TimeframeRow label="MN" tf="mn" />
                  <TimeframeRow label="W" tf="w" />
                  <TimeframeRow label="D" tf="d" />
                  <TimeframeRow label="H4" tf="h4" />
                  <TimeframeRow label="H1" tf="h1" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>กรอบวัน (Market Structure)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>ต้านหลัก</Label>
                    <Input 
                      placeholder="ระดับแนวต้านหลัก"
                      value={currentLog.mainResistance}
                      onChange={(e) => setCurrentLog(prev => ({ ...prev, mainResistance: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>รับ-ต้านย่อย</Label>
                    <Input 
                      placeholder="ระดับรับ-ต้านย่อย"
                      value={currentLog.minorSr}
                      onChange={(e) => setCurrentLog(prev => ({ ...prev, minorSr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>รับหลัก</Label>
                    <Input 
                      placeholder="ระดับแนวรับหลัก"
                      value={currentLog.mainSupport}
                      onChange={(e) => setCurrentLog(prev => ({ ...prev, mainSupport: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            {currentLog.sessions.map((session, index) =>
              renderSessionCard(session, index)
            )}
          </TabsContent>
        </Tabs>
      )}

      <Button 
        onClick={handleSave} 
        disabled={saving} 
        className="w-full gradient-emerald"
        size="lg"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        บันทึก
      </Button>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <div className="relative flex items-center justify-center">
            {lightboxUrl && (
              <img
                src={lightboxUrl}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog - In-App Modal */}
      <Dialog open={pdfPreviewOpen} onOpenChange={closePdfPreview}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="text-lg font-bold">📄 ตัวอย่าง PDF</span>
              <div className="flex gap-2">
                <Button onClick={sharePDF} size="lg" variant="outline" className="gap-2">
                  <Share2 className="h-5 w-5" />
                  <span className="hidden sm:inline">แชร์ไลน์</span>
                  <span className="sm:hidden">แชร์</span>
                </Button>
                <Button onClick={downloadPDFFromPreview} size="lg" className="gap-2 gradient-emerald">
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">ดาวน์โหลด PDF</span>
                  <span className="sm:hidden">โหลด</span>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4 pt-2 min-h-0 overflow-hidden">
            {pdfPreviewUrl ? (
              <object
                data={pdfPreviewUrl}
                type="application/pdf"
                className="w-full h-full rounded-lg border"
              >
                {/* Fallback for browsers that don't support object PDF */}
                <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg border">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">เบราว์เซอร์ไม่รองรับการแสดง PDF</p>
                  <p className="text-muted-foreground mb-4">กรุณาดาวน์โหลดไฟล์เพื่อดู</p>
                  <Button onClick={downloadPDFFromPreview} size="lg" className="gap-2 gradient-emerald">
                    <Download className="h-5 w-5" />
                    ดาวน์โหลด PDF
                  </Button>
                </div>
              </object>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
