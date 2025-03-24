// src/api/api.js
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; // Tornado Backend URL

// ✅ Fetch all drives
export const fetchDrives = async () => {
  try {
    console.log("📡 Fetching drives...");
    const response = await axios.get(`${BASE_URL}/drives`);
    const drives = response.data?.drives || [];
    console.log("✅ Fetched Drives:", drives);
    return { drives };
  } catch (error) {
    console.error("❌ Error fetching drives:", error);
    return { drives: [], error: true };
  }
};

// ✅ Fetch SMART Data for a Drive
export const getSmartData = async (drive) => {
  try {
    console.log(`📡 Fetching SMART data for ${drive}...`);
    const response = await axios.get(`${BASE_URL}/smart/${drive}`);
    const smartData = response.data?.smart_data || {};
    console.log(`✅ SMART Data for ${drive}:`, smartData);
    return smartData;
  } catch (error) {
    console.error(`❌ Error fetching SMART data for ${drive}:`, error);
    return { error: "Failed to fetch SMART data" };
  }
};

// ✅ Start Scan Process
export const startScan = async (drive) => {
  try {
    console.log(`📡 Starting scan for ${drive}...`);
    const response = await axios.post(`${BASE_URL}/scan/${drive}`);
    const result = response.data;
    console.log(`✅ Scan started for ${drive}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error starting scan for ${drive}:`, error);
    return { error: "Scan initiation failed" };
  }
};
