const express = require("express")
const { z } = require("zod")
const authMiddleware = require("../../middlewares/auth.middleware")
const { validateBody, validateParams } = require("../../middlewares/validate.middleware")
const { asyncHandler } = require("../../utils/http")
const mockInterviewController = require("./mockInterview.controller")

const mockInterviewRouter = express.Router()

const sessionParamsSchema = z.object({
    sessionId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid mock interview session id.")
})

const startSessionSchema = z.object({
    role: z.string().trim().min(2, "Role is required.").max(120),
    difficulty: z.enum([ "junior", "mid", "senior" ]),
    interviewType: z.enum([ "technical", "behavioral", "mixed" ])
})

const answerSchema = z.object({
    answer: z.string().trim().min(20, "Answer must be at least 20 characters.").max(4000)
})

mockInterviewRouter.use(asyncHandler(authMiddleware.authUser))

mockInterviewRouter.post("/", validateBody(startSessionSchema), asyncHandler(mockInterviewController.startMockInterview))
mockInterviewRouter.get("/", asyncHandler(mockInterviewController.getMockInterviews))
mockInterviewRouter.post("/:sessionId/answer", validateParams(sessionParamsSchema), validateBody(answerSchema), asyncHandler(mockInterviewController.submitAnswer))
mockInterviewRouter.post("/:sessionId/finish", validateParams(sessionParamsSchema), asyncHandler(mockInterviewController.finishMockInterview))

module.exports = mockInterviewRouter
