import express from "express";
import cors from "cors";
import { globalErrorHandler } from "./utils/error.util.js";
import router from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// API routes
app.use("/api/v1", router);

// Error handling middleware
app.use(globalErrorHandler);

export { app };
