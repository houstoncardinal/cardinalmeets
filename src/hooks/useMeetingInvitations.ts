import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: string;
  email: string;
  status: string;
  sent_at: string | null;
}

export function useMeetingInvitations(meetingId: string) {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchInvitations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("meeting_invitations")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
    } else {
      setInvitations(data as Invitation[]);
    }
    setIsLoading(false);
  };

  const sendInvitation = async (email: string, meetingTitle: string, meetingCode: string, scheduledAt?: string) => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create invitation record
      const { data: invitation, error: insertError } = await supabase
        .from("meeting_invitations")
        .insert({
          meeting_id: meetingId,
          email,
          invited_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke("send-meeting-invitation", {
        body: {
          email,
          meetingTitle,
          meetingCode,
          scheduledAt,
          hostName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Host",
          invitationId: invitation.id,
        },
      });

      if (sendError) throw sendError;

      // Update invitation status
      await supabase
        .from("meeting_invitations")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invitation.id);

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}`,
      });

      await fetchInvitations();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
    setIsSending(false);
  };

  const sendBulkInvitations = async (
    emails: string[],
    meetingTitle: string,
    meetingCode: string,
    scheduledAt?: string
  ) => {
    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await sendInvitation(email, meetingTitle, meetingCode, scheduledAt);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (failCount > 0) {
      toast({
        title: "Some invitations failed",
        description: `${successCount} sent, ${failCount} failed`,
        variant: "destructive",
      });
    }

    setIsSending(false);
  };

  return {
    invitations,
    isLoading,
    isSending,
    fetchInvitations,
    sendInvitation,
    sendBulkInvitations,
  };
}
