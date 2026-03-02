import { useState, useEffect } from "react";
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

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { getMeetingByCode } = useMeetings();

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
  } = useWebRTC(meetingId || "");

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
  useEffect(() => {
    const fetchMeetingId = async () => {
      if (meetingId) {
        const { data } = await getMeetingByCode(meetingId);
        if (data) {
          setDbMeetingId(data.id);
          setMeetingHasPassword(!!data.password);
          setMeetingWaitingRoomEnabled(data.waiting_room_enabled ?? true);
          if (user && data.host_id === user.id) {
            setIsHost(true);
          }
        }
      }
    };
    fetchMeetingId();
  }, [meetingId, getMeetingByCode, user]);

  // Join meeting on mount
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join the meeting",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (user && meetingId && !isConnected) {
      joinMeeting().catch((err) => {
        console.error("Failed to join meeting:", err);
        toast({
          title: "Failed to join meeting",
          description: err.message || "Please check the meeting code and try again",
          variant: "destructive",
        });
        navigate("/dashboard");
      });
    }
  }, [user, loading, meetingId, isConnected, joinMeeting, navigate, toast]);

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
    navigate("/dashboard");
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) stopScreenShare();
    else startScreenShare();
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const streams = participants.filter((p) => p.stream).map((p) => p.stream!);
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
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-primary hover:underline">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading || (!isConnected && user)) {
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
        meetingTitle="Video Meeting"
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
              <WhiteboardPanel onClose={() => setIsWhiteboardOpen(false)} />
            ) : (
              <VideoGrid participants={gridParticipants} />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pb-6">
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
