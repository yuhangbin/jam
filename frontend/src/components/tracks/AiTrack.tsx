import React from 'react';

interface AiTrackProps {
    instrument: string | undefined;
    onInstrumentChange: (instrument: string) => void;
}

export const AiTrack: React.FC<AiTrackProps> = ({
    instrument,
    onInstrumentChange
}) => {
    return (
        <div className="w-full h-full flex flex-col gap-3 px-4 py-2">
            <div className="flex-1 flex items-center gap-[3px] h-16 justify-center opacity-60">
                {Array.from({ length: 48 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-full animate-pulse"
                        style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: '1.5s'
                        }}
                    ></div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">AI Visualization</span>
                <select
                    value={instrument}
                    onChange={(e) => onInstrumentChange(e.target.value)}
                    className="bg-black/40 border border-blue-500/20 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-500/50 text-blue-300 transition-all font-medium"
                >
                    <option value="Grand Piano">Grand Piano</option>
                    <option value="Synth Pad">Synth Pad</option>
                    <option value="Electric Guitar">Electric Guitar</option>
                    <option value="Cello Ensemble">Cello Ensemble</option>
                </select>
            </div>
        </div>
    );
};
