const atsModel = require("../ats/ats.model")
const mockInterviewModel = require("../mockInterview/mockInterview.model")
const interviewReportModel = require("../interview/interviewReport.model")
const { getUserBehaviorAnalysis } = require("../behavior/behavior.service")

// Validated technical and soft skills vocabulary
const TECHNICAL_SKILLS = new Set([
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "react", "vue", "angular", "svelte", "nextjs", "remix", "gatsby", "nuxt",
    "nodejs", "express", "fastapi", "django", "flask", "spring", "nest",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "dynamodb",
    "html", "css", "scss", "tailwind", "bootstrap", "material-ui",
    "git", "docker", "kubernetes", "ci/cd", "github", "gitlab", "aws", "azure", "gcp",
    "rest", "graphql", "soap", "grpc", "websocket",
    "sql", "nosql", "orm", "graphql", "api", "json", "xml",
    "testing", "jest", "mocha", "pytest", "unittest", "rspec", "vitest",
    "webpack", "vite", "rollup", "parcel", "esbuild",
    "linux", "windows", "macos", "devops", "agile", "scrum", "kanban",
    "machine learning", "tensorflow", "pytorch", "numpy", "pandas", "sklearn",
    "microservices", "monolith", "architecture", "design patterns", "solid",
    "communication", "collaboration", "leadership", "problem-solving", "critical thinking",
    "project management", "agile", "waterfall", "remote work", "time management"
])

// Common filler words and non-skills to exclude
const SKIP_WORDS = new Set([
    "cerevix", "target", "looking", "experience", "position", "role", "candidate", "professional",
    "required", "desired", "ability", "strong", "excellent", "good", "great", "proven",
    "work", "working", "develop", "developing", "create", "creating", "manage", "managing",
    "team", "teams", "project", "projects", "client", "clients", "business", "businesses",
    "year", "years", "month", "months", "week", "weeks", "day", "days",
    "knowledge", "understanding", "familiarity", "experience", "proficiency",
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "plus", "plus", "skills", "skill", "tech", "application", "applications", "systems", "system"
])

function isValidSkill(skill) {
    const normalized = skill.toLowerCase().trim()
    if (!normalized || normalized.length < 2) return false
    if (SKIP_WORDS.has(normalized)) return false
    if (TECHNICAL_SKILLS.has(normalized)) return true
    // Allow other multi-word technical terms
    if (normalized.length > 3 && /^[a-z0-9\s\-\+\.#]+$/i.test(normalized)) {
        return !normalized.split(/\s+/).some(word => SKIP_WORDS.has(word.toLowerCase()))
    }
    return false
}

function average(values) {
    const validValues = values.filter((value) => typeof value === "number")
    return validValues.length
        ? Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length)
        : 0
}

async function getDashboardAnalytics(userId) {
    const [ atsAnalyses, mockSessions, interviewReports, behaviorAnalysis ] = await Promise.all([
        atsModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
        mockInterviewModel.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
        interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
        getUserBehaviorAnalysis(userId)
    ])

    const missingSkillCounts = new Map()
    const strongSkillCounts = new Map()

    // Track skills from ATS analyses with recency weighting and validation
    atsAnalyses.forEach((analysis, index) => {
        const recencyWeight = 1 + (atsAnalyses.length - index) * 0.1
        
        // Only count validated missing skills
        analysis.missingSkills?.forEach((skill) => {
            if (isValidSkill(skill)) {
                const normalized = skill.toLowerCase().trim()
                missingSkillCounts.set(normalized, (missingSkillCounts.get(normalized) || 0) + recencyWeight)
            }
        })
        
        // Only count validated matched skills
        analysis.matchedSkills?.forEach((skill) => {
            if (isValidSkill(skill)) {
                const normalized = skill.toLowerCase().trim()
                strongSkillCounts.set(normalized, (strongSkillCounts.get(normalized) || 0) + recencyWeight)
            }
        })
    })

    // Track skills from interview reports with severity weighting
    interviewReports.forEach((report, index) => {
        const recencyWeight = 1 + (interviewReports.length - index) * 0.15
        report.skillGaps?.forEach((gap) => {
            if (isValidSkill(gap.skill)) {
                const normalized = gap.skill.toLowerCase().trim()
                const weight = gap.severity === "high" ? recencyWeight * 2 : gap.severity === "medium" ? recencyWeight * 1.5 : recencyWeight
                missingSkillCounts.set(normalized, (missingSkillCounts.get(normalized) || 0) + weight)
            }
        })
    })

    // Track weak and strong topics from mock interview reports
    mockSessions.forEach((session, index) => {
        if (!session.finalReport) return
        const recencyWeight = 1 + (mockSessions.length - index) * 0.1
        
        session.finalReport.weakTopics?.forEach((topic) => {
            if (isValidSkill(topic)) {
                const normalized = topic.toLowerCase().trim()
                missingSkillCounts.set(normalized, (missingSkillCounts.get(normalized) || 0) + recencyWeight * 1.5)
            }
        })
        
        session.finalReport.strongTopics?.forEach((topic) => {
            if (isValidSkill(topic)) {
                const normalized = topic.toLowerCase().trim()
                strongSkillCounts.set(normalized, (strongSkillCounts.get(normalized) || 0) + recencyWeight)
            }
        })
    })

    const toRankedList = (map) => [ ...map.entries() ]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([ name, count ]) => ({ name, count: Math.round(count) }))



    const completedSessions = mockSessions.filter((session) => session.status === "completed")
    const interviewScores = completedSessions
        .filter((session) => session.finalReport)
        .map((session) => {
            const report = session.finalReport
            return average([ report.technicalScore, report.communicationScore, report.confidenceScore ])
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

    // Build interview trend from mock sessions with finalReports, fallback to all sessions with valid scores
    const interviewTrendData = mockSessions
        .filter((session) => session.finalReport && (
            typeof session.finalReport.technicalScore === "number" ||
            typeof session.finalReport.communicationScore === "number" ||
            typeof session.finalReport.confidenceScore === "number"
        ))
        .map((session) => ({
            date: session.createdAt,
            score: average([
                session.finalReport?.technicalScore,
                session.finalReport?.communicationScore,
                session.finalReport?.confidenceScore
            ])
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))

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
        interviewTrend: interviewTrendData,
        weakestSkills: toRankedList(missingSkillCounts),
        strongestSkills: toRankedList(strongSkillCounts),
        recentReports: interviewReports,
        activityTimeline,
        behaviorAnalysis
    }
}

module.exports = { getDashboardAnalytics }
