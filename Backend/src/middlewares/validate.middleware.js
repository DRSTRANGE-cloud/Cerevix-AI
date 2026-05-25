const validateBody = (schema) => (req, res, next) => {
    req.body = schema.parse(req.body)
    next()
}

const validateParams = (schema) => (req, res, next) => {
    req.params = schema.parse(req.params)
    next()
}

module.exports = { validateBody, validateParams }
