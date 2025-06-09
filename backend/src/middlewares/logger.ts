import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Logger middleware that records API requests details
 * Logs: path, method, status code, execution time, and exception stack if any
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Record start time
  const startTime = process.hrtime();
  
  // Get request details
  const requestPath = req.originalUrl || req.url;
  const requestMethod = req.method;
  const requestIP = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log request received
  console.log(`[${new Date().toISOString()}] Request: ${requestMethod} ${requestPath} from ${requestIP}`);
  
  // Add response finished listener
  res.on('finish', () => {
    // Calculate execution time
    const hrTime = process.hrtime(startTime);
    const executionTime = hrTime[0] * 1000 + hrTime[1] / 1000000; // Convert to ms
    
    // Get response status
    const statusCode = res.statusCode;
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      path: requestPath,
      method: requestMethod,
      status: statusCode,
      executionTime: `${executionTime.toFixed(2)}ms`,
      ip: requestIP,
      userAgent,
    };
    
    // Log details based on status
    if (statusCode >= 400) {
      console.error(`[${logEntry.timestamp}] Error: ${requestMethod} ${requestPath} - Status: ${statusCode} - Time: ${logEntry.executionTime}`);
    } else {
      console.log(`[${logEntry.timestamp}] Response: ${requestMethod} ${requestPath} - Status: ${statusCode} - Time: ${logEntry.executionTime}`);
    }
    
    // Append to log file
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'api-requests.log');
    const logMessage = `${JSON.stringify(logEntry)}\n`;
    
    fs.appendFile(logFile, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  });
  
  next();
};

/**
 * Error logger middleware that captures and logs exceptions
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('[ERROR]', err);
  
  // Create error log entry
  const errorLogEntry = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    method: req.method,
    error: err.message,
    stack: err.stack
  };
  
  // Append to error log file
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const errorLogFile = path.join(logDir, 'api-errors.log');
  const logMessage = `${JSON.stringify(errorLogEntry)}\n`;
  
  fs.appendFile(errorLogFile, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to error log file:', err);
    }
  });
  
  // Pass to next error handler
  next(err);
}; 