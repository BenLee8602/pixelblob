import mongoose from "mongoose";

async function connect() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_URI);
    } catch (err) {
        console.log("failed to start db:", err);
        process.exit(1);
    }
}

async function disconnect() {
    await mongoose.disconnect();
}

export default {
    connect,
    disconnect
};

