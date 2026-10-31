import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Search,
  Mail,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useStops } from '../hooks/useStops';

interface StudentRosterItem {
  id: string;
  name: string;
  studentId: string;
  email: string;
  preferredStopName: string;
  preferredRouteCode: string;
  status: 'active' | 'suspended';
  notificationsEnabled: boolean;
}

const MOCK_STUDENTS: StudentRosterItem[] = [
  {
    id: 'stu-001',
    name: 'Aarav Sharma',
    studentId: 'STU-2026-081',
    email: 'aarav.sharma@campus.edu',
    preferredStopName: 'Main Gate',
    preferredRouteCode: 'R1',
    status: 'active',
    notificationsEnabled: true,
  },
  {
    id: 'stu-002',
    name: 'Diya Patel',
    studentId: 'STU-2026-104',
    email: 'diya.patel@campus.edu',
    preferredStopName: 'Admin Block',
    preferredRouteCode: 'R1',
    status: 'active',
    notificationsEnabled: true,
  },
  {
    id: 'stu-003',
    name: 'Kavya Nair',
    studentId: 'STU-2026-219',
    email: 'kavya.nair@campus.edu',
    preferredStopName: 'Library',
    preferredRouteCode: 'R1',
    status: 'active',
    notificationsEnabled: false,
  },
  {
    id: 'stu-004',
    name: 'Rohan Verma',
    studentId: 'STU-2026-302',
    email: 'rohan.verma@campus.edu',
    preferredStopName: 'Medical Centre',
    preferredRouteCode: 'R2',
    status: 'active',
    notificationsEnabled: true,
  },
  {
    id: 'stu-005',
    name: 'Ananya Iyer',
    studentId: 'STU-2026-440',
    email: 'ananya.iyer@campus.edu',
    preferredStopName: 'Academic Block A',
    preferredRouteCode: 'R3',
    status: 'active',
    notificationsEnabled: true,
  },
];

export const StudentsPage: React.FC = () => {
  const [students] = useState<StudentRosterItem[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student &amp; Passenger Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registered students, preferred boarding stops, notification subscriptions, and shuttle passes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => alert('Exporting student passenger directory (CSV)...')}
          >
            Export Directory
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Registered Passengers ({filtered.length})</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Roll / ID</th>
                  <th className="px-6 py-3">Preferred Boarding Stop</th>
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">FCM Alerts</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {stu.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{stu.name}</p>
                          <p className="text-xs text-slate-500">{stu.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold">{stu.studentId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{stu.preferredStopName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800">
                        {stu.preferredRouteCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {stu.notificationsEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Subscribed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Muted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">ACTIVE</Badge>
                    </td>
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
