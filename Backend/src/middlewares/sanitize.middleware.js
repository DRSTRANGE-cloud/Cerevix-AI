function sanitizeValue(value) {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    if (value && typeof value === "object") {
        return Object.entries(value).reduce((clean, [ key, childValue ]) => {
            if (!key.startsWith("$") && !key.includes(".")) {
                clean[key] = sanitizeValue(childValue)
            }
            return clean
        }, {})
    }

    return typeof value === "string" ? value.trim() : value
}

function sanitizeRequest(req, res, next) {
    req.body = sanitizeValue(req.body)
    req.params = sanitizeValue(req.params)
    next()
}

module.exports = sanitizeRequest
