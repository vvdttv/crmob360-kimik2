import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import router from '@/routes';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Imobiliária 360 API',
      version: '1.0.0',
      description: 'API da Plataforma de Gestão Imobiliária 360',
      contact: {
        name: 'Imobiliária 360',
        email: 'suporte@imobiliaria360.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições',
    message: 'Por favor, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requisições
app.use(requestLogger);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Rotas da API
app.use('/api/v1', router);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Imobiliária 360 API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health check em http://localhost:${PORT}/health`);
});

export default app;