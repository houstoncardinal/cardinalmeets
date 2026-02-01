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
import { useWebRTC } from "@/hooks/useWebRTC";
import { useTranscription } from "@/hooks/useTranscription";
import { useMeetingRecording } from "@/hooks/useMeetingRecording";
import { useBackgroundEffects, BackgroundEffect } from "@/hooks/useBackgroundEffects";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMeetings } from "@/hooks/useMeetings";

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { getMeetingByCode } = useMeetings();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>("none");
  const [virtualBackgroundUrl, setVirtualBackgroundUrl] = useState<string>();
  const [dbMeetingId, setDbMeetingId] = useState<string | null>(null);

  const {
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
    localStream,
  } = useWebRTC(meetingId || "");

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
    stream: localStream,
    effect: backgroundEffect,
    virtualBackgroundUrl,
  });

  // Fetch database meeting ID from meeting code
  useEffect(() => {
    const fetchMeetingId = async () => {
      if (meetingId) {
        const { data } = await getMeetingByCode(meetingId);
        if (data) {
          setDbMeetingId(data.id);
        }
      }
    };
    fetchMeetingId();
  }, [meetingId, getMeetingByCode]);

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
    if (isRecording) {
      stopRecording();
    }
    await leaveMeeting();
    navigate("/dashboard");
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleToggleCaptions = () => {
    setIsCaptionsOn(!isCaptionsOn);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Collect all available streams
      const streams = participants
        .filter((p) => p.stream)
        .map((p) => p.stream!);
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
      <MeetingHeader
        meetingId={meetingId || "abc-defg-hij"}
        meetingTitle="Video Meeting"
        isRecording={isRecording}
        recordingDuration={recordingDuration}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            <VideoGrid participants={gridParticipants} />
          </div>

          <div className="flex justify-center pb-6">
            <MeetingControls
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              isChatOpen={isChatOpen}
              isParticipantsOpen={isParticipantsOpen}
              isCaptionsOn={isCaptionsOn}
              isRecording={isRecording}
              isSummaryOpen={isSummaryOpen}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={handleToggleScreenShare}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
              onToggleCaptions={handleToggleCaptions}
              onToggleRecording={handleToggleRecording}
              onToggleSummary={() => setIsSummaryOpen(!isSummaryOpen)}
              onOpenBackgroundSettings={() => setIsBackgroundDialogOpen(true)}
              onLeaveMeeting={handleLeaveMeeting}
            />
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
          <MeetingSummaryPanel
            meetingId={dbMeetingId}
            onClose={() => setIsSummaryOpen(false)}
          />
        )}
      </div>

      <BackgroundSettingsDialog
        open={isBackgroundDialogOpen}
        onOpenChange={setIsBackgroundDialogOpen}
        currentEffect={backgroundEffect}
        currentBackground={virtualBackgroundUrl}
        onSelectEffect={handleSelectBackground}
      />
    </div>
  );
}
