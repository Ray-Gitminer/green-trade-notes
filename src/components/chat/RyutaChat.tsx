import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, Bot, User, ImagePlus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import SaveToTradeDialog from "./SaveToTradeDialog";

interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface Message {
  role: "user" | "assistant";
  content: string | MessageContent[];
}

interface RyutaChatProps {
  open: boolean;
  onClose: () => void;
}

export default function RyutaChat({ open, onClose }: RyutaChatProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    if (user && open && messages.length === 0) {
      loadChatHistory();
    }
  }, [user, open]);

  const loadChatHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role,
      content,
    });
  };

  // Handle paste event for images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImageFile(file);
        }
      }
    }
  }, []);

  const processImageFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === "th" ? "รูปใหญ่เกินไป" : "Image too large",
        description: language === "th" ? "กรุณาใช้รูปขนาดไม่เกิน 5MB" : "Please use images under 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPendingImages(prev => [...prev, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveToTrade = (analysisText: string) => {
    setSelectedAnalysis(analysisText);
    setSaveDialogOpen(true);
  };

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ryuta-chat`;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: [...messages, userMessage]
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        throw new Error(language === "th" ? "ใช้งานเกินลิมิต กรุณารอสักครู่" : "Rate limit exceeded. Please try again later.");
      }
      if (resp.status === 402) {
        throw new Error(language === "th" ? "เครดิตหมด กรุณาเติมเครดิต" : "Usage limit reached. Please add credits.");
      }
      throw new Error(language === "th" ? "ไม่สามารถเชื่อมต่อ Ryuta ได้" : "Failed to connect to Ryuta");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;

    // Build message content
    let userMessage: Message;
    const textContent = input.trim();
    
    if (pendingImages.length > 0) {
      // Multimodal message with images
      const content: MessageContent[] = [];
      
      // Add images first
      pendingImages.forEach(img => {
        content.push({
          type: "image_url",
          image_url: { url: img }
        });
      });
      
      // Add text
      content.push({
        type: "text",
        text: textContent || (language === "th" ? "วิเคราะห์ชาร์ตนี้ให้หน่อยครับ" : "Please analyze this chart")
      });
      
      userMessage = { role: "user", content };
    } else {
      userMessage = { role: "user", content: textContent };
    }

    setInput("");
    setPendingImages([]);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save text version for history
      const textForHistory = typeof userMessage.content === "string" 
        ? userMessage.content 
        : (language === "th" ? "[รูปภาพ] " : "[Image] ") + (userMessage.content.find(c => c.type === "text")?.text || "");
      
      await saveMessage("user", textForHistory);
      const assistantResponse = await streamChat(userMessage);
      await saveMessage("assistant", assistantResponse);
    } catch (error) {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Chat Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageText = (content: string | MessageContent[]): string => {
    if (typeof content === "string") return content;
    const textPart = content.find(c => c.type === "text");
    return textPart?.text || "";
  };

  const getMessageImages = (content: string | MessageContent[]): string[] => {
    if (typeof content === "string") return [];
    return content
      .filter(c => c.type === "image_url")
      .map(c => c.image_url?.url || "")
      .filter(Boolean);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Ryuta Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {language === "th" ? "วิเคราะห์ชาร์ต & ที่ปรึกษาเทรด" : "Chart Analyst & Trading Mentor"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-primary/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {language === "th" 
                ? "สวัสดีครับพี่เรย์! ริวตะพร้อมวิเคราะห์ชาร์ตและให้คำปรึกษาเทรดครับ" 
                : "Hi P'Ray! I'm Ryuta, ready to analyze charts and help with trading."}
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-left text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {language === "th" ? "💡 วิธีใช้:" : "💡 How to use:"}
              </p>
              <p>• {language === "th" ? "Ctrl+V วางรูปชาร์ตจาก TradingView" : "Ctrl+V to paste chart from TradingView"}</p>
              <p>• {language === "th" ? "คลิก 📷 เพื่ออัปโหลดรูป" : "Click 📷 to upload image"}</p>
              <p>• {language === "th" ? "ถามเกี่ยวกับ PA, ICT, แนวรับ-ต้าน" : "Ask about PA, ICT, S/R levels"}</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const images = getMessageImages(msg.content);
            const text = getMessageText(msg.content);
            
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {/* Show images if any */}
                  {images.length > 0 && (
                    <div className="mb-2 grid gap-2">
                      {images.map((img, imgIdx) => (
                        <img 
                          key={imgIdx} 
                          src={img} 
                          alt="Chart" 
                          className="rounded max-h-48 object-contain"
                        />
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{text}</p>
                  
                  {/* Save to Trade button for assistant messages */}
                  {msg.role === "assistant" && text.length > 50 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveToTrade(text)}
                      className="mt-2 h-7 text-xs text-muted-foreground hover:text-primary gap-1"
                    >
                      <Save className="h-3 w-3" />
                      {language === "th" ? "บันทึกลงเทรด" : "Save to Trade"}
                    </Button>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <span className="text-muted-foreground text-sm">
                  {language === "th" ? "กำลังวิเคราะห์..." : "Analyzing..."}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex gap-2 overflow-x-auto">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img src={img} alt="Pending" className="h-16 w-16 object-cover rounded" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder={language === "th" ? "พิมพ์หรือวางรูปชาร์ต..." : "Type or paste chart image..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            onPaste={handlePaste}
            className="bg-input border-border"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={((!input.trim() && pendingImages.length === 0) || isLoading)}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Save to Trade Dialog */}
      <SaveToTradeDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        analysisText={selectedAnalysis}
      />
    </div>
  );
}
