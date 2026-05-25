const pdfParse = require("pdf-parse")
const atsModel = require("./ats.model")
const { ApiError } = require("../../utils/http")
const { generateAtsInsights } = require("../../services/ai.service")
const { analyzeKeywordMatch } = require("./ats.service")

async function createAtsAnalysis(req, res) {
    const { jobDescription } = req.body

    if (!req.file) {
        throw new ApiError(400, "Upload a resume PDF for ATS analysis.")
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const resume = resumeContent.text
    const metrics = analyzeKeywordMatch({ resume, jobDescription })
    const insights = await generateAtsInsights({ resume, jobDescription, ...metrics })

    const analysis = await atsModel.create({
        user: req.user.id,
        ...metrics,
        ...insights
    })

    res.status(201).json({
        message: "ATS analysis generated successfully.",
        analysis
    })
}

async function getAtsAnalyses(req, res) {
    const analyses = await atsModel.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20)

    res.status(200).json({
        message: "ATS analyses fetched successfully.",
        analyses
    })
}

module.exports = { createAtsAnalysis, getAtsAnalyses }
