const mockInterviewModel = require("./mockInterview.model")
const { ApiError } = require("../../utils/http")
const {
    evaluateMockAnswer,
    generateMockFinalReport,
    generateMockQuestion
} = require("../../services/ai.service")

const MAX_QUESTIONS = 5

async function startMockInterview(req, res) {
    const { role, difficulty, interviewType } = req.body
    const firstQuestion = await generateMockQuestion({ role, difficulty, interviewType })
    const session = await mockInterviewModel.create({
        user: req.user.id,
        role,
        difficulty,
        interviewType,
        messages: [ {
            role: "assistant",
            content: firstQuestion.question,
            focusArea: firstQuestion.focusArea
        } ]
    })

    res.status(201).json({
        message: "Mock interview started.",
        session
    })
}

async function submitAnswer(req, res) {
    const { sessionId } = req.params
    const { answer } = req.body
    const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id })

    if (!session) {
        throw new ApiError(404, "Mock interview session not found.")
    }

    if (session.status === "completed") {
        throw new ApiError(400, "This mock interview is already completed.")
    }

    const lastQuestion = [ ...session.messages ].reverse().find((message) => message.role === "assistant")

    if (!lastQuestion) {
        throw new ApiError(400, "No active interview question found.")
    }

    const evaluation = await evaluateMockAnswer({
        role: session.role,
        difficulty: session.difficulty,
        interviewType: session.interviewType,
        question: lastQuestion.content,
        answer
    })

    session.messages.push({ role: "user", content: answer })
    session.evaluations.push({
        question: lastQuestion.content,
        answer,
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements
    })

    if (session.evaluations.length >= MAX_QUESTIONS) {
        session.finalReport = await generateMockFinalReport(session)
        session.status = "completed"
    } else {
        const nextQuestion = evaluation.followUpQuestion
            ? { question: evaluation.followUpQuestion, focusArea: "Follow-up" }
            : await generateMockQuestion(session)

        session.messages.push({
            role: "assistant",
            content: nextQuestion.question,
            focusArea: nextQuestion.focusArea
        })
    }

    await session.save()

    res.status(200).json({
        message: session.status === "completed" ? "Mock interview completed." : "Answer submitted.",
        session
    })
}

async function finishMockInterview(req, res) {
    const { sessionId } = req.params
    const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id })

    if (!session) {
        throw new ApiError(404, "Mock interview session not found.")
    }

    if (session.status !== "completed") {
        session.finalReport = await generateMockFinalReport(session)
        session.status = "completed"
        await session.save()
    }

    res.status(200).json({
        message: "Final report generated.",
        session
    })
}

async function getMockInterviews(req, res) {
    const sessions = await mockInterviewModel.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20)

    res.status(200).json({
        message: "Mock interviews fetched successfully.",
        sessions
    })
}

module.exports = { startMockInterview, submitAnswer, finishMockInterview, getMockInterviews }
