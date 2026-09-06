import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from './DocumentViewerModal';
import {
  DollarSign,
  Calendar,
  User,
  Tag,
  CreditCard,
  FileText,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

export const ExpenseModal = ({ isOpen, onClose, expenseToEdit = null }) => {
  const { expensePayers = [], addExpense, updateExpense, documents, addDocument, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    expense_date: todayStr,
    payer_id: '',
    payer_name: '',
    category: 'Utilities',
    amount: '',
    payment_method: 'UPI',
    description: '',
    reimbursement_status: 'Settled',
  });

  const [stagedFiles, setStagedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    setStagedFiles([]);
    if (expenseToEdit) {
      setFormData({
        expense_date: expenseToEdit.expense_date || todayStr,
        payer_id: expenseToEdit.payer_id || '',
        payer_name: expenseToEdit.payer_name || '',
        category: expenseToEdit.category || 'Utilities',
        amount: expenseToEdit.amount || '',
        payment_method: expenseToEdit.payment_method || 'UPI',
        description: expenseToEdit.description || '',
        reimbursement_status: expenseToEdit.reimbursement_status || 'Settled',
      });
    } else {
      const defaultPayer = expensePayers[0] || { id: '', name: '' };
      setFormData({
        expense_date: todayStr,
        payer_id: defaultPayer.id,
        payer_name: defaultPayer.name,
        category: 'Utilities',
        amount: '',
        payment_method: 'UPI',
        description: '',
        reimbursement_status: 'Settled',
      });
    }
  }, [expenseToEdit, isOpen, expensePayers]);

  const handlePayerChange = (e) => {
    const pId = e.target.value;
    const selected = expensePayers.find((p) => p.id === pId);
    setFormData((prev) => ({
      ...prev,
      payer_id: pId,
      payer_name: selected ? selected.name : '',
    }));
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = [];
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 5 MB limit!`, 'error');
      } else {
        const previewUrl = URL.createObjectURL(file);
        validFiles.push({
          id: `staged-exp-${Date.now()}-${Math.random()}`,
          file_name: file.name,
          file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          file_type: file.type || 'image/jpeg',
          preview_url: previewUrl,
          rawFile: file,
        });
      }
    });

    if (validFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validFiles]);
      showToast(`Attached ${validFiles.length} receipt/bill file(s)`, 'info');
    }
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Attached bill scan removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Please enter a valid expense amount!', 'warning');
      return;
    }

    let savedExpense = null;
    if (expenseToEdit) {
      await updateExpense(expenseToEdit.id, {
        ...formData,
        amount: Number(formData.amount),
      });
      savedExpense = { id: expenseToEdit.id, ...formData };
    } else {
      savedExpense = await addExpense({
        ...formData,
        amount: Number(formData.amount),
      });
    }

    // Attach receipt files to documents archive if provided
    if (stagedFiles.length > 0) {
      stagedFiles.forEach((stg) => {
        addDocument({
          guest_id: `exp-${savedExpense.id}`,
          guest_name: `Receipt: ${formData.payer_name} (₹${formData.amount})`,
          file_name: stg.file_name,
          file_path: `expense-receipts/${savedExpense.id}/${Date.now()}_${stg.file_name}`,
          file_type: stg.file_type,
          file_size: stg.file_size,
          preview_url: stg.preview_url,
          rawFile: stg.rawFile,
        });
      });
    }

    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={expenseToEdit ? 'Edit Expense Record' : 'Log New Homestay Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Payer Account & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Paid By / Payer Account *
              </label>
              <select
                required
                value={formData.payer_id}
                onChange={handlePayerChange}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Payer / User Account --</option>
                {expensePayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.group_tag})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 2500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Expense Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Utilities">Utilities (KSEB, Water, Wi-Fi)</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Staff Wages">Caretaker & Staff Wages</option>
                <option value="Guest Amenities">Guest Amenities & Supplies</option>
                <option value="Food & Kitchen">Food & Kitchen Expenses</option>
                <option value="Govt Taxes">Govt Taxes & Licences</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          {/* Payment Method & Reimbursement Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI Payment</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Credit / Debit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Settlement / Reimbursement Status
              </label>
              <select
                value={formData.reimbursement_status}
                onChange={(e) => setFormData({ ...formData, reimbursement_status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Settled">Settled (Paid directly by account/common pool)</option>
                <option value="Pending Reimbursement">Pending Reimbursement (Due to Payer)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Description & Purpose *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Purchased extra campfire wood supply and pool cleaning chemicals..."
              className="w-full h-16 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bill / Receipt Scan Attachment Zone */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                Attach Bill / Receipt Proof (Optional)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {stagedFiles.length} File(s)
              </span>
            </div>

            <div className="relative border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-900/60 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleMultipleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300">
                  Click or drag invoice bill scans (PDF, JPG, PNG)
                </span>
              </div>
            </div>

            {stagedFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {stagedFiles.map((stg) => (
                  <div
                    key={stg.id}
                    className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs"
                  >
                    <span className="truncate font-medium text-slate-200">{stg.file_name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(stg)}
                        className="p-1 text-slate-400 hover:text-emerald-400"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStagedFile(stg.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {expenseToEdit ? 'Save Changes' : 'Save Expense Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
    </>
  );
};
