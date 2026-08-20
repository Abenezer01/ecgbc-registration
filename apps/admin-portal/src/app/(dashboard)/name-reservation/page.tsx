"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Badge, DataTable, type Column } from "@/components/ui";
import { Search, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { useNameReservation, type NameCheckMatch, type NameReservation } from "@/hooks/useNameReservation";

export default function NameReservationPage() {
  const [nameAm, setNameAm] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [matches, setMatches] = useState<NameCheckMatch[] | null>(null);

  const { checkName, isChecking, createReservation, isCreating, useReservations, updateStatus } = useNameReservation();
  const { data: reservations = [], isLoading: isReservationsLoading } = useReservations();

  const handleCheck = async () => {
    if (!nameAm.trim()) return;
    const res = await checkName({ nameAm, nameEn });
    setMatches(res);
  };

  const handleReserve = async () => {
    if (!nameAm.trim()) return;
    await createReservation({ nameAm, nameEn });
    setMatches(null);
    setNameAm("");
    setNameEn("");
  };

  const reservationColumns: Column<NameReservation>[] = [
    {
      key: "name",
      header: "Requested Name",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.requestedNameAm}</div>
          <div className="text-sm text-zinc-500">{row.requestedNameEn}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const statusColors: Record<string, string> = {
          PENDING: "bg-amber-100 text-amber-800",
          APPROVED: "bg-green-100 text-green-800",
          REJECTED: "bg-red-100 text-red-800",
          USED: "bg-blue-100 text-blue-800",
          EXPIRED: "bg-gray-100 text-gray-800",
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[row.status] || "bg-gray-100"}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: "requester",
      header: "Requested By",
      cell: (row) => row.requester ? `${row.requester.firstName} ${row.requester.lastName}` : "Unknown",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.href = `/name-reservation/${row.id}`}
          >
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Name Reservation</h1>
          <p className="text-zinc-500">Check name availability and manage reservations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Check Name Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name (Amharic) *</label>
                <Input
                  placeholder="የቤተክርስቲያን ስም"
                  value={nameAm}
                  onChange={(e) => setNameAm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name (English)</label>
                <Input
                  placeholder="Church Name"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleCheck} disabled={isChecking || !nameAm}>
                  <Search className="w-4 h-4 mr-2" />
                  {isChecking ? "Checking..." : "Check"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleReserve} disabled={isCreating || !nameAm}>
                  Reserve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {matches !== null && (
            <Card className={matches.length > 0 ? "border-amber-500" : "border-green-500"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {matches.length > 0 ? (
                    <><ShieldAlert className="w-5 h-5 text-amber-500" /> Similar Names Found ({matches.length})</>
                  ) : (
                    <><CheckCircle className="w-5 h-5 text-green-500" /> Name Available!</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                            {match.nameAm}
                            <Badge variant={match.isActive ? "success" : "danger"}>
                              {match.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="secondary">{match.entityType}</Badge>
                          </div>
                          {match.nameEn && <div className="text-sm text-zinc-500">{match.nameEn}</div>}
                          <div className="text-xs text-zinc-400 mt-1 flex gap-1 flex-wrap">
                            {match.flags.map((flag, fIdx) => (
                              <span key={fIdx} className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${match.score >= 85 ? 'text-red-500' : 'text-amber-500'}`}>
                            {match.score}%
                          </div>
                          <div className="text-xs text-zinc-400">Match Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No similar names found in the system. This name is safe to use.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-500" /> Reservation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={reservationColumns}
                data={reservations}
                rowKey={(row) => row.id}
                isLoading={isReservationsLoading}
                emptyTitle="No reservations"
                emptyDescription="No name reservations have been made yet."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
