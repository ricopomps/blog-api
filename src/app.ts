import "dotenv/config";
import express from "express";
import blogPostRoutes from "./routes/blogPosts";
import cors from "cors";
import env from "./env";
import morgan from "morgan";

const app = express();

app.use(morgan("dev"));

app.use(express.json());

app.use(
  cors({
    origin: env.FRONT_URL,
  })
);

app.use("/uploads/featured-images", express.static("uploads/featured-images"));

app.use("/posts", blogPostRoutes);

export default app;
