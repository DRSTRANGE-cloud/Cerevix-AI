import assert from "node:assert/strict"
import { getPasswordStrength, loginSchema, registerSchema } from "./auth.schema.js"

const payload = loginSchema.parse({
    email: "user@example.com",
    password: "anything"
})

assert.equal(payload.email, "user@example.com")

assert.throws(() => registerSchema.parse({
    username: "Deepak Yadav",
    email: "deepak@example.com",
    password: "Password1",
    confirmPassword: "Password2"
}), /Passwords do not match/)

const strength = getPasswordStrength("Password1!")

assert.equal(strength.tone, "strong")
console.log("Frontend auth validation tests passed")
