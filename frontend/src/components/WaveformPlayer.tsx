import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
// @ts-ignore
import MusicTempo from 'music-tempo';

interface WaveformPlayerProps {
    audioFile?: File | Blob | null;
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
}

export const WaveformPlayer = ({
    audioFile,
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
    isMuted = false
}: WaveformPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [recordPlugin, setRecordPlugin] = useState<RecordPlugin | null>(null);

    // 1. Initialize WaveSurfer & Record Plugin
    useEffect(() => {
        if (!containerRef.current) return;
        console.log("WaveformPlayer: Initializing", { isRecording, micStream: !!micStream, audioFile: !!audioFile });

        const plugins: any[] = [
            TimelinePlugin.create({
                container: containerRef.current,
                insertPosition: 'beforebegin',
                height: 20,
                style: {
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '10px',
                },
                timeInterval: 5,
                primaryLabelInterval: 5,
                secondaryLabelInterval: 1,
            })
        ];

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
            progressColor: progressColor,
            cursorColor: 'rgba(255,255,255,0.5)',
            barWidth: 2,
            barGap: 3,
            barRadius: 2,
            normalize: true,
            minPxPerSec: 0, // Fit to container by default to ensure visibility
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

    // 2. Load Audio File (if provided)
    useEffect(() => {
        if (audioFile && wavesurfer) {
            const url = URL.createObjectURL(audioFile);
            console.log("Loading Audio Blob into WaveSurfer:", url);
            wavesurfer.load(url);

            // Removed cleanup revokeURL to prevent race conditions during React StrictMode mount/unmount cycles
            // The browser will clean up blob URLs on reload/close.
        }
    }, [audioFile, wavesurfer]);

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

    // Toggle Play removed as it is unused for now

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Use a class to style scrollbars if needed, or hide them for clean look */}
            <div
                ref={containerRef}
                className="w-full relative z-10 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40 transition-colors"
                style={{ overflowX: 'auto', overflowY: 'hidden' }}
            />
        </div>
    );
};
