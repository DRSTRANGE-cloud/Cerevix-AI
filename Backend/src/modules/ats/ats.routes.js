const express = require("express")
const upload = require("../../middlewares/file.middleware")
const authMiddleware = require("../../middlewares/auth.middleware")
const { asyncHandler } = require("../../utils/http")
const { validateBody } = require("../../middlewares/validate.middleware")
const { generateInterviewSchema } = require("../../validators/interview.validator")
const atsController = require("./ats.controller")

const atsRouter = express.Router()

atsRouter.post(
    "/",
    asyncHandler(authMiddleware.authUser),
    upload.single("resume"),
    validateBody(generateInterviewSchema.pick({ jobDescription: true })),
    asyncHandler(atsController.createAtsAnalysis)
)

atsRouter.get("/", asyncHandler(authMiddleware.authUser), asyncHandler(atsController.getAtsAnalyses))

atsRouter.delete("/:analysisId", asyncHandler(authMiddleware.authUser), asyncHandler(atsController.deleteAtsAnalysis))

module.exports = atsRouter
