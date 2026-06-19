import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../api';

const DEFAULTS = ['Rice Bag', 'Gas Cylinder', 'Fuel', 'Utensils', 'Maintenance', 'Miscellaneous', 'Internet', 'Water', 'Electricity'];

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'other' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/admin/categories').then(r => setCats(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', form);
        toast.success('Category added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this category?')) return;
    await api.delete(`/admin/categories/${id}`);
    toast.success('Category removed');
    load();
  };

  const seedDefaults = async () => {
    for (const name of DEFAULTS) {
      try { await api.post('/admin/categories', { name, type: 'other' }); } catch {}
    }
    toast.success('Default categories added');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expense Categories</h1>
          <p className="text-slate-400 text-sm">Manage expense categories for managers</p>
        </div>
        <div className="flex gap-2">
          {cats.length === 0 && (
            <button onClick={seedDefaults} className="btn-secondary text-sm">Seed Defaults</button>
          )}
          <button onClick={() => { setEditing(null); setForm({ name: '', type: 'other' }); setModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cats.map(c => (
          <div key={c._id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">
                {c.name[0]}
              </div>
              <div>
                <p className="text-white font-medium">{c.name}</p>
                <span className={`text-xs ${c.type === 'grocery' ? 'text-green-400' : 'text-amber-400'}`}>{c.type}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(c._id); setForm({ name: c.name, type: c.type }); setModal(true); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {cats.length === 0 && (
          <div className="col-span-3 py-12 text-center text-slate-500">No categories yet. Click "Seed Defaults" to add common ones.</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1528 0%, #0a1020 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-semibold text-white">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="other">Other (Non-food)</option>
                  <option value="grocery">Grocery</option>
                </select>
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
