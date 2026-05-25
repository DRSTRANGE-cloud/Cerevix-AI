const dotenv = require("dotenv")

dotenv.config({ quiet: true })

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
const requiredEnv = {
    "MONGODB_URI or MONGO_URI": mongoUri,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY
}
const missingEnv = Object.entries(requiredEnv)
    .filter((entry) => !entry[1])
    .map(([ key ]) => key)

if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`)
}

const isProduction = process.env.NODE_ENV === "production"
const port = Number(process.env.PORT || 3000)

if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive number.")
}

module.exports = {
    mongoUri,
    jwtSecret: process.env.JWT_SECRET,
    googleGenAiApiKey: process.env.GOOGLE_GENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
    port,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    dnsServers: (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean),
    cookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    },
    clearCookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    },
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH
}
