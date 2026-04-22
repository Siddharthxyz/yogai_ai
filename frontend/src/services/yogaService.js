import axios from "axios";

const yogaAPI = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default yogaAPI;
