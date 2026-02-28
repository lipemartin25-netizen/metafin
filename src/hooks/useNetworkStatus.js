// src/hooks/useNetworkStatus.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Monitora o estado da rede (online/offline) e a disponibilidade da API
 */
export function useNetworkStatus() {
 const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
 const [isApiSuboptimal, setIsApiSuboptimal] = useState(false)

 // Verifica se o servidor de API está respondendo (Health Check)
 const checkApiHealth = useCallback(async () => {
 if (!navigator.onLine) return

 try {
 const controller = new AbortController()
 const timeoutId = setTimeout(() => controller.abort(), 3000)

 const response = await fetch('/api/health', {
 method: 'GET',
 signal: controller.signal,
 cache: 'no-store'
 })

 clearTimeout(timeoutId)
 setIsApiSuboptimal(!response.ok)
 } catch (_err) {
 // Se a rede está OK mas o fetch falha, a API pode estar fora
 setIsApiSuboptimal(true)
 }
 }, [])

 useEffect(() => {
 const handleOnline = () => {
 setIsOnline(true)
 checkApiHealth()
 }
 const handleOffline = () => {
 setIsOnline(false)
 setIsApiSuboptimal(true) // Se offline, a API é inacessível
 }

 window.addEventListener('online', handleOnline)
 window.addEventListener('offline', handleOffline)

 // Check periódico se estiver online
 const interval = setInterval(() => {
 if (navigator.onLine) checkApiHealth()
 }, 30000)

 // Check inicial
 checkApiHealth()

 return () => {
 window.removeEventListener('online', handleOnline)
 window.removeEventListener('offline', handleOffline)
 clearInterval(interval)
 }
 }, [checkApiHealth])

 return { isOnline, isApiSuboptimal, checkApiHealth }
}
