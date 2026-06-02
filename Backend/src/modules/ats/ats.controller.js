const pdfParse = require("pdf-parse")
const atsModel = require("./ats.model")
const { ApiError } = require("../../utils/http")
const { analyzeKeywordMatch, buildAtsInsights } = require("./ats.service")
const { refreshUserBehaviorAnalysis } = require("../behavior/behavior.service")
const interviewReportModel = require("../interview/interviewReport.model")

async function createAtsAnalysis(req, res) {
    const { jobDescription } = req.body

    if (!req.file) {
        throw new ApiError(400, "Upload a resume PDF for ATS analysis.")
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const resume = resumeContent.text
    const metrics = analyzeKeywordMatch({ resume, jobDescription })
    const insights = buildAtsInsights(metrics)

    const analysis = await atsModel.create({
        user: req.user.id,
        jobDescription,
        resume,
        source: "upload",
        ...metrics,
        ...insights
    })
    await refreshUserBehaviorAnalysis(req.user.id)

    res.status(201).json({
        message: "ATS analysis generated successfully.",
        analysis
    })
}

async function createAtsAnalysisFromInterview(req, res) {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).lean()

    if (!interviewReport) {
        throw new ApiError(404, "Interview plan not found.")
    }

    const resume = interviewReport.resume || interviewReport.selfDescription

    if (!resume) {
        throw new ApiError(400, "This interview plan does not contain reusable resume or profile content.")
    }

    const jobDescription = interviewReport.jobDescription
    const metrics = analyzeKeywordMatch({ resume, jobDescription })
    const insights = buildAtsInsights(metrics)

    const analysis = await atsModel.create({
        user: req.user.id,
        jobDescription,
        resume,
        source: "interview-plan",
        sourceInterviewReport: interviewReport._id,
        ...metrics,
        ...insights
    })
    await refreshUserBehaviorAnalysis(req.user.id)

    res.status(201).json({
        message: "ATS analysis generated from interview plan successfully.",
        analysis
    })
}

async function getAtsAnalyses(req, res) {
    const analyses = await atsModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -jobDescription")
        .limit(20)

    res.status(200).json({
        message: "ATS analyses fetched successfully.",
        analyses
    })
}

async function getAtsSources(req, res) {
    const analyses = await atsModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("atsScore keywordMatch jobDescription resume source createdAt")
        .limit(20)
        .lean()

    res.status(200).json({
        message: "ATS sources fetched successfully.",
        sources: analyses
    })
}

async function deleteAtsAnalysis(req, res) {
    const { analysisId } = req.params
    const analysis = await atsModel.findOneAndDelete({ _id: analysisId, user: req.user.id })

    if (!analysis) {
        throw new ApiError(404, "ATS analysis not found.")
    }

    res.status(200).json({
        message: "ATS analysis removed successfully.",
        analysisId
    })
}

module.exports = {
    createAtsAnalysis,
    createAtsAnalysisFromInterview,
    getAtsAnalyses,
    getAtsSources,
    deleteAtsAnalysis
}
