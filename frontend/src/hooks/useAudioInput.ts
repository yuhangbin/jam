import { useState, useRef, useCallback } from 'react';

interface AudioInputState {
    isRecording: boolean;
    pitch: number | null;
    clarity: number | null;
    volume: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    stream: MediaStream | null;
}

export const useAudioInput = () => {
    const [state, setState] = useState<AudioInputState>({
        isRecording: false,
        pitch: null,
        clarity: null,
        volume: 0,
        audioBlob: null,
        audioUrl: null,
        stream: null
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Helper ref to avoid closure staleness in RAF if we used state directly, 
            // though cancellation usually sufficient.
            baseState.current = { ...baseState.current, isRecording: true };

            setState(prev => ({ ...prev, stream }));

            // MediaRecorder Setup
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    console.log("Chunk received", e.data.size);
                }
            };

            mediaRecorder.onstop = () => {
                // Use the actual mime type of the recorder
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                console.log("Recorder Stopped. MimeType:", mimeType);

                const blob = new Blob(chunksRef.current, { type: mimeType });
                console.log("Blob created. Size:", blob.size);
                const url = URL.createObjectURL(blob);

                // Cleanup tracks with a small delay to allow UI/RecordPlugin to unmount first
                // This prevents "source node" errors or browser freezes
                setTimeout(() => {
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                        console.log("MediaStream tracks stopped safely.");
                    }
                }, 500);

                // These are now unused/commented out in start(), so they will be null/no-op
                if (sourceRef.current) sourceRef.current.disconnect();
                if (analyserRef.current) analyserRef.current.disconnect();
                if (audioContextRef.current) audioContextRef.current.close();
                if (rafRef.current) cancelAnimationFrame(rafRef.current);

                setState(prev => ({
                    ...prev,
                    isRecording: false,
                    audioBlob: blob,
                    audioUrl: url,
                    stream: null,
                    pitch: null,
                    volume: 0
                }));

                baseState.current = { ...baseState.current, isRecording: false };
            };

            mediaRecorder.start(); // No timeslice to ensure single valid header/file for better decoding compatibility

            // Analysis Setup (Disabled to prevent main thread blocking/freezing)
            /* 
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
                if (!baseState.current.isRecording) return; // Stop loop check

                analyser.getFloatTimeDomainData(buffer);

                // Calculate volume (RMS)
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) {
                    sum += buffer[i] * buffer[i];
                }
                const rms = Math.sqrt(sum / buffer.length);

                if (rms > 0.01) {
                    const pitchData = detectPitch(buffer);
                    setState(prev => ({
                        ...prev,
                        isRecording: true,
                        pitch: pitchData as number,
                        volume: rms
                    }));
                } else {
                    setState(prev => ({ ...prev, pitch: null, volume: rms, isRecording: true }));
                }

                rafRef.current = requestAnimationFrame(update);
            };

            // Initial state set to recording
            setState(prev => ({ ...prev, isRecording: true, audioBlob: null, audioUrl: null }));

            // Use a ref to check isRecording in loop if needed, or just rely on RAF cancellation
            baseState.current = { ...baseState.current, isRecording: true };

            update(); 
            */

            // Simple state update instead of loop
            baseState.current = { ...baseState.current, isRecording: true };
            setState(prev => ({ ...prev, isRecording: true, audioBlob: null, audioUrl: null, stream, pitch: null, volume: 0 }));
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        // Stop MediaRecorder (logic will trigger onstop)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    // Helper ref to avoid closure staleness in RAF if we used state directly, 
    // though cancellation usually sufficient.
    const baseState = useRef({ isRecording: false });

    return {
        ...state,
        startRecording,
        stopRecording
    };
};
