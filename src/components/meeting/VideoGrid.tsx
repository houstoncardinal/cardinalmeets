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
  isScreenShare?: boolean;
  stream?: MediaStream;
  isHost?: boolean;
}

interface VideoGridProps {
  participants: Participant[];
}

export function VideoGrid({ participants }: VideoGridProps) {
  const screenShare = participants.find((p) => p.isScreenShare);
  const otherParticipants = participants.filter((p) => !p.isScreenShare);

  const getGridClass = () => {
    const count = otherParticipants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  const getGridRows = () => {
    const count = otherParticipants.length;
    if (count <= 2) return "grid-rows-1";
    if (count <= 4) return "grid-rows-2";
    if (count <= 6) return "grid-rows-2";
    return "grid-rows-3";
  };

  // Screen share layout
  if (screenShare) {
    return (
      <div className="flex h-full w-full gap-3 p-4">
        <div className="flex-1">
          <VideoTile
            name={screenShare.name}
            initials={screenShare.initials}
            isMuted={screenShare.isMuted}
            isVideoOn={screenShare.isVideoOn}
            isLocal={screenShare.isLocal}
            isScreenShare={screenShare.isScreenShare}
            stream={screenShare.stream}
          />
        </div>
        <div className="flex w-48 flex-col gap-2 overflow-y-auto">
          {otherParticipants.map((participant) => (
            <div key={participant.id} className="aspect-video">
              <VideoTile
                name={participant.name}
                initials={participant.initials}
                avatarUrl={participant.avatarUrl}
                isMuted={participant.isMuted}
                isVideoOn={participant.isVideoOn}
                isLocal={participant.isLocal}
                isSpeaking={participant.isSpeaking}
                stream={participant.stream}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
          stream={participant.stream}
        />
      ))}
    </div>
  );
}
