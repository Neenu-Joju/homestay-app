import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      // Room statuses
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Occupied':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Maintenance':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      // Booking statuses
      case 'Requested':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Checked In':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold';
      case 'Checked Out':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through';

      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {status}
    </span>
  );
};
