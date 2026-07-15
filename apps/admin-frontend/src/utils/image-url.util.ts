
type ImageType = 'avatar'
const VITE_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';

export const imageUrl = (type:ImageType,url: string) => `${VITE_API_BASE_URL}/images/${type}/${url}`
