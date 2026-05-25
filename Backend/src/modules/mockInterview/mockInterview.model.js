const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: [ "assistant", "user" ],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    focusArea: String
}, {
    _id: false,
    timestamps: true
})

const evaluationSchema = new mongoose.Schema({
    question: String,
    answer: String,
    score: Number,
    strengths: [ String ],
    improvements: [ String ]
}, {
    _id: false
})

const finalReportSchema = new mongoose.Schema({
    technicalScore: Number,
    communicationScore: Number,
    confidenceScore: Number,
    strongTopics: [ String ],
    weakTopics: [ String ],
    preparationRecommendations: [ String ]
}, {
    _id: false
})

const mockInterviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: [ "junior", "mid", "senior" ],
        required: true
    },
    interviewType: {
        type: String,
        enum: [ "technical", "behavioral", "mixed" ],
        required: true
    },
    status: {
        type: String,
        enum: [ "active", "completed" ],
        default: "active"
    },
    messages: [ messageSchema ],
    evaluations: [ evaluationSchema ],
    finalReport: finalReportSchema
}, {
    timestamps: true
})

module.exports = mongoose.model("MockInterview", mockInterviewSchema)
