import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion as Motion } from 'framer-motion'
import { useToast } from '../../../components/toast.context.js'
import { useInterview } from '../hooks/useInterview.js'
import '../style/interview.scss'

/* ── Nav config ─────────────────────────────────────────── */
const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
        ),
    },
    {
        id: 'behavioral',
        label: 'Behavioral',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        id: 'roadmap',
        label: 'Roadmap',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        ),
    },
]

const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

/* ── Question card ──────────────────────────────────────── */
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)

    return (
        <Motion.article
            className="q-card"
            variants={fadeUp}
        >
            <button
                className="q-card__header"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
            >
                <span className="q-card__index">Q{index + 1}</span>
                <span className="q-card__question">{item.question}</span>
                <span className={`q-card__chevron${open ? ' q-card__chevron--open' : ''}`} aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            {open && (
                <Motion.div
                    className="q-card__body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.22 }}
                >
                    {item.intention && (
                        <div className="q-card__section">
                            <span className="q-card__tag q-card__tag--intention">Intention</span>
                            <p>{item.intention}</p>
                        </div>
                    )}
                    {item.answer && (
                        <div className="q-card__section">
                            <span className="q-card__tag q-card__tag--answer">Model Answer</span>
                            <p>{item.answer}</p>
                        </div>
                    )}
                </Motion.div>
            )}
        </Motion.article>
    )
}

/* ── Roadmap day ────────────────────────────────────────── */
const RoadmapDay = ({ day, index }) => (
    <Motion.article className="roadmap-day" variants={fadeUp}>
        <div className="roadmap-day__header">
            <span className="roadmap-day__badge">Day {day.day}</span>
            <h3 className="roadmap-day__focus">{day.focus}</h3>
        </div>
        <ul className="roadmap-day__tasks">
            {(day.tasks || []).map((task, i) => (
                <li key={`${day.day}-${i}`}>
                    <span className="roadmap-day__bullet" aria-hidden />
                    {task}
                </li>
            ))}
        </ul>
    </Motion.article>
)

/* ── Main component ─────────────────────────────────────── */
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [pageError, setPageError]  = useState('')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { showToast }  = useToast()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId).catch(err => setPageError(err.message))
        }
    }, [interviewId, getReportById])

    const downloadResume = async () => {
        try {
            await getResumePdf(interviewId)
            showToast('Resume PDF downloaded.', 'success')
        } catch (err) {
            showToast(err.message, 'error')
        }
    }

    /* Loading */
    if (loading && !report) {
        return (
            <main className="app-shell app-shell--center">
                <div className="skeleton-card" aria-label="Loading interview plan" />
            </main>
        )
    }

    /* Error / empty */
    if (pageError || !report) {
        return (
            <main className="app-shell app-shell--center">
                <section className="empty-state" role="alert">
                    <h1>Interview plan unavailable</h1>
                    <p>{pageError || 'This report could not be loaded.'}</p>
                    <Link className="button primary-button" to="/">Back home</Link>
                </section>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
        report.matchScore >= 60 ? 'score--mid'  : 'score--low'

    const scoreLabel =
        report.matchScore >= 80 ? 'Strong match for this role' :
        report.matchScore >= 60 ? 'Good fit with some gaps'    : 'Needs focused preparation'

    /* ── Render ── */
    return (
        <div className="interview-page">

            {/* Header */}
            <Motion.div
                className="interview-header"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="interview-header__top">
                    <h1 className="interview-header__title">{report.title}</h1>
                    <button
                        onClick={downloadResume}
                        disabled={loading}
                        className="button primary-button interview-header__download"
                    >
                        <svg height="13" style={{ marginRight: '0.45rem' }} xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z" />
                        </svg>
                        {loading ? 'Preparing…' : 'Download Resume'}
                    </button>
                </div>

                {/* Nav tabs */}
                <nav className="interview-header__nav" aria-label="Report sections">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`interview-header__nav-item${activeNav === item.id ? ' interview-header__nav-item--active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                            aria-current={activeNav === item.id ? 'page' : undefined}
                        >
                            <span className="interview-header__nav-icon" aria-hidden>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </Motion.div>

            {/* Body */}
            <div className="interview-container">

                {/* Main content */}
                <Motion.main
                    className="interview-content"
                    key={activeNav}
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                >
                    {activeNav === 'technical' && (
                        <section>
                            <div className="content-header">
                                <h2>Technical Questions</h2>
                                <span className="content-header__count">
                                    {report.technicalQuestions?.length ?? 0} questions
                                </span>
                            </div>
                            <div className="q-list">
                                {(report.technicalQuestions || []).map((q, i) => (
                                    <QuestionCard key={`${q.question}-${i}`} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className="content-header">
                                <h2>Behavioral Questions</h2>
                                <span className="content-header__count">
                                    {report.behavioralQuestions?.length ?? 0} questions
                                </span>
                            </div>
                            <div className="q-list">
                                {(report.behavioralQuestions || []).map((q, i) => (
                                    <QuestionCard key={`${q.question}-${i}`} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className="content-header">
                                <h2>Preparation Roadmap</h2>
                                <span className="content-header__count">
                                    {report.preparationPlan?.length ?? 0}-day plan
                                </span>
                            </div>
                            <div className="roadmap-list">
                                {(report.preparationPlan || []).map((day, i) => (
                                    <RoadmapDay key={day.day} day={day} index={i} />
                                ))}
                            </div>
                        </section>
                    )}
                </Motion.main>

                {/* Sidebar */}
                <Motion.aside
                    className="interview-sidebar"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    {/* Score ring */}
                    <div className="sidebar-card match-score">
                        <p className="sidebar-card__label">Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <div>
                                <div className="match-score__value">{report.matchScore}</div>
                                <div className="match-score__pct">%</div>
                            </div>
                        </div>
                        <p className="sidebar-card__sub">{scoreLabel}</p>
                    </div>

                    {/* Skill gaps */}
                    {report.skillGaps?.length > 0 && (
                        <div className="sidebar-card skill-gaps">
                            <p className="sidebar-card__label">Skill Gaps</p>
                            <div className="skill-gaps__list">
                                {report.skillGaps.map((gap, i) => (
                                    <Motion.span
                                        key={`${gap.skill}-${i}`}
                                        className={`skill-tag skill-tag--${gap.severity}`}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        {gap.skill}
                                    </Motion.span>
                                ))}
                            </div>
                        </div>
                    )}
                </Motion.aside>

            </div>
        </div>
    )
}

export default Interview