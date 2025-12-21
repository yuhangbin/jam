// @ts-ignore
import MusicTempo from 'music-tempo';
import * as Tone from 'tone';

export interface AudioMetadata {
    bpm: number;
    duration: number;
}

export interface AudioSegment {
    id: string;
    startTime: number;
    endTime: number;
    buffer: AudioBuffer;
}

/**
 * Helper to convert AudioBuffer to a WAV Blob
 */
const bufferToWave = (abuffer: AudioBuffer): Blob => {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample, offset = 0, pos = 0;

    // write WAVE header
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // write 16-bit sample
            pos += 2;
        }
        offset++;                                     // next sample y-axis
    }

    return new Blob([buffer], { type: "audio/wav" });
};

/**
 * 1. 获取伴奏音频的元信息 BPM和时长
 */
export const getAudioMetadata = async (file: File | Blob): Promise<AudioMetadata> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

    const duration = decodedData.duration;
    let bpm = 120; // Default

    try {
        const mt = new MusicTempo(decodedData.getChannelData(0));
        if (mt.tempo) {
            bpm = Math.round(parseFloat(mt.tempo));
        }
    } catch (e) {
        console.error("BPM detection failed, using default 120", e);
    }

    return { bpm, duration };
};

/**
 * 4. 对音频轨道进行分割存储 放到一个有序集合中，分割的规则是 有声音到没声音 为一段
 */
export const segmentAudio = (buffer: AudioBuffer, threshold = 0.005, minSegmentDuration = 0.1): AudioSegment[] => {
    const data = buffer.getChannelData(0); // Use mono for analysis
    const sampleRate = buffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window

    const segments: AudioSegment[] = [];
    let isCurrentlySound = false;
    let segmentStart = 0;

    for (let i = 0; i < data.length; i += windowSize) {
        // Calculate RMS for the current window
        let sum = 0;
        const end = Math.min(i + windowSize, data.length);
        for (let j = i; j < end; j++) {
            sum += data[j] * data[j];
        }
        const rms = Math.sqrt(sum / (end - i));

        if (rms > threshold && !isCurrentlySound) {
            // Sound start
            isCurrentlySound = true;
            segmentStart = i / sampleRate;
        } else if (rms <= threshold && isCurrentlySound) {
            // Sound end
            isCurrentlySound = false;
            const segmentEnd = i / sampleRate;

            if (segmentEnd - segmentStart >= minSegmentDuration) {
                // Create a sub-buffer for this segment
                const segmentLength = Math.floor((segmentEnd - segmentStart) * sampleRate);
                const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, segmentLength, sampleRate);
                const segmentBuffer = offlineCtx.createBuffer(buffer.numberOfChannels, segmentLength, sampleRate);

                for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                    const channelData = buffer.getChannelData(channel);
                    const subData = channelData.slice(Math.floor(segmentStart * sampleRate), Math.floor(segmentEnd * sampleRate));
                    segmentBuffer.copyToChannel(subData, channel);
                }

                segments.push({
                    id: crypto.randomUUID(),
                    startTime: segmentStart,
                    endTime: segmentEnd,
                    buffer: segmentBuffer
                });
            }
        }
    }

    if (isCurrentlySound) {
        const segmentEnd = buffer.length / sampleRate;
        if (segmentEnd - segmentStart >= minSegmentDuration) {
            const segmentLength = Math.floor((segmentEnd - segmentStart) * sampleRate);
            const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, segmentLength, sampleRate);
            const segmentBuffer = offlineCtx.createBuffer(buffer.numberOfChannels, segmentLength, sampleRate);
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const channelData = buffer.getChannelData(channel);
                const subData = channelData.slice(Math.floor(segmentStart * sampleRate), Math.floor(segmentEnd * sampleRate));
                segmentBuffer.copyToChannel(subData, channel);
            }
            segments.push({ id: crypto.randomUUID(), startTime: segmentStart, endTime: segmentEnd, buffer: segmentBuffer });
        }
    }

    return segments;
};

/**
 * 2. 录音音频转midi
 * Simplified implementation using YIN pitch detection
 */
export const audioToMidi = async (buffer: AudioBuffer): Promise<any[]> => {
    // @ts-ignore
    const { YIN } = await import('pitchfinder');
    const detectPitch = YIN();
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const windowSize = 2048;
    const jumpSize = 1024;

    const midiNotes: { time: number; duration: number; note: number; velocity: number }[] = [];

    for (let i = 0; i < data.length - windowSize; i += jumpSize) {
        const chunk = data.slice(i, i + windowSize);
        const frequency = detectPitch(chunk);

        if (frequency) {
            const midiNote = 12 * Math.log2(frequency / 440) + 69;
            const time = i / sampleRate;
            const roundedNote = Math.round(midiNote);
            const lastNote = midiNotes[midiNotes.length - 1];

            if (lastNote && lastNote.note === roundedNote && (time - lastNote.time) < 0.2) {
                lastNote.duration = time - lastNote.time + 0.1;
            } else {
                midiNotes.push({ time: time, duration: 0.1, note: roundedNote, velocity: 0.7 });
            }
        }
    }

    return midiNotes;
};

/**
 * 3. midi转可播放音频
 * Uses Tone.js to synthesize MIDI notes into a Buffer
 */
export const midiToAudio = async (midiNotes: any[]): Promise<Blob> => {
    const duration = Math.max(...midiNotes.map(n => n.time + n.duration)) + 1;

    const buffer = await Tone.Offline(async () => {
        const synth = new Tone.Synth().toDestination();
        midiNotes.forEach(note => {
            synth.triggerAttackRelease(
                Tone.Frequency(note.note, "midi").toFrequency(),
                note.duration,
                note.time,
                note.velocity
            );
        });
    }, duration);

    // Convert Tone.AudioBuffer to a standard AudioBuffer-like structure for the helper
    return bufferToWave(buffer.get() as unknown as AudioBuffer);
};
/**
 * Helper to normalize AudioBuffer to peak 1.0
 */
export const normalizeAudioBuffer = (buffer: AudioBuffer): AudioBuffer => {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        let max = 0;
        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > max) max = abs;
        }
        if (max > 0 && max < 1) {
            const ratio = 1.0 / max;
            for (let i = 0; i < data.length; i++) {
                data[i] *= ratio;
            }
        }
    }
    return buffer;
};

/**
 * Helper to convert AudioBuffer to a Blob URL for WaveSurfer
 */
export const audioBufferToBlobUrl = (buffer: AudioBuffer): string => {
    const normalized = normalizeAudioBuffer(buffer);
    const blob = bufferToWave(normalized);
    return URL.createObjectURL(blob);
};
