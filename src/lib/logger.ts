import pino from 'pino';
import { env } from '../env';

export const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
        env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
});

export const log = {
    trace: (msg: string, data?: Record<string, unknown>) => logger.trace(data, msg),
    debug: (msg: string, data?: Record<string, unknown>) => logger.debug(data, msg),
    info: (msg: string, data?: Record<string, unknown>) => logger.info(data, msg),
    warn: (msg: string, data?: Record<string, unknown>) => logger.warn(data, msg),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(data, msg),
};
