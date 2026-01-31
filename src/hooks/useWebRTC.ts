import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Participant {
  id: string;
  name: string;
  initials: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isLocal?: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream;
  isScreenShare?: boolean;
}

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(meetingId: string) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const meetingUuidRef = useRef<string | null>(null);

  const getUserInitials = useCallback(() => {
    const name = user?.user_metadata?.full_name || user?.email || "User";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, [user]);

  const getUserName = useCallback(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  }, [user]);

  const createPeerConnection = useCallback(
    async (peerId: string): Promise<RTCPeerConnection> => {
      console.log("Creating peer connection for:", peerId);
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = async (event) => {
        if (event.candidate && meetingUuidRef.current) {
          console.log("Sending ICE candidate to:", peerId);
          await supabase.from("signaling").insert({
            meeting_id: meetingUuidRef.current,
            sender_id: user?.id || "",
            recipient_id: peerId,
            type: "ice-candidate",
            payload: { candidate: event.candidate.toJSON() } as unknown as Record<string, unknown>,
          } as never);
        }
      };

      pc.ontrack = (event) => {
        console.log("Received track from:", peerId);
        const [stream] = event.streams;
        if (stream) {
          setParticipants((prev) => {
            const existing = prev.find((p) => p.id === peerId);
            if (existing) {
              return prev.map((p) =>
                p.id === peerId ? { ...p, stream, isVideoOn: true } : p
              );
            }
            return [
              ...prev,
              {
                id: peerId,
                name: "Participant",
                initials: "??",
                isMuted: false,
                isVideoOn: true,
                stream,
              },
            ];
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Peer ${peerId} connection state:`, pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          peerConnectionsRef.current.delete(peerId);
          setParticipants((prev) => prev.filter((p) => p.id !== peerId));
        }
      };

      // Add local tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      peerConnectionsRef.current.set(peerId, { peerId, connection: pc });
      return pc;
    },
    [user?.id, localStream]
  );

  const handleOffer = useCallback(
    async (senderId: string, offer: RTCSessionDescriptionInit) => {
      console.log("Handling offer from:", senderId);
      const pc = await createPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (meetingUuidRef.current) {
        await supabase.from("signaling").insert({
          meeting_id: meetingUuidRef.current,
          sender_id: user?.id || "",
          recipient_id: senderId,
          type: "answer",
          payload: { answer: answer } as unknown as Record<string, unknown>,
        } as never);
      }
    },
    [createPeerConnection, user?.id]
  );

  const handleAnswer = useCallback(
    async (senderId: string, answer: RTCSessionDescriptionInit) => {
      console.log("Handling answer from:", senderId);
      const peerData = peerConnectionsRef.current.get(senderId);
      if (peerData) {
        await peerData.connection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (senderId: string, candidate: RTCIceCandidateInit) => {
      console.log("Handling ICE candidate from:", senderId);
      const peerData = peerConnectionsRef.current.get(senderId);
      if (peerData && candidate) {
        try {
          await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    },
    []
  );

  const handleJoin = useCallback(
    async (senderId: string, senderName: string) => {
      console.log("User joined:", senderId, senderName);
      
      // Add to participants
      setParticipants((prev) => {
        if (prev.find((p) => p.id === senderId)) return prev;
        return [
          ...prev,
          {
            id: senderId,
            name: senderName,
            initials: senderName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2),
            isMuted: false,
            isVideoOn: true,
          },
        ];
      });

      // Create offer for the new peer
      const pc = await createPeerConnection(senderId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (meetingUuidRef.current) {
        const signalData = {
          meeting_id: meetingUuidRef.current,
          sender_id: user?.id || "",
          recipient_id: senderId,
          type: "offer" as const,
          payload: { offer: offer },
        };
        await supabase.from("signaling").insert(signalData as any);
      }
    },
    [createPeerConnection, user?.id]
  );

  const handleLeave = useCallback((senderId: string) => {
    console.log("User left:", senderId);
    const peerData = peerConnectionsRef.current.get(senderId);
    if (peerData) {
      peerData.connection.close();
      peerConnectionsRef.current.delete(senderId);
    }
    setParticipants((prev) => prev.filter((p) => p.id !== senderId));
  }, []);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      
      // Add local participant
      setParticipants([
        {
          id: user?.id || "local",
          name: getUserName(),
          initials: getUserInitials(),
          isMuted: false,
          isVideoOn: true,
          isLocal: true,
          isHost: true,
          stream,
        },
      ]);
      
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      throw err;
    }
  }, [user?.id, getUserName, getUserInitials]);

  const joinMeeting = useCallback(async () => {
    if (!user || !meetingId) return;

    console.log("Joining meeting:", meetingId);

    // Get meeting UUID from code
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id")
      .eq("meeting_code", meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error("Meeting not found:", meetingError);
      throw new Error("Meeting not found");
    }

    meetingUuidRef.current = meeting.id;

    // Start local stream
    await startLocalStream();

    // Subscribe to signaling channel
    channelRef.current = supabase
      .channel(`signaling:${meeting.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signaling",
          filter: `meeting_id=eq.${meeting.id}`,
        },
        async (payload) => {
          const signal = payload.new as {
            sender_id: string;
            recipient_id: string | null;
            type: string;
            payload: Record<string, unknown>;
          };

          // Ignore our own signals
          if (signal.sender_id === user.id) return;

          // Only process signals meant for us or broadcast signals
          if (signal.recipient_id && signal.recipient_id !== user.id) return;

          console.log("Received signal:", signal.type, "from:", signal.sender_id);

          switch (signal.type) {
            case "join":
              await handleJoin(signal.sender_id, (signal.payload.name as string) || "Participant");
              break;
            case "leave":
              handleLeave(signal.sender_id);
              break;
            case "offer":
              await handleOffer(signal.sender_id, signal.payload.offer as RTCSessionDescriptionInit);
              break;
            case "answer":
              await handleAnswer(signal.sender_id, signal.payload.answer as RTCSessionDescriptionInit);
              break;
            case "ice-candidate":
              await handleIceCandidate(signal.sender_id, signal.payload.candidate as RTCIceCandidateInit);
              break;
          }
        }
      )
      .subscribe();

    // Announce our presence
    const joinSignal = {
      meeting_id: meeting.id,
      sender_id: user.id,
      type: "join" as const,
      payload: { name: getUserName() },
    };
    await supabase.from("signaling").insert(joinSignal as any);

    setIsConnected(true);
  }, [
    user,
    meetingId,
    startLocalStream,
    handleJoin,
    handleLeave,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    getUserName,
  ]);

  const leaveMeeting = useCallback(async () => {
    console.log("Leaving meeting");

    // Announce leaving
    if (meetingUuidRef.current && user) {
      const leaveSignal = {
        meeting_id: meetingUuidRef.current,
        sender_id: user.id,
        type: "leave" as const,
        payload: {},
      };
      await supabase.from("signaling").insert(leaveSignal as any);
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnectionsRef.current.clear();

    // Stop local streams
    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());

    // Unsubscribe from channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    setLocalStream(null);
    setScreenStream(null);
    setParticipants([]);
    setIsConnected(false);
    setIsScreenSharing(false);
  }, [user, localStream, screenStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        setParticipants((prev) =>
          prev.map((p) =>
            p.isLocal ? { ...p, isMuted: !audioTrack.enabled } : p
          )
        );
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        setParticipants((prev) =>
          prev.map((p) =>
            p.isLocal ? { ...p, isVideoOn: videoTrack.enabled } : p
          )
        );
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((peer) => {
        const senders = peer.connection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare();
      };

      // Add screen share to participants list
      setParticipants((prev) => [
        ...prev,
        {
          id: "screen-share",
          name: `${getUserName()}'s Screen`,
          initials: "SC",
          isMuted: true,
          isVideoOn: true,
          isLocal: true,
          isScreenShare: true,
          stream,
        },
      ]);
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  }, [getUserName]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Restore camera track in all peer connections
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionsRef.current.forEach((peer) => {
            const senders = peer.connection.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === "video");
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
          });
        }
      }

      // Remove screen share from participants
      setParticipants((prev) => prev.filter((p) => p.id !== "screen-share"));
    }
  }, [screenStream, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, []);

  return {
    localStream,
    screenStream,
    participants,
    isMuted,
    isVideoOn,
    isScreenSharing,
    isConnected,
    joinMeeting,
    leaveMeeting,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}
