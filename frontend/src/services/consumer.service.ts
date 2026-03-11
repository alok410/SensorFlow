  const API_URL = "https://sensor-flow-nbgt.vercel.app/api/consumers";

  /* =================================
    Helper: Get Auth Header
  =================================*/
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };


  /* =================================
    /* =================================
   CREATE CONSUMER (Admin)
=================================*/
export const createConsumer = async (data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  locationId?: string;
  meterId?: string;
  serialNumber?: string; // ✅ Added
}) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  return response.json();
};

  /* =================================
    GET ALL CONSUMERS (Admin)
  =================================*/
  export const getConsumers = async () => {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getAuthHeader(),
    });

    return response.json();
    
  };


  /* =================================
    UPDATE CONSUMER (Admin)
  =================================*/
  export const updateConsumer = async (
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


  /* =================================
    DELETE CONSUMER (Admin)
  =================================*/
  export const deleteConsumer = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    return response.json();
  };

