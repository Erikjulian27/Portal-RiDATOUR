import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { 
  Plus, Upload, Trash2, Edit, Image, Mail, Send, 
  RefreshCw, UserPlus, Shield, Clock, CheckCircle, XCircle 
} from 'lucide-react';

const ROLES = [
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

const SettingsPage = () => {
  const { api, token } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  // Slides state
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [slideFormData, setSlideFormData] = useState({ title: '', description: '', order: 0 });
  const [selectedFile, setSelectedFile] = useState(null);

  // Invites state
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    branch: ''
  });

  useEffect(() => {
    fetchSlides();
    fetchInvites();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await api.get('/slides/all');
      setSlides(response.data);
    } catch (error) {
      console.error('Failed to fetch slides');
    } finally {
      setLoadingSlides(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await api.get('/invites');
      setInvites(response.data);
    } catch (error) {
      console.error('Failed to fetch invites');
    } finally {
      setLoadingInvites(false);
    }
  };

  // Slide handlers
  const handleCreateSlide = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', slideFormData.title);
    formData.append('description', slideFormData.description);
    formData.append('order', slideFormData.order);

    try {
      await api.post('/slides', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { title: slideFormData.title, description: slideFormData.description, order: slideFormData.order }
      });
      toast.success('Slide created successfully');
      setSlideDialogOpen(false);
      resetSlideForm();
      fetchSlides();
    } catch (error) {
      toast.error('Failed to create slide');
    }
  };

  const handleToggleSlide = async (slideId, isActive) => {
    try {
      await api.put(`/slides/${slideId}`, { is_active: !isActive });
      toast.success('Slide updated');
      fetchSlides();
    } catch (error) {
      toast.error('Failed to update slide');
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await api.delete(`/slides/${slideId}`);
        toast.success('Slide deleted');
        fetchSlides();
      } catch (error) {
        toast.error('Failed to delete slide');
      }
    }
  };

  const resetSlideForm = () => {
    setSlideFormData({ title: '', description: '', order: slides.length });
    setSelectedFile(null);
  };

  // Invite handlers
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invites', inviteFormData);
      toast.success('Invitation sent successfully');
      setInviteDialogOpen(false);
      resetInviteForm();
      fetchInvites();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/resend`);
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await api.delete(`/invites/${inviteId}`);
        toast.success('Invitation cancelled');
        fetchInvites();
      } catch (error) {
        toast.error('Failed to cancel invitation');
      }
    }
  };

  const resetInviteForm = () => {
    setInviteFormData({ email: '', full_name: '', role: '', branch: '' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge className="badge-pending"><Clock size={12} className="mr-1" /> Pending</Badge>,
      accepted: <Badge className="badge-approved"><CheckCircle size={12} className="mr-1" /> Accepted</Badge>,
      expired: <Badge className="badge-rejected"><XCircle size={12} className="mr-1" /> Expired</Badge>
    };
    return badges[status] || null;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      <div>
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t('settings')}</h2>
        <p className="text-sm text-slate-500 mt-1">Manage login slides and user invitations</p>
      </div>

      <Tabs defaultValue="slides" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="slides" data-testid="tab-slides">
            <Image size={16} className="mr-2" />
            Login Slides
          </TabsTrigger>
          <TabsTrigger value="invites" data-testid="tab-invites">
            <UserPlus size={16} className="mr-2" />
            User Invites
          </TabsTrigger>
        </TabsList>

        {/* Slides Tab */}
        <TabsContent value="slides" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Login Page Slides</CardTitle>
                <CardDescription>
                  Manage the product slides shown on the login page. Recommended size: 800x600px (4:3) or 1200x675px (16:9)
                </CardDescription>
              </div>
              <Dialog open={slideDialogOpen} onOpenChange={(open) => { setSlideDialogOpen(open); if (!open) resetSlideForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-slide-btn">
                    <Plus size={18} className="mr-2" />
                    Add Slide
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Slide</DialogTitle>
                    <DialogDescription>Upload an image for the login page slideshow</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSlide} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Image *</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="hidden"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-500 transition-colors"
                      >
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle size={20} className="text-emerald-500" />
                            <span className="text-sm text-slate-600">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-600">Click to upload image</p>
                            <p className="text-xs text-slate-400">JPG, PNG (max 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Title (optional)</Label>
                      <Input
                        value={slideFormData.title}
                        onChange={(e) => setSlideFormData({...slideFormData, title: e.target.value})}
                        placeholder="e.g., Umrah Exclusive Package"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={slideFormData.description}
                        onChange={(e) => setSlideFormData({...slideFormData, description: e.target.value})}
                        placeholder="e.g., Premium 5-star hotel experience"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={slideFormData.order}
                        onChange={(e) => setSlideFormData({...slideFormData, order: parseInt(e.target.value)})}
                        min="0"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setSlideDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-violet-700 hover:bg-violet-800">
                        Upload Slide
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingSlides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
                </div>
              ) : slides.length === 0 ? (
                <div className="text-center py-12">
                  <Image size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No slides yet. Add your first slide to customize the login page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slides.map((slide) => (
                    <div key={slide.id} className="border rounded-lg overflow-hidden bg-white" data-testid={`slide-${slide.id}`}>
                      <div className="aspect-video bg-slate-100 relative">
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${slide.image_url}?auth=${token}`}
                          alt={slide.title || 'Slide'}
                          className="w-full h-full object-cover"
                        />
                        {!slide.is_active && (
                          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                            <Badge variant="secondary">Disabled</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900 truncate">{slide.title || `Slide ${slide.order + 1}`}</p>
                          <Switch
                            checked={slide.is_active}
                            onCheckedChange={() => handleToggleSlide(slide.id, slide.is_active)}
                          />
                        </div>
                        {slide.description && (
                          <p className="text-sm text-slate-500 truncate mb-3">{slide.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Order: {slide.order}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => handleDeleteSlide(slide.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">User Invitations</CardTitle>
                <CardDescription>
                  Invite new team members by email. They will receive a link to set their password.
                </CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={(open) => { setInviteDialogOpen(open); if (!open) resetInviteForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-700 hover:bg-violet-800" data-testid="invite-user-btn">
                    <UserPlus size={18} className="mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>Send an invitation email to add a new team member</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvite} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={inviteFormData.full_name}
                        onChange={(e) => setInviteFormData({...inviteFormData, full_name: e.target.value})}
                        placeholder="Enter full name"
                        required
                        data-testid="invite-name-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={inviteFormData.email}
                        onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})}
                        placeholder="Enter email address"
                        required
                        data-testid="invite-email-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select value={inviteFormData.role} onValueChange={(v) => setInviteFormData({...inviteFormData, role: v})}>
                        <SelectTrigger data-testid="invite-role-select">
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
                      <Label>Branch</Label>
                      <Select value={inviteFormData.branch || "all"} onValueChange={(v) => setInviteFormData({...inviteFormData, branch: v === "all" ? "" : v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {BRANCHES.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="send-invite-btn">
                        <Send size={16} className="mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingInvites ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-12">
                  <Mail size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No invitations sent yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id} data-testid={`invite-row-${invite.id}`}>
                        <TableCell className="font-medium">{invite.full_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            {invite.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                            <Shield size={12} className="mr-1" />
                            {ROLES.find(r => r.id === invite.role)?.name || invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {invite.branch || 'All Branches'}
                        </TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {invite.invited_by_name}
                        </TableCell>
                        <TableCell className="text-right">
                          {invite.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResendInvite(invite.id)}
                                title="Resend invitation"
                              >
                                <RefreshCw size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteInvite(invite.id)}
                                title="Cancel invitation"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
