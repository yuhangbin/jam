import React from 'react';
import { PlayTriangle, StopSquare, RecordCircle, PauseIcon } from './ui/GeometricIcons';

interface GeometricControlBarProps {
    isPlaying: boolean;
    isRecording: boolean;
    onPlay: () => void;
    onStop: () => void;
    onRecord: () => void;
    bpm: number;
    duration: string;
    musicalKey: string;
}

export const GeometricControlBar: React.FC<GeometricControlBarProps> = ({
    isPlaying,
    isRecording,
    onPlay,
    onStop,
    onRecord,
    bpm,
    duration,
    musicalKey
}) => {
    return (
        <div className="h-24 flex items-center justify-center gap-8">
            {/* Transport */}
            <div className="flex items-center gap-6">
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
                    <span className="text-xl font-bold">{musicalKey}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest">Duration</span>
                    <span className="text-xl font-bold">{duration}</span>
                </div>
            </div>
        </div>
    );
};
