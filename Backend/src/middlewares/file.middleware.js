const multer = require("multer")
const { ApiError } = require("../utils/http")

const allowedMimeTypes = new Set([ "application/pdf" ])


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new ApiError(400, "Resume must be a PDF file."))
        }

        cb(null, true)
    }
})


module.exports = upload
