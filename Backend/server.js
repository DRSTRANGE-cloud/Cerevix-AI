const { port } = require("./src/config/env")
const app = require("./src/app")
const connectToDB = require("./src/config/database")

async function startServer() {
    await connectToDB()

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

startServer().catch((error) => {
    console.error("Failed to start server:", error.message)
    process.exit(1)
})
