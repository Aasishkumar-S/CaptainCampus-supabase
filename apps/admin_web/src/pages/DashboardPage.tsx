import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  Activity,
  CalendarClock,
  Clock,
  SatelliteDish,
  GraduationCap,
  Plus,
  Radio,
  Megaphone,
  ArrowRight,
  RotateCw,
  History,
  MapPin,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Mock weekly trip volume chart data (will receive real telemetry aggregation in Phase 6)
const weeklyTripData = [
  { day: 'Mon', trips: 48, onTime: 44, delayed: 4 },
  { day: 'Tue', trips: 52, onTime: 49, delayed: 3 },
  { day: 'Wed', trips: 50, onTime: 46, delayed: 4 },
  { day: 'Thu', trips: 54, onTime: 50, delayed: 4 },
  { day: 'Fri', trips: 56, onTime: 51, delayed: 5 },
  { day: 'Sat', trips: 22, onTime: 22, delayed: 0 },
  { day: 'Sun', trips: 14, onTime: 14, delayed: 0 },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useDashboard();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      if (dataUpdatedAt) {
        setSecondsAgo(Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000)));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatLogTime = (ts: string | number) => {
    if (!ts) return 'Just now';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const offlineDevices = data ? Math.max(0, data.gpsDevicesTotal - data.gpsDevicesOnline) : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner & Quick Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-800 dark:from-indigo-950 dark:to-slate-900 p-6 rounded-2xl text-white shadow-lg shadow-indigo-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Service Status: Fleet Active
            </span>
            <span className="text-xs text-indigo-200">
              {dataUpdatedAt ? `Last updated: ${secondsAgo}s ago` : 'Real-Time Sync'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Campus Transit Operations Command
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
            Real-time tracking telemetry and transit schedules overview across all campus sectors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RotateCw className={`w-4 h-4 text-indigo-500 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/live-map')}
            leftIcon={<Radio className="w-4 h-4 text-emerald-500" />}
          >
            Live Map Monitor
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/buses')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Bus
          </Button>
        </div>
      </div>

      {/* Stats Cards Row (6 key metrics connected to real data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Buses"
          value={data?.totalBuses ?? 0}
          icon={<Bus className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Buses"
          value={data?.activeBuses ?? 0}
          icon={<Activity className="w-5 h-5" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Trips"
          value={data?.activeTrips ?? 0}
          icon={<CalendarClock className="w-5 h-5" />}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Delayed Trips"
          value={data?.delayedTrips ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="GPS Offline"
          value={offlineDevices}
          icon={<SatelliteDish className="w-5 h-5" />}
          color="rose"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Drivers"
          value={data?.activeDrivers ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
      </div>

      {/* Primary Analytics & Fleet Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Weekly Trip Volume Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Weekly Trip Volume</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Completed campus shuttle runs over the past 7 days (Mock Telemetry)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" /> On Time
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Delayed
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTripData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="onTime" name="On Time" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Quick Actions & Operations Shortcut */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle>Fleet Quick Actions</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rapid administrative controls and dispatch shortcuts
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => navigate('/buses')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Add New Bus
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Register vehicle plate & capacity
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/trips')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Create Scheduled Trip
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Assign driver, bus & route timetable
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/announcements')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:border-amber-200 dark:hover:border-amber-800/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Post Announcement
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Broadcast push & banner notifications
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/live-map')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    View Live Fleet Map
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Interactive GPS geospatial tracking
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Lower Row: Summary Breakdown & Audit Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fleet & Infrastructure Breakdown (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Fleet & Route Operations Breakdown</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time snapshot across campus transit infrastructure
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/buses')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Manage Fleet
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500 dark:text-slate-400">Active Routes</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data?.activeRoutes ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {data?.totalRoutes ?? 0}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Currently Operating</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500 dark:text-slate-400">Bus Stops</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data?.totalStops ?? 0}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">Designated Terminals</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500 dark:text-slate-400">GPS Devices</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data?.gpsDevicesOnline ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {data?.gpsDevicesTotal ?? 0}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Telemetry Online</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="text-xs text-slate-500 dark:text-slate-400">Scheduled Trips</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {data?.scheduledTrips ?? 0}
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Awaiting Departure</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Audit Feed (1 col) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Audit Activity</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Security & system operation log
              </p>
            </div>
            <History className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No recent audit activity logged.
                </div>
              ) : (
                data.recentAuditLogs.slice(0, 5).map((act, index) => (
                  <div
                    key={act.id || act.logId || index}
                    className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800 last:border-none last:pb-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatActionName(act.action)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatLogTime(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {typeof act.details === 'string'
                          ? act.details
                          : act.details
                          ? JSON.stringify(act.details)
                          : 'Action executed'}
                      </p>
                      <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">
                        by {act.userName || act.userEmail || act.userId || 'System'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements Strip */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Broadcast Announcements</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active notices visible to students on mobile app
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/announcements')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Announcements
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!data?.recentAnnouncements || data.recentAnnouncements.length === 0) ? (
              <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
                No active announcements currently broadcast.
              </div>
            ) : (
              data.recentAnnouncements.slice(0, 4).map((ann, idx) => (
                <div
                  key={ann.id || ann.announcementId || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          ann.priority === 'urgent' || ann.priority === 'high'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {(ann.priority || 'NORMAL').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {ann.title}
                    </h4>
                    {ann.message && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ann.message}
                      </p>
                    )}
                  </div>
                  {ann.channels && ann.channels.length > 0 && (
                    <div className="text-xs text-slate-400 font-mono">
                      {ann.channels.join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default DashboardPage;
