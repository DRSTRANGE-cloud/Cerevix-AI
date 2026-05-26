import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import Protected from "./features/auth/components/Protected"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Home from "./features/interview/pages/Home"
import Interview from "./features/interview/pages/Interview"
import AppLayout from "./layouts/AppLayout"

const ATS = lazy(() => import("./features/ats/pages/ATS"))
const MockInterview = lazy(() => import("./features/mockInterview/pages/MockInterview"))
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"))

const lazyPage = (element) => (
    <Suspense fallback={<main className="app-shell app-shell--center"><div className="skeleton-card" /></main>}>
        {element}
    </Suspense>
)

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        element: <Protected><AppLayout /></Protected>,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "interview/:interviewId",
                element: <Interview />
            },
            {
                path: "ats",
                element: lazyPage(<ATS />)
            },
            {
                path: "mock-interview",
                element: lazyPage(<MockInterview />)
            },
            {
                path: "dashboard",
                element: lazyPage(<Dashboard />)
            }
        ]
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
])
