import { WaveformPlayer } from '../WaveformPlayer';
import { JAM_CONFIG } from '../../config';

interface BacktrackTrackProps {
    audioFile: File | Blob | null | undefined;
    isPlaying: boolean;
    resetTrigger: number;
    volume: number;
    isMuted: boolean;
    currentTime?: number;
    totalDuration?: number;
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
    totalDuration,
    onReady,
    onFinish,
    onUpload
}) => {

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
                    totalDuration={totalDuration}
                />
            ) : (
                <div className="w-full flex flex-col items-center justify-center gap-4">
                    <div className="w-full flex items-center gap-[2px] h-24 px-2 items-end justify-center opacity-40 grayscale">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="flex-1 bg-white/20 rounded-t-sm" style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 30 + 20)}%` }}></div>
                        ))}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">No Audio Data</span>
                    </div>
                </div>
            )}
        </div>
    );
};
