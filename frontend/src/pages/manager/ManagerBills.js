import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, FileText } from 'lucide-react';
import api from '../../api';

const now = new Date();
const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : name; };

export default function ManagerBills() {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get(`/bills/${month}/${year}`).then(r => setBills(r.data)),
      api.get(`/summary/${month}/${year}`).then(r => setSummary(r.data)),
    ]);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const generateBills = async () => {
    setGenerating(true);
    try {
      await api.post(`/bills/generate/${month}/${year}`);
      toast.success('Bills generated successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating bills');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bills</h1>
          <p className="text-slate-400 text-sm">Generate and view member bills</p>
        </div>
        <button onClick={generateBills} disabled={generating} className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Generate Bills'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Meal Rate', value: `₹${summary?.mealRate?.toFixed(2) || '0.00'}`, color: 'text-green-400' },
          { label: 'Total Meals', value: summary?.totalMeals || 0, color: 'text-blue-400' },
          { label: 'Grand Total', value: `₹${summary?.grandTotal?.toFixed(2) || '0.00'}`, color: 'text-amber-400' },
          { label: 'Bills Generated', value: bills.length, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><FileText size={18} />Member Bills</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Member</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">B</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">L</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">D</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Total Meals</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Bill</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Advance</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-2.5 px-3">
                  <div>
                    <p className="text-white font-medium">{realName(b.memberId?.name)}</p>
                    <p className="text-slate-500 text-xs">Room {b.memberId?.room}</p>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 hidden sm:table-cell">{b.breakfastCount}</td>
                <td className="py-2.5 px-3 text-right text-slate-400 hidden sm:table-cell">{b.lunchCount}</td>
                <td className="py-2.5 px-3 text-right text-slate-400 hidden sm:table-cell">{b.dinnerCount}</td>
                <td className="py-2.5 px-3 text-right text-white">{b.mealCount}</td>
                <td className="py-2.5 px-3 text-right text-white font-medium">₹{b.totalBill?.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-green-400">₹{b.advance?.toFixed(2)}</td>
                <td className={`py-2.5 px-3 text-right font-semibold ${b.dueAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {b.dueAmount > 0 ? `₹${b.dueAmount.toFixed(2)}` : `Refund ₹${Math.abs(b.dueAmount).toFixed(2)}`}
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500">No bills yet. Click "Generate Bills" to calculate.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
