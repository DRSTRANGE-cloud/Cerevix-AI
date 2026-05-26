import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion"
import { useLocation, useOutlet } from "react-router"
import Footer from "../components/Footer"
import Navbar from "../components/Navbar"

function AppLayout() {
    const location = useLocation()
    const outlet = useOutlet()
    const shouldReduceMotion = useReducedMotion()

    return (
        <div className="app-layout">
            <Navbar />
            <AnimatePresence mode="wait">
                <Motion.div
                    className="page-transition"
                    key={location.pathname}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(4px)" }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                    {outlet}
                </Motion.div>
            </AnimatePresence>
            <Footer />
        </div>
    )
}

export default AppLayout
