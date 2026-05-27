const express = require("express")
const authMiddleware = require("../../middlewares/auth.middleware")
const upload = require("../../middlewares/file.middleware")
const { validateBody, validateParams } = require("../../middlewares/validate.middleware")
const {
    generateInterviewSchema,
    interviewIdParamsSchema,
    resumePdfParamsSchema
} = require("../../validators/interview.validator")
const { asyncHandler } = require("../../utils/http")
const interviewController = require("./interview.controller")

const interviewRouter = express.Router()

interviewRouter.use(asyncHandler(authMiddleware.authUser))

interviewRouter.post(
    "/",
    upload.single("resume"),
    validateBody(generateInterviewSchema),
    asyncHandler(interviewController.generateInterViewReportController)
)

interviewRouter.get("/", asyncHandler(interviewController.getAllInterviewReportsController))
interviewRouter.delete("/", asyncHandler(interviewController.clearInterviewReportsController))

interviewRouter.get(
    "/report/:interviewId",
    validateParams(interviewIdParamsSchema),
    asyncHandler(interviewController.getInterviewReportByIdController)
)

interviewRouter.delete(
    "/report/:interviewId",
    validateParams(interviewIdParamsSchema),
    asyncHandler(interviewController.deleteInterviewReportController)
)

interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    asyncHandler(interviewController.generateResumePdfController)
)

module.exports = interviewRouter
