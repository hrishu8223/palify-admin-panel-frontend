import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import './AppLayout.css'

const SIDEBAR_STATE_KEY = 'palify_admin_sidebar_collapsed'

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_STATE_KEY) === 'true'
  })
  const { pathname } = useLocation()

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <div className={`app-layout ${collapsed ? 'app-layout--collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(current => !current)} />
      <div className="app-layout__main">
        <TopBar currentPath={pathname} />
        <main className="app-layout__content">
          {children}
        </main>
      </div>
    </div>
  )
}
