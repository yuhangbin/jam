import React from 'react';
import type { DialogueRecord } from '../types';

interface DialogueHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: DialogueRecord[];
}

export const DialogueHistoryModal: React.FC<DialogueHistoryModalProps> = ({
    isOpen,
    onClose,
    history
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white/90">Dialogue History</h2>
                        <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-wider">AI Interaction Debug Log</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/20">
                            <svg className="w-16 h-16 mb-4 opacity-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                            </svg>
                            <span className="text-sm font-mono tracking-widest uppercase">No interactions logged yet</span>
                        </div>
                    ) : (
                        history.map((record, idx) => (
                            <div key={record.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 hover:border-purple-500/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">
                                        Interaction #{history.length - idx} • {new Date(record.timestamp).toLocaleTimeString()}
                                    </span>
                                    <div className="flex gap-2">
                                        <div className="px-2 py-0.5 rounded bg-pink-500/20 text-[9px] font-bold text-pink-400 border border-pink-500/20">USER @ {record.userStartTime.toFixed(2)}s</div>
                                        <div className="px-2 py-0.5 rounded bg-blue-500/20 text-[9px] font-bold text-blue-400 border border-blue-500/20">AI @ {record.aiStartTime.toFixed(2)}s</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">User MIDI Payload</h4>
                                        <div className="bg-black/40 rounded p-3 text-[10px] font-mono text-pink-300/80 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                                            {JSON.stringify(record.userMidi, null, 2)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">AI Response MIDI</h4>
                                        <div className="bg-black/40 rounded p-3 text-[10px] font-mono text-blue-300/80 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                                            {JSON.stringify(record.aiMidi, null, 2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )).reverse()
                    )}
                </div>

                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                    <button
                        onClick={() => {
                            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `jam-session-history-${Date.now()}.json`;
                            a.click();
                        }}
                        className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Export Session Data (.json)
                    </button>
                </div>
            </div>
        </div>
    );
};
