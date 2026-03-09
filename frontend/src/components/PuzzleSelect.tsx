/* Copyright 2025 Marien Raat <mail@marienraat.nl>
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
        <div className="text-center max-w-[700px] mx-auto p-5">
            <h1 className="text-3xl mb-1 font-bold">Quantum Puzzles</h1>
            <p className="text-gray-400 mb-6 text-lg">
                Solve these quantum checkers puzzles using split moves!
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
                {puzzles.map((puzzle) => {
                    const isCompleted = completedPuzzles.includes(puzzle.id);
                    return (
                        <div
                            key={puzzle.id}
                            className={`bg-zinc-800 border rounded-lg p-4 cursor-pointer text-left transition-all hover:-translate-y-1 ${isCompleted
                                    ? "border-green-500 hover:shadow-[0_4px_15px_rgba(34,197,94,0.3)]"
                                    : "border-zinc-700 hover:border-indigo-500 hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
                                }`}
                            onClick={() => onSelectPuzzle(puzzle)}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="text-xs font-semibold uppercase px-2 py-0.5 rounded text-white tracking-wider"
                                    style={{ backgroundColor: getDifficultyColor(puzzle.difficulty) }}
                                >
                                    {puzzle.difficulty}
                                </span>
                                <span className="text-sm text-gray-400 bg-zinc-700 px-1.5 py-0.5 rounded">{puzzle.boardSize}×{puzzle.boardSize}</span>
                                {isCompleted && <span className="ml-auto text-xl text-green-500 font-bold">✓</span>}
                            </div>
                            <h3 className="m-0 mb-2 text-lg text-gray-200">{puzzle.title}</h3>
                            <p className="m-0 text-sm text-gray-400 leading-relaxed">{puzzle.description}</p>
                        </div>
                    );
                })}
            </div>
            <button onClick={onBack} className="bg-zinc-600 text-white border-none rounded px-5 py-2 cursor-pointer transition-colors hover:bg-zinc-500 text-base">
                Back to Menu
            </button>
        </div>
    );
};

export default PuzzleSelect;
