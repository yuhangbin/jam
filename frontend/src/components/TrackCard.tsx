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
    extraControls,
    children
}) => {
    return (
        <div className="glass-panel rounded-[32px] p-4 flex items-center gap-5 h-48 relative overflow-hidden group shrink-0 transition-all duration-500 hover:bg-white/10 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] hover:-translate-y-1 border border-white/5 shadow-xl">
            {/* Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-2 opacity-80" style={{ backgroundColor: color }}></div>

            {/* LEFT PANEL: Narrower relative to new height */}
            <div className="w-44 flex flex-col h-full shrink-0 border-r border-white/5 pr-4 justify-between py-3 ml-2">
                {/* Top: Type & Name */}
                <div>
                    <div className="text-[10px] font-bold tracking-widest opacity-40 uppercase mb-2">{type}</div>
                    <input
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="bg-transparent border-b border-white/5 hover:border-white/20 focus:border-blue-500 outline-none w-full text-base font-medium text-white/90 placeholder-white/30 transition-colors pb-1"
                    />
                </div>

                {/* Middle: Extra Controls (Upload, Select) */}
                <div className="py-2">
                    {extraControls}
                </div>

                {/* Bottom: M/S & Volume */}
                <div className="flex items-center gap-3 mt-auto">
                    {/* M/S Buttons */}
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={onMuteToggle}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 transition-all duration-200
                        ${isMuted ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:scale-105'}`}
                            title="Mute"
                        >
                            M
                        </button>
                        <button
                            onClick={onSoloToggle}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 transition-all duration-200
                        ${isSolo ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:scale-105'}`}
                            title="Solo"
                        >
                            S
                        </button>
                    </div>

                    {/* Volume Slider - Native Range Input styled */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                    />
                </div>
            </div>

            {/* RIGHT PANEL: Content/Visualization */}
            <div className="flex-1 h-full relative flex items-center bg-black/40 rounded-[24px] overflow-hidden shadow-inner border border-white/5 backdrop-blur-sm">
                {/* Fuller Grid Markers */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`flex-1 border-r border-white/5 h-full ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <div className="h-full w-px bg-gradient-to-b from-white/10 to-transparent mx-auto opacity-30"></div>
                        </div>
                    ))}
                </div>

                <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
                    {children}
                </div>
            </div>

        </div>
    );
};
