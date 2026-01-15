import { useRef, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Upload, X, Eraser } from "lucide-react";

interface SessionData {
  id?: string;
  sessionTime: string;
  h1Analysis: string;
  h4Analysis: string;
  chartNotes: string;
  h1ImageUrl: string;
  h4ImageUrl: string;
}

interface SessionCardContentProps {
  session: SessionData;
  index: number;
  updateSession: (index: number, field: keyof SessionData, value: string) => void;
  clearSessionNotes: (index: number) => void;
  setPasteTarget: (folder: string, updateFn: (url: string) => void) => void;
  uploadImage: (file: File, folder: string) => Promise<string>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, updateFn: (url: string) => void) => void;
  setLightboxUrl: (url: string | null) => void;
  toast: (props: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const SessionCardContent = memo(function SessionCardContent({
  session,
  index,
  updateSession,
  clearSessionNotes,
  setPasteTarget,
  uploadImage,
  handleFileUpload,
  setLightboxUrl,
  toast,
}: SessionCardContentProps) {
  const h1InputRef = useRef<HTMLInputElement>(null);
  const h4InputRef = useRef<HTMLInputElement>(null);
  const h1DropZoneRef = useRef<HTMLDivElement>(null);
  const h4DropZoneRef = useRef<HTMLDivElement>(null);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {session.sessionTime} น. H1 / H4
          </div>
          {session.chartNotes && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={() => clearSessionNotes(index)}
            >
              <Eraser className="h-4 w-4" />
              <span className="hidden sm:inline">ล้างบันทึก</span>
            </Button>
          )}
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
              ref={h1DropZoneRef}
              tabIndex={0}
              className="border-2 border-dashed border-border/50 rounded-lg p-2 text-center hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors min-h-[80px] flex flex-col items-center justify-center"
              onClick={() => {
                setPasteTarget("charts", (url) => updateSession(index, "h1ImageUrl", url));
                h1DropZoneRef.current?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  h1InputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add("border-primary", "bg-primary/5");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  try {
                    const url = await uploadImage(file, "charts");
                    updateSession(index, "h1ImageUrl", url);
                    toast({ title: "อัพโหลดรูปสำเร็จ" });
                  } catch {
                    toast({ title: "อัพโหลดล้มเหลว", variant: "destructive" });
                  }
                }
              }}
            >
              {session.h1ImageUrl ? (
                <div className="relative w-full group cursor-pointer">
                  <img
                    src={session.h1ImageUrl}
                    alt="H1"
                    className="max-h-20 mx-auto rounded object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(session.h1ImageUrl);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-medium">คลิกเพื่อขยาย</span>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-0 right-0 h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSession(index, "h1ImageUrl", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground space-y-2">
                  <div>
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    <div>ลากรูปวาง หรือคลิกแล้ว Ctrl+V</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      h1InputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    อัพโหลด
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={h1InputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, (url) => updateSession(index, "h1ImageUrl", url))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">H4 Chart</Label>
            <div
              ref={h4DropZoneRef}
              tabIndex={0}
              className="border-2 border-dashed border-border/50 rounded-lg p-2 text-center hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors min-h-[80px] flex flex-col items-center justify-center"
              onClick={() => {
                setPasteTarget("charts", (url) => updateSession(index, "h4ImageUrl", url));
                h4DropZoneRef.current?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  h4InputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add("border-primary", "bg-primary/5");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  try {
                    const url = await uploadImage(file, "charts");
                    updateSession(index, "h4ImageUrl", url);
                    toast({ title: "อัพโหลดรูปสำเร็จ" });
                  } catch {
                    toast({ title: "อัพโหลดล้มเหลว", variant: "destructive" });
                  }
                }
              }}
            >
              {session.h4ImageUrl ? (
                <div className="relative w-full group cursor-pointer">
                  <img
                    src={session.h4ImageUrl}
                    alt="H4"
                    className="max-h-20 mx-auto rounded object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(session.h4ImageUrl);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-medium">คลิกเพื่อขยาย</span>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-0 right-0 h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSession(index, "h4ImageUrl", "");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground space-y-2">
                  <div>
                    <Upload className="h-5 w-5 mx-auto mb-1" />
                    <div>ลากรูปวาง หรือคลิกแล้ว Ctrl+V</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      h4InputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    อัพโหลด
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={h4InputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, (url) => updateSession(index, "h4ImageUrl", url))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default SessionCardContent;
export type { SessionData };
