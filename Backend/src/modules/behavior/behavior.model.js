const mongoose = require("mongoose")

const namedSignalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 0
    },
    weight: {
        type: Number,
        default: 0
    }
}, {
    _id: false
})

const behaviorAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true,
        index: true
    },
    readinessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    sourceCounts: {
        atsAnalyses: { type: Number, default: 0 },
        interviewPlans: { type: Number, default: 0 },
        mockInterviews: { type: Number, default: 0 }
    },
    resumeBehavior: {
        averageAtsScore: { type: Number, default: 0 },
        averageKeywordMatch: { type: Number, default: 0 },
        averagePlanMatchScore: { type: Number, default: 0 }
    },
    interviewBehavior: {
        averageScore: { type: Number, default: 0 },
        technicalScore: { type: Number, default: 0 },
        communicationScore: { type: Number, default: 0 },
        confidenceScore: { type: Number, default: 0 },
        consistency: {
            type: String,
            enum: [ "insufficient-data", "stable", "variable", "inconsistent" ],
            default: "insufficient-data"
        }
    },
    strongestSignals: [ namedSignalSchema ],
    recurringGaps: [ namedSignalSchema ],
    recommendations: [ String ],
    lastAnalyzedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("BehaviorAnalysis", behaviorAnalysisSchema)
