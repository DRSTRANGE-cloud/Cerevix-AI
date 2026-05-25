import { zodResolver } from "@hookform/resolvers/zod"
import { motion as Motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { z } from "zod"
import { useToast } from "../../../components/toast.context"
import { createAtsAnalysis, getAtsAnalyses } from "../services/ats.api"
import "../style.scss"

const atsSchema = z.object({
    jobDescription: z.string().trim().min(40, "Paste a fuller job description."),
    resume: z.any().refine((files) => files?.length === 1, "Upload a resume PDF.")
})

function ScoreCard({ analysis }) {
    const chartData = [
        { name: "Matched", value: analysis.keywordMatch },
        { name: "Missing", value: 100 - analysis.keywordMatch }
    ]

    return (
        <Motion.section className="feature-card ats-score-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div>
                <p className="eyebrow">ATS Score</p>
                <h2>{analysis.atsScore}</h2>
                <span>{analysis.keywordMatch}% keyword match</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                    <Pie data={chartData} innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={4}>
                        <Cell fill="var(--color-accent)" />
                        <Cell fill="var(--color-border)" />
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </Motion.section>
    )
}

function SkillGapPanel({ analysis }) {
    return (
        <section className="feature-card">
            <p className="eyebrow">Skill Fit</p>
            <div className="skill-columns">
                <div>
                    <h3>Matched</h3>
                    <div className="chip-list">{analysis.matchedSkills.map((skill) => <span className="chip chip--good" key={skill}>{skill}</span>)}</div>
                </div>
                <div>
                    <h3>Missing</h3>
                    <div className="chip-list">{analysis.missingSkills.map((skill) => <span className="chip chip--risk" key={skill}>{skill}</span>)}</div>
                </div>
            </div>
        </section>
    )
}

function SuggestionList({ title, items }) {
    return (
        <section className="feature-card">
            <p className="eyebrow">{title}</p>
            <ul className="insight-list">
                {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
        </section>
    )
}

export default function ATS() {
    const { showToast } = useToast()
    const [ analysis, setAnalysis ] = useState(null)
    const [ history, setHistory ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const { register, handleSubmit, formState: { errors, isValid } } = useForm({
        resolver: zodResolver(atsSchema),
        mode: "onChange"
    })

    useEffect(() => {
        getAtsAnalyses()
            .then((data) => {
                setHistory(data.analyses)
                setAnalysis(data.analyses[0] || null)
            })
            .catch((error) => showToast(error.message, "error"))
    }, [ showToast ])

    const onSubmit = async ({ jobDescription, resume }) => {
        setLoading(true)

        try {
            const data = await createAtsAnalysis({ jobDescription, resumeFile: resume[0] })
            setAnalysis(data.analysis)
            setHistory((items) => [ data.analysis, ...items ])
            showToast("ATS analysis generated.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="feature-page">
            <header className="feature-header">
                <p className="eyebrow">Cerevix AI</p>
                <h1>ATS Resume Intelligence</h1>
                <span>Measure resume fit, uncover missing keywords, and get AI-backed optimization guidance.</span>
            </header>

            <form className="feature-card ats-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <label>
                    Resume PDF
                    <input type="file" accept="application/pdf,.pdf" {...register("resume")} />
                    {errors.resume && <span className="field-error">{errors.resume.message}</span>}
                </label>
                <label>
                    Target job description
                    <textarea rows="7" {...register("jobDescription")} />
                    {errors.jobDescription && <span className="field-error">{errors.jobDescription.message}</span>}
                </label>
                <button className="button primary-button" disabled={!isValid || loading}>{loading ? "Analyzing..." : "Run ATS Analysis"}</button>
            </form>

            {analysis ? (
                <div className="feature-grid">
                    <ScoreCard analysis={analysis} />
                    <SkillGapPanel analysis={analysis} />
                    <SuggestionList title="Strengths" items={analysis.strengths} />
                    <SuggestionList title="Weak Sections" items={analysis.weaknesses} />
                    <SuggestionList title="Optimization Suggestions" items={analysis.suggestions} />
                    <SuggestionList title="Recommendations" items={analysis.recommendations} />
                </div>
            ) : (
                <section className="empty-state"><h2>No ATS analysis yet</h2><p>Upload a resume and job description to generate your first analysis.</p></section>
            )}

            {history.length > 1 && (
                <section className="feature-card">
                    <p className="eyebrow">Recent ATS Runs</p>
                    <div className="history-list">
                        {history.slice(0, 5).map((item) => (
                            <button key={item._id} onClick={() => setAnalysis(item)}>
                                <strong>{item.atsScore}</strong>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}
