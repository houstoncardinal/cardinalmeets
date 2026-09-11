import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { MeetingControls } from "@/components/meeting/MeetingControls";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { MeetingSummaryPanel } from "@/components/meeting/MeetingSummaryPanel";
import { BackgroundSettingsDialog } from "@/components/meeting/BackgroundSettingsDialog";
import { BreakoutRoomsDialog } from "@/components/meeting/BreakoutRoomsDialog";
import { WaitingRoomPanel } from "@/components/meeting/WaitingRoomPanel";
import { WaitingScreen } from "@/components/meeting/WaitingScreen";
import { PollsPanel } from "@/components/meeting/PollsPanel";
import { QAPanel } from "@/components/meeting/QAPanel";
import { ReactionsOverlay } from "@/components/meeting/ReactionsOverlay";
import { ReactionsPicker } from "@/components/meeting/ReactionsPicker";
import { WhiteboardPanel } from "@/components/meeting/WhiteboardPanel";
import { PreMeetingLobby } from "@/components/meeting/PreMeetingLobby";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useTranscription } from "@/hooks/useTranscription";
import { useMeetingRecording } from "@/hooks/useMeetingRecording";
import { useBackgroundEffects, BackgroundEffect } from "@/hooks/useBackgroundEffects";
import { useBreakoutRooms } from "@/hooks/useBreakoutRooms";
import { useWaitingRoom } from "@/hooks/useWaitingRoom";
import { useNoiseSuppression } from "@/hooks/useNoiseSuppression";
import { useReactions } from "@/hooks/useReactions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMeetings } from "@/hooks/useMeetings";
import { Button } from "@/components/ui/button";
import { VideoOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MeetingState = "checking" | "ready" | "missing" | "ended" | "cancelled" | "error";
type JoinSettings = { audioDeviceId?: string; videoDeviceId?: string; audioEnabled: boolean; videoEnabled: boolean };

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { user, loading, signInAsGuest } = useAuth();
  const { toast } = useToast();

  // Panel state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);
  const [isBreakoutRoomsOpen, setIsBreakoutRoomsOpen] = useState(false);
  const [isWaitingRoomOpen, setIsWaitingRoomOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isQAOpen, setIsQAOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  // Settings state
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>("none");
  const [virtualBackgroundUrl, setVirtualBackgroundUrl] = useState<string>();
  const [dbMeetingId, setDbMeetingId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [meetingHasPassword, setMeetingHasPassword] = useState(false);
  const [meetingWaitingRoomEnabled, setMeetingWaitingRoomEnabled] = useState(true);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [meetingState, setMeetingState] = useState<MeetingState>("checking");
  const [meetingTitle, setMeetingTitle] = useState("Video Meeting");
  const [displayName, setDisplayName] = useState("");
  const [joinSettings, setJoinSettings] = useState<JoinSettings | undefined>();
  const [joinError, setJoinError] = useState<string | null>(null);

  const {
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
    localStream,
  } = useWebRTC(meetingId || "", displayName);

  const { processedStream: noiseSuppressedStream } = useNoiseSuppression({
    stream: localStream,
    enabled: noiseSuppressionEnabled,
  });

  const {
    transcripts,
    isTranscribing,
    startTranscription,
    stopTranscription,
  } = useTranscription(meetingId || "", isCaptionsOn);

  const {
    isRecording,
    duration: recordingDuration,
    startRecording,
    stopRecording,
  } = useMeetingRecording(dbMeetingId || meetingId || "");

  const { processedStream } = useBackgroundEffects({
    stream: noiseSuppressedStream,
    effect: backgroundEffect,
    virtualBackgroundUrl,
  });

  const {
    rooms: breakoutRooms,
    createRoom,
    deleteRoom,
    assignParticipant,
    removeParticipant,
    closeAllRooms,
  } = useBreakoutRooms(dbMeetingId || "");

  const {
    waitingParticipants,
    myStatus,
    isWaitingRoomEnabled,
    admitParticipant,
    rejectParticipant,
    admitAll,
    toggleWaitingRoom,
  } = useWaitingRoom(dbMeetingId || "", isHost);

  const { activeReactions, sendReaction, REACTION_EMOJIS } = useReactions(dbMeetingId || "");

  // Fetch database meeting ID from meeting code
  const resolveMeeting = useCallback(async () => {
    if (!meetingId) {
      setMeetingState("missing");
      return;
    }
    setMeetingState("checking");
    const { data, error } = await supabase
      .from("meeting_access")
      .select("*")
      .eq("meeting_code", meetingId.toLowerCase())
      .maybeSingle();
    if (error) {
      setMeetingState("error");
      return;
    }
    if (!data) {
      setMeetingState("missing");
      return;
    }
    setDbMeetingId(data.meeting_id);
    setMeetingTitle(data.title);
    setMeetingHasPassword(data.has_password);
    setMeetingWaitingRoomEnabled(data.waiting_room_enabled);
    setIsHost(Boolean(user && data.host_id === user.id));
    setMeetingState(data.status === "ended" ? "ended" : data.status === "cancelled" ? "cancelled" : "ready");
  }, [meetingId, user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      signInAsGuest("Guest").catch(() => setMeetingState("error"));
      return;
    }
    resolveMeeting();
  }, [loading, user, signInAsGuest, resolveMeeting]);

  useEffect(() => {
    if (!displayName && user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Guest");
    }
  }, [displayName, user]);

  // Join meeting on mount
  useEffect(() => {
    if (user && meetingId && meetingState === "ready" && !isConnected && hasJoinedLobby) {
      joinMeeting(joinSettings).catch((err) => {
        console.error("Failed to join meeting:", err);
        toast({
          title: "Failed to join meeting",
          description: err.message || "Please check the meeting code and try again",
          variant: "destructive",
        });
        setJoinError(err.message || "Unable to join this meeting");
      });
    }
  }, [user, meetingId, meetingState, isConnected, joinMeeting, toast, hasJoinedLobby, joinSettings]);

  // Handle captions toggle
  useEffect(() => {
    if (isCaptionsOn && localStream && user) {
      const speakerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "You";
      startTranscription(localStream, speakerName);
    } else {
      stopTranscription();
    }
  }, [isCaptionsOn, localStream, user, startTranscription, stopTranscription]);

  const handleLeaveMeeting = async () => {
    if (isRecording) stopRecording();
    await leaveMeeting();
    navigate(user?.is_anonymous ? "/" : "/dashboard");
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) stopScreenShare();
    else startScreenShare();
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const streams = participants.flatMap((p) => (p.stream ? [p.stream] : []));
      if (localStream) streams.push(localStream);
      startRecording(streams);
    }
  };

  const handleSelectBackground = (effect: BackgroundEffect, url?: string) => {
    setBackgroundEffect(effect);
    setVirtualBackgroundUrl(url);
  };

  // Convert participants to the format VideoGrid expects
  const gridParticipants = participants.map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.initials,
    isMuted: p.isMuted,
    isVideoOn: p.isVideoOn,
    isLocal: p.isLocal,
    isHost: p.isHost,
    isSpeaking: p.isSpeaking,
    isScreenShare: p.isScreenShare,
    stream: p.isLocal && processedStream ? processedStream : p.stream,
  }));

  // Show pre-meeting lobby first
  if (loading || meetingState === "checking") {
    return <div className="flex h-screen items-center justify-center bg-meeting-bg"><div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (meetingState !== "ready") {
    const copy = meetingState === "missing"
      ? ["Meeting not found", "Check the invite link or ask the host for a new one."]
      : meetingState === "ended"
        ? ["This meeting has ended", "Ask the host to start a new meeting."]
        : meetingState === "cancelled"
          ? ["This meeting was cancelled", "The host is no longer accepting participants."]
          : ["Meeting unavailable", "We couldn't reach this meeting. Please try again."];
    return (
      <main className="flex min-h-screen items-center justify-center bg-meeting-bg p-6 text-center">
        <div className="max-w-md space-y-4">
          <VideoOff className="mx-auto h-12 w-12 text-meeting-muted" />
          <h1 className="text-2xl font-semibold text-meeting-text">{copy[0]}</h1>
          <p className="text-meeting-muted">{copy[1]}</p>
          <div className="flex justify-center gap-2">
            {meetingState === "error" && <Button onClick={resolveMeeting}>Try again</Button>}
            <Button variant="outline" onClick={() => navigate("/")}>Return home</Button>
          </div>
        </div>
      </main>
    );
  }

  if (meetingId && !hasJoinedLobby) {
    return (
      <PreMeetingLobby
        meetingCode={meetingId}
        meetingTitle={meetingTitle}
        displayName={displayName}
        isGuest={!user || Boolean(user.is_anonymous)}
        onDisplayNameChange={setDisplayName}
        onJoin={async (settings) => {
          setJoinSettings(settings);
          setHasJoinedLobby(true);
        }}
        onCancel={() => navigate(user?.is_anonymous ? "/" : "/dashboard")}
      />
    );
  }

  // Show waiting screen if user is in waiting room
  if (myStatus === "waiting") {
    return <WaitingScreen meetingTitle="Video Meeting" onLeave={handleLeaveMeeting} />;
  }

  // Show rejected message
  if (myStatus === "rejected") {
    return (
      <div className="flex h-screen items-center justify-center bg-meeting-bg">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xl font-semibold text-meeting-text">Your request to join was declined</p>
          <p className="text-meeting-text-muted">The host did not admit you to the meeting.</p>
          <Button onClick={() => navigate(user?.is_anonymous ? "/" : "/dashboard")} className="mt-4">Leave meeting</Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (joinError) {
    return <div className="flex h-screen items-center justify-center bg-meeting-bg p-6 text-center"><div className="space-y-4"><h1 className="text-xl font-semibold text-meeting-text">Couldn’t join the meeting</h1><p className="text-meeting-muted">{joinError}</p><Button onClick={() => { setJoinError(null); setHasJoinedLobby(false); }}>Back to preview</Button></div></div>;
  }

  if (!isConnected && user) {
    return (
      <div className="flex h-screen items-center justify-center bg-meeting-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-meeting-text">Joining meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-meeting-bg">
      <ReactionsOverlay reactions={activeReactions} />

      <MeetingHeader
        meetingId={meetingId || "abc-defg-hij"}
        meetingTitle={meetingTitle}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        connectionQuality={connectionHealth.quality}
        connectionLatency={connectionHealth.latency}
        isEncrypted={true}
        hasPassword={meetingHasPassword}
        waitingRoomEnabled={meetingWaitingRoomEnabled}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            {isWhiteboardOpen ? (
              <WhiteboardPanel onClose={() => setIsWhiteboardOpen(false)} meetingId={dbMeetingId || meetingId || ""} />
            ) : (
              <VideoGrid participants={gridParticipants} />
            )}
          </div>

          <div className="flex max-w-full items-center justify-start gap-2 overflow-x-auto px-3 pb-3 sm:justify-center sm:pb-6">
            <MeetingControls
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              isChatOpen={isChatOpen}
              isParticipantsOpen={isParticipantsOpen}
              isCaptionsOn={isCaptionsOn}
              isRecording={isRecording}
              isSummaryOpen={isSummaryOpen}
              isBreakoutRoomsOpen={isBreakoutRoomsOpen}
              isWaitingRoomOpen={isWaitingRoomOpen}
              isPollsOpen={isPollsOpen}
              isQAOpen={isQAOpen}
              isWhiteboardOpen={isWhiteboardOpen}
              waitingCount={waitingParticipants.length}
              isHost={isHost}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={handleToggleScreenShare}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
              onToggleCaptions={() => setIsCaptionsOn(!isCaptionsOn)}
              onToggleRecording={handleToggleRecording}
              onToggleSummary={() => setIsSummaryOpen(!isSummaryOpen)}
              onToggleBreakoutRooms={() => setIsBreakoutRoomsOpen(true)}
              onToggleWaitingRoom={() => setIsWaitingRoomOpen(!isWaitingRoomOpen)}
              onTogglePolls={() => setIsPollsOpen(!isPollsOpen)}
              onToggleQA={() => setIsQAOpen(!isQAOpen)}
              onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
              onOpenBackgroundSettings={() => setIsBackgroundDialogOpen(true)}
              onLeaveMeeting={handleLeaveMeeting}
            />
            <ReactionsPicker onReact={sendReaction} emojis={REACTION_EMOJIS} />
          </div>
        </div>

        {isParticipantsOpen && (
          <ParticipantsPanel
            participants={gridParticipants}
            onClose={() => setIsParticipantsOpen(false)}
          />
        )}

        {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}

        {isCaptionsOn && (
          <TranscriptPanel
            transcripts={transcripts}
            isTranscribing={isTranscribing}
            onClose={() => setIsCaptionsOn(false)}
          />
        )}

        {isSummaryOpen && dbMeetingId && (
          <MeetingSummaryPanel meetingId={dbMeetingId} onClose={() => setIsSummaryOpen(false)} />
        )}

        {isWaitingRoomOpen && isHost && (
          <WaitingRoomPanel
            waitingParticipants={waitingParticipants}
            isWaitingRoomEnabled={isWaitingRoomEnabled}
            onAdmit={admitParticipant}
            onReject={rejectParticipant}
            onAdmitAll={admitAll}
            onToggleWaitingRoom={toggleWaitingRoom}
            onClose={() => setIsWaitingRoomOpen(false)}
          />
        )}

        {isPollsOpen && dbMeetingId && (
          <PollsPanel meetingId={dbMeetingId} isHost={isHost} onClose={() => setIsPollsOpen(false)} />
        )}

        {isQAOpen && dbMeetingId && (
          <QAPanel meetingId={dbMeetingId} isHost={isHost} onClose={() => setIsQAOpen(false)} />
        )}
      </div>

      <BackgroundSettingsDialog
        open={isBackgroundDialogOpen}
        onOpenChange={setIsBackgroundDialogOpen}
        currentEffect={backgroundEffect}
        currentBackground={virtualBackgroundUrl}
        onSelectEffect={handleSelectBackground}
      />

      <BreakoutRoomsDialog
        open={isBreakoutRoomsOpen}
        onOpenChange={setIsBreakoutRoomsOpen}
        rooms={breakoutRooms}
        participants={gridParticipants.map((p) => ({
          id: p.id,
          name: p.name,
          initials: p.initials,
          isLocal: p.isLocal,
        }))}
        onCreateRoom={async (name) => { await createRoom(name); }}
        onDeleteRoom={deleteRoom}
        onAssignParticipant={assignParticipant}
        onRemoveParticipant={removeParticipant}
        onCloseAllRooms={closeAllRooms}
        isHost={isHost}
      />
    </div>
  );
}
