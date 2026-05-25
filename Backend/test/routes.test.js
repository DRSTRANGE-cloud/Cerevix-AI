const assert = require("node:assert/strict")
const app = require("../src/app")

function listen() {
    return new Promise((resolve) => {
        const server = app.listen(0, () => resolve(server))
    })
}

async function request(server, path, options = {}) {
    const { port } = server.address()
    return fetch(`http://127.0.0.1:${port}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    })
}

async function runRouteTests() {
    const server = await listen()

    try {
        const validationResponse = await request(server, "/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username: "A",
                email: "bad-email",
                password: "short"
            })
        })
        const validationBody = await validationResponse.json()

        assert.equal(validationResponse.status, 400)
        assert.equal(validationBody.message, "Validation failed.")
        assert.ok(validationBody.errors.length >= 2)

        const protectedResponse = await request(server, "/api/auth/get-me")
        const protectedBody = await protectedResponse.json()

        assert.equal(protectedResponse.status, 401)
        assert.equal(protectedBody.message, "Token not provided.")
    } finally {
        server.close()
    }
}

module.exports = { runRouteTests }
