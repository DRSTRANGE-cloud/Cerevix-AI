import { apiClient } from "../../../lib/apiClient"

export async function getCareerAnalytics() {
    const response = await apiClient.get("/api/analytics")
    return response.data
}
