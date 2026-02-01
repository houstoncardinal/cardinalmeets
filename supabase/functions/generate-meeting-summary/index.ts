import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SummaryRequest {
  meetingId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meetingId }: SummaryRequest = await req.json();

    if (!meetingId) {
      throw new Error("Meeting ID is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all transcriptions for this meeting
    const { data: transcriptions, error: transcriptError } = await supabase
      .from("transcriptions")
      .select("content, timestamp_start, speaker_id")
      .eq("meeting_id", meetingId)
      .order("timestamp_start", { ascending: true });

    if (transcriptError) throw transcriptError;

    if (!transcriptions || transcriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcriptions found for this meeting" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Compile full transcript
    const fullTranscript = transcriptions
      .map((t) => t.content)
      .join("\n");

    // Generate summary using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional meeting summarizer. Given a meeting transcript, you will:
1. Write a concise executive summary (2-3 paragraphs)
2. Extract 3-7 key points discussed
3. Identify any action items or next steps mentioned

Format your response as JSON with the following structure:
{
  "summary": "Your executive summary here...",
  "key_points": ["Key point 1", "Key point 2", ...],
  "action_items": ["Action item 1", "Action item 2", ...]
}

Be professional, concise, and focus on the most important information. If no clear action items are mentioned, return an empty array for action_items.`,
          },
          {
            role: "user",
            content: `Please summarize the following meeting transcript:\n\n${fullTranscript}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate summary");
    }

    const aiResponse = await response.json();
    const summaryContent = JSON.parse(aiResponse.choices[0].message.content);

    // Save summary to database
    const { data: savedSummary, error: saveError } = await supabase
      .from("meeting_summaries")
      .upsert({
        meeting_id: meetingId,
        summary: summaryContent.summary,
        key_points: summaryContent.key_points,
        action_items: summaryContent.action_items,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) throw saveError;

    console.log("Meeting summary generated successfully for:", meetingId);

    return new Response(JSON.stringify(savedSummary), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in generate-meeting-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
