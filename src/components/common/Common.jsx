import React from 'react'
import './Common.css'

/* Badge */
export function Badge({ variant = 'default', children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

/* Button */
export function Button({ variant = 'primary', size = 'md', icon, children, onClick, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  )
}

/* Card */
export function Card({ children, className = '', glow = false, ...rest }) {
  return (
    <div className={`card ${glow ? 'card--glow' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/* StatCard */
export function StatCard({ label, value, delta, icon, color = 'primary', prefix = '' }) {
  const positive = delta >= 0
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        <div className={`stat-card__icon-wrap stat-card__icon-wrap--${color}`}>{icon}</div>
      </div>
      <div className="stat-card__value">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {delta !== undefined && (
        <div className={`stat-card__delta stat-card__delta--${positive ? 'up' : 'down'}`}>
          {positive ? '^' : 'v'} {Math.abs(delta)}% from last month
        </div>
      )}
    </div>
  )
}

/* Modal */
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose} type="button" aria-label="Close modal">x</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

/* Empty State */
export function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__desc">{description}</p>}
    </div>
  )
}

/* Search Input */
export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search-input-wrap">
      <svg className="search-input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M6.5 1a5.5 5.5 0 1 0 3.52 9.734l3.12 3.12a.75.75 0 1 0 1.06-1.06l-3.12-3.12A5.5 5.5 0 0 0 6.5 1zM2.5 6.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="currentColor" />
      </svg>
      <input
        className="search-input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

/* Section Header */
export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-header__title">{title}</h2>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="section-header__actions">{actions}</div>}
    </div>
  )
}

/* Confirm Dialog */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} width={400}>
      <p className="confirm-message">{message}</p>
      <div className="confirm-actions">
        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        <Button variant={variant} onClick={handleConfirm} type="button">{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
