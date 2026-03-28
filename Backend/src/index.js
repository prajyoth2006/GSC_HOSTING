import http from "http"; // 1. Built-in Node module
import { Server } from "socket.io"; // 2. Socket.io
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path: './env' // Added a dot here assuming your file is named .env
});

// 3. Create the HTTP Server and pass your Express app into it
const server = http.createServer(app);

// 4. Initialize Socket.io and attach it to the server
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Link to your frontend URL
        methods: ["GET", "POST"],
        credentials: true
    }
});

// 5. Save 'io' in the app so you can use it in controllers (req.app.get("io"))
app.set("io", io);

// 6. Optional: Listen for basic connections (Handy for debugging)
io.on("connection", (socket) => {
    console.log(`📡 User Connected: ${socket.id}`);
    
    socket.on("disconnect", () => {
        console.log("🛑 User Disconnected");
    });
});

connectDB()
.then(() => {
    // 7. IMPORTANT: Change app.listen to server.listen
    server.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("Mongo Db connection failed !!!", err);
});