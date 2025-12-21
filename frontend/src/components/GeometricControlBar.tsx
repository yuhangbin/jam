import { PlayTriangle, StopSquare, RecordCircle, PauseIcon, TrashIcon } from './ui/GeometricIcons';

interface GeometricControlBarProps {
    isPlaying: boolean;
    isRecording: boolean;
    onPlay: () => void;
    onStop: () => void;
    onRecord: () => void;
    onClear: () => void;
    bpm: number;
    duration: string;
    musicalKey: string;
    onKeyChange: (val: string) => void;
}

export const GeometricControlBar: React.FC<GeometricControlBarProps> = ({
    isPlaying,
    isRecording,
    onPlay,
    onStop,
    onRecord,
    onClear,
    bpm,
    duration,
    musicalKey,
    onKeyChange
}) => {
    return (
        <div className="h-24 flex items-center justify-center gap-8">
            {/* Transport */}
            <div className="flex items-center gap-6">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onClear();
                    }}
                    className="text-white/20 hover:text-red-400 transition-all hover:scale-110 active:scale-95 ml-2 p-1 rounded-md"
                    title="Clear Session"
                >
                    <TrashIcon className="w-5 h-5 pointer-events-none" />
                </button>

                <button
                    onClick={onStop}
                    className="text-gray-400 hover:text-white transition-transform hover:scale-110 active:scale-95"
                    title="Rewind / Stop"
                >
                    <StopSquare className="w-10 h-10" />
                </button>

                <button
                    onClick={onPlay}
                    className={`${isPlaying ? 'text-green-400' : 'text-white'} transition-transform hover:scale-110 active:scale-95`}
                >
                    {isPlaying ? (
                        <PauseIcon className="w-16 h-16" fill="#4ade80" />
                    ) : (
                        <PlayTriangle className="w-16 h-16" fill="white" />
                    )}
                </button>


                <button
                    onClick={onRecord}
                    className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-red-500/80'} hover:text-red-500 transition-transform hover:scale-110 active:scale-95`}
                >
                    <RecordCircle className="w-12 h-12" />
                </button>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-white/10"></div>

            {/* Info Display */}
            <div className="flex gap-8 font-mono text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest">BPM</span>
                    <span className="text-xl font-bold">{bpm}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest">Key</span>
                    <select
                        value={musicalKey}
                        onChange={(e) => onKeyChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-xl font-bold focus:text-purple-400 transition-colors cursor-pointer appearance-none"
                    >
                        {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].flatMap(root => [
                            <option key={`${root} Maj`} value={`${root} Maj`} className="bg-gray-900">{root} Maj</option>,
                            <option key={`${root} Min`} value={`${root} Min`} className="bg-gray-900">{root} Min</option>
                        ])}
                    </select>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest">Duration</span>
                    <span className="text-xl font-bold">{duration}</span>
                </div>
            </div>
        </div>
    );
};
