import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mic, MicOff, Video, VideoOff, Settings2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreMeetingLobbyProps {
  meetingCode: string;
  meetingTitle?: string;
  onJoin: (settings: {
    audioDeviceId?: string;
    videoDeviceId?: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
  onCancel: () => void;
}

export function PreMeetingLobby({ meetingCode, meetingTitle, onJoin, onCancel }: PreMeetingLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Request initial permission and enumerate devices
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initial = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        initial.getTracks().forEach((t) => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const audio = all.filter((d) => d.kind === "audioinput");
        const video = all.filter((d) => d.kind === "videoinput");
        const output = all.filter((d) => d.kind === "audiooutput");
        setAudioDevices(audio);
        setVideoDevices(video);
        setOutputDevices(output);
        setSelectedAudio(audio[0]?.deviceId || "");
        setSelectedVideo(video[0]?.deviceId || "");
        setSelectedOutput(output[0]?.deviceId || "");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Permission denied";
        setPermissionError(msg);
        toast({
          title: "Camera or microphone unavailable",
          description: "Grant permission to preview your devices, or join with them off.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  // Set up live preview stream when device selection changes
  useEffect(() => {
    let cancelled = false;
    if (!selectedAudio && !selectedVideo) return;
    (async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : false,
          video: selectedVideo
            ? { deviceId: { exact: selectedVideo }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        // Apply mute/video state
        stream.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
        stream.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Audio level meter
        if (audioCtxRef.current) await audioCtxRef.current.close().catch(() => {});
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, (avg / 128) * 100));
          requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.error("Preview stream error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudio, selectedVideo]);

  // Sync mute toggles with live tracks
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = audioEnabled));
  }, [audioEnabled]);
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = videoEnabled));
  }, [videoEnabled]);

  // Apply output device (speaker) when supported
  useEffect(() => {
    const v = videoRef.current as (HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (v && selectedOutput && typeof v.setSinkId === "function") {
      v.setSinkId(selectedOutput).catch(() => {});
    }
  }, [selectedOutput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const handleJoin = () => {
    // Stop preview before handing off — meeting room will request its own stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    onJoin({
      audioDeviceId: selectedAudio || undefined,
      videoDeviceId: selectedVideo || undefined,
      audioEnabled,
      videoEnabled,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-meeting-bg p-4">
      <Card className="w-full max-w-4xl border-meeting-border bg-meeting-card p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-meeting-text">Ready to join?</h1>
          <p className="mt-1 text-sm text-meeting-text-muted">
            {meetingTitle ? `${meetingTitle} · ` : ""}Code: {meetingCode}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Video preview */}
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : videoEnabled && !permissionError ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover [transform:scaleX(-1)]" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-meeting-text-muted">
                  <VideoOff className="h-10 w-10" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}

              {/* Audio level meter */}
              {!loading && !permissionError && audioEnabled && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
                  <Mic className="h-3.5 w-3.5 text-white" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-100"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setAudioEnabled((v) => !v)}
                className={`h-12 w-12 rounded-full p-0 ${audioEnabled ? "bg-meeting-bg text-meeting-text" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setVideoEnabled((v) => !v)}
                className={`h-12 w-12 rounded-full p-0 ${videoEnabled ? "bg-meeting-bg text-meeting-text" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Device selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-meeting-text">
              <Settings2 className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Devices</h2>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-meeting-text-muted">Microphone</Label>
              <Select value={selectedAudio} onValueChange={setSelectedAudio} disabled={audioDevices.length === 0}>
                <SelectTrigger><SelectValue placeholder="Default microphone" /></SelectTrigger>
                <SelectContent>
                  {audioDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-meeting-text-muted">Camera</Label>
              <Select value={selectedVideo} onValueChange={setSelectedVideo} disabled={videoDevices.length === 0}>
                <SelectTrigger><SelectValue placeholder="Default camera" /></SelectTrigger>
                <SelectContent>
                  {videoDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {outputDevices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-meeting-text-muted">Speaker</Label>
                <Select value={selectedOutput} onValueChange={setSelectedOutput}>
                  <SelectTrigger><SelectValue placeholder="Default speaker" /></SelectTrigger>
                  <SelectContent>
                    {outputDevices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {permissionError && (
              <p className="text-xs text-destructive">
                {permissionError}. You can still join, but your camera and mic will be unavailable.
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleJoin} size="lg" className="w-full" disabled={loading}>
                Join now
              </Button>
              <Button onClick={onCancel} variant="ghost" size="lg" className="w-full text-meeting-text-muted">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
