import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { RoomModal } from '../components/modals/RoomModal';
import {
  BedDouble,
  Plus,
  Wrench,
  CheckCircle2,
  Users,
  Wifi,
  Tv,
  Coffee,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const Rooms = () => {
  const { rooms, bookings, updateRoomStatus, currentRole } = useApp();
  const [selectedType, setSelectedType] = useState('All');
  const [showRoomModal, setShowRoomModal] = useState(false);

  const filteredRooms = rooms.filter(
    (r) => selectedType === 'All' || r.room_type === selectedType
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-emerald-400" />
            Somajam 1BHK Cottages (No. 1 to No. 5)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time availability of Somajam Holidays 5 1BHK rooms, pool access, campfire & EV charging facilities.
          </p>
        </div>
        {currentRole === 'admin' ? (
          <button
            onClick={() => setShowRoomModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        ) : (
          <div className="text-xs text-slate-500 italic bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Admin permissions required to add rooms
          </div>
        )}
      </div>

      {/* Room Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {['All', '1BHK Cottage'].map((type) => {
          const count =
            type === 'All'
              ? rooms.length
              : rooms.filter((r) => r.room_type === type).length;
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>{type === 'All' ? 'All Rooms (5 Cottages)' : `${type}s`}</span>
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

      {/* Room Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          // Check active occupant if occupied
          const activeBooking = bookings.find(
            (b) => b.room_id === room.id && b.status === 'Checked In'
          );

          return (
            <div
              key={room.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-xl group"
            >
              {/* Top info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950 text-slate-200 border border-slate-800">
                    {room.room_type} Category
                  </span>
                  <StatusBadge status={room.status} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {room.room_number}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Cap: {room.capacity} Guests
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">
                      ₹{room.price_per_night} / night
                    </span>
                  </div>
                </div>

                {/* Facilities Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(room.facilities || []).map((fac) => (
                    <span
                      key={fac}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800/80"
                    >
                      {fac}
                    </span>
                  ))}
                </div>

                {/* Occupant Card if Occupied */}
                {room.status === 'Occupied' && activeBooking && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <p className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider">
                      Current Occupant
                    </p>
                    <p className="text-xs font-bold text-slate-100">
                      {activeBooking.guest_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Check-out scheduled: <strong>{activeBooking.check_out_date}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {room.status === 'Maintenance' ? (
                  <button
                    onClick={() => updateRoomStatus(room.id, 'Available')}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Set Available
                  </button>
                ) : room.status === 'Available' ? (
                  <button
                    onClick={() => updateRoomStatus(room.id, 'Maintenance')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700 hover:border-amber-500"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" />
                    Mark Maintenance
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 italic w-full text-center py-1.5">
                    Currently Occupied by Guest
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Room Modal */}
      <RoomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
      />
    </div>
  );
};
