import React, { useState, useEffect, useRef } from 'react';
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
import { Plus, Search, Filter, Check, X, Upload, Eye } from 'lucide-react';

const PaymentsPage = () => {
  const { api, hasRole, token } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    booking_id: '',
    amount: 0,
    method: 'Transfer',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/bookings')
      ]);
      setPayments(paymentsRes.data);
      setBookings(bookingsRes.data.filter(b => b.payment_status !== 'Paid'));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded successfully');
      resetForm();
      setDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleApprove = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}/approve`);
      toast.success('Payment approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve payment');
    }
  };

  const handleReject = async (paymentId) => {
    if (window.confirm('Are you sure you want to reject this payment?')) {
      try {
        await api.put(`/payments/${paymentId}/reject`);
        toast.success('Payment rejected');
        fetchData();
      } catch (error) {
        toast.error('Failed to reject payment');
      }
    }
  };

  const handleUploadProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      await api.post(`/payments/${selectedPayment.id}/upload-proof`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Proof uploaded successfully');
      setUploadDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to upload proof');
    }
  };

  const resetForm = () => {
    setFormData({
      booking_id: '',
      amount: 0,
      method: 'Transfer',
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

  const getApprovalStatusBadgeClass = (status) => {
    const classes = {
      'Pending': 'badge-pending',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected'
    };
    return classes[status] || '';
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.booking_customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || payment.approval_status === statusFilter;
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
    <div className="space-y-6 animate-fade-in" data-testid="payments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('payments')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredPayments.length} payments</p>
        </div>
        
        {hasRole(['super_admin', 'branch_manager', 'sales', 'finance']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-payment-btn">
                <Plus size={18} className="mr-2" />
                {t('newPayment')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">{t('newPayment')}</DialogTitle>
                <DialogDescription>Record a new payment for a booking</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t('bookings')} *</Label>
                  <Select value={formData.booking_id} onValueChange={(v) => setFormData({...formData, booking_id: v})}>
                    <SelectTrigger data-testid="payment-booking-select">
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.customer_name} - {b.trip_name} ({formatCurrency(b.remaining_balance)} remaining)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('amount')} *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    min="1"
                    required
                    data-testid="payment-amount-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('method')}</Label>
                  <Select value={formData.method} onValueChange={(v) => setFormData({...formData, method: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('notes')}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="payment-submit-btn">
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
                data-testid="payments-search"
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
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
                <TableHead>{t('paymentDate')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('method')}</TableHead>
                <TableHead>{t('proofUrl')}</TableHead>
                <TableHead>{t('approvalStatus')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-slate-50/50" data-testid={`payment-row-${payment.id}`}>
                  <TableCell className="font-medium">{payment.booking_customer_name || 'N/A'}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    {payment.proof_url ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/files/${payment.proof_url}?auth=${token}`, '_blank')}
                      >
                        <Eye size={16} className="mr-1" /> View
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedPayment(payment); setUploadDialogOpen(true); }}
                      >
                        <Upload size={16} className="mr-1" /> Upload
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getApprovalStatusBadgeClass(payment.approval_status)}>
                      {payment.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.approval_status === 'Pending' && hasRole(['super_admin', 'finance']) && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleApprove(payment.id)}
                          data-testid={`approve-payment-${payment.id}`}
                        >
                          <Check size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleReject(payment.id)}
                          data-testid={`reject-payment-${payment.id}`}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )}
                    {payment.approval_status !== 'Pending' && payment.approved_by_name && (
                      <span className="text-xs text-slate-500">
                        by {payment.approved_by_name}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{t('uploadProof')}</DialogTitle>
            <DialogDescription>Upload payment proof document</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUploadProof}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 transition-colors"
            >
              <Upload size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">Click to upload proof of payment</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, or PDF</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
