import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { MeetingControls } from "@/components/meeting/MeetingControls";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";

const mockParticipants = [
  {
    id: "1",
    name: "You",
    initials: "YO",
    isMuted: false,
    isVideoOn: true,
    isLocal: true,
    isHost: true,
    isSpeaking: false,
  },
  {
    id: "2",
    name: "Sarah Chen",
    initials: "SC",
    isMuted: false,
    isVideoOn: true,
    isSpeaking: true,
  },
  {
    id: "3",
    name: "Alex Johnson",
    initials: "AJ",
    isMuted: true,
    isVideoOn: true,
  },
  {
    id: "4",
    name: "Michael Brown",
    initials: "MB",
    isMuted: false,
    isVideoOn: false,
  },
];

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const handleLeaveMeeting = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen flex-col bg-meeting-bg">
      <MeetingHeader
        meetingId={meetingId || "abc-defg-hij"}
        meetingTitle="Team Weekly Standup"
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            <VideoGrid participants={mockParticipants} />
          </div>

          <div className="flex justify-center pb-6">
            <MeetingControls
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onToggleParticipants={() =>
                setIsParticipantsOpen(!isParticipantsOpen)
              }
              onLeaveMeeting={handleLeaveMeeting}
              isChatOpen={isChatOpen}
              isParticipantsOpen={isParticipantsOpen}
            />
          </div>
        </div>

        {isParticipantsOpen && (
          <ParticipantsPanel
            participants={mockParticipants}
            onClose={() => setIsParticipantsOpen(false)}
          />
        )}

        {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
      </div>
    </div>
  );
}
