import { Shield, ShieldCheck, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SecurityIndicatorProps {
  isEncrypted: boolean;
  hasPassword: boolean;
  waitingRoomEnabled: boolean;
}

export function SecurityIndicator({
  isEncrypted,
  hasPassword,
  waitingRoomEnabled,
}: SecurityIndicatorProps) {
  const securityLevel = [isEncrypted, hasPassword, waitingRoomEnabled].filter(Boolean).length;
  const label =
    securityLevel === 3
      ? "Maximum Security"
      : securityLevel === 2
      ? "High Security"
      : securityLevel === 1
      ? "Basic Security"
      : "No Security";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 rounded-full bg-meeting-card px-3 py-1.5">
          {securityLevel >= 2 ? (
            <ShieldCheck className="h-4 w-4 text-accent" />
          ) : (
            <Shield className="h-4 w-4 text-meeting-muted" />
          )}
          <span className="text-xs font-medium text-meeting-text">{label}</span>
          {isEncrypted && <Lock className="h-3 w-3 text-accent" />}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium">Security Status</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isEncrypted ? "bg-accent" : "bg-muted-foreground"}`} />
              <span>End-to-end encryption: {isEncrypted ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${hasPassword ? "bg-accent" : "bg-muted-foreground"}`} />
              <span>Password protection: {hasPassword ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${waitingRoomEnabled ? "bg-accent" : "bg-muted-foreground"}`} />
              <span>Waiting room: {waitingRoomEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
