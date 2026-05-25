const { getDashboardAnalytics } = require("./analytics.service")

async function getDashboard(req, res) {
    const analytics = await getDashboardAnalytics(req.user.id)

    res.status(200).json({
        message: "Career analytics fetched successfully.",
        analytics
    })
}

module.exports = { getDashboard }
