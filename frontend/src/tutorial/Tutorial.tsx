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
 */
import React, { useState, useEffect } from "react";
import { tutorialSections, getStepByIndex, getTotalSteps } from "./tutorialData";
import TutorialBoard from "./TutorialBoard";
import "./Tutorial.css";

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [moveCompleted, setMoveCompleted] = useState(false);
  const [boardKey, setBoardKey] = useState(0); // Used to force re-render of board

  const totalSteps = getTotalSteps();
  const stepData = getStepByIndex(currentStepIndex);

  // Reset tutorial when it opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setMoveCompleted(false);
      setBoardKey(prev => prev + 1);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset move state when step changes
    setMoveCompleted(false);
    setBoardKey(prev => prev + 1);
  }, [currentStepIndex]);

  if (!isOpen || !stepData) {
    return null;
  }

  const { section, step } = stepData;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Tutorial complete
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleMoveComplete = () => {
    setMoveCompleted(true);
  };

  const handleSkipSection = () => {
    // Find the start of the next section
    let stepsToSkip = 0;
    const currentSectionIndex = stepData.sectionIndex;
    
    // Count remaining steps in current section
    for (let i = stepData.stepIndex + 1; i < section.steps.length; i++) {
      stepsToSkip++;
    }
    
    if (currentSectionIndex < tutorialSections.length - 1) {
      setCurrentStepIndex(currentStepIndex + stepsToSkip + 1);
    } else {
      // Last section, close tutorial
      onClose();
    }
  };

  const canProceed = step.isInformational || moveCompleted;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Calculate progress
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <div className="tutorial-header">
          <div className="tutorial-progress-container">
            <div className="tutorial-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="tutorial-section-title">{section.title}</div>
          <button className="tutorial-close-button" onClick={onClose} aria-label="Close tutorial">
            ×
          </button>
        </div>

        <div className="tutorial-content">
          <h2 className="tutorial-step-title">{step.title}</h2>
          <p className="tutorial-description">{step.description}</p>

          {step.scenario && (
            <div className="tutorial-scenario">
              <TutorialBoard
                key={boardKey}
                scenario={step.scenario}
                onMoveComplete={handleMoveComplete}
              />
              {step.instructions && (
                <div className={`tutorial-instructions ${moveCompleted ? 'completed' : ''}`}>
                  {moveCompleted ? (
                    <>
                      <span className="checkmark">✓</span> Great job! Click "Next" to continue.
                    </>
                  ) : (
                    <>
                      <span className="arrow">→</span> {step.instructions}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tutorial-footer">
          <div className="tutorial-step-counter">
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
          <div className="tutorial-buttons">
            <button
              className="tutorial-button tutorial-skip-button"
              onClick={handleSkipSection}
            >
              Skip Section
            </button>
            <button
              className="tutorial-button tutorial-prev-button"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              Previous
            </button>
            <button
              className="tutorial-button tutorial-next-button"
              onClick={handleNext}
              disabled={!canProceed}
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
