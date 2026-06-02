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
    matchScore: z.coerce.number().min(0).max(100).describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("What the interviewer wants to learn about the candidate's soft skills or past behavior"),
        answer: z.string().describe("The ideal STAR method response or key points the candidate should mention")
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
    recommendations: z.array(z.object({
        issue: z.string().describe("The specific issue found (e.g., 'Weak summary')"),
        suggestedImprovement: z.string().describe("The exact text or instruction to fix it"),
        section: z.string().describe("The resume section this applies to"),
        importance: z.enum(["low", "medium", "high"]).describe("The priority of the fix")
    })).describe("Detailed AI-powered resume improvement recommendations")
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

Return concise, specific resume strengths, weaknesses, ATS suggestions, and short recommendation sentences.`

    try {
        return await generateStructuredContent({ prompt, schema: atsInsightSchema })
    } catch (error) {
        console.error("ATS insight generation fallback:", error.message)

        const topMatched = (matchedSkills || []).slice(0, 6)
        const topMissing = (missingSkills || []).slice(0, 6)

        return {
            strengths: topMatched.length
                ? [
                    `Matches role keywords for ${topMatched.join(", ")}.`,
                    "Keeps some direct alignment with the target role."
                ]
                : [ "Shows professional experience that can be sharpened for ATS parsing." ],
            weaknesses: topMissing.length
                ? [ `Missing or weak evidence for: ${topMissing.join(", ")}.` ]
                : [ "Could use clearer role-specific wording and achievements." ],
            suggestions: [
                `Increase keyword coverage from ${keywordMatch}% by adding the most relevant missing terms to the summary and experience sections.`,
                "Use measurable results, tools, and scope details in bullet points."
            ],
            recommendations: [
                topMissing.length
                    ? `Missing keywords: naturally include ${topMissing.slice(0, 3).join(", ")} where truthful and relevant.`
                    : "Add more role-specific keywords and accomplishment language to improve ATS ranking.",
                "Rewrite 2-3 bullets with action verbs, outcomes, and any concrete numbers you can support."
            ]
        }
    }
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

/**
 * Creates HTML from resume sections
 */
function createResumeHtml(sections = {}) {
    const {
        name = "",
        email = "",
        phone = "",
        summary = "",
        experience = [],
        education = [],
        skills = [],
        projects = [],
        certifications = []
    } = sections

    const formatArray = (arr) => {
        if (Array.isArray(arr)) {
            return arr.map((item) => `<li>${typeof item === "string" ? item : item}</li>`).join("")
        }
        if (typeof arr === "string") {
            return arr.split("\n").filter(Boolean).map((item) => `<li>${item}</li>`).join("")
        }
        return ""
    }

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resume - ${name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
              
                .resume-container {
                    max-width: 850px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 40px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .header {
                    border-bottom: 3px solid #2c3e50;
                    padding-bottom: 20px;
                    margin-bottom: 25px;
                }
                .header h1 {
                    font-size: 28px;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }
                .contact-info {
                    font-size: 13px;
                    color: #555;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .contact-info span::before {
                    content: "• ";
                    color: #3498db;
                }
                .contact-info span:first-child::before {
                    content: "";
                }
                .section {
                    margin-bottom: 22px;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #2c3e50;
                    text-transform: uppercase;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                    letter-spacing: 1px;
                }
                .summary {
                    font-size: 14px;
                    line-height: 1.7;
                    color: #444;
                }
                ul {
                    margin-left: 20px;
                    font-size: 13px;
                    color: #444;
                }
                ul li {
                    margin-bottom: 6px;
                    line-height: 1.5;
                }
                .item {
                    margin-bottom: 14px;
                }
                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 4px;
                }
                .item-title {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 13px;
                }
                .item-subtitle {
                    font-style: italic;
                    color: #666;
                    font-size: 12px;
                }
                .item-description {
                    font-size: 13px;
                    color: #555;
                    margin-top: 4px;
                    line-height: 1.5;
                }
                .skill-tag {
                    display: inline-block;
                    background-color: #e8f0f7;
                    color: #2c3e50;
                    padding: 4px 10px;
                    margin: 4px 6px 4px 0;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="resume-container">
                ${name || email || phone ? `
                    <div class="header">
                        ${name ? `<h1>${name}</h1>` : ""}
                        ${email || phone ? `
                            <div class="contact-info">
                                ${email ? `<span>${email}</span>` : ""}
                                ${phone ? `<span>${phone}</span>` : ""}
                            </div>
                        ` : ""}
                    </div>
                ` : ""}

                ${summary ? `
                    <div class="section">
                        <div class="section-title">Professional Summary</div>
                        <div class="summary">${typeof summary === "string" ? summary : summary.join(" ")}</div>
                    </div>
                ` : ""}

                ${experience && (Array.isArray(experience) ? experience.length > 0 : experience) ? `
                    <div class="section">
                        <div class="section-title">Experience</div>
                        ${Array.isArray(experience) ? experience.map((exp) => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${exp.title || exp}</span>
                                </div>
                                ${exp.company ? `<div class="item-subtitle">${exp.company}${exp.duration ? ` | ${exp.duration}` : ""}</div>` : ""}
                                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ""}
                            </div>
                        `).join("") : `<div class="item">${experience}</div>`}
                    </div>
                ` : ""}

                ${education && (Array.isArray(education) ? education.length > 0 : education) ? `
                    <div class="section">
                        <div class="section-title">Education</div>
                        ${Array.isArray(education) ? education.map((edu) => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${edu.degree || edu}</span>
                                </div>
                                ${edu.school ? `<div class="item-subtitle">${edu.school}${edu.year ? ` | ${edu.year}` : ""}</div>` : ""}
                            </div>
                        `).join("") : `<div class="item">${education}</div>`}
                    </div>
                ` : ""}

                ${skills && (Array.isArray(skills) ? skills.length > 0 : skills) ? `
                    <div class="section">
                        <div class="section-title">Skills</div>
                        <div>
                            ${Array.isArray(skills) ? skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("") : `<span class="skill-tag">${skills}</span>`}
                        </div>
                    </div>
                ` : ""}

                ${projects && (Array.isArray(projects) ? projects.length > 0 : projects) ? `
                    <div class="section">
                        <div class="section-title">Projects</div>
                        ${Array.isArray(projects) ? projects.map((project) => `
                            <div class="item">
                                <div class="item-header">
                                    <span class="item-title">${project.name || project}</span>
                                </div>
                                ${project.description ? `<div class="item-description">${project.description}</div>` : ""}
                            </div>
                        `).join("") : `<div class="item">${projects}</div>`}
                    </div>
                ` : ""}

                ${certifications && (Array.isArray(certifications) ? certifications.length > 0 : certifications) ? `
                    <div class="section">
                        <div class="section-title">Certifications</div>
                        <ul>${formatArray(certifications)}</ul>
                    </div>
                ` : ""}
            </div>
        </body>
        </html>
    `

    return html
}

/**
 * Generates resume preview with sections and AI recommendations
 */
async function generateResumePreview({ resume, selfDescription, jobDescription, title }) {
    const resumePreviewSchema = z.object({
        sections: z.object({
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            summary: z.union([z.string(), z.array(z.string())]).optional(),
            experience: z.union([z.string(), z.array(z.any())]).optional(),
            education: z.union([z.string(), z.array(z.any())]).optional(),
            skills: z.union([z.string(), z.array(z.string())]).optional(),
            projects: z.union([z.string(), z.array(z.any())]).optional(),
            certifications: z.union([z.string(), z.array(z.string())]).optional()
        }).describe("Resume sections with contact info, summary, experience, education, skills, projects, certifications"),
        recommendations: z.array(z.object({
            issue: z.string().describe("The specific resume improvement needed"),
            suggestedImprovement: z.string().describe("The improvement text or action"),
            section: z.string().describe("Which resume section this applies to"),
            importance: z.enum(["low", "medium", "high"]).describe("Priority of this improvement")
        })).describe("AI-generated resume improvement recommendations")
    })

    const prompt = `Analyze this candidate's resume and job target, then generate:
1. A structured resume with proper sections
2. AI recommendations for improvements

Resume: ${resume}
Self Description: ${selfDescription}
Target Job: ${jobDescription || title || "not specified"}

Generate a resume with all proper sections filled in logically based on the provided information.
Also provide 3-5 specific, actionable recommendations for resume improvement to match the target job.`

    try {
        const result = await generateStructuredContent({ prompt, schema: resumePreviewSchema })
        const html = createResumeHtml(result.sections)

        return {
            html,
            sections: result.sections,
            recommendations: result.recommendations || []
        }
    } catch (error) {
        console.error("Error generating resume preview:", error)
        // Fallback to simple resume structure
        return {
            html: createFallbackHtml(resume, jobDescription, selfDescription),
            sections: {
                summary: selfDescription,
                experience: resume,
                name: "Professional Resume"
            },
            recommendations: [
                {
                    issue: "Add quantifiable metrics",
                    suggestedImprovement: "Include specific numbers, percentages, or measurable achievements in experience section",
                    section: "experience",
                    importance: "high"
                },
                {
                    issue: "Highlight relevant keywords",
                    suggestedImprovement: "Add more industry-specific keywords from the job description",
                    section: "skills",
                    importance: "high"
                }
            ]
        }
    }
}

/**
 * Improves a specific resume section using AI
 */
async function improveResumeSection({ section, content, jobDescription, instruction }) {
    const improvementSchema = z.object({
        content: z.string().describe("The improved content for the resume section"),
        suggestions: z.array(z.string()).optional().describe("Additional suggestions for improvement")
    })

    const prompt = `Improve this resume section for better ATS matching and presentation.

Section: ${section}
Current content: ${content}
Job description: ${jobDescription || "not specified"}
Improvement instruction: ${instruction}

Rewrite the section to be more professional, impactful, and relevant to the job description.
Include specific metrics and action verbs where appropriate.
Keep the improved content concise but compelling.`

    try {
        const result = await generateStructuredContent({ prompt, schema: improvementSchema })
        return {
            content: result.content,
            suggestions: result.suggestions || []
        }
    } catch (error) {
        console.error("Error improving resume section:", error)
        // Fallback to basic enhancement
        return {
            content: content || `[Add more details about your ${section} here]`,
            suggestions: [`Review the job description to align with required keywords`]
        }
    }
}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    generateResumePreview,
    improveResumeSection,
    createResumeHtml,
    generateAtsInsights,
    generateMockQuestion,
    evaluateMockAnswer,
    generateMockFinalReport
}
