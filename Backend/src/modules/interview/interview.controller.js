const pdfParse = require("pdf-parse")
const {
    createResumeHtml,
    generateInterviewReport,
    generatePdfFromHtml,
    generateResumePdf,
    generateResumePreview,
    improveResumeSection
} = require("../../services/ai.service")
const { ApiError } = require("../../utils/http")
const { refreshUserBehaviorAnalysis } = require("../behavior/behavior.service")
const { analyzeKeywordMatch } = require("../ats/ats.service")
const interviewReportModel = require("./interviewReport.model")

const ACTION_VERBS = [
    "achieved", "built", "created", "delivered", "designed", "developed", "improved",
    "increased", "launched", "led", "optimized", "reduced", "shipped", "scaled"
]
const MAX_RESUME_VERSIONS = 3

function textFromSections(sections = {}) {
    return Object.values(sections)
        .flat()
        .join(" ")
}

function clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score || 0)))
}

function calculateResumeAnalytics({ sections, html, jobDescription }) {
    const resumeText = textFromSections(sections) || String(html || "").replace(/<[^>]+>/g, " ")
    const keywordMetrics = analyzeKeywordMatch({ resume: resumeText, jobDescription })
    const wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length
    const sentenceCount = Math.max(1, resumeText.split(/[.!?]+/).filter((item) => item.trim()).length)
    const averageSentenceLength = wordCount / sentenceCount
    const actionVerbCount = ACTION_VERBS.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(resumeText)).length
    const skills = Array.isArray(sections?.skills) ? sections.skills : []
    const skillCoverage = keywordMetrics.matchedSkills.length + keywordMetrics.missingSkills.length
        ? (keywordMetrics.matchedSkills.length / (keywordMetrics.matchedSkills.length + keywordMetrics.missingSkills.length)) * 100
        : 0

    return {
        atsScore: keywordMetrics.atsScore,
        keywordMatch: keywordMetrics.keywordMatch,
        skillCoverage: clampScore(skillCoverage || skills.length * 8),
        missingSkills: keywordMetrics.missingSkills,
        readabilityScore: clampScore(100 - Math.max(0, averageSentenceLength - 18) * 4),
        resumeLengthScore: clampScore(wordCount >= 350 && wordCount <= 850 ? 92 : wordCount < 350 ? wordCount / 3.5 : 100 - ((wordCount - 850) / 12)),
        actionVerbScore: clampScore(actionVerbCount * 12)
    }
}

function createVersionFromBuilder(builder, label = "Manual save") {
    return {
        html: builder.html,
        sections: builder.sections,
        analytics: builder.analytics,
        label,
        createdAt: new Date()
    }
}

function buildResumePayload(report) {
    return {
        resume: report.resumeBuilder || null
    }
}

async function getResumeText(file) {
    if (!file) {
        return ""
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(file.buffer))).getText()
    return resumeContent.text
}

async function generateInterViewReportController(req, res) {
    const { selfDescription, jobDescription, resumeText: reusedResumeText } = req.body
    const resumeText = await getResumeText(req.file) || reusedResumeText

    if (!resumeText && !selfDescription) {
        throw new ApiError(400, "Upload a resume PDF or add a self description.")
    }

    const reportFromAi = await generateInterviewReport({
        resume: resumeText,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription,
        jobDescription,
        ...reportFromAi
    })
    await refreshUserBehaviorAnalysis(req.user.id)

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })
}

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

async function getInterviewSourcesController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("title matchScore jobDescription resume selfDescription createdAt")
        .limit(20)
        .lean()

    const sources = interviewReports.map((report) => ({
        _id: report._id,
        title: report.title,
        matchScore: report.matchScore,
        jobDescription: report.jobDescription,
        resume: report.resume || "",
        selfDescription: report.selfDescription || "",
        hasResume: Boolean(report.resume || report.selfDescription),
        createdAt: report.createdAt
    }))

    res.status(200).json({
        message: "Interview plan sources fetched successfully.",
        sources
    })
}

async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOneAndDelete({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    await refreshUserBehaviorAnalysis(req.user.id)

    res.status(200).json({
        message: "Interview report deleted successfully."
    })
}

async function clearInterviewReportsController(req, res) {
    await interviewReportModel.deleteMany({ user: req.user.id })
    await refreshUserBehaviorAnalysis(req.user.id)

    res.status(200).json({
        message: "Interview report history cleared successfully."
    })
}

async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    const { resume, jobDescription, selfDescription } = interviewReport
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    })

    res.send(pdfBuffer)
}

async function generateResumePreviewController(req, res) {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    const draft = await generateResumePreview({
        resume: interviewReport.resume,
        selfDescription: interviewReport.selfDescription,
        jobDescription: interviewReport.jobDescription,
        title: interviewReport.title
    })
    const analytics = calculateResumeAnalytics({
        sections: draft.sections,
        html: draft.html,
        jobDescription: interviewReport.jobDescription
    })

    interviewReport.resumeBuilder = {
        html: draft.html,
        sections: draft.sections,
        recommendations: draft.recommendations,
        analytics,
        versions: [
            {
                html: draft.html,
                sections: draft.sections,
                analytics,
                label: "Initial AI draft",
                createdAt: new Date()
            },
            ...(interviewReport.resumeBuilder?.versions || [])
        ].slice(0, MAX_RESUME_VERSIONS),
        updatedAt: new Date()
    }

    await interviewReport.save()

    res.status(200).json({
        message: "Resume preview generated successfully.",
        ...buildResumePayload(interviewReport)
    })
}

async function getResumePreviewController(req, res) {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id }).lean()

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    res.status(200).json({
        message: "Resume preview fetched successfully.",
        resume: interviewReport.resumeBuilder || null
    })
}

async function updateResumePreviewController(req, res) {
    const { interviewReportId } = req.params
    const { sections, saveVersion, versionLabel } = req.body
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        throw new ApiError(404, "Interview report not found.")
    }

    const html = createResumeHtml(sections)
    const analytics = calculateResumeAnalytics({ sections, html, jobDescription: interviewReport.jobDescription })
    const currentBuilder = interviewReport.resumeBuilder || {}
    const existingVersions = currentBuilder.versions || []
    const versions = saveVersion && currentBuilder.html
        ? [ createVersionFromBuilder(currentBuilder, versionLabel || "Saved resume version"), ...existingVersions ].slice(0, MAX_RESUME_VERSIONS)
        : existingVersions.slice(0, MAX_RESUME_VERSIONS)

    interviewReport.resumeBuilder = {
        ...currentBuilder,
        html,
        sections,
        analytics,
        recommendations: currentBuilder.recommendations || [],
        versions,
        updatedAt: new Date()
    }

    await interviewReport.save()

    res.status(200).json({
        message: "Resume preview saved successfully.",
        ...buildResumePayload(interviewReport)
    })
}

async function improveResumeSectionController(req, res) {
    const { interviewReportId } = req.params
    const { section, instruction } = req.body
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport?.resumeBuilder?.sections) {
        throw new ApiError(404, "Generate a resume preview before improving sections.")
    }

    const currentSections = interviewReport.resumeBuilder.sections.toObject?.() || interviewReport.resumeBuilder.sections
    const currentContent = Array.isArray(currentSections[section])
        ? currentSections[section].join("\n")
        : currentSections[section] || ""
    const improved = await improveResumeSection({
        section,
        content: currentContent,
        jobDescription: interviewReport.jobDescription,
        instruction
    })
    const updatedSections = {
        ...currentSections,
        [section]: Array.isArray(currentSections[section])
            ? improved.content.split(/\n+/).map((item) => item.trim()).filter(Boolean)
            : improved.content
    }
    const html = createResumeHtml(updatedSections)
    const analytics = calculateResumeAnalytics({ sections: updatedSections, html, jobDescription: interviewReport.jobDescription })

    interviewReport.resumeBuilder = {
        ...interviewReport.resumeBuilder.toObject(),
        html,
        sections: updatedSections,
        analytics,
        recommendations: interviewReport.resumeBuilder.recommendations || [],
        versions: [
            createVersionFromBuilder(interviewReport.resumeBuilder, `Before improving ${section}`),
            ...(interviewReport.resumeBuilder.versions || [])
        ].slice(0, MAX_RESUME_VERSIONS),
        updatedAt: new Date()
    }

    await interviewReport.save()

    res.status(200).json({
        message: "Resume section improved successfully.",
        ...buildResumePayload(interviewReport)
    })
}

async function restoreResumeVersionController(req, res) {
    const { interviewReportId, versionId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport?.resumeBuilder?.versions?.length) {
        throw new ApiError(404, "No resume versions found.")
    }

    const version = interviewReport.resumeBuilder.versions.id(versionId)

    if (!version) {
        throw new ApiError(404, "Resume version not found.")
    }

    const currentBuilder = interviewReport.resumeBuilder

    interviewReport.resumeBuilder = {
        ...currentBuilder.toObject(),
        html: version.html,
        sections: version.sections,
        analytics: version.analytics,
        recommendations: currentBuilder.recommendations || [],
        versions: [
            createVersionFromBuilder(currentBuilder, "Before restore"),
            ...currentBuilder.versions.filter((item) => String(item._id) !== versionId)
        ].slice(0, MAX_RESUME_VERSIONS),
        updatedAt: new Date()
    }

    await interviewReport.save()

    res.status(200).json({
        message: "Resume version restored successfully.",
        ...buildResumePayload(interviewReport)
    })
}

async function exportEditedResumePdfController(req, res) {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport?.resumeBuilder?.html) {
        throw new ApiError(404, "Generate and save a resume preview before downloading.")
    }

    const pdfBuffer = await generatePdfFromHtml(interviewReport.resumeBuilder.html)

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    })

    res.send(pdfBuffer)
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    deleteInterviewReportController,
    clearInterviewReportsController,
    getInterviewSourcesController,
    generateResumePdfController,
    generateResumePreviewController,
    getResumePreviewController,
    updateResumePreviewController,
    improveResumeSectionController,
    restoreResumeVersionController,
    exportEditedResumePdfController
}
