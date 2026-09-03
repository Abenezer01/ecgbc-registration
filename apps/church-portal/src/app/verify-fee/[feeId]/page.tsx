"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface VerifyFeeResponse {
  isValid: boolean;
  message?: string;
  fee?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
    member?: {
      name: string;
      nameEn: string | null;
      certificateNo: string;
    };
    report?: {
      year: number;
      crv: string | null;
      bankReference: string | null;
    };
  };
}

export default function VerifyFeePage() {
  const params = useParams();
  const feeId = params?.feeId as string;
  const [result, setResult] = useState<VerifyFeeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!feeId) {
      setLoading(false);
      return;
    }
    
    const url = process.env.NEXT_PUBLIC_API_URL || "https://api.registration.ecgbc.org/api/v1";
    
    fetch(`${url}/finance/public/verify/${feeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setResult(data.data);
        } else {
          setResult({ isValid: false, message: "Failed to verify fee" });
        }
      })
      .catch(err => {
        setResult({ isValid: false, message: "Error connecting to verification server" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [feeId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center space-y-6">
        <div className="mx-auto w-24 h-24 mb-4">
          <img src="https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png" alt="ECGBC Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Fee / Receipt Verification</h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p>Verifying Fee Record...</p>
          </div>
        ) : result?.isValid && result.fee ? (
          <div className="space-y-6">
            <div className="flex justify-center text-green-500">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div className="bg-green-50 text-green-700 p-4 rounded-lg font-semibold text-lg border border-green-200">
              Valid Record
            </div>
            
            <div className="text-left space-y-4 border-t pt-4">
              {result.fee.member && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Member Name</p>
                  <p className="text-gray-900 font-semibold">{result.fee.member.name} {result.fee.member.nameEn && `(${result.fee.member.nameEn})`}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Fee Amount</p>
                <p className="text-gray-900 font-semibold">{result.fee.currency} {Number(result.fee.amount).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className="text-gray-900 font-semibold">{result.fee.status}</p>
              </div>

              {result.fee.paidAt && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Paid At</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(result.fee.paidAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {result.fee.report?.year && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Report Year (E.C)</p>
                  <p className="text-gray-900 font-semibold">{result.fee.report.year}</p>
                </div>
              )}

              {result.fee.report?.crv && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">CRV</p>
                  <p className="text-gray-900 font-semibold">{result.fee.report.crv}</p>
                </div>
              )}
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
              {result?.message || `Fee record could not be verified in our system.`}
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
