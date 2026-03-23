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
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Plane, Users, Calendar, FileText } from 'lucide-react';

const TRIP_STATUSES = ['Open', 'Full', 'Closed'];

const TripsPage = () => {
  const { api, hasRole } = useAuth();
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manifestDialogOpen, setManifestDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    trip_code: '',
    package_name: '',
    departure_date: '',
    return_date: '',
    airline: '',
    hotel_mecca: '',
    hotel_madina: '',
    seat_quota: 45,
    tour_leader: '',
    price: 0,
    status: 'Open',
    description: ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips');
      setTrips(response.data);
    } catch (error) {
      toast.error('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchManifest = async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/manifest`);
      setManifest(response.data);
      setManifestDialogOpen(true);
    } catch (error) {
      toast.error('Failed to fetch manifest');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, formData);
        toast.success('Trip updated successfully');
      } else {
        await api.post('/trips', formData);
        toast.success('Trip created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      trip_code: trip.trip_code,
      package_name: trip.package_name,
      departure_date: trip.departure_date,
      return_date: trip.return_date,
      airline: trip.airline || '',
      hotel_mecca: trip.hotel_mecca || '',
      hotel_madina: trip.hotel_madina || '',
      seat_quota: trip.seat_quota,
      tour_leader: trip.tour_leader || '',
      price: trip.price,
      status: trip.status,
      description: trip.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.delete(`/trips/${id}`);
        toast.success('Trip deleted');
        fetchTrips();
      } catch (error) {
        toast.error('Failed to delete trip');
      }
    }
  };

  const resetForm = () => {
    setEditingTrip(null);
    setFormData({
      trip_code: '',
      package_name: '',
      departure_date: '',
      return_date: '',
      airline: '',
      hotel_mecca: '',
      hotel_madina: '',
      seat_quota: 45,
      tour_leader: '',
      price: 0,
      status: 'Open',
      description: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Open': 'badge-open',
      'Full': 'badge-full',
      'Closed': 'badge-closed'
    };
    return classes[status] || '';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.trip_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
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
    <div className="space-y-6 animate-fade-in" data-testid="trips-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('trips')}</h2>
          <p className="text-sm text-slate-500 mt-1">{filteredTrips.length} packages</p>
        </div>
        
        {hasRole(['super_admin', 'operations']) && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-700 hover:bg-violet-800" data-testid="add-trip-btn">
                <Plus size={18} className="mr-2" />
                {t('newTrip')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingTrip ? t('edit') + ' ' + t('trips') : t('newTrip')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('tripCode')} *</Label>
                    <Input
                      value={formData.trip_code}
                      onChange={(e) => setFormData({...formData, trip_code: e.target.value})}
                      placeholder="UMR-MAR-2026-01"
                      required
                      data-testid="trip-code-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('packageName')} *</Label>
                    <Input
                      value={formData.package_name}
                      onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                      placeholder="Umrah Reguler Maret 2026"
                      required
                      data-testid="trip-name-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('departureDate')} *</Label>
                    <Input
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('returnDate')} *</Label>
                    <Input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('airline')}</Label>
                    <Input
                      value={formData.airline}
                      onChange={(e) => setFormData({...formData, airline: e.target.value})}
                      placeholder="Garuda Indonesia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('tourLeader')}</Label>
                    <Input
                      value={formData.tour_leader}
                      onChange={(e) => setFormData({...formData, tour_leader: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('hotelMecca')}</Label>
                    <Input
                      value={formData.hotel_mecca}
                      onChange={(e) => setFormData({...formData, hotel_mecca: e.target.value})}
                      placeholder="Hilton Makkah"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('hotelMadina')}</Label>
                    <Input
                      value={formData.hotel_madina}
                      onChange={(e) => setFormData({...formData, hotel_madina: e.target.value})}
                      placeholder="Pullman Zamzam"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('seatQuota')} *</Label>
                    <Input
                      type="number"
                      value={formData.seat_quota}
                      onChange={(e) => setFormData({...formData, seat_quota: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('price')} *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('status')}</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIP_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-violet-700 hover:bg-violet-800" data-testid="trip-submit-btn">
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
                data-testid="trips-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {TRIP_STATUSES.map(s => (
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
                <TableHead>{t('tripCode')}</TableHead>
                <TableHead>{t('packageName')}</TableHead>
                <TableHead>{t('departureDate')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => {
                const occupied = trip.seat_quota - trip.seats_remaining;
                const occupancyPercent = (occupied / trip.seat_quota) * 100;
                return (
                  <TableRow key={trip.id} className="hover:bg-slate-50/50" data-testid={`trip-row-${trip.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Plane size={16} className="text-violet-600" />
                        {trip.trip_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trip.package_name}</p>
                        {trip.airline && (
                          <p className="text-xs text-slate-500">{trip.airline}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {trip.departure_date}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency(trip.price)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-32">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {occupied}/{trip.seat_quota}
                          </span>
                          <span>{Math.round(occupancyPercent)}%</span>
                        </div>
                        <Progress value={occupancyPercent} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeClass(trip.status)}>
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasRole(['super_admin', 'operations']) && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => { setSelectedTrip(trip); fetchManifest(trip.id); }}
                            data-testid={`manifest-trip-${trip.id}`}
                          >
                            <FileText size={16} />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(trip)}
                          data-testid={`edit-trip-${trip.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        {hasRole(['super_admin']) && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => handleDelete(trip.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTrips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No trips found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manifest Dialog */}
      <Dialog open={manifestDialogOpen} onOpenChange={setManifestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {t('manifest')} - {selectedTrip?.package_name}
            </DialogTitle>
          </DialogHeader>
          {manifest && (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Trip Code</p>
                  <p className="font-semibold">{manifest.trip?.trip_code}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Departure</p>
                  <p className="font-semibold">{manifest.trip?.departure_date}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Passengers</p>
                  <p className="font-semibold">{manifest.manifest?.length} / {manifest.trip?.seat_quota}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Passport</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manifest.manifest?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.customer?.full_name}</TableCell>
                      <TableCell>{item.customer?.passport_number || '-'}</TableCell>
                      <TableCell>{item.customer?.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          item.booking?.payment_status === 'Paid' ? 'badge-paid' :
                          item.booking?.payment_status === 'Partial' ? 'badge-partial' : 'badge-pending'
                        }>
                          {item.booking?.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          item.document?.passport && item.document?.ktp && item.document?.photo && item.document?.vaccination
                            ? 'badge-approved' : 'badge-pending'
                        }>
                          {item.document?.passport && item.document?.ktp && item.document?.photo && item.document?.vaccination
                            ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!manifest.manifest || manifest.manifest.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No passengers yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripsPage;
