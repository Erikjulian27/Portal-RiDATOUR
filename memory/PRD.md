# RiDATOUR Internal Portal - Product Requirements Document

## Original Problem Statement
Build a web-based internal portal for RiDATOUR travel company focused on Umrah, Hajj, and international tours. The system manages Leads, Customers (Jamaah), Trips, Bookings, Payments, and Documents with role-based access for 6 different roles across 3 branches.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB
- **File Storage**: Emergent Object Storage
- **Authentication**: JWT-based with role-based access control

## User Personas
1. **Super Admin (Owner)** - Full access to all data across branches
2. **Branch Manager** - Access to branch-specific data
3. **Sales** - Manages assigned leads, creates bookings
4. **Marketing** - Creates leads, manages campaigns
5. **Operations** - Manages bookings, documents, trip manifests
6. **Finance** - Approves/rejects payments

## Core Features Implemented ✓

### 1. Authentication & Authorization
- [x] JWT-based login system
- [x] Role-based access control (6 roles)
- [x] Branch-based data filtering
- [x] Protected routes

### 2. Dashboard Analytics
- [x] Total Leads & monthly leads count
- [x] Conversion rate calculation
- [x] Total revenue tracking
- [x] Outstanding payments
- [x] Trip occupancy visualization
- [x] Top performing sales
- [x] Lead sources pie chart
- [x] Revenue by branch (Super Admin)
- [x] Document alerts (H-30)

### 3. Lead Management
- [x] CRUD operations
- [x] Pipeline view with status tracking (New, Contacted, Follow Up, Hot, Deal, Lost)
- [x] Source tracking (Meta Ads, TikTok, Referral, WhatsApp)
- [x] Sales assignment
- [x] Search & filter functionality

### 4. Customer Database (Jamaah)
- [x] Full customer profile management
- [x] Passport tracking with expiry alerts
- [x] NIK and personal info
- [x] Branch assignment

### 5. Trip Management
- [x] Trip packages with unique codes
- [x] Seat quota and availability tracking
- [x] Automatic seat calculation
- [x] Status management (Open, Full, Closed)
- [x] Trip manifest generation

### 6. Booking System
- [x] Link customers to trips
- [x] Down payment requirement validation
- [x] Automatic balance calculation
- [x] Payment status tracking
- [x] Document status tracking

### 7. Payment Tracking
- [x] Payment recording
- [x] Proof upload (Object Storage)
- [x] Approval workflow (Pending → Approved/Rejected)
- [x] Automatic booking balance update

### 8. Document Checklist
- [x] Document tracking (Passport, KTP, Photo, Vaccination, Mahram)
- [x] File upload for each document type
- [x] Visa status management
- [x] Ticket status management
- [x] Automatic completion detection

### 9. User Management
- [x] Create/Edit/Delete users
- [x] Role assignment
- [x] Branch assignment
- [x] Account status (Active/Inactive)

### 10. Multi-language Support
- [x] English (EN)
- [x] Bahasa Indonesia (ID)
- [x] Language switcher in header

## Branches
1. RiDATOUR CCM
2. RiDATOUR Terrace Cinere
3. RiDATOUR Makassar

## Default Admin Account
- Email: admin@ridatour.com
- Password: admin123

## P0/P1/P2 Features Backlog

### P0 (Must Have) - All Implemented ✓
All core features listed above

### P1 (Should Have) - Next Phase
- [ ] Lead conversion to customer automation
- [ ] WhatsApp integration for lead capture
- [ ] Email notifications for payment approvals
- [ ] Bulk document upload
- [ ] Report export (PDF/Excel)

### P2 (Nice to Have)
- [ ] Paper.id payment integration
- [ ] Real-time notifications
- [ ] Calendar integration
- [ ] Mobile responsive optimization
- [ ] Dashboard customization
- [ ] Advanced analytics with date filters
- [ ] Audit trail logging

## Implementation Dates
- Initial MVP: January 2026

## Next Action Items
1. Add more sample data for testing
2. Implement lead → customer conversion
3. Add email notifications
4. Integrate Paper.id API when available
5. Add export functionality
