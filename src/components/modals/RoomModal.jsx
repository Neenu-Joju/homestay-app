import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { BedDouble, CheckSquare } from 'lucide-react';

const FACILITY_OPTIONS = [
  'AC',
  'Free WiFi',
  'Flat TV',
  'Hot Water Shower',
  'Balcony',
  'Garden View',
  'Mountain View',
  'Mini Bar',
  'Kitchenette',
  'Jacuzzi',
];

export const RoomModal = ({ isOpen, onClose }) => {
  const { addRoom, currentRole, showToast } = useApp();

  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Double');
  const [capacity, setCapacity] = useState(2);
  const [price, setPrice] = useState(2500);
  const [selectedFacilities, setSelectedFacilities] = useState(['AC', 'Free WiFi']);

  const toggleFacility = (facility) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities((prev) => prev.filter((f) => f !== facility));
    } else {
      setSelectedFacilities((prev) => [...prev, facility]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (currentRole !== 'admin') {
      showToast('Permission Denied: Only Admins can add or configure rooms', 'error');
      return;
    }

    if (!roomNumber.trim()) {
      showToast('Please enter room name or number', 'warning');
      return;
    }

    addRoom({
      room_number: roomNumber,
      room_type: roomType,
      capacity: parseInt(capacity, 10),
      facilities: selectedFacilities,
      price_per_night: parseInt(price, 10),
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Homestay Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
              Room Name / Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 103 - Lake View Deluxe"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Room Category *
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Single">Single Room</option>
              <option value="Double">Double Deluxe</option>
              <option value="Deluxe">Premium Suite</option>
              <option value="Family">Family Cottage</option>
            </select>
          </div>
        </div>

        {/* Capacity & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Guest Capacity *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Base Price per Night (₹) *
            </label>
            <input
              type="number"
              step="100"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Facilities Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
            Room Facilities & Amenities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FACILITY_OPTIONS.map((fac) => {
              const isChecked = selectedFacilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => toggleFacility(fac)}
                  className={`px-3 py-1.5 rounded-xl border text-xs text-left transition-all ${
                    isChecked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {fac}
                </button>
              );
            })}
          </div>
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
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            Create Room
          </button>
        </div>
      </form>
    </Modal>
  );
};
