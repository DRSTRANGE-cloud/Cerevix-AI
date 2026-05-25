import { useCallback, useMemo, useRef, useState } from "react"
import { ToastContext } from "./toast.context"

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null)
    const timerRef = useRef(null)

    const showToast = useCallback((message, tone = "info") => {
        setToast({ message, tone })
        window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => setToast(null), 4000)
    }, [])

    const value = useMemo(() => ({ showToast }), [ showToast ])

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
                    {toast.message}
                </div>
            )}
        </ToastContext.Provider>
    )
}
