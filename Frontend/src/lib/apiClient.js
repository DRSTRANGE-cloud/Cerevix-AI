import axios from "axios"

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const apiError = new Error(
            error.response?.data?.message || error.message || "Request failed. Please try again."
        )

        apiError.status = error.response?.status
        apiError.errors = error.response?.data?.errors || []

        return Promise.reject(apiError)
    }
)
