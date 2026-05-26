import { motion as Motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useToast } from "../../../components/toast.context"
import { getCareerAnalytics } from "../services/dashboard.api"
import "../style.scss"

export default function Dashboard() {
    const { showToast } = useToast()
    const [ analytics, setAnalytics ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        getCareerAnalytics()
            .then((data) => setAnalytics(data.analytics))
            .catch((error) => showToast(error.message, "error"))
            .finally(() => setLoading(false))
    }, [ showToast ])

    if (loading) {
        return <main className="app-shell app-shell--center"><div className="skeleton-card" /></main>
    }

    if (!analytics) {
        return <main className="app-shell app-shell--center"><section className="empty-state"><h1>No analytics yet</h1><p>Create reports and mock interviews to unlock your dashboard.</p></section></main>
    }

    const overview = [
        [ "Average ATS", analytics.overview.averageAtsScore ],
        [ "Interview Score", analytics.overview.averageInterviewScore ],
        [ "Completed Sessions", analytics.overview.completedInterviewSessions ],
        [ "Reports Generated", analytics.overview.reportsGenerated ]
    ]

    return (
        <main className="dashboard-page">
            <header className="feature-header">
                <h1>Career Analytics Dashboard</h1>
                <span>Track resume fit, interview readiness, weak skills, and recent preparation activity.</span>
            </header>

            <section className="overview-grid">
                {overview.map(([ label, value ]) => (
                    <Motion.div className="feature-card overview-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </Motion.div>
                ))}
            </section>

            <section className="dashboard-grid">
                <div className="feature-card chart-card">
                    <p className="eyebrow">ATS Trend</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={analytics.atsTrend}>
                            <CartesianGrid stroke="var(--color-border)" />
                            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip labelFormatter={(date) => new Date(date).toLocaleString()} />
                            <Area dataKey="score" stroke="var(--color-accent)" fill="rgba(20, 184, 166, 0.22)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="feature-card chart-card">
                    <p className="eyebrow">Interview Trend</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={analytics.interviewTrend}>
                            <CartesianGrid stroke="var(--color-border)" />
                            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip labelFormatter={(date) => new Date(date).toLocaleString()} />
                            <Area dataKey="score" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.18)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <SkillBars title="Weak Skills" data={analytics.weakestSkills} />
                <SkillBars title="Strongest Skills" data={analytics.strongestSkills} />
            </section>

            <section className="dashboard-grid dashboard-grid--bottom">
                <Timeline items={analytics.activityTimeline} />
                <section className="feature-card">
                    <p className="eyebrow">Recent Reports</p>
                    <div className="timeline-list">
                        {analytics.recentReports.map((report) => (
                            <div key={report._id}>
                                <strong>{report.title}</strong>
                                <span>{report.matchScore}% match · {new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    )
}

function SkillBars({ title, data }) {
    return (
        <section className="feature-card chart-card">
            <p className="eyebrow">{title}</p>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data}>
                    <CartesianGrid stroke="var(--color-border)" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </section>
    )
}

function Timeline({ items }) {
    return (
        <section className="feature-card">
            <p className="eyebrow">Activity Timeline</p>
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
