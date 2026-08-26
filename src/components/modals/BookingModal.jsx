import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DocumentViewerModal } from './DocumentViewerModal';
import {
  Calendar,
  User,
  BedDouble,
  FileText,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  Zap,
  Phone,
  UserPlus,
  CreditCard,
  Globe,
  MapPin,
  Mail,
  CheckCircle2,
  LogIn,
} from 'lucide-react';

export const BookingModal = ({ isOpen, onClose }) => {
  const { guests, rooms, documents, addGuest, addBooking, addDocument, deleteDocument, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Tab Mode: 'quick' (Name & Mobile only) | 'detailed' (Detailed Booking & Instant Check-In)
  const [bookingTab, setBookingTab] = useState('quick');

  // Detailed Tab Guest Source: 'new' (Walk-in guest) | 'existing' (Registered guest)
  const [guestSource, setGuestSource] = useState('new');

  // Quick Booking State
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Detailed Booking Guest State
  const [detailedGuest, setDetailedGuest] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    nationality: 'Indian',
    id_document_type: 'Aadhaar',
    id_document_number: '',
  });

  // Existing Guest Selection
  const [selectedGuestId, setSelectedGuestId] = useState(guests[0]?.id || '');

  // Stay & Reservation State
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [numGuests, setNumGuests] = useState(2);
  const [initialStatus, setInitialStatus] = useState('Checked In'); // Default to Instant Check-In for Detailed mode
  const [notes, setNotes] = useState('');

  // Staged documents attached inside Booking modal
  const [stagedFiles, setStagedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Existing documents for selected guest
  const existingGuestDocs = guestSource === 'existing' ? documents.filter((d) => d.guest_id === selectedGuestId) : [];

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
          id: `staged-bkg-${Date.now()}-${Math.random()}`,
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
      showToast(`Attached ${validFiles.length} photo/file(s) to booking`, 'info');
    }
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Attached file removed', 'info');
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      const msg = 'Check-out date must be strictly after Check-in date!';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    let targetGuestId = '';
    let targetGuestName = '';

    if (bookingTab === 'quick') {
      // --- TAB 1: QUICK BOOKING ---
      if (!quickName.trim() || !quickPhone.trim()) {
        const msg = 'Please enter both Guest Name and Mobile Number!';
        setErrorMsg(msg);
        showToast(msg, 'warning');
        return;
      }

      const createdGuest = await addGuest({
        full_name: quickName.trim(),
        phone: quickPhone.trim(),
        nationality: 'Indian',
        id_document_type: 'Pending',
        id_document_number: 'Pending Check-In',
        notes: 'Quick advance reservation. Complete ID details during check-in.',
      });

      if (createdGuest) {
        targetGuestId = createdGuest.id;
        targetGuestName = createdGuest.full_name;
      }
    } else {
      // --- TAB 2: DETAILED BOOKING & INSTANT CHECK-IN ---
      if (guestSource === 'new') {
        if (!detailedGuest.full_name.trim() || !detailedGuest.phone.trim()) {
          const msg = 'Please enter Guest Full Name and Phone Number!';
          setErrorMsg(msg);
          showToast(msg, 'warning');
          return;
        }

        const createdGuest = await addGuest({
          full_name: detailedGuest.full_name.trim(),
          phone: detailedGuest.phone.trim(),
          email: detailedGuest.email,
          address: detailedGuest.address,
          nationality: detailedGuest.nationality || 'Indian',
          id_document_type: detailedGuest.id_document_type || 'Aadhaar',
          id_document_number: detailedGuest.id_document_number || 'Provided',
          notes: notes,
        });

        if (createdGuest) {
          targetGuestId = createdGuest.id;
          targetGuestName = createdGuest.full_name;
        }
      } else {
        if (!selectedGuestId) {
          const msg = 'Please select an existing guest record!';
          setErrorMsg(msg);
          showToast(msg, 'warning');
          return;
        }
        targetGuestId = selectedGuestId;
        const existing = guests.find((g) => g.id === selectedGuestId);
        targetGuestName = existing ? existing.full_name : 'Guest';
      }
    }

    const bookingStatusToUse = bookingTab === 'quick' ? 'Confirmed' : initialStatus;

    const success = await addBooking({
      guest_id: targetGuestId,
      guest_name: targetGuestName,
      room_id: roomId,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      num_guests: parseInt(numGuests, 10),
      booking_status: bookingStatusToUse,
      notes: notes,
    });

    if (!success) {
      setErrorMsg('Double Booking Blocked: This Cottage is already reserved for selected dates!');
      return;
    }

    if (success) {
      // Upload any attached ID proof documents to Supabase Storage & Documents archive
      if (targetGuestId && stagedFiles.length > 0) {
        stagedFiles.forEach((stg) => {
          addDocument({
            guest_id: targetGuestId,
            guest_name: targetGuestName,
            file_name: stg.file_name,
            file_path: `guest-documents/${targetGuestId}/${Date.now()}_${stg.file_name}`,
            file_type: stg.file_type,
            file_size: stg.file_size,
            preview_url: stg.preview_url,
            rawFile: stg.rawFile,
          });
        });
      }

      // Reset form states
      setQuickName('');
      setQuickPhone('');
      setDetailedGuest({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        nationality: 'Indian',
        id_document_type: 'Aadhaar',
        id_document_number: '',
      });
      setStagedFiles([]);
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create Cottage Reservation">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Main Workflow Tabs */}
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBookingTab('quick')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                bookingTab === 'quick'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Booking (Name & Mobile Only)
            </button>
            <button
              type="button"
              onClick={() => setBookingTab('detailed')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                bookingTab === 'detailed'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Detailed Booking & Instant Check-In
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: QUICK BOOKING (ADVANCE / MINIMAL DETAILS) */}
          {/* ========================================================= */}
          {bookingTab === 'quick' ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Advance Reservation (ID proof captured later at Check-In)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                  Fast Phone Booking
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required={bookingTab === 'quick'}
                    placeholder="e.g. Mathew Varghese"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Mobile / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required={bookingTab === 'quick'}
                    placeholder="e.g. +91 98470 55555"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* TAB 2: DETAILED BOOKING & INSTANT CHECK-IN (WALK-INS) */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Guest Source Switcher: New Walk-in vs Existing Directory */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    Select Guest Entry Method:
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-semibold">
                      <input
                        type="radio"
                        name="guestSource"
                        value="new"
                        checked={guestSource === 'new'}
                        onChange={() => setGuestSource('new')}
                        className="accent-emerald-500"
                      />
                      <span>New Walk-In Guest</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="guestSource"
                        value="existing"
                        checked={guestSource === 'existing'}
                        onChange={() => setGuestSource('existing')}
                        className="accent-emerald-500"
                      />
                      <span>Existing Guest Directory</span>
                    </label>
                  </div>
                </div>

                {guestSource === 'new' ? (
                  /* Full Walk-In Guest Fields */
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-400" /> Full Name *
                        </label>
                        <input
                          type="text"
                          required={bookingTab === 'detailed' && guestSource === 'new'}
                          placeholder="e.g. Ramesh Nair"
                          value={detailedGuest.full_name}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, full_name: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required={bookingTab === 'detailed' && guestSource === 'new'}
                          placeholder="e.g. +91 98470 00000"
                          value={detailedGuest.phone}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, phone: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="guest@example.com"
                          value={detailedGuest.email}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, email: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" /> Nationality
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Indian, British"
                          value={detailedGuest.nationality}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, nationality: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-emerald-400" /> ID Document Type *
                        </label>
                        <select
                          value={detailedGuest.id_document_type}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, id_document_type: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID Card</option>
                          <option value="Driver License">Driver's License</option>
                          <option value="Other">Other Government ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          ID Document Number *
                        </label>
                        <input
                          type="text"
                          required={bookingTab === 'detailed' && guestSource === 'new'}
                          placeholder="e.g. 5489 1234 8901"
                          value={detailedGuest.id_document_number}
                          onChange={(e) => setDetailedGuest({ ...detailedGuest, id_document_number: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> Address
                      </label>
                      <input
                        type="text"
                        placeholder="City, State, Country"
                        value={detailedGuest.address}
                        onChange={(e) => setDetailedGuest({ ...detailedGuest, address: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Select Existing Guest Dropdown */
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Guest Record *
                    </label>
                    <select
                      value={selectedGuestId}
                      onChange={(e) => setSelectedGuestId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.full_name} ({g.phone} - {g.id_document_number || 'Pending ID'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Attach ID Documents Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    Attach ID Proof Documents (Multiple Supported)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {stagedFiles.length + existingGuestDocs.length} File(s)
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
                      Click or drag ID scans (Passport, Aadhaar, License)
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

              {/* Initial Status Selector for Detailed Mode */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-400">
                  Initial Reservation Status *
                </label>
                <div className="flex items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-bold">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Checked In"
                      checked={initialStatus === 'Checked In'}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <span>⚡ Instant Check-In & Mark Cottage OCCUPIED</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="initialStatus"
                      value="Confirmed"
                      checked={initialStatus === 'Confirmed'}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <span>Confirmed (Upcoming Arrival)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Cottage Room Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
              Select Cottage Room *
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} [{r.room_type} - Cap: {r.capacity} Guests] - Status: {r.status}
                </option>
              ))}
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Check-In Date *
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Check-Out Date *
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Number of Guests *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numGuests}
              onChange={(e) => setNumGuests(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Booking Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Special Requests / Staff Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Food preferences, extra bed request, campfire preference..."
              className="w-full h-16 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Inline Error Alert Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
              <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
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
              {bookingTab === 'quick' ? <Zap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {bookingTab === 'quick' ? 'Save Quick Reservation' : initialStatus === 'Checked In' ? 'Instant Check-In Guest & Assign Room' : 'Confirm & Save Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <DocumentViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        doc={previewDoc}
      />
    </>
  );
};
