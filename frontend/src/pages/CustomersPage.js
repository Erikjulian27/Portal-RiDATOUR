import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const BRANCHES = [
  { id: 'RiDATOUR CCM', name: 'RiDATOUR CCM' },
  { id: 'RiDATOUR Terrace Cinere', name: 'RiDATOUR Terrace Cinere' },
  { id: 'RiDATOUR Makassar', name: 'RiDATOUR Makassar' }
];

const CustomersPage = () => {
  const { api, hasRole, user } = useAuth();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    nik: '',
    passport_number: '',
    passport_expiry: '',
    birth_date: '',
    phone: '',
    email: '',
    city: '',
    branch: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      nik: customer.nik || '',
      passport_number: customer.passport_number || '',
      passport_expiry: customer.passport_expiry || '',
      birth_date: customer.birth_date || '',
      phone: customer.phone,
      email: customer.email || '',
      city: customer.city || '',
      branch: customer.branch,
      notes: customer.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      nik: '',
      passport_number: '',
      passport_expiry: '',
      birth_date: '',
      phone: '',
      email: '',
      city: '',
      branch: user?.branch || '',
      notes: ''
    });
  };

  const filteredCustomers = customers.filter(customer => 
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.passport_number && customer.passport_number.includes(searchTerm))
  );

  const isPassportExpiring = (expiry) => {
    if (!expiry) return false;
    const expiryDate = new Date(expiry);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiryDate <= sixMonthsFromNow;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('customers')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredCustomers.length} Jamaah</p>
        </div>
        
        {hasRole(['super_admin', 'branch_manager', 'sales', 'marketing']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-customer-btn">
                <Plus size={18} className="mr-2" />
                {t('newCustomer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingCustomer ? t('edit') + ' ' + t('customers') : t('newCustomer')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('customerName')} *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                      data-testid="customer-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('phone')} *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      data-testid="customer-phone-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('nik')}</Label>
                    <Input
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      placeholder="16 digit NIK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('passportNumber')}</Label>
                    <Input
                      value={formData.passport_number}
                      onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('passportExpiry')}</Label>
                    <Input
                      type="date"
                      value={formData.passport_expiry}
                      onChange={(e) => setFormData({...formData, passport_expiry: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('birthDate')}</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('city')}</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('branch')} *</Label>
                  <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                    <SelectTrigger data-testid="customer-branch-select">
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
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="customer-submit-btn">
                    {t('save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder={`${t('search')} by name, phone, or passport...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="customers-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>{t('customerName')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('passportNumber')}</TableHead>
                <TableHead>{t('passportExpiry')}</TableHead>
                <TableHead>{t('city')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/50" data-testid={`customer-row-${customer.id}`}>
                  <TableCell className="font-medium">
                    <div>
                      {customer.full_name}
                      {customer.email && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Mail size={12} />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>{customer.passport_number || '-'}</TableCell>
                  <TableCell>
                    {customer.passport_expiry ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={isPassportExpiring(customer.passport_expiry) ? 'text-rose-500' : 'text-slate-400'} />
                        <span className={isPassportExpiring(customer.passport_expiry) ? 'text-rose-600 font-medium' : ''}>
                          {customer.passport_expiry}
                        </span>
                        {isPassportExpiring(customer.passport_expiry) && (
                          <Badge className="badge-pending text-xs">Expiring</Badge>
                        )}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {customer.city && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {customer.city}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{customer.branch}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(customer)}
                        data-testid={`edit-customer-${customer.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      {hasRole(['super_admin']) && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersPage;
