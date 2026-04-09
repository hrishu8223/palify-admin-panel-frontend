import React, { useState } from 'react'
import { CreditCard, Gift, Infinity, Edit3, CheckCircle, RefreshCw, Repeat2 } from 'lucide-react'
import {
  fetchSubscriptions,
  fetchSubscriptionPlans,
  grantFreeMonths,
  grantLifetimeAccess,
  overrideSubscription,
} from '../services/api'
import { useApi, useMutation } from '../hooks/useApi'
import {
  Badge, Button, Card, SectionHeader, Modal, EmptyState, SearchInput
} from '../components/common/Common'
import './SubscriptionControl.css'

export default function SubscriptionControl() {
  const { data: subsRaw, loading: subsLoading, error: subsError, refetch: refetchSubs } = useApi(fetchSubscriptions)
  const { data: plansRaw, loading: plansLoading, refetch: refetchPlans } = useApi(fetchSubscriptionPlans)

  const [doFreeMonths] = useMutation(grantFreeMonths)
  const [doLifetime] = useMutation(grantLifetimeAccess)
  const [doOverride] = useMutation(overrideSubscription)

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [targetBiz, setTargetBiz] = useState(null)
  const [monthsInput, setMonthsInput] = useState('')
  const [planInput, setPlanInput] = useState('')
  const [toast, setToast] = useState(null)

  const subs = subsRaw || []
  const plans = plansRaw || []

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const closeModal = () => {
    setModal(null)
    setTargetBiz(null)
    setMonthsInput('')
    setPlanInput('')
  }

  const handleFreeMonths = async () => {
    const months = parseInt(monthsInput, 10)
    if (!months || months < 1) return showToast('Enter a valid month count', 'danger')

    try {
      await doFreeMonths(targetBiz.id, months)
      showToast(`${months} free month(s) granted to "${targetBiz.name}"`)
      refetchSubs()
      closeModal()
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleLifetime = async () => {
    try {
      await doLifetime(targetBiz.id)
      showToast(`Lifetime access granted to "${targetBiz.name}"`)
      refetchSubs()
      closeModal()
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleOverride = async () => {
    if (!planInput) return showToast('Select a plan', 'danger')

    try {
      await doOverride(targetBiz.id, Number(planInput))
      showToast(`Plan overridden for "${targetBiz.name}"`)
      refetchSubs()
      closeModal()
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const filtered = subs.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const lifetimeCount = subs.filter(s => s.lifetimeAccess || s.lifetimeAccess == 1).length
  const freeCount = subs.filter(s => (s.freeMonths || 0) > 0).length

  if (subsError) {
    return (
      <div className="sub-page">
        <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
          <p>API Error: {subsError}</p>
          <Button onClick={refetchSubs} icon={<RefreshCw size={14} />} variant="ghost" size="sm">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="sub-page">
      {toast && (
        <div className={`sub-toast sub-toast--${toast.type}`}><CheckCircle size={15} /> {toast.msg}</div>
      )}

      <SectionHeader
        title="Subscription Control"
        subtitle="Live data - GET /api/admin_panel_extra/subscriptions & /subscriptions/plans"
        actions={(
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => { refetchSubs(); refetchPlans() }}>Refresh</Button>
          </div>
        )}
      />

      <div className="sub-summary">
        <div className="sub-summary__card sub-summary__card--primary">
          <CreditCard size={20} />
          <div><p className="sub-summary__value">{plans.length}</p><p className="sub-summary__label">Available Plans</p></div>
        </div>
        <div className="sub-summary__card sub-summary__card--warning">
          <Gift size={20} />
          <div><p className="sub-summary__value">{freeCount}</p><p className="sub-summary__label">Free Month Grants</p></div>
        </div>
        <div className="sub-summary__card sub-summary__card--success">
          <Repeat2 size={20} />
          <div><p className="sub-summary__value">{lifetimeCount}</p><p className="sub-summary__label">Lifetime Access</p></div>
        </div>
        <div className="sub-summary__card sub-summary__card--info" style={{ '--info': '#3B82F6', background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' }}>
          <Repeat2 size={20} />
          <div><p className="sub-summary__value">{subs.length}</p><p className="sub-summary__label">Total Businesses</p></div>
        </div>
      </div>

      <div className="sub-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search businesses..." />
      </div>

      <Card>
        {subsLoading ? (
          <EmptyState icon={<CreditCard size={24} />} title="Loading subscriptions..." description="Calling GET /admin_panel_extra/subscriptions" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CreditCard size={24} />} title="No businesses found" description="Adjust your search." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Current Plan</th>
                  <th>Type</th>
                  <th>Free Months</th>
                  <th>Lifetime</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <div className="sub-biz-cell">
                        <div className="sub-biz-avatar">{(sub.name || 'B').charAt(0)}</div>
                        <span className="sub-biz-name">{sub.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.currentPlan || 'Free'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>{sub.subscriptionType || 'default'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                      {sub.freeMonths > 0 ? `${sub.freeMonths} mo` : '-'}
                    </td>
                    <td>
                      {sub.lifetimeAccess == 1 || sub.lifetimeAccess === true
                        ? <Badge variant="approved">Yes</Badge>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No</span>}
                    </td>
                    <td>
                      <Badge variant={sub.status === 'active' ? 'approved' : 'default'}>{sub.status || 'inactive'}</Badge>
                    </td>
                    <td>
                      <div className="biz-actions">
                        <button className="icon-action icon-action--view" title="Grant Free Months" onClick={() => { setTargetBiz(sub); setModal('free') }}>
                          <Gift size={15} />
                        </button>
                        <button className="icon-action icon-action--approve" title="Grant Lifetime" onClick={() => { setTargetBiz(sub); setModal('lifetime') }}>
                          <Infinity size={15} />
                        </button>
                        <button className="icon-action icon-action--suspend" title="Override Plan" onClick={() => { setTargetBiz(sub); setModal('override') }}>
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {plans.length > 0 && (
        <Card>
          <div className="chart-header">
            <div><h3 className="chart-title">Available Plans</h3><p className="chart-subtitle">GET /api/admin_panel_extra/subscriptions/plans</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Plan</th><th>Price</th><th>Duration</th><th>Features</th></tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.price ? `Rs ${Number(p.price).toLocaleString()}` : 'Free'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{p.duration_days ? `${p.duration_days} days` : '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', maxWidth: 200 }}>{p.features || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modal === 'free'} onClose={closeModal} title="Grant Free Months" width={440}>
        <div className="sub-edit">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Calls <strong>POST /api/admin_panel_extra/subscriptions/{'{businessId}'}/free-months</strong>
          </p>
          <div className="sub-edit__section">
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Business: <span style={{ color: 'var(--primary)' }}>{targetBiz?.name}</span>
            </p>
            <div className="form-group">
              <label className="form-label">Number of Free Months</label>
              <input className="form-input" type="number" min="1" max="24" value={monthsInput} onChange={e => setMonthsInput(e.target.value)} placeholder="e.g. 3" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button icon={<Gift size={14} />} onClick={handleFreeMonths}>Grant Free Months</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'lifetime'} onClose={closeModal} title="Grant Lifetime Access" width={440}>
        <div className="sub-edit">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Calls <strong>POST /api/admin_panel_extra/subscriptions/{'{businessId}'}/lifetime</strong>
          </p>
          <div className="sub-edit__section">
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Business: <span style={{ color: 'var(--primary)' }}>{targetBiz?.name}</span>
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              This will grant permanent lifetime access to this business. Current plan will be preserved.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="success" icon={<Infinity size={14} />} onClick={handleLifetime}>Grant Lifetime</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'override'} onClose={closeModal} title="Override Subscription Plan" width={440}>
        <div className="sub-edit">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Calls <strong>POST /api/admin_panel_extra/subscriptions/{'{businessId}'}/override</strong>
          </p>
          <div className="sub-edit__section">
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Business: <span style={{ color: 'var(--primary)' }}>{targetBiz?.name}</span>
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select New Plan</label>
              {plansLoading
                ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading plans...</p>
                : (
                  <select className="form-select" value={planInput} onChange={e => setPlanInput(e.target.value)}>
                    <option value="">Choose a plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - Rs {p.price || 0}</option>
                    ))}
                  </select>
                )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button icon={<Edit3 size={14} />} onClick={handleOverride}>Override Plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
