"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Users, TrendingUp, CheckCircle2, CheckCircle, MapPin, DollarSign, Wallet,
  AlertTriangle, Activity as ActivityIcon, Globe, Building2, UserPlus, Clock
} from "lucide-react";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import {
  PageHeader, StatCard, StatCardSkeleton, Card, CardHeader, CardTitle, CardContent
} from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { EthiopiaMap } from "@/components/ui/EthiopiaMap";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#f59e0b"];

const tooltipStyle = {
  borderRadius: "10px",
  border: "none",
  backgroundColor: "hsl(240 10% 8%)",
  color: "#fafafa",
  fontSize: "12px",
};

export default function DashboardPage() {
  const { staff } = useAuth();
  const [regionView, setRegionView] = useState<"map" | "chart">("map");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: async () => {
      const res = await api.get("/analytics");
      return res.data.data.analytics;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${staff?.firstName ?? "…"}`}
        description="ECGBC Command Center: Overview of demographics, financials, and compliance."
      />

      {/* ── KPI Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={analytics?.totalMembers ?? "—"}
              icon={<Users className="h-5 w-5" />}
              description="Active registered members"
            />
            <StatCard
              title="Active Fellowships"
              value={analytics?.activeFellowships ?? "—"}
              icon={<Building2 className="h-5 w-5" />}
              description="Fellowships in the system"
            />
            <StatCard
              title="Collected Revenue"
              value={`${analytics?.financials?.collectedRevenue?.toLocaleString() ?? "0"} ETB`}
              icon={<Wallet className="h-5 w-5 text-emerald-500" />}
              description="Total reported fees paid"
            />
            <StatCard
              title="Compliance Rate"
              value={`${analytics?.compliance?.rate ?? "0"}%`}
              icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
              trend={{ value: `${analytics?.compliance?.pendingReview ?? 0} pending review`, positive: true }}
            />
            <StatCard
              title="Diaspora Members"
              value={analytics?.diasporaMembers ?? "—"}
              icon={<Globe className="h-5 w-5 text-purple-500" />}
              description="Members outside Ethiopia"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Registration Timeline & Demographics — spans 2 cols */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.registrationTimeline ?? []}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.08)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#grad)"
                        dot={{ r: 3, fill: "#3b82f6" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Fellowships (Size)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] w-full"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[400px] w-full pt-4">
                  {(!analytics?.topFellowships || analytics.topFellowships.length === 0) ? (
                    <p className="text-sm text-zinc-500 text-center py-4">No data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.topFellowships}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.08)" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 11 }} 
                          tickLine={false} 
                          axisLine={false}
                          width={150}
                          interval={0}
                        />
                        <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(150,150,150,0.05)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {analytics.topFellowships.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Ethiopia Regional Distribution</CardTitle>
              <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                <button 
                  onClick={() => setRegionView("map")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${regionView === 'map' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                  Map
                </button>
                <button 
                  onClick={() => setRegionView("chart")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${regionView === 'chart' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                  Bar Chart
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[500px]"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[500px]">
                  {regionView === "map" ? (
                    <EthiopiaMap data={analytics?.regionalDistribution ?? []} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.regionalDistribution ?? []} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.1)" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 11 }} 
                          tickLine={false} 
                          axisLine={false}
                          width={150}
                        />
                        <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(150,150,150,0.05)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {(analytics?.regionalDistribution ?? []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* ── Right Column: Top Fellowships, Financials, Activity ── */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Financial Health</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Expected</p>
                      <p className="text-xl font-bold">{analytics?.financials?.expectedRevenue?.toLocaleString() ?? "0"} ETB</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-zinc-300" />
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">Collected</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{analytics?.financials?.collectedRevenue?.toLocaleString() ?? "0"} ETB</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">Pending Review</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{analytics?.financials?.inReviewRevenue?.toLocaleString() ?? "0"} ETB</p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-300 dark:text-amber-700" />
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider font-semibold">Pending / Outstanding</p>
                      <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{analytics?.financials?.pendingRevenue?.toLocaleString() ?? "0"} ETB</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-300 dark:text-orange-700" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px]"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.compliance?.statusDistribution ?? []}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analytics?.compliance?.statusDistribution ?? []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px]"><Skeleton className="h-full w-full" /></div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.categoryDistribution ?? []}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analytics?.categoryDistribution ?? []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <ActivityIcon className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {(analytics?.engagement?.recentActivity ?? []).map((act: any) => (
                    <div key={act.id} className="flex space-x-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{act.description}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(act.createdAt).toLocaleString()} • {act.performedByType}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.engagement?.recentActivity || analytics.engagement.recentActivity.length === 0) && (
                    <p className="text-sm text-zinc-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}