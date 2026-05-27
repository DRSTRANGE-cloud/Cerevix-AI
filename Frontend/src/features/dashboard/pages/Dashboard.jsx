import { motion as Motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useToast } from "../../../components/toast.context"
import { getCareerAnalytics } from "../services/dashboard.api"
import "../style.scss"

export default function Dashboard() {
    const { showToast } = useToast()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getCareerAnalytics()
            .then((data) => setAnalytics(data.analytics))
            .catch((error) => showToast(error.message, "error"))
            .finally(() => setLoading(false))
    }, [showToast])

    if (loading) {
        return (
            <main className="app-shell app-shell--center">
                <div className="skeleton-card" />
            </main>
        )
    }

    if (!analytics) {
        return (
            <main className="app-shell app-shell--center">
                <section className="empty-state">
                    <h1>No analytics yet</h1>
                    <p>Create reports and mock interviews to unlock your dashboard.</p>
                </section>
            </main>
        )
    }

    const overview = [
        ["Average ATS",          analytics.overview.averageAtsScore],
        ["Interview Score",       analytics.overview.averageInterviewScore],
        ["Completed Sessions",    analytics.overview.completedInterviewSessions],
        ["Reports Generated",     analytics.overview.reportsGenerated],
    ]

    return (
        <main className="dashboard-page">

            {/* ── Header ── */}
            <header className="feature-header">
                <h1>Career Analytics Dashboard</h1>
                <span>Track resume fit, interview readiness, weak skills, and recent preparation activity.</span>
            </header>

            {/* ── Overview cards ── */}
            <section className="overview-grid">
                {overview.map(([label, value], i) => (
                    <Motion.div
                        className="overview-card"
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                    >
                        <span>{label}</span>
                        <strong>{value ?? "—"}</strong>
                    </Motion.div>
                ))}
            </section>

            {/* ── Behaviour analysis ── */}
            {analytics.behaviorAnalysis && (
                <BehaviorAnalysis analysis={analytics.behaviorAnalysis} />
            )}

            {/* ── Chart grid ── */}
            <section className="dashboard-grid">
                <TrendChart title="ATS Trend" data={analytics.atsTrend} dataKey="score" color="var(--color-accent)" />
                <TrendChart title="Interview Trend" data={analytics.interviewTrend} dataKey="score" color="#f59e0b" />

                <SkillBars title="Weak Skills"     data={analytics.weakestSkills} />
                <SkillBars title="Strongest Skills" data={analytics.strongestSkills} />
            </section>

            {/* ── Bottom grid ── */}
            <section className="dashboard-grid dashboard-grid--bottom">
                <Timeline items={analytics.activityTimeline} />

                <RecentReports reports={analytics.recentReports} />
            </section>

        </main>
    )
}

/* ── Skill bar chart ── */
function SkillBars({ title, data }) {
    const hasData = Array.isArray(data) && data.length > 0 && data.some(item => item.name && item.count > 0)
    const chartData = hasData ? data.filter(item => item.name && item.count > 0) : []

    return (
        <section className="chart-card">
            <p className="section-kicker">{title}</p>
            {hasData ? (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="0" stroke="var(--color-border)" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                        />
                        <YAxis 
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'var(--color-text)' }}
                            formatter={(value) => [Math.round(value), 'Count']}
                        />
                        <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="empty-chart-state">No skill data available yet</div>
            )}
        </section>
    )
}

/* ── Trend area chart ── */
function TrendChart({ title, data, dataKey, color }) {
    const hasData = Array.isArray(data) && data.length > 0 && data.some(item => item.date && typeof item[dataKey] === "number")
    const chartData = hasData ? data.filter(item => item.date && typeof item[dataKey] === "number") : []

    return (
        <div className="chart-card">
            <p className="section-kicker">{title}</p>
            {hasData ? (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData}>
                        <CartesianGrid stroke="var(--color-border)" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => new Date(d).toLocaleDateString()}
                            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                        />
                        <YAxis 
                            domain={[0, 100]}
                            tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                        />
                        <Tooltip 
                            labelFormatter={(d) => new Date(d).toLocaleString()}
                            contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: 'var(--color-text)' }}
                            formatter={(value) => [Math.round(value), 'Score']}
                        />
                        <Area 
                            dataKey={dataKey}
                            stroke={color}
                            fill={color === "var(--color-accent)" ? "rgba(20,184,166,0.18)" : "rgba(245,158,11,0.15)"}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="empty-chart-state">No data available yet. Complete mock interviews to see your progress.</div>
            )}
        </div>
    )
}


/* ── Behaviour analysis block ── */
function BehaviorAnalysis({ analysis }) {
    const sourceCounts      = analysis.sourceCounts      || {}
    const topGaps           = analysis.recurringGaps?.slice(0, 5)      || []
    const strongestSignals  = analysis.strongestSignals?.slice(0, 5)   || []

    return (
        <section className="behavior-card">
            <div className="behavior-card__score">
                <p className="section-kicker">Readiness Score</p>
                <strong>{analysis.readinessScore ?? "—"}</strong>
                <span>career readiness</span>
            </div>

            <div className="behavior-card__body">
                <p className="section-kicker">Persistent AI Behavior Analysis</p>

                <div className="behavior-metrics">
                    <span>{sourceCounts.atsAnalyses   || 0} ATS scans</span>
                    <span>{sourceCounts.interviewPlans || 0} plans</span>
                    <span>{sourceCounts.mockInterviews || 0} mocks</span>
                    <span>{analysis.interviewBehavior?.consistency || "insufficient-data"}</span>
                </div>

                <SignalList title="Strong signals" items={strongestSignals} />
                <SignalList title="Recurring gaps"  items={topGaps} />

                <ul className="behavior-recommendations">
                    {(analysis.recommendations || []).map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

/* ── Signal chip list ── */
function SignalList({ title, items }) {
    return (
        <div className="behavior-signals">
            <h3>{title}</h3>
            <div className="chip-list">
                {items.length
                    ? items.map((item, i) => {
                          const label = typeof item === "string" ? item : item.name || String(item)
                          return <span className="chip" key={`${label}-${i}`}>{label}</span>
                      })
                    : <span className="chip">More data needed</span>
                }
            </div>
        </div>
    )
}

/* ── Activity timeline ── */
function Timeline({ items }) {
    return (
        <section className="feature-card">
            <p className="section-kicker">Activity Timeline</p>
            <div className="timeline-list">
                {items.map((item) => (
                    <div key={`${item.type}-${item.createdAt}-${item.title}`}>
                        <strong>{item.type}</strong>
                        <span>{item.title} · {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

/* ── Recent Reports ── */
function RecentReports({ reports }) {
    const hasReports = Array.isArray(reports) && reports.length > 0

    return (
        <section className="feature-card">
            <p className="section-kicker">Recent Reports</p>
            {hasReports ? (
                <div className="timeline-list">
                    {reports.map((report) => (
                        <div key={report._id || `report-${report.createdAt}`}>
                            <strong>{report.title || "Untitled Report"}</strong>
                            <span>
                                {report.matchScore != null ? `${report.matchScore}% match` : "No match score"} · {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-timeline-state">No reports generated yet. Create interview prep plans to get started.</div>
            )}
        </section>
    )
}