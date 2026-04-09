import React, { useState } from 'react'
import { Ban, CheckCircle, Eye, Users, RefreshCw } from 'lucide-react'
import { fetchUsers, updateUserStatus } from '../services/api'
import { useApi, useMutation } from '../hooks/useApi'
import {
  Badge, Button, Card, SectionHeader, SearchInput,
  Modal, ConfirmDialog, EmptyState
} from '../components/common/Common'
import './UserManagement.css'

const normalizeStatus = (raw) => {
  const s = String(raw || '').toLowerCase()
  return s === 'active' ? 'Active' : 'Inactive'
}

export default function UserManagement() {
  const { data: usersRaw, loading, error, refetch } = useApi(fetchUsers)
  const [doUpdate] = useMutation(updateUserStatus)

  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const rawList = (users || usersRaw || []).map(u => ({
    ...u,
    status: normalizeStatus(u.status),
  }))

  const filtered = rawList.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = (u.full_name || '').toLowerCase().includes(q) ||
      (u.email_address || '').toLowerCase().includes(q)
    const matchFilter = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchFilter
  })

  const stats = {
    total: rawList.length,
    active: rawList.filter(u => u.status === 'Active').length,
    inactive: rawList.filter(u => u.status === 'Inactive').length,
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleStatusUpdate = async (userId, isActive, userName) => {
    try {
      await doUpdate(userId, isActive)
      const newStatus = isActive === 1 ? 'Active' : 'Inactive'
      const src = users || usersRaw || []
      setUsers(src.map(u => (u.id === userId ? { ...u, status: newStatus } : u)))
      showToast(`${userName} status updated to ${newStatus}`)
      setSelectedUser(null)
      setConfirm(null)
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  if (error) {
    return (
      <div className="user-page">
        <Card>
          <div style={{ color: 'var(--danger)', padding: 'var(--space-4)' }}>
            <p style={{ marginBottom: 'var(--space-3)' }}>[!] API Error: {error}</p>
            <Button onClick={refetch} icon={<RefreshCw size={14} />} variant="ghost" size="sm">Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="user-page">
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 12,
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: 'white', fontSize: 'var(--text-sm)', fontWeight: 500,
          boxShadow: 'var(--shadow-lg)'
        }}>
          {toast.msg}
        </div>
      )}

      <SectionHeader
        title="User Management"
        subtitle="Live data from GET /admin/users"
      />

      <div className="user-stats">
        {[
          { label: 'Total', value: stats.total, mod: '' },
          { label: 'Active', value: stats.active, mod: 'user-stat--success', filter: 'Active' },
          { label: 'Inactive', value: stats.inactive, mod: 'user-stat--danger', filter: 'Inactive' },
        ].map((s, i) => (
          <div
            key={i}
            className={`user-stat ${s.mod} ${filterStatus === (s.filter || 'all') ? 'user-stat--selected' : ''}`}
            onClick={() => setFilter(s.filter || 'all')}
            style={{ cursor: 'pointer' }}
          >
            <span className="user-stat__value">{s.value}</span>
            <span className="user-stat__label">{s.label}</span>
          </div>
        ))}
        <div className="user-stat">
          <span className="user-stat__value" style={{ fontSize: 'var(--text-xs)' }}>GET /admin/users</span>
          <span className="user-stat__label">API Source</span>
        </div>
      </div>

      <div className="user-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
        <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>Refresh</Button>
      </div>

      <Card>
        {loading ? (
          <EmptyState icon={<Users size={24} />} title="Loading users..." description="Calling GET /admin/users" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No users found" description="Adjust your search or filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Total Bookings</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell__avatar">{(user.full_name || '?').charAt(0)}</div>
                        <div>
                          <p className="user-cell__name">{user.full_name || '-'}</p>
                          <p className="user-cell__email">{user.email_address}</p>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant="default">{user.plan || 'Free'}</Badge></td>
                    <td><span className="user-booking-count">{user.total_bookings || 0} bookings</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td>
                      <Badge variant={user.status === 'Active' ? 'approved' : 'blocked'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="biz-actions">
                        <button className="icon-action icon-action--view" title="View" onClick={() => setSelectedUser(user)}>
                          <Eye size={15} />
                        </button>
                        {user.status === 'Active' ? (
                          <button className="icon-action icon-action--reject" title="Deactivate" onClick={() => setConfirm({ user, isActive: 0, label: 'Deactivate' })}>
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button className="icon-action icon-action--approve" title="Activate" onClick={() => setConfirm({ user, isActive: 1, label: 'Activate' })}>
                            <CheckCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Customer Details" width={480}>
        {selectedUser && (
          <div className="biz-detail">
            <div className="biz-detail__hero">
              <div className="biz-detail__avatar" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                {(selectedUser.full_name || '?').charAt(0)}
              </div>
              <div>
                <h3 className="biz-detail__name">{selectedUser.full_name || '-'}</h3>
                <p className="biz-detail__category">{selectedUser.email_address}</p>
                <Badge variant={selectedUser.status === 'Active' ? 'approved' : 'blocked'}>{selectedUser.status}</Badge>
              </div>
            </div>
            <div className="biz-detail__grid">
              {[
                { label: 'Plan', value: selectedUser.plan || 'Free' },
                { label: 'Total Bookings', value: selectedUser.total_bookings || 0 },
                { label: 'Joined', value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-IN') : '-' },
                { label: 'User ID', value: selectedUser.id },
              ].map((f, i) => (
                <div key={i} className="biz-detail__field">
                  <p className="biz-detail__field-label">{f.label}</p>
                  <p className="biz-detail__field-value">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="biz-detail__actions">
              {selectedUser.status === 'Active' ? (
                <Button variant="danger" size="sm" icon={<Ban size={14} />} onClick={() => handleStatusUpdate(selectedUser.id, 0, selectedUser.full_name)}>
                  Deactivate Account
                </Button>
              ) : (
                <Button variant="success" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleStatusUpdate(selectedUser.id, 1, selectedUser.full_name)}>
                  Activate Account
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleStatusUpdate(confirm.user.id, confirm.isActive, confirm.user.full_name)}
        title={`${confirm?.label} Account`}
        message={`Are you sure you want to ${confirm?.label?.toLowerCase()} "${confirm?.user?.full_name}"?`}
        confirmLabel={confirm?.label}
        variant={confirm?.isActive === 1 ? 'success' : 'danger'}
      />
    </div>
  )
}
