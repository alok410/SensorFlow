const API_URL = "https://sensor-flow-nbgt.vercel.app/api/secretaries";

/* Helper: Get Auth Header */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/* ===============================
   CREATE SECRETARY (Admin)
=================================*/
export const createSecretary = async (data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  locationId?: string;
}) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  return response.json();
};


/* ===============================
   GET ALL SECRETARIES (Admin)
=================================*/
export const getAllSecretaries = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeader(),
  });

  return response.json();
};


/* ===============================
   GET MY PROFILE (Secretary)
=================================*/
export const getMyProfile = async () => {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: getAuthHeader(),
  });

  return response.json();
};


/* ===============================
   UPDATE SECRETARY (Admin)
=================================*/
export const updateSecretary = async (
  id: string,
  data: any
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  return response.json();
};


/* ===============================
   DELETE SECRETARY (Admin)
=================================*/
export const deleteSecretary = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  return response.json();
};
