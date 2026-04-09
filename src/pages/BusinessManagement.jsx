import React, { useState } from 'react'
import { Eye, CheckCircle, XCircle, Ban, Building2, RefreshCw } from 'lucide-react'
import {
  fetchBusinesses,
  fetchBusinessDetails,
  approveBusiness,
  rejectBusiness,
  toggleBusinessBlock,
} from '../services/api'
import { useApi, useMutation } from '../hooks/useApi'
import {
  Badge, Button, Card, SectionHeader, SearchInput,
  Modal, ConfirmDialog, EmptyState
} from '../components/common/Common'
import './BusinessManagement.css'

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'blocked', 'suspended']
const variantMap = {
  approved: 'approved',
  rejected: 'blocked',
  blocked: 'blocked',
  suspended: 'blocked',
  pending: 'pending',
}

export default function BusinessManagement() {
  const { data: businessList, loading, error, refetch } = useApi(fetchBusinesses)
  const [doApprove] = useMutation(approveBusiness)
  const [doReject] = useMutation(rejectBusiness)
  const [doToggle] = useMutation(toggleBusinessBlock)

  const [businesses, setBusinesses] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [notesInput, setNotesInput] = useState('')

  const displayList = businesses || businessList || []

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openDetail = async (biz) => {
    setSelected(biz)
    setDetailData(null)
    setDetailLoading(true)

    try {
      const data = await fetchBusinessDetails(biz.id)
      setDetailData(data)
    } catch {
      setDetailData(biz)
    } finally {
      setDetailLoading(false)
    }
  }

  const patchLocal = (id, patch) => {
    const src = businesses || businessList || []
    setBusinesses(src.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }

  const handleApprove = async (biz) => {
    try {
      await doApprove(biz.id, notesInput)
      patchLocal(biz.id, { status: 'approved', blocked: false })
      showToast(`"${biz.name}" approved`)
      setSelected(null)
      setConfirm(null)
      setNotesInput('')
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleReject = async (biz) => {
    try {
      await doReject(biz.id, notesInput)
      patchLocal(biz.id, { status: 'rejected', blocked: true })
      showToast(`"${biz.name}" rejected`)
      setSelected(null)
      setConfirm(null)
      setNotesInput('')
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleToggleBlock = async (biz) => {
    try {
      const res = await doToggle(biz.id)
      const newBlocked = res?.blocked ?? !biz.blocked
      const newStatus = newBlocked ? 'blocked' : 'approved'
      patchLocal(biz.id, { blocked: newBlocked, status: newStatus })
      showToast(`"${biz.name}" ${newBlocked ? 'blocked' : 'unblocked'}`)
      setSelected(null)
      setConfirm(null)
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const executeConfirm = () => {
    if (!confirm) return
    if (confirm.action === 'approve') handleApprove(confirm.biz)
    else if (confirm.action === 'reject') handleReject(confirm.biz)
    else handleToggleBlock(confirm.biz)
  }

  const filtered = displayList.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = (b.name || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || b.status === filter
    return matchSearch && matchFilter
  })

  const counts = { total: displayList.length }
  statusOptions.slice(1).forEach(s => {
    counts[s] = displayList.filter(b => b.status === s).length
  })

  if (error) {
    return (
      <div className="biz-page">
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
    <div className="biz-page">
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
        title="Business Management"
        subtitle={`${displayList.length} businesses total`}
        actions={(
          <div className="biz-page__actions">
            <SearchInput value={search} onChange={setSearch} placeholder="Search businesses..." />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {statusOptions.map(s => (
                <button key={s} className={`filter-tab ${filter === s ? 'filter-tab--active' : ''}`} onClick={() => setFilter(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'all' && counts[s] > 0 ? ` (${counts[s]})` : ''}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>Refresh</Button>
          </div>
        )}
      />

      <Card>
        {loading ? (
          <EmptyState icon={<Building2 size={24} />} title="Loading businesses..." description="Fetching from API..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={24} />} title="No businesses found" description="Try adjusting search or filter." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(biz => (
                  <tr key={biz.id}>
                    <td>
                      <div className="biz-cell">
                        <div className="biz-cell__avatar">{(biz.name || '?').charAt(0)}</div>
                        <div>
                          <p className="biz-cell__name">{biz.name}</p>
                          <p className="biz-cell__email">{biz.phone || biz.email || `ID: ${biz.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{biz.category || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{biz.location || '-'}</td>
                    <td style={{ color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
                      {biz.rating ? `* ${Number(biz.rating).toFixed(1)}` : '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                      {biz.registrationDate ? new Date(biz.registrationDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td><Badge variant={variantMap[biz.status] || 'default'}>{biz.status || 'unknown'}</Badge></td>
                    <td>
                      <div className="biz-actions">
                        <button className="icon-action icon-action--view" title="View Details" onClick={() => openDetail(biz)}>
                          <Eye size={15} />
                        </button>

                        {biz.status === 'pending' && (
                          <>
                            <button className="icon-action icon-action--approve" title="Approve" onClick={() => setConfirm({ biz, action: 'approve', label: 'Approve' })}>
                              <CheckCircle size={15} />
                            </button>
                            <button className="icon-action icon-action--reject" title="Reject" onClick={() => setConfirm({ biz, action: 'reject', label: 'Reject' })}>
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {biz.status !== 'pending' && (
                          <button
                            className={`icon-action ${biz.blocked ? 'icon-action--approve' : 'icon-action--suspend'}`}
                            title={biz.blocked ? 'Unblock' : 'Block'}
                            onClick={() => setConfirm({ biz, action: 'block', label: biz.blocked ? 'Unblock' : 'Block' })}
                          >
                            {biz.blocked ? <CheckCircle size={15} /> : <Ban size={15} />}
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

      <Modal open={!!selected} onClose={() => { setSelected(null); setDetailData(null); setNotesInput('') }} title="Business Details" width={520}>
        {selected && (
          <div className="biz-detail">
            {detailLoading ? (
              <EmptyState icon={<Building2 size={20} />} title="Loading details..." description="" />
            ) : (
              <>
                <div className="biz-detail__hero">
                  <div className="biz-detail__avatar">{(selected.name || '?').charAt(0)}</div>
                  <div>
                    <h3 className="biz-detail__name">{selected.name}</h3>
                    <p className="biz-detail__category">{(detailData || selected).category || 'Business'}</p>
                    <Badge variant={variantMap[selected.status] || 'default'}>{selected.status}</Badge>
                  </div>
                </div>

                <div className="biz-detail__grid">
                  {[
                    { label: 'Phone', value: (detailData || selected).phone || '-' },
                    { label: 'Location', value: (detailData || selected).location || '-' },
                    { label: 'Rating', value: (detailData || selected).rating ? `* ${Number((detailData || selected).rating).toFixed(1)}` : '-' },
                    { label: 'Reviews', value: (detailData || selected).reviews || 0 },
                    { label: 'Registered', value: (detailData || selected).registrationDate ? new Date((detailData || selected).registrationDate).toLocaleDateString('en-IN') : '-' },
                    { label: 'Business ID', value: selected.id },
                  ].map((f, i) => (
                    <div key={i} className="biz-detail__field">
                      <p className="biz-detail__field-label">{f.label}</p>
                      <p className="biz-detail__field-value">{f.value}</p>
                    </div>
                  ))}
                </div>

                {(detailData || selected).description && (
                  <div style={{
                    padding: 'var(--space-3)', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)', marginBottom: 'var(--space-4)'
                  }}>
                    {(detailData || selected).description}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-input" value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Add review notes..." />
                </div>

                <div className="biz-detail__actions">
                  {selected.status === 'pending' && (
                    <>
                      <Button variant="success" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(selected)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={() => handleReject(selected)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {selected.status !== 'pending' && (
                    <Button
                      variant={selected.blocked ? 'success' : 'warning'}
                      size="sm"
                      icon={selected.blocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                      onClick={() => handleToggleBlock(selected)}
                    >
                      {selected.blocked ? 'Unblock Business' : 'Block Business'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={executeConfirm}
        title={`${confirm?.label} Business`}
        message={`Are you sure you want to ${confirm?.label?.toLowerCase()} "${confirm?.biz?.name}"?`}
        confirmLabel={confirm?.label}
        variant={confirm?.action === 'approve' ? 'success' : 'danger'}
      />
    </div>
  )
}
