type ImageType = "report" | "file";

const VITE_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';

// Use absolute path so requests go to the backend
export const fileUrl = (type: ImageType, url: string) => {
  if (!url) return "";
  // Check if url already has the path prefix (handling partial matches from bad data like "files/file/...")
  let path = url;
  if (!url.includes(`files/${type}/`)) {
     path = `/files/${type}/${url}`;
  } else {
     path = url.startsWith("/") ? url : `/${url}`;
  }
  
  return `${VITE_API_BASE_URL}${path}`;
};
