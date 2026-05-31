import { zodResolver } from "@hookform/resolvers/zod"
import { motion as Motion } from "framer-motion"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useToast } from "../../../components/toast.context"
import { finishMockInterview, startMockInterview, submitMockAnswer } from "../services/mockInterview.api"
import "../style.scss"

const startSchema = z.object({
    role: z.string().trim().min(2, "Role is required."),
    difficulty: z.enum([ "junior", "mid", "senior" ]),
    interviewType: z.enum([ "technical", "behavioral", "mixed" ])
})

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
}

export default function MockInterview() {
    const { showToast } = useToast()
    const [ session, setSession ] = useState(null)
    const [ answer, setAnswer ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const { register, handleSubmit, formState: { errors, isValid } } = useForm({
        resolver: zodResolver(startSchema),
        mode: "onChange",
        defaultValues: {
            role: "Frontend Engineer",
            difficulty: "mid",
            interviewType: "mixed"
        }
    })

    const start = async (values) => {
        setLoading(true)

        try {
            const data = await startMockInterview(values)
            setSession(data.session)
            showToast("Mock interview started.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const submitAnswer = async (event) => {
        event.preventDefault()

        if (answer.trim().length < 20) {
            showToast("Write a fuller answer before submitting.", "error")
            return
        }

        setLoading(true)

        try {
            const data = await submitMockAnswer({ sessionId: session._id, answer })
            setSession(data.session)
            setAnswer("")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    const finish = async () => {
        setLoading(true)

        try {
            const data = await finishMockInterview(session._id)
            setSession(data.session)
            showToast("Final report generated.", "success")
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mock-page">
            {!session ? (
                <>
                    <Motion.header 
                        className="mock-hero"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="mock-hero__content">
                            <h1>AI Mock Interview Simulator</h1>
                            <p className="description">
                                Step into a lifelike interview experience powered by advanced AI. Get real-time feedback and actionable insights to sharpen your interview skills.
                            </p>
                        </div>
                        <div className="mock-hero__stats">
                            <Motion.div 
                                className="stat-card"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="stat-value">15-30</div>
                                <div className="stat-label">Minutes</div>
                            </Motion.div>
                            <Motion.div 
                                className="stat-card"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="stat-value">5</div>
                                <div className="stat-label">Questions</div>
                            </Motion.div>
                            <Motion.div 
                                className="stat-card"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="stat-value">3</div>
                                <div className="stat-label">Skill Areas</div>
                            </Motion.div>
                        </div>
                    </Motion.header>

                    <Motion.section 
                        className="mock-start-section"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Motion.div variants={itemVariants}>
                            <h2>Configure Your Interview</h2>
                            <p>Customize the difficulty and type of interview to match your target role.</p>
                        </Motion.div>
                        
                        <Motion.form 
                            className="mock-form"
                            onSubmit={handleSubmit(start)} 
                            noValidate
                            variants={itemVariants}
                        >
                            <div className="form-group">
                                <label htmlFor="role" className="form-label">Target Role</label>
                                <input 
                                    id="role"
                                    {...register("role")} 
                                    placeholder="e.g., Frontend Engineer, Product Manager"
                                    className="form-input"
                                />
                                {errors.role && <span className="field-error">{errors.role.message}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="difficulty" className="form-label">Experience Level</label>
                                    <select {...register("difficulty")} id="difficulty" className="form-select">
                                        <option value="junior">Junior (0-2 years)</option>
                                        <option value="mid">Mid-level (2-5 years)</option>
                                        <option value="senior">Senior (5+ years)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="interviewType" className="form-label">Interview Type</label>
                                    <select {...register("interviewType")} id="interviewType" className="form-select">
                                        <option value="technical">Technical</option>
                                        <option value="behavioral">Behavioral</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                className="button primary-button start-interview-btn" 
                                disabled={!isValid || loading}
                                type="submit"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Preparing Interview...
                                    </>
                                ) : (
                                    <>
                                        Start Interview
                                    </>
                                )}
                            </button>
                        </Motion.form>

                        <Motion.div 
                            className="what-to-expect"
                            variants={itemVariants}
                        >
                            <h3>What to Expect</h3>
                            <ul>
                                <li>AI-generated questions tailored to your role and level</li>
                                <li>Real-time evaluation of your technical knowledge and communication</li>
                                <li>Comprehensive feedback report with improvement areas</li>
                                <li>Comparison with optimal answers and best practices</li>
                            </ul>
                        </Motion.div>
                    </Motion.section>
                </>
            ) : (
                <Motion.div 
                    className="mock-layout"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <aside className="mock-sidebar">
                        <div className="sidebar-header">
                            <div className="ai-status">
                                <div className="status-dot"></div>
                                <span>Interview Active</span>
                            </div>
                        </div>

                        <div className="session-info">
                            <p className="section-kicker">Current Session</p>
                            <h3>{session.role}</h3>
                            <div className="session-tags">
                                <span className="tag">{session.difficulty}</span>
                                <span className="tag">{session.interviewType}</span>
                            </div>
                        </div>

                        <div className="progress-tracker">
                            <p className="section-kicker">Progress</p>
                            <div className="progress-bar">
                                <Motion.div 
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(session.evaluations.length / 5) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="progress-text">{session.evaluations.length}/5 answers</span>
                        </div>

                        {session.status !== "completed" && (
                            <button 
                                className="button secondary-button finish-btn" 
                                onClick={finish} 
                                disabled={loading || session.evaluations.length === 0}
                            >
                                Finish Session
                            </button>
                        )}
                    </aside>

                    <section className="chat-container">
                        <div className="chat-panel">
                            <div className="chat-messages" aria-live="polite">
                                {session.messages.map((message, index) => (
                                    <Motion.div
                                        className={`chat-bubble chat-bubble--${message.role}`}
                                        key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                                        initial={{ opacity: 0, y: 8, x: message.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, y: 0, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="bubble-avatar">Cerevix</div>
                                        )}
                                        <p>{message.content}</p>
                                    </Motion.div>
                                ))}
                                {loading && (
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                        <p>Cerevix AI is thinking...</p>
                                    </div>
                                )}
                            </div>

                            {session.status === "completed" ? (
                                <FinalReport report={session.finalReport} />
                            ) : (
                                <form className="answer-form" onSubmit={submitAnswer}>
                                    <textarea 
                                        value={answer} 
                                        onChange={(event) => setAnswer(event.target.value)} 
                                        rows="3" 
                                        placeholder="Type your answer here. Take your time to craft a thoughtful response..."
                                        disabled={loading}
                                    />
                                    <div className="form-footer">
                                        <span className="char-count">{answer.length} characters</span>
                                        <button 
                                            className="button primary-button" 
                                            disabled={loading || answer.trim().length < 20}
                                        >
                                            {loading ? "Evaluating..." : "Submit Answer"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>
                </Motion.div>
            )}
        </main>
    )
}

function FinalReport({ report }) {
    const scores = [
        [ "Technical", report?.technicalScore || 0, "#14b8a6" ],
        [ "Communication", report?.communicationScore || 0, "#3b82f6" ],
        [ "Confidence", report?.confidenceScore || 0, "#f97316" ]
    ]

    return (
        <Motion.section 
            className="final-report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="report-header">
                <p className="section-kicker">Final Report</p>
                <h2>Interview Complete</h2>
            </div>

            <div className="score-grid">
                {scores.map(([ label, score, color ], idx) => (
                    <Motion.div 
                        key={label}
                        className="score-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                    >
                        <div className="score-ring" style={{ "--score-color": color }}>
                            <svg viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" className="score-ring-bg" />
                                <Motion.circle 
                                    cx="60" 
                                    cy="60" 
                                    r="54" 
                                    className="score-ring-progress"
                                    style={{ "--score-color": color }}
                                    initial={{ strokeDashoffset: 339.29 }}
                                    animate={{ strokeDashoffset: 339.29 - (score / 100) * 339.29 }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                />
                            </svg>
                            <div className="score-value">{score}</div>
                        </div>
                        <span className="score-label">{label}</span>
                    </Motion.div>
                ))}
            </div>

            <div className="report-sections">
                <Motion.div 
                    className="report-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h3>Strong Topics</h3>
                    <div className="chip-list">
                        {report?.strongTopics?.map((item) => (
                            <span key={item} className="chip chip--good">{item}</span>
                        ))}
                    </div>
                </Motion.div>

                <Motion.div 
                    className="report-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h3>Areas for Growth</h3>
                    <div className="chip-list">
                        {report?.weakTopics?.map((item) => (
                            <span key={item} className="chip chip--risk">{item}</span>
                        ))}
                    </div>
                </Motion.div>
            </div>

            <Motion.div 
                className="recommendations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <h3>Preparation Recommendations</h3>
                <ul className="insight-list">
                    {report?.preparationRecommendations?.map((item, idx) => (
                        <Motion.li 
                            key={item}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                        >
                            {item}
                        </Motion.li>
                    ))}
                </ul>
            </Motion.div>
        </Motion.section>
    )
}
