import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import {
  BarChart3,
  Download,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Calendar,
  FileSpreadsheet,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Lock,
} from 'lucide-react';

export const ReportsSettings = () => {
  const {
    bookings,
    rooms,
    guests,
    staffList,
    addStaff,
    currentRole,
    currentUser,
    toggleRole,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'history' | 'staff'

  // Staff Modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [newStaffTitle, setNewStaffTitle] = useState('Front Desk Associate');

  // Completed stays and cancelled stays
  const completedStays = bookings.filter((b) => b.status === 'Checked Out');
  const cancelledStays = bookings.filter((b) => b.status === 'Cancelled');
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied');
  const occupancyRate = ((occupiedRooms.length / (rooms.length || 1)) * 100).toFixed(1);

  // CSV Export simulation
  const exportToCSV = (dataArray, filename) => {
    showToast(`Exporting ${filename}... Download starting automatically!`, 'info');
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) {
      showToast('Please enter staff name and email', 'warning');
      return;
    }
    addStaff({
      full_name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      role: newStaffRole,
      title: newStaffTitle,
    });
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setShowStaffModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Analytics Reports & System Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Homestay occupancy statistics, historical stay records, data CSV export, and staff user administration.
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <button
          onClick={toggleRole}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-md"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Role:</span>
          <span className="text-emerald-400 font-bold uppercase">{currentRole}</span>
          <span className="text-slate-400 text-[10px] ml-1">(Click to switch)</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          Occupancy Analytics
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          Stays & Cancellation Logs ({completedStays.length + cancelledStays.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Staff Directory ({staffList.length})
        </button>
      </div>

      {/* TAB 1: Occupancy Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Live Occupancy Rate</span>
              <div className="text-3xl font-black text-emerald-400">{occupancyRate}%</div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Completed Stays Hosted</span>
              <div className="text-3xl font-black text-slate-100">{completedStays.length}</div>
              <p className="text-xs text-slate-500">Archived in history database</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Total Registered Guests</span>
              <div className="text-3xl font-black text-sky-400">{guests.length}</div>
              <p className="text-xs text-slate-500">Master guest directory records</p>
            </div>
          </div>

          {/* Room Breakdown Stats */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Room Utilization Breakdown by Category
              </h3>
              <button
                onClick={() => exportToCSV(rooms, 'occupancy_report.csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {rooms.map((r) => {
                const isOccupied = r.status === 'Occupied';
                return (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Room {r.room_number}</span>
                    <div className="text-sm font-bold text-slate-100">
                      {r.room_type}
                    </div>
                    <span
                      className={`text-[11px] font-semibold block px-2 py-0.5 rounded text-center ${
                        isOccupied
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stay Logs */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Completed Stays Log ({completedStays.length})
            </h3>
            <button
              onClick={() => exportToCSV(completedStays, 'completed_stays.csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download Stays Log CSV
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Room</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Staff Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {completedStays.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-emerald-400">{b.booking_ref}</td>
                      <td className="p-4 font-bold text-slate-100">{b.guest_name}</td>
                      <td className="p-4">{b.room_number}</td>
                      <td className="p-4">{b.check_in_date} → {b.check_out_date}</td>
                      <td className="p-4 text-slate-400 italic">{b.notes || 'Normal checkout'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-rose-400" />
              Cancelled Reservations Log ({cancelledStays.length})
            </h3>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Ref Code</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Room</th>
                    <th className="p-4">Cancellation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cancelledStays.map((b) => (
                    <tr key={b.id}>
                      <td className="p-4 font-mono font-bold text-rose-400">{b.booking_ref}</td>
                      <td className="p-4 font-bold text-slate-100">{b.guest_name}</td>
                      <td className="p-4">{b.room_number}</td>
                      <td className="p-4 text-slate-400">{b.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Staff Management */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Authorized Staff Accounts Directory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentRole === 'admin'
                  ? 'Manage team member accounts and grant Admin or Staff roles.'
                  : 'Viewing internal staff list. Admin privileges required to edit.'}
              </p>
            </div>

            {currentRole === 'admin' ? (
              <button
                onClick={() => setShowStaffModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff Member
              </button>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Staff Mode (Read-Only)
              </span>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((stf) => (
                  <tr key={stf.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-slate-100">{stf.full_name}</td>
                    <td className="p-4 text-slate-300">{stf.title}</td>
                    <td className="p-4 text-slate-400">
                      <div>{stf.phone}</div>
                      <div className="text-[11px] text-slate-500">{stf.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                          stf.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {stf.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {stf.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal (Admin Only) */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="Create New Staff Member Account"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Varma"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="rahul@rejchachan.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98460 00000"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job Title / Designation
              </label>
              <input
                type="text"
                placeholder="Front Desk Executive"
                value={newStaffTitle}
                onChange={(e) => setNewStaffTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role Permission *
              </label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="staff">Staff (Operational Access)</option>
                <option value="admin">Admin / Owner (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
