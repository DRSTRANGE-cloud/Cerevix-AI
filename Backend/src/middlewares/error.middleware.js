const multer = require("multer")
const { ApiError } = require("../utils/http")

function notFoundHandler(req, res, next) {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }

    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Resume file must be 3MB or smaller."
            : err.message

        return res.status(400).json({ message })
    }

    if (err.name === "ZodError") {
        return res.status(400).json({
            message: "Validation failed.",
            errors: err.errors.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        })
    }

    if (err.code === 11000) {
        return res.status(409).json({
            message: "An account already exists with this email address or username."
        })
    }

    const statusCode = err.statusCode || 500
    const message = statusCode === 500 ? "Something went wrong. Please try again." : err.message

    res.status(statusCode).json({
        message,
        ...(err.details ? { errors: err.details } : {})
    })
}

module.exports = { notFoundHandler, errorHandler }
