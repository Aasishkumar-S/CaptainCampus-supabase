import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Bus,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useDashboard } from '../hooks/useDashboard';

// Mock Performance Analytics Dataset
const HOURLY_RIDERSHIP_DATA = [
  { hour: '07:00', passengers: 320, capacity: 500 },
  { hour: '08:00', passengers: 740, capacity: 800 },
  { hour: '09:00', passengers: 890, capacity: 900 },
  { hour: '10:00', passengers: 450, capacity: 700 },
  { hour: '11:00', passengers: 380, capacity: 600 },
  { hour: '12:00', passengers: 620, capacity: 750 },
  { hour: '13:00', passengers: 590, capacity: 750 },
  { hour: '14:00', passengers: 410, capacity: 600 },
  { hour: '15:00', passengers: 510, capacity: 700 },
  { hour: '16:00', passengers: 820, capacity: 900 },
  { hour: '17:00', passengers: 910, capacity: 950 },
  { hour: '18:00', passengers: 560, capacity: 700 },
];

const ON_TIME_PERFORMANCE = [
  { day: 'Mon', onTime: 94, delayed: 6 },
  { day: 'Tue', onTime: 91, delayed: 9 },
  { day: 'Wed', onTime: 96, delayed: 4 },
  { day: 'Thu', onTime: 88, delayed: 12 },
  { day: 'Fri', onTime: 92, delayed: 8 },
  { day: 'Sat', onTime: 98, delayed: 2 },
];

const ROUTE_DISTRIBUTION = [
  { name: 'Route R1 (Hostel Inbound)', value: 45, color: '#1565C0' },
  { name: 'Route R2 (Campus Circular)', value: 35, color: '#2E7D32' },
  { name: 'Route R3 (Academic Express)', value: 20, color: '#F57F17' },
];

export const ReportsPage: React.FC = () => {
  const { data: stats, isLoading } = useDashboard();
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>('week');

  const handleExport = (format: 'CSV' | 'PDF') => {
    alert(`Exporting Captain Campus transportation performance report (${format})...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transportation Reports & Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry analytics, route efficiency, on-time performance, and audit metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setSelectedRange('today')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedRange('week')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedRange('month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              This Month
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')} leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport('PDF')} leftIcon={<Download className="w-4 h-4" />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Fleet On-Time Rate</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">93.2%</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+2.4% vs last week</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Avg. Stop Wait Time</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">4.6 min</p>
              <p className="text-xs text-slate-400 mt-1">Target: &lt; 6.0 min</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Daily Campus Trips</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.activeTrips ? stats.activeTrips * 14 : 48}
              </p>
              <p className="text-xs text-slate-400 mt-1">All 3 active lines</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Bus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Stale GPS / Disconnects</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.delayedTrips || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Nominal connectivity</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly ridership volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Hourly Passenger Volume vs Fleet Capacity</span>
              <Badge variant="info">Peak: 09:00 &amp; 17:00</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_RIDERSHIP_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="passengers" name="Boarded Passengers" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" name="Available Seats" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Route ridership split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Route Volume Share</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ROUTE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ROUTE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-2">
              {ROUTE_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On-Time Performance Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">7-Day Punctuality Trend (% On-Time Arrivals)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ON_TIME_PERFORMANCE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'On-Time Rate']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="onTime"
                  name="On-Time Rate"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
