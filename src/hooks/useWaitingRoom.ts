import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface WaitingParticipant {
  id: string;
  user_id: string;
  meeting_id: string;
  waiting_room_status: "waiting" | "admitted" | "rejected";
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useWaitingRoom(meetingId: string, isHost: boolean = false) {
  const { user } = useAuth();
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
  const [myStatus, setMyStatus] = useState<"waiting" | "admitted" | "rejected" | null>(null);
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWaitingRoom = useCallback(async () => {
    if (!meetingId) return;

    // Check if waiting room is enabled for this meeting
    const { data: meetingData } = await supabase
      .from("meetings")
      .select("waiting_room_enabled, host_id")
      .eq("id", meetingId)
      .single();

    if (meetingData) {
      setIsWaitingRoomEnabled(meetingData.waiting_room_enabled || false);
    }

    if (isHost) {
      // Fetch all waiting participants
      const { data: participants, error } = await supabase
        .from("meeting_participants")
        .select("*")
        .eq("meeting_id", meetingId)
        .eq("waiting_room_status", "waiting");

      if (error) {
        console.error("Error fetching waiting participants:", error);
      } else {
        // Fetch profiles for each participant
        const participantsWithProfiles = await Promise.all(
          (participants || []).map(async (p) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", p.user_id)
              .single();

            return {
              ...p,
              profile,
            } as WaitingParticipant;
          })
        );

        setWaitingParticipants(participantsWithProfiles);
      }
    }

    // Check my own status
    if (user) {
      const { data: myParticipant } = await supabase
        .from("meeting_participants")
        .select("waiting_room_status")
        .eq("meeting_id", meetingId)
        .eq("user_id", user.id)
        .single();

      if (myParticipant) {
        setMyStatus(myParticipant.waiting_room_status as WaitingParticipant["waiting_room_status"]);
      }
    }

    setLoading(false);
  }, [meetingId, isHost, user]);

  useEffect(() => {
    fetchWaitingRoom();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`waiting-room-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_participants",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => fetchWaitingRoom()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, fetchWaitingRoom]);

  const joinWaitingRoom = async () => {
    if (!user || !meetingId) return;

    // First check if participant record exists
    const { data: existing } = await supabase
      .from("meeting_participants")
      .select("id")
      .eq("meeting_id", meetingId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from("meeting_participants")
        .update({ waiting_room_status: "waiting" })
        .eq("id", existing.id);
    } else {
      // Create new record
      await supabase.from("meeting_participants").insert({
        meeting_id: meetingId,
        user_id: user.id,
        waiting_room_status: "waiting",
        role: "participant",
      });
    }
  };

  const admitParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from("meeting_participants")
      .update({
        waiting_room_status: "admitted",
        joined_at: new Date().toISOString(),
      })
      .eq("id", participantId);

    if (error) {
      console.error("Error admitting participant:", error);
      throw error;
    }
  };

  const rejectParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from("meeting_participants")
      .update({ waiting_room_status: "rejected" })
      .eq("id", participantId);

    if (error) {
      console.error("Error rejecting participant:", error);
      throw error;
    }
  };

  const admitAll = async () => {
    const { error } = await supabase
      .from("meeting_participants")
      .update({
        waiting_room_status: "admitted",
        joined_at: new Date().toISOString(),
      })
      .eq("meeting_id", meetingId)
      .eq("waiting_room_status", "waiting");

    if (error) {
      console.error("Error admitting all participants:", error);
      throw error;
    }
  };

  const toggleWaitingRoom = async (enabled: boolean) => {
    const { error } = await supabase
      .from("meetings")
      .update({ waiting_room_enabled: enabled })
      .eq("id", meetingId);

    if (error) {
      console.error("Error toggling waiting room:", error);
      throw error;
    }

    setIsWaitingRoomEnabled(enabled);
  };

  return {
    waitingParticipants,
    myStatus,
    isWaitingRoomEnabled,
    loading,
    joinWaitingRoom,
    admitParticipant,
    rejectParticipant,
    admitAll,
    toggleWaitingRoom,
    refetch: fetchWaitingRoom,
  };
}
