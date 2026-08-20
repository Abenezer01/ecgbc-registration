"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, CheckCircle, Clock, Shield, PlusCircle, FileText, Settings, UserPlus, Building2 } from "lucide-react";
import { useStaffDetail, useStaffStats, useStaffLogs } from "@/hooks/useStaff";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

export default function StaffDetailReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [page, setPage] = useState(1);

  const { data: staff, isLoading: isStaffLoading } = useStaffDetail(id);
  const { data: stats, isLoading: isStatsLoading } = useStaffStats(id);
  const { data: logsData, isLoading: isLogsLoading } = useStaffLogs(id, page, 20);

  if (isStaffLoading) {
    return <div className="p-8 text-center text-zinc-500">Loading staff details...</div>;
  }

  if (!staff) {
    return <div className="p-8 text-center text-red-500">Staff member not found.</div>;
  }

  const logs = (logsData as any)?.logs || [];
  const pagination = (logsData as any)?.pagination;

  const getActivityIcon = (action: string, entity: string) => {
    if (action === "CREATE" && entity === "MEMBER") return <UserPlus className="h-4 w-4 text-green-500" />;
    if (action === "CREATE" || action === "UPDATE") return <PlusCircle className="h-4 w-4 text-blue-500" />;
    if (action === "DELETE") return <Shield className="h-4 w-4 text-red-500" />;
    return <Settings className="h-4 w-4 text-zinc-500" />;
  };

  const getActivityDescription = (log: any) => {
    let text = `${log.action} ${log.entity}`;
    if (log.description) text += `: ${log.description}`;
    return text;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Staff Profile
            </h1>
            <p className="text-sm text-zinc-500">Review staff details, statistics, and activity logs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-zinc-950 shadow-sm overflow-hidden">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.firstName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-zinc-400" />
                )}
              </div>
              <CardTitle className="text-xl">{staff.firstName} {staff.lastName}</CardTitle>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{staff.role?.type}</p>
              <div className="pt-2">
                <Badge variant={staff.state?.codeName === "ACTIVE" ? "success" : "secondary"}>
                  {staff.state?.name || "ACTIVE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300 break-all">{staff.email}</span>
              </div>
              {staff.phoneNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">{staff.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300">Joined {new Date(staff.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Fellowships */}
          {staff.fellowships && staff.fellowships.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Assigned Fellowships
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 p-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {staff.fellowships.map((sf: any) => (
                    <div key={sf.id} className="p-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {sf.fellowship?.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {sf.fellowship?.city}, {sf.fellowship?.country}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Stats & Logs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isStatsLoading ? "..." : (stats as any)?.totalMembersRegistered || 0}
                </h4>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Members Reg</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isStatsLoading ? "..." : (stats as any)?.totalReportsProcessed || 0}
                </h4>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Reports Proc</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isStatsLoading ? "..." : (stats as any)?.totalNamesReviewed || 0}
                </h4>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Names Reviewed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                  <PlusCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isStatsLoading ? "..." : (stats as any)?.totalNamesRequested || 0}
                </h4>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Names Req</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs Timeline */}
          <Card>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>Activity Log</span>
                <span className="text-sm font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                  {pagination?.total || 0} total actions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLogsLoading ? (
                <div className="p-8 text-center text-zinc-500">Loading activities...</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center">
                  <Clock className="h-8 w-8 text-zinc-300 mb-2" />
                  <p>No activity logged for this staff member yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex gap-4">
                      <div className="mt-1 bg-white dark:bg-zinc-950 p-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm h-fit">
                        {getActivityIcon(log.action, log.entity)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {getActivityDescription(log)}
                          </p>
                          <span className="text-[10px] text-zinc-500 whitespace-nowrap bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono bg-zinc-50 dark:bg-zinc-900 w-fit px-1.5 py-0.5 rounded">
                          {log.entity} • {log.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium text-zinc-500">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
