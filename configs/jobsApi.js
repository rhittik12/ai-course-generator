import axios from "axios";

// Use internal API route which proxies to the configured Jobs API
const INTERNAL_API = "/api/jobs";

/**
 * Fetch jobs from the API.
 * 
 * @param {Object} params - The query parameters for the job search.
 * @returns {Promise<Object>} - The job search results.
 */
export const fetchJobs = async (params) => {
  try {
    const response = await axios.get(`${INTERNAL_API}`, {
      params: { endpoint: "list", ...params },
    });
    return response.data;
  } catch (error) {
    const server = error?.response?.data;
    const msg =
      (typeof server === 'string' && server) ||
      server?.error ||
      (server ? JSON.stringify(server) : '') ||
      error.message ||
      'Failed to fetch jobs.';
    console.error("Error fetching jobs:", server || error.message);
    throw new Error(msg);
  }
};

/**
 * Fetch job titles for a given query.
 * 
 * @param {Object} params - The query parameters for job titles.
 * @returns {Promise<Object>} - The list of job titles.
 */
export const fetchJobTitles = async (params) => {
  try {
    const response = await axios.get(`${INTERNAL_API}`, {
      params: { endpoint: "salary/getJobTitles", ...params },
    });
    return response.data;
  } catch (error) {
    const server = error?.response?.data;
    const msg =
      (typeof server === 'string' && server) ||
      server?.error ||
      (server ? JSON.stringify(server) : '') ||
      error.message ||
      'Failed to fetch job titles.';
    console.error("Error fetching job titles:", server || error.message);
    throw new Error(msg);
  }
};

/**
 * Fetch salary range for a specific job title and country.
 * 
 * @param {Object} params - The query parameters for salary range.
 * @returns {Promise<Object>} - The salary range data.
 */
export const fetchSalaryRange = async (params) => {
  try {
    const response = await axios.get(`${INTERNAL_API}`, {
      params: { endpoint: "salary/getSalaryRange", ...params },
    });
    return response.data;
  } catch (error) {
    const server = error?.response?.data;
    const msg =
      (typeof server === 'string' && server) ||
      server?.error ||
      (server ? JSON.stringify(server) : '') ||
      error.message ||
      'Failed to fetch salary range.';
    console.error("Error fetching salary range:", server || error.message);
    throw new Error(msg);
  }
};
