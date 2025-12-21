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
        };
    }, [refreshDevices]);

    return {
        ...state,
        startRecording,
        stopRecording,
        setSelectedDeviceId,
        refreshDevices
    };
};
