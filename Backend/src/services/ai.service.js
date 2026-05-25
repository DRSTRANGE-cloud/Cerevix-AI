const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")
const fs = require("node:fs")
const { googleGenAiApiKey, puppeteerExecutablePath } = require("../config/env")
const { ApiError } = require("../utils/http")

const DEFAULT_CHROME_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const AI_MODEL = "gemini-3-flash-preview"
const AI_TIMEOUT_MS = 45000
const AI_RETRY_COUNT = 2
const PDF_TIMEOUT_MS = 30000
const MIN_HTML_LENGTH = 100

const ai = new GoogleGenAI({
    apiKey: googleGenAiApiKey
})

function getPuppeteerLaunchOptions() {
    const executablePath = puppeteerExecutablePath ||
        (fs.existsSync(DEFAULT_CHROME_EXECUTABLE_PATH) ? DEFAULT_CHROME_EXECUTABLE_PATH : undefined)

    return executablePath ? { executablePath } : {}
}

function parseJsonResponse(text) {
    try {
        return JSON.parse(text)
    } catch (error) {
        const match = text?.match(/\{[\s\S]*\}/)

        if (match) {
            return JSON.parse(match[0])
        }

        throw new ApiError(502, "AI returned an invalid response. Please try again.")
    }
}

async function withTimeout(promise, timeoutMs) {
    let timeoutId

    const timeout = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => reject(new ApiError(504, "AI request timed out. Please try again.")), timeoutMs)
    })

    try {
        return await Promise.race([ promise, timeout ])
    } finally {
        clearTimeout(timeoutId)
    }
}

async function generateStructuredContent({ prompt, schema }) {
    let lastError

    for (let attempt = 0; attempt <= AI_RETRY_COUNT; attempt += 1) {
        try {
            const response = await withTimeout(ai.models.generateContent({
                model: AI_MODEL,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(schema),
                }
            }), AI_TIMEOUT_MS)

            return schema.parse(parseJsonResponse(response.text))
        } catch (error) {
            lastError = error

            if (error.statusCode && error.statusCode < 500) {
                break
            }
        }
    }

    throw lastError instanceof ApiError
        ? lastError
        : new ApiError(502, "AI generation failed. Please try again.")
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

const atsInsightSchema = z.object({
    strengths: z.array(z.string()).describe("Strong resume elements for this role"),
    weaknesses: z.array(z.string()).describe("Weak resume sections or missing evidence"),
    suggestions: z.array(z.string()).describe("Concrete ATS optimization suggestions"),
    recommendations: z.array(z.string()).describe("AI-powered resume improvement recommendations")
})

const mockQuestionSchema = z.object({
    question: z.string().describe("The next interview question to ask"),
    focusArea: z.string().describe("The competency being evaluated")
})

const mockEvaluationSchema = z.object({
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    followUpQuestion: z.string()
})

const mockFinalReportSchema = z.object({
    technicalScore: z.number().min(0).max(100),
    communicationScore: z.number().min(0).max(100),
    confidenceScore: z.number().min(0).max(100),
    strongTopics: z.array(z.string()),
    weakTopics: z.array(z.string()),
    preparationRecommendations: z.array(z.string())
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    return generateStructuredContent({ prompt, schema: interviewReportSchema })


}



/**
 * Validates HTML content for basic structure and safety
 */
function validateHtmlContent(htmlContent) {
    if (typeof htmlContent !== "string") {
        throw new ApiError(502, "Invalid HTML content: not a string")
    }

    if (htmlContent.trim().length < MIN_HTML_LENGTH) {
        throw new ApiError(502, "Invalid HTML content: too short")
    }

    if (!htmlContent.includes("<") || !htmlContent.includes(">")) {
        throw new ApiError(502, "Invalid HTML content: missing HTML tags")
    }

    // Check for basic HTML structure
    const hasHtml = htmlContent.includes("<html") || htmlContent.includes("<body") || htmlContent.includes("<div")
    if (!hasHtml) {
        throw new ApiError(502, "Invalid HTML content: missing basic HTML structure")
    }

    return true
}

/**
 * Creates fallback HTML if generation fails
 */
function createFallbackHtml(resume, jobDescription, selfDescription) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Resume</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
                h1 { color: #2c3e50; font-size: 24px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                h2 { color: #34495e; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
                p { margin: 10px 0; }
                .section { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Professional Resume</h1>
            <div class="section">
                <h2>Profile</h2>
                <p>${selfDescription || "Experienced professional with strong technical background."}</p>
            </div>
            <div class="section">
                <h2>Experience</h2>
                <p>${resume || "Professional background in relevant technologies and practices."}</p>
            </div>
            <div class="section">
                <h2>Target Position</h2>
                <p>${jobDescription || "Seeking growth opportunities in a challenging role."}</p>
            </div>
        </body>
        </html>
    `
}

async function generatePdfFromHtml(htmlContent) {
    let browser = null
    let page = null

    try {
        // Validate HTML content before attempting PDF generation
        validateHtmlContent(htmlContent)

        // Launch browser with timeout
        const launchPromise = puppeteer.launch(getPuppeteerLaunchOptions())
        browser = await Promise.race([
            launchPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new ApiError(503, "Browser launch timeout")), PDF_TIMEOUT_MS)
            )
        ])

        // Create new page
        page = await browser.newPage()

        // Set viewport and other settings
        await page.setViewport({ width: 1024, height: 1080 })

        // Set content with timeout and error handling
        try {
            await Promise.race([
                page.setContent(htmlContent, { waitUntil: "networkidle2", timeout: PDF_TIMEOUT_MS - 5000 }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new ApiError(503, "Page content loading timeout")), PDF_TIMEOUT_MS - 2000)
                )
            ])
        } catch (error) {
            console.error("Error setting page content:", error.message)
            // Use fallback if content setting fails
            await page.setContent("<html><body><p>Resume generation in progress...</p></body></html>")
        }

        // Generate PDF with timeout
        const pdfPromise = page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            },
            timeout: PDF_TIMEOUT_MS - 8000
        })

        const pdfBuffer = await Promise.race([
            pdfPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new ApiError(503, "PDF generation timeout")), PDF_TIMEOUT_MS)
            )
        ])

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new ApiError(502, "PDF generation produced empty buffer")
        }

        return pdfBuffer
    } catch (error) {
        // Ensure descriptive error messages
        if (error instanceof ApiError) {
            throw error
        }

        if (error.message.includes("Chromium")) {
            throw new ApiError(503, "PDF generation service temporarily unavailable")
        }

        console.error("PDF generation error:", error)
        throw new ApiError(502, "Failed to generate PDF. Please try again.")
    } finally {
        // Ensure browser is properly closed even on error
        try {
            if (page) {
                await page.close().catch(() => {})
            }
            if (browser) {
                await browser.close().catch(() => {})
            }
        } catch (cleanupError) {
            console.error("Browser cleanup error:", cleanupError)
        }
    }
}

async function generateAtsInsights({ resume, jobDescription, matchedSkills, missingSkills, keywordMatch, atsScore }) {
    const prompt = `Analyze this resume for ATS quality.
Resume:
${resume}

Job description:
${jobDescription}

Matched skills: ${matchedSkills.join(", ") || "none"}
Missing skills: ${missingSkills.join(", ") || "none"}
Keyword match: ${keywordMatch}%
ATS score: ${atsScore}

Return concise, specific resume strengths, weaknesses, ATS suggestions, and improvement recommendations.`

    return generateStructuredContent({ prompt, schema: atsInsightSchema })
}

async function generateMockQuestion({ role, difficulty, interviewType, messages = [] }) {
    const history = messages.map((message) => `${message.role}: ${message.content}`).join("\n")
    const prompt = `You are running a text-only mock interview.
Role: ${role}
Difficulty: ${difficulty}
Interview type: ${interviewType}
Conversation so far:
${history || "No previous messages."}

Ask exactly one relevant next interview question.`

    return generateStructuredContent({ prompt, schema: mockQuestionSchema })
}

async function evaluateMockAnswer({ role, difficulty, interviewType, question, answer }) {
    const prompt = `Evaluate this mock interview answer privately.
Role: ${role}
Difficulty: ${difficulty}
Interview type: ${interviewType}
Question: ${question}
Answer: ${answer}

Return a score, strengths, improvements, and one intelligent follow-up question.`

    return generateStructuredContent({ prompt, schema: mockEvaluationSchema })
}

async function generateMockFinalReport({ role, difficulty, interviewType, messages, evaluations }) {
    const prompt = `Create a final mock interview performance report.
Role: ${role}
Difficulty: ${difficulty}
Interview type: ${interviewType}
Messages:
${messages.map((message) => `${message.role}: ${message.content}`).join("\n")}

Private evaluations:
${evaluations.map((evaluation) => `Q: ${evaluation.question}\nScore: ${evaluation.score}\nStrengths: ${evaluation.strengths.join(", ")}\nImprovements: ${evaluation.improvements.join(", ")}`).join("\n\n")}

Return final scores and practical preparation recommendations.`

    return generateStructuredContent({ prompt, schema: mockFinalReportSchema })
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    let htmlContent

    try {
        const jsonContent = await generateStructuredContent({ prompt, schema: resumePdfSchema })
        htmlContent = jsonContent.html
    } catch (error) {
        console.error("Error generating HTML from AI:", error)
        // Use fallback HTML if AI generation fails
        htmlContent = createFallbackHtml(resume, jobDescription, selfDescription)
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent)

    return pdfBuffer

}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    generateAtsInsights,
    generateMockQuestion,
    evaluateMockAnswer,
    generateMockFinalReport
}
