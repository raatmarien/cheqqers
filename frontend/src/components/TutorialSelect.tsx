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
        <div className="text-center max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="glass-panel p-5 md:p-8 rounded-[2rem] border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] flex flex-col gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-widest text-indigo-300 uppercase italic drop-shadow-[0_0_15px_rgba(165,180,252,0.4)] mb-2">How to Play</h1>
                    <p className="text-indigo-200/60 text-lg font-light tracking-wide">
                        Master the mysteries of quantum checkers through these interactive lessons.
                    </p>
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-3 mb-2">
                        {tutorials.map((tutorial, index) => {
                            const isCompleted = completedTutorials.includes(tutorial.id);
                            const isNext = !isCompleted && (index === 0 || completedTutorials.includes(tutorials[index - 1].id));

                            return (
                                <div
                                    key={tutorial.id}
                                    className={`glass-panel p-4 cursor-pointer text-left transition-all hover:scale-[1.01] group relative border ${tutorial.disabled
                                        ? "border-amber-500/20 bg-black/20 opacity-30 cursor-not-allowed"
                                        : isCompleted
                                            ? "border-emerald-500/40 bg-emerald-500/5 opacity-80"
                                            : isNext
                                                ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                                                : "border-indigo-500/10 bg-black/40 opacity-40 hover:opacity-100"
                                        }`}
                                    onClick={() => !tutorial.disabled && onSelectTutorial(tutorial)}
                                >
                                    {tutorial.disabled && (
                                        <div className="absolute top-2 right-3 text-[10px] font-black uppercase tracking-widest text-amber-500/60 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            Coming Soon
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-2 ${isCompleted ? 'border-emerald-500/60 text-emerald-400 bg-emerald-500/20' :
                                            isNext ? 'border-indigo-400 text-white bg-indigo-500/40 shadow-[0_0_15px_rgba(129,140,248,0.5)]' :
                                                'border-indigo-500/20 text-indigo-300/30'
                                            }`}>
                                            {isCompleted ? '✓' : index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`m-0 text-xl font-black tracking-tight ${isCompleted ? 'text-indigo-200/60' : 'text-white'}`}>
                                                {tutorial.title}
                                            </h3>
                                            <p className="m-0 text-sm text-indigo-200/40 leading-relaxed font-medium">
                                                {tutorial.description}
                                            </p>
                                        </div>
                                        {isNext && <span className="text-indigo-400 animate-pulse text-2xl">▶</span>}
                                    </div>
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

export default TutorialSelect;
