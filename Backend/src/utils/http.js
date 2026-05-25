class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message)
        this.statusCode = statusCode
        this.details = details
    }
}

const asyncHandler = (controller) => (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next)
}

const toPublicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email
})

module.exports = { ApiError, asyncHandler, toPublicUser }
