import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../../api';

const now = new Date();
const EMPTY = { memberId: '', amount: '', method: 'Cash', date: now.toISOString().slice(0, 10), note: '' };
const realName = (name) => { const m = name?.match(/^\w+\s*\((.+)\)$/); return m ? m[1] : name; };

export default function ManagerPayments() {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get(`/payments/${month}/${year}`).then(r => setPayments(r.data)),
      api.get('/members').then(r => setMembers(r.data)),
    ]);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payments', { ...form, amount: +form.amount, month, year });
      toast.success('Payment recorded');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Deleted');
    load();
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const methodColor = { Cash: 'text-green-400 bg-green-500/10', UPI: 'text-blue-400 bg-blue-500/10', Bank: 'text-purple-400 bg-purple-500/10' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-slate-400 text-sm">Record advance payments from members</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Record
        </button>
      </div>

      <div className="card border border-green-500/20">
        <p className="text-slate-400 text-sm mb-1">Total Advances Collected</p>
        <p className="text-2xl font-bold text-green-400">₹{total.toFixed(2)}</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Member</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Amount</th>
              <th className="text-center py-2 px-3 text-slate-400 font-medium">Method</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">Date</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium hidden md:table-cell">Note</th>
              <th className="text-right py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-2.5 px-3 text-white font-medium">{realName(p.memberId?.name)}</td>
                <td className="py-2.5 px-3 text-right text-green-400 font-semibold">₹{p.amount.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodColor[p.method] || 'text-slate-400 bg-slate-700'}`}>{p.method}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                <td className="py-2.5 px-3 text-slate-400 hidden md:table-cell">{p.note || '—'}</td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No payments recorded</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="font-semibold text-white">Record Payment</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Member</label>
                <select className="input" value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} required>
                  <option value="">Select member</option>
                  {members.map(m => <option key={m._id} value={m._id}>{realName(m.name)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input className="input" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select className="input" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                    <option>Cash</option><option>UPI</option><option>Bank</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Note</label>
                  <input className="input" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
