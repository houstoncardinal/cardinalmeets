import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptSegment {
  id: string;
  speakerName: string;
  text: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  transcripts: TranscriptSegment[];
  isTranscribing: boolean;
  onClose: () => void;
}

export function TranscriptPanel({
  transcripts,
  isTranscribing,
  onClose,
}: TranscriptPanelProps) {
  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-meeting-text">Captions</h3>
          {isTranscribing && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-meeting-muted hover:bg-meeting-border hover:text-meeting-text"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-meeting-muted">
              {isTranscribing
                ? "Listening for speech..."
                : "Captions will appear here when enabled"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transcripts.map((segment) => (
              <div key={segment.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">
                    {segment.speakerName}
                  </span>
                  <span className="text-xs text-meeting-muted">
                    {segment.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-meeting-text">{segment.text}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
