import { FastifyInstance } from "fastify";
import {
  getUsers,
  createUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/user.controller";
import { redisRateLimiter } from "../middleware/rateLimit";


export default async function userRoutes(app: FastifyInstance) {
  const apiRateLimit = redisRateLimiter({
    requestLimit: 20,
    timeWindow: 60,
  });

  const authRateLimit = redisRateLimiter({
    requestLimit: 5,
    timeWindow: 60,
  });

  app.get("/users", { preHandler: [apiRateLimit] }, getUsers);
  app.post("/register", { preHandler: [authRateLimit] }, createUser);
  app.post("/login", { preHandler: [authRateLimit] }, loginUser);
  app.post("/logout", logoutUser);
  app.get("/me", getCurrentUser);
}
