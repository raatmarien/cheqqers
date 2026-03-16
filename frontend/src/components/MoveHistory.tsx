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

    // Group moves into rows (White move + Black move)
    const rows: { white?: string; black?: string; moveNum: number }[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        rows.push({
            white: moveHistory[i],
            black: moveHistory[i + 1],
            moveNum: Math.floor(i / 2) + 1,
        });
    }

    const renderPly = (entry: string | undefined, isWhite: boolean, isLatest: boolean) => {
        if (!entry) return <div className="flex-1" />;
        const hasQuantum = entry.includes(';M:');
        
        return (
            <div
                className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                    isLatest ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'
                }`}
            >
                {/* Player color indicator */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isWhite ? 'bg-[#e8e0f0] border border-[#c4b8d8]' : 'bg-[#2d2d3d] border border-[#4a4a6a]'
                }`} />

                {/* Move notation */}
                <span className={`flex-1 truncate ${isLatest ? 'text-white font-bold' : 'text-zinc-400'}`}>
                    {formatMove(entry)}
                </span>

                {/* Move type icon */}
                {moveTypeIcon(entry) !== '' && (
                    <span className="text-[10px] text-zinc-500" title="Move type">
                        {moveTypeIcon(entry)}
                    </span>
                )}

                {/* Quantum indicator */}
                {hasQuantum && (
                    <span className="text-purple-400 text-[10px]" title="Quantum collapsed">
                        ⚛
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0c14]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-500/20 bg-indigo-950/20">
                <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]">📜 Move History</span>
                <span className="ml-auto text-[10px] font-mono text-indigo-500/60 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {moveHistory.length} PLIES
                </span>
            </div>

            <div className="grid grid-cols-[30px_1fr_1fr] gap-1 px-4 py-2 border-b border-indigo-500/10 text-[10px] font-bold text-indigo-300/40 uppercase tracking-widest">
                <div>#</div>
                <div>White</div>
                <div>Black</div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {rows.length === 0 ? (
                    <div className="text-zinc-700 text-xs text-center py-12 italic opacity-50">No moves recorded</div>
                ) : (
                    rows.map((row, idx) => {
                        const isLatestWhite = (idx * 2) === moveHistory.length - 1;
                        const isLatestBlack = (idx * 2 + 1) === moveHistory.length - 1;

                        return (
                            <div key={idx} className="grid grid-cols-[30px_1fr_1fr] gap-1 items-center">
                                <span className="text-[10px] font-mono text-zinc-600 text-center font-bold">
                                    {row.moveNum}.
                                </span>
                                {renderPly(row.white, true, isLatestWhite)}
                                {renderPly(row.black, false, isLatestBlack)}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MoveHistory;
