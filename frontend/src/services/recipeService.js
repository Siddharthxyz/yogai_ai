import axios from "axios";

const recipeAPI = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default recipeAPI;
