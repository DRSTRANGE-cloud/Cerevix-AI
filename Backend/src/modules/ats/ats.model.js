const mongoose = require("mongoose")

const atsAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    atsScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    keywordMatch: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    resume: {
        type: String,
        required: true
    },
    source: {
        type: String,
        enum: [ "upload", "interview-plan" ],
        default: "upload"
    },
    sourceInterviewReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    },
    matchedSkills: [ String ],
    missingSkills: [ String ],
    strengths: [ String ],
    weaknesses: [ String ],
    suggestions: [ String ],
    recommendations: [ String ]
}, {
    timestamps: true
})

module.exports = mongoose.model("AtsAnalysis", atsAnalysisSchema)
