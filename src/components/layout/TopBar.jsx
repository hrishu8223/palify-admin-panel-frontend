import React, { useEffect, useState } from 'react'
import { Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { fetchNotifications, markNotificationsRead } from '../../services/api'
import './TopBar.css'

const routeTitles = {
  '/': 'Dashboard Overview',
  '/businesses': 'Business Management',
  '/users': 'User Management',
  '/subscriptions': 'Subscription Control',
}

export default function TopBar({ currentPath }) {
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const { user, logout } = useAuth()

  const title = routeTitles[currentPath] || 'Admin Panel'
  const initials = (user?.full_name || user?.email_address || 'SA')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const userId = user?.id
  const unreadCount = notifications.filter(item => !item.is_read && item.is_read !== 1).length

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    setNotifLoading(true)

    fetchNotifications(userId)
      .then(data => {
        if (!cancelled) setNotifications(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setNotifications([])
      })
      .finally(() => {
        if (!cancelled) setNotifLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleToggleNotifications = async () => {
    const nextOpen = !showNotif
    setShowNotif(nextOpen)

    if (nextOpen && unreadCount > 0 && userId) {
      try {
        await markNotificationsRead(userId)
        setNotifications(current => current.map(item => ({ ...item, is_read: 1 })))
      } catch {
        // Keep the dropdown usable even if marking notifications as read fails.
      }
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div>
          <h1 className="topbar__title">{title}</h1>
          <p className="topbar__date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__search">
          <Search size={15} className="topbar__search-icon" />
          <input className="topbar__search-input" placeholder="Search..." />
        </div>

        <div className="topbar__notif-wrap">
          <button className="topbar__icon-btn" onClick={handleToggleNotifications} type="button" aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="topbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="topbar__notif-dropdown">
              <p className="topbar__notif-header">Notifications</p>
              {notifLoading ? (
                <div className="topbar__notif-item">
                  <div>
                    <p className="topbar__notif-text">Loading notifications...</p>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="topbar__notif-item">
                  <div>
                    <p className="topbar__notif-text">No notifications found.</p>
                  </div>
                </div>
              ) : (
                notifications.slice(0, 10).map(item => (
                  <div key={item.id} className={`topbar__notif-item topbar__notif-item--${item.type || 'info'}`}>
                    <div className={`topbar__notif-dot topbar__notif-dot--${item.type || 'info'}`} />
                    <div>
                      <p className="topbar__notif-text">{item.title || item.message || 'Notification'}</p>
                      {item.message && item.title ? <p className="topbar__notif-time">{item.message}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="topbar__profile">
          <div className="topbar__avatar">{initials}</div>
          <div className="topbar__profile-info">
            <p className="topbar__profile-name">{user?.full_name || user?.email_address || 'Admin'}</p>
            <p className="topbar__profile-role">Full Access</p>
          </div>
          <button className="topbar__logout-btn" title="Logout" onClick={logout} type="button">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
