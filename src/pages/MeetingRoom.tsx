import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { MeetingControls } from "@/components/meeting/MeetingControls";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useTranscription } from "@/hooks/useTranscription";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);

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
    stream: p.stream,
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
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={handleToggleScreenShare}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
              onToggleCaptions={handleToggleCaptions}
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
      </div>
    </div>
  );
}
