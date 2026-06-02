import {
    clearInterviewReports,
    deleteInterviewReport,
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf,
    getResumePreview,
    generateResumePreview,
    updateResumePreview,
    improveResumeSection,
    restoreResumeVersion,
    exportResumePdf
} from "../services/interview.api"
import { useCallback, useContext } from "react"
import { InterviewContext } from "../interview.context-value"


export const useInterview = () => {

    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile, resumeText }) => {
        setLoading(true)

        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, resumeText })
            setReport(response.interviewReport)
            return response.interviewReport
        } finally {
            setLoading(false)
        }
    }, [ setLoading, setReport ])

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)

        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } finally {
            setLoading(false)
        }
    }, [ setLoading, setReport ])

    const getReports = useCallback(async () => {
        setLoading(true)

        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } finally {
            setLoading(false)
        }
    }, [ setLoading, setReports ])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)

        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        }
        finally {
            setLoading(false)
        }
    }, [ setLoading ])

    const fetchResumePreview = useCallback(async (interviewReportId) => {
        const response = await getResumePreview({ interviewReportId })
        return response.resume
    }, [])

    const createResumePreview = useCallback(async (interviewReportId) => {
        setLoading(true)

        try {
            const response = await generateResumePreview({ interviewReportId })
            return response.resume
        } finally {
            setLoading(false)
        }
    }, [ setLoading ])

    const saveResumePreview = useCallback(async ({ interviewReportId, sections, saveVersion, versionLabel }) => {
        const response = await updateResumePreview({ interviewReportId, sections, saveVersion, versionLabel })
        return response.resume
    }, [])

    const improveResume = useCallback(async ({ interviewReportId, section, instruction }) => {
        setLoading(true)

        try {
            const response = await improveResumeSection({ interviewReportId, section, instruction })
            return response.resume
        } finally {
            setLoading(false)
        }
    }, [ setLoading ])

    const restoreResume = useCallback(async ({ interviewReportId, versionId }) => {
        const response = await restoreResumeVersion({ interviewReportId, versionId })
        return response.resume
    }, [])

    const downloadEditedResume = useCallback(async (interviewReportId) => {
        setLoading(true)

        try {
            const response = await exportResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } finally {
            setLoading(false)
        }
    }, [ setLoading ])

    const removeReport = useCallback(async (interviewId) => {
        await deleteInterviewReport(interviewId)
        setReports((items) => items.filter((item) => item._id !== interviewId))
    }, [ setReports ])

    const clearReports = useCallback(async () => {
        await clearInterviewReports()
        setReports([])
    }, [ setReports ])

    return {
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf,
        fetchResumePreview,
        createResumePreview,
        saveResumePreview,
        improveResume,
        restoreResume,
        downloadEditedResume,
        removeReport,
        clearReports
    }

}
