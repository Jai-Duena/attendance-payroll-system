import React, { useEffect, useState } from 'react';
import {
  Users, DollarSign, FileText, CheckCircle2,
  TrendingUp, Clock, AlertCircle, Building2,
} from 'lucide-react';
import { employeesApi, payrollApi, requestsApi, type PayrollBatch, type DeptSummary } from '@/lib/api';

interface ManagementContentProps {
  userId?: number;
  userName?: string;
}

const STATUS_BADGE: Record<string, string> = {
  'Draft':        'bg-gray-100 text-gray-600',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Approved':     'bg-blue-100 text-blue-700',
  'Released':     'bg-green-100 text-green-700',
  'Dropped':      'bg-red-100 text-red-600',
};

function fmt(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ManagementContent({ userName }: ManagementContentProps) {
  const [batches,    setBatches]    = useState<PayrollBatch[]>([]);
  const [empTotal,   setEmpTotal]   = useState<number | null>(null);
  const [deptMap,    setDeptMap]    = useState<Record<string, number>>({});
  const [reqSummary, setReqSummary] = useState<DeptSummary[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const p1 = payrollApi.getBatches()
      .then(r => setBatches(r.data ?? []))
      .catch(() => {});

    const p2 = employeesApi.list({ limit: 500, status: 'active' })
      .then(r => {
        const active = r.data.filter(e =>
          !['Resigned', 'Terminated'].includes(e.emp_emptype ?? '')
        );
        setEmpTotal(active.length);
        const map: Record<string, number> = {};
        active.forEach(e => {
          const dept = e.emp_dept || 'Unassigned';
          map[dept] = (map[dept] ?? 0) + 1;
        });
        setDeptMap(map);
      })
      .catch(() => {});

    const p3 = requestsApi.summary()
      .then(r => setReqSummary(r.departments ?? []))
      .catch(() => {});

    Promise.all([p1, p2, p3]).finally(() => setLoading(false));
  }, []);

  const recentBatches   = [...batches].sort((a, b) => b.batch_id - a.batch_id).slice(0, 6);
  const activeBatches   = batches.filter(b => !['Released', 'Dropped'].includes(b.status));
  const releasedBatches = batches.filter(b => b.status === 'Released');
  const pendingRequests = reqSummary.reduce((s, d) => s + d.pending, 0);

  const deptRows = Object.entries(deptMap)
    .map(([dept, count]) => {
      const rs = reqSummary.find(d => d.department === dept);
      return { dept, count, pending: rs?.pending ?? 0, total_req: rs?.total_requests ?? 0 };
    })
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse h-64" />
          <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} />
          <div>
            <p className="text-sm text-blue-100">Management Overview</p>
            <h2 className="text-xl font-bold">
              {userName ? `Welcome, ${userName}` : 'Executive Dashboard'}
            </h2>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Active Employees</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {empTotal ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{Object.keys(deptMap).length} departments</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center">
              <DollarSign size={18} className="text-yellow-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Active Payrolls</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{activeBatches.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeBatches.length > 0
              ? activeBatches.map(b => b.status).join(', ')
              : 'No active batches'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock size={18} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Pending Requests</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{pendingRequests}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Released Payrolls</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{releasedBatches.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {batches.length} total batches
          </p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Payroll Batches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Recent Payroll Batches</h3>
          </div>
          {recentBatches.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              <div className="text-center">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-40" />
                No payroll batches found
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBatches.map(batch => (
                <div key={batch.result_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {fmt(batch.payroll_start)} &ndash; {fmt(batch.payroll_end)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {batch.num_employees} employee{batch.num_employees !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`ml-3 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[batch.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {batch.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Headcount & Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Department Overview</h3>
          </div>
          {deptRows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              <div className="text-center">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-40" />
                No department data
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Department</span>
                <span className="text-center">Employees</span>
                <span className="text-right">Pending Req.</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {deptRows.map(row => (
                  <div key={row.dept} className="grid grid-cols-3 px-5 py-2.5 items-center hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700 truncate pr-2">{row.dept}</span>
                    <span className="text-sm font-semibold text-gray-800 text-center">{row.count}</span>
                    <span className="text-right">
                      {row.pending > 0 ? (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {row.pending}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Leave Requests by Department */}
      {reqSummary.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Leave & Request Summary by Department</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reqSummary
                  .sort((a, b) => b.total_requests - a.total_requests)
                  .slice(0, 10)
                  .map(dept => (
                    <tr key={dept.department} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5 text-gray-700">{dept.department}</td>
                      <td className="px-4 py-2.5 text-center">
                        {dept.pending > 0 ? (
                          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            {dept.pending}
                          </span>
                        ) : <span className="text-gray-400">0</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center text-green-600 font-medium">{dept.approved}</td>
                      <td className="px-4 py-2.5 text-center text-red-500 font-medium">{dept.rejected}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600 font-medium">{dept.total_requests}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
