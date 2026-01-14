import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { BookOpen, Download, Filter } from "lucide-react";

export default function Journal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [trades, setTrades] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchTrades(); }, [user, filter]);

  const fetchTrades = async () => {
    if (!user) return;
    let query = supabase.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: false });
    if (filter === "live") query = query.eq("is_paper_trade", false);
    if (filter === "paper") query = query.eq("is_paper_trade", true);
    const { data } = await query;
    setTrades(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ["Date", "Pair", "Type", "Entry", "SL", "TP", "P/L", "Status"];
    const rows = trades.map(t => [format(new Date(t.trade_date), "yyyy-MM-dd"), t.pair, t.trade_type, t.entry_price, t.stop_loss, t.take_profit, t.profit_loss || 0, t.status]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="h-6 w-6" />{t("journal.title")}</h1>
          <p className="text-muted-foreground">{t("journal.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("journal.allTrades")}</SelectItem>
              <SelectItem value="live">{t("journal.liveOnly")}</SelectItem>
              <SelectItem value="paper">{t("journal.paperOnly")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />{t("journal.exportCSV")}</Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t("journal.date")}</TableHead>
                <TableHead>{t("newTrade.pair")}</TableHead>
                <TableHead>{t("journal.type")}</TableHead>
                <TableHead>{t("journal.entry")}</TableHead>
                <TableHead>{t("journal.status")}</TableHead>
                <TableHead className="text-right">{t("journal.pl")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} className="border-border">
                  <TableCell className="text-muted-foreground">{format(new Date(trade.trade_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="font-medium">{trade.pair}{trade.is_paper_trade && <Badge variant="outline" className="ml-2 text-paper border-paper">Paper</Badge>}</TableCell>
                  <TableCell><Badge variant={trade.trade_type === "buy" ? "default" : "destructive"} className={trade.trade_type === "buy" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>{trade.trade_type.toUpperCase()}</Badge></TableCell>
                  <TableCell>{trade.entry_price || "-"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{trade.status}</Badge></TableCell>
                  <TableCell className={`text-right font-semibold ${(trade.profit_loss || 0) >= 0 ? "text-profit" : "text-loss"}`}>{trade.profit_loss !== null ? `${trade.profit_loss >= 0 ? "+" : ""}$${trade.profit_loss.toFixed(2)}` : "-"}</TableCell>
                </TableRow>
              ))}
              {trades.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("journal.noTrades")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
