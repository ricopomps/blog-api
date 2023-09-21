import MongoStore from "connect-mongo";
import ReddisStore from "connect-redis";
import crypto from "crypto";
import { CookieOptions, SessionOptions } from "express-session";
import env from "../env";
import redisClient from "./redisClient";

const store =
  env.NODE_ENV === "false"
    ? new ReddisStore({ client: redisClient })
    : MongoStore.create({ mongoUrl: env.MONGO_CONNECTION_STRING });

const cookieConfig: CookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (env.NODE_ENV === "production") {
  cookieConfig.secure = true;
}

const sessionConfig: SessionOptions = {
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: cookieConfig,
  rolling: true,
  store: store,
  genid(req) {
    const userId = req.user?._id;
    const randomId = crypto.randomUUID();
    if (userId) {
      return `${userId}-${randomId}`;
    } else {
      return randomId;
    }
  },
};

export default sessionConfig;
