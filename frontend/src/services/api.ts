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
