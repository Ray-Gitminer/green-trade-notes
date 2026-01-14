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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  Loader2, Save, Calendar, Image, Upload, X, Download, FileSpreadsheet, 
  FileText, Clock, TrendingUp, TrendingDown, Minus, Plus, Trash2, File
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SIGNALS = ["Buy", "Sell", "Neutral"];
const SESSION_TIMES = ["07:00", "11:00", "15:00", "19:00"];

interface TimeframeData {
  signal: string;
  marketStructure: string;
  imageUrl: string;
}

interface SessionData {
  id?: string;
  sessionTime: string;
  h1Analysis: string;
  h4Analysis: string;
  chartNotes: string;
  h1ImageUrl: string;
  h4ImageUrl: string;
}

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
  sessionTime: time, h1Analysis: "", h4Analysis: "", chartNotes: "", h1ImageUrl: "", h4ImageUrl: "" 
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
  const [logs, setLogs] = useState<LogData[]>([]);
  
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
      const { data: logData } = await supabase
        .from("chart_analysis_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateStr)
        .single();

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

  // Upload image
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from("chart-images")
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data } = supabase.storage.from("chart-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Handle paste for image
  const handlePaste = async (e: React.ClipboardEvent, updateFn: (url: string) => void) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const url = await uploadImage(file, "charts");
            updateFn(url);
            toast({ title: "อัพโหลดรูปสำเร็จ" });
          } catch (error) {
            toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัพโหลดรูปได้", variant: "destructive" });
          }
        }
      }
    }
  };

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

  const exportToPDF = async () => {
    const data = await fetchLogsForExport(exportStartDate, exportEndDate);
    if (!data.length) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่พบข้อมูลในช่วงวันที่เลือก", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    
    // Title
    doc.setFontSize(18);
    doc.text("Chart Analysis Log", 14, 20);
    doc.setFontSize(10);
    doc.text(`${format(exportStartDate, "dd/MM/yyyy")} - ${format(exportEndDate, "dd/MM/yyyy")}`, 14, 28);
    
    // Table data
    const tableData = data.map(log => [
      log.log_date,
      `${log.mn_signal || "-"} / ${log.mn_market_structure || "-"}`,
      `${log.w_signal || "-"} / ${log.w_market_structure || "-"}`,
      `${log.d_signal || "-"} / ${log.d_market_structure || "-"}`,
      `${log.h4_signal || "-"} / ${log.h4_market_structure || "-"}`,
      `${log.h1_signal || "-"} / ${log.h1_market_structure || "-"}`,
      log.main_resistance || "-",
      log.minor_sr || "-",
      log.main_support || "-"
    ]);

    (doc as any).autoTable({
      head: [["Date", "MN", "W", "D", "H4", "H1", "Resistance", "S/R", "Support"]],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`chart-analysis-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}.pdf`);
    setExportDialogOpen(false);
    toast({ title: "ส่งออก PDF สำเร็จ" });
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

  const TimeframeCard = ({ 
    label, 
    tf 
  }: { 
    label: string; 
    tf: keyof Pick<LogData, "mn" | "w" | "d" | "h4" | "h1">; 
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{label}</Label>
          <SignalIcon signal={currentLog[tf].signal} />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select 
            value={currentLog[tf].signal} 
            onValueChange={(v) => updateTimeframe(tf, "signal", v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Signal" />
            </SelectTrigger>
            <SelectContent>
              {SIGNALS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Input 
            placeholder="ไล้หลัง Sig"
            value={currentLog[tf].marketStructure}
            onChange={(e) => updateTimeframe(tf, "marketStructure", e.target.value)}
            className="h-9"
          />
        </div>

        <div 
          className="border-2 border-dashed border-border/50 rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[100px] flex flex-col items-center justify-center"
          onPaste={(e) => handlePaste(e, (url) => updateTimeframe(tf, "imageUrl", url))}
          onClick={() => fileInputRef.current?.click()}
        >
          {currentLog[tf].imageUrl ? (
            <div className="relative w-full">
              <img 
                src={currentLog[tf].imageUrl} 
                alt={label} 
                className="max-h-32 mx-auto rounded object-contain"
              />
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-0 right-0 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  updateTimeframe(tf, "imageUrl", "");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <Image className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">วาง (Ctrl+V) หรือคลิกอัพโหลด</p>
            </>
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

  const SessionCard = ({ session, index }: { session: SessionData; index: number }) => {
    const h1InputRef = useRef<HTMLInputElement>(null);
    const h4InputRef = useRef<HTMLInputElement>(null);
    
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {session.sessionTime} น. H1 / H4
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="สภาพกราฟ / บันทึก"
            value={session.chartNotes}
            onChange={(e) => updateSession(index, "chartNotes", e.target.value)}
            className="min-h-[60px]"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">H1 Chart</Label>
              <div 
                className="border-2 border-dashed border-border/50 rounded-lg p-2 text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[80px] flex flex-col items-center justify-center"
                onPaste={(e) => handlePaste(e, (url) => updateSession(index, "h1ImageUrl", url))}
                onClick={() => h1InputRef.current?.click()}
              >
                {session.h1ImageUrl ? (
                  <div className="relative w-full">
                    <img src={session.h1ImageUrl} alt="H1" className="max-h-20 mx-auto rounded object-contain" />
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-0 right-0 h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); updateSession(index, "h1ImageUrl", ""); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    วาง/อัพโหลด
                  </div>
                )}
              </div>
              <input ref={h1InputRef} type="file" accept="image/*" className="hidden" 
                onChange={(e) => handleFileUpload(e, (url) => updateSession(index, "h1ImageUrl", url))} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">H4 Chart</Label>
              <div 
                className="border-2 border-dashed border-border/50 rounded-lg p-2 text-center cursor-pointer hover:border-primary/50 transition-colors min-h-[80px] flex flex-col items-center justify-center"
                onPaste={(e) => handlePaste(e, (url) => updateSession(index, "h4ImageUrl", url))}
                onClick={() => h4InputRef.current?.click()}
              >
                {session.h4ImageUrl ? (
                  <div className="relative w-full">
                    <img src={session.h4ImageUrl} alt="H4" className="max-h-20 mx-auto rounded object-contain" />
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-0 right-0 h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); updateSession(index, "h4ImageUrl", ""); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    วาง/อัพโหลด
                  </div>
                )}
              </div>
              <input ref={h4InputRef} type="file" accept="image/*" className="hidden" 
                onChange={(e) => handleFileUpload(e, (url) => updateSession(index, "h4ImageUrl", url))} />
            </div>
          </div>
        </CardContent>
      </Card>
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
                
                <div className="flex flex-col gap-2">
                  <Button onClick={exportToCSV} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    ส่งออก CSV (Excel/Google Sheets)
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" className="gap-2">
                    <File className="h-4 w-4" />
                    ส่งออก PDF
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
              <CardHeader>
                <CardTitle>เช็ค Sig ทุก TF (07:00 น.)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <TimeframeCard label="MN (Monthly)" tf="mn" />
                  <TimeframeCard label="W (Weekly)" tf="w" />
                  <TimeframeCard label="D (Daily)" tf="d" />
                  <TimeframeCard label="H4" tf="h4" />
                  <TimeframeCard label="H1" tf="h1" />
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
            {currentLog.sessions.map((session, index) => (
              <SessionCard key={session.sessionTime} session={session} index={index} />
            ))}
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
    </div>
  );
}
