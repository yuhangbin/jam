import React from 'react';
import { WaveformPlayer } from '../WaveformPlayer';
import { JAM_CONFIG } from '../../config';

interface UserTrackProps {
    audioFile: File | Blob | null | undefined;
    isRecording: boolean;
    isPlaying: boolean;
    stream: MediaStream | null;
    resetTrigger: number;
    volume: number;
    isMuted: boolean;
    currentTime?: number;
    availableDevices: MediaDeviceInfo[];
    selectedDeviceId: string;
    onDeviceChange: (deviceId: string) => void;
}

export const UserTrack: React.FC<UserTrackProps> = ({
    audioFile,
    isRecording,
    isPlaying,
    stream,
    resetTrigger,
    volume,
    isMuted,
    currentTime,
    availableDevices,
    selectedDeviceId,
    onDeviceChange
}) => {
    return (
        <div className="w-full h-full relative group/wave flex flex-col px-4 py-2">
            <div className="flex-1 min-h-0 relative">
                {(isRecording || audioFile) ? (
                    <WaveformPlayer
                        key={isRecording ? 'recording' : 'playback'}
                        audioFile={audioFile}
                        micStream={isRecording ? stream : null}
                        isRecording={isRecording}
                        isPlaying={isPlaying}
                        resetTrigger={resetTrigger}
                        volume={volume}
                        isMuted={isMuted}
                        height={80}
                        waveColor={isRecording ? JAM_CONFIG.THEME.USER.RECORDING : JAM_CONFIG.THEME.USER.WAVE}
                        progressColor={JAM_CONFIG.THEME.USER.PROGRESS}
                        currentTime={currentTime}
                    />
                ) : (
                    <div className="w-full h-full p-2 opacity-80 flex items-center justify-center">
                        <div className="text-xs text-pink-300 font-mono tracking-widest uppercase opacity-70 animate-pulse">
                            Waiting for Recording Input...
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-mono text-pink-400/60 uppercase tracking-widest">Input Select</span>
                <select
                    value={selectedDeviceId}
                    onChange={(e) => onDeviceChange(e.target.value)}
                    disabled={isRecording}
                    className="bg-black/40 border border-pink-500/20 rounded px-2 py-1 text-[10px] outline-none focus:border-pink-500/50 text-pink-300 transition-all font-medium max-w-[150px] truncate"
                >
                    <option value="default">System Default</option>
                    {availableDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
