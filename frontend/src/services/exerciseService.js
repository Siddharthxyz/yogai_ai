/**
 * exerciseService.js
 * ==================
 * Axios instance for the Exercise Counter API.
 * All exercise endpoints live at: http://localhost:5000/api/exercise/...
 */
import axios from "axios";

const exerciseAPI = axios.create({
  baseURL: "http://localhost:5000/api/exercise",
  timeout: 10000,
});

export default exerciseAPI;
