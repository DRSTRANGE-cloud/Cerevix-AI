const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { corsOrigin } = require("./config/env")
const sanitizeRequest = require("./middlewares/sanitize.middleware")
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware")

const app = express()

app.use(helmet())
app.use(cors({
    origin: corsOrigin,
    credentials: true
}))
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())
app.use(sanitizeRequest)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const atsRouter = require("./modules/ats/ats.routes")
const mockInterviewRouter = require("./modules/mockInterview/mockInterview.routes")
const analyticsRouter = require("./modules/analytics/analytics.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/ats", atsRouter)
app.use("/api/mock-interviews", mockInterviewRouter)
app.use("/api/analytics", analyticsRouter)

app.use(notFoundHandler)
app.use(errorHandler)


module.exports = app
