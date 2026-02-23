// src/hooks/useAIChat.js
import { useState, useCallback, useRef, useEffect } from 'react'
import { aiAPI, APIError } from '../lib/apiClient'
import { sanitizeHtml } from '../lib/safeRender'

const MAX_CONTEXT_MESSAGES = 15 // Mantém as últimas 15 mensagens para equilíbrio entre contexto e custo
const SYSTEM_PROMPT = `Você é o assistente financeiro do MetaFin.
Ajude o usuário com análises, planejamento e insights.
Seja direto, preciso e use Markdown. Responda em Português Brasileiro.`

export function useAIChat() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)

    useEffect(() => {
        return () => abortRef.current?.abort()
    }, [])

    const sendMessage = useCallback(async (userContent, model = 'gpt-4o-mini') => {
        if (!userContent?.trim()) return
        if (isLoading) return

        setError(null)
        const userMessage = { role: 'user', content: userContent.trim() }
        const updatedMessages = [...messages, userMessage]

        setMessages(updatedMessages)
        setIsLoading(true)

        // Prepara histórico limitado para a API
        const contextMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...updatedMessages.slice(-MAX_CONTEXT_MESSAGES)
        ]

        abortRef.current?.abort()
        abortRef.current = new AbortController()

        try {
            const response = await aiAPI.chat(contextMessages, model)
            const rawContent = response.content || 'Resposta não processada'

            // Sanitização profunda antes de salvar no estado (Prevenção de XSS)
            const assistantContent = await sanitizeHtml(rawContent)

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: assistantContent }
            ])
        } catch (err) {
            if (err.name === 'AbortError') return

            const userFriendlyMessage = err instanceof APIError
                ? err.message
                : 'Erro ao conectar com a IA. Tente novamente.'

            setError(userFriendlyMessage)
        } finally {
            setIsLoading(false)
        }
    }, [messages, isLoading])

    const clearChat = useCallback(() => {
        abortRef.current?.abort()
        setMessages([])
        setError(null)
    }, [])

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat
    }
}
