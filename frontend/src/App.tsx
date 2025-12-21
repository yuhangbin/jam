import React, { useState, useEffect, useCallback } from 'react';
import { TrackCard } from './components/TrackCard';
import { GeometricControlBar } from './components/GeometricControlBar';
import { useAudioInput } from './hooks/useAudioInput';
import { useTracks } from './hooks/useTracks';
import { JAM_CONFIG } from './config';

// Individual Track Components
import { BacktrackTrack } from './components/tracks/BacktrackTrack';
import { UserTrack } from './components/tracks/UserTrack';
import { AiTrack } from './components/tracks/AiTrack';

function App() {
  const { tracks, updateTrack } = useTracks();
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    stream,
    recordingDuration,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId
  } = useAudioInput();

  const [isPlaying, setIsPlaying] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState("00:00");
  const [musicalKey, setMusicalKey] = useState("C Maj");
  const [syncTime, setSyncTime] = useState(0);

  // Handle Recorded Audio
  useEffect(() => {
    if (audioBlob) {
      updateTrack('2', { audioFile: audioBlob });
    }
  }, [audioBlob, updateTrack]);

  // Sync Timer: Driven by App state during playback
  useEffect(() => {
    let interval: any;
    if (isPlaying && !isRecording) {
      interval = setInterval(() => {
        setSyncTime(prev => prev + 0.1);
      }, 100);
    } else if (!isPlaying) {
      setSyncTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isRecording]);

  // Handle Backtrack Upload with duration limit
  const handleBacktrackUpload = async (file: File) => {
    // Use a temporary audio element to check duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      if (audio.duration > JAM_CONFIG.MAX_DURATION) {
        alert(`File too long! Maximum jam duration is ${JAM_CONFIG.MAX_DURATION / 60} minutes.`);
        return;
      }

      updateTrack('1', {
        audioFile: file,
        name: file.name.replace(/\.[^/.]+$/, "")
      });
    };
  };

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (isRecording) stopRecording();
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying, isRecording, stopRecording]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setIsPlaying(false);
    } else {
      startRecording();
      setIsPlaying(true);
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    if (isRecording) stopRecording();
    setResetTrigger(prev => prev + 1);
    setSyncTime(0);
  }, [isRecording, stopRecording]);

  // Format recording duration for UI if needed
  const formattedRecordingTime = `${Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:${(recordingDuration % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-screen w-full flex flex-col p-8 gap-8">
      <header className="flex justify-between items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">JAM <span className="font-light opacity-50">SPACE</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/40 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-red-500 font-mono">{formattedRecordingTime}</span>
            </div>
          )}
          <button className="text-xs font-semibold text-white/50 hover:text-white transition-colors">
            SETTINGS
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-[90%] mx-auto w-full gap-5 perspective-1000 overflow-y-auto pr-2 custom-scrollbar">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="floating-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <TrackCard
              id={track.id}
              name={track.name}
              type={track.type}
              color={track.color}
              isMuted={track.isMuted}
              isSolo={track.isSolo}
              volume={track.volume}
              onMuteToggle={() => updateTrack(track.id, { isMuted: !track.isMuted })}
              onSoloToggle={() => updateTrack(track.id, { isSolo: !track.isSolo })}
              onVolumeChange={(val) => updateTrack(track.id, { volume: val })}
              onNameChange={(val) => updateTrack(track.id, { name: val })}
            >
              {track.type === 'BACKTRACK' && (
                <BacktrackTrack
                  audioFile={track.audioFile}
                  isPlaying={isPlaying}
                  resetTrigger={resetTrigger}
                  volume={track.volume}
                  isMuted={track.isMuted}
                  currentTime={syncTime}
                  onReady={({ bpm: detectedBpm, duration: detectedDuration }) => {
                    setBpm(detectedBpm);
                    const mins = Math.floor(detectedDuration / 60).toString().padStart(2, '0');
                    const secs = Math.floor(detectedDuration % 60).toString().padStart(2, '0');
                    setDuration(`${mins}:${secs}`);
                  }}
                  onFinish={() => setIsPlaying(false)}
                  onUpload={handleBacktrackUpload}
                />
              )}

              {track.type === 'USER' && (
                <UserTrack
                  audioFile={track.audioFile}
                  isRecording={isRecording}
                  isPlaying={isPlaying}
                  stream={stream}
                  resetTrigger={resetTrigger}
                  volume={track.volume}
                  isMuted={track.isMuted}
                  currentTime={syncTime}
                  availableDevices={availableDevices}
                  selectedDeviceId={selectedDeviceId}
                  onDeviceChange={setSelectedDeviceId}
                />
              )}

              {track.type === 'AI' && (
                <AiTrack
                  instrument={track.instrument}
                  onInstrumentChange={(val) => updateTrack(track.id, { instrument: val })}
                />
              )}
            </TrackCard>
          </div>
        ))}
      </div>

      <div className="shrink-0 mb-4">
        <GeometricControlBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          onPlay={handlePlayToggle}
          onStop={handleStop}
          onRecord={handleRecordToggle}
          bpm={bpm}
          duration={duration}
          musicalKey={musicalKey}
        />
      </div>
    </div >
  );
}

export default App;
