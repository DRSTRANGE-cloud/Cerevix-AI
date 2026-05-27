const assert = require("node:assert/strict")
const { buildBehaviorAnalysisFromSources } = require("../src/modules/behavior/behavior.service")

function runBehaviorTests() {
    const analysis = buildBehaviorAnalysisFromSources({
        atsAnalyses: [ {
            atsScore: 80,
            keywordMatch: 75,
            matchedSkills: [ "React", "Node" ],
            missingSkills: [ "TypeScript" ]
        } ],
        interviewReports: [ {
            matchScore: 70,
            skillGaps: [ { skill: "TypeScript", severity: "high" } ]
        } ],
        mockSessions: [
            {
                status: "completed",
                finalReport: {
                    technicalScore: 90,
                    communicationScore: 80,
                    confidenceScore: 70,
                    strongTopics: [ "React" ],
                    weakTopics: [ "System Design" ]
                }
            },
            {
                status: "completed",
                finalReport: {
                    technicalScore: 80,
                    communicationScore: 70,
                    confidenceScore: 60,
                    strongTopics: [ "Node" ],
                    weakTopics: [ "TypeScript" ]
                }
            }
        ]
    })

    assert.equal(analysis.sourceCounts.atsAnalyses, 1)
    assert.equal(analysis.sourceCounts.interviewPlans, 1)
    assert.equal(analysis.sourceCounts.mockInterviews, 2)
    assert.equal(analysis.resumeBehavior.averageAtsScore, 80)
    assert.equal(analysis.interviewBehavior.averageScore, 75)
    assert.equal(analysis.interviewBehavior.consistency, "stable")
    assert.equal(analysis.recurringGaps[0].name, "typescript")
    assert.ok(analysis.recurringGaps[0].weight > analysis.recurringGaps[1].weight)
    assert.ok(analysis.strongestSignals.some((item) => item.name === "react"))
    assert.ok(analysis.recommendations.length > 0)
}

module.exports = { runBehaviorTests }
