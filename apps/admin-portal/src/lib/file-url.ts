const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const fileUrl = (type: "report" | "file", url: string) => {
  if (!url) return "";
  let path = url;
  if (!url.includes(`files/${type}/`)) {
     path = `/files/${type}/${url}`;
  } else {
     path = url.startsWith("/") ? url : `/${url}`;
  }
  return `${NEXT_PUBLIC_API_URL}${path}`;
};
