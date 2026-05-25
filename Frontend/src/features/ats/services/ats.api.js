import { apiClient } from "../../../lib/apiClient"

export async function createAtsAnalysis({ jobDescription, resumeFile }) {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("resume", resumeFile)

    const response = await apiClient.post("/api/ats", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data
}

export async function getAtsAnalyses() {
    const response = await apiClient.get("/api/ats")
    return response.data
}
