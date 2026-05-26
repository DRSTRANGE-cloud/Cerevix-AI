import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { motion as Motion } from "framer-motion"
import { useAuth } from "../features/auth/hooks/useAuth"
import { useToast } from "./toast.context"
import "./navbar.scss"

const NAV_ITEMS = [
    { path: "/", label: "Plans", icon: "P" },
    { path: "/dashboard", label: "Dashboard", icon: "D" },
    { path: "/ats", label: "ATS Engine", icon: "A" },
    { path: "/mock-interview", label: "Mock Interview", icon: "M" },
]

export default function Navbar() {
    const { user, handleLogout } = useAuth()
    const { showToast } = useToast()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const [ showProfile, setShowProfile ] = useState(false)
    const [ mobileMenuOpen, setMobileMenuOpen ] = useState(false)
    const displayName = user?.username || "User"
    const userEmail = user?.email || "Account"

    const isActive = (path) => path === "/" ? pathname === "/" : pathname.startsWith(path)
    const canGoBack = pathname !== "/"

    const logout = async () => {
        try {
            await handleLogout()
            showToast("Logged out.", "success")
            navigate("/login")
        } catch (error) {
            showToast(error.message, "error")
        }
    }

    return (
        <Motion.nav
            className="navbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            <div className="navbar__container">
                <div className="navbar__left">
                    {canGoBack && (
                        <button className="navbar__back" onClick={() => navigate(-1)} aria-label="Go back">
                            <span aria-hidden="true">←</span>
                        </button>
                    )}
                    <Link to="/" className="navbar__logo" aria-label="Cerevix AI home">
                        <img src="/cerevix-logo.png" alt="Cerevix AI" className="navbar__logo-image" />
                    </Link>
                </div>

                <div className="navbar__nav" aria-label="Primary navigation">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`navbar__nav-item ${isActive(item.path) ? "navbar__nav-item--active" : ""}`}
                        >
                            <span className="navbar__nav-icon" aria-hidden="true">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="navbar__right">
                    <div className="navbar__profile-wrapper">
                        <button
                            className="navbar__profile-button"
                            onClick={() => setShowProfile((value) => !value)}
                            aria-expanded={showProfile}
                            aria-label="Open profile menu"
                        >
                            <div className="navbar__avatar">{displayName[0]?.toUpperCase() || "U"}</div>
                            <span className="navbar__profile-summary">
                                <strong>{displayName}</strong>
                                <small>{userEmail}</small>
                            </span>
                            <svg className={`navbar__profile-chevron ${showProfile ? "navbar__profile-chevron--open" : ""}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {showProfile && (
                            <Motion.div className="navbar__profile-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                                <div className="navbar__profile-header">
                                    <div className="navbar__avatar navbar__avatar--large">{displayName[0]?.toUpperCase() || "U"}</div>
                                    <div>
                                        <p className="navbar__profile-name">{displayName}</p>
                                        <p className="navbar__profile-email">{userEmail}</p>
                                    </div>
                                </div>
                                <button className="navbar__profile-logout" onClick={logout}>Logout</button>
                            </Motion.div>
                        )}
                    </div>
                </div>

                <button
                    className={`navbar__mobile-toggle ${mobileMenuOpen ? "navbar__mobile-toggle--active" : ""}`}
                    onClick={() => setMobileMenuOpen((value) => !value)}
                    aria-label="Toggle mobile menu"
                    aria-expanded={mobileMenuOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {mobileMenuOpen && (
                <Motion.div className="navbar__mobile-menu" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}>
                    <div className="navbar__mobile-nav">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar__mobile-nav-item ${isActive(item.path) ? "navbar__mobile-nav-item--active" : ""}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </Motion.div>
            )}
        </Motion.nav>
    )
}
