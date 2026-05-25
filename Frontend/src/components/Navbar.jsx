import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { motion as Motion } from 'framer-motion'
import { useAuth } from '../features/auth/hooks/useAuth'
import './navbar.scss'

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/ats', label: 'ATS Engine', icon: '📄' },
    { path: '/mock-interview', label: 'Mock Interview', icon: '🎙️' },
]

export default function Navbar() {
    const { user, handleLogout } = useAuth()
    const { pathname } = useLocation()
    const [showProfile, setShowProfile] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (path) => pathname === path

    return (
        <Motion.nav 
            className='navbar'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className='navbar__container'>
                {/* Logo and brand */}
                <Link to='/' className='navbar__logo'>
                    <span className='navbar__logo-text'>Cerevix AI</span>
                </Link>

                {/* Navigation items - desktop */}
                <div className='navbar__nav'>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`navbar__nav-item ${isActive(item.path) ? 'navbar__nav-item--active' : ''}`}
                        >
                            <span className='navbar__nav-icon'>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* User profile and settings */}
                <div className='navbar__right'>
                    <div className='navbar__profile-wrapper'>
                        <button 
                            className='navbar__profile-button'
                            onClick={() => setShowProfile(!showProfile)}
                            aria-expanded={showProfile}
                        >
                            <div className='navbar__avatar'>
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <svg 
                                className={`navbar__profile-chevron ${showProfile ? 'navbar__profile-chevron--open' : ''}`}
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {/* Profile dropdown */}
                        {showProfile && (
                            <Motion.div 
                                className='navbar__profile-menu'
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className='navbar__profile-header'>
                                    <div className='navbar__avatar navbar__avatar--large'>
                                        {user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className='navbar__profile-name'>{user?.username}</p>
                                        <p className='navbar__profile-email'>{user?.email}</p>
                                    </div>
                                </div>
                                <div className='navbar__profile-divider' />
                                <button 
                                    className='navbar__profile-logout'
                                    onClick={() => {
                                        handleLogout()
                                        setShowProfile(false)
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                    Logout
                                </button>
                            </Motion.div>
                        )}
                    </div>
                </div>

                {/* Mobile menu button */}
                <button 
                    className={`navbar__mobile-toggle ${mobileMenuOpen ? 'navbar__mobile-toggle--active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <Motion.div 
                    className='navbar__mobile-menu'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                >
                    <div className='navbar__mobile-nav'>
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`navbar__mobile-nav-item ${isActive(item.path) ? 'navbar__mobile-nav-item--active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </Motion.div>
            )}
        </Motion.nav>
    )
}
