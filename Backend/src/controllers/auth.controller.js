const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { jwtSecret, cookieOptions, clearCookieOptions } = require("../config/env")
const { ApiError, toPublicUser } = require("../utils/http")

function createToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        jwtSecret,
        { expiresIn: "1d" }
    )
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        throw new ApiError(409, "Account already exists with this email address or username.")
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = createToken(user)

    res.status(201).json({
        message: "User registered successfully",
        user: toPublicUser(user)
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    if (!user) {
        throw new ApiError(401, "Invalid email or password.")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password.")
    }

    const token = createToken(user)          

    res.status(200).json({
        message: "User loggedIn successfully.",
        token,
        user: toPublicUser(user)
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token
    async function logoutUserController(req, res) {
    res.status(200).json({ message: "User logged out successfully" })
}
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    if (!user) {
        throw new ApiError(404, "User not found.")
    }

    res.status(200).json({
        message: "User details fetched successfully",
        user: toPublicUser(user)
    })

}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}