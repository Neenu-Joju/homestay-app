import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { LogOut, CheckSquare, FileText, BedDouble } from 'lucide-react';

export const CheckOutModal = ({ isOpen, onClose, booking }) => {
  const { processCheckOut } = useApp();
  const [staffNotes, setStaffNotes] = useState('');
  const [roomInspected, setRoomInspected] = useState(true);

  if (!booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    processCheckOut(booking.id, staffNotes);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Check-Out Process">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Summary Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {booking.booking_ref}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
              Room: {booking.room_number}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-100">
            {booking.guest_name}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <div>Check-in: <strong className="text-slate-200">{booking.check_in_date}</strong></div>
            <div>Check-out: <strong className="text-slate-200">{booking.check_out_date}</strong></div>
          </div>
        </div>

        {/* Room Inspection Checkbox */}
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={roomInspected}
            onChange={(e) => setRoomInspected(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            Room inspected & key returned by guest
          </span>
        </label>

        {/* Room Status Transition Notice */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <BedDouble className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Upon completion, <strong>{booking.room_number}</strong> will automatically be set back to <strong>AVAILABLE</strong> status.
          </span>
        </div>

        {/* Staff Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Check-Out Departure Notes
          </label>
          <textarea
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="e.g. Key received, settled bill, feedback left in guestbook..."
            className="w-full h-20 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
          />
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Complete Check-Out & Release Room
          </button>
        </div>
      </form>
    </Modal>
  );
};
