import React, { useState, useRef } from 'react';
import { TrackCard } from './components/TrackCard';
import { GeometricControlBar } from './components/GeometricControlBar';
import { AudioRecorder } from './components/AudioRecorder';
import { UploadIcon } from './components/ui/GeometricIcons';
import { WaveformPlayer } from './components/WaveformPlayer';

interface TrackState {
  id: string;
  name: string;
  type: 'BACKTRACK' | 'USER' | 'AI';
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  audioFile?: File | null;
  instrument?: string;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Project State
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState("03:45");
  const [musicalKey, setMusicalKey] = useState("C Maj");

  // Track State
  const [tracks, setTracks] = useState<TrackState[]>([
    { id: '1', name: 'Original Backtrack', type: 'BACKTRACK', color: '#10b981', isMuted: false, isSolo: false, volume: 0.8 },
    { id: '2', name: 'My Improvisation', type: 'USER', color: '#ec4899', isMuted: false, isSolo: false, volume: 1.0 },
    { id: '3', name: 'AI Accompaniment', type: 'AI', color: '#3b82f6', isMuted: false, isSolo: false, volume: 0.8, instrument: 'Grand Piano' },
  ]);

  const updateTrack = (id: string, updates: Partial<TrackState>) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleBacktrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Uploaded:", file.name);
      setDuration("04:20"); // Mock
      setBpm(128); // Mock
      setMusicalKey("Dm"); // Mock
      updateTrack('1', { audioFile: file, name: file.name.replace(/\.[^/.]+$/, "") });
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) setIsRecording(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-screen w-full flex flex-col p-8 gap-8">
      {/* Top Header */}
      <header className="flex justify-between items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">JAM <span className="font-light opacity-50">SPACE</span></h1>
        </div>
        <button className="text-xs font-semibold text-white/50 hover:text-white transition-colors">
          SETTINGS
        </button>
      </header>

      {/* Main Track Area */}
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
              extraControls={
                <>
                  {track.type === 'BACKTRACK' && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="audio/*"
                        onChange={handleBacktrackUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full text-left px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-emerald-400 transition-colors flex items-center gap-2 border border-white/5"
                      >
                        <UploadIcon className="w-3 h-3" />
                        Upload File
                      </button>
                    </>
                  )}
                  {track.type === 'AI' && (
                    <select
                      value={track.instrument}
                      onChange={(e) => updateTrack(track.id, { instrument: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-500 text-blue-300"
                    >
                      <option value="Grand Piano">Grand Piano</option>
                      <option value="Synth Pad">Synth Pad</option>
                      <option value="Electric Guitar">Electric Guitar</option>
                    </select>
                  )}
                </>
              }
            >
              {/* Visualization Children */}
              {track.type === 'USER' && (
                <div className="w-full h-full p-2 opacity-80 flex items-center justify-center">
                  <div className="text-xs text-pink-300 font-mono tracking-widest uppercase opacity-70">Waiting for Input...</div>
                </div>
              )}
              {track.type === 'BACKTRACK' && (
                <div className="w-full h-full relative group/wave flex items-center">
                  {track.audioFile ? (
                    <div className="w-full px-4">
                      <WaveformPlayer
                        audioFile={track.audioFile}
                        isPlaying={isPlaying}
                        height={96}
                        waveColor="rgba(16, 185, 129, 0.4)"
                        progressColor="rgba(16, 185, 129, 0.8)"
                        onReady={({ bpm, duration }) => {
                          setBpm(bpm); // Update global project BPM
                          const mins = Math.floor(duration / 60).toString().padStart(2, '0');
                          const secs = Math.floor(duration % 60).toString().padStart(2, '0');
                          setDuration(`${mins}:${secs}`);
                        }}
                        onFinish={() => setIsPlaying(false)}
                      />
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-[2px] h-32 px-2 items-end justify-center opacity-40 grayscale">
                      {/* Placeholder Waveform */}
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-white/20 rounded-t-sm" style={{ height: `${Math.max(10, Math.sin(i * 0.2) * 30 + 20)}%` }}></div>
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-mono text-white/50 tracking-widest uppercase">Upload Audio to Visualize</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {track.type === 'AI' && (
                <div className="w-full flex items-center gap-[3px] h-24 px-4 items-center justify-center opacity-60">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 60 + 10}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '2s'
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </TrackCard>
          </div>
        ))}

        {/* Hidden Recorder Logic */}
        <div className="hidden">
          <AudioRecorder />
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="shrink-0 mb-4">
        <GeometricControlBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          onPlay={handlePlay}
          onStop={() => { setIsPlaying(false); setIsRecording(false); }}
          onRecord={() => setIsRecording(!isRecording)}
          bpm={bpm}
          duration={duration}
          musicalKey={musicalKey}
        />
      </div>
    </div >
  );
}

export default App;
