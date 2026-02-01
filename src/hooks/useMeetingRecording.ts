import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordingId: string | null;
}

export function useMeetingRecording(meetingId: string) {
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    recordingId: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(
    async (streams: MediaStream[]) => {
      try {
        // Create a combined stream from all participant streams
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        streams.forEach((stream) => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        });

        // Get the first video track (usually local)
        const videoTrack = streams[0]?.getVideoTracks()[0];
        const combinedStream = new MediaStream([
          videoTrack,
          ...destination.stream.getAudioTracks(),
        ].filter(Boolean));

        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          await saveRecording(blob);
        };

        mediaRecorder.start(1000); // Collect data every second
        startTimeRef.current = Date.now();

        // Start duration timer
        timerRef.current = window.setInterval(() => {
          setState((prev) => ({
            ...prev,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
          }));
        }, 1000);

        setState((prev) => ({ ...prev, isRecording: true, isPaused: false }));

        toast({
          title: "Recording started",
          description: "Meeting is now being recorded",
        });
      } catch (error) {
        console.error("Failed to start recording:", error);
        toast({
          title: "Recording failed",
          description: "Could not start recording. Please check permissions.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  const saveRecording = async (blob: Blob) => {
    try {
      // For now, create a download link since we need to set up storage
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${meetingId}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Recording saved",
        description: "Your recording has been downloaded",
      });

      // Also save reference to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("meeting_recordings").insert({
          meeting_id: meetingId,
          recorded_by: user.id,
          file_url: `local-download-${Date.now()}`,
          duration_seconds: state.duration,
          file_size_bytes: blob.size,
          status: "ready",
        });
      }
    } catch (error) {
      console.error("Failed to save recording:", error);
      toast({
        title: "Save failed",
        description: "Could not save the recording",
        variant: "destructive",
      });
    }
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
