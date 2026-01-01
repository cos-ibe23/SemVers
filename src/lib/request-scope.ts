import { AsyncLocalStorage } from 'node:async_hooks';
import type { User } from '../db/auth';

export interface RequestScope {
    authenticatedUser: User | null;
    requestId: string;
    startedAt: number;
}

const storage = new AsyncLocalStorage<RequestScope>();

export function createRequestScope(args: Partial<RequestScope> = {}): RequestScope {
    return {
        authenticatedUser: args.authenticatedUser ?? null,
        requestId: args.requestId ?? crypto.randomUUID(),
        startedAt: args.startedAt ?? Date.now(),
    };
}

export function withRequestScope<T>(scope: RequestScope, fn: () => T): T {
    return storage.run(scope, fn);
}

export function getRequestScope(): RequestScope | undefined {
    return storage.getStore();
}
