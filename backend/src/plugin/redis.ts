import fp from 'fastify-plugin';
import { createClient, RedisClientType } from 'redis';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis: ReturnType<typeof createClient>;
  }
}

interface RedisOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
}

async function redisPlugin(
  fastify: FastifyInstance,
  opts: RedisOptions & FastifyPluginOptions
) {
  try {
    const redisConfig = {
      url: opts.url || `redis://${opts.host || 'localhost'}:${opts.port || 6379}`,
      password: opts.password,
    };

    const redis = createClient(redisConfig);

    // Gestion des erreurs Redis
    redis.on('error', (err: Error) => {
      fastify.log.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      fastify.log.info('Redis Client Connected');
    });

    redis.on('ready', () => {
      fastify.log.info('Redis Client Ready');
    });

    redis.on('end', () => {
      fastify.log.info('Redis Client Disconnected');
    });

    // Connexion à Redis
    await redis.connect();

    // Décorateur pour accéder à Redis depuis Fastify
    fastify.decorate('redis', redis);

    // Fermeture propre de la connexion Redis
    fastify.addHook('onClose', async (instance) => {
      if (instance.redis.isOpen) {
        await instance.redis.quit();
        instance.log.info('Redis connection closed');
      }
    });

    fastify.log.info('Redis plugin registered successfully');
  } catch (error) {
    fastify.log.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Helper functions pour Redis
export const RedisHelper = {
  // Cache avec TTL
  async setCache(redis: ReturnType<typeof createClient>, key: string, value: any, ttl: number = 3600): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await redis.setEx(key, ttl, serializedValue);
  },

  // Récupération du cache
  async getCache<T>(redis: ReturnType<typeof createClient>, key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Suppression du cache
  async deleteCache(redis: ReturnType<typeof createClient>, key: string): Promise<void> {
    await redis.del(key);
  },

  // Suppression de cache par pattern
  async deleteCachePattern(redis: ReturnType<typeof createClient>, pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  },

  // Vérification de l'existence d'une clé
  async exists(redis: ReturnType<typeof createClient>, key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  // Set avec expiration
  async setWithExpiry(redis: ReturnType<typeof createClient>, key: string, value: string, seconds: number): Promise<void> {
    await redis.setEx(key, seconds, value);
  },

  // Incrémentation d'une clé
  async increment(redis: ReturnType<typeof createClient>, key: string): Promise<number> {
    return await redis.incr(key);
  },

  // Rate limiting helper
  async checkRateLimit(
    redis: ReturnType<typeof createClient>, 
    identifier: string, 
    maxRequests: number, 
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime
    };
  }
};

export default fp(redisPlugin, {
  name: 'redis',
});
