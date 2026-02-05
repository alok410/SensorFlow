import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

// if using env:
// const API_URL = import.meta.env.VITE_API_URL + "/locations";

export const createLocation = (data) =>
  axios.post(API_URL, data);

export const getLocations = () =>
  axios.get(API_URL);

export const getLocationById = (id) =>
  axios.get(`${API_URL}/${id}`);

export const updateLocation = (id, data) =>
  axios.put(`${API_URL}/${id}`, data);

export const deleteLocation = (id) =>
  axios.delete(`${API_URL}/${id}`);
