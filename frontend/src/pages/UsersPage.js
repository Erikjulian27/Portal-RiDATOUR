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
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';

const ROLES = [
  { id: 'super_admin', name: 'Super Admin' },
  { id: 'branch_manager', name: 'Branch Manager' },
  { id: 'sales', name: 'Sales' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'operations', name: 'Operations' },
  { id: 'finance', name: 'Finance' }
];

const BRANCHES = [
  { id: 'RiDATOUR CCM', name: 'RiDATOUR CCM' },
  { id: 'RiDATOUR Terrace Cinere', name: 'RiDATOUR Terrace Cinere' },
  { id: 'RiDATOUR Makassar', name: 'RiDATOUR Makassar' }
];

const UsersPage = () => {
  const { api, hasRole, user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '',
    branch: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        await api.post('/auth/register', formData);
        toast.success('User created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      full_name: u.full_name,
      role: u.role,
      branch: u.branch || '',
      phone: u.phone || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: '',
      branch: '',
      phone: ''
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'super_admin': 'bg-violet-100 text-violet-700 border-violet-200',
      'branch_manager': 'bg-blue-100 text-blue-700 border-blue-200',
      'sales': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'marketing': 'bg-amber-100 text-amber-700 border-amber-200',
      'operations': 'bg-slate-100 text-slate-700 border-slate-200',
      'finance': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return colors[role] || '';
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('users')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredUsers.length} team members</p>
        </div>
        
        {hasRole(['super_admin']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-user-btn">
                <Plus size={18} className="mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t('name')} *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                    data-testid="user-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('email')} *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingUser}
                    data-testid="user-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('password')} {editingUser ? '' : '*'}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                    data-testid="user-password-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                      <SelectTrigger data-testid="user-role-select">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('branch')}</Label>
                    <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Branch (All)</SelectItem>
                        {BRANCHES.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="user-submit-btn">
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
              placeholder={`${t('search')} by name or email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="users-search"
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
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>{t('branch')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/50" data-testid={`user-row-${u.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                        <span className="text-violet-700 font-semibold text-sm">
                          {u.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {u.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        {u.phone}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(u.role)}>
                      <Shield size={12} className="mr-1" />
                      {ROLES.find(r => r.id === u.role)?.name || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{u.branch || 'All Branches'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.is_active ? 'badge-approved' : 'badge-rejected'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasRole(['super_admin']) && u.id !== user.id && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(u)}
                          data-testid={`edit-user-${u.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No users found
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

export default UsersPage;
