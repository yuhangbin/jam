import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TrackCard } from './components/TrackCard';
import { GeometricControlBar } from './components/GeometricControlBar';
import { useAudioInput } from './hooks/useAudioInput';
import { useTracks } from './hooks/useTracks';
import { JAM_CONFIG } from './config';

// Individual Track Components
import { BacktrackTrack } from './components/tracks/BacktrackTrack';
import { UserTrack } from './components/tracks/UserTrack';
import { AiTrack } from './components/tracks/AiTrack';
import { getAudioMetadata, audioToMidi, midiToAudio } from './utils/audioProcessing';
import type { DialogueRecord, AudioObject } from './types';
import { DialogueHistoryModal } from './components/DialogueHistoryModal';

function App() {
  const { tracks, updateTrack, setTracks } = useTracks();
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    audioBlob,
    stream,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    setOnSegmentComplete,
    reset: resetAudioInput
  } = useAudioInput();

  const [isPlaying, setIsPlaying] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [bpm, setBpm] = useState(96);
  const [duration, setDuration] = useState("05:00");
  const [musicalKey, setMusicalKey] = useState("C Maj");
  const [syncTime, setSyncTime] = useState(0);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueRecord[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const totalDurationSeconds = useMemo(() => {
    const [m, s] = duration.split(':').map(Number);
    return m * 60 + s;
  }, [duration]);

  const processAIResponse = async (userObj: AudioObject) => {
    if (!userObj.buffer) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("App: Processing segment for AI (Real-time)...", userObj.id);

      // Convert to MIDI
      const userMidi = await audioToMidi(userObj.buffer);
      console.log("App: MIDI conversion done, notes:", userMidi.length);

      if (userMidi.length === 0) return;

      // Call AI
      console.log("App: Calling AI API...");
      const response = await fetch('/api/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'local-jam',
          bpm: bpm,
          user_notes: userMidi.map(n => ({
            pitch: n.note,
            start_time: n.time,
            duration: n.duration,
            velocity: n.velocity
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMidi = data.ai_notes.map((n: any) => ({
          note: n.pitch,
          time: n.start_time,
          duration: n.duration,
          velocity: n.velocity
        }));

        // Synthesize AI Audio
        const aiBlob = await midiToAudio(aiMidi);
        const aiArrayBuffer = await aiBlob.arrayBuffer();
        const aiBuffer = await audioCtx.decodeAudioData(aiArrayBuffer);

        const aiObj: AudioObject = {
          id: crypto.randomUUID(),
          buffer: aiBuffer,
          blob: aiBlob,
          // Subtract the 1s silence delay from the user's phrase to respond immediately
          startTime: Math.max(0, userObj.startTime + userObj.duration - 1.0),
          duration: aiBuffer.duration,
          midiData: aiMidi,
          sourceSegmentId: userObj.id
        };

        // Update AI Track objects using functional state update pattern
        setTracks((currentTracks: any[]) => {
          const aiTrack = currentTracks.find(t => t.id === '3');
          if (!aiTrack) return currentTracks;

          const updatedObjects = [...(aiTrack.audioObjects || []), aiObj];
          return currentTracks.map(t => t.id === '3' ? { ...t, audioObjects: updatedObjects } : t);
        });

        // Log History
        setDialogueHistory(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          userMidi,
          aiMidi,
          userStartTime: userObj.startTime,
          aiStartTime: aiObj.startTime
        }]);

        // Auto-resume playback if not already playing/recording
        // This ensures the AI response is heard immediately
        if (!isPlaying && !isRecording) {
          console.log("App: Auto-resuming playback for AI response...");
          // Set syncTime to just before the AI response to ensure it plays
          setSyncTime(Math.max(0, aiObj.startTime - 0.5));
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error("AI Pipeline error:", err);
    }
  };

  // Setup Real-time Segment Callback
  useEffect(() => {
    setOnSegmentComplete((buffer, startTime) => {
      console.log("App: Real-time Segment Received!", buffer.duration, "s at", startTime);

      const userObj: AudioObject = {
        id: crypto.randomUUID(),
        buffer: buffer,
        startTime: recordingStartTime + startTime,
        duration: buffer.duration,
      };

      // 1. Update User Track immediately with the new segment
      setTracks((currentTracks: any[]) => {
        const userTrack = currentTracks.find(t => t.id === '2');
        if (!userTrack) return currentTracks;
        const updatedObjects = [...(userTrack.audioObjects || []), userObj];
        return currentTracks.map(t => t.id === '2' ? { ...t, audioObjects: updatedObjects } : t);
      });

      // 2. Trigger AI Response processing immediately
      processAIResponse(userObj);
    });
  }, [setOnSegmentComplete, bpm, setTracks, recordingStartTime]);

  // Handle Full Recording Completion (Cleanup/Log only since real-time handles segments)
  useEffect(() => {
    if (audioBlob) {
      console.log("App: Global Recording finished, blob size:", audioBlob.size);
    }
  }, [audioBlob]);

  // Sync Timer: Driven by App state during playback/recording
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setSyncTime(prev => prev + 0.1);
      }, 100);
    } else {
      setSyncTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Handle Backtrack Upload with duration limit and metadata detection
  const handleBacktrackUpload = async (file: File) => {
    try {
      const { bpm: detectedBpm, duration: detectedDuration } = await getAudioMetadata(file);

      if (detectedDuration > JAM_CONFIG.MAX_DURATION) {
        alert(`File too long! Maximum jam duration is ${JAM_CONFIG.MAX_DURATION / 60} minutes.`);
        return;
      }

      setBpm(detectedBpm);
      const mins = Math.floor(detectedDuration / 60).toString().padStart(2, '0');
      const secs = Math.floor(detectedDuration % 60).toString().padStart(2, '0');
      setDuration(`${mins}:${secs}`);

      updateTrack('1', {
        audioFile: file,
        name: file.name.replace(/\.[^/.]+$/, "")
      });
    } catch (error) {
      console.error("Failed to process backtrack metadata:", error);
      // Fallback to standard check if metadata detection fails
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        if (audio.duration > JAM_CONFIG.MAX_DURATION) {
          alert(`File too long! Maximum jam duration is ${JAM_CONFIG.MAX_DURATION / 60} minutes.`);
          return;
        }
        updateTrack('1', { audioFile: file, name: file.name.replace(/\.[^/.]+$/, "") });
      };
    }
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
      setRecordingStartTime(syncTime);
      startRecording();
      setIsPlaying(true);
    }
  }, [isRecording, startRecording, stopRecording, syncTime]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    if (isRecording) stopRecording();
    setResetTrigger(prev => prev + 1);
    setSyncTime(0);
  }, [isRecording, stopRecording]);

  const handleClear = useCallback(() => {
    console.log("App: Clearing session data...");
    // 1. Stop everything immediately
    setIsPlaying(false);
    if (isRecording) stopRecording();

    // 2. Directly reset states without confirmation dialog
    setTracks(prev => prev.map(t => ({
      ...t,
      audioObjects: t.type === 'BACKTRACK' ? t.audioObjects : [],
      audioFile: t.type === 'BACKTRACK' ? t.audioFile : null // Also clear audioFile for USER
    })));
    setDialogueHistory([]);
    setSyncTime(0);
    setRecordingStartTime(0);
    resetAudioInput();
    setResetTrigger(prev => prev + 1);
  }, [setTracks, resetAudioInput, isRecording, stopRecording]);

  // Format recording duration for UI if needed
  const formattedRecordingTime = `${Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:${(recordingDuration % 60).toString().padStart(2, '0')}`;

  const PIXELS_PER_SECOND = 60; // Increased scale for better visual horizontal expansion
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const totalTimelineWidth = useMemo(() => {
    return totalDurationSeconds * PIXELS_PER_SECOND;
  }, [totalDurationSeconds]);

  // Handle playhead centering or just linear motion
  const playheadPosition = syncTime * PIXELS_PER_SECOND;

  // Effect to scroll the timeline to keep the playhead in view
  useEffect(() => {
    if (isPlaying && timelineScrollRef.current) {
      const scrollContainer = timelineScrollRef.current;
      const containerWidth = scrollContainer.offsetWidth;
      const scrollLeft = scrollContainer.scrollLeft;

      // Calculate the desired scroll position to keep the playhead roughly in the center-left
      // Adjust 0.3 to change where the playhead sits in the view (e.g., 0.5 for center)
      const targetScrollLeft = Math.max(0, playheadPosition - containerWidth * 0.3);

      // Only scroll if the playhead is outside the current view or approaching the edge
      if (playheadPosition < scrollLeft || playheadPosition > scrollLeft + containerWidth) {
        scrollContainer.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [playheadPosition, isPlaying]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans overflow-hidden flex flex-col">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(0,0,0,1)_100%)] z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 pointer-events-none z-[1]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse" />
          <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">JAM SPACE</h1>
        </div>
        <div className="flex items-center gap-6">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/40 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-red-500 font-mono">{formattedRecordingTime}</span>
            </div>
          )}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm"
          >
            History
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">Live Engine</span>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Scrollable Timeline */}
      <main className="flex-1 mt-16 pb-32 relative z-10 flex overflow-hidden">

        {/* Track View Container */}
        <div className="flex flex-col w-full">
          {tracks.map((track) => (
            <div key={track.id} className="flex h-48 border-b border-white/5 group relative">
              {/* FIXED SIDEBAR PART (Controls) */}
              <div className="w-64 shrink-0 bg-black/20 backdrop-blur-sm z-30 flex items-center p-4 border-r border-white/10 shadow-2xl">
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
                        <div className="relative group/upload">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBacktrackUpload(file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={isRecording}
                          />
                          <button className="w-full text-[10px] font-bold py-2 px-3 rounded-full bg-white/5 border border-white/10 text-white/40 group-hover/upload:bg-white/10 group-hover/upload:text-white transition-all flex items-center justify-center gap-2">
                            <span>Upload Backtrack</span>
                          </button>
                        </div>
                      )}
                      {track.type === 'USER' && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-pink-400/60 uppercase tracking-widest text-center">Input Device</span>
                          <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            disabled={isRecording}
                            className="bg-black/40 border border-pink-500/20 rounded px-2 py-1 text-[10px] outline-none focus:border-pink-500/50 text-pink-300 transition-all font-medium truncate"
                          >
                            <option value="default">System Default</option>
                            {availableDevices.map(device => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {track.type === 'AI' && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest text-center">AI Synthesis</span>
                          <select
                            value={track.instrument || 'Grand Piano'}
                            onChange={(e) => updateTrack(track.id, { instrument: e.target.value })}
                            className="bg-black/40 border border-blue-500/20 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-500/50 text-blue-300 transition-all font-medium"
                          >
                            <option value="Grand Piano">Grand Piano</option>
                            <option value="Synth Pad">Synth Pad</option>
                            <option value="Electric Guitar">Electric Guitar</option>
                            <option value="Cello Ensemble">Cello Ensemble</option>
                          </select>
                        </div>
                      )}
                    </>
                  }
                >
                  {/* Empty children since we move visualization to the right */}
                </TrackCard>
              </div>

              {/* SCROLLABLE TIMELINE PART (Waveforms) */}
              <div
                ref={track.id === tracks[0].id ? timelineScrollRef : null}
                className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar bg-black/40 relative timeline-row" // Added timeline-row class here
                onScroll={(e) => {
                  if (timelineScrollRef.current) {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    // Sync all track rows scroll
                    const rows = document.querySelectorAll('.timeline-row');
                    rows.forEach(row => {
                      if (row !== e.currentTarget) {
                        row.scrollLeft = scrollLeft;
                      }
                    });
                  }
                }}
              >
                <div
                  className="h-full relative"
                  style={{ width: `${totalTimelineWidth}px` }}
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 pointer-events-none flex z-0">
                    {Array.from({ length: Math.ceil(totalDurationSeconds / 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-white/5 h-full shrink-0 flex flex-col justify-end pb-1"
                        style={{ width: `${4 * PIXELS_PER_SECOND}px` }}
                      >
                        <span className="text-[7px] text-white/10 ml-1 font-mono tracking-tighter self-end pr-1">
                          {Math.floor(i * 4 / 60)}:{(i * 4 % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Visualization Content */}
                  <div className="absolute inset-0 flex items-center">
                    {track.type === 'BACKTRACK' && (
                      <BacktrackTrack
                        audioFile={track.audioFile}
                        isPlaying={isPlaying}
                        currentTime={syncTime}
                        totalDuration={totalDurationSeconds}
                        volume={track.volume}
                        isMuted={track.isMuted}
                        resetTrigger={resetTrigger}
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
                        audioObjects={track.audioObjects}
                        isRecording={isRecording}
                        isPlaying={isPlaying}
                        stream={stream}
                        resetTrigger={resetTrigger}
                        volume={track.volume}
                        isMuted={track.isMuted}
                        currentTime={syncTime}
                        totalDuration={totalDurationSeconds}
                        availableDevices={availableDevices}
                        selectedDeviceId={selectedDeviceId}
                        onDeviceChange={setSelectedDeviceId}
                      />
                    )}
                    {track.type === 'AI' && (
                      <AiTrack
                        audioObjects={track.audioObjects}
                        isPlaying={isPlaying}
                        currentTime={syncTime}
                        totalDuration={totalDurationSeconds}
                        volume={track.volume}
                        isMuted={track.isMuted}
                        resetTrigger={resetTrigger}
                        instrument={track.instrument}
                        onInstrumentChange={(val) => updateTrack(track.id, { instrument: val })}
                      />
                    )}
                    {track.type === 'AI' && (!track.audioObjects || track.audioObjects.length === 0) && (
                      <div className="w-full h-full p-2 opacity-80 flex items-center justify-center pointer-events-none">
                        <div className="text-[10px] text-blue-300/40 font-mono tracking-[0.3em] uppercase">
                          Waiting for dialogue...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Playhead (moves over the scrollable area) */}
        <div
          className="fixed top-16 bottom-32 w-px bg-white/80 z-40 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          style={{
            left: `calc(16rem + ${playheadPosition}px - ${(timelineScrollRef.current?.scrollLeft || 0)}px)`,
            display: isPlaying || isRecording ? 'block' : 'none'
          }}
        />
      </main>

      {/* Footer Controls */}
      <footer className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/90 to-transparent backdrop-blur-sm border-t border-white/5 z-50 px-8 flex items-center justify-between">
        <div className="w-1/4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Master Pulse</span>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-white/20'}`} />
              <span className="text-xl font-black font-mono tracking-tighter tabular-nums">{isPlaying ? 'PLAYING' : 'READY'}</span>
            </div>
          </div>
        </div>

        <GeometricControlBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          onPlay={handlePlayToggle}
          onStop={handleStop}
          onRecord={handleRecordToggle}
          onClear={handleClear}
          bpm={bpm}
          duration={duration}
          musicalKey={musicalKey}
          onKeyChange={setMusicalKey}
        />

        <div className="w-1/4 flex justify-end">
          <div className="text-right">
            <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Session Time</span>
            <div className="text-2xl font-black font-mono tracking-tighter text-white/90 tabular-nums">
              {`${Math.floor(syncTime / 60).toString().padStart(2, '0')}:${Math.floor(syncTime % 60).toString().padStart(2, '0')}`} / {duration}
            </div>
          </div>
        </div>
      </footer>

      <DialogueHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={dialogueHistory}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .timeline-row { position: relative; }
      `}</style>
    </div>
  );
};

export default App;
