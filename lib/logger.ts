/**
 * Production-Grade Logging System for ScriptForgeAI
 * 
 * Features:
 * - File-based logging with rotation
 * - Console + File output
 * - Log levels (debug, info, warn, error)
 * - Agent execution tracking
 * - Structured JSON logs for analysis
 * - Automatic cleanup of old logs
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_FILES = 30; // Keep last 30 days of logs
const MAX_LOG_SIZE_MB = 10; // Max size per log file

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  agentType?: string;
  workflowId?: string;
  sessionId?: string;
}

// ============================================================================
// LOG LEVEL CONFIGURATION
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment (default: debug in dev, info in prod)
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// ============================================================================
// ENSURE LOG DIRECTORY EXISTS
// ============================================================================

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // Create subdirectories
  const subdirs = ['agents', 'errors', 'workflows', 'api'];
  subdirs.forEach(dir => {
    const subPath = path.join(LOG_DIR, dir);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
  });
}

// ============================================================================
// LOG FILE MANAGEMENT
// ============================================================================

function getLogFileName(category: string = 'app'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, category, `${date}.log`);
}

function getErrorLogFileName(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, 'errors', `${date}-errors.log`);
}

function rotateLogsIfNeeded(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB >= MAX_LOG_SIZE_MB) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = filePath.replace('.log', `-${timestamp}.log`);
        fs.renameSync(filePath, rotatedPath);
      }
    }
  } catch (err) {
    console.error('Log rotation error:', err);
  }
}

function cleanupOldLogs(): void {
  try {
    const subdirs = ['agents', 'errors', 'workflows', 'api'];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_FILES);
    
    subdirs.forEach(subdir => {
      const dirPath = path.join(LOG_DIR, subdir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  } catch (err) {
    console.error('Log cleanup error:', err);
  }
}

// ============================================================================
// WRITE LOG ENTRY
// ============================================================================

function writeLog(entry: LogEntry, category: string = 'app'): void {
  ensureLogDir();
  
  const logFile = getLogFileName(category);
  
  // Ensure the category subdirectory exists
  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  rotateLogsIfNeeded(logFile);
  
  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(logFile, logLine, 'utf8');
    
    // Also write errors to dedicated error log
    if (entry.level === 'error') {
      const errorLogFile = getErrorLogFileName();
      const errorDir = path.dirname(errorLogFile);
      if (!fs.existsSync(errorDir)) {
        fs.mkdirSync(errorDir, { recursive: true });
      }
      fs.appendFileSync(errorLogFile, logLine, 'utf8');
    }
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

// ============================================================================
// CONSOLE OUTPUT FORMATTING
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function formatConsoleOutput(entry: LogEntry): string {
  const time = new Date().toLocaleTimeString();
  const levelColors: Record<LogLevel, string> = {
    debug: COLORS.gray,
    info: COLORS.cyan,
    warn: COLORS.yellow,
    error: COLORS.red,
  };
  
  const levelColor = levelColors[entry.level];
  const levelPadded = entry.level.toUpperCase().padEnd(5);
  
  let output = `${COLORS.dim}[${time}]${COLORS.reset} ${levelColor}${levelPadded}${COLORS.reset} `;
  output += `${COLORS.bright}[${entry.category}]${COLORS.reset} `;
  output += entry.message;
  
  if (entry.duration !== undefined) {
    output += ` ${COLORS.magenta}(${entry.duration}ms)${COLORS.reset}`;
  }
  
  if (entry.agentType) {
    output += ` ${COLORS.blue}agent=${entry.agentType}${COLORS.reset}`;
  }
  
  return output;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private category: string;
  private sessionId?: string;
  private workflowId?: string;
  
  constructor(category: string) {
    this.category = category;
  }
  
  setSession(sessionId: string): this {
    this.sessionId = sessionId;
    return this;
  }
  
  setWorkflow(workflowId: string): this {
    this.workflowId = workflowId;
    return this;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
  }
  
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: this.category,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
      sessionId: this.sessionId,
      workflowId: this.workflowId,
    };
    
    // Console output
    console.log(formatConsoleOutput(entry));
    if (data && level !== 'debug') {
      console.log(COLORS.dim + JSON.stringify(data, null, 2) + COLORS.reset);
    }
    if (error) {
      console.error(COLORS.red + error.stack + COLORS.reset);
    }
    
    // File output
    writeLog(entry, this.category);
  }
  
  private sanitizeData(data: any): any {
    // Remove sensitive fields and truncate large data
    const sanitized = { ...data };
    const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'authorization'];
    
    const clean = (obj: any, depth: number = 0): any => {
      if (depth > 5) return '[TRUNCATED]';
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string' && obj.length > 5000) {
        return obj.substring(0, 5000) + '... [TRUNCATED]';
      }
      if (Array.isArray(obj)) {
        return obj.slice(0, 100).map(item => clean(item, depth + 1));
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
          if (sensitiveKeys.includes(key.toLowerCase())) {
            cleaned[key] = '[REDACTED]';
          } else {
            cleaned[key] = clean(obj[key], depth + 1);
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    return clean(sanitized);
  }
  
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  
  error(message: string, error?: Error, data?: any): void {
    this.log('error', message, data, error);
  }
}

// ============================================================================
// AGENT EXECUTION LOGGER
// ============================================================================

interface AgentExecutionLog {
  agentType: string;
  workflowId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'success' | 'error' | 'fallback';
  input?: any;
  output?: any;
  error?: Error;
  model?: string;
  retryCount?: number;
}

class AgentLogger extends Logger {
  private executions: Map<string, AgentExecutionLog> = new Map();
  
  constructor() {
    super('agents');
  }
  
  startExecution(agentType: string, workflowId?: string, input?: any): string {
    const executionId = `${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: AgentExecutionLog = {
      agentType,
      workflowId,
      startTime: new Date(),
      status: 'started',
      input,
    };
    
    this.executions.set(executionId, execution);
    
    this.info(`🚀 Agent started: ${agentType}`, {
      executionId,
      workflowId,
      inputSummary: input ? this.summarizeInput(input) : undefined,
    });
    
    return executionId;
  }
  
  endExecution(
    executionId: string, 
    status: 'success' | 'error' | 'fallback',
    output?: any,
    error?: Error,
    model?: string
  ): void {
    const execution = this.executions.get(executionId);
    if (!execution) {
      this.warn(`Execution not found: ${executionId}`);
      return;
    }
    
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.status = status;
    execution.output = output;
    execution.error = error;
    execution.model = model;
    
    const statusEmoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    
    this.info(`${statusEmoji} Agent ${status}: ${execution.agentType}`, {
      executionId,
      duration: execution.duration,
      model,
      outputSummary: output ? this.summarizeOutput(output) : undefined,
    });
    
    if (error) {
      this.error(`Agent error: ${execution.agentType}`, error, {
        executionId,
        duration: execution.duration,
      });
    }
    
    // Save detailed execution log
    this.saveExecutionLog(executionId, execution);
    
    // Cleanup
    this.executions.delete(executionId);
  }
  
  private summarizeInput(input: any): any {
    if (!input) return null;
    return {
      hasStoryBrief: !!input.storyBrief,
      briefLength: input.storyBrief?.length || 0,
      hasManuscript: !!input.manuscript || !!input.hasManuscript,
      previousAgents: input.previousAgents?.length || 0,
    };
  }
  
  private summarizeOutput(output: any): any {
    if (!output) return null;
    if (typeof output === 'string') {
      return { type: 'string', length: output.length };
    }
    if (Array.isArray(output)) {
      return { type: 'array', count: output.length };
    }
    return {
      type: 'object',
      keys: Object.keys(output).slice(0, 10),
    };
  }
  
  private saveExecutionLog(executionId: string, execution: AgentExecutionLog): void {
    const logEntry: LogEntry = {
      timestamp: execution.startTime.toISOString(),
      level: execution.status === 'error' ? 'error' : 'info',
      category: 'agent-execution',
      message: `Agent execution: ${execution.agentType}`,
      agentType: execution.agentType,
      workflowId: execution.workflowId,
      duration: execution.duration,
      data: {
        executionId,
        status: execution.status,
        model: execution.model,
        input: execution.input,
        output: execution.output,
      },
      error: execution.error ? {
        message: execution.error.message,
        stack: execution.error.stack,
      } : undefined,
    };
    
    writeLog(logEntry, 'agents');
  }
}

// ============================================================================
// API REQUEST LOGGER
// ============================================================================

class APILogger extends Logger {
  constructor() {
    super('api');
  }
  
  logRequest(method: string, path: string, body?: any): void {
    this.info(`→ ${method} ${path}`, {
      method,
      path,
      bodySize: body ? JSON.stringify(body).length : 0,
    });
  }
  
  logResponse(method: string, path: string, status: number, duration: number): void {
    const emoji = status >= 400 ? '❌' : '✓';
    this.info(`${emoji} ${method} ${path} ${status} (${duration}ms)`, {
      method,
      path,
      status,
      duration,
    });
  }
}

// ============================================================================
// WORKFLOW LOGGER
// ============================================================================

class WorkflowLogger extends Logger {
  constructor() {
    super('workflows');
  }
  
  startWorkflow(workflowId: string, name?: string, agentCount?: number): void {
    this.info(`📋 Workflow started: ${workflowId}`, {
      workflowId,
      name,
      agentCount,
    });
  }
  
  nodeExecuted(workflowId: string, nodeId: string, agentType: string, status: string): void {
    this.info(`  └─ Node ${nodeId}: ${agentType} → ${status}`, {
      workflowId,
      nodeId,
      agentType,
      status,
    });
  }
  
  endWorkflow(workflowId: string, status: string, duration: number): void {
    const emoji = status === 'completed' ? '🎉' : '❌';
    this.info(`${emoji} Workflow ${status}: ${workflowId} (${duration}ms)`, {
      workflowId,
      status,
      duration,
    });
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const logger = new Logger('app');
export const agentLogger = new AgentLogger();
export const apiLogger = new APILogger();
export const workflowLogger = new WorkflowLogger();

// Create specialized loggers
export function createLogger(category: string): Logger {
  return new Logger(category);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Ensure log directory exists on module load
ensureLogDir();

// Run cleanup on startup (async, non-blocking)
setTimeout(() => cleanupOldLogs(), 5000);

// Export types
export type { LogLevel, LogEntry, AgentExecutionLog };
