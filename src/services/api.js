// ============================================================
// PALIFY ADMIN - API Service Layer (FULLY CONNECTED)
// Base URL: http://localhost:5000/api
// ============================================================

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getToken = () => localStorage.getItem('palify_admin_token')

const unwrapData = (payload) => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return payload

  const candidates = [
    payload.data,
    payload.result,
    payload.results,
    payload.rows,
    payload.items,
    payload.list,
    payload.businesses,
    payload.users,
    payload.subscriptions,
    payload.plans,
  ]

  const collection = candidates.find(Array.isArray)
  if (collection) return collection

  return payload
}

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
})

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, opts)
  } catch {
    const error = new Error(`Cannot connect to server at ${BASE_URL}.`)
    error.isNetworkError = true
    throw error
  }

  if (res.status === 401) {
    localStorage.removeItem('palify_admin_token')
    localStorage.removeItem('palify_admin_user')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  const rawText = await res.text()
  let json = null

  if (rawText) {
    try {
      json = JSON.parse(rawText)
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    const serverMessage =
      json?.message ||
      json?.msg ||
      json?.error ||
      (rawText && !rawText.startsWith('<') ? rawText : '')

    if (res.status >= 500) {
      throw new Error(serverMessage || `Backend server error (${res.status})`)
    }

    throw new Error(serverMessage || `API Error (${res.status})`)
  }

  if (!rawText) return null
  if (json) return unwrapData(json)

  throw new Error(`Server returned non-JSON response (status ${res.status})`)
}

// AUTH
export const loginAdmin = (email_address, password) =>
  api('POST', '/login/login', { email_address, password })

// DASHBOARD
export const fetchDashboard = () => api('GET', '/admin/dashboard')

// ANALYTICS
export const fetchAnalytics = () => api('POST', '/analytics/getAnalytics')

// REVENUE
export const fetchRevenue = () => api('GET', '/admin/revenue')

// PAYOUTS
export const fetchPayouts = () => api('GET', '/admin/payouts')

// USERS
export const fetchUsers = () => api('GET', '/admin/users')

// PUT /admin/users/:id/status  { is_active: 0|1 }
export const updateUserStatus = (id, is_active) =>
  api('PUT', `/admin/users/${id}/status`, { is_active })

// BOOKINGS
export const fetchBookings = () => api('GET', '/admin/bookings')

// PUT /admin/bookings/:id/status  { status }
export const updateBookingStatus = (id, status) =>
  api('PUT', `/admin/bookings/${id}/status`, { status })

// BUSINESSES (admin_panel_extra)
export const fetchBusinesses = () => api('GET', '/admin_panel_extra/businesses')

export const fetchBusinessDetails = (id) =>
  api('GET', `/admin_panel_extra/businesses/${id}`)

export const approveBusiness = (id, notes = '') =>
  api('PATCH', `/admin_panel_extra/businesses/${id}/approve`, { notes })

export const rejectBusiness = (id, notes = '') =>
  api('PATCH', `/admin_panel_extra/businesses/${id}/reject`, { notes })

export const updateBusinessStatus = (id, status, notes = '') =>
  api('PATCH', `/admin_panel_extra/businesses/${id}/status`, { status, notes })

export const toggleBusinessBlock = (id) =>
  api('PATCH', `/admin_panel_extra/businesses/${id}/block`)

// SUBSCRIPTIONS (admin_panel_extra)
export const fetchSubscriptions = () =>
  api('GET', '/admin_panel_extra/subscriptions')

export const fetchSubscriptionPlans = () =>
  api('GET', '/admin_panel_extra/subscriptions/plans')

export const grantFreeMonths = (businessId, months) =>
  api('POST', `/admin_panel_extra/subscriptions/${businessId}/free-months`, { months })

export const grantLifetimeAccess = (businessId) =>
  api('POST', `/admin_panel_extra/subscriptions/${businessId}/lifetime`)

export const overrideSubscription = (businessId, planId) =>
  api('POST', `/admin_panel_extra/subscriptions/${businessId}/override`, { planId })

// REVENUE REPORT (admin_panel_extra)
export const fetchRevenueReport = (period) =>
  api('GET', `/admin_panel_extra/revenue/report?period=${period}`)

// SUBSCRIPTION (basic)
export const fetchBasicPlans = () => api('POST', '/subscription/plans')

export const subscribeBusiness = (user_id, plan_id) =>
  api('POST', '/subscription/subscribe', { user_id, plan_id })

// NOTIFICATIONS
export const fetchNotifications = (userId) =>
  api('POST', `/notification/${userId}`)

export const markNotificationsRead = (userId) =>
  api('PUT', `/notification/read/${userId}`)
