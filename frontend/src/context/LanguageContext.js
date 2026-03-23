import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    leads: 'Leads',
    customers: 'Customers',
    trips: 'Trips',
    bookings: 'Bookings',
    payments: 'Payments',
    documents: 'Documents',
    users: 'Users',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    branch: 'Branch',
    notes: 'Notes',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    approve: 'Approve',
    reject: 'Reject',
    
    // Auth
    login: 'Login',
    password: 'Password',
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to your account',
    
    // Dashboard
    totalLeads: 'Total Leads',
    leadsThisMonth: 'Leads This Month',
    conversionRate: 'Conversion Rate',
    totalRevenue: 'Total Revenue',
    outstandingPayments: 'Outstanding Payments',
    tripOccupancy: 'Trip Occupancy',
    topSales: 'Top Performing Sales',
    leadSources: 'Lead Sources',
    pendingApprovals: 'Pending Approvals',
    documentAlerts: 'Document Alerts (H-30)',
    revenueByBranch: 'Revenue by Branch',
    
    // Leads
    leadName: 'Lead Name',
    source: 'Source',
    assignedSales: 'Assigned Sales',
    estimatedDeparture: 'Estimated Departure',
    budgetRange: 'Budget Range',
    newLead: 'New Lead',
    pipeline: 'Pipeline',
    
    // Customers
    customerName: 'Customer Name',
    nik: 'NIK',
    passportNumber: 'Passport Number',
    passportExpiry: 'Passport Expiry',
    birthDate: 'Birth Date',
    city: 'City',
    newCustomer: 'New Customer',
    
    // Trips
    tripCode: 'Trip Code',
    packageName: 'Package Name',
    departureDate: 'Departure Date',
    returnDate: 'Return Date',
    airline: 'Airline',
    hotelMecca: 'Hotel Mecca',
    hotelMadina: 'Hotel Madina',
    seatQuota: 'Seat Quota',
    seatsRemaining: 'Seats Remaining',
    tourLeader: 'Tour Leader',
    price: 'Price',
    newTrip: 'New Trip',
    manifest: 'Manifest',
    
    // Bookings
    customer: 'Customer',
    trip: 'Trip',
    sales: 'Sales',
    packagePrice: 'Package Price',
    downPayment: 'Down Payment',
    totalPaid: 'Total Paid',
    remainingBalance: 'Remaining Balance',
    paymentStatus: 'Payment Status',
    documentStatus: 'Document Status',
    newBooking: 'New Booking',
    
    // Payments
    paymentDate: 'Payment Date',
    amount: 'Amount',
    method: 'Method',
    proofUrl: 'Proof',
    approvalStatus: 'Approval Status',
    approvedBy: 'Approved By',
    newPayment: 'New Payment',
    uploadProof: 'Upload Proof',
    
    // Documents
    passport: 'Passport',
    ktp: 'KTP',
    photo: 'Photo',
    vaccination: 'Vaccination',
    mahramDoc: 'Mahram Document',
    visaStatus: 'Visa Status',
    ticketStatus: 'Ticket Status',
    
    // Statuses
    new: 'New',
    contacted: 'Contacted',
    followUp: 'Follow Up',
    hot: 'Hot',
    deal: 'Deal',
    lost: 'Lost',
    pending: 'Pending',
    partial: 'Partial',
    paid: 'Paid',
    approved: 'Approved',
    rejected: 'Rejected',
    open: 'Open',
    full: 'Full',
    closed: 'Closed',
    complete: 'Complete',
    incomplete: 'Incomplete',
    
    // Roles
    super_admin: 'Super Admin',
    branch_manager: 'Branch Manager',
    sales_role: 'Sales',
    marketing: 'Marketing',
    operations: 'Operations',
    finance: 'Finance',
  },
  id: {
    // Navigation
    dashboard: 'Dasbor',
    leads: 'Prospek',
    customers: 'Pelanggan',
    trips: 'Perjalanan',
    bookings: 'Pemesanan',
    payments: 'Pembayaran',
    documents: 'Dokumen',
    users: 'Pengguna',
    settings: 'Pengaturan',
    logout: 'Keluar',
    
    // Common
    search: 'Cari',
    filter: 'Filter',
    add: 'Tambah',
    edit: 'Edit',
    delete: 'Hapus',
    save: 'Simpan',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    actions: 'Aksi',
    status: 'Status',
    date: 'Tanggal',
    name: 'Nama',
    email: 'Email',
    phone: 'Telepon',
    branch: 'Cabang',
    notes: 'Catatan',
    view: 'Lihat',
    download: 'Unduh',
    upload: 'Unggah',
    approve: 'Setujui',
    reject: 'Tolak',
    
    // Auth
    login: 'Masuk',
    password: 'Kata Sandi',
    loginTitle: 'Selamat Datang',
    loginSubtitle: 'Masuk ke akun Anda',
    
    // Dashboard
    totalLeads: 'Total Prospek',
    leadsThisMonth: 'Prospek Bulan Ini',
    conversionRate: 'Tingkat Konversi',
    totalRevenue: 'Total Pendapatan',
    outstandingPayments: 'Pembayaran Tertunggak',
    tripOccupancy: 'Okupansi Perjalanan',
    topSales: 'Sales Terbaik',
    leadSources: 'Sumber Prospek',
    pendingApprovals: 'Menunggu Persetujuan',
    documentAlerts: 'Peringatan Dokumen (H-30)',
    revenueByBranch: 'Pendapatan per Cabang',
    
    // Leads
    leadName: 'Nama Prospek',
    source: 'Sumber',
    assignedSales: 'Sales Ditugaskan',
    estimatedDeparture: 'Perkiraan Keberangkatan',
    budgetRange: 'Kisaran Anggaran',
    newLead: 'Prospek Baru',
    pipeline: 'Pipeline',
    
    // Customers
    customerName: 'Nama Pelanggan',
    nik: 'NIK',
    passportNumber: 'Nomor Paspor',
    passportExpiry: 'Masa Berlaku Paspor',
    birthDate: 'Tanggal Lahir',
    city: 'Kota',
    newCustomer: 'Pelanggan Baru',
    
    // Trips
    tripCode: 'Kode Perjalanan',
    packageName: 'Nama Paket',
    departureDate: 'Tanggal Keberangkatan',
    returnDate: 'Tanggal Kepulangan',
    airline: 'Maskapai',
    hotelMecca: 'Hotel Mekah',
    hotelMadina: 'Hotel Madinah',
    seatQuota: 'Kuota Kursi',
    seatsRemaining: 'Sisa Kursi',
    tourLeader: 'Pembimbing',
    price: 'Harga',
    newTrip: 'Perjalanan Baru',
    manifest: 'Manifest',
    
    // Bookings
    customer: 'Pelanggan',
    trip: 'Perjalanan',
    sales: 'Sales',
    packagePrice: 'Harga Paket',
    downPayment: 'Uang Muka',
    totalPaid: 'Total Dibayar',
    remainingBalance: 'Sisa Pembayaran',
    paymentStatus: 'Status Pembayaran',
    documentStatus: 'Status Dokumen',
    newBooking: 'Pemesanan Baru',
    
    // Payments
    paymentDate: 'Tanggal Pembayaran',
    amount: 'Jumlah',
    method: 'Metode',
    proofUrl: 'Bukti',
    approvalStatus: 'Status Persetujuan',
    approvedBy: 'Disetujui Oleh',
    newPayment: 'Pembayaran Baru',
    uploadProof: 'Unggah Bukti',
    
    // Documents
    passport: 'Paspor',
    ktp: 'KTP',
    photo: 'Foto',
    vaccination: 'Vaksinasi',
    mahramDoc: 'Dokumen Mahram',
    visaStatus: 'Status Visa',
    ticketStatus: 'Status Tiket',
    
    // Statuses
    new: 'Baru',
    contacted: 'Dihubungi',
    followUp: 'Tindak Lanjut',
    hot: 'Panas',
    deal: 'Deal',
    lost: 'Hilang',
    pending: 'Menunggu',
    partial: 'Sebagian',
    paid: 'Lunas',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    open: 'Buka',
    full: 'Penuh',
    closed: 'Tutup',
    complete: 'Lengkap',
    incomplete: 'Belum Lengkap',
    
    // Roles
    super_admin: 'Super Admin',
    branch_manager: 'Manajer Cabang',
    sales_role: 'Sales',
    marketing: 'Marketing',
    operations: 'Operasional',
    finance: 'Keuangan',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const t = (key) => {
    return translations[language][key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
