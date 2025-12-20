# Frontend Audio Recording Problem Set

## 1. Visualization Resource Contention (The "Freeze" on Playback)

**Problem:**
The `wavesurfer.js` `RecordPlugin` is resource-intensive as it hooks into the `AudioContext` to analyze the stream for real-time visualization. The issue was that we were initializing this plugin *unconditionally*, meaning it was active even during playback or when the track was idle. This caused conflict when the `useAudioInput` hook tried to manage the stream state, leading to the main thread blocking ("Page Unresponsive").

**Fix (Component-Level Isolation):**
In `WaveformPlayer.tsx`, I modified the initialization logic to **conditionally instantiate** the `RecordPlugin`. It now *only* exists when `micStream` is actively provided (i.e., strictly during recording).

```typescript
// frontend/src/components/WaveformPlayer.tsx

// BEFORE: Plugin was always added to the array
const plugins = [TimelinePlugin.create({...}), RecordPlugin.create({...})];

// AFTER: Plugin is only injected if a stream exists
let rec: RecordPlugin | null = null;
if (micStream) { 
    // Only create overhead if we are actually recording
    rec = RecordPlugin.create({ 
        scrollingWaveform: true, 
        renderRecordedAudio: false 
    });
    plugins.push(rec);
}
```
**Why this works:** This ensures zero overhead during playback, preventing the recursive `requestAnimationFrame` loops of the visualizer from clashing with the playback engine.

---

## 2. MediaStream Race Condition (The "Freeze" on Stop)

**Problem:**
When you clicked "Stop", two things happened almost simultaneously:
1.  `stopRecording()` was called, which immediately iterated over `stream.getTracks()` and called `track.stop()`.
2.  React triggered a re-render to update the UI (remove the visualizer).

The `RecordPlugin` (running inside the customized `WaveformPlayer`) was still trying to read data from the `MediaStream` in its final render frame *while* the tracks were being killed by the hook. Attempting to read from a dead `AudioNode` often causes the browser's audio subsystem to lock up the JS event loop.

**Fix (Graceful Teardown):**
In `useAudioInput.ts`, I introduced a `setTimeout` to defer the track destruction.

```typescript
// frontend/src/hooks/useAudioInput.ts

// BEFORE: Immediate destruction
// streamRef.current.getTracks().forEach(track => track.stop());

// AFTER: Asynchronous destruction
setTimeout(() => {
    if (streamRef.current) {
         // Allow 500ms for React to unmount the WaveformPlayer 
         // and for the RecordPlugin to destroy itself cleanly.
        streamRef.current.getTracks().forEach(track => track.stop());
    }
}, 500);
```
**Why this works:** This yields control back to the React lifecycle (`useEffect cleanup`) allowing the consumer (the UI) to disconnect from the stream *before* the producer (the hook) cuts the signal.

---

## 3. Invalid Blob Structure (The "Invisible Waveform")

**Problem:**
We were using `mediaRecorder.start(200)`. This "Timeslice" mode instructs the MediaRecorder to fire `ondataavailable` every 200ms with a chunk of the encoded media.
While useful for streaming, this creates a fragmented WebM file where the metadata (header) might be split across chunks or require specific "stitching" logic that `wavesurfer.js`'s internal `decodeAudioData` implementation via the Web Audio API struggles with (especially in Safari/Webkit). The resulting Blob was technically valid data but lacked a coherent file header for the decoder to determine duration/sample rate immediately.

**Fix (Single-File Recording):**
I removed the timeslice argument.

```typescript
// frontend/src/hooks/useAudioInput.ts

// BEFORE: Segmented output
// mediaRecorder.start(200); 

// AFTER: Single continuous file
mediaRecorder.start(); 
```

**Why this works:** When `start()` is called without arguments, the MediaRecorder buffers the entire recording and provides a single, perfectly formed `Blob` in the `onstop` event. This Blob contains the complete EBML header and Duration metadata required for `URL.createObjectURL` to generate a file that is instantly seekable and decodable by WaveSurfer.
