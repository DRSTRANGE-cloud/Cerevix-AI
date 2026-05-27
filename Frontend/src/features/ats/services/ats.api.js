import { apiClient } from "../../../lib/apiClient"

export async function createAtsAnalysis({ jobDescription, resumeFile }) {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("resume", resumeFile)

    const response = await apiClient.post("/api/ats", formData)
    return response.data
}

export async function getAtsAnalyses() {
    const response = await apiClient.get("/api/ats")
    return response.data
}

export async function deleteAtsAnalysis(analysisId) {
    const response = await apiClient.delete(`/api/ats/${analysisId}`)
    return response.data
}
