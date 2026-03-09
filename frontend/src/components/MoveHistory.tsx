import React from "react";

interface MoveHistoryProps {
    moveHistory: string[];
    possibleMoves: any[];
    boardSize: number;
}

/** Convert internal square index to 1-based draughts square number */
// No-op for now as coordinates are already serialized correctly by the engine
// but keeping structurally analogous for future localization

function formatMove(entry: string): string {
    if (entry.startsWith('M')) return `Measure ${entry.substring(1).replace('=', ' to ')}`;
    // e.g. "12->15^16;M:1,0" -> split on semicolon to extract notation
    const mainNot = entry.split(';')[0];
    return mainNot.replace('x', '×').replace('->', '→');
}

function moveTypeIcon(entry: string): string {
    if (entry.startsWith('M')) return '⚛';
    if (entry.includes('x')) return '⚔';
    if (entry.includes('^')) {
        // e.g. "12->15^16" (split) vs "15^16->12" (merge)
        if (entry.indexOf('^') > entry.indexOf('->')) return '↗↘';
        return '↘↗';
    }
    return '';
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [moveHistory.length]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--panel-border)' }}>
                <span className="text-indigo-400 text-sm font-bold uppercase tracking-wider">📜 Moves</span>
                <span className="ml-auto text-xs text-zinc-600">{moveHistory.length}</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {moveHistory.length === 0 ? (
                    <div className="text-zinc-600 text-xs text-center py-8 italic">No moves yet</div>
                ) : (
                    moveHistory.map((entry, idx) => {
                        const isWhite = idx % 2 === 0;
                        const moveNum = Math.floor(idx / 2) + 1;
                        const hasQuantum = entry.includes(';M:');
                        const isLatest = idx === moveHistory.length - 1;

                        return (
                            <div
                                key={idx}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${isLatest ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'
                                    }`}
                            >
                                {/* Move number (only on white's move) */}
                                <span className="text-zinc-600 w-5 text-right text-[10px]">
                                    {isWhite && !entry.startsWith('M') ? `${moveNum}.` : ''}
                                </span>

                                {/* Player color indicator */}
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isWhite ? 'bg-[#e8e0f0] border border-[#c4b8d8]' : 'bg-[#2d2d3d] border border-[#4a4a6a]'
                                    }`} />

                                {/* Move notation */}
                                <span className={`flex-1 ${isLatest ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                    {formatMove(entry)}
                                </span>

                                {/* Move type icon */}
                                {moveTypeIcon(entry) !== '' && (
                                    <span className="text-[10px] text-zinc-600" title="Move type">
                                        {moveTypeIcon(entry)}
                                    </span>
                                )}

                                {/* Quantum indicator */}
                                {hasQuantum && (
                                    <span className="text-purple-500 text-[10px]" title="Quantum collapsed">
                                        ⚛
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MoveHistory;
