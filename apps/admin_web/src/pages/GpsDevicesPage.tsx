import React, { useState } from 'react';
import {
  Satellite,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu,
  Hash,
  Bus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useBuses } from '../hooks/useBuses';

interface GpsDeviceItem {
  deviceId: string;
  deviceType: 'esp32' | 'simulator' | 'dedicated_tracker';
  assignedBusId?: string;
  busNumber?: string;
  status: 'online' | 'offline' | 'stale';
  lastSeenAgo: string;
  firmwareVersion: string;
  batteryLevel?: number;
}

const MOCK_GPS_DEVICES: GpsDeviceItem[] = [
  {
    deviceId: 'ESP32-GPS-UNIT-01',
    deviceType: 'esp32',
    assignedBusId: 'bus-cc-01',
    busNumber: 'CC-01',
    status: 'online',
    lastSeenAgo: '4s ago',
    firmwareVersion: 'v1.4.2-tinygps',
    batteryLevel: 94,
  },
  {
    deviceId: 'ESP32-GPS-UNIT-02',
    deviceType: 'esp32',
    assignedBusId: 'bus-cc-02',
    busNumber: 'CC-02',
    status: 'online',
    lastSeenAgo: '3s ago',
    firmwareVersion: 'v1.4.2-tinygps',
    batteryLevel: 88,
  },
  {
    deviceId: 'SIM-DEVICE-03',
    deviceType: 'simulator',
    assignedBusId: 'bus-cc-03',
    busNumber: 'CC-03',
    status: 'online',
    lastSeenAgo: '5s ago',
    firmwareVersion: 'sim-engine-v2',
  },
  {
    deviceId: 'ESP32-GPS-UNIT-04',
    deviceType: 'esp32',
    assignedBusId: 'bus-cc-04',
    busNumber: 'CC-04',
    status: 'stale',
    lastSeenAgo: '4m 12s ago',
    firmwareVersion: 'v1.3.9',
    batteryLevel: 42,
  },
];

export const GpsDevicesPage: React.FC = () => {
  const { data: buses = [] } = useBuses();
  const [devices, setDevices] = useState<GpsDeviceItem[]>(MOCK_GPS_DEVICES);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = devices.filter(
    (d) =>
      d.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.busNumber && d.busNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            GPS Device Hardware Registry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor physical ESP32 tracker modules, simulator daemons, heartbeat latencies, and bus assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => setDevices([...devices])}
          >
            Poll Heartbeats
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Register Hardware Device
          </Button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Online Units</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3</p>
              <p className="text-xs text-emerald-600 mt-1">Streaming every 5s</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Stale / High Latency</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1</p>
              <p className="text-xs text-amber-600 mt-1">&gt; 3 mins since last packet</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Firmware Standard</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">v1.4.2</p>
              <p className="text-xs text-slate-400 mt-1">TinyGPS++ / FreeRTOS</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Hardware Registry</span>
            <input
              type="text"
              placeholder="Search by device ID or bus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-64"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Device ID</th>
                  <th className="px-6 py-3">Hardware Type</th>
                  <th className="px-6 py-3">Assigned Vehicle</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Heartbeat</th>
                  <th className="px-6 py-3">Firmware</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((dev) => (
                  <tr key={dev.deviceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Satellite className="w-4 h-4 text-indigo-500" />
                      <span>{dev.deviceId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-600 dark:text-slate-300">
                        {dev.deviceType === 'esp32' ? 'ESP32 (Physical)' : 'Simulator Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dev.busNumber ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                          <Bus className="w-3.5 h-3.5" />
                          {dev.busNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={dev.status === 'online' ? 'success' : 'warning'}>
                        {dev.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{dev.lastSeenAgo}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{dev.firmwareVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
