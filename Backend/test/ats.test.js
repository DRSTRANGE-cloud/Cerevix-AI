const assert = require("node:assert/strict")
const { analyzeKeywordMatch } = require("../src/modules/ats/ats.service")

function runAtsTests() {
    const result = analyzeKeywordMatch({
        resume: "React Node MongoDB accessibility testing frontend performance",
        jobDescription: "Frontend role needs React, Node, MongoDB, testing, accessibility, and TypeScript."
    })

    assert.ok(result.atsScore > 0)
    assert.ok(result.keywordMatch > 0)
    assert.ok(result.matchedSkills.includes("react"))
    assert.ok(result.missingSkills.includes("typescript"))
}

module.exports = { runAtsTests }
