/* Copyright 2025 Evert van Nieuwenburg <evert@quantumplayed.com>
 *  
 * This file is part of Cheqqers.
 *                           
 * Cheqqers is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *                                
 * Cheqqers is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *                                                    
 * You should have received a copy of the GNU Affero General Public
 * License along with Cheqqers. If not, see
 * <https://www.gnu.org/licenses/>.
 *  */
import React from "react";
import puzzles from "../puzzles";
import type { Puzzle } from "../puzzles";

interface PuzzleSelectProps {
    onSelectPuzzle: (puzzle: Puzzle) => void;
    onBack: () => void;
}

const PuzzleSelect: React.FC<PuzzleSelectProps> = ({ onSelectPuzzle, onBack }) => {
    const completedPuzzles = JSON.parse(
        localStorage.getItem("completedPuzzles") || "[]"
    ) as string[];

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy": return "#4caf50";
            case "medium": return "#ff9800";
            case "hard": return "#f44336";
            default: return "#999";
        }
    };

    return (
        <div className="text-center max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="glass-panel p-5 md:p-8 rounded-[2rem] border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] flex flex-col gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-widest text-indigo-300 uppercase italic drop-shadow-[0_0_15px_rgba(165,180,252,0.4)] mb-2">Quantum Puzzles</h1>
                    <p className="text-indigo-200/60 text-lg font-light tracking-wide">
                        Master the quantum realm through these interactive challenges.
                    </p>
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        {puzzles.map((puzzle) => {
                            const isCompleted = completedPuzzles.includes(puzzle.id);
                            return (
                                <div
                                    key={puzzle.id}
                                    className={`glass-panel p-4 cursor-pointer text-left transition-all hover:scale-[1.02] group relative border ${isCompleted
                                        ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                        : "border-indigo-500/20 bg-black/40 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                                        }`}
                                    onClick={() => onSelectPuzzle(puzzle)}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white tracking-widest"
                                            style={{ backgroundColor: getDifficultyColor(puzzle.difficulty) }}
                                        >
                                            {puzzle.difficulty}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-indigo-500/20">{puzzle.boardSize}×{puzzle.boardSize}</span>
                                        {isCompleted && <span className="ml-auto text-emerald-400 font-black tracking-tighter flex items-center gap-1 text-xs">
                                            <span className="text-lg">✓</span> COMPLETED
                                        </span>}
                                    </div>
                                    <h3 className={`m-0 mb-1 text-xl font-black tracking-tight ${isCompleted ? 'text-emerald-200/80' : 'text-white'}`}>{puzzle.title}</h3>
                                    <p className="m-0 text-sm text-indigo-200/50 leading-relaxed font-medium">{puzzle.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button onClick={onBack} className="quantris-btn py-4 w-full group border-indigo-500/30 max-w-xs mx-auto shrink-0 mt-4">
                    <span className="quantris-title text-xl font-black tracking-[0.3em]">BACK TO MENU</span>
                </button>
            </div>
        </div>
    );
};

export default PuzzleSelect;
