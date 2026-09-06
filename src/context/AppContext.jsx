import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  initialRooms,
  initialGuests,
  initialBookings,
  initialDocuments,
  initialStaff,
  initialExpensePayers,
  initialExpenses,
} from '../data/initialData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Persistent Auth State (Safely wrapped in try/catch)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('somajam_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Always Unified Admin Role
  const [currentRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('somajam_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed;
        }
      }
    } catch (e) {
      // Catch any invalid JSON in localStorage
    }
    return { id: 'stf-admin', name: 'Somajam Admin', username: 'admin', role: 'admin' };
  });

  // Login Handler
  const login = async (username, password) => {
    const lowerUser = username.toLowerCase().trim();

    // Check default credentials (admin / somajam2026 or admin / admin123 or admin / password123)
    const isDefaultMatch =
      (lowerUser === 'admin' || lowerUser === 'somajam') &&
      (password === 'somajam2026' || password === 'admin123' || password === 'password123' || password === 'admin');

    let isValid = isDefaultMatch;
    let displayName = lowerUser === 'somajam' ? 'Somajam Manager' : 'Somajam Admin';

    // Check optional Supabase admin_users table
    if (!isValid) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', lowerUser)
          .eq('password', password)
          .single();

        if (!error && data) {
          isValid = true;
          displayName = data.full_name || data.username || 'Somajam Admin';
        }
      } catch (err) {
        // Fallback catch
      }
    }

    if (isValid) {
      const userObj = { id: 'stf-admin', name: displayName, username: lowerUser, role: 'admin' };
      setIsAuthenticated(true);
      setCurrentUser(userObj);
      localStorage.setItem('somajam_auth', 'true');
      localStorage.setItem('somajam_user', JSON.stringify(userObj));
      showToast(`Welcome back, ${displayName}!`, 'success');
      return { success: true };
    } else {
      return { success: false, message: 'Invalid Username or Password' };
    }
  };

  // Logout Handler
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('somajam_auth');
    localStorage.removeItem('somajam_user');
    showToast('Logged out successfully', 'info');
  };

  // Master States
  const [rooms, setRooms] = useState(initialRooms);
  const [guests, setGuests] = useState(initialGuests);
  const [bookings, setBookings] = useState(initialBookings);
  const [documents, setDocuments] = useState(initialDocuments);
  const [staffList, setStaffList] = useState(initialStaff);

  // Expense Payers & Expenses Persistent State
  const [expensePayers, setExpensePayers] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_expense_payers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialExpensePayers;
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('somajam_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return initialExpenses;
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- INITIAL SUPABASE DATA FETCH ---
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        // Fetch Rooms
        const { data: roomsData, error: roomsErr } = await supabase.from('rooms').select('*');
        if (!roomsErr && roomsData && roomsData.length > 0) {
          setRooms(roomsData);
        }

        // Fetch Guests
        const { data: guestsData, error: guestsErr } = await supabase.from('guests').select('*');
        if (!guestsErr && guestsData && guestsData.length > 0) {
          setGuests(guestsData);
        }

        // Fetch Bookings
        const { data: bookingsData, error: bookingsErr } = await supabase.from('bookings').select('*');
        if (!bookingsErr && bookingsData && bookingsData.length > 0) {
          setBookings(bookingsData);
        }

        // Fetch Documents
        const { data: docsData, error: docsErr } = await supabase.from('documents').select('*');
        if (!docsErr && docsData && docsData.length > 0) {
          setDocuments(docsData);
        }

        // Fetch Staff
        const { data: staffData, error: staffErr } = await supabase.from('staff_list').select('*');
        if (!staffErr && staffData && staffData.length > 0) {
          setStaffList(staffData);
        }

        // Fetch Expense Payers (Sync with Supabase if table exists and local cache is unpopulated)
        const hasLocalPayers = localStorage.getItem('somajam_expense_payers');
        if (!hasLocalPayers) {
          const { data: payersData, error: payersErr } = await supabase.from('expense_payers').select('*');
          if (!payersErr && payersData && payersData.length > 0) {
            setExpensePayers(payersData);
            try { localStorage.setItem('somajam_expense_payers', JSON.stringify(payersData)); } catch(e){}
          }
        }

        // Fetch Expenses
        const hasLocalExpenses = localStorage.getItem('somajam_expenses');
        if (!hasLocalExpenses) {
          const { data: expensesData, error: expensesErr } = await supabase.from('expenses').select('*');
          if (!expensesErr && expensesData && expensesData.length > 0) {
            setExpenses(expensesData);
            try { localStorage.setItem('somajam_expenses', JSON.stringify(expensesData)); } catch(e){}
          }
        }
      } catch (err) {
        console.warn('Supabase fetch notice: using in-memory state fallback until schema is executed.');
      }
    };

    fetchSupabaseData();
  }, []);

  // Role Switcher Handler
  const toggleRole = () => {
    const newRole = currentRole === 'admin' ? 'staff' : 'admin';
    setCurrentRole(newRole);
    setCurrentUser(
      newRole === 'admin'
        ? { id: 'stf-001', name: 'Somajam Manager (Owner)', role: 'admin' }
        : { id: 'stf-002', name: 'Front Desk Staff', role: 'staff' }
    );
    showToast(`Switched view to ${newRole.toUpperCase()} mode`, 'info');
  };

  // --- ROOM HANDLERS ---
  const addRoom = async (roomData) => {
    const newRoom = {
      id: `room-${Date.now()}`,
      status: 'Available',
      ...roomData,
    };
    setRooms((prev) => [newRoom, ...prev]);

    try {
      await supabase.from('rooms').insert([newRoom]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Room ${newRoom.room_number} created successfully`);
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );

    try {
      await supabase.from('rooms').update({ status: newStatus }).eq('id', roomId);
    } catch (e) {
      console.error(e);
    }
    showToast(`Room status updated to ${newStatus}`);
  };

  // --- GUEST HANDLERS ---
  const addGuest = async (guestData) => {
    const {
      room_id,
      check_in_date,
      check_out_date,
      num_guests,
      booking_status,
      ...coreGuestData
    } = guestData;

    const newGuest = {
      id: `gst-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...coreGuestData,
    };

    setGuests((prev) => [newGuest, ...prev]);

    // Persist Guest to Supabase
    try {
      await supabase.from('guests').insert([newGuest]);
    } catch (e) {
      console.error('Supabase guest insert error:', e);
    }

    // If stay details provided, auto-assign room and create booking
    if (room_id && check_in_date && check_out_date) {
      const room = rooms.find((r) => r.id === room_id);
      const refNum = `SJM-2026-${String(bookings.length + 1).padStart(3, '0')}`;
      const newBooking = {
        id: `bkg-${Date.now()}`,
        booking_ref: refNum,
        guest_id: newGuest.id,
        guest_name: newGuest.full_name,
        room_id: room_id,
        room_number: room ? room.room_number : 'Room',
        check_in_date: check_in_date,
        check_out_date: check_out_date,
        num_guests: Number(num_guests) || 1,
        status: booking_status || 'Confirmed',
        created_at: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      supabase.from('bookings').insert([newBooking]).then();

      // Update room status if checking in
      if (booking_status === 'Checked In') {
        setRooms((prev) =>
          prev.map((r) => (r.id === room_id ? { ...r, status: 'Occupied' } : r))
        );
        supabase.from('rooms').update({ status: 'Occupied' }).eq('id', room_id).then();
      }

      showToast(
        `Guest ${newGuest.full_name} registered & assigned Room ${
          room ? room.room_number : ''
        }!`
      );
    } else {
      showToast(`Guest ${newGuest.full_name} added to records`);
    }

    return newGuest;
  };

  const updateGuest = async (guestId, updatedData) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, ...updatedData } : g))
    );

    try {
      await supabase.from('guests').update(updatedData).eq('id', guestId);
    } catch (e) {
      console.error(e);
    }
    showToast('Guest details updated successfully');
  };

  const deleteGuest = async (guestId) => {
    if (currentRole !== 'admin') {
      showToast('Permission Denied: Only Admin can delete guest records', 'error');
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    setBookings((prev) => prev.filter((b) => b.guest_id !== guestId));

    try {
      await supabase.from('guests').delete().eq('id', guestId);
    } catch (e) {
      console.error(e);
    }
    showToast('Guest record removed from database', 'info');
  };

  // --- BOOKING HANDLERS & CHECK-IN / CHECK-OUT ---
  const addBooking = async (bookingData) => {
    const { room_id, check_in_date, check_out_date, guest_id, guest_name, booking_status } = bookingData;
    const isOverlapping = bookings.some((b) => {
      if (b.room_id !== room_id || b.status === 'Cancelled' || b.status === 'Checked Out') {
        return false;
      }
      return (
        new Date(check_in_date) < new Date(b.check_out_date) &&
        new Date(check_out_date) > new Date(b.check_in_date)
      );
    });

    if (isOverlapping) {
      showToast(
        'Double Booking Blocked: Room is already reserved for selected dates!',
        'error'
      );
      return false;
    }

    const room = rooms.find((r) => r.id === room_id);
    const guest = guests.find((g) => g.id === guest_id);
    const resolvedGuestName = guest_name || (guest ? guest.full_name : 'Guest');
    const finalStatus = booking_status || 'Confirmed';

    const refNum = `SJM-2026-${String(bookings.length + 1).padStart(3, '0')}`;
    const newBooking = {
      id: `bkg-${Date.now()}`,
      booking_ref: refNum,
      guest_id: guest_id,
      guest_name: resolvedGuestName,
      room_id: room_id,
      room_number: room ? room.room_number : 'Room',
      check_in_date: check_in_date,
      check_out_date: check_out_date,
      num_guests: Number(bookingData.num_guests) || 1,
      status: finalStatus,
      notes: bookingData.notes || '',
      created_at: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // If Instant Check-In, set Room status to Occupied
    if (finalStatus === 'Checked In') {
      setRooms((prev) =>
        prev.map((r) => (r.id === room_id ? { ...r, status: 'Occupied' } : r))
      );
      try {
        await supabase.from('rooms').update({ status: 'Occupied' }).eq('id', room_id);
      } catch (e) {
        console.error('Supabase room status update error:', e);
      }
    }

    try {
      await supabase.from('bookings').insert([newBooking]);
    } catch (e) {
      console.error('Supabase booking insert error:', e);
    }

    if (finalStatus === 'Checked In') {
      showToast(`Guest ${resolvedGuestName} Checked In! Cottage ${room ? room.room_number : ''} marked OCCUPIED.`);
    } else {
      showToast(`Booking ${refNum} created successfully for ${resolvedGuestName}!`);
    }
    return true;
  };

  const processCheckIn = async (bookingId, staffNotes = '') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const guestDocs = documents.filter((d) => d.guest_id === booking.guest_id);
    if (guestDocs.length === 0) {
      showToast(
        'Warning: Guest has no uploaded ID documents attached!',
        'warning'
      );
    }

    const updatedNotes = staffNotes
      ? `${booking.notes || ''} | Check-in Notes: ${staffNotes}`
      : booking.notes;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Checked In', notes: updatedNotes }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.id === booking.room_id ? { ...r, status: 'Occupied' } : r
      )
    );

    try {
      await supabase.from('bookings').update({ status: 'Checked In', notes: updatedNotes }).eq('id', bookingId);
      await supabase.from('rooms').update({ status: 'Occupied' }).eq('id', booking.room_id);
    } catch (e) {
      console.error(e);
    }

    showToast(`Checked In successfully! Room marked OCCUPIED.`);
  };

  const processCheckOut = async (bookingId, staffNotes = '') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const updatedNotes = staffNotes
      ? `${booking.notes || ''} | Check-out Notes: ${staffNotes}`
      : booking.notes;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Checked Out', notes: updatedNotes }
          : b
      )
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.id === booking.room_id ? { ...r, status: 'Available' } : r
      )
    );

    try {
      await supabase.from('bookings').update({ status: 'Checked Out', notes: updatedNotes }).eq('id', bookingId);
      await supabase.from('rooms').update({ status: 'Available' }).eq('id', booking.room_id);
    } catch (e) {
      console.error(e);
    }

    showToast(`Checked Out successfully! Room marked AVAILABLE.`);
  };

  const cancelBooking = async (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
    try {
      await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', bookingId);
    } catch (e) {
      console.error(e);
    }
    showToast('Booking cancelled', 'info');
  };

  // --- DOCUMENT HANDLERS ---
  const addDocument = async (docData) => {
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random()}`,
      uploaded_at: new Date().toISOString(),
      uploaded_by: currentUser.name,
      ...docData,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    try {
      await supabase.from('documents').insert([newDoc]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Document ${newDoc.file_name} attached successfully`);
  };

  const deleteDocument = async (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (e) {
      console.error(e);
    }
    showToast('Document deleted', 'info');
  };

  // --- STAFF HANDLERS ---
  const addStaff = async (staffData) => {
    const newStaff = {
      id: `stf-${Date.now()}`,
      status: 'Active',
      created_at: new Date().toISOString(),
      ...staffData,
    };
    setStaffList((prev) => [newStaff, ...prev]);

    try {
      await supabase.from('staff_list').insert([newStaff]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Staff account for ${newStaff.full_name} created`);
  };

  const [activeExpenseUser, setActiveExpenseUser] = useState(() => {
    return initialExpensePayers[1] || initialExpensePayers[0] || null;
  });

  // --- EXPENSE PAYER HANDLERS ---
  const addExpensePayer = async (payerData) => {
    const newPayer = {
      id: `pyr-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payerData,
    };

    setExpensePayers((prev) => {
      const updated = [...prev, newPayer];
      try { localStorage.setItem('somajam_expense_payers', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expense_payers').insert([newPayer]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense account for ${newPayer.name} added`);
    return newPayer;
  };

  const deleteExpensePayer = async (payerId) => {
    const linkedExpenses = expenses.filter((e) => e && e.payer_id === payerId);
    if (linkedExpenses.length > 0) {
      const payerObj = expensePayers.find((p) => p.id === payerId);
      showToast(
        `Cannot Delete User: ${linkedExpenses.length} transaction(s) are recorded under "${payerObj ? payerObj.name : 'this user'}". Delete those transactions first!`,
        'error'
      );
      return false;
    }

    setExpensePayers((prev) => {
      const updated = prev.filter((p) => p.id !== payerId);
      try { localStorage.setItem('somajam_expense_payers', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expense_payers').delete().eq('id', payerId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense account removed', 'info');
    return true;
  };

  // --- EXPENSE HANDLERS ---
  const addExpense = async (expenseData) => {
    const newExpense = {
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...expenseData,
    };

    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').insert([newExpense]);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense ₹${newExpense.amount} logged for ${newExpense.payer_name}`);
    return newExpense;
  };

  const updateExpense = async (expenseId, updatedData) => {
    setExpenses((prev) => {
      const updated = prev.map((e) => (e.id === expenseId ? { ...e, ...updatedData } : e));
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').update(updatedData).eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense entry updated');
  };

  const deleteExpense = async (expenseId, actingUser = null) => {
    const targetExpense = expenses.find((e) => e.id === expenseId);
    if (!targetExpense) return false;

    // Verify user authorization: only the user recorded on the expense can delete it
    const userToVerify = actingUser || activeExpenseUser;
    if (
      userToVerify &&
      userToVerify.id !== targetExpense.payer_id &&
      userToVerify.name !== targetExpense.payer_name
    ) {
      showToast(
        `Permission Blocked: Only ${targetExpense.payer_name} can delete transactions recorded against their name.`,
        'error'
      );
      return false;
    }

    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== expenseId);
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast('Expense entry removed', 'info');
    return true;
  };

  const toggleReimbursementStatus = async (expenseId) => {
    let nextStatus = 'Settled';
    setExpenses((prev) => {
      const updated = prev.map((e) => {
        if (e.id === expenseId) {
          nextStatus = e.reimbursement_status === 'Pending Reimbursement' ? 'Settled' : 'Pending Reimbursement';
          return { ...e, reimbursement_status: nextStatus };
        }
        return e;
      });
      try { localStorage.setItem('somajam_expenses', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      await supabase.from('expenses').update({ reimbursement_status: nextStatus }).eq('id', expenseId);
    } catch (e) {
      console.error(e);
    }
    showToast(`Expense marked as ${nextStatus}`);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentRole,
        currentUser,
        toggleRole: () => {},
        rooms,
        addRoom,
        updateRoomStatus,
        guests,
        addGuest,
        updateGuest,
        deleteGuest,
        bookings,
        addBooking,
        processCheckIn,
        processCheckOut,
        cancelBooking,
        documents,
        addDocument,
        deleteDocument,
        staffList,
        addStaff,
        expensePayers,
        addExpensePayer,
        deleteExpensePayer,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleReimbursementStatus,
        activeExpenseUser,
        setActiveExpenseUser,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

