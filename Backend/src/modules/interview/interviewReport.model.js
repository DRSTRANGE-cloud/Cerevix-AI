const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ {
        type: String,
        required: [ true, "Task is required" ]
    } ]
}, {
    _id: false
})

const resumeAnalyticsSchema = new mongoose.Schema({
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    keywordMatch: { type: Number, min: 0, max: 100, default: 0 },
    skillCoverage: { type: Number, min: 0, max: 100, default: 0 },
    readabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    resumeLengthScore: { type: Number, min: 0, max: 100, default: 0 },
    actionVerbScore: { type: Number, min: 0, max: 100, default: 0 },
    missingSkills: [ String ]
}, {
    _id: false
})

const resumeRecommendationSchema = new mongoose.Schema({
    issue: String,
    suggestedImprovement: String,
    importance: {
        type: String,
        enum: [ "low", "medium", "high" ],
        default: "medium"
    },
    section: String
}, {
    _id: false
})

const resumeVersionSchema = new mongoose.Schema({
    html: String,
    sections: mongoose.Schema.Types.Mixed,
    analytics: resumeAnalyticsSchema,
    createdAt: {
        type: Date,
        default: Date.now
    },
    label: String
}, {
    _id: true
})

const resumeBuilderSchema = new mongoose.Schema({
    html: String,
    sections: mongoose.Schema.Types.Mixed,
    recommendations: [ resumeRecommendationSchema ],
    analytics: resumeAnalyticsSchema,
    versions: [ resumeVersionSchema ],
    updatedAt: Date
}, {
    _id: false
})

const interviewReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: String,
    selfDescription: String,
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestions: [ questionSchema ],
    behavioralQuestions: [ questionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    title: {
        type: String,
        required: [ true, "Job title is required" ]
    },
    resumeBuilder: resumeBuilderSchema
}, {
    timestamps: true
})

module.exports = mongoose.model("InterviewReport", interviewReportSchema)
