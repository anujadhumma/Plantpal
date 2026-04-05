import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

export const plantAPI = {
  getAll: () => API.get("/plants"),
  create: (data) => API.post("/plants", data),
  update: (id, data) => API.put(`/plants/${id}`, data),
  delete: (id) => API.delete(`/plants/${id}`),
};

export const sensorAPI = {
  send: (data) => API.post("/sensor", data),
  logs: () => API.get("/sensor/logs"),
};

export default API;
