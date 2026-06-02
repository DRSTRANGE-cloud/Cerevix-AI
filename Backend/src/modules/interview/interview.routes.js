const express = require("express")
const authMiddleware = require("../../middlewares/auth.middleware")
const upload = require("../../middlewares/file.middleware")
const { validateBody, validateParams } = require("../../middlewares/validate.middleware")
const {
    generateInterviewSchema,
    interviewIdParamsSchema,
    resumePdfParamsSchema,
    resumeVersionParamsSchema,
    updateResumePreviewSchema,
    improveResumeSectionSchema
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
interviewRouter.get("/sources", asyncHandler(interviewController.getInterviewSourcesController))

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

interviewRouter.get(
    "/resume/preview/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    asyncHandler(interviewController.getResumePreviewController)
)

interviewRouter.post(
    "/resume/preview/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    asyncHandler(interviewController.generateResumePreviewController)
)

interviewRouter.put(
    "/resume/preview/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    validateBody(updateResumePreviewSchema),
    asyncHandler(interviewController.updateResumePreviewController)
)

interviewRouter.post(
    "/resume/improve/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    validateBody(improveResumeSectionSchema),
    asyncHandler(interviewController.improveResumeSectionController)
)

interviewRouter.post(
    "/resume/version/:interviewReportId/:versionId/restore",
    validateParams(resumeVersionParamsSchema),
    asyncHandler(interviewController.restoreResumeVersionController)
)

interviewRouter.post(
    "/resume/export/:interviewReportId",
    validateParams(resumePdfParamsSchema),
    asyncHandler(interviewController.exportEditedResumePdfController)
)

module.exports = interviewRouter
