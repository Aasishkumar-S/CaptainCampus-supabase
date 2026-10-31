import React, { useState } from 'react';
import {
  Settings,
  Save,
  MapPin,
  Clock,
  Key,
  Shield,
  Bell,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState('AIzaSyD-SampleCampusKey-2026-prod');
  const [etaWindowMinutes, setEtaWindowMinutes] = useState(15);
  const [walkingRadiusMeters, setWalkingRadiusMeters] = useState(800);
  const [staleThresholdSec, setStaleThresholdSec] = useState(180);
  const [enableFcm, setEnableFcm] = useState(true);
  const [enableDemoMode, setEnableDemoMode] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Transit system policies and parameters updated successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transportation System Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure Google Maps API key, missed-bus walking radius, ETA intervals, and telemetry thresholds.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>
          Save Settings
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mapping & Routing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <span>Google Maps Platform &amp; Routing Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Google Maps JavaScript API Key (Browser-Restricted)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => alert('Verifying API Key permissions on Google Cloud...')}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Used by Admin Web Live Map &amp; Routes editor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Missed-Bus Max Walking Radius (Meters)
                </label>
                <input
                  type="number"
                  value={walkingRadiusMeters}
                  onChange={(e) => setWalkingRadiusMeters(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">Default: 800m (~10 min walk)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Same-Stop Waiting Window (Minutes)
                </label>
                <input
                  type="number"
                  value={etaWindowMinutes}
                  onChange={(e) => setEtaWindowMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Threshold before alternative stop walking is recommended (Default: 15 min).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telemetry & GPS Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <span>GPS Telemetry &amp; Staleness Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stale GPS Alert Threshold (Seconds)
              </label>
              <input
                type="number"
                value={staleThresholdSec}
                onChange={(e) => setStaleThresholdSec(Number(e.target.value))}
                className="w-full md:w-64 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <p className="text-xs text-slate-400 mt-1">
                Marks vehicle as "GPS STALE" if no telemetry arrives within this window (Default: 180s).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span>Deployment &amp; Cloud Messaging Policies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Firebase Cloud Messaging (FCM) Multicast
                </p>
                <p className="text-xs text-slate-500">
                  Send high-priority push notifications to student devices when buses approach within 5 minutes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableFcm}
                onChange={(e) => setEnableFcm(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Demo &amp; Simulation Watermark
                </p>
                <p className="text-xs text-slate-500">
                  Clearly flag simulated live bus telemetry across student mobile and admin web interfaces.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableDemoMode}
                onChange={(e) => setEnableDemoMode(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
