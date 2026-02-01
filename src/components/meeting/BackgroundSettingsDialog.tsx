import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Image, Sparkles } from "lucide-react";
import { BackgroundEffect, virtualBackgrounds } from "@/hooks/useBackgroundEffects";

interface BackgroundSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEffect: BackgroundEffect;
  currentBackground?: string;
  onSelectEffect: (effect: BackgroundEffect, backgroundUrl?: string) => void;
}

export function BackgroundSettingsDialog({
  open,
  onOpenChange,
  currentEffect,
  currentBackground,
  onSelectEffect,
}: BackgroundSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Background Effects</DialogTitle>
          <DialogDescription>
            Choose a background effect for your video feed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Effect Options */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onSelectEffect("none")}
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted ${
                currentEffect === "none"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">None</span>
              {currentEffect === "none" && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>

            <button
              onClick={() => onSelectEffect("blur")}
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted ${
                currentEffect === "blur"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">Blur</span>
              {currentEffect === "blur" && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>

            <button
              onClick={() =>
                onSelectEffect("virtual", virtualBackgrounds[0].url)
              }
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted ${
                currentEffect === "virtual"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Virtual</span>
              {currentEffect === "virtual" && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          </div>

          {/* Virtual Backgrounds Grid */}
          {currentEffect === "virtual" && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Select Background
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {virtualBackgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onSelectEffect("virtual", bg.url)}
                    className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all hover:opacity-90 ${
                      currentBackground === bg.url
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="h-full w-full object-cover"
                    />
                    {currentBackground === bg.url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-6 w-6 text-primary-foreground drop-shadow" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-xs font-medium text-white">
                        {bg.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
