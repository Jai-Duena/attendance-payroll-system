import { useState } from 'react';
import { X, Download, FileText, Calendar, Hash } from 'lucide-react';
import { payrollApi, type PayrollBatch } from '../../lib/api';

type Tab = 'sss_r3' | 'philhealth_rf1' | 'pagibig_mcr' | 'bir_1601c' | 'bir_2316';

interface Props {
  batches: PayrollBatch[];
  onClose: () => void;
}

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'sss_r3',         label: 'SSS R3',         description: 'SSS Contribution Collection List (R3)' },
  { id: 'philhealth_rf1', label: 'PhilHealth RF-1', description: 'PhilHealth Remittance Form (RF-1)' },
  { id: 'pagibig_mcr',    label: 'Pag-IBIG MCR',   description: 'Pag-IBIG Monthly Collection Report' },
  { id: 'bir_1601c',      label: 'BIR 1601-C',     description: 'Monthly Remittance Return of Creditable Income Tax' },
  { id: 'bir_2316',       label: 'BIR 2316',        description: 'Certificate of Compensation Payment / Tax Withheld' },
];

function fmtPeriod(b: PayrollBatch) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(b.payroll_start)} - ${fmt(b.payroll_end)}`;
}

export default function GovernmentReportsModal({ batches, onClose }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('sss_r3');
  const [batchId,   setBatchId]     = useState<number | ''>(batches[0]?.batch_id ?? '');
  const [month,     setMonth]       = useState('');
  const [year,      setYear]        = useState<number | ''>(new Date().getFullYear());
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState('');

  const isContrib = activeTab === 'sss_r3' || activeTab === 'philhealth_rf1' || activeTab === 'pagibig_mcr';
  const isBir1601 = activeTab === 'bir_1601c';
  const isBir2316 = activeTab === 'bir_2316';

  async function handleDownload() {
    setError('');
    try {
      setLoading(true);
      if (isContrib) {
        if (!batchId) { setError('Please select a payroll batch.'); return; }
        await payrollApi.downloadGovReport(activeTab as 'sss_r3' | 'philhealth_rf1' | 'pagibig_mcr', batchId as number);
      } else if (isBir1601) {
        if (!month) { setError('Please select a month.'); return; }
        await payrollApi.downloadBirReport('bir_1601c', { month });
      } else {
        if (!year) { setError('Please enter a year.'); return; }
        await payrollApi.downloadBirReport('bir_2316', { year: year as number });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Download failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Government Reports</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setError(''); }}
              className={
                'whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ' +
                (activeTab === t.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Description */}
          <p className="text-sm text-gray-600 mb-5">
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>

          {/* Contribution reports -- select batch */}
          {isContrib && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Hash className="inline w-4 h-4 mr-1 text-gray-400" />
                Payroll Batch
              </label>
              {batches.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payroll batches found.</p>
              ) : (
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      Batch #{b.batch_id} -- {fmtPeriod(b)} ({b.num_employees} employees)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-400">
                The report will include all employees processed under the selected payroll batch.
              </p>
            </div>
          )}

          {/* BIR 1601-C -- select month */}
          {isBir1601 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline w-4 h-4 mr-1 text-gray-400" />
                Return Period (Month)
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">
                All payroll batches whose period starts within this month will be aggregated.
              </p>
            </div>
          )}

          {/* BIR 2316 -- select year */}
          {isBir2316 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline w-4 h-4 mr-1 text-gray-400" />
                Calendar Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                min={2000}
                max={2100}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400">
                Annual totals for every employee who received compensation in this year.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
