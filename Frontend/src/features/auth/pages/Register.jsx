import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import FormField from '../../../components/FormField'
import { useToast } from '../../../components/toast.context'
import { getPasswordStrength, registerSchema } from '../auth.schema'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const { checkingSession, isAuthenticated, loading, handleRegister } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [ serverError, setServerError ] = useState("")
    const [ showPassword, setShowPassword ] = useState(false)
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false)
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting, isValid }
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        }
    })

    const password = useWatch({ control, name: "password" })
    const passwordStrength = getPasswordStrength(password)

    const onSubmit = async ({ username, email, password }) => {
        setServerError("")

        try {
            await handleRegister({ username, email, password })
            showToast("Account created.", "success")
            navigate("/")
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
            <section className="form-container" aria-labelledby="register-title">
                <div className="auth-copy">
                    <img src='/cerevix-logo.png' alt='Cerevix AI' className='auth-logo' />
                    <h1 id="register-title">Create account</h1>
                    <span>Generate focused interview preparation plans from your resume and job targets.</span>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {serverError && <p className="form-error" role="alert">{serverError}</p>}

                    <FormField id="username" label="Full name" error={errors.username?.message}>
                        <input
                            {...register("username")}
                            aria-invalid={Boolean(errors.username)}
                            aria-describedby={errors.username ? "username-error" : undefined}
                            autoComplete="name"
                            type="text"
                            id="username"
                            placeholder="Deepak Yadav"
                        />
                    </FormField>

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
                                aria-describedby={errors.password ? "password-error password-strength" : "password-strength"}
                                autoComplete="new-password"
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Create a strong password"
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
                        <div className={`password-strength password-strength--${passwordStrength.tone}`} id="password-strength">
                            <span style={{ width: `${passwordStrength.value * 20}%` }} />
                            <p>{passwordStrength.label}</p>
                        </div>
                    </FormField>

                    <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
                        <div className="password-control">
                            <input
                                {...register("confirmPassword")}
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                autoComplete="new-password"
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                placeholder="Repeat your password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword((value) => !value)}
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                aria-pressed={showConfirmPassword}
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </FormField>

                    <button className='button primary-button' disabled={!isValid || isBusy}>
                        {isBusy ? "Creating account..." : "Register"}
                    </button>

                </form>

                <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
            </section>
        </main>
    )
}

export default Register
