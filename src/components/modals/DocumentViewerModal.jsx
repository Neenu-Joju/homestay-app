import React from 'react';
import { Modal } from '../common/Modal';
import { FileText, Download, ShieldCheck } from 'lucide-react';

export const DocumentViewerModal = ({ isOpen, onClose, doc }) => {
  if (!doc) return null;

  const isPdf = doc.file_name?.endsWith('.pdf') || doc.file_type === 'application/pdf';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Preview: ${doc.file_name}`}>
      <div className="space-y-4">
        {/* Metadata Header */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">{doc.file_name}</p>
              <p className="text-[11px] text-slate-400">
                Size: <strong className="text-slate-200">{doc.file_size || '1.5 MB'}</strong> | Format:{' '}
                <span className="uppercase text-emerald-400">{isPdf ? 'PDF Document' : 'Image Scan'}</span>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified ID
          </span>
        </div>

        {/* Visual Document Preview Frame */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
          {/* Mock document watermarked background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-950 flex items-center justify-center opacity-40 pointer-events-none">
            <span className="text-4xl font-black text-slate-700 tracking-widest uppercase rotate-[-15deg]">
              OFFICIAL ID PROOF
            </span>
          </div>

          <div className="relative z-10 space-y-3 max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">{doc.guest_name ? `${doc.guest_name}'s Identification` : doc.file_name}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Government Verified ID Attachment stored securely in <code>guest-documents</code> bucket.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => alert(`Simulating downloading ${doc.file_name}`)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download File
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
};
