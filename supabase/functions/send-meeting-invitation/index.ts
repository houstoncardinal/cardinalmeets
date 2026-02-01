import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  email: string;
  meetingTitle: string;
  meetingCode: string;
  scheduledAt?: string;
  hostName: string;
  invitationId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, meetingTitle, meetingCode, scheduledAt, hostName, invitationId }: InvitationRequest = await req.json();

    // Validate required fields
    if (!email || !meetingTitle || !meetingCode || !hostName) {
      throw new Error("Missing required fields");
    }

    const meetingUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/meeting/${meetingCode}`;

    const formattedDate = scheduledAt
      ? new Date(scheduledAt).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "Instant meeting";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #10b981 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">MeetFlow</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Video Conferencing Made Simple</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600;">You're Invited to a Meeting</h2>
                    <p style="margin: 0 0 24px; color: #71717a; font-size: 15px; line-height: 1.6;">
                      ${hostName} has invited you to join a video meeting.
                    </p>
                    
                    <!-- Meeting Details -->
                    <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 12px; color: #52525b; font-size: 14px;"><strong>Meeting:</strong> ${meetingTitle}</p>
                          <p style="margin: 0 0 12px; color: #52525b; font-size: 14px;"><strong>When:</strong> ${formattedDate}</p>
                          <p style="margin: 0; color: #52525b; font-size: 14px;"><strong>Meeting Code:</strong> ${meetingCode}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${meetingUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                            Join Meeting
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 13px; text-align: center;">
                      Or copy this link: <a href="${meetingUrl}" style="color: #2563eb;">${meetingUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7; text-align: center;">
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                      This email was sent by MeetFlow. If you didn't expect this invitation, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MeetFlow <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited: ${meetingTitle}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Meeting invitation email sent successfully:", emailResult);

    // Update invitation status in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from("meeting_invitations")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", invitationId);

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-meeting-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
