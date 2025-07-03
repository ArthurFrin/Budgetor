import { FastifyRequest, FastifyReply } from "fastify";

// Fonction utilitaire pour normaliser l'IP
const getIpAddress = (req: FastifyRequest): string => {
  const ip = req.ip || "";
  if (ip === "::1") return "127.0.0.1";
  if (ip.includes("::ffff:")) {
    return ip.split("::ffff:")[1];
  }
  return ip;
};

// Middleware configurable
export const redisRateLimiter = (options: {
  requestLimit: number;
  timeWindow: number; // secondes
}) => {
  const { requestLimit, timeWindow } = options;

  return async (req: FastifyRequest, res: FastifyReply) => {
    const redis = req.server.redis; // On récupère le client redis du plugin
    const ip = getIpAddress(req);
    const key = `rate_limit:${ip}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, timeWindow);
      }

      if (current > requestLimit) {
        return res.status(429).send({
          error: "Too Many Requests",
          remaining: 0,
          reset: Date.now() + timeWindow * 1000,
        });
      }

      // Vous pouvez ajouter un header avec le quota restant
      res.header("X-RateLimit-Limit", requestLimit.toString());
      res.header("X-RateLimit-Remaining", (requestLimit - current).toString());

      return; // On laisse la suite s'exécuter
    } catch (error) {
      req.log.error("Rate limiter error", error);
      return res.status(500).send({ error: "Internal Server Error" });
    }
  };
};
