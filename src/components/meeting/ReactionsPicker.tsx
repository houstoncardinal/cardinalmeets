import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReactionsPickerProps {
  onReact: (emoji: string) => void;
  emojis: string[];
}

export function ReactionsPicker({ onReact, emojis }: ReactionsPickerProps) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-12 rounded-full bg-meeting-card p-0 text-meeting-text hover:bg-meeting-border"
            >
              <SmilePlus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reactions</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-2" side="top">
        <div className="flex gap-1">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="rounded-lg p-2 text-xl transition-transform hover:scale-125 hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
