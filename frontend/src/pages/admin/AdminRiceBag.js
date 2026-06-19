import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Pencil, X } from 'lucide-react';
import api from '../../api';

const now = new Date();

export default function AdminRiceBag() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState({ status: 'Due', description: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api.get(`/ricebag/${month}/${year}`).then(r => setEntries(r.data)).catch(() => {});
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (e) => { setEditEntry(e); setForm({ status: e.status, description: e.description }); };

  const handleUpdate = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      await api.put(`/ricebag/${editEntry._id}`, { status: form.status, description: form.description });
      toast.success('Updated');
      setEditEntry(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const total = entries.reduce((s, e) => s + e.price, 0);
  const due = entries.filter(e => e.status === 'Due').reduce((s, e) => s + e.price, 0);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Rice Bag</h1>
          <p className="text-slate-400 text-sm">View & update payment status</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-28" value={month} onChange={e => setMonth(+e.target.value)}>
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input className="input w-24" type="number" value={year} onChange={e => setYear(+e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card border border-amber-500/20">
          <p className="text-slate-400 text-xs mb-1">Total Entries</p>
          <p className="text-xl font-bold text-amber-400">{entries.length}</p>
        </div>
        <div className="card border border-green-500/20">
          <p className="text-slate-400 text-xs mb-1">Total Spent</p>
          <p className="text-xl font-bold text-green-400">₹{total.toFixed(2)}</p>
        </div>
        <div className="card border border-red-500/20">
          <p className="text-slate-400 text-xs mb-1">Due Amount</p>
          <p className="text-xl font-bold text-red-400">₹{due.toFixed(2)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Date</th>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Description</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Price</th>
              <th className="text-center py-2 px-3 font-medium" style={{ color: '#4a5a7a' }}>Status</th>
              <th className="text-left py-2 px-3 font-medium hidden sm:table-cell" style={{ color: '#4a5a7a' }}>Added By</th>
              <th className="text-right py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e._id} className="transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              >
                <td className="py-2.5 px-3 text-slate-300">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td className="py-2.5 px-3 text-white">{e.description || '—'}</td>
                <td className="py-2.5 px-3 text-right text-amber-400 font-medium">₹{e.price.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">{e.addedBy?.name || '—'}</td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No rice bag entries</td></tr>}
          </tbody>
        </table>
      </div>

      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1528 0%, #0a1020 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">Update Entry</h2>
              <button onClick={() => setEditEntry(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Due">Due</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditEntry(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
