import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface BreakoutRoom {
  id: string;
  meeting_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  participants: BreakoutRoomParticipant[];
}

interface BreakoutRoomParticipant {
  id: string;
  breakout_room_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
}

export function useBreakoutRooms(meetingId: string) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<BreakoutRoom | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!meetingId) return;

    const { data: roomsData, error } = await supabase
      .from("breakout_rooms")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching breakout rooms:", error);
      return;
    }

    // Fetch participants for each room
    const roomsWithParticipants = await Promise.all(
      (roomsData || []).map(async (room) => {
        const { data: participants } = await supabase
          .from("breakout_room_participants")
          .select("*")
          .eq("breakout_room_id", room.id)
          .is("left_at", null);

        return {
          ...room,
          participants: participants || [],
        };
      })
    );

    setRooms(roomsWithParticipants as BreakoutRoom[]);

    // Check if current user is in any room
    if (user) {
      const userRoom = roomsWithParticipants.find((room) =>
        room.participants.some((p) => p.user_id === user.id)
      );
      setCurrentRoom(userRoom || null);
    }

    setLoading(false);
  }, [meetingId, user]);

  useEffect(() => {
    fetchRooms();

    // Subscribe to realtime updates
    const roomsChannel = supabase
      .channel(`breakout-rooms-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "breakout_rooms",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => fetchRooms()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "breakout_room_participants",
        },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [meetingId, fetchRooms]);

  const createRoom = async (name: string) => {
    const { data, error } = await supabase
      .from("breakout_rooms")
      .insert({
        meeting_id: meetingId,
        name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating breakout room:", error);
      throw error;
    }

    return data;
  };

  const deleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from("breakout_rooms")
      .update({ is_active: false })
      .eq("id", roomId);

    if (error) {
      console.error("Error deleting breakout room:", error);
      throw error;
    }
  };

  const assignParticipant = async (roomId: string, userId: string) => {
    // First remove from any existing room
    await supabase
      .from("breakout_room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("left_at", null);

    // Then add to new room
    const { error } = await supabase.from("breakout_room_participants").insert({
      breakout_room_id: roomId,
      user_id: userId,
    });

    if (error) {
      console.error("Error assigning participant:", error);
      throw error;
    }
  };

  const removeParticipant = async (userId: string) => {
    const { error } = await supabase
      .from("breakout_room_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("left_at", null);

    if (error) {
      console.error("Error removing participant:", error);
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;
    await assignParticipant(roomId, user.id);
  };

  const leaveRoom = async () => {
    if (!user) return;
    await removeParticipant(user.id);
  };

  const closeAllRooms = async () => {
    const { error } = await supabase
      .from("breakout_rooms")
      .update({ is_active: false })
      .eq("meeting_id", meetingId);

    if (error) {
      console.error("Error closing all rooms:", error);
      throw error;
    }
  };

  return {
    rooms,
    currentRoom,
    loading,
    createRoom,
    deleteRoom,
    assignParticipant,
    removeParticipant,
    joinRoom,
    leaveRoom,
    closeAllRooms,
    refetch: fetchRooms,
  };
}
