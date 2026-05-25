const { z } = require("zod")

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid interview report id.")

const generateInterviewSchema = z.object({
    jobDescription: z.string()
        .trim()
        .min(40, "Job description must be at least 40 characters.")
        .max(8000, "Job description must be 8000 characters or fewer."),
    selfDescription: z.string()
        .trim()
        .max(4000, "Self description must be 4000 characters or fewer.")
        .optional()
        .default("")
})

const interviewIdParamsSchema = z.object({
    interviewId: objectIdSchema
})

const resumePdfParamsSchema = z.object({
    interviewReportId: objectIdSchema
})

module.exports = {
    generateInterviewSchema,
    interviewIdParamsSchema,
    resumePdfParamsSchema
}
