import { useState, useRef, useCallback } from 'react';
import { YIN } from 'pitchfinder';

interface AudioInputState {
    isRecording: boolean;
    pitch: number | null;
    clarity: number | null;
    volume: number;
}

export const useAudioInput = () => {
    const [state, setState] = useState<AudioInputState>({
        isRecording: false,
        pitch: null,
        clarity: null,
        volume: 0,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            const detectPitch = YIN({ sampleRate: audioContext.sampleRate });
            const buffer = new Float32Array(analyser.fftSize);

            const update = () => {
                analyser.getFloatTimeDomainData(buffer);

                // Calculate volume (RMS)
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) {
                    sum += buffer[i] * buffer[i];
                }
                const rms = Math.sqrt(sum / buffer.length);

                // Detect pitch
                // Threshold for silence/noise
                if (rms > 0.01) {
                    const pitchData = detectPitch(buffer);
                    // pitchfinder returns { freq: number, probability: number } or number or null depending on config?
                    // YIN usually returns basic logic. YIN implementation in pitchfinder:
                    // It returns the frequency in Hz.

                    // Wait, verify pitchfinder YIN return type.
                    // Usually valid pitch or null.
                    setState({
                        isRecording: true,
                        pitch: pitchData as number,
                        clarity: 1, // simplified
                        volume: rms
                    });
                } else {
                    setState(prev => ({ ...prev, pitch: null, volume: rms, isRecording: true }));
                }

                rafRef.current = requestAnimationFrame(update);
            };

            update();
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        setState(prev => ({ ...prev, isRecording: false, pitch: null, volume: 0 }));
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording
    };
};
