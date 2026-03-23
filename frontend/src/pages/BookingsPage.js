import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Filter, Eye, Trash2, Calendar, CreditCard, FileText } from 'lucide-react';

const BRANCHES = [
  { id: 'RiDATOUR CCM', name: 'RiDATOUR CCM' },
  { id: 'RiDATOUR Terrace Cinere', name: 'RiDATOUR Terrace Cinere' },
  { id: 'RiDATOUR Makassar', name: 'RiDATOUR Makassar' }
];

const BookingsPage = () => {
  const { api, hasRole, user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    trip_id: '',
    sales_id: '',
    branch: '',
    package_price: 0,
    down_payment: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, customersRes, tripsRes, salesRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/customers'),
        api.get('/trips?status=Open'),
        api.get('/users/role/sales')
      ]);
      setBookings(bookingsRes.data);
      setCustomers(customersRes.data);
      setTrips(tripsRes.data);
      setSalesUsers(salesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.down_payment <= 0) {
      toast.error('Down payment is required');
      return;
    }
    try {
      await api.post('/bookings', formData);
      toast.success('Booking created successfully');
      resetForm();
      setDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleTripSelect = (tripId) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setFormData({
        ...formData,
        trip_id: tripId,
        package_price: trip.price
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/bookings/${id}`);
        toast.success('Booking deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete booking');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      trip_id: '',
      sales_id: user?.role === 'sales' ? user.id : '',
      branch: user?.branch || '',
      package_price: 0,
      down_payment: 0,
      notes: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPaymentStatusBadgeClass = (status) => {
    const classes = {
      'Pending': 'badge-pending',
      'Partial': 'badge-partial',
      'Paid': 'badge-paid'
    };
    return classes[status] || '';
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = (booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (booking.trip_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="bookings-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('bookings')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredBookings.length} bookings</p>
        </div>
        
        {hasRole(['super_admin', 'branch_manager', 'sales']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-booking-btn">
                <Plus size={18} className="mr-2" />
                {t('newBooking')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{t('newBooking')}</DialogTitle>
                <DialogDescription>Create a new booking for a customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t('customer')} *</Label>
                  <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                    <SelectTrigger data-testid="booking-customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name} - {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('trip')} *</Label>
                  <Select value={formData.trip_id} onValueChange={handleTripSelect}>
                    <SelectTrigger data-testid="booking-trip-select">
                      <SelectValue placeholder="Select trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map(tr => (
                        <SelectItem key={tr.id} value={tr.id}>
                          {tr.package_name} - {tr.departure_date} ({tr.seats_remaining} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('branch')} *</Label>
                    <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('sales')} *</Label>
                    <Select value={formData.sales_id} onValueChange={(v) => setFormData({...formData, sales_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sales" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesUsers.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('packagePrice')}</Label>
                    <Input
                      type="number"
                      value={formData.package_price}
                      onChange={(e) => setFormData({...formData, package_price: parseFloat(e.target.value)})}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('downPayment')} *</Label>
                    <Input
                      type="number"
                      value={formData.down_payment}
                      onChange={(e) => setFormData({...formData, down_payment: parseFloat(e.target.value)})}
                      min="1"
                      required
                      data-testid="booking-dp-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('notes')}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="booking-submit-btn">
                    {t('save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder={`${t('search')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="bookings-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('trip')}</TableHead>
                <TableHead>{t('sales')}</TableHead>
                <TableHead>{t('totalPaid')}</TableHead>
                <TableHead>{t('remainingBalance')}</TableHead>
                <TableHead>{t('paymentStatus')}</TableHead>
                <TableHead>{t('documentStatus')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-slate-50/50" data-testid={`booking-row-${booking.id}`}>
                  <TableCell className="font-medium">{booking.customer_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {booking.trip_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{booking.sales_name}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    {formatCurrency(booking.total_paid)}
                  </TableCell>
                  <TableCell className={booking.remaining_balance > 0 ? 'text-rose-600 font-medium' : ''}>
                    {formatCurrency(booking.remaining_balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPaymentStatusBadgeClass(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={booking.document_status === 'Complete' ? 'badge-approved' : 'badge-pending'}>
                      {booking.document_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => { setSelectedBooking(booking); setDetailDialogOpen(true); }}
                        data-testid={`view-booking-${booking.id}`}
                      >
                        <Eye size={16} />
                      </Button>
                      {hasRole(['super_admin']) && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(booking.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">{t('customer')}</p>
                  <p className="font-semibold">{selectedBooking.customer_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">{t('trip')}</p>
                  <p className="font-semibold">{selectedBooking.trip_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">{t('packagePrice')}</p>
                  <p className="font-semibold">{formatCurrency(selectedBooking.package_price)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-500">{t('totalPaid')}</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(selectedBooking.total_paid)}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-lg">
                  <p className="text-sm text-slate-500">{t('remainingBalance')}</p>
                  <p className="font-semibold text-rose-600">{formatCurrency(selectedBooking.remaining_balance)}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={18} className="text-violet-600" />
                    <p className="font-medium">{t('paymentStatus')}</p>
                  </div>
                  <Badge variant="outline" className={getPaymentStatusBadgeClass(selectedBooking.payment_status)}>
                    {selectedBooking.payment_status}
                  </Badge>
                </div>
                <div className="flex-1 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-violet-600" />
                    <p className="font-medium">{t('documentStatus')}</p>
                  </div>
                  <Badge variant="outline" className={selectedBooking.document_status === 'Complete' ? 'badge-approved' : 'badge-pending'}>
                    {selectedBooking.document_status}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">{t('branch')}</p>
                <p className="font-medium">{selectedBooking.branch}</p>
                <p className="text-sm text-slate-500 mt-2">{t('sales')}</p>
                <p className="font-medium">{selectedBooking.sales_name}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsPage;
