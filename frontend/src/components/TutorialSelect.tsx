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
import tutorials from "../tutorials";
import type { Puzzle } from "../puzzles";

interface TutorialSelectProps {
    onSelectTutorial: (tutorial: Puzzle) => void;
    onBack: () => void;
}

const TutorialSelect: React.FC<TutorialSelectProps> = ({ onSelectTutorial, onBack }) => {
    const completedTutorials = JSON.parse(
        localStorage.getItem("completedPuzzles") || "[]"
    ) as string[];

    return (
        <div className="text-center max-w-[700px] mx-auto p-5">
            <h1 className="text-4xl mb-2 font-bold text-amber-500">How to Play Cheqqers</h1>
            <p className="text-gray-400 mb-6 text-lg">
                Complete these interactive lessons to unlock the mysteries of quantum checkers!
            </p>
            <div className="flex flex-col gap-4 mb-8">
                {tutorials.map((tutorial, index) => {
                    const isCompleted = completedTutorials.includes(tutorial.id);
                    // Standardize the lock logic: in a real game, you might require previous levels.
                    // For the sake of UX testing, we leave them unlocked but grayed out.
                    const isNext = !isCompleted && (index === 0 || completedTutorials.includes(tutorials[index - 1].id));

                    return (
                        <div
                            key={tutorial.id}
                            className={`border rounded-lg p-5 cursor-pointer text-left transition-all ${isCompleted
                                    ? "bg-zinc-800/80 border-green-500/50 hover:border-green-400"
                                    : isNext
                                        ? "bg-zinc-800 border-amber-500 hover:bg-zinc-700 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                        : "bg-zinc-900 border-zinc-700 opacity-60 hover:opacity-100"
                                }`}
                            onClick={() => onSelectTutorial(tutorial)}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xl font-bold ${isCompleted ? 'text-green-500' : isNext ? 'text-amber-500' : 'text-zinc-500'}`}>
                                    {isCompleted ? '✓' : isNext ? '▶' : '🔒'}
                                </span>
                                <h3 className={`m-0 text-xl font-semibold ${isCompleted ? 'text-gray-300' : 'text-white'}`}>
                                    {tutorial.title}
                                </h3>
                            </div>
                            <p className="m-0 text-sm text-gray-400 leading-relaxed pl-8">
                                {tutorial.description}
                            </p>
                        </div>
                    );
                })}
            </div>
            <button onClick={onBack} className="bg-zinc-600 text-white border-none rounded px-6 py-3 cursor-pointer transition-colors hover:bg-zinc-500 text-lg font-medium">
                Back to Menu
            </button>
        </div>
    );
};

export default TutorialSelect;
