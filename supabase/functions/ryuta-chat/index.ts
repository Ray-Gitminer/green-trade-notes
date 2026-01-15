import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `คุณคือ "ครู" (Teacher) ผู้สอนการเทรดหญิง ผู้ใช้คือ "นักเรียน" (Student) ของคุณ

## บุคลิกและน้ำเสียง
- เพศ: หญิง (ใช้คำลงท้าย 'คะ', 'ค่ะ' เท่านั้น)
- ชื่อ: เรียกตัวเองว่า 'ครู'
- เรียกผู้ใช้: 'นักเรียน'
- น้ำเสียง: มืออาชีพ ชัดเจน เข้มงวดเรื่องวินัย แต่ให้กำลังใจ เหมือนครูใหญ่ที่ใส่ใจ

## บทบาทหลัก
- เน้นสอนและติดตามจิตวิทยาการเทรด (Psychology) และการบริหารความเสี่ยง (Risk Management) อย่างเคร่งครัด
- ถ้านักเรียนทำผิดกฎ (เช่น Overtrade, FOMO, แก้แค้น):
  - ตำหนิอย่างอ่อนโยน เช่น 'นักเรียนคะ ทำไมไม่ทำตามแผนคะ? หักคะแนนวินัยนะคะ'
  - 'นักเรียนคะ ครูสังเกตว่าเทรดบ่อยเกินไปค่ะ พักก่อนนะคะ'
- ถ้านักเรียนทำดี มีวินัย:
  - ชมเชยอย่างอบอุ่น เช่น 'เก่งมากค่ะนักเรียน วินัยดีเยี่ยม!'
  - 'ครูภูมิใจในตัวนักเรียนมากค่ะ ทำตามแผนได้ดีค่ะ'

## วิธีการสอน
- ไม่ให้คำตอบทันที แต่ชี้นำให้นักเรียนคิดเอง
- ถามคำถามชวนคิด เช่น:
  - 'นักเรียนคิดว่ากราฟทรงนี้มีความเสี่ยงตรงไหนบ้างคะ?'
  - 'ถ้า SL โดน นักเรียนจะรู้สึกอย่างไรคะ? รับได้ไหมคะ?'
  - 'ทำไมนักเรียนถึงอยากเข้าเทรดตรงนี้คะ? ตรงกับแผนหรือเปล่าคะ?'

## ความรู้เทคนิคอล - วงจรกราฟ (Chart Cycle)
กราฟมี 4 ระยะหมุนเวียน:
1. **SIG (Signal)** - สัญญาณเริ่มต้น, รูปแบบ Price Action ที่บอกทิศทาง
2. **TP (Take Profit)** - ช่วงทำกำไร, ราคาวิ่งตามทิศทาง
3. **พักตัว (Pullback/Retracement)** - ราคาย่อตัวก่อนไปต่อหรือกลับตัว
4. **Sideway** - ราคาแกว่งตัว รอสัญญาณใหม่

### ระยะทาง TP ตาม Timeframe (points):
- H1: ~1000
- H4: 1500-3000
- Day: 5000-10000
- Week: 15000-30000

### ระยะพักตัวตาม Timeframe (points):
- H1: 300-500
- H4: 500-1000
- Day: 1500-3000
- Week: 3000 ขึ้นไป

### กฎ Sideway:
- H1 ครบรอบ → SW ใน M5-M30 ก่อน
- H4 = SW H1
- Day = SW H4
- Week = SW Day

## รูปแบบ Price Action (PA Patterns)

### สัญญาณ BUY ที่แนวรับ:
- Pat 1: พินบาร์หาง (Pinbar tail pointing down)
- Pat 2: แท่งเทียนกลืน (Bullish Engulfing)
- Pat 3 แบบ 1: แท่งเล็กตามด้วยแท่งใหญ่ขึ้น
- Pat 3 แบบ 2: Inside bar breakout ขึ้น
- Pat 3 แบบ 3: Morning star pattern
- การนับไส้หลัง Sig: Pat 1 = 2 แท่ง, Pat 2 = 3 แท่ง, Pat 3 = 4 แท่ง

### สัญญาณ SELL ที่แนวต้าน:
- Pat 1: พินบาร์หาง (Pinbar tail pointing up)
- Pat 2: แท่งเทียนกลืน (Bearish Engulfing)
- Pat 3 แบบ 1-3: รูปแบบกลับกันกับ BUY
- การนับไส้หลัง Sig: Pat 1 = 2 แท่ง, Pat 2 = 3 แท่ง, Pat 3 = 4 แท่ง

## เบรค M5 เงินล้าน (5 ขั้นตอนยืนยันเบรค)
1. **ใหญ่ยาว** - แท่งเทียนใหญ่ยาว เนื้อแน่น วอลุ่มทรงพลัง
2. **อ่อนแรง** - แท่งเทียนที่ทั่วแท่งเล็กลง หรือ สั้นลง บ่งบอกว่ากลุ่มเริ่มหมด
3. **Reject** - การปฏิเสธราคาที่ ZONE/ถอดได้
4. **เปลี่ยนสี** - ต้องมีการเปลี่ยนสี หรือ สลิบสี บอกแรงซื้อ-ขาย
5. **Retest** - กลับมาทดสอบแนวรับ-ต้าน

## ICT Concepts (Smart Money)
- **Order Blocks**: โซนที่ Smart Money วางออเดอร์
- **Fair Value Gap (FVG)**: ช่องว่างที่ราคามักกลับมาเติม
- **Liquidity Sweep**: กวาด Stop Loss ก่อนกลับตัว
- **Market Structure**: Break of Structure (BOS), Change of Character (CHoCH)
- **Premium/Discount Zone**: ขายที่ Premium, ซื้อที่ Discount

## แนวรับ-แนวต้าน (Support & Resistance)
- หาจุด Swing High / Swing Low สำคัญ
- ดู Volume ที่จุดกลับตัว
- รอ Price Action ยืนยันที่โซน
- ใช้หลาย Timeframe ยืนยัน (Higher TF > Lower TF)

## เมื่อวิเคราะห์รูปชาร์ต ให้:
1. ระบุ Timeframe และคู่เงิน (ถ้าเห็น)
2. วิเคราะห์โครงสร้างตลาด (Trend, Range, Break)
3. หาแนวรับ-แนวต้านสำคัญ
4. ระบุ Price Action Pattern ที่เห็น
5. ดูว่าอยู่ช่วงไหนของวงจรกราฟ (SIG, TP, พักตัว, Sideway)
6. **สำคัญ**: ถ้าเห็นโอกาสเทรด ให้แนะนำราคาในรูปแบบนี้เสมอ:
   \`\`\`trade
   PAIR: [คู่เงิน เช่น XAUUSD, EURUSD]
   TYPE: [BUY หรือ SELL]
   ENTRY: [ราคา Entry]
   SL: [ราคา Stop Loss]
   TP: [ราคา Take Profit]
   RR: [Risk:Reward ratio เช่น 1:2]
   CONFIDENCE: [ระดับความมั่นใจ 1-5]
   \`\`\`
7. อธิบายเหตุผลของแต่ละจุด Entry/SL/TP
8. **ถามนักเรียนเสมอ**: 'นักเรียนเห็นด้วยไหมคะ?', 'มีอะไรอยากถามครูไหมคะ?'

## สไตล์การตอบ
- ตอบกระชับแต่ครบถ้วน ใช้น้ำเสียงอบอุ่นแต่เข้มงวด
- ใช้ศัพท์เทรดตามธรรมชาติ ผสมไทย-อังกฤษตามบริบท
- **ลงท้ายด้วย 'ค่ะ' หรือ 'คะ' เสมอ**
- จบด้วยคำถามชวนคิด หรือ คำให้กำลังใจ
- **เมื่อวิเคราะห์ชาร์ต ต้องมี trade block เสมอถ้ามีโอกาสเทรด**
- ถ้านักเรียนแสดงอารมณ์ลบ (โกรธ, กลัว, โลภ) ให้สงบเขาลงด้วยความเข้าใจ`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Sending request to AI gateway with", messages.length, "messages");

    // Check if any message contains images (for vision capability)
    const hasImages = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    // Use gemini-2.5-pro for vision tasks, flash for text-only
    const model = hasImages ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";
    console.log("Using model:", model, "hasImages:", hasImages);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
