import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Users, TrendingUp, DollarSign, AlertTriangle, Plane, 
  FileWarning, CreditCard, Target, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardPage = () => {
  const { api, hasRole } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const COLORS = ['#7c3aed', '#d97706', '#10b981', '#3b82f6', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  const leadSourceData = stats?.lead_sources ? 
    Object.entries(stats.lead_sources).map(([name, value]) => ({ name, value })) : [];

  const revenueData = stats?.revenue_by_branch ? 
    Object.entries(stats.revenue_by_branch).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow" data-testid="stat-total-leads">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{t('totalLeads')}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.leads?.total || 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.leads?.this_month || 0} {t('leadsThisMonth').toLowerCase()}
                </p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <Users className="text-violet-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow" data-testid="stat-conversion-rate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{t('conversionRate')}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.leads?.conversion_rate || 0}%</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} /> From leads to deal
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="text-emerald-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow" data-testid="stat-total-revenue">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{t('totalRevenue')}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.bookings?.revenue || 0)}</p>
                <p className="text-xs text-slate-500 mt-1">{stats?.bookings?.total || 0} bookings</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-amber-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow" data-testid="stat-outstanding">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{t('outstandingPayments')}</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(stats?.bookings?.outstanding || 0)}</p>
                <p className="text-xs text-slate-500 mt-1">{stats?.pending_payments || 0} pending approval</p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                <CreditCard className="text-rose-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card data-testid="chart-lead-sources">
          <CardHeader>
            <CardTitle className="text-lg font-heading">{t('leadSources')}</CardTitle>
          </CardHeader>
          <CardContent>
            {leadSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {leadSourceData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Branch */}
        {hasRole(['super_admin']) && revenueData.length > 0 && (
          <Card data-testid="chart-revenue-branch">
            <CardHeader>
              <CardTitle className="text-lg font-heading">{t('revenueByBranch')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Lead Pipeline */}
        <Card data-testid="lead-pipeline">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.leads?.by_status && Object.entries(stats.leads.by_status).map(([status, count]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{status}</span>
                  <span className="text-sm font-medium text-slate-900">{count}</span>
                </div>
                <Progress 
                  value={(count / (stats.leads.total || 1)) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trip Occupancy */}
        <Card data-testid="trip-occupancy">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Plane size={20} className="text-violet-600" />
              {t('tripOccupancy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.trip_occupancy?.length > 0 ? (
              stats.trip_occupancy.map((trip) => (
                <div key={trip.trip_code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{trip.package_name}</p>
                      <p className="text-xs text-slate-500">{trip.trip_code}</p>
                    </div>
                    <Badge variant="outline" className={trip.percentage >= 80 ? 'badge-hot' : 'badge-open'}>
                      {trip.occupied}/{trip.total}
                    </Badge>
                  </div>
                  <Progress value={trip.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No active trips</p>
            )}
          </CardContent>
        </Card>

        {/* Top Sales */}
        <Card data-testid="top-sales">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <BarChart3 size={20} className="text-amber-600" />
              {t('topSales')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.sales_performance?.length > 0 ? (
              <div className="space-y-4">
                {stats.sales_performance.map((sales, index) => (
                  <div key={sales.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{sales.name}</p>
                      <p className="text-xs text-slate-500">{sales.bookings} bookings</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(sales.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No sales data</p>
            )}
          </CardContent>
        </Card>

        {/* Document Alerts */}
        <Card data-testid="document-alerts">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileWarning size={20} className="text-rose-600" />
              {t('documentAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.h30_alerts?.length > 0 ? (
              <div className="space-y-3">
                {stats.h30_alerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                    <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{alert.customer_name}</p>
                      <p className="text-xs text-slate-500">{alert.trip} • H-{alert.days_until_departure}</p>
                    </div>
                    <Badge className="badge-pending">Incomplete</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-emerald-600">All documents complete!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
