import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  ChevronRight, Settings, LogOut, ChevronsLeft, ChevronsRight, Shield, Bell, SlidersHorizontal
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Badge, Button, Modal } from '../common/Common'
import './Sidebar.css'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Business Management', icon: Building2, path: '/businesses' },
  { label: 'User Management', icon: Users, path: '/users' },
  { label: 'Subscriptions', icon: CreditCard, path: '/subscriptions' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user, logout } = useAuth()
  const initials = (user?.full_name || user?.name || 'SA').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <button
          className="sidebar__edge-toggle"
          onClick={onToggle}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar__edge-toggle-glow" />
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logoGrad)" />
              <path d="M8 14C8 10.686 10.686 8 14 8V14H20C20 17.314 17.314 20 14 20C10.686 20 8 17.314 8 14Z" fill="white" />
              <circle cx="20" cy="8" r="3" fill="rgba(255,255,255,0.6)" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#5B21B6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <div className="sidebar__logo-text">
              <span className="sidebar__brand">Palify</span>
              <span className="sidebar__brand-tag">Admin</span>
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          {!collapsed && <p className="sidebar__section-label">Platform</p>}
          {navItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="sidebar__item-icon" />
              {!collapsed && <span className="sidebar__item-label">{label}</span>}
              {!collapsed && <ChevronRight size={14} className="sidebar__item-arrow" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <button
            className="sidebar__item sidebar__item--muted"
            title={collapsed ? 'Settings' : undefined}
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} className="sidebar__item-icon" />
            {!collapsed && <span className="sidebar__item-label">Settings</span>}
          </button>
          <div className="sidebar__user">
            <div className="sidebar__avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user?.full_name || user?.email_address || 'Admin'}</p>
                <p className="sidebar__user-role">Administrator</p>
              </div>
            )}
            {!collapsed && (
              <button className="sidebar__logout" title="Logout" onClick={logout} type="button">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Workspace Settings" width={520}>
        <div className="sidebar-settings">
          <div className="sidebar-settings__hero">
            <div className="sidebar-settings__hero-icon">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <p className="sidebar-settings__hero-title">Admin workspace preferences</p>
              <p className="sidebar-settings__hero-copy">Quick controls and current session details for this panel.</p>
            </div>
          </div>

          <div className="sidebar-settings__grid">
            <div className="sidebar-settings__card">
              <div className="sidebar-settings__label"><Shield size={14} /> Access</div>
              <div className="sidebar-settings__value">
                <Badge variant="approved">Admin session active</Badge>
              </div>
            </div>

            <div className="sidebar-settings__card">
              <div className="sidebar-settings__label"><Bell size={14} /> Notifications</div>
              <div className="sidebar-settings__value">
                <Badge variant="info">Live backend connected</Badge>
              </div>
            </div>

            <div className="sidebar-settings__card">
              <div className="sidebar-settings__label"><SlidersHorizontal size={14} /> Sidebar mode</div>
              <div className="sidebar-settings__value">
                {collapsed ? 'Compact navigation' : 'Expanded navigation'}
              </div>
            </div>

            <div className="sidebar-settings__card">
              <div className="sidebar-settings__label"><Settings size={14} /> Signed in as</div>
              <div className="sidebar-settings__value">
                {user?.full_name || user?.email_address || 'Admin'}
              </div>
            </div>
          </div>

          <div className="sidebar-settings__actions">
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                onToggle()
                setSettingsOpen(false)
              }}
            >
              {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
