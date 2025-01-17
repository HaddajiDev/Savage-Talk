const mongoose = require("mongoose");

const URI = process.env.URI;

const connect = async () => {
    try {
        const result = await mongoose.connect(URI, {
            dbName: 'Blogs'
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
}

module.exports = connect;
