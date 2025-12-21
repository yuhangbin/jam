import React from 'react';

interface TrackCardProps {
    id: string;
    name: string;
    type: 'BACKTRACK' | 'USER' | 'AI';
    color: string;
    isMuted: boolean;
    isSolo: boolean;
    volume: number;
    onMuteToggle: () => void;
    onSoloToggle: () => void;
    onVolumeChange: (val: number) => void;
    onNameChange: (val: string) => void;
    extraControls?: React.ReactNode;
    children?: React.ReactNode; // Visualization
}

export const TrackCard: React.FC<TrackCardProps> = ({
    name,
    type,
    color,
    isMuted,
    isSolo,
    volume,
    onMuteToggle,
    onSoloToggle,
    onVolumeChange,
    onNameChange,
    extraControls
}) => {
    return (
        <div className="w-full h-full relative flex gap-4 overflow-hidden group/card transition-all duration-300">
            {/* Minimal Accent Line */}
            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full opacity-60" style={{ backgroundColor: color }}></div>

            {/* PANEL: M/S & Volume */}
            <div className="flex-1 flex flex-col h-full justify-between py-2 pl-4 relative z-10">
                {/* Top: Type & Name */}
                <div>
                    <div className="text-[10px] font-bold tracking-[0.2em] opacity-30 uppercase mb-1">{type}</div>
                    <input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-white/90 placeholder-white/20 transition-colors"
                    />
                </div>

                {/* Middle: Extra Controls */}
                <div className="py-2 flex-grow flex items-center">
                    {extraControls}
                </div>

                {/* Bottom: M/S & Volume */}
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <button
                            onClick={onMuteToggle}
                            className={`w-7 h-7 rounded bg-white/5 border border-white/5 text-[9px] font-black transition-all
                            ${isMuted ? 'bg-red-500/80 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                        >
                            M
                        </button>
                        <button
                            onClick={onSoloToggle}
                            className={`w-7 h-7 rounded bg-white/5 border border-white/5 text-[9px] font-black transition-all
                            ${isSolo ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                        >
                            S
                        </button>
                    </div>

                    <div className="flex-1 bg-white/5 h-1 rounded-full relative group/vol cursor-pointer overflow-hidden">
                        <div
                            className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all"
                            style={{ width: `${volume * 100}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
