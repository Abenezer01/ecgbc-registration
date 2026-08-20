"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNameReservation } from "@/hooks/useNameReservation";
import { Button, Textarea } from "@/components/ui";

export default function NameReservationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { useReservation, updateStatus, isUpdatingStatus } = useNameReservation();
  const { data: reservation, isLoading, isError } = useReservation(id);
  const [remark, setRemark] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Loading reservation details...</div>;
  }

  if (isError || !reservation) {
    return <div className="p-8 text-center text-red-500">Failed to load reservation.</div>;
  }

  const similarityData = reservation.similarityData ? JSON.parse(reservation.similarityData) : [];

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateStatus({ id, status, remark });
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
          <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Name Reservation Review
            </h1>
            <p className="text-sm text-zinc-500">Review requested name and similarity matches</p>
          </div>
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Requested Name</h3>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Amharic</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{reservation.requestedNameAm}</p>
            </div>
            {reservation.requestedNameEn && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">English</p>
                <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">{reservation.requestedNameEn}</p>
              </div>
            )}
            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-4 w-4" />
              <span>Requested on {new Date(reservation.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

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
          </div>
        </div>

        {/* Right Column: Similarity & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
              Similarity Analysis
              <span className="text-xs font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{similarityData.length} matches found</span>
            </h3>

            {similarityData.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                <p>No similar names found in the system. Safe to approve.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {similarityData.map((match: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${match.entityType === "MEMBER" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                          {match.entityType}
                        </span>
                        {!match.isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-white truncate" title={match.nameAm}>{match.nameAm}</p>
                      {match.nameEn && <p className="text-xs text-zinc-500 truncate" title={match.nameEn}>{match.nameEn}</p>}
                      
                      {match.flags && match.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.flags.map((flag: string) => (
                            <span key={flag} className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${match.score >= 85 ? "text-red-600 dark:text-red-400" : match.score >= 60 ? "text-amber-500" : "text-green-500"}`}>
                          {match.score}%
                        </p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Match</p>
                      </div>
                      <Button variant="outline" className="!px-3 !py-1 !h-8 text-xs" onClick={() => router.push(match.entityType === "MEMBER" ? `/members/${match.entityId}/overview` : `/fellowships/${match.entityId}/overview`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reservation.status === "PENDING" && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Admin Review Action</h3>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Remark / Reason (Optional)</label>
                <Textarea 
                  value={remark} 
                  onChange={(e) => setRemark(e.target.value)} 
                  placeholder="Enter any notes, or a reason if rejecting..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
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
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Name
                </Button>
              </div>
            </div>
          )}

          {reservation.status !== "PENDING" && reservation.remark && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
              <h3 className="font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-zinc-400" /> Review Remark
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic whitespace-pre-wrap">
                "{reservation.remark}"
              </p>
              {reservation.reviewer && (
                <p className="text-xs text-zinc-500 pt-2 text-right">
                  — Reviewed by {reservation.reviewer.firstName} {reservation.reviewer.lastName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
