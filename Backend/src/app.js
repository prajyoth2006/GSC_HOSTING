import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true 
}));
app.use(express.json({
    limit : "16kb"
}));
app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//user routes declaration
import userRouter from "./routes/user.route.js";
app.use("/api/v1/users",userRouter); 

// worker route declarations
import workerRouter from "./routes/worker.route.js";
app.use("/api/v1/workers", workerRouter);

// volunteers routes declaration
import volunteerRouter from "./routes/volunteer.route.js";
app.use("/api/v1/volunteers", volunteerRouter);

// admin routes declaration
import adminRouter from "./routes/admin.route.js"
app.use("/api/v1/admins",adminRouter);

app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
        data: null
    });
});

export {app};