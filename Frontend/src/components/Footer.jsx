import { Link } from "react-router"
import "./footer.scss"

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <div className="site-footer__top">
                    <div className="site-footer__brand">
                        <p>AI-powered interview preparation built to improve resumes, mock interviews, and career momentum.</p>
                        <Link className="footer-cta" to="/">Start Preparing</Link>
                    </div>

                    <div className="site-footer__columns">
                        <nav className="footer-column" aria-label="Product">
                            <h4>Product</h4>
                            <Link to="/">Plans</Link>
                            <Link to="/ats">ATS Scanner</Link>
                            <Link to="/mock-interview">Mock Interview</Link>
                            <Link to="/dashboard">Analytics</Link>
                        </nav>

                        <nav className="footer-column" aria-label="Resources">
                            <h4>Resources</h4>
                            <Link to="/">Resume Plans</Link>
                            <Link to="/dashboard">Progress</Link>
                        </nav>
                    </div>
                </div>

                <div className="site-footer__bottom">
                    <span>&copy; 2026 Cerevix AI</span>
                    <p>Designed for focused and consistent interview preparation.</p>
                </div>
            </div>
        </footer>
    )
}
