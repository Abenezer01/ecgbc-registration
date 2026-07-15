import { Box, Stack, Typography, Paper } from "@mui/material";
import GroupPersonIcon from "../../assets/GroupPerson.svg";
import { Link } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useEffect, useRef, useState } from "react";
import { getDashboardStat } from "../../store/features/auth.slice";
import { DashboardStatLoading } from "../shared/Loaders";
import { userHasPermission } from "../../utils/hasPermission.util";
import { Permissions } from "../../enums/permission.enum";
import { RoleType } from "../../enums/role-type.enum";
import { alpha, darken } from "@mui/material/styles";
import api from "../../api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, Legend
} from "recharts";
const StatCard = ({
  accent,
  title,
  value,
  subtitle,
  onClick,
  to,
}: {
  accent: string;
  title: string;
  value?: number | string;
  subtitle?: string | JSX.Element;
  onClick?: () => void;
  to?: string;
}) => {
  const gradient = `linear-gradient(135deg, ${accent} 0%, ${darken(accent, 0.25)} 92%)`;
  const content = (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 3,
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 120,
        background: gradient,
        color: "#FFFFFF",
        boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        overflow: "hidden",
        cursor: onClick || to ? "pointer" : "default",
        transition: "transform .25s ease, box-shadow .25s ease",
        "&:before": {
          content: '""',
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        },
        "&:after": {
          content: '""',
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        },
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            height: 48,
            width: 48,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha("#FFFFFF", 0.15),
            boxShadow: `0 2px 8px ${alpha("#000", 0.3)}`,
            border: `1px solid ${alpha("#FFFFFF", 0.35)}`,
            flexShrink: 0,
            backdropFilter: "blur(4px)",
          }}
        >
          <Box component={"img"} src={GroupPersonIcon} sx={{ width: 22, height: 22, filter: "brightness(1.1)" }} />
        </Box>
        <Stack gap={0.25} sx={{ minWidth: 0 }}>
          <Typography fontFamily={"Inter"} fontWeight={600} fontSize={"0.7rem"} sx={{ letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.9 }}>
            {title}
          </Typography>
          <Typography fontFamily={"Inter"} fontWeight={700} fontSize={{ xs: "1.5rem", md: "1.75rem" }} lineHeight={1}>
            {value}
          </Typography>
          {subtitle && (
            <Typography fontFamily={"Inter"} fontWeight={500} fontSize={"0.65rem"} sx={{ opacity: 0.85 }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {content}
      </Link>
    );
  }

  return (
    <Box onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
      {content}
    </Box>
  );
};

const Statistics = () => {
  const { dashboardStat, status, task, staff } = useAppSelector((state) => state.auth);
  
  const { data: analyticsResp } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const response = await api.get('/analytics');
      return response.data.data.analytics;
    },
  });
  const analyticsData = analyticsResp;
  
  const dispatch = useAppDispatch();
  const [inactiveCount, setInactiveCount] = useState(0);
  const [inactiveLoading, setInactiveLoading] = useState(true);
  const inactiveCountRef = useRef(inactiveCount);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canDeactivate = userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_DEACTIVATE]);

  useEffect(() => {
    dispatch(getDashboardStat());
  }, [dispatch]);

  useEffect(() => {
    inactiveCountRef.current = inactiveCount;
  }, [inactiveCount]);

  useEffect(() => {
    let isMounted = true;
    const clearScheduledRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };

    const fetchInactiveCount = async () => {
      if (!isMounted) return;
      setInactiveLoading(true);
      try {
        const response = await api.get("/members/inactive/count");
        if (!isMounted) return;

        const nextCount = response.data.data.count;
        
        inactiveCountRef.current = nextCount;
        setInactiveCount(nextCount);
      } catch (error) {
        console.error("Error fetching inactive count:", error);
      } finally {
        if (isMounted) {
          setInactiveLoading(false);
        }
      }
    };

    const handleRefresh = () => {
      // Immediate fetch on event
      fetchInactiveCount();
       // Also refresh main stats to update deleted count
      dispatch(getDashboardStat());
    };    if (canDeactivate) {
      fetchInactiveCount();
      window.addEventListener("inactive-count-refresh", handleRefresh);
      return () => {
        isMounted = false;
        clearScheduledRefresh();
        window.removeEventListener("inactive-count-refresh", handleRefresh);
      };
    } else {
      setInactiveLoading(false);
      return () => {
        isMounted = false;
        clearScheduledRefresh();
      };
    }
  }, [canDeactivate]);

  const loading = status === "loading" && task === "fetch-dashboard-stat";
  const staffIsOwner = staff?.role?.type?.value === RoleType.OWNER;
  const canSeeChurches = !!dashboardStat?.churchesVisible;

  return (
    <Box sx={{ background: "transparent", px: { xs: 2, md: 6 }, py: { xs: 2, md: 4 } }}>
      {loading ? (
        <DashboardStatLoading />
      ) : (
        <Box sx={{ maxWidth: 1536, mx: "auto" }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              mt: 1,
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(200px, 1fr))',
                sm: 'repeat(auto-fill, minmax(220px, 1fr))',
                md: 'repeat(5, 1fr)'
              }
            }}
          >
            {(staffIsOwner || canSeeChurches) && userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_VIEW]) && (
              <StatCard
                accent="#2563eb"
                title="Total Number of Churches"
                value={dashboardStat?.totalChurches}
                subtitle={
                  <>
                    <Box component={"span"} sx={{ color: "#FFFFFF" }}>
                      {dashboardStat?.weeklyChurches} churches
                    </Box>{" "}
                    joined this week
                  </>
                }
              />
            )}

            {userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_VIEW]) && (
              <StatCard
                accent="#f59e0b"
                title="Total Number of Ministries"
                value={dashboardStat?.totalMinistries}
                subtitle={
                  <>
                    <Box component={"span"} sx={{ color: "#FFFFFF" }}>
                      {dashboardStat?.weeklyMinistries} ministries
                    </Box>{" "}
                    joined this week
                  </>
                }
              />
            )}

            {userHasPermission(staff?.role?.permissions ?? [], [Permissions.COUNCIL_FELLOWSHIP_VIEW]) && (
              <StatCard
                to="/council-fellowship"
                accent="#16a34a"
                title="Total Number of Fellowships"
                value={dashboardStat?.totalCouncilFellowships}
                subtitle={
                  <>
                    <Box component={"span"} sx={{ color: "#FFFFFF" }}>
                      {dashboardStat?.weeklyCouncilFellowships} fellowships
                    </Box>{" "}
                    joined this week
                  </>
                }
              />
            )}

            {canDeactivate && userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_VIEW]) && (
              <StatCard
                to="/inactive-members"
                accent="#64748b"
                title="Inactive Records"
                value={inactiveLoading ? "Loading..." : inactiveCount}
                subtitle={
                  <>
                    <Box component={"span"} sx={{ color: "#FFFFFF" }}>
                      {inactiveCount} records
                    </Box>{" "}
                    marked as inactive
                  </>
                }
              />
            )}

            {/* Permanently Deleted Card for Admins */}
            {(staffIsOwner || userHasPermission(staff?.role?.permissions ?? [], [Permissions.MEMBER_DEACTIVATE])) && dashboardStat?.totalDeleted !== undefined && (
              <StatCard
                to="/deleted-records"
                accent="#ef4444" // Red color
                title="Permanently Deleted"
                value={dashboardStat.totalDeleted}
                subtitle="Deleted records"
              />
            )}
          </Box>

          {/* Analytics Charts */}
          {analyticsData && (
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              {/* Regional Distribution */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.06)' }}>
                <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Inter', fontWeight: 600 }}>Regional Distribution</Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={analyticsData.regionalDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Compliance Rate & Category */}
              <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.06)', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Inter', fontWeight: 600 }}>Yearly Compliance Rate</Typography>
                  <Box sx={{ width: '100%', flexGrow: 1, minHeight: 120 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={analyticsData.complianceRate} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                          {analyticsData.complianceRate?.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.06)' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Inter', fontWeight: 600 }}>Category Distribution</Typography>
                  <Box sx={{ width: '100%', flexGrow: 1, minHeight: 120 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={analyticsData.categoryDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
                          {analyticsData.categoryDistribution?.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'][index % 4]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>

              {/* Registration Timeline */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.06)', gridColumn: { xs: '1', md: '1 / span 2' } }}>
                <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Inter', fontWeight: 600 }}>Registration Timeline</Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={analyticsData.registrationTimeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Statistics;