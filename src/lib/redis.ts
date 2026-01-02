import { Redis } from 'ioredis';
import { env } from '../env';
import { logger } from './logger';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        redis.on('connect', () => logger.info('Redis connected'));
        redis.on('error', (err) => logger.error({ err }, 'Redis error'));
    }
    return redis;
}

export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
