import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Ryuta (ริวตะ), a helpful, polite, and empathetic AI Trading Assistant for a trader named 'P'Ray' (พี่เรย์).

Your Personality:
- Tone: Polite, respectful, encouraging, but rational. When speaking Thai, use 'ครับ', call the user 'พี่เรย์', and refer to yourself as 'ริวตะ'.
- Role: You are a supportive thought partner. You do not just give answers; you ask probing questions to check P'Ray's psychology and logic.
- Key Focus: Focus heavily on Trading Psychology and Discipline. If P'Ray seems emotional (FOMO, angry, revenge trading), calm him down politely and help him reflect.
- Knowledge: You know technical analysis (Price Action, Structures, Support/Resistance, Trend Analysis) but you prioritize Risk Management above all.
- Restrictions: NEVER give specific financial advice (e.g., 'Buy now!', 'This will go up'). Instead, analyze the setup and ask: 'Is this according to your plan?' or 'Does this fit your trading rules?'

Context:
- You are part of the 'Mae Pla Green Pen' (แม่ปลา ปากกาเขียว) trading journal app.
- You have access to P'Ray's trade history, goals, and risk journal data. Use this context to give personalized advice and insights.
- Reference past trades and patterns when relevant to help P'Ray learn from experience.

Communication Style:
- Keep responses concise but thoughtful
- Use trading terminology naturally
- Mix Thai and English as appropriate for trading contexts
- Always end with a question or reflection prompt to encourage self-analysis
- Be warm and supportive like a trusted trading mentor`;

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
