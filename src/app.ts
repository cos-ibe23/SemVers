import { createApp } from './lib/create-app';
import { configureOpenAPI } from './lib/configure-open-api';
import { auth } from './db/auth';

// Routes
import indexRouter from './routes/index.route';
import v1IndexRouter from './routes/v1/index.route';
import v1AuthRouter from './routes/v1/auth/auth.index';
import v1ClientsRouter from './routes/v1/clients/clients.index';

// Create app with middleware
const app = createApp();

// Configure OpenAPI docs
configureOpenAPI(app);

// Mount Better Auth routes
app.on(['POST', 'GET'], '/v1/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

// Mount non-versioned routes
app.route('/', indexRouter);

// Mount v1 routes
app.route('/v1', v1IndexRouter);
app.route('/v1', v1AuthRouter);
app.route('/v1', v1ClientsRouter);

export default app;
