// Default to localhost:5005 for development, but allow override through environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005'; 