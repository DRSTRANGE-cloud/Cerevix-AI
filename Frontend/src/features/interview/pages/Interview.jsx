import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { motion as Motion } from "framer-motion"
import { useToast } from "../../../components/toast.context.js"
import { useInterview } from "../hooks/useInterview.js"
import "../style/interview.scss"

const NAV_ITEMS = [
    {
        id: "technical",
        label: "Technical",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },
    {
        id: "behavioral",
        label: "Behavioral",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        id: "roadmap",
        label: "Roadmap",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        )
    },
    {
        id: "resume",
        label: "Resume",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
        )
    }
]

const RESUME_SECTIONS = [
    [ "name", "Name" ],
    [ "summary", "Summary" ],
    [ "skills", "Skills" ],
    [ "projects", "Projects" ],
    [ "experience", "Experience" ],
    [ "education", "Education" ],
    [ "certifications", "Certifications" ]
]

const IMPROVE_ACTIONS = [
    [ "summary", "Rewrite Summary", "Rewrite the summary to sharpen positioning, impact, and ATS coverage." ],
    [ "projects", "Improve Project Description", "Improve project descriptions with clearer scope and outcome language." ],
    [ "experience", "Improve Experience Bullet Points", "Rewrite experience bullets to be concise, specific, and credible." ],
    [ "experience", "Add Impact Metrics", "Add measurable impact framing where it is truthful and relevant." ],
    [ "skills", "Add ATS Keywords", "Add relevant ATS keywords while keeping the content honest." ]
]

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}

const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
}

function textValue(value) {
    return Array.isArray(value) ? value.join("\n") : value || ""
}

function sectionValue(section, value) {
    if ([ "skills", "projects", "experience" ].includes(section)) {
        return value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
    }

    return value
}

function ProgressMetric({ label, value }) {
    const score = Math.max(0, Math.min(100, parseInt(value, 10) || 0))

    return (
        <div className="resume-metric">
            <div className="resume-metric__head">
                <span>{label}</span>
                <strong>{score}%</strong>
            </div>
            <div className="resume-metric__bar">
                <span style={{ width: `${score}%` }} />
            </div>
        </div>
    )
}

function changedResumeSections(currentSections = {}, previousSections = {}) {
    return RESUME_SECTIONS
        .map(([ key, label ]) => ({
            key,
            label,
            current: textValue(currentSections[key]),
            previous: textValue(previousSections?.[key])
        }))
        .filter((item) => item.current.trim() !== item.previous.trim())
}

function QuestionCard({ item, index }) {
    const [open, setOpen] = useState(false)

    return (
        <Motion.article className="q-card" variants={fadeUp}>
            <button className="q-card__header" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
                <span className="q-card__index">Q{index + 1}</span>
                <span className="q-card__question">{item.question}</span>
                <span className={`q-card__chevron${open ? " q-card__chevron--open" : ""}`} aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            {open && (
                <Motion.div className="q-card__body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.22 }}>
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

function RoadmapDay({ day }) {
    return (
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
}

function ResumeStudio({
    interviewId,
    showToast,
    loading,
    fetchResumePreview,
    createResumePreview,
    saveResumePreview,
    improveResume,
    restoreResume,
    downloadEditedResume
}) {
    const [resumeDraft, setResumeDraft] = useState(null)
    const [sections, setSections] = useState(null)
    const [activeSection, setActiveSection] = useState("summary")
    const [booting, setBooting] = useState(true)
    const [compareVersion, setCompareVersion] = useState(null)
    const [saving, setSaving] = useState(false)
    const [recommendations, setRecommendations] = useState([])
    const [previewWidth, setPreviewWidth] = useState(100)
    const [previewHeight, setPreviewHeight] = useState(980)
    const [versionLabel, setVersionLabel] = useState("")

    useEffect(() => {
        let alive = true

        fetchResumePreview(interviewId)
            .then((resume) => {
                if (!alive) return
                setResumeDraft(resume)
                setSections(resume?.sections || null)
                setRecommendations(resume?.recommendations || [])
            })
            .catch((error) => showToast(error.message, "error"))
            .finally(() => {
                if (alive) setBooting(false)
            })

        return () => {
            alive = false
        }
    }, [ fetchResumePreview, interviewId, showToast ])

    useEffect(() => {
        if (!sections || !resumeDraft) {
            return undefined
        }

        const hasChanged = JSON.stringify(sections) !== JSON.stringify(resumeDraft.sections)

        if (!hasChanged) {
            return undefined
        }

        const timeoutId = window.setTimeout(async () => {
            if (loading) return
            setSaving(true)
            try {
                const nextResume = await saveResumePreview({ interviewReportId: interviewId, sections })
                setResumeDraft(nextResume)
                setSections(nextResume.sections)
                setRecommendations(nextResume.recommendations || [])
            } catch (error) {
                showToast(error.message, "error")
            } finally {
                setSaving(false)
            }
        }, 800)

        return () => window.clearTimeout(timeoutId)
    }, [ sections, resumeDraft, interviewId, loading, saveResumePreview, showToast ])

    const handleGenerate = async () => {
        try {
            const nextResume = await createResumePreview(interviewId)
            setResumeDraft(nextResume)
            setSections(nextResume.sections)
            setRecommendations(nextResume.recommendations || [])
            showToast("Resume preview generated.", "success")
        } catch (error) {
            showToast(error.message, "error")
        }
    }

    const handleSectionChange = (value) => {
        setSections((current) => ({
            ...(current || {}),
            [activeSection]: sectionValue(activeSection, value)
        }))
    }

    const handleImprove = async (section, instruction) => {
        if (!instruction) {
            showToast("No improvement instructions found for this item.", "error")
            return
        }
        try {
            const nextResume = await improveResume({ 
                interviewReportId: interviewId, 
                section, 
                instruction
            })
            setResumeDraft(nextResume)
            setSections(nextResume.sections)
            setRecommendations((nextResume.recommendations || []).filter((item) => item.section !== section))
            setActiveSection(section)
            showToast("Resume section improved.", "success")
        } catch (error) {
            showToast(error.message, "error")
        }
    }

    const handleRestore = async (versionId) => {
        if (!window.confirm("Restore this resume version? Your current draft will be saved as a version first.")) {
            return
        }

        try {
            const nextResume = await restoreResume({ interviewReportId: interviewId, versionId })
            setResumeDraft(nextResume)
            setSections(nextResume.sections)
            setRecommendations(nextResume.recommendations || [])
            setCompareVersion(null)
            showToast("Resume version restored.", "success")
        } catch (error) {
            showToast(error.message, "error")
        }
    }

    const handleSaveVersion = async () => {
        if (!sections) {
            return
        }

        setSaving(true)

        try {
            const nextResume = await saveResumePreview({
                interviewReportId: interviewId,
                sections,
                saveVersion: true,
                versionLabel: versionLabel.trim()
            })
            setResumeDraft(nextResume)
            setSections(nextResume.sections)
            setRecommendations(nextResume.recommendations || [])
            setVersionLabel("")
            showToast("Resume version saved.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDownload = async () => {
        try {
            await downloadEditedResume(interviewId)
            showToast("Edited resume PDF downloaded.", "success")
        } catch (error) {
            showToast(error.message, "error")
        }
    }

    if (booting) {
        return (
            <section className="resume-studio resume-studio--loading">
                <div className="skeleton-card" aria-label="Loading resume studio" />
            </section>
        )
    }

    if (!resumeDraft || !sections) {
        return (
            <section className="resume-empty">
                <h2>Generate your ATS optimized resume</h2>
                <p>Open the preview, shape the sections, and export the final edited PDF when you are ready.</p>
                <button className="button primary-button" type="button" onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate Resume"}
                </button>
            </section>
        )
    }

    const analytics = resumeDraft.analytics || {}
    const versions = (resumeDraft.versions || []).slice(0, 3)
    const currentHtml = resumeDraft.html || ""

    return (
        <section className="resume-studio">
            <div className="resume-toolbar">
                <div>
                    <p className="sidebar-card__label">Resume Studio</p>
                    <h2>Preview, edit, improve, then export</h2>
                    <span>{saving ? "Autosaving changes..." : "Changes save automatically"}</span>
                </div>
                <div className="resume-toolbar__actions">
                    <button className="button secondary-button" type="button" onClick={handleGenerate} disabled={loading}>Preview Resume</button>
                    <button className="button primary-button" type="button" onClick={handleDownload} disabled={loading || saving}>Download PDF</button>
                </div>
            </div>

            <div className="resume-grid">
                <aside className="resume-assistant">
                    <div className="resume-panel">
                        <p className="sidebar-card__label">AI Resume Recommendations</p>
                        {recommendations.length > 0 ? (
                            <div className="resume-recommendations">
                                {recommendations
                                    .slice()
                                    .sort((a, b) => {
                                        const weight = { high: 3, medium: 2, low: 1 }
                                        return (weight[b.importance] || 0) - (weight[a.importance] || 0)
                                    })
                                    .map((item, index) => (
                                        <article key={`${item.issue}-${index}`}>
                                            <strong>{item.issue}</strong>
                                            <p>{item.suggestedImprovement}</p>
                                            <div className="resume-recommendations__meta">
                                                <span className={`importance importance--${item.importance}`}>{item.importance}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleImprove(item.section || activeSection, item.suggestedImprovement)}
                                                    disabled={loading}
                                                >
                                                    Apply Fix
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                            </div>
                        ) : (
                            <div className="resume-empty-inline">No open recommendations for this draft.</div>
                        )}
                    </div>

                    <div className="resume-panel">
                        <p className="sidebar-card__label">Quality Analytics</p>
                        <ProgressMetric label="ATS Score" value={analytics.atsScore} />
                        <ProgressMetric label="Keyword Match" value={analytics.keywordMatch} />
                        <ProgressMetric label="Skills Match" value={analytics.skillCoverage} />
                        <ProgressMetric label="Readability" value={analytics.readabilityScore} />
                        <ProgressMetric label="Resume Length" value={analytics.resumeLengthScore} />
                        <ProgressMetric label="Action Verb Score" value={analytics.actionVerbScore} />
                    </div>

                    <div className="resume-panel">
                        <p className="sidebar-card__label">Improve With AI</p>
                        <div className="resume-action-list">
                            {IMPROVE_ACTIONS.map(([ section, label, instruction ]) => (
                                <button key={label} type="button" onClick={() => handleImprove(section, instruction)} disabled={loading}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="resume-panel">
                        <p className="sidebar-card__label">Version History</p>
                        <div className="resume-version-save">
                            <input
                                value={versionLabel}
                                onChange={(event) => setVersionLabel(event.target.value)}
                                placeholder="Version label"
                                maxLength={120}
                            />
                            <button type="button" onClick={handleSaveVersion} disabled={saving || loading}>
                                Save Version
                            </button>
                        </div>
                        <div className="resume-version-list">
                            {versions.length ? versions.map((version) => (
                                <div key={version._id}>
                                    <button type="button" onClick={() => setCompareVersion(version)}>
                                        <strong>{version.label || "Saved version"}</strong>
                                        <span>{new Date(version.createdAt).toLocaleString()}</span>
                                    </button>
                                    <button type="button" onClick={() => setCompareVersion(version)}>Compare</button>
                                    <button type="button" onClick={() => handleRestore(version._id)}>Restore</button>
                                </div>
                            )) : <span className="resume-muted">No previous versions yet.</span>}
                        </div>
                    </div>
                </aside>

                <main className="resume-workspace">
                    <nav className="resume-section-nav" aria-label="Resume sections">
                        {RESUME_SECTIONS.map(([ key, label ]) => (
                            <button
                                key={key}
                                type="button"
                                className={activeSection === key ? "resume-section-nav__active" : ""}
                                onClick={() => setActiveSection(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="resume-preview-controls">
                        <label>
                            Width
                            <input
                                type="range"
                                min="78"
                                max="100"
                                value={previewWidth}
                                onChange={(event) => setPreviewWidth(parseInt(event.target.value, 10))}
                            />
                            <span>{previewWidth}%</span>
                        </label>
                        <label>
                            Height
                            <input
                                type="range"
                                min="720"
                                max="1320"
                                step="20"
                                value={previewHeight}
                                onChange={(event) => setPreviewHeight(parseInt(event.target.value, 10))}
                            />
                            <span>{previewHeight}px</span>
                        </label>
                    </div>

                    <div className="resume-editor">
                        <label htmlFor={`resume-${activeSection}`}>
                            {RESUME_SECTIONS.find(([ key ]) => key === activeSection)?.[1]}
                        </label>
                        <textarea
                            id={`resume-${activeSection}`}
                            value={textValue(sections[activeSection])}
                            onChange={(event) => handleSectionChange(event.target.value)}
                            rows={activeSection === "summary" || activeSection === "name" ? 5 : 9}
                        />
                    </div>

                    <div className="resume-preview-shell">
                        <div className="resume-preview" style={{ width: `${previewWidth}%` }}>
                            <iframe
                                title="Resume preview"
                                srcDoc={currentHtml}
                                style={{ width: "100%", height: `${previewHeight}px` }}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>

                    {compareVersion && (
                        <div className="resume-compare">
                            <div className="resume-compare__header">
                                <p className="sidebar-card__label">Changed Sections</p>
                                <button type="button" onClick={() => setCompareVersion(null)}>Close</button>
                            </div>
                            {changedResumeSections(sections, compareVersion.sections).length ? (
                                changedResumeSections(sections, compareVersion.sections).map((item) => (
                                    <article className="resume-diff" key={item.key}>
                                        <h3>{item.label}</h3>
                                        <div>
                                            <section>
                                                <span>Current</span>
                                                <p>{item.current || "Empty"}</p>
                                            </section>
                                            <section>
                                                <span>{compareVersion.label || "Previous"}</span>
                                                <p>{item.previous || "Empty"}</p>
                                            </section>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="resume-empty-inline">No section-level changes found between these versions.</div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </section>
    )
}

export default function Interview() {
    const [activeNav, setActiveNav] = useState("technical")
    const [pageError, setPageError] = useState("")
    const { report, getReportById, loading, fetchResumePreview, createResumePreview, saveResumePreview, improveResume, restoreResume, downloadEditedResume } = useInterview()
    const { showToast } = useToast()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId).catch((error) => setPageError(error.message))
        }
    }, [ interviewId, getReportById ])

    const scoreColor =
        report?.matchScore >= 80 ? "score--high" :
        report?.matchScore >= 60 ? "score--mid" :
        "score--low"

    const scoreLabel =
        report?.matchScore >= 80 ? "Strong match for this role" :
        report?.matchScore >= 60 ? "Good fit with some gaps" :
        "Needs focused preparation"

    if (loading && !report) {
        return (
            <main className="app-shell app-shell--center">
                <div className="skeleton-card" aria-label="Loading interview plan" />
            </main>
        )
    }

    if (pageError || !report) {
        return (
            <main className="app-shell app-shell--center">
                <section className="empty-state" role="alert">
                    <h1>Interview plan unavailable</h1>
                    <p>{pageError || "This report could not be loaded."}</p>
                    <Link className="button primary-button" to="/">Back home</Link>
                </section>
            </main>
        )
    }

    return (
        <div className="interview-page">
            <Motion.div className="interview-header" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="interview-header__top">
                    <h1 className="interview-header__title">{report.title}</h1>
                    <button
                        type="button"
                        onClick={() => setActiveNav("resume")}
                        disabled={loading}
                        className="button primary-button interview-header__download"
                    >
                        <svg height="13" style={{ marginRight: "0.45rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                        {loading ? "Preparing..." : "Preview Resume"}
                    </button>
                </div>

                <nav className="interview-header__nav" aria-label="Report sections">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`interview-header__nav-item${activeNav === item.id ? " interview-header__nav-item--active" : ""}`}
                            onClick={() => setActiveNav(item.id)}
                            aria-current={activeNav === item.id ? "page" : undefined}
                        >
                            <span className="interview-header__nav-icon" aria-hidden>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </Motion.div>

            <div className="interview-container">
                <Motion.main className="interview-content" key={activeNav} variants={stagger} initial="hidden" animate="show">
                    {activeNav === "technical" && (
                        <section>
                            <div className="content-header">
                                <h2>Technical Questions</h2>
                                <span className="content-header__count">{report.technicalQuestions?.length ?? 0} questions</span>
                            </div>
                            <div className="q-list">
                                {(report.technicalQuestions || []).map((question, index) => (
                                    <QuestionCard key={`${question.question}-${index}`} item={question} index={index} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === "behavioral" && (
                        <section>
                            <div className="content-header">
                                <h2>Behavioral Questions</h2>
                                <span className="content-header__count">{report.behavioralQuestions?.length ?? 0} questions</span>
                            </div>
                            <div className="q-list">
                                {(report.behavioralQuestions || []).map((question, index) => (
                                    <QuestionCard key={`${question.question}-${index}`} item={question} index={index} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === "roadmap" && (
                        <section>
                            <div className="content-header">
                                <h2>Preparation Roadmap</h2>
                                <span className="content-header__count">{report.preparationPlan?.length ?? 0}-day plan</span>
                            </div>
                            <div className="roadmap-list">
                                {(report.preparationPlan || []).map((day) => (
                                    <RoadmapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === "resume" && (
                        <ResumeStudio
                            interviewId={interviewId}
                            showToast={showToast}
                            loading={loading}
                            fetchResumePreview={fetchResumePreview}
                            createResumePreview={createResumePreview}
                            saveResumePreview={saveResumePreview}
                            improveResume={improveResume}
                            restoreResume={restoreResume}
                            downloadEditedResume={downloadEditedResume}
                        />
                    )}
                </Motion.main>

                <Motion.aside className="interview-sidebar" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
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

                    {report.skillGaps?.length > 0 && (
                        <div className="sidebar-card skill-gaps">
                            <p className="sidebar-card__label">Skill Gaps</p>
                            <div className="skill-gaps__list">
                                {report.skillGaps.map((gap, index) => (
                                    <Motion.span
                                        key={`${gap.skill}-${index}`}
                                        className={`skill-tag skill-tag--${gap.severity}`}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.04 }}
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
