const mongoose = require("mongoose")
const dns = require("node:dns")
const { dnsServers, mongoUri } = require("./env")

mongoose.set("bufferCommands", false)

function isLocalDnsServer(server) {
    return server === "127.0.0.1" || server === "::1"
}

function configureDnsForAtlasSrv() {
    if (!mongoUri.startsWith("mongodb+srv://")) {
        return
    }

    const currentServers = dns.getServers()

    if (currentServers.length > 0 && currentServers.every(isLocalDnsServer)) {
        dns.setServers(dnsServers)
        console.warn(`Node DNS was using localhost. Using DNS servers for MongoDB SRV lookup: ${dnsServers.join(", ")}`)
    }
}

function getConnectionHint(error) {
    if ([ "ECONNREFUSED", "ENOTFOUND", "ETIMEOUT", "ESERVFAIL" ].includes(error.code) && error.syscall === "querySrv") {
        return "MongoDB Atlas SRV lookup failed. Check DNS, VPN/proxy/firewall settings, or set DNS_SERVERS=1.1.1.1,8.8.8.8."
    }

    if (error.message?.includes("bad auth") || error.message?.includes("Authentication failed")) {
        return "MongoDB authentication failed. Check the Atlas username/password and URL-encode special characters in the password."
    }

    if (error.name === "MongoServerSelectionError") {
        return "MongoDB server selection failed. Check Atlas IP access list, cluster status, network access, and whether the cluster is paused."
    }

    return "MongoDB connection failed. Verify MONGODB_URI, Atlas network access, and cluster status."
}

async function connectToDB() {
    configureDnsForAtlasSrv()

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        })
    } catch (error) {
        console.error(getConnectionHint(error))
        throw error
    }

    console.log("Connected to Database")
}

module.exports = connectToDB
