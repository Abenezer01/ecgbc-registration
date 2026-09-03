"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VerifyResponse {
  isValid: boolean;
  message?: string;
  member?: {
    name: string;
    nameEn: string;
    certificateNo: string;
    certificateIssuedDate: string;
    councilFellowshipName: string;
  };
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateNo = params.certificateNo as string;
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certificateNo) return;
    
    // We fetch from the backend public endpoint
    const url = process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1";
    
    fetch(`${url}/members/public/verify/${certificateNo}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setResult(data.data);
        } else {
          setResult({ isValid: false, message: "Failed to verify certificate" });
        }
      })
      .catch(err => {
        setResult({ isValid: false, message: "Error connecting to verification server" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [certificateNo]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center space-y-6">
        <div className="mx-auto w-24 h-24 mb-4">
          <img src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" alt="ECGBC Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p>Verifying Certificate {certificateNo}...</p>
          </div>
        ) : result?.isValid && result.member ? (
          <div className="space-y-6">
            <div className="flex justify-center text-green-500">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div className="bg-green-50 text-green-700 p-4 rounded-lg font-semibold text-lg border border-green-200">
              Valid Certificate
            </div>
            
            <div className="text-left space-y-4 border-t pt-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Member Name</p>
                <p className="text-gray-900 font-semibold">{result.member.name} {result.member.nameEn && `(${result.member.nameEn})`}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Certificate Number</p>
                <p className="text-gray-900 font-semibold">{result.member.certificateNo}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Council / Fellowship</p>
                <p className="text-gray-900 font-semibold">{result.member.councilFellowshipName || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Issued Date</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(result.member.certificateIssuedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center text-red-500">
              <XCircle className="w-16 h-16" />
            </div>
            <div className="bg-red-50 text-red-700 p-4 rounded-lg font-semibold text-lg border border-red-200">
              Invalid or Not Found
            </div>
            <p className="text-gray-600">
              {result?.message || `Certificate number ${certificateNo} could not be verified in our system.`}
            </p>
          </div>
        )}
        
        <div className="pt-6 border-t border-gray-100">
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
