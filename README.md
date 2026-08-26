# Somajam Holidays, Parunthumpara — Staff Management System

> A streamlined, internal staff management system designed for **Somajam Holidays**, located in Parunthumpara, Peerumedu, Idukki, Kerala ([somajamholidays.com](https://somajamholidays.com/)). Built to manage 5 1BHK cottages, unified guest registration and room assignment, check-ins/check-outs, and document compliance archives.

---

## 1. App Name and Purpose

* **App Name:** Somajam Holidays Staff Portal
* **Official Website:** [https://somajamholidays.com/](https://somajamholidays.com/)
* **Location:** Parunthumpara, Otappalam, Peerumedu, Idukki, Kerala - 685537
* **Key Facilities:** 5 1BHK Cottages, Swimming Pool, Free Wi-Fi, EV Charging Electricity, Purified Drinking Water, Grilling Facilities, Campfire with Audio System, Drivers' Lounge.
* **One-Line Purpose:** A centralized internal operations web application for Somajam Holidays staff to manage room inventory (`No. 1` to `No. 5`), register guests & assign rooms in a unified 1-step form, handle check-in/out workflows, and archive guest ID documents.

---

## 2. Room Inventory (5 1BHK Cottages)

The property features **5 1BHK Cottages** named **No. 1** through **No. 5**:

| Room Number | Type | Capacity | Key Facilities & Amenities | Default Rate |
| :--- | :--- | :---: | :--- | :--- |
| **No. 1** | 1BHK Cottage | 4 Guests | Swimming Pool Access, Free Wi-Fi, EV Charging, Kitchenette, Audio System | ₹3,500 / night |
| **No. 2** | 1BHK Cottage | 4 Guests | Swimming Pool Access, Free Wi-Fi, EV Charging, Kitchenette, Valley View Patio | ₹3,500 / night |
| **No. 3** | 1BHK Cottage | 4 Guests | Swimming Pool Access, Free Wi-Fi, EV Charging, Kitchenette, Private Balcony | ₹3,500 / night |
| **No. 4** | 1BHK Cottage | 4 Guests | Swimming Pool Access, Free Wi-Fi, EV Charging, Kitchenette, Drivers' Lounge Access | ₹3,500 / night |
| **No. 5** | 1BHK Cottage | 5 Guests | Swimming Pool Access, Free Wi-Fi, EV Charging, Full Kitchen, Campfire & Mountain View | ₹4,000 / night |

---

## 3. Streamlined 2-Tab Reservation & Instant Check-In System

To streamline front-desk operations for both advance phone bookings and walk-in arrivals, the **Create Reservation** modal ([`BookingModal.jsx`](file:///c:/1.JGM%20Personal%20Data/Neenu%20web%20application/Rejchachan%20homestay/src/components/modals/BookingModal.jsx)) features two dedicated operational tabs:

### ⚡ Tab 1: "Quick Booking" (Advance / Phone Reservations)
* **Purpose**: Capture fast advance reservations with minimal required fields.
* **Fields**: Guest Full Name `*`, Mobile / Phone Number `*`, Cottage Room (`No. 1` to `No. 5`), Check-In & Check-Out dates, Guest Count, Staff Notes.
* **Outcome**: Registers guest profile as `Pending Check-In ID` and creates a **Confirmed** booking. ID proof details and document attachments are captured later during physical Check-In.

---

### 📋 Tab 2: "Detailed Booking & Instant Check-In" (Walk-Ins & Immediate Arrivals)
* **Purpose**: Register guest details, collect ID document proof, attach document scans, assign cottage, and check in walk-in guests **in a single form submission**.
* **Guest Entry Options**:
  * 🟢 **New Walk-In Guest**: Full Name `*`, Phone `*`, Email, Nationality, ID Document Type `*`, ID Document Number `*`, Address.
  * 🔵 **Existing Guest Directory**: Dropdown selector of registered guests.
* **Multi-Document Attachments**: Integrated file uploader for Passport, Aadhaar, and Driver's License scans directly uploaded to Supabase Storage.
* **Initial Status Switch**:
  * `🔘 Instant Check-In & Mark Occupied` (Default for walk-ins)
  * `🔘 Confirmed (Upcoming)`
* **Outcome**: Atomically creates/updates Guest record, uploads ID files to Supabase Storage, creates Booking record, and marks Cottage **Occupied** in **1 single click**!

---

## 4. User Roles & Permissions Matrix

The application supports **2 User Roles** (strictly internal staff-only access):

1. **Admin / Owner**: Full operational, administrative, room configuration, and staff management privileges.
2. **Staff**: Operational access for day-to-day guest registration, room assignment, check-in/out handling, and document uploads.

### Permissions Matrix

| Feature / Action | Staff | Admin / Owner |
| :--- | :---: | :---: |
| **Login / Interactive Role Switcher** | ✅ | ✅ |
| **View Dashboard & Today's Summary** | ✅ | ✅ |
| **Search & View Guest Records** | ✅ | ✅ |
| **Add Guest + Assign Room (1-Step Form)** | ✅ | ✅ |
| **Upload Guest Documents (Aadhaar / Passport)** | ✅ | ✅ |
| **View & Search Bookings** | ✅ | ✅ |
| **Process Check-In & Check-Out** | ✅ | ✅ |
| **Cancel Booking** | ✅ | ✅ |
| **Delete Guest Records / Completed Stays** | ❌ | ✅ |
| **Add / Edit Rooms & Rates** | ❌ | ✅ |
| **Add / Edit Staff Accounts** | ❌ | ✅ |
| **View Financial & Occupancy Reports** | ❌ | ✅ |

---

## 5. Screen List (5 Responsive Screens)

### Screen 1: Operations Dashboard (`/`)
* **Purpose:** Real-time front desk command center for Somajam Holidays.
* **UI Elements:**
  * **Welcome Banner:** Quick action buttons (`+ Add Booking`, `+ Add Guest`, `Upload ID Doc`).
  * **Top Metrics Cards:** Today's Check-ins, Today's Check-outs, Occupancy Rate %, Available Rooms.
  * **Arrivals Queue:** Today's expected check-ins with ID proof warnings and 1-click `Check In` trigger.
  * **Departures Queue:** Today's scheduled check-outs with 1-click `Check Out` trigger.
  * **Upcoming Reservations Preview:** Preview cards for upcoming bookings across Cottages No. 1–5.

### Screen 2: Guest Management & Document Storage (`/guests`)
* **Purpose:** Searchable repository of guest profiles with ID document archives and 1-step room assignment.
* **UI Elements:**
  * **Search & Compliance Filter:** Search by name/phone/ID number + document compliance filter (`Has ID` vs `Missing ID`).
  * **Guest Table:** Master list showing name, contact, nationality, stay count, and document status.
  * **Unified Add Guest Modal:** Combines guest info + room assignment (`No. 1` to `No. 5`), check-in/out dates, and guest count.
  * **Guest Detail Drawer Modal:** Personal details tab, stay history tab, and document attachment/download tab.

### Screen 3: Booking & Check-In / Check-Out Hub (`/bookings`)
* **Purpose:** Reservation lifecycle management, room filtering, and check-in/out triggers.
* **UI Elements:**
  * **Status Filter Tabs:** `All`, `Upcoming`, `Checked In`, `Checked Out`, `Cancelled`.
  * **Search & Room Filter Toolbar:** Search input + room dropdown filter (`No. 1` to `No. 5`).
  * **Bookings Table:** Reference ID (`SJM-2026-xxx`), Guest Name, Assigned Room, Check-in/Out dates, Guest Count, Status Badge, and Action buttons (`Check In`, `Check Out`, `Cancel`).

### Screen 4: Rooms & Occupancy Status (`/rooms`)
* **Purpose:** Real-time inventory monitoring for Somajam Holidays' 5 1BHK cottages.
* **UI Elements:**
  * **Cottage Cards Grid:** Cards displaying Room `No. 1` to `No. 5`, category (`1BHK Cottage`), capacity, price (`₹3,500/night`), facilities tags (Swimming Pool, Wi-Fi, EV Charging, etc.), and occupant card if occupied.
  * **Status Action Controls:** 1-click `Mark Maintenance` / `Set Available` status toggles.

### Screen 5: Reports & Staff Settings (`/reports-settings`)
* **Purpose:** Occupancy analytics, CSV data export, and staff user administration.
* **UI Elements:**
  * **Active Role Switcher:** Toggle button between Admin and Staff mode.
  * **Analytics Tab:** Live occupancy meter, Cottage utilization breakdown (No. 1 to No. 5), and 1-click `Export CSV`.
  * **Stay Logs Tab:** Historical completed stays and cancellation logs with CSV download.
  * **Staff Management Tab:** Staff user directory and `+ Add Staff Member` modal (Admin-only).

---

## 6. Business Rules

1. **Unified Guest + Booking Creation:**
   * Staff can add a guest and assign a room (`No. 1` to `No. 5`), check-in date, check-out date, and guest count in a single modal form submission.
2. **Double-Booking Prevention:**
   * Validates room availability for selected dates (`new_check_in < existing_check_out AND new_check_out > existing_check_in`).
3. **Automatic Room Status Sync:**
   * Checking in a guest automatically sets the assigned room status to `Occupied`.
   * Checking out a guest automatically sets the assigned room status to `Available`.
4. **Document Audit Warning:**
   * Checking in a guest without an attached ID document triggers a compliance warning toast.

---

## 7. Technology Stack & Local Running

* **Frontend Framework:** React 19 + React Router v7
* **Build Tool:** Vite 8
* **Styling:** Tailwind CSS v4 + Lucide React Icons
* **Running Locally:**
  ```bash
  cmd /c npm run dev
  ```
  App URL: `http://localhost:5173/`
