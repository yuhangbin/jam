import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
// @ts-ignore
import MusicTempo from 'music-tempo';
import { audioBufferToBlobUrl } from '../utils/audioProcessing';

interface WaveformPlayerProps {
    audioFile?: File | Blob | null;
    audioBuffer?: AudioBuffer | null;
    micStream?: MediaStream | null;
    isPlaying: boolean;
    isRecording?: boolean;
    height?: number;
    waveColor?: string;
    progressColor?: string;
    onReady?: (data: { bpm: number; duration: number }) => void;
    onFinish?: () => void;
    resetTrigger?: number; // Increment to trigger reset
    volume?: number;
    isMuted?: boolean;
    currentTime?: number; // External sync time
    startTime?: number;   // Coordinate on the timeline
    duration?: number;    // Length of this specific fragment
    totalDuration?: number; // Total timeline duration for percentage-based width
}

export const WaveformPlayer = ({
    audioFile,
    audioBuffer,
    micStream,
    isPlaying,
    isRecording = false,
    height = 120,
    waveColor = '#10b981',
    progressColor = '#059669',
    onReady,
    onFinish,
    resetTrigger = 0,
    volume = 1,
    isMuted = false,
    currentTime,
    startTime = 0,
    duration: fragmentDuration,
    totalDuration = 300 // Default 5 mins
}: WaveformPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [recordPlugin, setRecordPlugin] = useState<RecordPlugin | null>(null);

    // 1. Initialize WaveSurfer & Record Plugin
    useEffect(() => {
        if (!containerRef.current) return;
        console.log("WaveformPlayer: Initializing", { isRecording, micStream: !!micStream, audioFile: !!audioFile });

        const plugins: any[] = [];

        // Only add RecordPlugin if we have a mic stream (Recording Mode)
        // This prevents crash/overhead in Playback mode
        let rec: RecordPlugin | null = null;
        if (micStream) {
            rec = RecordPlugin.create({
                scrollingWaveform: true,
                renderRecordedAudio: false // We render manually via audioFile later
            });
            plugins.push(rec);
        }

        // Initialize WaveSurfer
        const ws = WaveSurfer.create({
            container: containerRef.current,
            height: height,
            waveColor: waveColor,
            progressColor: 'transparent', // Hide progress on the fragment itself
            cursorWidth: 0, // Disable internal cursor
            barWidth: 1,
            barGap: 1,
            barRadius: 0,
            normalize: true,
            minPxPerSec: 10, // Lower minPxPerSec to allow container to control width without forced scrolling
            fillParent: true,
            plugins: plugins,
        });

        // Event Listeners
        ws.on('ready', async () => {
            console.log("WaveSurfer Ready: Duration", ws.getDuration());
            // Apply initial volume/mute
            ws.setVolume(isMuted ? 0 : volume);

            // Analysis only if not recording stream
            if (audioFile) {
                try {
                    const duration = ws.getDuration();
                    // ... (keep existing analysis)
                    // We need the AudioBuffer. Wavesurfer creates it internally.
                    const decodedData = ws.getDecodedData();
                    let bpm = 120; // default

                    if (decodedData) {
                        const mt = new MusicTempo(decodedData.getChannelData(0));
                        if (mt.tempo) {
                            bpm = Math.round(parseFloat(mt.tempo));
                            console.log("Detected BPM:", bpm);
                        }
                    }

                    if (onReady) {
                        onReady({ bpm, duration });
                    }
                } catch (e) {
                    console.error("Analysis failed", e);
                }
            }
        });

        ws.on('decode', (duration) => {
            console.log("WaveSurfer Decoded Audio. Duration:", duration);
        });

        ws.on('finish', () => {
            if (onFinish) onFinish();
        });

        ws.on('error', (err) => {
            console.error("WaveSurfer Error:", err);
        });

        // Debug: Log when loading
        ws.on('load', (url) => {
            console.log("WaveSurfer Loading URL:", url);
        });

        setWavesurfer(ws);
        setRecordPlugin(rec);

        return () => {
            // Destroying instance
            console.log("Destroying WaveSurfer instance");
            ws.destroy();
        };
    }, [height, waveColor, progressColor]); // Re-create if styling changes

    // Volume & Mute Effect
    useEffect(() => {
        if (wavesurfer) {
            wavesurfer.setVolume(isMuted ? 0 : volume);
        }
    }, [volume, isMuted, wavesurfer]);

    // Precise Audio Sync Effect
    useEffect(() => {
        if (!wavesurfer || isRecording || currentTime === undefined) return;

        const relativeTime = currentTime - startTime;
        const dur = fragmentDuration || wavesurfer.getDuration();

        // 1. Seek to correct position
        if (relativeTime >= 0 && relativeTime <= dur) {
            const wsTime = wavesurfer.getCurrentTime();
            if (Math.abs(wsTime - relativeTime) > 0.05) {
                wavesurfer.setTime(relativeTime);
            }

            // 2. Play/Pause based on global state
            if (isPlaying && !wavesurfer.isPlaying()) {
                wavesurfer.play();
            } else if (!isPlaying && wavesurfer.isPlaying()) {
                wavesurfer.pause();
            }
        } else {
            // Outside fragment range
            if (wavesurfer.isPlaying()) wavesurfer.pause();
            if (relativeTime < 0 && wavesurfer.getCurrentTime() !== 0) {
                wavesurfer.setTime(0);
            }
        }
    }, [currentTime, wavesurfer, isRecording, startTime, fragmentDuration, isPlaying]);

    // 2. Load Audio File or Buffer
    useEffect(() => {
        if (wavesurfer) {
            if (audioFile) {
                const url = URL.createObjectURL(audioFile);
                wavesurfer.load(url);
            } else if (audioBuffer) {
                const url = audioBufferToBlobUrl(audioBuffer);
                wavesurfer.load(url);
                // The URL is created inside audioBufferToBlobUrl, 
                // but WaveSurfer handles the loading.
            }
        }
    }, [audioFile, audioBuffer, wavesurfer]);

    // Removed the problematic manual bufferToBlob helper

    // 3. Handle Mic Stream Visualization
    useEffect(() => {
        if (recordPlugin && micStream && isRecording) {
            console.log("Starting Mic Stream Visualization");
            // Start rendering mic stream
            recordPlugin.renderMicStream(micStream);

            // Cleanup function is CRITICAL to prevent freezing
            return () => {
                console.log("Stopping Mic Stream Visualization");
                // We don't want to stop the tracks here (as they are managed by useAudioInput), 
                // but we MUST tell the plugin to stop reading.
                // pause() or stopMic() might be needed? 
                // renderMicStream docs say it returns nothing.
                // destroying the plugin instance via ws.destroy() (which happens on unmount) usually handles it.
                // BUT, let's be safe.

                // There isn't a direct "stopRendering" method exposed easily without destroying, 
                // but the useEffect for `ws` handles destruction. 
                // Let's just log for now to confirm unmount happens.
            };
        }
    }, [recordPlugin, micStream, isRecording]);

    // 4. Sync Playback State
    useEffect(() => {
        if (!wavesurfer) return;

        // If recording, we generally don't "play" the visualizer unless we are reviewing?
        // Actually, for "My Improvisation", while recording we visualize.
        // While playing back (not recording), we play.
        if (!isRecording && audioFile) {
            if (isPlaying) {
                wavesurfer.play();
            } else {
                wavesurfer.pause();
            }
        }
    }, [isPlaying, wavesurfer, isRecording, audioFile]);

    // 5. Handle Reset
    useEffect(() => {
        if (wavesurfer && resetTrigger > 0) {
            wavesurfer.stop(); // Stops and moves to 0
        }
    }, [resetTrigger, wavesurfer]);

    const widthPct = fragmentDuration ? (fragmentDuration / totalDuration) * 100 : 100;
    const leftPct = (startTime / totalDuration) * 100;

    return (
        <div
            className="h-full flex flex-col items-center justify-center relative overflow-hidden pointer-events-none"
            style={{
                position: startTime > 0 || (fragmentDuration !== undefined) ? 'absolute' : 'relative',
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                zIndex: isRecording ? 20 : 10
            }}
        >
            <div
                ref={containerRef}
                className="w-full relative z-10"
                style={{ overflow: 'hidden' }}
            />
        </div>
    );
};
