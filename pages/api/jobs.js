import axios from "axios";

// Allow configuring a replacement Jobs API without code changes
const API_BASE_URL = process.env.JOBS_API_BASE_URL || ""; // e.g. https://api.newjobs.com/v1
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || process.env.JOBS_API_KEY || "";
const API_HOST = process.env.JOBS_API_HOST || ""; // if needed for RapidAPI-like providers

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!API_BASE_URL) {
    return res.status(503).json({
      error: "Jobs API is not configured. Set JOBS_API_BASE_URL (and JOBS_API_KEY/JOBS_API_HOST if required).",
    });
  }

  try {
    const { endpoint, ...params } = req.query;
    if (!endpoint) {
      return res.status(400).json({ error: "Missing 'endpoint' query parameter" });
    }

    const url = `${API_BASE_URL.replace(/\/$/, "")}/${String(endpoint).replace(/^\//, "")}`;
    const headers = {
      ...(API_KEY ? { "X-RapidAPI-Key": API_KEY } : {}),
      ...(API_HOST ? { "X-RapidAPI-Host": API_HOST } : {}),
    };

    const response = await axios.get(url, { headers, params });
    return res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message || "Internal Server Error";
    return res.status(status).json({ error: message });
  }
}
