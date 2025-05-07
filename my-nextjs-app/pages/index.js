// pages/index.js
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function IndexRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/default')
  }, [])    // ← only on mount
  return null
}
