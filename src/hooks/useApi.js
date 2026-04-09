import { useState, useEffect, useRef, useCallback } from 'react'

// Generic hook: calls an async apiFn on mount (and on refetch)
export function useApi(apiFn) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const apiFnRef = useRef(apiFn)

  // Keep ref updated so we always call latest version without stale closure
  useEffect(() => { apiFnRef.current = apiFn }, [apiFn])

  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    apiFnRef.current()
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [trigger])

  const refetch = useCallback(() => setTrigger(t => t + 1), [])

  return { data, loading, error, refetch }
}

// Mutation hook: returns [mutate, { loading, error, data }]
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [data,    setData]    = useState(null)

  const mutate = async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return [mutate, { loading, error, data }]
}
