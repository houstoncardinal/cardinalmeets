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
  reconnectAttempts: number;
  lastReconnect: number;
}

interface ConnectionHealth {
  quality: "excellent" | "good" | "fair" | "poor" | "disconnected";
  latency: number;
  packetLoss: number;
  bitrate: number;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

const VIDEO_CONSTRAINTS_HD: MediaTrackConstraints = {
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  frameRate: { ideal: 30, min: 15 },
  facingMode: "user",
};

const VIDEO_CONSTRAINTS_FALLBACK: MediaTrackConstraints = {
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
  frameRate: { ideal: 24, min: 15 },
  facingMode: "user",
};

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000;
const HEALTH_CHECK_INTERVAL = 5000;

export function useWebRTC(meetingId: string) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    quality: "good",
    latency: 0,
    packetLoss: 0,
    bitrate: 0,
  });

  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const meetingUuidRef = useRef<string | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingDetectorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

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

  // Speaking detection using audio analysis
  const startSpeakingDetection = useCallback((stream: MediaStream, participantId: string) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speakingThreshold = 30;

      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > speakingThreshold;

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, isSpeaking } : p
          )
        );
      };

      const interval = setInterval(checkSpeaking, 150);
      return () => {
        clearInterval(interval);
        audioContext.close();
      };
    } catch {
      return () => {};
    }
  }, []);

  // Connection health monitoring
  const monitorConnectionHealth = useCallback(() => {
    if (healthCheckRef.current) clearInterval(healthCheckRef.current);

    healthCheckRef.current = setInterval(async () => {
      const peers = Array.from(peerConnectionsRef.current.values());
      if (peers.length === 0) return;

      let totalLatency = 0;
      let totalPacketLoss = 0;
      let totalBitrate = 0;
      let count = 0;

      for (const peer of peers) {
        try {
          const stats = await peer.connection.getStats();
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              totalLatency += report.currentRoundTripTime * 1000 || 0;
              count++;
            }
            if (report.type === "inbound-rtp" && report.kind === "video") {
              totalPacketLoss += report.packetsLost || 0;
              totalBitrate += report.bytesReceived || 0;
            }
          });
        } catch {}
      }

      const avgLatency = count > 0 ? totalLatency / count : 0;
      let quality: ConnectionHealth["quality"] = "excellent";
      if (avgLatency > 300 || totalPacketLoss > 5) quality = "poor";
      else if (avgLatency > 150 || totalPacketLoss > 2) quality = "fair";
      else if (avgLatency > 50) quality = "good";

      setConnectionHealth({
        quality,
        latency: Math.round(avgLatency),
        packetLoss: totalPacketLoss,
        bitrate: totalBitrate,
      });
    }, HEALTH_CHECK_INTERVAL);
  }, []);

  // Adaptive bitrate based on connection quality
  const adaptBitrate = useCallback(async (quality: ConnectionHealth["quality"]) => {
    const peers = Array.from(peerConnectionsRef.current.values());
    for (const peer of peers) {
      const senders = peer.connection.getSenders();
      for (const sender of senders) {
        if (sender.track?.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          switch (quality) {
            case "excellent":
              params.encodings[0].maxBitrate = 2500000;
              params.encodings[0].scaleResolutionDownBy = 1;
              break;
            case "good":
              params.encodings[0].maxBitrate = 1500000;
              params.encodings[0].scaleResolutionDownBy = 1;
              break;
            case "fair":
              params.encodings[0].maxBitrate = 800000;
              params.encodings[0].scaleResolutionDownBy = 1.5;
              break;
            case "poor":
              params.encodings[0].maxBitrate = 300000;
              params.encodings[0].scaleResolutionDownBy = 2;
              break;
          }
          try {
            await sender.setParameters(params);
          } catch {}
        }
      }
    }
  }, []);

  // Auto-adapt bitrate on quality change
  useEffect(() => {
    adaptBitrate(connectionHealth.quality);
  }, [connectionHealth.quality, adaptBitrate]);

  // Self-healing reconnection
  const reconnectPeer = useCallback(
    async (peerId: string) => {
      const peerData = peerConnectionsRef.current.get(peerId);
      if (!peerData || peerData.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`Giving up reconnection for ${peerId}`);
        peerConnectionsRef.current.delete(peerId);
        setParticipants((prev) => prev.filter((p) => p.id !== peerId));
        return;
      }

      const delay = RECONNECT_BASE_DELAY * Math.pow(2, peerData.reconnectAttempts);
      console.log(`Reconnecting to ${peerId} in ${delay}ms (attempt ${peerData.reconnectAttempts + 1})`);
      peerData.reconnectAttempts++;
      peerData.lastReconnect = Date.now();

      await new Promise((r) => setTimeout(r, delay));

      try {
        peerData.connection.close();
        const pc = new RTCPeerConnection(ICE_SERVERS);
        
        pc.onicecandidate = async (event) => {
          if (event.candidate && meetingUuidRef.current) {
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
          const [stream] = event.streams;
          if (stream) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === peerId ? { ...p, stream, isVideoOn: true } : p
              )
            );
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") {
            peerData.reconnectAttempts = 0;
          }
          if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            reconnectPeer(peerId);
          }
        };

        // Add local tracks
        const currentStream = localStreamRef.current;
        if (currentStream) {
          currentStream.getTracks().forEach((track) => {
            pc.addTrack(track, currentStream);
          });
        }

        peerData.connection = pc;

        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);

        if (meetingUuidRef.current) {
          await supabase.from("signaling").insert({
            meeting_id: meetingUuidRef.current,
            sender_id: user?.id || "",
            recipient_id: peerId,
            type: "offer",
            payload: { offer },
          } as any);
        }
      } catch (err) {
        console.error("Reconnection failed:", err);
        reconnectPeer(peerId);
      }
    },
    [user?.id]
  );

  const createPeerConnection = useCallback(
    async (peerId: string): Promise<RTCPeerConnection> => {
      console.log("Creating peer connection for:", peerId);
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = async (event) => {
        if (event.candidate && meetingUuidRef.current) {
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
          // Start speaking detection for remote peer
          startSpeakingDetection(stream, peerId);
          
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
        if (pc.connectionState === "connected") {
          const peerData = peerConnectionsRef.current.get(peerId);
          if (peerData) peerData.reconnectAttempts = 0;
        }
        if (pc.connectionState === "failed") {
          reconnectPeer(peerId);
        }
        if (pc.connectionState === "disconnected") {
          // Wait a bit before reconnecting (might recover)
          setTimeout(() => {
            const peerData = peerConnectionsRef.current.get(peerId);
            if (peerData && peerData.connection.connectionState === "disconnected") {
              reconnectPeer(peerId);
            }
          }, 3000);
        }
      };

      // Add local tracks
      const currentStream = localStreamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          pc.addTrack(track, currentStream);
        });
      }

      peerConnectionsRef.current.set(peerId, {
        peerId,
        connection: pc,
        reconnectAttempts: 0,
        lastReconnect: 0,
      });
      return pc;
    },
    [user?.id, startSpeakingDetection, reconnectPeer]
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
          payload: { answer } as unknown as Record<string, unknown>,
        } as never);
      }
    },
    [createPeerConnection, user?.id]
  );

  const handleAnswer = useCallback(
    async (senderId: string, answer: RTCSessionDescriptionInit) => {
      const peerData = peerConnectionsRef.current.get(senderId);
      if (peerData) {
        await peerData.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (senderId: string, candidate: RTCIceCandidateInit) => {
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

      const pc = await createPeerConnection(senderId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (meetingUuidRef.current) {
        await supabase.from("signaling").insert({
          meeting_id: meetingUuidRef.current,
          sender_id: user?.id || "",
          recipient_id: senderId,
          type: "offer",
          payload: { offer },
        } as any);
      }
    },
    [createPeerConnection, user?.id]
  );

  const handleLeave = useCallback((senderId: string) => {
    const peerData = peerConnectionsRef.current.get(senderId);
    if (peerData) {
      peerData.connection.close();
      peerConnectionsRef.current.delete(senderId);
    }
    setParticipants((prev) => prev.filter((p) => p.id !== senderId));
  }, []);

  const startLocalStream = useCallback(async () => {
    try {
      // Try HD first, fallback to lower quality
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS_HD,
          audio: AUDIO_CONSTRAINTS,
        });
      } catch {
        console.log("HD not available, falling back to 720p");
        stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS_FALLBACK,
          audio: AUDIO_CONSTRAINTS,
        });
      }

      setLocalStream(stream);

      // Start local speaking detection
      startSpeakingDetection(stream, user?.id || "local");

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
  }, [user?.id, getUserName, getUserInitials, startSpeakingDetection]);

  const joinMeeting = useCallback(async () => {
    if (!user || !meetingId) return;

    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id")
      .eq("meeting_code", meetingId)
      .single();

    if (meetingError || !meeting) {
      throw new Error("Meeting not found");
    }

    meetingUuidRef.current = meeting.id;
    await startLocalStream();

    // Start health monitoring
    monitorConnectionHealth();

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

          if (signal.sender_id === user.id) return;
          if (signal.recipient_id && signal.recipient_id !== user.id) return;

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

    await supabase.from("signaling").insert({
      meeting_id: meeting.id,
      sender_id: user.id,
      type: "join",
      payload: { name: getUserName() },
    } as any);

    setIsConnected(true);
  }, [
    user,
    meetingId,
    startLocalStream,
    monitorConnectionHealth,
    handleJoin,
    handleLeave,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    getUserName,
  ]);

  const leaveMeeting = useCallback(async () => {
    if (healthCheckRef.current) clearInterval(healthCheckRef.current);
    if (speakingDetectorRef.current) clearInterval(speakingDetectorRef.current);

    if (meetingUuidRef.current && user) {
      await supabase.from("signaling").insert({
        meeting_id: meetingUuidRef.current,
        sender_id: user.id,
        type: "leave",
        payload: {},
      } as any);
    }

    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnectionsRef.current.clear();

    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());

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
          prev.map((p) => (p.isLocal ? { ...p, isMuted: !audioTrack.enabled } : p))
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
          prev.map((p) => (p.isLocal ? { ...p, isVideoOn: videoTrack.enabled } : p))
        );
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((peer) => {
        const senders = peer.connection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) videoSender.replaceTrack(videoTrack);
      });

      videoTrack.onended = () => stopScreenShare();

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

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionsRef.current.forEach((peer) => {
            const senders = peer.connection.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === "video");
            if (videoSender) videoSender.replaceTrack(videoTrack);
          });
        }
      }

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
    connectionHealth,
    joinMeeting,
    leaveMeeting,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}
