import { useAudioInput } from '../hooks/useAudioInput';

export const AudioRecorder = () => {
    const { isRecording, pitch, volume, startRecording, stopRecording } = useAudioInput();

    return (
        <div className="p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-bold mb-4">Audio Recorder</h2>
            <div className="flex gap-2 mb-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Start Mic
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Stop Mic
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold">Volume</h3>
                    <div className="w-full bg-gray-200 h-4 rounded">
                        <div
                            className="bg-green-500 h-4 rounded transition-all duration-75"
                            style={{ width: `${Math.min(volume * 1000, 100)}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500">{volume.toFixed(4)}</div>
                </div>

                <div>
                    <h3 className="font-semibold">Pitch (Hz)</h3>
                    <div className="text-2xl font-mono">
                        {pitch ? pitch.toFixed(2) : '--'}
                    </div>
                    {pitch && (
                        <div className="text-sm text-gray-600">
                            Approx Note: {pitchToNote(pitch)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function pitchToNote(frequency: number): string {
    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;
    const note = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return noteStrings[note] + octave;
}
