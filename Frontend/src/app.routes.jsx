import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import { Navigate } from "react-router";

const ATS = lazy(() => import("./features/ats/pages/ATS"))
const MockInterview = lazy(() => import("./features/mockInterview/pages/MockInterview"))
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"))

const protectedPage = (element) => (
    <Protected>
        <Suspense fallback={<main className="app-shell app-shell--center"><div className="skeleton-card" /></main>}>
            {element}
        </Suspense>
    </Protected>
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
        path: "/",
        element: protectedPage(<Home />)
    },
    {
        path:"/interview/:interviewId",
        element: protectedPage(<Interview />)
    },
    {
        path: "/ats",
        element: protectedPage(<ATS />)
    },
    {
        path: "/mock-interview",
        element: protectedPage(<MockInterview />)
    },
    {
        path: "/dashboard",
        element: protectedPage(<Dashboard />)
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
])
