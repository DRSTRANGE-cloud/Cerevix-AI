const express = require("express")
const authMiddleware = require("../../middlewares/auth.middleware")
const { asyncHandler } = require("../../utils/http")
const analyticsController = require("./analytics.controller")

const analyticsRouter = express.Router()

analyticsRouter.get("/", asyncHandler(authMiddleware.authUser), asyncHandler(analyticsController.getDashboard))

module.exports = analyticsRouter
