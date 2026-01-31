import { VideoTile } from "./VideoTile";

interface Participant {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
}

interface VideoGridProps {
  participants: Participant[];
}

export function VideoGrid({ participants }: VideoGridProps) {
  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  const getGridRows = () => {
    const count = participants.length;
    if (count <= 2) return "grid-rows-1";
    if (count <= 4) return "grid-rows-2";
    if (count <= 6) return "grid-rows-2";
    return "grid-rows-3";
  };

  return (
    <div
      className={`grid h-full w-full gap-3 p-4 ${getGridClass()} ${getGridRows()}`}
    >
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          name={participant.name}
          initials={participant.initials}
          avatarUrl={participant.avatarUrl}
          isMuted={participant.isMuted}
          isVideoOn={participant.isVideoOn}
          isLocal={participant.isLocal}
          isSpeaking={participant.isSpeaking}
        />
      ))}
    </div>
  );
}
