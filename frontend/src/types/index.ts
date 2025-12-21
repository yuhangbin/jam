export interface Note {
    pitch: number;
    start_time: number;
    duration: number;
    velocity: number;
}

export interface AudioObject {
    id: string;
    buffer?: AudioBuffer;
    blob?: Blob;
    startTime: number;
    duration: number;
    midiData?: any[];
    sourceSegmentId?: string;
}

export interface DialogueRecord {
    id: string;
    timestamp: number;
    userMidi: any[];
    aiMidi: any[];
    userStartTime: number;
    aiStartTime: number;
}
