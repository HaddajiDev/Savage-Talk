const express = require("express");
const http = require("http");
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();


app.use(cors({
    origin: [process.env.FRONT, process.env.BACK],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}));

app.use(express.json());


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.FRONT, process.env.BACK],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
});


const connect = require('./db_connect');
connect();


app.use('/msg', require('./routes/messages'));
app.use('/user', require('./routes/user'));
app.use('/group', require('./routes/group'));

app.get("/", (req, res) => res.send("Working"));


require('./socket')(io);


const PORT = process.env.PORT;
server.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Server running on port ${PORT}`);
    }
});
