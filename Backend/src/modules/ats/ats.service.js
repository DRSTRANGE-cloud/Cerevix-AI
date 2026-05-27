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

function normalizeWords(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, ""))
        .filter((word) => word.length > 2 && !COMMON_WORDS.has(word))
}

function extractKeywords(jobDescription) {
    const counts = normalizeWords(jobDescription).reduce((map, word) => {
        map.set(word, (map.get(word) || 0) + 1)
        return map
    }, new Map())

    return [ ...counts.entries() ]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 28)
        .map(([ word ]) => word)
}

function analyzeKeywordMatch({ resume, jobDescription }) {
    const keywords = extractKeywords(jobDescription)
    const resumeWords = new Set(normalizeWords(resume))
    const matchedSkills = keywords.filter((keyword) => resumeWords.has(keyword))
    const missingSkills = keywords.filter((keyword) => !resumeWords.has(keyword))
    const keywordMatch = keywords.length ? Math.round((matchedSkills.length / keywords.length) * 100) : 0
    const atsScore = Math.min(100, Math.round(keywordMatch * 0.7 + Math.min(matchedSkills.length, 12) * 2.5))

    return {
        atsScore,
        keywordMatch,
        matchedSkills,
        missingSkills
    }
}

module.exports = { analyzeKeywordMatch }
