import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { AadhaarScannerModal } from './AadhaarScannerModal';
import { Upload, FileText, CheckCircle2, AlertCircle, Camera, ShieldCheck } from 'lucide-react';

export const DocumentUploadModal = ({ isOpen, onClose, defaultGuestId = '' }) => {
  const { guests, addDocument, showToast } = useApp();
  const [selectedGuestId, setSelectedGuestId] = useState(defaultGuestId || guests[0]?.id || '');
  const [docType, setDocType] = useState('Passport');
  const [simulatedFile, setSimulatedFile] = useState(null);
  const [showAadhaarScanner, setShowAadhaarScanner] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File exceeds 5 MB limit!', 'error');
        return;
      }
      file.preview_url = URL.createObjectURL(file);
      setSimulatedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGuestId) {
      showToast('Please select a guest', 'warning');
      return;
    }
    const guest = guests.find((g) => g.id === selectedGuestId);
    const fileName = simulatedFile
      ? simulatedFile.name
      : `${guest?.full_name?.toLowerCase().replace(/\s+/g, '_')}_${docType.toLowerCase()}.pdf`;

    addDocument({
      guest_id: selectedGuestId,
      guest_name: guest ? guest.full_name : 'Guest',
      file_name: fileName,
      file_path: `guest-documents/${selectedGuestId}/${Date.now()}_${fileName}`,
      file_type: simulatedFile ? simulatedFile.type : 'image/jpeg',
      file_size: simulatedFile ? `${(simulatedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB',
      preview_url: simulatedFile ? simulatedFile.preview_url : null,
      rawFile: simulatedFile || null,
    });

    setSimulatedFile(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Upload Guest ID Document">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Aadhaar Scanner Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Scan Physical Card QR
                  <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Offline Validation
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Validates UIDAI authenticity signature and auto-classifies proof
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAadhaarScanner(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>
          </div>

          {/* Select Guest */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Guest Record *
            </label>
          <select
            value={selectedGuestId}
            onChange={(e) => setSelectedGuestId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.full_name} ({g.id_document_type}: {g.id_document_number})
              </option>
            ))}
          </select>
        </div>

        {/* Document Classification */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Document Category *
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="Passport">Passport Scan / Photo</option>
            <option value="Aadhaar">Aadhaar Card (Front & Back)</option>
            <option value="Visa">Visa Entry Document</option>
            <option value="Driver License">Driver's License</option>
            <option value="Voter ID">Voter ID Card</option>
            <option value="Other">Other Verified Document</option>
          </select>
        </div>

        {/* Drag & Drop File Box */}
        <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors group cursor-pointer">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            {simulatedFile ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected: {simulatedFile.name} ({(simulatedFile.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-200">
                  Click or drag file here to attach
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported: PDF, JPG, PNG (Max file size: 5 MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Compliance Note */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Documents are encrypted and stored in private Supabase Storage bucket <code>guest-documents</code> accessible only to staff.
          </span>
        </div>

        {/* Buttons */}
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <FileText className="w-4 h-4" />
            Upload Document & Attach
          </button>
        </div>
      </form>
    </Modal>

    {/* Aadhaar Scanner Modal */}
    <AadhaarScannerModal
      isOpen={showAadhaarScanner}
      onClose={() => setShowAadhaarScanner(false)}
      onAutoFill={(decoded) => {
        setDocType('Aadhaar');
        // If guest matches by name, auto-select them
        const matchingGuest = guests.find(
          (g) => g.full_name.toLowerCase().includes(decoded.fullName.toLowerCase()) ||
                 decoded.fullName.toLowerCase().includes(g.full_name.toLowerCase())
        );
        if (matchingGuest) {
          setSelectedGuestId(matchingGuest.id);
        }
        showToast(`Aadhaar verified (${decoded.maskedId})! Auto-selected Aadhaar category.`, 'success');
      }}
    />
  </>
  );
};
