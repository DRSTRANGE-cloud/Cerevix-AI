import { Component } from "react"

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="app-shell app-shell--center">
                    <section className="empty-state" role="alert">
                        <h1>Something went wrong</h1>
                        <p>Refresh the page and try again.</p>
                    </section>
                </main>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
