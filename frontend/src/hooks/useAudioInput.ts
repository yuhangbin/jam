import { useState, useRef, useCallback, useEffect } from 'react';
import { JAM_CONFIG } from '../config';

interface AudioInputState {
    isRecording: boolean;
    pitch: number | null;
    clarity: number | null;
    volume: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    stream: MediaStream | null;
    recordingDuration: number;
    availableDevices: MediaDeviceInfo[];
    selectedDeviceId: string;
    onSegmentComplete?: (buffer: AudioBuffer, startTime: number) => void;
}

export const useAudioInput = () => {
    const [state, setState] = useState<AudioInputState>({
        isRecording: false,
        pitch: null,
        clarity: null,
        volume: 0,
        audioBlob: null,
        audioUrl: null,
        stream: null,
        recordingDuration: 0,
        availableDevices: [],
        selectedDeviceId: 'default'
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<any>(null);
    const baseState = useRef({ isRecording: false });
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const phraseBufferRef = useRef<Float32Array[]>([]);
    const phraseStartTimeRef = useRef<number>(0);
    const isPhraseActiveRef = useRef<boolean>(false);
    const lastSilenceTimeRef = useRef<number>(0);
    const onSegmentCompleteRef = useRef<((buffer: AudioBuffer, startTime: number) => void) | null>(null);

    const refreshDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            setState(prev => ({ ...prev, availableDevices: audioInputs }));
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    }, []);

    const setSelectedDeviceId = useCallback((deviceId: string) => {
        setState(prev => ({ ...prev, selectedDeviceId: deviceId }));
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (analyzerRef.current) {
            analyzerRef.current.disconnect();
            analyzerRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
        baseState.current.isRecording = false;
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: state.selectedDeviceId !== 'default' ? { exact: state.selectedDeviceId } : undefined
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            baseState.current.isRecording = true;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);

                setTimeout(() => {
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                    }
                }, 500);

                setState(prev => ({
                    ...prev,
                    isRecording: false,
                    audioBlob: blob,
                    audioUrl: url,
                    stream: null,
                }));
            };

            mediaRecorder.start(1000); // Capture chunks every 1 second for robustness

            // Setup Web Audio for Real-time Phrase Detection
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            analyzerRef.current = analyzer;

            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            source.connect(analyzer);
            analyzer.connect(processor);
            processor.connect(audioCtx.destination);

            phraseBufferRef.current = [];
            isPhraseActiveRef.current = false;
            lastSilenceTimeRef.current = performance.now();

            const threshold = 0.005;
            const silenceDelay = 1000; // 1s
            const preRollMs = 200; // 200ms pre-roll
            const preRollFrames = Math.floor((audioCtx.sampleRate / 4096) * (preRollMs / 1000));
            const ringBuffer: Float32Array[] = [];

            processor.onaudioprocess = (e) => {
                if (!baseState.current.isRecording) return;
                const inputData = e.inputBuffer.getChannelData(0);

                // Keep pre-roll ring buffer
                ringBuffer.push(new Float32Array(inputData));
                if (ringBuffer.length > Math.max(1, preRollFrames)) {
                    ringBuffer.shift();
                }

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                const now = performance.now();

                if (rms > threshold) {
                    if (!isPhraseActiveRef.current) {
                        isPhraseActiveRef.current = true;
                        // Calculate startTime including pre-roll
                        const currentSessionTime = audioCtx.currentTime;
                        const preRollOffset = ringBuffer.length * (4096 / audioCtx.sampleRate);
                        phraseStartTimeRef.current = Math.max(0, currentSessionTime - preRollOffset);

                        // Seed phrase buffer with pre-roll
                        phraseBufferRef.current = [...ringBuffer];
                        console.log("[useAudioInput] Phrase Onset (with pre-roll) at", phraseStartTimeRef.current);
                    } else {
                        phraseBufferRef.current.push(new Float32Array(inputData));
                    }
                    lastSilenceTimeRef.current = now;
                } else if (isPhraseActiveRef.current) {
                    phraseBufferRef.current.push(new Float32Array(inputData));

                    if (now - lastSilenceTimeRef.current > silenceDelay) {
                        const phraseDuration = audioCtx.currentTime - phraseStartTimeRef.current;
                        // Actual melodic duration (excluding the final silence delay)
                        const melodicDuration = phraseDuration - (silenceDelay / 1000);

                        if (melodicDuration >= 1.5) {
                            console.log("[useAudioInput] Phrase finalized:", melodicDuration.toFixed(2), "s (melodic)");

                            const totalLength = phraseBufferRef.current.reduce((acc, b) => acc + b.length, 0);
                            const phraseData = new Float32Array(totalLength);
                            let offset = 0;
                            for (const b of phraseBufferRef.current) {
                                phraseData.set(b, offset);
                                offset += b.length;
                            }

                            const segmentBuffer = audioCtx.createBuffer(1, totalLength, audioCtx.sampleRate);
                            segmentBuffer.copyToChannel(phraseData, 0);

                            if (onSegmentCompleteRef.current) {
                                // Pass the buffer and the start time. 
                                // To fix the AI timing, we also need to know when the sound ACTUALLY ended.
                                onSegmentCompleteRef.current(segmentBuffer, phraseStartTimeRef.current);
                            }
                        }

                        isPhraseActiveRef.current = false;
                        phraseBufferRef.current = [];
                    }
                }
            };

            setState(prev => ({
                ...prev,
                isRecording: true,
                audioBlob: null,
                audioUrl: null,
                stream,
                recordingDuration: 0
            }));

            // Start duration timer
            let duration = 0;
            timerRef.current = setInterval(() => {
                duration += 1;
                setState(prev => ({ ...prev, recordingDuration: duration }));

                if (duration >= JAM_CONFIG.MAX_DURATION) {
                    console.warn("[useAudioInput] Max duration reached, stopping recording.");
                    stopRecording();
                }
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setState(prev => ({ ...prev, isRecording: false }));
        }
    }, [stopRecording, state.selectedDeviceId]);

    // Expose a way to set the callback (since it might change and we use it in a closure)
    const setOnSegmentComplete = useCallback((callback: (buffer: AudioBuffer, startTime: number) => void) => {
        onSegmentCompleteRef.current = callback;
    }, []);

    // Cleanup and Device Refresh on mount
    useEffect(() => {
        refreshDevices();
        navigator.mediaDevices.addEventListener('devicechange', refreshDevices);

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (processorRef.current) processorRef.current.disconnect();
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => { });
        };
    }, [refreshDevices]);

    const reset = useCallback(() => {
        setState(prev => ({
            ...prev,
            audioBlob: null,
            audioUrl: null,
            recordingDuration: 0,
            pitch: null,
            clarity: null,
            volume: 0
        }));
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording,
        setSelectedDeviceId,
        refreshDevices,
        setOnSegmentComplete,
        reset
    };
};
