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
        .default(""),
    resumeText: z.string()
        .trim()
        .max(12000, "Resume text must be 12000 characters or fewer.")
        .optional()
        .default("")
})

const interviewIdParamsSchema = z.object({
    interviewId: objectIdSchema
})

const resumePdfParamsSchema = z.object({
    interviewReportId: objectIdSchema
})

const resumeVersionParamsSchema = z.object({
    interviewReportId: objectIdSchema,
    versionId: objectIdSchema
})

const resumeSectionsSchema = z.object({
    name: z.string().trim().max(200).optional().default(""),
    summary: z.string().trim().max(2500).optional().default(""),
    skills: z.array(z.string().trim().max(120)).max(80).optional().default([]),
    projects: z.array(z.string().trim().max(1000)).max(30).optional().default([]),
    experience: z.array(z.string().trim().max(1000)).max(40).optional().default([]),
    education: z.string().trim().max(1500).optional().default(""),
    certifications: z.string().trim().max(1500).optional().default("")
})

const updateResumePreviewSchema = z.object({
    sections: resumeSectionsSchema,
    saveVersion: z.boolean().optional().default(false),
    versionLabel: z.string().trim().max(120).optional().default("")
})

const improveResumeSectionSchema = z.object({
    section: z.enum([ "name", "summary", "skills", "projects", "experience", "education", "certifications" ]),
    instruction: z.string().trim().min(5).max(500)
})

module.exports = {
    generateInterviewSchema,
    interviewIdParamsSchema,
    resumePdfParamsSchema,
    resumeVersionParamsSchema,
    updateResumePreviewSchema,
    improveResumeSectionSchema
}
