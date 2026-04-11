import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface TimeframeExtended {
  signal: string;
  marketStructure: string;
  imageUrl: string;
  tp1: string;
  tp2: string;
  checkpoint: string;
}

interface GreenPenTableProps {
  mn: TimeframeExtended;
  w: TimeframeExtended;
  d: TimeframeExtended;
  h4: TimeframeExtended;
  h1: TimeframeExtended;
  mainResistance: string;
  minorSr: string;
  mainSupport: string;
  onUpdate: (tf: string, field: string, value: string) => void;
  onSrUpdate: (field: string, value: string) => void;
}

const TF_ROWS: { key: string; label: string; hasTP2: boolean }[] = [
  { key: "mn", label: "Month", hasTP2: false },
  { key: "w", label: "Week", hasTP2: true },
  { key: "d", label: "Day", hasTP2: true },
  { key: "h4", label: "H4", hasTP2: true },
  { key: "h1", label: "H1", hasTP2: false },
];

const GreenPenTable = memo(function GreenPenTable({
  mn, w, d, h4, h1,
  mainResistance, minorSr, mainSupport,
  onUpdate, onSrUpdate,
}: GreenPenTableProps) {
  const data: Record<string, TimeframeExtended> = { mn, w, d, h4, h1 };

  const handleSignalToggle = (tfKey: string, type: "Buy" | "Sell") => {
    const current = data[tfKey].signal;
    onUpdate(tfKey, "signal", current === type ? "" : type);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth: 700 }}>
        <thead>
          <tr className="bg-emerald-900/80 text-emerald-50">
            <th className="border border-emerald-700/60 px-2 py-2 text-left font-semibold w-[70px]">TF</th>
            <th className="border border-emerald-700/60 px-2 py-2 text-center font-semibold w-[85px]">Sig</th>
            <th className="border border-emerald-700/60 px-2 py-2 text-left font-semibold w-[100px]">ไส้หลัง Sig</th>
            <th className="border border-emerald-700/60 px-2 py-2 text-center font-semibold w-[160px]">Take Profit</th>
            <th className="border border-emerald-700/60 px-2 py-2 text-center font-semibold w-[70px]">จุดเช็ค</th>
            <th className="border border-emerald-700/60 px-2 py-2 text-center font-semibold" colSpan={2}>กรอบวัน</th>
          </tr>
        </thead>
        <tbody>
          {TF_ROWS.map((tf) => {
            const tfData = data[tf.key];
            const isFirst = tf.key === "mn";

            return (
              <>
                <tr key={tf.key} className="border-b border-emerald-800/30 hover:bg-emerald-950/20 transition-colors">
                  {/* TF Label */}
                  <td className="border border-emerald-800/30 px-2 py-2 font-bold text-foreground">
                    {tf.label}
                  </td>
                  {/* Signal checkboxes */}
                  <td className="border border-emerald-800/30 px-1 py-1">
                    <div className="flex items-center justify-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          checked={tfData.signal === "Buy"}
                          onCheckedChange={() => handleSignalToggle(tf.key, "Buy")}
                          className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <span className="text-xs text-emerald-400">B</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          checked={tfData.signal === "Sell"}
                          onCheckedChange={() => handleSignalToggle(tf.key, "Sell")}
                          className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <span className="text-xs text-red-400">S</span>
                      </label>
                    </div>
                  </td>
                  {/* ไส้หลัง Sig - narrower */}
                  <td className="border border-emerald-800/30 px-1 py-1">
                    <Input
                      value={tfData.marketStructure}
                      onChange={(e) => onUpdate(tf.key, "marketStructure", e.target.value)}
                      placeholder="ไส้หลัง..."
                      className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500"
                    />
                  </td>
                  {/* Take Profit - TP1 & TP2 on same line */}
                  <td className="border border-emerald-800/30 px-1 py-1 text-center">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">TP</span>
                      <Input
                        value={tfData.tp1}
                        onChange={(e) => onUpdate(tf.key, "tp1", e.target.value)}
                        className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 flex-1 min-w-0"
                      />
                      {tf.hasTP2 && (
                        <>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">2</span>
                          <Input
                            value={tfData.tp2}
                            onChange={(e) => onUpdate(tf.key, "tp2", e.target.value)}
                            className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 flex-1 min-w-0"
                          />
                        </>
                      )}
                    </div>
                  </td>
                  {/* จุดเช็ค */}
                  <td className="border border-emerald-800/30 px-1 py-1">
                    <Input
                      value={tfData.checkpoint}
                      onChange={(e) => onUpdate(tf.key, "checkpoint", e.target.value)}
                      className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 text-center"
                    />
                  </td>
                  {/* กรอบวัน */}
                  {isFirst && (
                    <>
                      <td className="border border-emerald-800/30 px-1 py-1 text-center text-xs" rowSpan={2}>
                        <div className="space-y-1">
                          <span className="text-emerald-400 font-medium">ต้านหลัก</span>
                          <Input
                            value={mainResistance}
                            onChange={(e) => onSrUpdate("mainResistance", e.target.value)}
                            className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 text-center"
                            readOnly
                          />
                        </div>
                      </td>
                      <td className="border border-emerald-800/30 px-1 py-1 text-center text-xs" rowSpan={2}>
                        <div className="space-y-1">
                          <span className="text-yellow-400 font-medium">รับต้านย่อย</span>
                          <Input
                            value={minorSr}
                            onChange={(e) => onSrUpdate("minorSr", e.target.value)}
                            placeholder="กรอกค่า..."
                            className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 text-center"
                          />
                        </div>
                      </td>
                    </>
                  )}
                  {tf.key === "d" && (
                    <td className="border border-emerald-800/30 px-1 py-1 text-center text-xs" colSpan={2} rowSpan={3}>
                      <div className="space-y-1">
                        <span className="text-emerald-400 font-medium">รับหลัก</span>
                        <Input
                          value={mainSupport}
                          onChange={(e) => onSrUpdate("mainSupport", e.target.value)}
                          className="h-7 text-xs bg-transparent border-emerald-800/40 focus:border-emerald-500 text-center"
                          readOnly
                        />
                      </div>
                    </td>
                  )}
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default GreenPenTable;
export type { TimeframeExtended };
