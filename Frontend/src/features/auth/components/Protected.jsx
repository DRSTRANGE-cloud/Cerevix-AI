import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";

const Protected = ({children}) => {
    const { checkingSession,user } = useAuth()


    if(checkingSession){
        return (
            <main className="app-shell app-shell--center">
                <div className="skeleton-card" aria-label="Checking session" />
            </main>
        )
    }

    if(!user){
        return <Navigate to={'/login'} replace />
    }
    
    return children
}

export default Protected
