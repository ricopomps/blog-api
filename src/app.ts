import cors from "cors";
import "dotenv/config";
import express from "express";
import session from "express-session";
import createHttpError from "http-errors";
import morgan from "morgan";
import passport from "passport";
import "./config/passport";
import sessionConfig from "./config/session";
import env from "./env";
import errorHandler from "./middlewares/errorHandler";
import blogPostRoutes from "./routes/blogPosts";
import commentRoutes from "./routes/comments";
import userRoutes from "./routes/users";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", true);
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use(
  cors({
    origin: env.FRONT_URL,
    credentials: true,
  })
);

app.use(session(sessionConfig));

app.use(passport.authenticate("session"));

app.use("/uploads/featured-images", express.static("uploads/featured-images"));
app.use(
  "/uploads/profile-pictures",
  express.static("uploads/profile-pictures")
);
app.use("/uploads/in-post-images", express.static("uploads/in-post-images"));

app.use("/posts", blogPostRoutes);
app.use("/users", userRoutes);
app.use("/comments", commentRoutes);

app.use((req, res, next) => next(createHttpError(404, "Endpoint not found")));

app.use(errorHandler);

export default app;
