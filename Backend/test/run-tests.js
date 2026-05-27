const { runBehaviorTests } = require("./behavior.test")
const { runAtsTests } = require("./ats.test")
const { runRouteTests } = require("./routes.test")
const { runValidatorTests } = require("./validators.test")

async function run() {
    runBehaviorTests()
    runAtsTests()
    runValidatorTests()
    await runRouteTests()
    console.log("Backend tests passed")
}

run().catch((error) => {
    console.error(error)
    process.exit(1)
})
