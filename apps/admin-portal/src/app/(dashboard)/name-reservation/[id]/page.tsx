"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, AlertTriangle, CheckCircle, XCircle, Search, Loader2 } from "lucide-react";
import { useNameReservation } from "@/hooks/useNameReservation";
import { Button, Textarea } from "@/components/ui";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

export default function NameReservationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { useReservation, updateStatus, isUpdatingStatus } = useNameReservation();
  const { data: reservation, isLoading, isError } = useReservation(id);
  
  const [remark, setRemark] = useState("");
  const [selectedNameIndex, setSelectedNameIndex] = useState<number>(0);
  
  // Checking logic for proposed names
  const [checkingName, setCheckingName] = useState<number | null>(null);
  const [nameChecks, setNameChecks] = useState<Record<number, any[]>>({});

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Loading reservation details...</div>;
  }

  if (isError || !reservation) {
    return <div className="p-8 text-center text-red-500">Failed to load reservation.</div>;
  }

  const proposedNames = reservation.proposedNames && Array.isArray(reservation.proposedNames) 
    ? reservation.proposedNames 
    : [{ nameAm: reservation.requestedNameAm, nameEn: reservation.requestedNameEn || "" }];

  const checkNameSimilarity = async (index: number, nameAm: string, nameEn: string = "") => {
    setCheckingName(index);
    try {
      const res = await api.post("/name-reservations/public/check", { nameAm, nameEn });
      setNameChecks(prev => ({ ...prev, [index]: res.data?.data?.matches ?? [] }));
    } catch (error) {
      toast.error("Failed to check name similarity");
    } finally {
      setCheckingName(null);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      let finalNameAm = reservation.requestedNameAm;
      let finalNameEn = reservation.requestedNameEn;
      
      if (status === "APPROVED" && proposedNames[selectedNameIndex]) {
        finalNameAm = proposedNames[selectedNameIndex].nameAm;
        finalNameEn = proposedNames[selectedNameIndex].nameEn ?? null;
      }
      
      await updateStatus({ id, status, remark, finalNameAm, finalNameEn } as any);
      router.push("/name-reservation");
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">APPROVED</span>;
      case "REJECTED": return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-semibold">REJECTED</span>;
      case "PENDING": return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-semibold">PENDING</span>;
      default: return <span className="px-3 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Review Name Reservation</h1>
            <p className="text-sm text-zinc-500">ID: {reservation.id}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(reservation.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Requester Info</h3>
            
            {reservation.requester ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">Staff: {reservation.requester.firstName} {reservation.requester.lastName}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">Public Request</p>
                {reservation.publicRequesterName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">{reservation.publicRequesterName}</span>
                  </div>
                )}
                {reservation.publicRequesterEmail && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">{reservation.publicRequesterEmail}</span>
                  </div>
                )}
                {reservation.publicRequesterPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">{reservation.publicRequesterPhone}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
              <Calendar className="h-4 w-4" />
              <span>Requested on {new Date(reservation.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {reservation.status === "APPROVED" && reservation.reservationCode && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30 p-5 shadow-sm">
              <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">Reservation Code</h3>
              <p className="text-3xl font-mono font-black text-green-700 dark:text-green-500">{reservation.reservationCode}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">The applicant uses this code to apply.</p>
            </div>
          )}
        </div>

        {/* Right Column: Proposed Names & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Proposed Names Validation
            </h3>
            <p className="text-sm text-zinc-500">Check the proposed names against the database to ensure no conflicts before approving.</p>

            <div className="space-y-4 mt-4">
              {proposedNames.map((pn: any, index: number) => {
                const matches = nameChecks[index];
                const isChecked = matches !== undefined;
                
                return (
                  <div key={index} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 bg-zinc-50 dark:bg-zinc-800/20">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                        Choice {index + 1}
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                        onClick={() => checkNameSimilarity(index, pn.nameAm, pn.nameEn)}
                        disabled={checkingName === index}
                      >
                        {checkingName === index ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
                        Check Availability
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">Amharic Name</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{pn.nameAm}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">English Name</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{pn.nameEn || "-"}</p>
                      </div>
                    </div>
                    
                    {isChecked && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        {matches.length === 0 ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle className="h-4 w-4" /> No conflicts found. Name is available.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                              <AlertTriangle className="h-4 w-4" /> Found {matches.length} similar names
                            </div>
                            <div className="space-y-2">
                              {matches.map((match: any, mIdx: number) => (
                                <div key={mIdx} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-100 dark:border-zinc-800 text-xs">
                                  <div>
                                    <span className="font-semibold text-zinc-900 dark:text-white mr-2">{match.nameAm}</span>
                                    <span className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{match.entityType}</span>
                                  </div>
                                  <span className={`font-bold ${match.score > 80 ? "text-red-500" : "text-amber-500"}`}>{match.score}% Match</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {reservation.status === "PENDING" && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Admin Review Action</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Select Approved Name</label>
                  <select 
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedNameIndex}
                    onChange={(e) => setSelectedNameIndex(Number(e.target.value))}
                  >
                    {proposedNames.map((pn: any, index: number) => (
                      <option key={index} value={index}>
                        Choice {index + 1} - {pn.nameAm}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-1">This name will be locked in for the registration application.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Remark / Reason (Optional)</label>
                  <Textarea 
                    value={remark} 
                    onChange={(e) => setRemark(e.target.value)} 
                    placeholder="Enter any notes, or a reason if rejecting..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button 
                  onClick={() => handleUpdateStatus("APPROVED")} 
                  disabled={isUpdatingStatus}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Name
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus("REJECTED")} 
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
