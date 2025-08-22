import type { Tool, ToolConfig, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface ApiRateLimiterConfig extends ToolConfig {
  rateLimitType: 'requests_per_second' | 'requests_per_minute' | 'requests_per_hour' | 'requests_per_day';
  maxRequests: number;
  timeWindow: number;
  burstCapacity: number;
  algorithm: 'token_bucket' | 'leaky_bucket' | 'fixed_window' | 'sliding_window' | 'sliding_log';
  distributedMode: boolean;
  backoffStrategy: 'exponential' | 'linear' | 'fixed' | 'fibonacci';
  initialDelay: number;
  maxDelay: number;
  jitterEnabled: boolean;
  gracePeriod: number;
  quotaReset: 'rolling' | 'fixed_interval';
  includeHeaders: boolean;
  format: 'implementation' | 'config' | 'nginx' | 'cloudflare' | 'aws' | 'redis_lua';
}

export interface RateLimitResult {
  algorithm: string;
  configuration: Record<string, any>;
  implementation: string;
  headers: Record<string, string>;
  redis_script?: string;
  nginx_config?: string;
  cloudflare_config?: string;
  aws_config?: string;
  documentation: string;
  monitoring: string;
  testing_scenarios: Array<{
    name: string;
    description: string;
    requests: number;
    expected_behavior: string;
  }>;
}

export function processApiRateLimiter(config: ApiRateLimiterConfig): ToolResult<RateLimitResult> {
  try {
    const {
      rateLimitType = 'requests_per_second',
      maxRequests = 100,
      timeWindow = 1,
      burstCapacity = 20,
      algorithm = 'token_bucket',
      distributedMode = false,
      backoffStrategy = 'exponential',
      initialDelay = 1000,
      maxDelay = 30000,
      jitterEnabled = true,
      gracePeriod = 5,
      quotaReset = 'rolling',
      includeHeaders = true,
      format = 'implementation'
    } = config;

    // Calculate rate limits in different units
    const timeWindowMs = getTimeWindowInMs(rateLimitType, timeWindow);
    const requestsPerSecond = (maxRequests * 1000) / timeWindowMs;
    const requestsPerMinute = requestsPerSecond * 60;
    const requestsPerHour = requestsPerMinute * 60;
    const requestsPerDay = requestsPerHour * 24;

    // Generate algorithm-specific configuration
    const algorithmConfig = generateAlgorithmConfig(algorithm, maxRequests, timeWindowMs, burstCapacity);

    // Generate implementation code
    const implementation = generateImplementation(algorithm, algorithmConfig, backoffStrategy, distributedMode);

    // Generate headers configuration
    const headers = generateHeaders(includeHeaders, maxRequests, timeWindowMs, algorithm);

    // Generate platform-specific configurations
    const redisScript = generateRedisScript(algorithm, algorithmConfig);
    const nginxConfig = generateNginxConfig(maxRequests, timeWindowMs, burstCapacity);
    const cloudflareConfig = generateCloudflareConfig(maxRequests, timeWindowMs);
    const awsConfig = generateAWSConfig(maxRequests, timeWindowMs, algorithm);

    // Generate documentation
    const documentation = generateDocumentation(algorithm, maxRequests, timeWindowMs, backoffStrategy);

    // Generate monitoring configuration
    const monitoring = generateMonitoring(algorithm, maxRequests);

    // Generate testing scenarios
    const testingScenarios = generateTestingScenarios(maxRequests, timeWindowMs, burstCapacity);

    const result: RateLimitResult = {
      algorithm,
      configuration: {
        rate_limit_type: rateLimitType,
        max_requests: maxRequests,
        time_window_ms: timeWindowMs,
        requests_per_second: Math.round(requestsPerSecond * 100) / 100,
        requests_per_minute: Math.round(requestsPerMinute),
        requests_per_hour: Math.round(requestsPerHour),
        requests_per_day: Math.round(requestsPerDay),
        burst_capacity: burstCapacity,
        algorithm_config: algorithmConfig,
        backoff_strategy: backoffStrategy,
        initial_delay_ms: initialDelay,
        max_delay_ms: maxDelay,
        jitter_enabled: jitterEnabled,
        grace_period_seconds: gracePeriod,
        quota_reset: quotaReset,
        distributed_mode: distributedMode
      },
      implementation,
      headers,
      redis_script: redisScript,
      nginx_config: nginxConfig,
      cloudflare_config: cloudflareConfig,
      aws_config: awsConfig,
      documentation,
      monitoring,
      testing_scenarios: testingScenarios
    };

    return {
      success: true,
      data: result,
      metadata: {
        algorithm,
        rate: `${maxRequests}/${rateLimitType.replace('_', ' ')}`,
        burst_capacity: burstCapacity,
        distributed: distributedMode
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate rate limiter configuration'
    };
  }
}

function getTimeWindowInMs(rateLimitType: string, timeWindow: number): number {
  switch (rateLimitType) {
    case 'requests_per_second': return timeWindow * 1000;
    case 'requests_per_minute': return timeWindow * 60 * 1000;
    case 'requests_per_hour': return timeWindow * 60 * 60 * 1000;
    case 'requests_per_day': return timeWindow * 24 * 60 * 60 * 1000;
    default: return timeWindow * 1000;
  }
}

function generateAlgorithmConfig(algorithm: string, maxRequests: number, timeWindowMs: number, burstCapacity: number) {
  switch (algorithm) {
    case 'token_bucket':
      return {
        bucket_size: maxRequests + burstCapacity,
        refill_rate: maxRequests / (timeWindowMs / 1000),
        refill_period_ms: Math.min(1000, timeWindowMs / maxRequests)
      };
    case 'leaky_bucket':
      return {
        bucket_size: burstCapacity,
        leak_rate: maxRequests / (timeWindowMs / 1000),
        overflow_strategy: 'drop'
      };
    case 'fixed_window':
      return {
        window_size_ms: timeWindowMs,
        max_requests_per_window: maxRequests
      };
    case 'sliding_window':
      return {
        window_size_ms: timeWindowMs,
        sub_window_count: Math.min(10, Math.max(2, Math.floor(timeWindowMs / 1000))),
        max_requests_per_window: maxRequests
      };
    case 'sliding_log':
      return {
        window_size_ms: timeWindowMs,
        max_requests: maxRequests,
        cleanup_interval_ms: Math.min(60000, timeWindowMs)
      };
    default:
      return {};
  }
}

function generateImplementation(algorithm: string, config: any, backoffStrategy: string, distributedMode: boolean): string {
  const baseImplementation = getAlgorithmImplementation(algorithm, config);
  const backoffImpl = getBackoffImplementation(backoffStrategy);
  const distributedImpl = distributedMode ? getDistributedImplementation() : '';

  return `${baseImplementation}\n\n${backoffImpl}\n\n${distributedImpl}`.trim();
}

function getAlgorithmImplementation(algorithm: string, config: any): string {
  switch (algorithm) {
    case 'token_bucket':
      return `// Token Bucket Rate Limiter Implementation
class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly bucketSize: number = ${config.bucket_size};
  private readonly refillRate: number = ${config.refill_rate};

  constructor() {
    this.tokens = this.bucketSize;
    this.lastRefill = Date.now();
  }

  isAllowed(tokensRequested: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.bucketSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getWaitTimeMs(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate * 1000);
  }
}`;

    case 'leaky_bucket':
      return `// Leaky Bucket Rate Limiter Implementation
class LeakyBucketRateLimiter {
  private queue: number[] = [];
  private lastLeak: number;
  private readonly bucketSize: number = ${config.bucket_size};
  private readonly leakRate: number = ${config.leak_rate};

  constructor() {
    this.lastLeak = Date.now();
  }

  isAllowed(): boolean {
    this.leak();
    
    if (this.queue.length < this.bucketSize) {
      this.queue.push(Date.now());
      return true;
    }
    return false;
  }

  private leak(): void {
    const now = Date.now();
    const timePassed = (now - this.lastLeak) / 1000;
    const itemsToLeak = Math.floor(timePassed * this.leakRate);
    
    for (let i = 0; i < itemsToLeak && this.queue.length > 0; i++) {
      this.queue.shift();
    }
    
    this.lastLeak = now;
  }

  getQueueSize(): number {
    this.leak();
    return this.queue.length;
  }

  getWaitTimeMs(): number {
    this.leak();
    if (this.queue.length < this.bucketSize) return 0;
    return Math.ceil(1000 / this.leakRate);
  }
}`;

    case 'fixed_window':
      return `// Fixed Window Rate Limiter Implementation
class FixedWindowRateLimiter {
  private requests: Map<number, number> = new Map();
  private readonly windowSize: number = ${config.window_size_ms};
  private readonly maxRequests: number = ${config.max_requests_per_window};

  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    
    const currentCount = this.requests.get(windowStart) || 0;
    
    if (currentCount < this.maxRequests) {
      this.requests.set(windowStart, currentCount + 1);
      this.cleanup(windowStart);
      return true;
    }
    return false;
  }

  private cleanup(currentWindow: number): void {
    for (const [window] of this.requests) {
      if (window < currentWindow) {
        this.requests.delete(window);
      }
    }
  }

  getCurrentCount(): number {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    return this.requests.get(windowStart) || 0;
  }

  getWaitTimeMs(): number {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    const nextWindow = windowStart + this.windowSize;
    return Math.max(0, nextWindow - now);
  }
}`;

    case 'sliding_window':
      return `// Sliding Window Rate Limiter Implementation
class SlidingWindowRateLimiter {
  private windows: Map<number, number> = new Map();
  private readonly windowSize: number = ${config.window_size_ms};
  private readonly subWindowCount: number = ${config.sub_window_count};
  private readonly maxRequests: number = ${config.max_requests_per_window};
  private readonly subWindowSize: number = ${Math.floor(config.window_size_ms / config.sub_window_count)};

  isAllowed(): boolean {
    const now = Date.now();
    const currentSubWindow = Math.floor(now / this.subWindowSize);
    
    this.cleanup(currentSubWindow);
    
    const totalRequests = this.getTotalRequests(currentSubWindow);
    
    if (totalRequests < this.maxRequests) {
      const currentCount = this.windows.get(currentSubWindow) || 0;
      this.windows.set(currentSubWindow, currentCount + 1);
      return true;
    }
    return false;
  }

  private getTotalRequests(currentSubWindow: number): number {
    let total = 0;
    for (let i = 0; i < this.subWindowCount; i++) {
      const window = currentSubWindow - i;
      total += this.windows.get(window) || 0;
    }
    return total;
  }

  private cleanup(currentSubWindow: number): void {
    const cutoff = currentSubWindow - this.subWindowCount;
    for (const [window] of this.windows) {
      if (window <= cutoff) {
        this.windows.delete(window);
      }
    }
  }

  getCurrentCount(): number {
    const now = Date.now();
    const currentSubWindow = Math.floor(now / this.subWindowSize);
    return this.getTotalRequests(currentSubWindow);
  }
}`;

    case 'sliding_log':
      return `// Sliding Log Rate Limiter Implementation
class SlidingLogRateLimiter {
  private requests: number[] = [];
  private readonly windowSize: number = ${config.window_size_ms};
  private readonly maxRequests: number = ${config.max_requests};

  isAllowed(): boolean {
    const now = Date.now();
    this.cleanup(now);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }

  private cleanup(now: number): void {
    const cutoff = now - this.windowSize;
    this.requests = this.requests.filter(timestamp => timestamp > cutoff);
  }

  getCurrentCount(): number {
    const now = Date.now();
    this.cleanup(now);
    return this.requests.length;
  }

  getOldestRequestAge(): number {
    if (this.requests.length === 0) return 0;
    return Date.now() - this.requests[0];
  }
}`;

    default:
      return '// Algorithm implementation not available';
  }
}

function getBackoffImplementation(strategy: string): string {
  switch (strategy) {
    case 'exponential':
      return `// Exponential Backoff Implementation
class ExponentialBackoff {
  private attempts: number = 0;
  private readonly baseDelay: number = 1000;
  private readonly maxDelay: number = 30000;
  private readonly multiplier: number = 2;

  getDelay(): number {
    const delay = this.baseDelay * Math.pow(this.multiplier, this.attempts);
    this.attempts++;
    return Math.min(delay, this.maxDelay);
  }

  reset(): void {
    this.attempts = 0;
  }

  addJitter(delay: number): number {
    return delay + Math.random() * delay * 0.1;
  }
}`;

    case 'linear':
      return `// Linear Backoff Implementation
class LinearBackoff {
  private attempts: number = 0;
  private readonly baseDelay: number = 1000;
  private readonly increment: number = 1000;
  private readonly maxDelay: number = 30000;

  getDelay(): number {
    const delay = this.baseDelay + (this.attempts * this.increment);
    this.attempts++;
    return Math.min(delay, this.maxDelay);
  }

  reset(): void {
    this.attempts = 0;
  }
}`;

    case 'fixed':
      return `// Fixed Backoff Implementation
class FixedBackoff {
  private readonly delay: number = 5000;

  getDelay(): number {
    return this.delay;
  }

  reset(): void {
    // No state to reset
  }
}`;

    case 'fibonacci':
      return `// Fibonacci Backoff Implementation
class FibonacciBackoff {
  private fibA: number = 1;
  private fibB: number = 1;
  private readonly baseDelay: number = 1000;
  private readonly maxDelay: number = 30000;

  getDelay(): number {
    const delay = this.baseDelay * this.fibA;
    const next = this.fibA + this.fibB;
    this.fibA = this.fibB;
    this.fibB = next;
    return Math.min(delay, this.maxDelay);
  }

  reset(): void {
    this.fibA = 1;
    this.fibB = 1;
  }
}`;

    default:
      return '// Backoff strategy implementation not available';
  }
}

function getDistributedImplementation(): string {
  return `// Distributed Rate Limiter with Redis
class DistributedRateLimiter {
  private redis: any; // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async isAllowed(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const pipeline = this.redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    
    // Count current requests
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, \`\${now}-\${Math.random()}\`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results[1][1];
    
    return currentCount <= limit;
  }

  async getCurrentCount(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    await this.redis.zremrangebyscore(key, 0, now - windowMs);
    return await this.redis.zcard(key);
  }

  async getRemainingRequests(key: string, limit: number, windowMs: number): Promise<number> {
    const current = await this.getCurrentCount(key, windowMs);
    return Math.max(0, limit - current);
  }
}`;
}

function generateHeaders(includeHeaders: boolean, maxRequests: number, timeWindowMs: number, algorithm: string): Record<string, string> {
  if (!includeHeaders) return {};

  const resetTime = Math.floor(Date.now() / 1000) + Math.floor(timeWindowMs / 1000);
  
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': '${remaining}',
    'X-RateLimit-Reset': resetTime.toString(),
    'X-RateLimit-Reset-After': Math.floor(timeWindowMs / 1000).toString(),
    'X-RateLimit-Policy': `${maxRequests};w=${Math.floor(timeWindowMs / 1000)}`,
    'X-RateLimit-Algorithm': algorithm,
    'Retry-After': '${retry_after}',
    'RateLimit': `limit=${maxRequests}, remaining=\${remaining}, reset=${resetTime}`,
    'RateLimit-Policy': `${maxRequests};w=${Math.floor(timeWindowMs / 1000)};algorithm=${algorithm}`
  };
}

function generateRedisScript(algorithm: string, config: any): string {
  if (algorithm === 'sliding_window') {
    return `-- Sliding Window Rate Limiter Redis Script
local key = KEYS[1]
local window_size = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, 0, now - window_size)

-- Count current requests
local current = redis.call('ZCARD', key)

if current < limit then
  -- Add current request
  redis.call('ZADD', key, now, now .. '-' .. math.random())
  redis.call('EXPIRE', key, math.ceil(window_size / 1000))
  return {1, limit - current - 1}
else
  return {0, 0}
end`;
  }

  return `-- Token Bucket Rate Limiter Redis Script
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local tokens = tonumber(ARGV[2])
local interval = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens_count = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Calculate tokens to add
local elapsed = now - last_refill
local tokens_to_add = math.floor(elapsed / interval * tokens)
tokens_count = math.min(capacity, tokens_count + tokens_to_add)

if tokens_count >= 1 then
  tokens_count = tokens_count - 1
  redis.call('HMSET', key, 'tokens', tokens_count, 'last_refill', now)
  redis.call('EXPIRE', key, 3600)
  return {1, tokens_count}
else
  redis.call('HMSET', key, 'tokens', tokens_count, 'last_refill', now)
  redis.call('EXPIRE', key, 3600)
  return {0, tokens_count}
end`;
}

function generateNginxConfig(maxRequests: number, timeWindowMs: number, burstCapacity: number): string {
  const rateMbps = maxRequests / (timeWindowMs / 1000);
  
  return `# Nginx Rate Limiting Configuration

# Define rate limiting zones
http {
    # Basic rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=${Math.floor(rateMbps)}r/s;
    
    # Burst handling
    limit_req_zone $binary_remote_addr zone=api_burst:10m rate=${Math.floor(rateMbps)}r/s;
    
    # Status tracking
    limit_req_status 429;
    limit_req_log_level warn;
}

server {
    location /api/ {
        # Apply rate limiting with burst
        limit_req zone=api burst=${burstCapacity} nodelay;
        limit_req zone=api_burst burst=${Math.floor(burstCapacity / 2)};
        
        # Custom headers
        add_header X-RateLimit-Limit ${maxRequests} always;
        add_header X-RateLimit-Window ${Math.floor(timeWindowMs / 1000)} always;
        
        # Rate limit error page
        error_page 429 /rate-limit-exceeded.html;
        
        proxy_pass http://backend;
    }
    
    location = /rate-limit-exceeded.html {
        internal;
        return 429 '{"error": "Rate limit exceeded", "retry_after": ${Math.ceil(timeWindowMs / 1000)}}';
        add_header Content-Type application/json always;
    }
}`;
}

function generateCloudflareConfig(maxRequests: number, timeWindowMs: number): string {
  return `// Cloudflare Workers Rate Limiter

export default {
  async fetch(request, env, ctx) {
    const rateLimiter = {
      limit: ${maxRequests},
      window: ${Math.floor(timeWindowMs / 1000)}, // seconds
    };
    
    const clientIP = request.headers.get('CF-Connecting-IP');
    const key = \`rate_limit:\${clientIP}\`;
    
    // Get current count
    const current = await env.KV.get(key) || 0;
    const count = parseInt(current);
    
    if (count >= rateLimiter.limit) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        limit: rateLimiter.limit,
        window: rateLimiter.window,
        retry_after: rateLimiter.window
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimiter.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + rateLimiter.window * 1000).toString(),
          'Retry-After': rateLimiter.window.toString()
        }
      });
    }
    
    // Increment counter
    await env.KV.put(key, (count + 1).toString(), {
      expirationTtl: rateLimiter.window
    });
    
    const remaining = rateLimiter.limit - count - 1;
    
    // Add rate limit headers to response
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    
    newResponse.headers.set('X-RateLimit-Limit', rateLimiter.limit.toString());
    newResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', (Date.now() + rateLimiter.window * 1000).toString());
    
    return newResponse;
  }
};`;
}

function generateAWSConfig(maxRequests: number, timeWindowMs: number, algorithm: string): string {
  return `# AWS API Gateway Rate Limiting Configuration

# CloudFormation Template
Resources:
  APIUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: RateLimitedPlan
      Description: Rate limited usage plan
      Throttle:
        RateLimit: ${maxRequests / (timeWindowMs / 1000)}
        BurstLimit: ${Math.floor(maxRequests * 1.5)}
      Quota:
        Limit: ${Math.floor(maxRequests * 24 * 60 * 60 / (timeWindowMs / 1000))}
        Period: DAY

  APIKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: RateLimitedKey
      Description: API Key for rate limited access
      Enabled: true

  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref APIKey
      KeyType: API_KEY
      UsagePlanId: !Ref APIUsagePlan

# Lambda Rate Limiter Function
import json
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('rate_limits')

def lambda_handler(event, context):
    client_id = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    current_time = int(time.time())
    window_start = current_time - (current_time % ${Math.floor(timeWindowMs / 1000)})
    
    try:
        # Get or create rate limit record
        response = table.get_item(
            Key={'client_id': client_id, 'window_start': window_start}
        )
        
        if 'Item' in response:
            request_count = int(response['Item']['request_count'])
        else:
            request_count = 0
        
        if request_count >= ${maxRequests}:
            return {
                'statusCode': 429,
                'headers': {
                    'X-RateLimit-Limit': '${maxRequests}',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': str(window_start + ${Math.floor(timeWindowMs / 1000)}),
                    'Retry-After': str(${Math.floor(timeWindowMs / 1000)})
                },
                'body': json.dumps({
                    'error': 'Rate limit exceeded',
                    'retry_after': ${Math.floor(timeWindowMs / 1000)}
                })
            }
        
        # Increment counter
        table.put_item(
            Item={
                'client_id': client_id,
                'window_start': window_start,
                'request_count': request_count + 1,
                'ttl': window_start + ${Math.floor(timeWindowMs / 1000)} + 3600
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'X-RateLimit-Limit': '${maxRequests}',
                'X-RateLimit-Remaining': str(${maxRequests} - request_count - 1),
                'X-RateLimit-Reset': str(window_start + ${Math.floor(timeWindowMs / 1000)})
            },
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }`;
}

function generateDocumentation(algorithm: string, maxRequests: number, timeWindowMs: number, backoffStrategy: string): string {
  return `# API Rate Limiter Documentation

## Overview
This rate limiter implements the **${algorithm.replace('_', ' ')} algorithm** with a limit of **${maxRequests} requests per ${timeWindowMs / 1000} seconds**.

## Algorithm Details

### ${algorithm.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
${getAlgorithmDescription(algorithm)}

## Configuration
- **Rate Limit**: ${maxRequests} requests per ${timeWindowMs / 1000} seconds
- **Algorithm**: ${algorithm}
- **Backoff Strategy**: ${backoffStrategy}

## HTTP Headers
The rate limiter returns the following headers:

- \`X-RateLimit-Limit\`: Maximum number of requests allowed
- \`X-RateLimit-Remaining\`: Number of requests remaining in current window
- \`X-RateLimit-Reset\`: Unix timestamp when the rate limit resets
- \`X-RateLimit-Reset-After\`: Seconds until the rate limit resets
- \`Retry-After\`: Seconds to wait before retrying (when rate limited)

## Error Responses
When rate limited, the API returns:

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": ${maxRequests},
  "remaining": 0,
  "reset": 1640995200,
  "retry_after": ${Math.floor(timeWindowMs / 1000)}
}
\`\`\`

## Best Practices

### Client Implementation
1. **Check Headers**: Always check rate limit headers in responses
2. **Implement Backoff**: Use exponential backoff when rate limited
3. **Handle 429s**: Gracefully handle rate limit errors
4. **Cache Responses**: Cache responses to reduce API calls

### Server Configuration
1. **Monitor Usage**: Track rate limit hit rates
2. **Adjust Limits**: Monitor and adjust limits based on usage patterns
3. **Implement Burst**: Allow short bursts of traffic
4. **Use Distributed**: Implement distributed rate limiting for high availability

## Testing
See the testing scenarios section for comprehensive test cases.

## Monitoring
Set up alerts for:
- High rate limit hit rates (>10%)
- Unusual traffic patterns
- Failed rate limit checks
- Algorithm performance metrics`;
}

function getAlgorithmDescription(algorithm: string): string {
  switch (algorithm) {
    case 'token_bucket':
      return `The token bucket algorithm maintains a bucket of tokens that are consumed with each request. 
Tokens are added to the bucket at a fixed rate, allowing for burst traffic up to the bucket capacity.
This algorithm is ideal for APIs that need to handle occasional traffic spikes.`;

    case 'leaky_bucket':
      return `The leaky bucket algorithm smooths out bursty traffic by processing requests at a fixed rate.
Requests are queued when they arrive and processed at the configured leak rate.
This algorithm ensures consistent processing rates but may introduce latency.`;

    case 'fixed_window':
      return `The fixed window algorithm divides time into fixed-size windows and allows a maximum number
of requests per window. Simple to implement but can allow traffic spikes at window boundaries.`;

    case 'sliding_window':
      return `The sliding window algorithm uses multiple sub-windows to provide smoother rate limiting
than fixed windows. It maintains a rolling count of requests over the sliding time window.`;

    case 'sliding_log':
      return `The sliding log algorithm maintains a log of all request timestamps and removes expired
entries. Provides precise rate limiting but requires more memory for high-traffic APIs.`;

    default:
      return 'Algorithm description not available.';
  }
}

function generateMonitoring(algorithm: string, maxRequests: number): string {
  return `# Rate Limiter Monitoring Configuration

## Metrics to Track

### Core Metrics
- **Request Count**: Total requests per time window
- **Rate Limit Hits**: Number of requests that were rate limited
- **Hit Rate Percentage**: (Rate limited requests / Total requests) * 100
- **Algorithm Performance**: Processing time per request

### Algorithm-Specific Metrics
${getAlgorithmMetrics(algorithm)}

## Prometheus Metrics
\`\`\`prometheus
# Rate limiter request counter
rate_limiter_requests_total{algorithm="${algorithm}",status="allowed|denied"}

# Rate limiter processing duration
rate_limiter_duration_seconds{algorithm="${algorithm}"}

# Current rate limit utilization
rate_limiter_utilization_ratio{algorithm="${algorithm}"}

# Token bucket specific (if applicable)
rate_limiter_tokens_available{algorithm="${algorithm}"}
\`\`\`

## Grafana Dashboard Queries
\`\`\`sql
-- Rate limit hit percentage
(rate(rate_limiter_requests_total{status="denied"}[5m]) / rate(rate_limiter_requests_total[5m])) * 100

-- Requests per second
rate(rate_limiter_requests_total[1m])

-- Average processing time
rate(rate_limiter_duration_seconds_sum[5m]) / rate(rate_limiter_duration_seconds_count[5m])
\`\`\`

## Alerts
### High Rate Limit Usage
- **Threshold**: >80% of requests being rate limited
- **Duration**: 5 minutes
- **Action**: Scale up resources or adjust limits

### Algorithm Performance
- **Threshold**: Processing time >10ms
- **Duration**: 2 minutes
- **Action**: Investigate performance issues

## Logging
\`\`\`json
{
  "timestamp": "2023-01-01T12:00:00Z",
  "level": "WARN",
  "message": "Rate limit exceeded",
  "client_id": "192.168.1.1",
  "algorithm": "${algorithm}",
  "limit": ${maxRequests},
  "current_count": ${maxRequests + 1},
  "window_start": "2023-01-01T12:00:00Z"
}
\`\`\``;
}

function getAlgorithmMetrics(algorithm: string): string {
  switch (algorithm) {
    case 'token_bucket':
      return `- **Available Tokens**: Current number of tokens in bucket
- **Refill Rate**: Tokens added per second
- **Bucket Utilization**: Percentage of bucket capacity used`;
    
    case 'leaky_bucket':
      return `- **Queue Size**: Number of requests in queue
- **Leak Rate**: Requests processed per second
- **Queue Utilization**: Percentage of queue capacity used`;
    
    case 'sliding_window':
      return `- **Window Utilization**: Requests in current sliding window
- **Sub-window Distribution**: Request distribution across sub-windows`;
    
    default:
      return `- **Window Utilization**: Current usage within time window
- **Request Distribution**: Pattern of request arrivals`;
  }
}

function generateTestingScenarios(maxRequests: number, timeWindowMs: number, burstCapacity: number): Array<{
  name: string;
  description: string;
  requests: number;
  expected_behavior: string;
}> {
  return [
    {
      name: 'Normal Traffic',
      description: 'Send requests at 70% of rate limit',
      requests: Math.floor(maxRequests * 0.7),
      expected_behavior: 'All requests should be allowed with appropriate headers'
    },
    {
      name: 'Burst Traffic',
      description: 'Send burst of requests up to burst capacity',
      requests: maxRequests + burstCapacity,
      expected_behavior: 'Initial requests allowed, excess requests rate limited'
    },
    {
      name: 'Sustained Overload',
      description: 'Send requests at 150% of rate limit for extended period',
      requests: Math.floor(maxRequests * 1.5),
      expected_behavior: 'Consistent rate limiting with proper 429 responses'
    },
    {
      name: 'Gradual Ramp-up',
      description: 'Gradually increase request rate from 0 to 200% of limit',
      requests: maxRequests * 2,
      expected_behavior: 'Rate limiting should kick in smoothly as limit is approached'
    },
    {
      name: 'Window Boundary',
      description: 'Test behavior at time window boundaries',
      requests: maxRequests,
      expected_behavior: 'Rate limit should reset properly at window boundaries'
    },
    {
      name: 'Recovery Test',
      description: 'Stop traffic, wait for reset, then resume',
      requests: maxRequests,
      expected_behavior: 'Rate limit should reset and allow normal traffic after window'
    },
    {
      name: 'Concurrent Clients',
      description: 'Multiple clients sending requests simultaneously',
      requests: maxRequests,
      expected_behavior: 'Rate limiting should work correctly across all clients'
    },
    {
      name: 'Edge Case - Zero Requests',
      description: 'Test with no requests for extended period',
      requests: 0,
      expected_behavior: 'System should handle idle state correctly'
    }
  ];
}

export const apiRateLimiterCalculatorTool: Tool = {
  id: 'api-rate-limiter-calculator',
  name: 'API Rate Limiter Calculator',
  description: 'Generate rate limiting configurations, implementations, and monitoring for APIs with multiple algorithms and deployment targets',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'rate-limiting')!,
  slug: 'api-rate-limiter-calculator',
  icon: '⚡',
  keywords: ['api', 'rate-limiting', 'networking', 'throttling', 'security', 'algorithms'],
  seoTitle: 'API Rate Limiter Calculator - Generate Rate Limiting Configurations',
  seoDescription: 'Generate comprehensive API rate limiting configurations with multiple algorithms, monitoring setups, and deployment targets. Support for Redis, Nginx, Cloudflare, and AWS.',
  examples: [
    {
      title: 'API Rate Limiting',
      input: 'Configure rate limiting: 1000 requests per minute with token bucket algorithm',
      output: 'Generated rate limiting implementation with token bucket algorithm, monitoring setup, and deployment configurations'
    },
    {
      title: 'Nginx Rate Limiting',
      input: 'Generate Nginx config: 10 requests per second with burst of 20',
      output: 'Nginx configuration with rate limiting zones and burst handling'
    },
    {
      title: 'High-Traffic API',
      input: 'High-traffic API: 10000 requests per hour with sliding window',
      output: 'Sliding window implementation with distributed Redis support'
    }
  ],
  useCases: [
    'Protecting APIs from abuse and DoS attacks',
    'Implementing fair usage policies',
    'Managing server resource consumption',
    'Ensuring service availability during traffic spikes',
    'Compliance with rate limiting best practices'
  ],
  commonErrors: [
    'Rate limits too restrictive causing legitimate users to be blocked',
    'Inconsistent rate limiting across distributed systems',
    'Poor choice of algorithm for specific use case',
    'Missing proper error responses and retry headers'
  ],
  faq: [
    {
      question: 'Which rate limiting algorithm should I choose?',
      answer: 'Token bucket is best for APIs that need to handle bursts, leaky bucket for smooth traffic, fixed window for simplicity, sliding window for more accurate limiting, and sliding log for precise control.'
    },
    {
      question: 'How do I handle distributed rate limiting?',
      answer: 'Use Redis or similar distributed storage to maintain rate limit counters across multiple servers. The tool generates Redis Lua scripts for atomic operations.'
    },
    {
      question: 'What headers should I include in rate limited responses?',
      answer: 'Include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, and Retry-After headers to help clients implement proper backoff strategies.'
    },
    {
      question: 'How do I test my rate limiting implementation?',
      answer: 'Use the generated testing scenarios to validate normal traffic, burst handling, sustained overload, and recovery behavior.'
    },
    {
      question: 'What monitoring should I implement?',
      answer: 'Monitor rate limit hit rates, algorithm performance, request patterns, and set up alerts for unusual traffic or high hit rates.'
    }
  ],

  relatedTools: [
    'network-monitoring-tool',
    'api-request-builder',
    'webhook-testing-tool',
    'load-testing-tool',
    'api-documentation-generator'
  ]
};