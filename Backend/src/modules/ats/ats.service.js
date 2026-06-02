const COMMON_WORDS = new Set([
    "and", "the", "for", "with", "that", "this", "from", "you", "your", "will", "are", "our",
    "have", "has", "job", "role", "work", "team", "using", "about", "into", "their", "they",
    "experience", "experienced", "years", "year", "strong", "skills", "skill", "engineering", "engineer",
    "development", "developer", "software", "technology", "technologies", "position", "candidate",
    "responsible", "including", "required", "requirements", "ability", "able", "need", "system",
    "systems", "business", "product", "products", "service", "services", "senior", "mid",
    "junior", "looking", "target", "state", "care", "support", "apply", "working", "work",
    "team", "building", "build", "manage", "management", "leading", "lead", "hands", "day",
    "days", "projects", "project", "implement", "implemented", "maintain", "maintenance"
])

const SKILL_ALIASES = new Map([
    [ "react.js", "react" ],
    [ "reactjs", "react" ],
    [ "node.js", "node" ],
    [ "nodejs", "node" ],
    [ "mongo", "mongodb" ],
    [ "postgres", "postgresql" ],
    [ "js", "javascript" ],
    [ "ts", "typescript" ],
    [ "ci cd", "ci/cd" ]
])

const CANONICAL_SKILLS = [
    "accessibility", "agile", "angular", "api", "aws", "azure", "ci/cd", "css", "docker",
    "express", "figma", "frontend", "git", "graphql", "html", "javascript", "jest",
    "kubernetes", "mongodb", "mysql", "next.js", "node", "postgresql", "python",
    "react", "redis", "rest", "redux", "scss", "tailwind", "testing", "typescript",
    "vite", "vue", "zustand"
]

const IMPORTANT_PHRASES = [
    "data visualization", "design system", "full stack", "microservices", "performance optimization",
    "responsive design", "state management", "system design", "unit testing"
]

function normalizeSkill(value) {
    const normalized = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9+#./\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    return SKILL_ALIASES.get(normalized) || normalized
}

function normalizeWords(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, ""))
        .map(normalizeSkill)
        .filter((word) => word.length > 2 && !COMMON_WORDS.has(word))
}

function extractKeywords(jobDescription) {
    const normalizedDescription = String(jobDescription || "").toLowerCase()
    const counts = normalizeWords(jobDescription).reduce((map, word) => {
        map.set(word, (map.get(word) || 0) + 1)
        return map
    }, new Map())

    CANONICAL_SKILLS.forEach((skill) => {
        if (new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(normalizedDescription)) {
            counts.set(skill, (counts.get(skill) || 0) + 4)
        }
    })

    IMPORTANT_PHRASES.forEach((phrase) => {
        if (normalizedDescription.includes(phrase)) {
            counts.set(phrase, (counts.get(phrase) || 0) + 5)
        }
    })

    return [ ...counts.entries() ]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 28)
        .map(([ word ]) => word)
}

function hasKeyword(text, keyword) {
    const normalizedText = normalizeSkill(text)
    const normalizedKeyword = normalizeSkill(keyword)
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(normalizedText)
}

function analyzeKeywordMatch({ resume, jobDescription }) {
    const keywords = extractKeywords(jobDescription)
    const resumeWords = new Set(normalizeWords(resume))
    const matchedSkills = keywords.filter((keyword) => keyword.includes(" ") ? hasKeyword(resume, keyword) : resumeWords.has(normalizeSkill(keyword)))
    const missingSkills = keywords.filter((keyword) => !resumeWords.has(keyword))
        .filter((keyword) => !(keyword.includes(" ") && hasKeyword(resume, keyword)))
    const keywordMatch = keywords.length ? Math.round((matchedSkills.length / keywords.length) * 100) : 0
    const skillDensityScore = Math.min(30, matchedSkills.length * 2)
    const atsScore = Math.min(100, Math.round(keywordMatch * 0.72 + skillDensityScore))

    return {
        atsScore,
        keywordMatch,
        matchedSkills: matchedSkills.sort((a, b) => a.localeCompare(b)),
        missingSkills: missingSkills.sort((a, b) => a.localeCompare(b))
    }
}

function buildAtsInsights({ matchedSkills, missingSkills, keywordMatch, atsScore }) {
    const topMatched = matchedSkills.slice(0, 6)
    const topMissing = missingSkills.slice(0, 6)

    return {
        strengths: topMatched.length
            ? [
                `Matches important role signals: ${topMatched.join(", ")}.`,
                "Uses several target-role keywords that ATS systems can parse consistently."
            ]
            : [ "The resume has readable content, but needs stronger role-specific keyword alignment." ],
        weaknesses: topMissing.length
            ? [ `Missing or underrepresented keywords: ${topMissing.join(", ")}.` ]
            : [ "No major keyword gaps detected from the extracted job requirements." ],
        suggestions: [
            `Current keyword match is ${keywordMatch}%. Add missing terms only where they truthfully fit your experience.`,
            "Prioritize the summary, skills, and experience sections for ATS improvements."
        ],
        recommendations: [
            atsScore >= 80
                ? "Keep the resume concise and preserve the strongest matching keywords."
                : "Add the highest-priority missing keywords to the summary and recent experience bullets.",
            "Use measurable outcomes and exact tool names so both recruiters and ATS parsers can read the evidence."
        ]
    }
}

module.exports = { analyzeKeywordMatch, buildAtsInsights, extractKeywords }
