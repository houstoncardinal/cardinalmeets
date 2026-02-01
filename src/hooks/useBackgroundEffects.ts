import { useCallback, useEffect, useRef, useState } from "react";

export type BackgroundEffect = "none" | "blur" | "virtual";

interface BackgroundEffectsOptions {
  stream: MediaStream | null;
  effect: BackgroundEffect;
  virtualBackgroundUrl?: string;
}

export function useBackgroundEffects({
  stream,
  effect,
  virtualBackgroundUrl,
}: BackgroundEffectsOptions) {
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const virtualBgImageRef = useRef<HTMLImageElement | null>(null);

  // Load virtual background image
  useEffect(() => {
    if (effect === "virtual" && virtualBackgroundUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        virtualBgImageRef.current = img;
      };
      img.src = virtualBackgroundUrl;
    }
  }, [effect, virtualBackgroundUrl]);

  // Apply background effect using Canvas API
  const applyEffect = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(applyEffect);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    if (effect === "blur") {
      // Apply blur effect using CSS filter on canvas
      ctx.filter = "blur(10px)";
      ctx.drawImage(video, -20, -20, canvas.width + 40, canvas.height + 40);
      ctx.filter = "none";

      // Draw the person in focus (simplified - in production use ML segmentation)
      // For now, draw the center portion clearly
      const centerX = canvas.width * 0.2;
      const centerY = canvas.height * 0.1;
      const centerW = canvas.width * 0.6;
      const centerH = canvas.height * 0.85;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        canvas.width / 2,
        canvas.height / 2,
        centerW / 2,
        centerH / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else if (effect === "virtual" && virtualBgImageRef.current) {
      // Draw virtual background
      ctx.drawImage(
        virtualBgImageRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Draw person over virtual background (simplified)
      const centerX = canvas.width * 0.2;
      const centerY = canvas.height * 0.1;
      const centerW = canvas.width * 0.6;
      const centerH = canvas.height * 0.85;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        canvas.width / 2,
        canvas.height / 2,
        centerW / 2,
        centerH / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // No effect - just draw the video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(applyEffect);
  }, [effect]);

  // Set up video processing pipeline
  useEffect(() => {
    if (!stream || effect === "none") {
      setProcessedStream(stream);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    // Create hidden video element to play source stream
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    // Create canvas for processing
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvasRef.current = canvas;

    video.onloadedmetadata = () => {
      video.play();
      // Start animation loop
      animationRef.current = requestAnimationFrame(applyEffect);

      // Capture canvas stream
      const processedVideoStream = canvas.captureStream(30);

      // Keep original audio track
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        processedVideoStream.addTrack(track);
      });

      setProcessedStream(processedVideoStream);
      setIsProcessing(false);
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      video.pause();
      video.srcObject = null;
    };
  }, [stream, effect, applyEffect]);

  return {
    processedStream: processedStream || stream,
    isProcessing,
  };
}

export const virtualBackgrounds = [
  {
    id: "office",
    name: "Modern Office",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop",
  },
  {
    id: "nature",
    name: "Nature",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop",
  },
  {
    id: "library",
    name: "Library",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1280&h=720&fit=crop",
  },
  {
    id: "beach",
    name: "Beach",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&h=720&fit=crop",
  },
  {
    id: "city",
    name: "City Skyline",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&h=720&fit=crop",
  },
];
