import { apiClient } from "../../../lib/apiClient";


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, resumeText }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (resumeText) {
        formData.append("resumeText", resumeText)
    }
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await apiClient.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}

export const getInterviewSources = async () => {
    const response = await apiClient.get("/api/interview/sources")

    return response.data
}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await apiClient.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await apiClient.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await apiClient.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

export const getResumePreview = async ({ interviewReportId }) => {
    const response = await apiClient.get(`/api/interview/resume/preview/${interviewReportId}`)

    return response.data
}

export const generateResumePreview = async ({ interviewReportId }) => {
    const response = await apiClient.post(`/api/interview/resume/preview/${interviewReportId}`)

    return response.data
}

export const updateResumePreview = async ({ interviewReportId, sections, saveVersion = false, versionLabel = "" }) => {
    const response = await apiClient.put(`/api/interview/resume/preview/${interviewReportId}`, {
        sections,
        saveVersion,
        versionLabel
    })

    return response.data
}

export const improveResumeSection = async ({ interviewReportId, section, instruction }) => {
    const response = await apiClient.post(`/api/interview/resume/improve/${interviewReportId}`, {
        section,
        instruction
    })

    return response.data
}

export const restoreResumeVersion = async ({ interviewReportId, versionId }) => {
    const response = await apiClient.post(`/api/interview/resume/version/${interviewReportId}/${versionId}/restore`)

    return response.data
}

export const exportResumePdf = async ({ interviewReportId }) => {
    const response = await apiClient.post(`/api/interview/resume/export/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

export const deleteInterviewReport = async (interviewId) => {
    const response = await apiClient.delete(`/api/interview/report/${interviewId}`)

    return response.data
}

export const clearInterviewReports = async () => {
    const response = await apiClient.delete("/api/interview/")

    return response.data
}
