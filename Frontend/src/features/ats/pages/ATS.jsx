import { zodResolver } from "@hookform/resolvers/zod"
import { motion as Motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { z } from "zod"
import { useToast } from "../../../components/toast.context"
import { getInterviewSources } from "../../interview/services/interview.api"
import { createAtsAnalysis, createAtsAnalysisFromInterview, deleteAtsAnalysis, getAtsAnalyses } from "../services/ats.api"
import "../style.scss"

const atsSchema = z.object({
    jobDescription: z.string().trim().min(40, "Paste a fuller job description."),
    resume: z.any()
        .refine((files) => files?.length === 1, "Upload a resume PDF.")
        .refine((files) => files?.[0]?.type === "application/pdf", "Resume upload must be a PDF file.")
        .refine((files) => !files?.[0] || files[0].size <= 3 * 1024 * 1024, "Resume PDF must be 3MB or smaller.")
})

function ScoreCard({ analysis }) {
    const chartData = [
        { name: "Matched", value: analysis.keywordMatch },
        { name: "Missing", value: 100 - analysis.keywordMatch }
    ]

    return (
        <Motion.section className="feature-card ats-score-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div>
                <p className="section-kicker">ATS Score</p>
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
            <p className="section-kicker">Skill Fit</p>
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
            <p className="section-kicker">{title}</p>
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
    const [ interviewSources, setInterviewSources ] = useState([])
    const [ selectedInterviewSource, setSelectedInterviewSource ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const { register, watch, handleSubmit, reset, setValue, formState: { errors, isValid } } = useForm({
        resolver: zodResolver(atsSchema),
        mode: "onChange",
        defaultValues: {
            jobDescription: ""
        }
    })
    const resumeFiles = watch("resume")
    const resumeName = resumeFiles?.[0]?.name
    const resumeField = register("resume")

    useEffect(() => {
        getAtsAnalyses()
            .then((data) => {
                setHistory(data.analyses || [])
            })
            .catch((error) => showToast(error.message, "error"))
        getInterviewSources()
            .then((data) => setInterviewSources((data.sources || []).filter((source) => source.hasResume)))
            .catch(() => setInterviewSources([]))
    }, [ showToast ])

    const handleInterviewSourceChange = (event) => {
        const sourceId = event.target.value
        const source = interviewSources.find((item) => item._id === sourceId)

        setSelectedInterviewSource(sourceId)

        if (source) {
            setValue("jobDescription", source.jobDescription || "", { shouldValidate: true, shouldDirty: true })
        }
    }

    const handleSelectAnalysis = (selectedAnalysis) => {
        setAnalysis(selectedAnalysis)
    }

    const handleDeleteAnalysis = async (analysisId) => {
        setLoading(true)

        try {
            await deleteAtsAnalysis(analysisId)
            const updatedHistory = history.filter((item) => item._id !== analysisId)
            setHistory(updatedHistory)
            if (analysis?._id === analysisId) {
                setAnalysis(updatedHistory[0] || null)
            }
            showToast("Analysis deleted.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async ({ jobDescription, resume }) => {
        setLoading(true)

        try {
            const data = await createAtsAnalysis({ jobDescription, resumeFile: resume[0] })
            setAnalysis(data.analysis)
            setHistory((current) => [data.analysis, ...current.filter((item) => item._id !== data.analysis._id)])
            reset({ jobDescription: "" })
            setSelectedInterviewSource("")
            showToast("ATS analysis generated.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const handleRunFromInterview = async () => {
        if (!selectedInterviewSource) {
            showToast("Choose an interview plan first.", "error")
            return
        }

        setLoading(true)

        try {
            const data = await createAtsAnalysisFromInterview(selectedInterviewSource)
            setAnalysis(data.analysis)
            setHistory((current) => [data.analysis, ...current.filter((item) => item._id !== data.analysis._id)])
            reset({ jobDescription: "" })
            setSelectedInterviewSource("")
            showToast("ATS analysis generated from interview plan.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="feature-page">
            <header className="feature-header">
                <h1>ATS Resume Intelligence</h1>
                <span>Measure resume fit, uncover missing keywords, and get AI-backed optimization guidance.</span>
            </header>

            <form className="feature-card ats-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {interviewSources.length > 0 && (
                    <div className="bridge-panel">
                        <label>
                            Reuse interview plan
                            <select value={selectedInterviewSource} onChange={handleInterviewSourceChange}>
                                <option value="">Choose a saved plan</option>
                                {interviewSources.map((source) => (
                                    <option key={source._id} value={source._id}>
                                        {source.title || "Interview plan"} - {new Date(source.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            className="button secondary-button"
                            type="button"
                            onClick={handleRunFromInterview}
                            disabled={!selectedInterviewSource || loading}
                        >
                            Run ATS From Plan
                        </button>
                    </div>
                )}
                <label className="ats-upload-field" htmlFor="ats-resume">
                    <span className="section-label">
                        Resume PDF
                        <span className="badge badge--best">Required</span>
                    </span>
                    <span className={`dropzone ats-dropzone ${resumeName ? "dropzone--selected" : ""}`}>
                        <span className="dropzone__icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                        </span>
                        <span className="dropzone__title">{resumeName ? "Resume ready" : "Click to upload or drag & drop"}</span>
                        <span className="dropzone__subtitle">{resumeName || "PDF only (Max 3MB)"}</span>
                    </span>
                    <input hidden id="ats-resume" type="file" accept="application/pdf,.pdf" {...resumeField} />
                    {errors.resume && <span className="field-error">{errors.resume.message}</span>}
                </label>
                <label>
                    Target job description
                    <textarea rows="7" {...register("jobDescription")} />
                    {errors.jobDescription && <span className="field-error">{errors.jobDescription.message}</span>}
                </label>
                <button className="button primary-button" disabled={!isValid || loading}>{loading ? "Analyzing..." : "Run ATS Analysis"}</button>
            </form>

            {history.length > 0 && (
                <section className="feature-card analysis-history">
                    <p className="section-kicker">Analysis History</p>
                    <div className="history-list">
                        {history.map((item) => (
                            <div key={item._id} className={`history-item ${analysis?._id === item._id ? "history-item--active" : ""}`}>
                                <button
                                    type="button"
                                    className="history-item__button"
                                    onClick={() => handleSelectAnalysis(item)}
                                >
                                    <strong>{item.atsScore}%</strong>
                                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                                </button>
                                <button
                                    type="button"
                                    className="button ghost-button history-delete"
                                    onClick={() => handleDeleteAnalysis(item._id)}
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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
        </main>
    )
}
