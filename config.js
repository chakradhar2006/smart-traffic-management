// Configuration for different environments
// When running locally, it points to localhost:8000
// When deployed (e.g. on Render), it should point to your hosted backend URL

// Support for environment variable override if provided via window.ENV_API_URL
const PRODUCTION_URL = "https://smart-traffic-management-f9m5.onrender.com";
const LOCAL_URL = "http://localhost:8000";

const API_URL = (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '' ||
    window.location.hostname.startsWith('192.168.')
) ? (window.ENV_API_URL || LOCAL_URL) : (window.ENV_API_URL || PRODUCTION_URL);

console.log(`[Config] Using API_URL: ${API_URL}`);
