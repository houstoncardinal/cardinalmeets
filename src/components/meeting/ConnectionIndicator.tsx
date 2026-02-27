import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConnectionIndicatorProps {
  quality: "excellent" | "good" | "fair" | "poor" | "disconnected";
  latency: number;
}

const qualityConfig = {
  excellent: { color: "text-green-500", bars: 4, label: "Excellent" },
  good: { color: "text-green-400", bars: 3, label: "Good" },
  fair: { color: "text-yellow-500", bars: 2, label: "Fair" },
  poor: { color: "text-destructive", bars: 1, label: "Poor" },
  disconnected: { color: "text-meeting-text-muted", bars: 0, label: "Disconnected" },
};

export function ConnectionIndicator({ quality, latency }: ConnectionIndicatorProps) {
  const config = qualityConfig[quality];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 ${config.color}`}>
          {quality === "disconnected" ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-sm transition-all ${
                    bar <= config.bars ? config.color.replace("text-", "bg-") : "bg-meeting-border"
                  }`}
                  style={{ height: `${bar * 25}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.label} • {latency}ms</p>
      </TooltipContent>
    </Tooltip>
  );
}
