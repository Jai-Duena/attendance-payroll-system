import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Link,
  Unlink,
  Clock,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  biometricApi,
  type BioStatus,
  type BioUser,
} from '@/lib/api';

type Tab = 'monitor' | 'users';

const fmt = (dt: string | null | undefined) => {
  if (!dt) return '--';
  const d = new Date(dt.replace(' ', 'T'));
  return isNaN(d.getTime()) ? dt : d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'success') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={12} /> Success
    </span>
  );
  if (status === 'error') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle size={12} /> Error
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <AlertTriangle size={12} /> Warning
    </span>
  );
};

// ── Monitor Tab ────────────────────────────────────────────────────────────────
function MonitorTab({ status, onRefresh }: { status: BioStatus | null; onRefresh: () => void }) {
  const last = status?.last_sync;
  const deviceUp = last ? (new Date().getTime() - new Date(last.created_at.replace(' ', 'T')).getTime()) < 5 * 60 * 1000 : false;

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
            <Database size={14} /> Total Punches
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {status?.stats.total_punches.toLocaleString() ?? '--'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
            <Users size={14} /> Device Users
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {status?.stats.total_bio_users ?? '--'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
            <Unlink size={14} /> Unmapped
          </div>
          <div className={`text-2xl font-bold ${(status?.stats.unmapped_users ?? 0) > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
            {status?.stats.unmapped_users ?? '--'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
            {deviceUp ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-gray-400" />}
            Script Status
          </div>
          {last ? (
            <StatusBadge status={last.status} />
          ) : (
            <span className="text-sm text-gray-400">Never run</span>
          )}
        </div>
      </div>

      {/* Last sync summary */}
      {last && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} /> Last Sync
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Status</div>
              <StatusBadge status={last.status} />
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Time</div>
              <div className="font-medium">{fmt(last.created_at)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Users Synced</div>
              <div className="font-medium">{last.users_synced}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">New Punches</div>
              <div className="font-medium">{last.punches_synced}</div>
            </div>
          </div>
          {last.message && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono break-words">
              {last.message}
            </div>
          )}
        </div>
      )}

      {/* Sync managed by standalone app notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-700">
        <Activity size={16} className="mt-0.5 shrink-0" />
        <span>
          Sync is managed by the <strong>FCH Bio Sync</strong> desktop application running on the server.
          Use that app to trigger manual syncs, change settings, or adjust the sync interval.
        </span>
      </div>

      {/* Recent logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={16} /> Recent Runs (last 20)
          </h3>
          <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Time</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Users</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Punches</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(status?.recent_logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No sync runs recorded yet.
                  </td>
                </tr>
              ) : (status?.recent_logs ?? []).map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{fmt(log.created_at)}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{log.users_synced}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{log.punches_synced}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs max-w-xs truncate">{log.message ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab (read-only) ──────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState<BioUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await biometricApi.getUsers();
      setUsers(r.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const privilegeLabel = (p: number) => {
    const map: Record<number, string> = { 0: 'User', 2: 'Enroller', 6: 'Manager', 14: 'Admin' };
    return map[p] ?? `Level ${p}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>User Mapping:</strong> Device users are linked to employees automatically when the device User ID matches
        the employee ID. To edit mappings, use the <strong>FCH Bio Sync</strong> desktop application on the server.
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" /> Loading...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">UID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Device User ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Name on Device</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Privilege</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Mapped Employee</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No device users found. Run a sync from the desktop app first.
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{u.uid}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{u.device_user_id}</td>
                    <td className="px-4 py-3 text-gray-700">{u.name || <span className="text-gray-400 italic">no name</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{privilegeLabel(u.privilege)}</td>
                    <td className="px-4 py-3">
                      {u.employee_id ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <Link size={13} />
                          <span>#{u.employee_id}</span>
                          {u.emp_fullname && <span className="text-gray-500">-- {u.emp_fullname}</span>}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                          <Unlink size={13} /> Not mapped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(u.last_synced_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BiometricPage() {
  const [activeTab, setActiveTab] = useState<Tab>('monitor');
  const [status, setStatus]       = useState<BioStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await biometricApi.getStatus();
      setStatus(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'monitor', label: 'Monitor',      icon: <Activity size={16} /> },
    { key: 'users',   label: 'User Mapping', icon: <Users size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wifi size={24} className="text-blue-500" />
            Biometric Device
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ZKTeco 3969 -- {status?.settings?.device_ip ?? '...'}:{status?.settings?.device_port ?? '...'}
          </p>
        </div>
        {loading && <Loader2 size={20} className="animate-spin text-gray-400" />}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <XCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'monitor' && <MonitorTab status={status} onRefresh={loadStatus} />}
      {activeTab === 'users'   && <UsersTab />}
    </div>
  );
}
