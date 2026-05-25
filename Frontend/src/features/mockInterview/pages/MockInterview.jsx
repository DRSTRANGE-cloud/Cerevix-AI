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
            <header className="feature-header">
                <p className="eyebrow">Cerevix AI</p>
                <h1>AI Mock Interview Simulator</h1>
                <span>Practice in a focused text interview. Evaluation stays private until the final report.</span>
            </header>

            {!session ? (
                <form className="feature-card mock-start" onSubmit={handleSubmit(start)} noValidate>
                    <label>
                        Role
                        <input {...register("role")} />
                        {errors.role && <span className="field-error">{errors.role.message}</span>}
                    </label>
                    <label>
                        Difficulty
                        <select {...register("difficulty")}>
                            <option value="junior">Junior</option>
                            <option value="mid">Mid-level</option>
                            <option value="senior">Senior</option>
                        </select>
                    </label>
                    <label>
                        Interview type
                        <select {...register("interviewType")}>
                            <option value="technical">Technical</option>
                            <option value="behavioral">Behavioral</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </label>
                    <button className="button primary-button" disabled={!isValid || loading}>{loading ? "Preparing..." : "Start Interview"}</button>
                </form>
            ) : (
                <div className="mock-layout">
                    <aside className="feature-card mock-sidebar">
                        <p className="eyebrow">Session</p>
                        <h2>{session.role}</h2>
                        <span>{session.difficulty} · {session.interviewType}</span>
                        <strong>{session.evaluations.length}/5 answers</strong>
                        {session.status !== "completed" && (
                            <button className="button ghost-button" onClick={finish} disabled={loading || session.evaluations.length === 0}>
                                Finish session
                            </button>
                        )}
                    </aside>

                    <section className="feature-card chat-panel">
                        <div className="chat-messages" aria-live="polite">
                            {session.messages.map((message, index) => (
                                <Motion.div
                                    className={`chat-bubble chat-bubble--${message.role}`}
                                    key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p>{message.content}</p>
                                </Motion.div>
                            ))}
                            {loading && <div className="typing-indicator">Cerevix is thinking...</div>}
                        </div>

                        {session.status === "completed" ? (
                            <FinalReport report={session.finalReport} />
                        ) : (
                            <form className="answer-form" onSubmit={submitAnswer}>
                                <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows="4" placeholder="Type your answer..." />
                                <button className="button primary-button" disabled={loading}>Submit Answer</button>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </main>
    )
}

function FinalReport({ report }) {
    const scores = [
        [ "Technical", report?.technicalScore || 0 ],
        [ "Communication", report?.communicationScore || 0 ],
        [ "Confidence", report?.confidenceScore || 0 ]
    ]

    return (
        <section className="final-report">
            <p className="eyebrow">Final Report</p>
            <div className="score-row">
                {scores.map(([ label, score ]) => (
                    <div key={label}>
                        <strong>{score}</strong>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            <div className="skill-columns">
                <div>
                    <h3>Strong Topics</h3>
                    <div className="chip-list">{report?.strongTopics?.map((item) => <span className="chip chip--good" key={item}>{item}</span>)}</div>
                </div>
                <div>
                    <h3>Weak Topics</h3>
                    <div className="chip-list">{report?.weakTopics?.map((item) => <span className="chip chip--risk" key={item}>{item}</span>)}</div>
                </div>
            </div>
            <ul className="insight-list">
                {report?.preparationRecommendations?.map((item) => <li key={item}>{item}</li>)}
            </ul>
        </section>
    )
}
