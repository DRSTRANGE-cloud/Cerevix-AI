import { apiClient } from "../../../lib/apiClient"

export async function startMockInterview(payload) {
    const response = await apiClient.post("/api/mock-interviews", payload)
    return response.data
}

export async function submitMockAnswer({ sessionId, answer }) {
    const response = await apiClient.post(`/api/mock-interviews/${sessionId}/answer`, { answer })
    return response.data
}

export async function finishMockInterview(sessionId) {
    const response = await apiClient.post(`/api/mock-interviews/${sessionId}/finish`)
    return response.data
}

export async function getMockInterviews() {
    const response = await apiClient.get("/api/mock-interviews")
    return response.data
}
