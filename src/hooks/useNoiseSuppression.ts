import { useState, useRef, useCallback, useEffect } from "react";

interface NoiseSuppressionOptions {
  stream: MediaStream | null;
  enabled: boolean;
}

export function useNoiseSuppression({ stream, enabled }: NoiseSuppressionOptions) {
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);

  const createNoiseSuppressionChain = useCallback((ctx: AudioContext) => {
    // High-pass filter to remove low-frequency noise (hum, rumble)
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 85;
    highPass.Q.value = 0.7;

    // Low-pass to cut high-frequency hiss
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 14000;
    lowPass.Q.value = 0.7;

    // Notch filter for 50/60Hz electrical hum
    const notch50 = ctx.createBiquadFilter();
    notch50.type = "notch";
    notch50.frequency.value = 50;
    notch50.Q.value = 10;

    const notch60 = ctx.createBiquadFilter();
    notch60.type = "notch";
    notch60.frequency.value = 60;
    notch60.Q.value = 10;

    // Compressor for dynamic range control
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Gain to normalize
    const gain = ctx.createGain();
    gain.gain.value = 1.2;

    return { filters: [highPass, lowPass, notch50, notch60], compressor, gain };
  }, []);

  useEffect(() => {
    if (!stream || !enabled) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setProcessedStream(null);
      setIsActive(false);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const destination = ctx.createMediaStreamDestination();
      destinationRef.current = destination;

      const { filters, compressor, gain } = createNoiseSuppressionChain(ctx);
      filtersRef.current = filters;

      // Chain: source -> filters -> compressor -> gain -> destination
      let lastNode: AudioNode = source;
      for (const filter of filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(compressor);
      compressor.connect(gain);
      gain.connect(destination);

      // Combine processed audio with original video
      const videoTracks = stream.getVideoTracks();
      const newStream = new MediaStream([
        ...destination.stream.getAudioTracks(),
        ...videoTracks,
      ]);

      setProcessedStream(newStream);
      setIsActive(true);
    } catch (err) {
      console.error("Noise suppression error:", err);
      setProcessedStream(stream);
      setIsActive(false);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [stream, enabled, createNoiseSuppressionChain]);

  return {
    processedStream: enabled && processedStream ? processedStream : stream,
    isActive,
  };
}
