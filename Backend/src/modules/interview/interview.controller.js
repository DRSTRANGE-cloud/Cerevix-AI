const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../../services/ai.service")
const { ApiError } = require("../../utils/http")
const { refreshUserBehaviorAnalysis } = require("../behavior/behavior.service")
const interviewReportModel = require("./interviewReport.model")

async function getResumeText(file) {
    if (!file) {
        return ""
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(file.buffer))).getText()
    return resumeContent.text
}

async function generateInterViewReportController(req, res) {
    const { selfDescription, jobDescription } = req.body
    const resumeText = await getResumeText(req.file)

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

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    deleteInterviewReportController,
    clearInterviewReportsController,
    generateResumePdfController
}
