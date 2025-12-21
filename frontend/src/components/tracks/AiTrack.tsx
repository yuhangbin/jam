import React from 'react';

import type { AudioObject } from '../../types';
import { WaveformPlayer } from '../WaveformPlayer';
import { JAM_CONFIG } from '../../config';

interface AiTrackProps {
    audioObjects?: AudioObject[];
    isPlaying: boolean;
    currentTime?: number;
    totalDuration?: number;
    volume: number;
    isMuted: boolean;
    resetTrigger: number;
    instrument: string | undefined;
    onInstrumentChange: (instrument: string) => void;
}

export const AiTrack: React.FC<AiTrackProps> = ({
    audioObjects = [],
    isPlaying,
    currentTime,
    totalDuration,
    volume,
    isMuted,
    resetTrigger,
    instrument,
    onInstrumentChange
}) => {
    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="flex-1 relative min-h-[64px]">
                {audioObjects.length > 0 ? (
                    <div className="absolute inset-0">
                        {audioObjects.map(obj => (
                            <WaveformPlayer
                                key={obj.id}
                                audioBuffer={obj.buffer}
                                isPlaying={isPlaying}
                                resetTrigger={resetTrigger}
                                volume={volume}
                                isMuted={isMuted}
                                height={64}
                                waveColor={JAM_CONFIG.THEME.AI.WAVE}
                                progressColor={JAM_CONFIG.THEME.AI.PROGRESS}
                                currentTime={currentTime}
                                totalDuration={totalDuration}
                                startTime={obj.startTime}
                                duration={obj.duration}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full p-2 opacity-80 flex items-center justify-center">
                        <div className="text-xs text-blue-300 font-mono tracking-widest uppercase opacity-70 animate-pulse">
                            Waiting for User Melody...
                        </div>
                    </div>
                )}
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
