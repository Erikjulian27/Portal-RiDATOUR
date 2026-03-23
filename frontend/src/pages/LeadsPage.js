import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Filter, Edit, Trash2, Phone, UserCheck } from 'lucide-react';

const LEAD_STATUSES = ['New', 'Contacted', 'Follow Up', 'Hot', 'Deal', 'Lost'];
const LEAD_SOURCES = ['Meta Ads', 'TikTok', 'Referral', 'WhatsApp'];
const BRANCHES = [
  { id: 'RiDATOUR CCM', name: 'RiDATOUR CCM' },
  { id: 'RiDATOUR Terrace Cinere', name: 'RiDATOUR Terrace Cinere' },
  { id: 'RiDATOUR Makassar', name: 'RiDATOUR Makassar' }
];

const LeadsPage = () => {
  const { api, hasRole, user } = useAuth();
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    source: '',
    campaign_name: '',
    branch: '',
    assigned_sales: '',
    status: 'New',
    estimated_departure: '',
    budget_range: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchSalesUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesUsers = async () => {
    try {
      const response = await api.get('/users/role/sales');
      setSalesUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch sales users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, formData);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/leads', formData);
        toast.success('Lead created successfully');
      }
      resetForm();
      setDialogOpen(false);
      await fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      source: lead.source,
      campaign_name: lead.campaign_name || '',
      branch: lead.branch,
      assigned_sales: lead.assigned_sales || '',
      status: lead.status,
      estimated_departure: lead.estimated_departure || '',
      budget_range: lead.budget_range || '',
      notes: lead.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        toast.success('Lead deleted');
        fetchLeads();
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      phone: '',
      source: '',
      campaign_name: '',
      branch: user?.branch || '',
      assigned_sales: '',
      status: 'New',
      estimated_departure: '',
      budget_range: '',
      notes: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'New': 'badge-new',
      'Contacted': 'badge-contacted',
      'Follow Up': 'badge-followup',
      'Hot': 'badge-hot',
      'Deal': 'badge-deal',
      'Lost': 'badge-lost'
    };
    return classes[status] || '';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
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
    <div className="space-y-6 animate-fade-in" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('leads')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredLeads.length} {t('leads').toLowerCase()}</p>
        </div>
        
        {hasRole(['super_admin', 'branch_manager', 'marketing']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-lead-btn">
                <Plus size={18} className="mr-2" />
                {t('newLead')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingLead ? t('edit') + ' ' + t('leads') : t('newLead')}
                </DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Update lead information' : 'Add a new lead to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('name')} *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      data-testid="lead-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('phone')} *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      data-testid="lead-phone-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('source')} *</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                      <SelectTrigger data-testid="lead-source-select">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES.map(src => (
                          <SelectItem key={src} value={src}>{src}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign</Label>
                    <Input
                      value={formData.campaign_name}
                      onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                      placeholder="e.g., Ramadan 2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('branch')} *</Label>
                    <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                      <SelectTrigger data-testid="lead-branch-select">
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
                    <Label>{t('assignedSales')}</Label>
                    <Select value={formData.assigned_sales} onValueChange={(v) => setFormData({...formData, assigned_sales: v})}>
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
                    <Label>{t('status')}</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger data-testid="lead-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('estimatedDeparture')}</Label>
                    <Input
                      type="date"
                      value={formData.estimated_departure}
                      onChange={(e) => setFormData({...formData, estimated_departure: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('budgetRange')}</Label>
                  <Input
                    value={formData.budget_range}
                    onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                    placeholder="e.g., 30-40 Juta"
                  />
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
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="lead-submit-btn">
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
                data-testid="leads-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="leads-status-filter">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {LEAD_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
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
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('source')}</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('assignedSales')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50" data-testid={`lead-row-${lead.id}`}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {lead.phone}
                    </div>
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell className="text-sm text-slate-500">{lead.branch}</TableCell>
                  <TableCell>
                    {lead.assigned_sales_name ? (
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-500" />
                        {lead.assigned_sales_name}
                      </div>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadgeClass(lead.status)}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(lead)}
                        data-testid={`edit-lead-${lead.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      {hasRole(['super_admin', 'branch_manager', 'marketing']) && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(lead.id)}
                          data-testid={`delete-lead-${lead.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No leads found
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

export default LeadsPage;
