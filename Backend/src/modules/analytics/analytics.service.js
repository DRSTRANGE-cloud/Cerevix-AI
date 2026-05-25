const atsModel = require("../ats/ats.model")
const mockInterviewModel = require("../mockInterview/mockInterview.model")
const interviewReportModel = require("../../models/interviewReport.model")

function average(values) {
    const validValues = values.filter((value) => typeof value === "number")
    return validValues.length
        ? Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length)
        : 0
}

async function getDashboardAnalytics(userId) {
    const [ atsAnalyses, mockSessions, interviewReports ] = await Promise.all([
        atsModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
        mockInterviewModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
        interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("title matchScore skillGaps createdAt")
            .limit(20)
            .lean()
    ])

    const missingSkillCounts = new Map()
    const strongSkillCounts = new Map()

    atsAnalyses.forEach((analysis) => {
        analysis.missingSkills?.forEach((skill) => missingSkillCounts.set(skill, (missingSkillCounts.get(skill) || 0) + 1))
        analysis.matchedSkills?.forEach((skill) => strongSkillCounts.set(skill, (strongSkillCounts.get(skill) || 0) + 1))
    })

    interviewReports.forEach((report) => {
        report.skillGaps?.forEach((gap) => missingSkillCounts.set(gap.skill, (missingSkillCounts.get(gap.skill) || 0) + 1))
    })

    const toRankedList = (map) => [ ...map.entries() ]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([ name, count ]) => ({ name, count }))

    const completedSessions = mockSessions.filter((session) => session.status === "completed")
    const interviewScores = completedSessions.map((session) => {
        const report = session.finalReport
        return report ? average([ report.technicalScore, report.communicationScore, report.confidenceScore ]) : 0
    })

    const activityTimeline = [
        ...atsAnalyses.slice(0, 6).map((item) => ({
            type: "ATS Analysis",
            title: `ATS score ${item.atsScore}`,
            createdAt: item.createdAt
        })),
        ...mockSessions.slice(0, 6).map((item) => ({
            type: "Mock Interview",
            title: `${item.role} (${item.status})`,
            createdAt: item.createdAt
        })),
        ...interviewReports.slice(0, 6).map((item) => ({
            type: "Interview Plan",
            title: item.title,
            createdAt: item.createdAt
        }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)

    return {
        overview: {
            averageAtsScore: average(atsAnalyses.map((analysis) => analysis.atsScore)),
            averageInterviewScore: average(interviewScores),
            completedInterviewSessions: completedSessions.length,
            reportsGenerated: interviewReports.length + atsAnalyses.length
        },
        atsTrend: atsAnalyses
            .slice()
            .reverse()
            .map((analysis) => ({
                date: analysis.createdAt,
                score: analysis.atsScore,
                keywordMatch: analysis.keywordMatch
            })),
        interviewTrend: completedSessions
            .slice()
            .reverse()
            .map((session) => ({
                date: session.createdAt,
                score: average([
                    session.finalReport?.technicalScore,
                    session.finalReport?.communicationScore,
                    session.finalReport?.confidenceScore
                ])
            })),
        weakestSkills: toRankedList(missingSkillCounts),
        strongestSkills: toRankedList(strongSkillCounts),
        recentReports: interviewReports,
        activityTimeline
    }
}

module.exports = { getDashboardAnalytics }
