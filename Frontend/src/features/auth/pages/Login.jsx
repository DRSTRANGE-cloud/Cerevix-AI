import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import FormField from '../../../components/FormField'
import { useToast } from '../../../components/toast.context'
import { loginSchema } from '../auth.schema'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const { checkingSession, isAuthenticated, loading, handleLogin } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [ serverError, setServerError ] = useState("")
    const [ showPassword, setShowPassword ] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid }
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
        }
    })

    const onSubmit = async (values) => {
        setServerError("")

        try {
            await handleLogin(values)
            showToast("Welcome back.", "success")
            navigate('/')
        } catch (error) {
            setServerError(error.message)
        }
    }

    if (checkingSession) {
        return (
            <main className="auth-page">
                <div className="skeleton-card" aria-label="Checking session" />
            </main>
        )
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    const isBusy = loading || isSubmitting

    return (
        <main className="auth-page">
            <section className="form-container" aria-labelledby="login-title">
                <div className="auth-copy">
                    <img src='/cerevix-logo.png' alt='Cerevix AI' className='auth-logo' />
                    <h1 id="login-title">Log in</h1>
                    <span>Continue building interview plans tailored to your resume and target roles.</span>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {serverError && <p className="form-error" role="alert">{serverError}</p>}

                    <FormField id="email" label="Email" error={errors.email?.message}>
                        <input
                            {...register("email")}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            autoComplete="email"
                            type="email"
                            id="email"
                            placeholder="you@example.com"
                        />
                    </FormField>

                    <FormField id="password" label="Password" error={errors.password?.message}>
                        <div className="password-control">
                            <input
                                {...register("password")}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? "password-error" : undefined}
                                autoComplete="current-password"
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </FormField>

                    <button className='button primary-button' disabled={!isValid || isBusy}>
                        {isBusy ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
            </section>
        </main>
    )
}

export default Login
