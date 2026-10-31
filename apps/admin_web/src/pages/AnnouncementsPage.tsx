import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Send,
  AlertTriangle,
  Info,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { apiClient } from '../lib/api';
import type { Announcement, ApiResponse } from '@captain-campus/shared_types';

export const AnnouncementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Announcement[]>>('/announcements');
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Announcement>) => {
      return await apiClient.post<ApiResponse<Announcement>>('/admin/announcements', payload);
    },
    onSuccess: () => {
      showToast('Announcement broadcasted and push notifications sent!', 'success');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsCreating(false);
      setTitle('');
      setMessage('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create announcement', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Please provide both title and message', 'error');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      severity,
      affectedRouteIds: selectedRoute === 'all' ? [] : [selectedRoute],
      status: 'published',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campus Transit Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Publish real-time schedule alerts, detour warnings, and route-targeted FCM push notifications.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-indigo-200 dark:border-indigo-900 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              <span>Draft &amp; Broadcast Announcement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Express Route R3 Traffic Delay"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="info">Info (Blue Notice)</option>
                    <option value="warning">Warning (Amber Alert)</option>
                    <option value="critical">Critical (Red Emergency)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Route Audience
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="all">All Campus Shuttles (General)</option>
                    <option value="route-r1">Route R1 - Main Gate to Hostel</option>
                    <option value="route-r2">Route R2 - Campus Circular</option>
                    <option value="route-r3">Route R3 - Express Gate to Academic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Explain the service disruption, expected delay duration, and recommended alternative stops..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<Send className="w-4 h-4" />}
                  isLoading={createMutation.isPending}
                >
                  Broadcast &amp; Send Push
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              <Megaphone className="w-12 h-12 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No active announcements</p>
              <p className="text-xs text-slate-400 mt-1">Broadcasted messages to student mobile apps will show here.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((item) => {
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';

            return (
              <Card key={item.announcementId} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCritical
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'
                        : isWarning
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-950/50'
                    }`}
                  >
                    {isCritical ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <Badge variant={isCritical ? 'danger' : isWarning ? 'warning' : 'info'}>
                        {item.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.affectedRouteIds && item.affectedRouteIds.length > 0 ? (
                        <span>Target: {item.affectedRouteIds.join(', ').toUpperCase()}</span>
                      ) : (
                        <span>Target: Entire Campus</span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        FCM Push Dispatched
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
