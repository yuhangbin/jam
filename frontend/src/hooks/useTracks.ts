import { useState, useCallback } from 'react';
import { JAM_CONFIG } from '../config';

import type { AudioObject } from '../types';

export interface TrackState {
    id: string;
    name: string;
    type: 'BACKTRACK' | 'USER' | 'AI';
    color: string;
    isMuted: boolean;
    isSolo: boolean;
    volume: number;
    audioFile?: File | Blob | null;
    audioObjects?: AudioObject[];
    instrument?: string;
}

const INITIAL_TRACKS: TrackState[] = [
    {
        id: '1',
        name: 'Original Backtrack',
        type: 'BACKTRACK',
        color: JAM_CONFIG.THEME.BACKTRACK.COLOR,
        isMuted: false,
        isSolo: false,
        volume: 0.8
    },
    {
        id: '2',
        name: 'My Improvisation',
        type: 'USER',
        color: JAM_CONFIG.THEME.USER.COLOR,
        isMuted: false,
        isSolo: false,
        volume: 1.0
    },
    {
        id: '3',
        name: 'AI Accompaniment',
        type: 'AI',
        color: JAM_CONFIG.THEME.AI.COLOR,
        isMuted: false,
        isSolo: false,
        volume: 0.8,
        instrument: 'Grand Piano'
    },
];

export const useTracks = () => {
    const [tracks, setTracks] = useState<TrackState[]>(INITIAL_TRACKS);

    const updateTrack = useCallback((id: string, updates: Partial<TrackState>) => {
        setTracks(currentTracks => {
            const trackToUpdate = currentTracks.find(t => t.id === id);
            if (!trackToUpdate) return currentTracks;

            // Handle Solo logic: If a track is soloed, others should be conceptually muted
            // but we maintain their local isMuted state for independence.
            return currentTracks.map(t => t.id === id ? { ...t, ...updates } : t);
        });
    }, []);

    const resetTracks = useCallback(() => {
        setTracks(INITIAL_TRACKS);
    }, []);

    return {
        tracks,
        setTracks,
        updateTrack,
        resetTracks
    };
};
