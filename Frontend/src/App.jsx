import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import { ToastProvider } from "./components/ToastProvider.jsx"
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <InterviewProvider>
            <RouterProvider router={router} />
          </InterviewProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
