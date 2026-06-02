import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth.context-value";
import { getMe, login, logout, register } from "./services/auth.api";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)

    useEffect(() => {
        let isMounted = true

        const hydrateSession = async () => {
            const token = localStorage.getItem("token")

            if (!token) {
                if (isMounted) {
                    setCheckingSession(false)
                }
                return
            }

            try {
                const data = await getMe()
                if (isMounted) {
                    setUser(data.user)
                }
            } catch {
                localStorage.removeItem("token")
                if (isMounted) {
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setCheckingSession(false)
                }
            }
        }

        hydrateSession()

        return () => {
            isMounted = false
        }
    }, [])

    const handleLogin = useCallback(async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            localStorage.setItem("token", data.token)
            setUser(data.user)
            return data.user
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRegister = useCallback(async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            localStorage.setItem("token", data.token)
            setUser(data.user)
            return data.user
        } finally {
            setLoading(false)
        }
    }, [])

    const handleLogout = useCallback(async () => {
        setLoading(true)
        try {
            await logout()
        } catch {
            // Keep local logout reliable even if the backend is waking up or unreachable.
        } finally {
            localStorage.removeItem("token")
            setUser(null)
            setLoading(false)
        }
    }, [])

    const value = useMemo(() => ({
        user,
        loading,
        checkingSession,
        isAuthenticated: Boolean(user),
        handleLogin,
        handleRegister,
        handleLogout,
        setUser
    }), [user, loading, checkingSession, handleLogin, handleRegister, handleLogout])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
