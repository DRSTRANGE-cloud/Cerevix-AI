const atsModel = require("../ats/ats.model")
const mockInterviewModel = require("../mockInterview/mockInterview.model")
const interviewReportModel = require("../interview/interviewReport.model")
const behaviorAnalysisModel = require("./behavior.model")

const SEVERITY_WEIGHTS = {
    low: 1,
    medium: 2,
    high: 3
}

function clampScore(score) {
    return Math.max(0, Math.min(100, Math.round(score || 0)))
}

function average(values) {
    const validValues = values.filter((value) => Number.isFinite(value))
    return validValues.length
        ? clampScore(validValues.reduce((sum, value) => sum + value, 0) / validValues.length)
        : 0
}

function normalizeSignal(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
}

function addSignal(map, value, weight = 1) {
    const name = normalizeSignal(value)

    if (!name) {
        return
    }

    const item = map.get(name) || { name, count: 0, weight: 0 }
    item.count += 1
    item.weight += weight
    map.set(name, item)
}

function rankedSignals(map, limit = 8) {
    return [ ...map.values() ]
        .sort((a, b) => b.weight - a.weight || b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, limit)
}

function getFinalReportScore(session) {
    const report = session.finalReport

    if (!report) {
        return 0
    }

    return average([
        report.technicalScore,
        report.communicationScore,
        report.confidenceScore
    ])
}

function getConsistency(scores) {
    if (scores.length < 2) {
        return "insufficient-data"
    }

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + ((score - mean) ** 2), 0) / scores.length
    const deviation = Math.sqrt(variance)

    if (deviation <= 10) {
        return "stable"
    }

    if (deviation <= 20) {
        return "variable"
    }

    return "inconsistent"
}

function weightedReadinessScore(scores) {
    const weightedScores = [
        { value: scores.averageAtsScore, weight: 0.35 },
        { value: scores.averagePlanMatchScore, weight: 0.25 },
        { value: scores.averageInterviewScore, weight: 0.4 }
    ].filter((item) => item.value > 0)

    if (!weightedScores.length) {
        return 0
    }

    const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0)
    const score = weightedScores.reduce((sum, item) => sum + (item.value * item.weight), 0) / totalWeight
    return clampScore(score)
}

function buildRecommendations({ readinessScore, recurringGaps, resumeBehavior, interviewBehavior }) {
    const recommendations = []
    const topGap = recurringGaps[0]?.name

    if (topGap) {
        recommendations.push(`Prioritize ${topGap}; it appears repeatedly across your saved prep data.`)
    }

    if (resumeBehavior.averageAtsScore && resumeBehavior.averageAtsScore < 70) {
        recommendations.push("Tighten resume alignment with role keywords and measurable achievements before applying.")
    }

    if (interviewBehavior.communicationScore && interviewBehavior.communicationScore < 70) {
        recommendations.push("Practice concise STAR-style answers to improve communication scoring.")
    }

    if (interviewBehavior.confidenceScore && interviewBehavior.confidenceScore < 70) {
        recommendations.push("Run shorter timed mock sessions to build confident delivery under pressure.")
    }

    if (!recommendations.length && readinessScore >= 80) {
        recommendations.push("Maintain momentum with one role-specific mock interview before each application push.")
    }

    if (!recommendations.length) {
        recommendations.push("Create more ATS scans and mock interviews to unlock stronger trend analysis.")
    }

    return recommendations.slice(0, 4)
}

function buildBehaviorAnalysisFromSources({ atsAnalyses = [], mockSessions = [], interviewReports = [] }) {
    const gapSignals = new Map()
    const strengthSignals = new Map()
    const completedSessions = mockSessions.filter((session) => session.status === "completed" && session.finalReport)
    const interviewScores = completedSessions.map(getFinalReportScore).filter((score) => score > 0)

    atsAnalyses.forEach((analysis) => {
        analysis.matchedSkills?.forEach((skill) => addSignal(strengthSignals, skill, 1))
        analysis.missingSkills?.forEach((skill) => addSignal(gapSignals, skill, 1))
    })

    interviewReports.forEach((report) => {
        report.skillGaps?.forEach((gap) => addSignal(gapSignals, gap.skill, SEVERITY_WEIGHTS[gap.severity] || 1))
    })

    completedSessions.forEach((session) => {
        session.finalReport?.strongTopics?.forEach((topic) => addSignal(strengthSignals, topic, 2))
        session.finalReport?.weakTopics?.forEach((topic) => addSignal(gapSignals, topic, 2))
    })

    const resumeBehavior = {
        averageAtsScore: average(atsAnalyses.map((analysis) => analysis.atsScore)),
        averageKeywordMatch: average(atsAnalyses.map((analysis) => analysis.keywordMatch)),
        averagePlanMatchScore: average(interviewReports.map((report) => report.matchScore))
    }

    const interviewBehavior = {
        averageScore: average(interviewScores),
        technicalScore: average(completedSessions.map((session) => session.finalReport?.technicalScore)),
        communicationScore: average(completedSessions.map((session) => session.finalReport?.communicationScore)),
        confidenceScore: average(completedSessions.map((session) => session.finalReport?.confidenceScore)),
        consistency: getConsistency(interviewScores)
    }

    const recurringGaps = rankedSignals(gapSignals)
    const strongestSignals = rankedSignals(strengthSignals)
    const readinessScore = weightedReadinessScore({
        averageAtsScore: resumeBehavior.averageAtsScore,
        averagePlanMatchScore: resumeBehavior.averagePlanMatchScore,
        averageInterviewScore: interviewBehavior.averageScore
    })

    return {
        readinessScore,
        sourceCounts: {
            atsAnalyses: atsAnalyses.length,
            interviewPlans: interviewReports.length,
            mockInterviews: completedSessions.length
        },
        resumeBehavior,
        interviewBehavior,
        strongestSignals,
        recurringGaps,
        recommendations: buildRecommendations({
            readinessScore,
            recurringGaps,
            resumeBehavior,
            interviewBehavior
        }),
        lastAnalyzedAt: new Date()
    }
}

async function refreshUserBehaviorAnalysis(userId) {
    const [ atsAnalyses, mockSessions, interviewReports ] = await Promise.all([
        atsModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
        mockInterviewModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
        interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("matchScore skillGaps createdAt")
            .limit(50)
            .lean()
    ])

    const analysis = buildBehaviorAnalysisFromSources({ atsAnalyses, mockSessions, interviewReports })

    return behaviorAnalysisModel.findOneAndUpdate(
        { user: userId },
        { $set: { user: userId, ...analysis } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()
}

async function getUserBehaviorAnalysis(userId) {
    const analysis = await behaviorAnalysisModel.findOne({ user: userId }).lean()
    return analysis || refreshUserBehaviorAnalysis(userId)
}

module.exports = {
    buildBehaviorAnalysisFromSources,
    getUserBehaviorAnalysis,
    refreshUserBehaviorAnalysis
}
