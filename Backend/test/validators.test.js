const assert = require("node:assert/strict")
const { loginSchema, registerSchema } = require("../src/validators/auth.validator")
const { generateInterviewSchema } = require("../src/validators/interview.validator")

function runValidatorTests() {
    const payload = registerSchema.parse({
        username: "Deepak Yadav",
        email: "DEEPAK@example.com",
        password: "Password1"
    })

    assert.equal(payload.email, "deepak@example.com")

    assert.throws(() => registerSchema.parse({
        username: "Deepak Yadav",
        email: "deepak@example.com",
        password: "password"
    }), /uppercase/)

    assert.throws(() => loginSchema.parse({
        email: "not-an-email",
        password: "Password1"
    }), /valid email/)

    const interviewPayload = generateInterviewSchema.parse({
        jobDescription: "  ".concat("Frontend engineer role with React, accessibility, testing, and API integration."),
        selfDescription: "  React developer  "
    })

    assert.equal(interviewPayload.selfDescription, "React developer")
}

module.exports = { runValidatorTests }
