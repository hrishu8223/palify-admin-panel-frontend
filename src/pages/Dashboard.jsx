import React, { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { DollarSign, Users, Building2, BookOpen, Download, RefreshCw, Star } from 'lucide-react'
import { BASE_URL, fetchDashboard, fetchAnalytics, fetchRevenue, fetchRevenueReport, fetchBusinesses } from '../services/api'
import { useApi } from '../hooks/useApi'
import { StatCard, Card, Button, SectionHeader, Badge } from '../components/common/Common'
import './Dashboard.css'

const COLORS = ['#7C3AED', '#10B981', '#3B82F6', '#F59E0B']

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7_days' },
  { label: '30 Days', value: '30_days' },
  { label: '90 Days', value: '90_days' },
  { label: '6 Months', value: '6_months' },
  { label: '1 Year', value: '1_year' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="chart-tooltip__item" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100
            ? `Rs ${Number(p.value).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [exportPeriod, setExportPeriod] = useState('30_days')
  const [exporting, setExporting] = useState(false)

  const { data: dashboard, loading: dashLoad, error: dashErr, refetch: refetchDash } = useApi(fetchDashboard)
  const { data: analyticsRaw, loading: analLoad, refetch: refetchAnal } = useApi(fetchAnalytics)
  const { data: revenueList, loading: revLoad } = useApi(fetchRevenue)
  const { data: businessList, loading: bizLoad, refetch: refetchBiz } = useApi(fetchBusinesses)

  const isLoading = dashLoad || analLoad
  const stats = dashboard || {}
  const anal = analyticsRaw?.data || analyticsRaw || {}
  const businesses = Array.isArray(businessList) ? businessList : []

  const categoryCounts = businesses.reduce((acc, business) => {
    const category = String(business.category || 'Other').trim() || 'Other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  const categoryData = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const categoryChartData = categoryData.map(item => ({
    name: item.name,
    value: businesses.length ? Math.round((item.count / businesses.length) * 100) : 0,
    count: item.count,
  }))

  const revenueChartData = Array.isArray(revenueList)
    ? revenueList.slice(0, 8).map(r => ({
        month: String(r.business_name || '').substring(0, 10),
        revenue: Number(r.gross_revenue || 0),
      }))
    : []

  const handleExport = async () => {
    setExporting(true)
    try {
      const report = await fetchRevenueReport(exportPeriod)
      const rows = report.rows || []

      const header = 'Date,Business,Customer,Amount,Status\n'
      const body = rows.map(r => (
        [
          new Date(r.created_at).toLocaleDateString('en-IN'),
          `"${r.business_name || ''}"`,
          `"${r.customer_name || ''}"`,
          r.total_amount || 0,
          r.status || '',
        ].join(',')
      )).join('\n')

      const csv = header + body
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `revenue_report_${exportPeriod}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export failed: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (dashErr) {
    const isNetworkError = dashErr.includes('Cannot connect to server')
    return (
      <div className="dashboard">
        <div className="api-error">
          <p>{isNetworkError ? 'Could not connect to backend:' : 'Backend request failed:'} <strong>{dashErr}</strong></p>
          <p>
            {isNetworkError
              ? <>Make sure the backend is running at <code>{BASE_URL}</code></>
              : <>The backend is reachable, but the request failed. Check the backend logs/API response for this endpoint.</>}
          </p>
          <Button onClick={refetchDash} icon={<RefreshCw size={14} />} variant="ghost" size="sm">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <SectionHeader
        title="Platform Overview"
        subtitle="Live data from backend API"
        actions={(
          <div className="dashboard__export">
            {isLoading && <span className="loading-pulse">Loading live data...</span>}
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => { refetchDash(); refetchAnal(); refetchBiz() }}>Refresh</Button>
            <select className="form-select dashboard__export-select" value={exportPeriod} onChange={e => setExportPeriod(e.target.value)}>
              {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <Button icon={<Download size={15} />} onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        )}
      />

      <div className="dashboard__stats">
        <StatCard
          label="Total Revenue"
          value={isLoading ? '...' : `Rs ${Number(stats.totalRevenue || anal.totalRevenue || 0).toLocaleString()}`}
          color="primary"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Registered Customers"
          value={isLoading ? '...' : (stats.totalUsers || anal.customers || 0)}
          color="success"
          icon={<Users size={18} />}
        />
        <StatCard
          label="Registered Businesses"
          value={isLoading ? '...' : (stats.totalProviders || 0)}
          color="info"
          icon={<Building2 size={18} />}
        />
        <StatCard
          label="Total Bookings"
          value={isLoading ? '...' : (stats.totalBookings || anal.totalBookings || 0)}
          color="warning"
          icon={<BookOpen size={18} />}
        />
      </div>

      <div className="dashboard__secondary">
        {[
          { label: "Today's Revenue", value: `Rs ${Number(stats.todayRevenue || 0).toLocaleString()}` },
          { label: "Today's Bookings", value: stats.todayBookings || 0 },
          { label: 'Avg Rating', value: Number(stats.avgRating || anal.avgRating || 0).toFixed(1), star: true },
          { label: 'Data Source', value: <Badge variant="approved">Live API</Badge> },
        ].map((s, i) => (
          <div key={i} className="secondary-stat">
            <span className="secondary-stat__label">{s.label}</span>
            <span className={`secondary-stat__value ${s.star ? 'secondary-stat__value--star' : ''}`}>
              {s.star && <Star size={13} fill="currentColor" />} {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="dashboard__charts">
        <Card className="dashboard__chart-card dashboard__chart-card--main">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Revenue by Business</h3>
              <p className="chart-subtitle">Source: GET /admin/revenue</p>
            </div>
          </div>
          {revLoad ? (
            <div className="chart-loading">Loading...</div>
          ) : revenueChartData.length === 0 ? (
            <div className="chart-loading">No revenue data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6B6585', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B6585', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `Rs ${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#rg)" dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6, fill: '#A78BFA' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="dashboard__chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Business Categories</h3>
              <p className="chart-subtitle">Distribution overview</p>
            </div>
          </div>
          {bizLoad ? (
            <div className="chart-loading">Loading...</div>
          ) : categoryChartData.length === 0 ? (
            <div className="chart-loading">No business category data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(value, _, item) => [`${item?.payload?.count || 0} businesses (${value}%)`, '']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" iconSize={8} formatter={value => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  )
}
