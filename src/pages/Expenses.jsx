import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseModal } from '../components/modals/ExpenseModal';
import { ManagePayersModal } from '../components/modals/ManagePayersModal';
import { DocumentViewerModal } from '../components/modals/DocumentViewerModal';
import {
  Wallet,
  Plus,
  Users,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Edit,
  Trash2,
  ArrowRightLeft,
  PieChart,
  UserCheck,
} from 'lucide-react';

export const Expenses = () => {
  const {
    expenses = [],
    expensePayers = [],
    documents = [],
    deleteExpense,
    toggleReimbursementStatus,
    activeExpenseUser,
    setActiveExpenseUser,
    currentRole,
  } = useApp();

  const [activePayerTab, setActivePayerTab] = useState('all'); // 'all' | payer_id
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Settled' | 'Pending Reimbursement'

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showPayersModal, setShowPayersModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Safe arrays
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safePayers = Array.isArray(expensePayers) ? expensePayers : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Filtered Expenses
  const filteredExpenses = safeExpenses.filter((e) => {
    if (!e) return false;
    const matchesPayer = activePayerTab === 'all' || e.payer_id === activePayerTab;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.reimbursement_status === statusFilter;
    const desc = (e.description || '').toLowerCase();
    const payerName = (e.payer_name || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();

    const matchesSearch = desc.includes(search) || payerName.includes(search);

    return matchesPayer && matchesCategory && matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalOutlay = safeExpenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  const commonPoolSpend = safeExpenses
    .filter((e) => e && (e.payer_id === 'pyr-common' || (e.payer_name || '').includes('Common')))
    .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  const directorsOutlay = safeExpenses
    .filter((e) => e && (e.payer_name || '').includes('Director'))
    .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  const caretakerOutlay = safeExpenses
    .filter((e) => e && (e.payer_name || '').includes('Caretaker'))
    .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  const totalPendingReimbursements = safeExpenses
    .filter((e) => e && e.reimbursement_status === 'Pending Reimbursement')
    .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

  // Calculate Reimbursement Balances per Payer (Out-of-pocket owed)
  const reimbursementBreakdown = safePayers
    .filter((p) => p && p.id !== 'pyr-common')
    .map((p) => {
      const pendingAmount = safeExpenses
        .filter((e) => e && e.payer_id === p.id && e.reimbursement_status === 'Pending Reimbursement')
        .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
      return { payer: p, pendingAmount };
    })
    .filter((item) => item && item.payer && item.pendingAmount > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Expense Tracker & Settlement Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track outlays across 5 Directors, Caretaker & Shared Homestay accounts with receipt uploads and reimbursement balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Operating User Selector */}
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5 whitespace-nowrap">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active User:
            </span>
            <select
              value={activeExpenseUser ? activeExpenseUser.id : ''}
              onChange={(e) => {
                const found = safePayers.find((p) => p && p.id === e.target.value);
                if (found) setActiveExpenseUser(found);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
            >
              {safePayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.group_tag})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
          </button>
          <button
            onClick={() => setShowPayersModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            Manage Accounts
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Outlay Logged</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              ₹{totalOutlay.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <PieChart className="w-3 h-3" /> All accounts combined
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Common Pool Outlay</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              ₹{commonPoolSpend.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-sky-400 mt-1">Direct Homestay Account</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Directors Out-of-Pocket</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              ₹{directorsOutlay.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-teal-400 mt-1">5 Directors aggregate</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Reimbursements</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              ₹{totalPendingReimbursements.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Due back to payers
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Settlement Balance Summary Alert Card */}
      {reimbursementBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Out-Of-Pocket Reimbursements Owed By Homestay
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {reimbursementBreakdown.map((item) => {
              if (!item || !item.payer) return null;
              return (
                <div
                  key={item.payer.id || Math.random()}
                  className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{item.payer.name || 'Account'}</span>
                    <span className="text-[10px] text-slate-400">{item.payer.group_tag || 'User'}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{(item.pendingAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Payer Account Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => setActivePayerTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activePayerTab === 'all'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <span>All Accounts</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
            {safeExpenses.length}
          </span>
        </button>

        {safePayers.map((p) => {
          if (!p) return null;
          const count = safeExpenses.filter((e) => e && e.payer_id === p.id).length;
          const isActive = activePayerTab === p.id;
          return (
            <button
              key={p.id || Math.random()}
              onClick={() => setActivePayerTab(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>{p.name || 'Account'}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls: Search, Category Filter & Status Filter */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description or payer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Utilities">Utilities</option>
              <option value="Maintenance">Maintenance & Repairs</option>
              <option value="Staff Wages">Caretaker Wages</option>
              <option value="Guest Amenities">Guest Amenities</option>
              <option value="Food & Kitchen">Food & Kitchen</option>
              <option value="Govt Taxes">Govt Taxes</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Settled">Settled</option>
              <option value="Pending Reimbursement">Pending Reimbursement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Data Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Paid By</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount (₹)</th>
                <th className="p-4">Reimbursement Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No expense records found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const receiptDoc = safeDocs.find((d) => d && d.guest_id === `exp-${exp.id}`);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-100 block">{exp.payer_name}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-950 text-slate-300 border border-slate-800 whitespace-nowrap">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200 font-medium">
                        {exp.description}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {exp.payment_method || 'UPI'}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleReimbursementStatus(exp.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                            exp.reimbursement_status === 'Pending Reimbursement'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Click to toggle reimbursement status"
                        >
                          {exp.reimbursement_status === 'Pending Reimbursement' ? (
                            <>
                              <AlertCircle className="w-3 h-3" /> Due Reimbursement
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Settled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {receiptDoc && (
                            <button
                              onClick={() => setPreviewDoc(receiptDoc)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 transition-colors"
                              title="View Attached Receipt Scan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setShowExpenseModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="Edit Expense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => deleteExpense(exp.id, activeExpenseUser)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title={`Delete Expense (Only ${exp.payer_name} can delete)`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenseToEdit={editingExpense}
      />

      {/* Manage Payers Modal */}
      <ManagePayersModal
        isOpen={showPayersModal}
        onClose={() => setShowPayersModal(false)}
      />

      {/* Receipt Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
    </div>
  );
};
