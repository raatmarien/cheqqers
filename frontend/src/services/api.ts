import axios from "axios";
import config from "../config";

export const fetchInitialBoard = async () => {
  try {
    const response = await axios.get(`${config.backendUrl}/start`);
    return response.data;
  } catch (error) {
    console.error("Error fetching the initial board:", error);
    throw error;
  }
};

export const doMove = async (boardState: object, moveIndex: number, againstAi: bool) => {
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
