import mongoose from "mongoose";
import redisClient from "../config/redisClient";
import env from "../env";

async function destroyAllActiveSesionsForUserMongo(userId: string) {
  const regexp = new RegExp(`^${userId}`);
  mongoose.connection.db.collection("sessions").deleteMany({ _id: regexp });
}

async function destroyAllActiveSesionsForUserRedis(userId: string) {
  let cursor = 0;
  do {
    const result = await redisClient.scan(cursor, {
      MATCH: `sess:${userId}*`,
      COUNT: 1000,
    });
    for (const key of result.keys) {
      await redisClient.del(key);
    }
    cursor = result.cursor;
  } while (cursor !== 0);
}

export const destroyAllActiveSesionsForUser =
  env.NODE_ENV === "false"
    ? destroyAllActiveSesionsForUserRedis
    : destroyAllActiveSesionsForUserMongo;
