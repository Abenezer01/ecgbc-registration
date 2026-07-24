export function fileUrl(type: 'file' | 'report' | 'profile', fileName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://api.registration.ecgbc.org';
  
  if (type === 'file') return `${baseUrl}/uploads/files/${fileName}`;
  if (type === 'report') return `${baseUrl}/uploads/reports/${fileName}`;
  if (type === 'profile') return `${baseUrl}/uploads/profiles/${fileName}`;
  
  return `${baseUrl}/uploads/${fileName}`;
}
