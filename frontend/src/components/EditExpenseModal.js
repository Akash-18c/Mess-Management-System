import React from 'react';
import { X } from 'lucide-react';

const OTHER_CATS = ['Gas Cylinder', 'Rice Bag', 'Other'];

const modalGlass = {
  background: 'rgba(10,15,30,0.97)',
  backdropFilter: 'blur(48px)',
  WebkitBackdropFilter: 'blur(48px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
};

const inp = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  color: '#f1f5f9',
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};

export default function EditExpenseModal({ type, form, setForm, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden" style={modalGlass}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="font-bold text-white text-sm">
            ✏️ Edit {type === 'grocery' ? 'Grocery' : 'Expense'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">

          {type === 'grocery' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Item Name</label>
                  <input style={inp} value={form.item || ''} required
                    onChange={e => setForm(p => ({ ...p, item: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Unit Price (₹)</label>
                  <input style={inp} type="number" step="0.01" min="0" value={form.unitPrice || ''} required
                    onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
                  <input style={inp} type="number" step="0.01" min="0" value={form.quantity || ''}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Unit</label>
                  <input style={inp} placeholder="kg, pcs…" value={form.unit || ''}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Meal</label>
                  <select style={inp} value={form.meal || 'Lunch'}
                    onChange={e => setForm(p => ({ ...p, meal: e.target.value }))}>
                    <option value="Lunch">☀️ Lunch</option>
                    <option value="Dinner">🌙 Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                  <input style={inp} type="date" value={form.date || ''} required
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Buyer Name</label>
                <input style={inp} placeholder="Optional…" value={form.buyerName || ''}
                  onChange={e => setForm(p => ({ ...p, buyerName: e.target.value }))} />
              </div>
            </>
          )}

          {type === 'other' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                  <select style={inp} value={form.categoryName || 'Other'}
                    onChange={e => setForm(p => ({ ...p, categoryName: e.target.value }))}>
                    {OTHER_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Amount (₹)</label>
                  <input style={inp} type="number" step="0.01" min="0" value={form.amount || ''} required
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                  <input style={inp} type="date" value={form.date || ''} required
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Paid By</label>
                  <input style={inp} placeholder="Name…" value={form.paidBy || ''}
                    onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                  <select style={inp} value={form.status || 'Due'}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Due">⏳ Due</option>
                    <option value="Paid">✓ Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Description</label>
                  <input style={inp} placeholder="Optional…" value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#14b8a6,#0ea5e9)', border: 'none' }}>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
