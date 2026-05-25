import { z } from "zod"

export const passwordSchema = z.string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Add one uppercase letter.")
    .regex(/[a-z]/, "Add one lowercase letter.")
    .regex(/[0-9]/, "Add one number.")

export const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
})

export const registerSchema = z.object({
    username: z.string()
        .trim()
        .min(2, "Full name must be at least 2 characters.")
        .max(80, "Full name must be 80 characters or fewer."),
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: [ "confirmPassword" ],
})

export function getPasswordStrength(password = "") {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ]
    const score = checks.filter(Boolean).length

    if (score <= 2) return { label: "Weak", value: score, tone: "weak" }
    if (score <= 4) return { label: "Good", value: score, tone: "good" }
    return { label: "Strong", value: score, tone: "strong" }
}
