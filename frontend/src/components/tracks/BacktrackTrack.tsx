import React, { useRef } from 'react';
import { WaveformPlayer } from '../WaveformPlayer';
import { UploadIcon } from '../ui/GeometricIcons';
import { JAM_CONFIG } from '../../config';

interface BacktrackTrackProps {
    audioFile: File | Blob | null | undefined;
    isPlaying: boolean;
    resetTrigger: number;
    volume: number;
    isMuted: boolean;
    currentTime?: number;
    onReady: (data: { bpm: number; duration: number }) => void;
    onFinish: () => void;
    onUpload: (file: File) => void;
    onTimeUpdate?: (time: number) => void;
}

export const BacktrackTrack: React.FC<BacktrackTrackProps> = ({
    audioFile,
    isPlaying,
    resetTrigger,
    volume,
    isMuted,
    currentTime,
    onReady,
    onFinish,
    onUpload,
    onTimeUpdate
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div className="w-full h-full relative group/wave flex items-center px-4">
            {audioFile ? (
                <WaveformPlayer
                    audioFile={audioFile}
                    isPlaying={isPlaying}
                    resetTrigger={resetTrigger}
                    volume={volume}
                    isMuted={isMuted}
                    height={96}
                    waveColor={JAM_CONFIG.THEME.BACKTRACK.WAVE}
                    progressColor={JAM_CONFIG.THEME.BACKTRACK.PROGRESS}
                    onReady={onReady}
                    onFinish={onFinish}
                    currentTime={currentTime}
                />
            ) : (
                <div className="w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-full flex items-center gap-[2px] h-24 px-2 items-end justify-center opacity-40 grayscale">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="flex-1 bg-white/20 rounded-t-sm" style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 30 + 20)}%` }}></div>
                        ))}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="text-xs font-mono text-white/50 tracking-widest uppercase">No Backtrack Uploaded</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="audio/*"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-bold text-emerald-400 transition-all flex items-center gap-2 border border-emerald-500/20 hover:scale-105"
                        >
                            <UploadIcon className="w-3 h-3" />
                            UPLOAD BACKTRACK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
