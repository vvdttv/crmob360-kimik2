import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Log de queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query:', e.query);
    console.log('Params:', e.params);
    console.log('Duration:', e.duration + 'ms');
  });
}

export default prisma;