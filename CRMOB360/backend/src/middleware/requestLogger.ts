import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    const logData = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Em desenvolvimento, log no console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
    
    // Em produção, enviar para sistema de logs
    if (process.env.NODE_ENV === 'production') {
      // Implementar envio para sistema de logs (ex: Winston, Pino)
      console.log(JSON.stringify(logData));
    }
  });
  
  next();
};