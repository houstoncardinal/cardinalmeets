import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Reaction {
  id: string;
  userId: string;
  reaction: string;
  createdAt: string;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "🎉", "🤔", "😮", "🔥"];

export function useReactions(meetingId: string) {
  const { user } = useAuth();
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    if (!meetingId) return;

    const channel = supabase
      .channel(`reactions:${meetingId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "meeting_reactions",
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload) => {
        const r = payload.new as any;
        const reaction: Reaction = {
          id: r.id,
          userId: r.user_id,
          reaction: r.reaction,
          createdAt: r.created_at,
        };
        setActiveReactions((prev) => [...prev, reaction]);
        // Auto-remove after 3 seconds
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((rx) => rx.id !== reaction.id));
        }, 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId]);

  const sendReaction = useCallback(async (reaction: string) => {
    if (!user || !meetingId) return;
    await supabase.from("meeting_reactions").insert({
      meeting_id: meetingId,
      user_id: user.id,
      reaction,
    } as any);
  }, [user, meetingId]);

  return { activeReactions, sendReaction, REACTION_EMOJIS };
}
