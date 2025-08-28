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
import axios from "axios";
import config from "../config";

export const fetchInitialBoard = async (gameType: number) => {
  try {
    const response = await axios.get(`${config.backendUrl}/start?game_type=${gameType}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching the initial board:", error);
    throw error;
  }
};

export const doMove = async (boardState: object, moveIndex: number, againstAi: boolean) => {
  try {
    const response = await axios.post(
        `${config.backendUrl}/move/${moveIndex}?do_ai_move=${againstAi}`,
      boardState);
    return response.data;
  } catch (error) {
    console.error("Error processing the move:", error);
    throw error;
  }
};

export const doAiMove = async (boardState: object) => {
  try {
    const response = await axios.post(
        `${config.backendUrl}/ai-move`,
      boardState);
    return response.data;
  } catch (error) {
    console.error("Error processing the move:", error);
    throw error;
  }
};
