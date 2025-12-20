import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
// @ts-ignore
import MusicTempo from 'music-tempo';

interface WaveformPlayerProps {
    audioFile: File | Blob | null;
    isPlaying: boolean;
    height?: number;
    waveColor?: string;
    progressColor?: string;
    onReady?: (data: { bpm: number; duration: number }) => void;
    onFinish?: () => void;
}

export const WaveformPlayer = ({
    audioFile,
    isPlaying,
    height = 120,
    waveColor = '#10b981',
    progressColor = '#059669',
    onReady,
    onFinish
}: WaveformPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);

    // 1. Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

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
            minPxPerSec: 50,
            fillParent: true, // Use fillParent false if we want scrolling, wait
            // If minPxPerSec is set, it might force scroll if container is small.
            // Documentation says minPxPerSec causes horizontal scroll.
            // To make scrolling look good, we need to style the container.
            plugins: [
                TimelinePlugin.create({
                    container: containerRef.current,
                    insertPosition: 'beforebegin', // or 'afterend'
                    height: 20,
                    style: {
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '10px',
                    },
                    timeInterval: 5,
                    primaryLabelInterval: 5,
                    secondaryLabelInterval: 1,
                }),
            ],
        });

        // Event Listeners
        ws.on('ready', async () => {
            // Analyze BPM on ready
            try {
                const duration = ws.getDuration();

                // We need the AudioBuffer. Wavesurfer creates it internally.
                const decodedData = ws.getDecodedData();
                let bpm = 120; // default

                if (decodedData) {
                    // MusicTempo expects channel data, passed directly below

                    // Run in a non-blocking way if possible, but for MVP sync is ok for short clips
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
                console.error("BPM Detection failed:", e);
            }
        });

        ws.on('finish', () => {
            if (onFinish) onFinish();
        });

        setWavesurfer(ws);

        return () => {
            ws.destroy();
        };
    }, [height, waveColor, progressColor]); // Re-create if styling changes

    // 2. Load Audio File (Depends on wavesurfer instance)
    useEffect(() => {
        if (audioFile && wavesurfer) {
            const url = URL.createObjectURL(audioFile);
            wavesurfer.load(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [audioFile, wavesurfer]);

    // 3. Sync Playback State
    useEffect(() => {
        if (!wavesurfer) return;
        if (isPlaying) {
            wavesurfer.play();
        } else {
            wavesurfer.pause();
        }
    }, [isPlaying, wavesurfer]);

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
