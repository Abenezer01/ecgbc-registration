// src/utils/memberUtils.ts

// Define an interface for the member object structure
interface Member {
  id: string;
  certificateNo: string;
  // Add other properties if needed
}

// Define the API response structure
interface ApiResponse {
  data: {
    members: Member[];
  };
}

/**
 * Formats a certificate number for display
 * Certificate numbers are now stored with proper 5-digit formatting including leading zeros
 * @param certificateNo - The certificate number to format
 * @returns The formatted certificate number
 */
export function formatCertificateNumber(certificateNo: string | null | undefined): string {
  if (!certificateNo) return '—';
  
  // Certificate numbers are now stored with proper formatting, so just return as-is
  return certificateNo;
}

export async function getMemberIdByCertificate(certificateNumber: string): Promise<string | null> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/v1/members', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }
    
    const data: ApiResponse = await response.json();
    const member = data.data.members.find((m: Member) => m.certificateNo === certificateNumber);
    
    if (!member) {
      throw new Error(`Member with certificate number ${certificateNumber} not found`);
    }
    
    return member.id;
  } catch (error) {
    console.error('Error finding member:', error);
    return null;
  }
}