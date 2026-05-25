const { z } = require("zod")

const emailSchema = z.string().trim().email("Enter a valid email address.").toLowerCase()
const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[0-9]/, "Password must include a number.")

const registerSchema = z.object({
    username: z.string()
        .trim()
        .min(2, "Full name must be at least 2 characters.")
        .max(80, "Full name must be 80 characters or fewer."),
    email: emailSchema,
    password: passwordSchema
})

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required.")
})

module.exports = { registerSchema, loginSchema, passwordSchema }
