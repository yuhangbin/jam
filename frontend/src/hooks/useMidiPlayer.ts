import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

export interface MidiNote {
    pitch: number;
    startTime: number;
    duration: number;
    velocity: number;
}

export const useMidiPlayer = () => {
    const synthRef = useRef<Tone.PolySynth | null>(null);

    useEffect(() => {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synthRef.current = synth;
        return () => {
            synth.dispose();
        };
    }, []);

    const playNote = useCallback(async (note: MidiNote) => {
        await Tone.start(); // Ensure context is started
        if (!synthRef.current) return;

        const freq = Tone.Frequency(note.pitch, "midi").toFrequency();
        // Use immediate scheduling for MVP, or note.startTime relative to now
        synthRef.current.triggerAttackRelease(freq, note.duration, Tone.now() + note.startTime, note.velocity);
    }, []);

    const playNotes = useCallback(async (notes: MidiNote[]) => {
        await Tone.start();
        if (!synthRef.current) return;

        const now = Tone.now();
        notes.forEach(note => {
            const freq = Tone.Frequency(note.pitch, "midi").toFrequency();
            synthRef.current?.triggerAttackRelease(freq, note.duration, now + note.startTime, note.velocity);
        });
    }, []);

    return {
        playNote,
        playNotes
    };
};
