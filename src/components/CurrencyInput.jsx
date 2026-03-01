import { tw } from '@/lib/theme';
// src/components/CurrencyInput.jsx
import { useState, useCallback, useEffect } from 'react'

/**
 * Input formatado para BRL (Real)
 * @param {number} value - Valor numérico (ex: 1250.50)
 * @param {function} onChange - Callback que recebe o novo número
 */
export function CurrencyInput({
 value = 0,
 onChange,
 placeholder = '0,00',
 disabled = false,
 max = 99999999.99,
 className = '',
 ...props
}) {
 // Converte número 1250.50 -> string "1.250,50"
 const formatDisplay = (num) => {
 if (num === null || num === undefined) return ''
 return new Intl.NumberFormat('pt-BR', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2
 }).format(num)
 }

 const [display, setDisplay] = useState(() => formatDisplay(value))

 // Sincroniza se o valor mudar externamente
 useEffect(() => {
 setDisplay(formatDisplay(value))
 }, [value])

 const handleChange = useCallback((e) => {
 // Remove tudo que não é dígito
 const digits = e.target.value.replace(/\D/g, '')

 if (!digits) {
 setDisplay('')
 onChange?.(0)
 return
 }

 const cents = parseInt(digits, 10)
 const reais = cents / 100

 if (reais > max) return

 setDisplay(formatDisplay(reais))
 onChange?.(reais)
 }, [max, onChange])

 return (
 <div className="relative flex items-center w-full group">
 <span className={`absolute left-3 text-sm font-bold transition-colors ${disabled ? 'text-gray-500' : 'text-gray-400 group-focus-within:text-brand-500'}`}>
 R$
 </span>
 <input
 type="text"
 inputMode="numeric"
 value={display}
 onChange={handleChange}
 placeholder={placeholder}
 disabled={disabled}
 className={`w-full pl-9 pr-4 py-2 bg-gray-800/40 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
 {...props}
 />
 </div>
 )
}
