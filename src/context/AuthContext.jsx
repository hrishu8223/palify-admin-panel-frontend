import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginAdmin } from '../services/api'

const AuthContext = createContext(null)

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('palify_admin_token')
    const saved = localStorage.getItem('palify_admin_user')

    if (token && saved) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp && Date.now() / 1000 > payload.exp

        if (isExpired) {
          localStorage.removeItem('palify_admin_token')
          localStorage.removeItem('palify_admin_user')
        } else {
          setUser(JSON.parse(saved))
        }
      } catch {
        localStorage.removeItem('palify_admin_token')
        localStorage.removeItem('palify_admin_user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (email_address, password) => {
    const res = await loginAdmin(email_address, password)

    const token = res.data?.token || res.token
    const userData = res.data || res

    if (!token) throw new Error('No token received from server')

    localStorage.setItem('palify_admin_token', token)
    localStorage.setItem('palify_admin_user', JSON.stringify(userData))

    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('palify_admin_token')
    localStorage.removeItem('palify_admin_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook (same file but stable export)
export function useAuth() {
  return useContext(AuthContext)
}
