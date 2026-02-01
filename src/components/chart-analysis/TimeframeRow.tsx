import { useRef, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Loader2, Upload, X, ClipboardPaste } from "lucide-react";

const SIGNALS = ["Buy", "Sell", "Neutral"];

interface TimeframeData {
  signal: string;
  marketStructure: string;
  imageUrl: string;
}

interface TimeframeRowProps {
  label: string;
  tfKey: string;
  data: TimeframeData;
  onSignalChange: (value: string) => void;
  onMarketStructureChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onImageClick: (url: string) => void;
  uploadImage: (file: File, folder: string) => Promise<string>;
  setPasteTarget: (folder: string, updateFn: (url: string) => void) => void;
  toast: (props: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const SignalIcon = memo(function SignalIcon({ signal }: { signal: string }) {
  if (signal === "Buy") return <TrendingUp className="h-4 w-4 text-profit" />;
  if (signal === "Sell") return <TrendingDown className="h-4 w-4 text-loss" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
});

const TimeframeRow = memo(function TimeframeRow({
  label,
  tfKey,
  data,
  onSignalChange,
  onMarketStructureChange,
  onImageUrlChange,
  onImageClick,
  uploadImage,
  setPasteTarget,
  toast,
}: TimeframeRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [pasting, setPasting] = useState(false);

  const handleQuickPaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPasting(true);

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const url = await uploadImage(blob as File, "charts");
          onImageUrlChange(url);
          toast({ title: "วางรูปจาก Clipboard สำเร็จ" });
          return;
        }
      }
      toast({
        title: "ไม่พบรูปในคลิปบอร์ด",
        description: "ให้คัดลอกรูปจาก TradingView ก่อน (Ctrl+C)",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "ใช้ Ctrl+V แทน",
        description: "คลิกที่ช่องแล้วกด Ctrl+V เพื่อวางรูป",
      });
      setPasteTarget("charts", onImageUrlChange);
      dropZoneRef.current?.focus();
    } finally {
      setPasting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, "charts");
      onImageUrlChange(url);
      toast({ title: "อัพโหลดรูปสำเร็จ" });
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัพโหลดรูปได้", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="grid grid-cols-[60px_100px_1fr_auto] sm:grid-cols-[80px_110px_1fr_auto] gap-2 items-center py-3 px-2 border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
      {/* TF Label */}
      <div className="flex items-center gap-1.5">
        <SignalIcon signal={data.signal} />
        <span className="font-semibold text-sm">{label}</span>
      </div>

      {/* Signal Select */}
      <Select value={data.signal} onValueChange={onSignalChange}>
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

      {/* Details / Market Structure - Expanded Textarea */}
      <Textarea
        value={data.marketStructure}
        onChange={(e) => onMarketStructureChange(e.target.value)}
        placeholder="ไล้หลัง Sig เช่น 1,2,3,4"
        className="flex-1 min-h-[56px] resize-none text-sm break-words"
        maxLength={800}
      />

      {/* Image Upload with Quick Paste */}
      <div
        ref={dropZoneRef}
        tabIndex={0}
        className="flex items-center gap-1"
        onClick={() => {
          setPasteTarget("charts", onImageUrlChange);
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
              onImageUrlChange(url);
              toast({ title: "อัพโหลดรูปสำเร็จ" });
            } catch {
              toast({ title: "อัพโหลดล้มเหลว", variant: "destructive" });
            }
          }
        }}
      >
        {data.imageUrl ? (
          <div className="relative group">
            <img
              src={data.imageUrl}
              alt={label}
              className="h-10 w-14 object-cover rounded border border-border cursor-pointer hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(data.imageUrl);
              }}
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onImageUrlChange("");
              }}
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleQuickPaste}
              disabled={pasting}
              title="วางรูปจาก Clipboard (Ctrl+V)"
            >
              {pasting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardPaste className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
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
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
});

export default TimeframeRow;
export type { TimeframeData };
