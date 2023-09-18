import { cleanEnv, port, str } from "envalid";

const env = cleanEnv(process.env, {
  PORT: port(),
  MONGO_CONNECTION_STRING: str(),
  FRONT_URL: str(),
  SERVER_URL: str(),
});

export default env;
