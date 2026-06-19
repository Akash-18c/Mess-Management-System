import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Pencil } from 'lucide-react';
import api from '../../api';

const now = new Date();
const EMPTY = { description: '', price: '', status: 'Due', date: now.toISOString().slice(0, 10) };

export default function ManagerRiceBag() {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    api.get(`/ricebag/${month}/${year}`).then(r => setEntries(r.data)).catch(() => {});
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (e) => { setForm({ description: e.description, price: e.price, status: e.status, date: e.date?.slice(0, 10) }); setEditId(e._id); setModal(true); };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/ricebag/${editId}`, { status: form.status, description: form.description });
        toast.success('Updated');
      } else {
        await api.post('/ricebag', { ...form, price: +form.price, month, year });
        toast.success('Rice bag entry added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await api.delete(`/ricebag/${id}`);
    toast.success('Deleted');
    load();
  };

  const total = entries.reduce((s, e) => s + e.price, 0);
  const due = entries.filter(e => e.status === 'Due').reduce((s, e) => s + e.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rice Bag</h1>
          <p className="text-slate-400 text-sm">Purchase records for this month</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
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
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Date</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Description</th>
              <th className="text-right py-2 px-3 text-slate-400 font-medium">Price</th>
              <th className="text-center py-2 px-3 text-slate-400 font-medium">Status</th>
              <th className="text-right py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="py-2.5 px-3 text-slate-300">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                <td className="py-2.5 px-3 text-white">{e.description || '—'}</td>
                <td className="py-2.5 px-3 text-right text-amber-400 font-medium">₹{e.price.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => deleteEntry(e._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><X size={14} /></button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No rice bag entries</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="font-semibold text-white">{editId ? 'Update Entry' : 'Add Rice Bag'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {!editId && (
                <>
                  <div>
                    <label className="label">Description</label>
                    <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. 25kg Sona Masoori" />
                  </div>
                  <div>
                    <label className="label">Price (₹)</label>
                    <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                </>
              )}
              {editId && (
                <div>
                  <label className="label">Description</label>
                  <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Due">Due</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
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
