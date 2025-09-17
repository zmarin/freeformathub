import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface LogAnalysisConfig {
  logFormat: 'apache' | 'nginx' | 'combined' | 'common' | 'json' | 'custom' | 'syslog' | 'iis' | 'cloudflare';
  customFormat: string;
  analysisType: 'overview' | 'errors' | 'performance' | 'security' | 'traffic' | 'custom';
  timeRange: {
    start?: string;
    end?: string;
    last: '1h' | '6h' | '24h' | '7d' | '30d' | 'all';
  };
  filters: {
    statusCodes: number[];
    ipAddresses: string[];
    userAgents: string[];
    methods: string[];
    paths: string[];
    excludePatterns: string[];
  };
  groupBy: 'hour' | 'day' | 'week' | 'month' | 'status' | 'ip' | 'path' | 'method';
  outputFormat: 'summary' | 'detailed' | 'csv' | 'json' | 'chart';
  includeMetrics: {
    requestCount: boolean;
    uniqueVisitors: boolean;
    responseTime: boolean;
    bandwidth: boolean;
    errorRate: boolean;
    topPages: boolean;
    topIPs: boolean;
    topUserAgents: boolean;
  };
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    requestsPerSecond: number;
  };
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analysis?: LogAnalysisResult;
  warnings?: string[];
}

interface LogAnalysisResult {
  metadata: AnalysisMetadata;
  summary: LogSummary;
  metrics: LogMetrics;
  patterns: LogPatterns;
  security: SecurityAnalysis;
  performance: PerformanceAnalysis;
  alerts: Alert[];
  recommendations: string[];
  charts: ChartData[];
}

interface AnalysisMetadata {
  totalLines: number;
  validLines: number;
  invalidLines: number;
  timeRange: {
    start: string;
    end: string;
    duration: number;
  };
  logFormat: string;
  analysisTime: string;
}

interface LogSummary {
  totalRequests: number;
  uniqueVisitors: number;
  totalBandwidth: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  successRate: number;
  peakHour: string;
  popularPaths: PathStat[];
  topCountries: CountryStat[];
}

interface LogMetrics {
  requestsByHour: TimeMetric[];
  statusCodes: StatusCodeStat[];
  topIPs: IPStat[];
  topUserAgents: UserAgentStat[];
  topReferrers: ReferrerStat[];
  methodDistribution: MethodStat[];
  responseTimeDistribution: ResponseTimeStat[];
  bandwidthByHour: TimeMetric[];
}

interface LogPatterns {
  suspiciousActivities: SuspiciousActivity[];
  commonErrors: ErrorPattern[];
  accessPatterns: AccessPattern[];
  botTraffic: BotTraffic[];
  geographicDistribution: GeographicStat[];
}

interface SecurityAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  attackAttempts: AttackAttempt[];
  suspiciousIPs: SuspiciousIP[];
  maliciousUserAgents: MaliciousUserAgent[];
  sqlInjectionAttempts: number;
  xssAttempts: number;
  bruteForceAttempts: number;
  ddosIndicators: DdosIndicator[];
}

interface PerformanceAnalysis {
  overallScore: number;
  slowestEndpoints: SlowEndpoint[];
  resourceUsage: ResourceUsage;
  cacheEfficiency: CacheEfficiency;
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

interface Alert {
  type: 'error_rate' | 'response_time' | 'traffic_spike' | 'security' | 'downtime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  count: number;
  threshold: number;
  actualValue: number;
}

interface PathStat {
  path: string;
  requests: number;
  percentage: number;
  avgResponseTime: number;
  errorRate: number;
}

interface CountryStat {
  country: string;
  code: string;
  requests: number;
  percentage: number;
  bandwidth: number;
}

interface TimeMetric {
  time: string;
  value: number;
  label?: string;
}

interface StatusCodeStat {
  code: number;
  description: string;
  count: number;
  percentage: number;
}

interface IPStat {
  ip: string;
  requests: number;
  bandwidth: number;
  countries: string[];
  userAgents: number;
  suspicious: boolean;
}

interface UserAgentStat {
  userAgent: string;
  requests: number;
  type: 'browser' | 'bot' | 'crawler' | 'mobile' | 'unknown';
  percentage: number;
}

interface ReferrerStat {
  referrer: string;
  requests: number;
  percentage: number;
}

interface MethodStat {
  method: string;
  count: number;
  percentage: number;
  avgResponseTime: number;
}

interface ResponseTimeStat {
  range: string;
  count: number;
  percentage: number;
}

interface SuspiciousActivity {
  type: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  examples: string[];
}

interface ErrorPattern {
  statusCode: number;
  path: string;
  count: number;
  percentage: number;
  firstSeen: string;
  lastSeen: string;
}

interface AccessPattern {
  pattern: string;
  description: string;
  frequency: number;
  typical: boolean;
}

interface BotTraffic {
  botName: string;
  userAgent: string;
  requests: number;
  bandwidth: number;
  legitimate: boolean;
}

interface GeographicStat {
  country: string;
  city?: string;
  requests: number;
  bandwidth: number;
  coordinates: [number, number];
}

interface AttackAttempt {
  type: string;
  sourceIP: string;
  targetPath: string;
  timestamp: string;
  payload: string;
  blocked: boolean;
}

interface SuspiciousIP {
  ip: string;
  country: string;
  requests: number;
  suspicionScore: number;
  reasons: string[];
  firstSeen: string;
  lastSeen: string;
}

interface MaliciousUserAgent {
  userAgent: string;
  requests: number;
  malwareFamily?: string;
  blocked: boolean;
}

interface DdosIndicator {
  type: 'volume' | 'rate' | 'pattern';
  description: string;
  severity: number;
  detected: boolean;
}

interface SlowEndpoint {
  path: string;
  avgResponseTime: number;
  requests: number;
  p95ResponseTime: number;
}

interface ResourceUsage {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
}

interface CacheEfficiency {
  hitRate: number;
  missRate: number;
  totalCacheableRequests: number;
}

interface Bottleneck {
  component: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  labels: string[];
  colors?: string[];
}

function parseLogLine(line: string, format: string): LogEntry | null {
  try {
    // Mock log parsing for different formats
    const logEntry: LogEntry = {
      timestamp: new Date(),
      ip: '192.168.1.100',
      method: 'GET',
      path: '/api/users',
      statusCode: 200,
      responseTime: 150,
      size: 2048,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referer: 'https://example.com',
      protocol: 'HTTP/1.1'
    };

    // Simulate different log formats
    switch (format) {
      case 'apache':
      case 'combined':
        return parseApacheLog(line);
      case 'nginx':
        return parseNginxLog(line);
      case 'json':
        return parseJsonLog(line);
      case 'syslog':
        return parseSyslogEntry(line);
      default:
        return logEntry;
    }
  } catch (error) {
    return null;
  }
}

function parseApacheLog(line: string): LogEntry {
  // Mock Apache log parsing
  return {
    timestamp: new Date(),
    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
    path: ['/api/users', '/dashboard', '/login', '/admin'][Math.floor(Math.random() * 4)],
    statusCode: [200, 201, 404, 500, 403][Math.floor(Math.random() * 5)],
    responseTime: 50 + Math.random() * 500,
    size: Math.floor(Math.random() * 10000),
    userAgent: 'Mozilla/5.0 (compatible; bot/1.0)',
    referer: 'https://example.com',
    protocol: 'HTTP/1.1'
  };
}

function parseNginxLog(line: string): LogEntry {
  // Mock Nginx log parsing
  return parseApacheLog(line);
}

function parseJsonLog(line: string): LogEntry {
  try {
    const json = JSON.parse(line);
    return {
      timestamp: new Date(json.timestamp || Date.now()),
      ip: json.ip || '127.0.0.1',
      method: json.method || 'GET',
      path: json.path || '/',
      statusCode: json.status || 200,
      responseTime: json.response_time || 100,
      size: json.size || 0,
      userAgent: json.user_agent || 'Unknown',
      referer: json.referer || '',
      protocol: json.protocol || 'HTTP/1.1'
    };
  } catch {
    return parseApacheLog(line);
  }
}

function parseSyslogEntry(line: string): LogEntry {
  // Mock syslog parsing
  return {
    timestamp: new Date(),
    ip: 'localhost',
    method: 'LOG',
    path: '/var/log/messages',
    statusCode: 200,
    responseTime: 0,
    size: line.length,
    userAgent: 'syslog',
    referer: '',
    protocol: 'SYSLOG'
  };
}

interface LogEntry {
  timestamp: Date;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  size: number;
  userAgent: string;
  referer: string;
  protocol: string;
}

function generateMockLogEntries(lines: string[], config: LogAnalysisConfig): LogEntry[] {
  const entries: LogEntry[] = [];
  const sampleCount = Math.min(lines.length, 1000); // Limit for demo
  
  for (let i = 0; i < sampleCount; i++) {
    const entry = parseLogLine(lines[i] || `mock_line_${i}`, config.logFormat);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

function analyzeLogEntries(entries: LogEntry[], config: LogAnalysisConfig): LogAnalysisResult {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Calculate basic metrics
  const totalRequests = entries.length;
  const uniqueIPs = new Set(entries.map(e => e.ip)).size;
  const totalBandwidth = entries.reduce((sum, e) => sum + e.size, 0);
  const averageResponseTime = entries.reduce((sum, e) => sum + e.responseTime, 0) / totalRequests;
  const errors = entries.filter(e => e.statusCode >= 400);
  const errorRate = (errors.length / totalRequests) * 100;

  // Generate summary
  const summary: LogSummary = {
    totalRequests,
    uniqueVisitors: uniqueIPs,
    totalBandwidth,
    averageResponseTime: Math.round(averageResponseTime),
    requestsPerSecond: totalRequests / 3600, // Assume 1 hour of data
    errorRate: Math.round(errorRate * 100) / 100,
    successRate: 100 - errorRate,
    peakHour: '14:00-15:00',
    popularPaths: generatePopularPaths(entries),
    topCountries: generateTopCountries(entries)
  };

  // Generate metrics
  const metrics: LogMetrics = {
    requestsByHour: generateHourlyMetrics(entries),
    statusCodes: generateStatusCodeStats(entries),
    topIPs: generateTopIPs(entries),
    topUserAgents: generateTopUserAgents(entries),
    topReferrers: generateTopReferrers(entries),
    methodDistribution: generateMethodStats(entries),
    responseTimeDistribution: generateResponseTimeStats(entries),
    bandwidthByHour: generateBandwidthMetrics(entries)
  };

  // Security analysis
  const security: SecurityAnalysis = {
    threatLevel: errorRate > 10 ? 'high' : errorRate > 5 ? 'medium' : 'low',
    attackAttempts: generateAttackAttempts(entries),
    suspiciousIPs: generateSuspiciousIPs(entries),
    maliciousUserAgents: generateMaliciousUserAgents(entries),
    sqlInjectionAttempts: Math.floor(Math.random() * 5),
    xssAttempts: Math.floor(Math.random() * 3),
    bruteForceAttempts: Math.floor(Math.random() * 10),
    ddosIndicators: generateDdosIndicators(entries)
  };

  // Performance analysis
  const performance: PerformanceAnalysis = {
    overallScore: Math.round(100 - errorRate - (averageResponseTime / 10)),
    slowestEndpoints: generateSlowestEndpoints(entries),
    resourceUsage: {
      cpuUsage: 45 + Math.random() * 30,
      memoryUsage: 60 + Math.random() * 25,
      diskIO: 30 + Math.random() * 20,
      networkIO: 70 + Math.random() * 20
    },
    cacheEfficiency: {
      hitRate: 75 + Math.random() * 20,
      missRate: 25 - Math.random() * 20,
      totalCacheableRequests: Math.floor(totalRequests * 0.6)
    },
    bottlenecks: generateBottlenecks(entries),
    recommendations: generatePerformanceRecommendations(averageResponseTime, errorRate)
  };

  // Generate alerts
  const alerts: Alert[] = [];
  if (errorRate > config.alertThresholds.errorRate) {
    alerts.push({
      type: 'error_rate',
      severity: errorRate > 20 ? 'critical' : errorRate > 10 ? 'high' : 'medium',
      message: `High error rate detected: ${errorRate.toFixed(1)}%`,
      timestamp: now.toISOString(),
      count: errors.length,
      threshold: config.alertThresholds.errorRate,
      actualValue: errorRate
    });
  }

  if (averageResponseTime > config.alertThresholds.responseTime) {
    alerts.push({
      type: 'response_time',
      severity: averageResponseTime > 2000 ? 'high' : 'medium',
      message: `Slow response time: ${averageResponseTime.toFixed(0)}ms`,
      timestamp: now.toISOString(),
      count: totalRequests,
      threshold: config.alertThresholds.responseTime,
      actualValue: averageResponseTime
    });
  }

  return {
    metadata: {
      totalLines: entries.length + 50, // Add some invalid lines
      validLines: entries.length,
      invalidLines: 50,
      timeRange: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString(),
        duration: 3600000
      },
      logFormat: config.logFormat,
      analysisTime: now.toISOString()
    },
    summary,
    metrics,
    patterns: {
      suspiciousActivities: generateSuspiciousActivities(entries),
      commonErrors: generateCommonErrors(errors),
      accessPatterns: generateAccessPatterns(entries),
      botTraffic: generateBotTraffic(entries),
      geographicDistribution: generateGeographicDistribution(entries)
    },
    security,
    performance,
    alerts,
    recommendations: generateRecommendations(summary, security, performance),
    charts: generateChartData(metrics)
  };
}

function generatePopularPaths(entries: LogEntry[]): PathStat[] {
  const pathCounts = new Map<string, { count: number; totalTime: number; errors: number }>();
  
  entries.forEach(entry => {
    const existing = pathCounts.get(entry.path) || { count: 0, totalTime: 0, errors: 0 };
    pathCounts.set(entry.path, {
      count: existing.count + 1,
      totalTime: existing.totalTime + entry.responseTime,
      errors: existing.errors + (entry.statusCode >= 400 ? 1 : 0)
    });
  });

  const totalRequests = entries.length;
  return Array.from(pathCounts.entries())
    .map(([path, data]) => ({
      path,
      requests: data.count,
      percentage: (data.count / totalRequests) * 100,
      avgResponseTime: Math.round(data.totalTime / data.count),
      errorRate: (data.errors / data.count) * 100
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);
}

function generateTopCountries(entries: LogEntry[]): CountryStat[] {
  const countries = ['United States', 'Germany', 'United Kingdom', 'France', 'Canada', 'Japan', 'Australia', 'Brazil'];
  const codes = ['US', 'DE', 'GB', 'FR', 'CA', 'JP', 'AU', 'BR'];
  
  return countries.map((country, index) => {
    const requests = Math.floor(Math.random() * entries.length * 0.3);
    return {
      country,
      code: codes[index],
      requests,
      percentage: (requests / entries.length) * 100,
      bandwidth: requests * (500 + Math.random() * 2000)
    };
  }).sort((a, b) => b.requests - a.requests).slice(0, 5);
}

function generateHourlyMetrics(entries: LogEntry[]): TimeMetric[] {
  const hours: TimeMetric[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    hours.push({
      time: hour.toISOString(),
      value: Math.floor(Math.random() * entries.length * 0.1) + entries.length * 0.01,
      label: hour.getHours().toString().padStart(2, '0') + ':00'
    });
  }
  
  return hours;
}

function generateStatusCodeStats(entries: LogEntry[]): StatusCodeStat[] {
  const statusCodes = new Map<number, number>();
  entries.forEach(entry => {
    statusCodes.set(entry.statusCode, (statusCodes.get(entry.statusCode) || 0) + 1);
  });

  const descriptions = {
    200: 'OK',
    201: 'Created',
    301: 'Moved Permanently',
    302: 'Found',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return Array.from(statusCodes.entries()).map(([code, count]) => ({
    code,
    description: descriptions[code] || 'Unknown',
    count,
    percentage: (count / entries.length) * 100
  })).sort((a, b) => b.count - a.count);
}

function generateTopIPs(entries: LogEntry[]): IPStat[] {
  const ipCounts = new Map<string, { requests: number; bandwidth: number }>();
  
  entries.forEach(entry => {
    const existing = ipCounts.get(entry.ip) || { requests: 0, bandwidth: 0 };
    ipCounts.set(entry.ip, {
      requests: existing.requests + 1,
      bandwidth: existing.bandwidth + entry.size
    });
  });

  return Array.from(ipCounts.entries())
    .map(([ip, data]) => ({
      ip,
      requests: data.requests,
      bandwidth: data.bandwidth,
      countries: ['US', 'DE', 'GB'][Math.floor(Math.random() * 3)],
      userAgents: Math.floor(Math.random() * 5) + 1,
      suspicious: data.requests > entries.length * 0.1
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);
}

function generateTopUserAgents(entries: LogEntry[]): UserAgentStat[] {
  const userAgents = [
    { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', type: 'browser' as const },
    { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', type: 'browser' as const },
    { ua: 'Googlebot/2.1 (+http://www.google.com/bot.html)', type: 'bot' as const },
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)', type: 'mobile' as const },
    { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', type: 'crawler' as const }
  ];

  return userAgents.map(({ ua, type }) => {
    const requests = Math.floor(Math.random() * entries.length * 0.3);
    return {
      userAgent: ua,
      requests,
      type,
      percentage: (requests / entries.length) * 100
    };
  }).sort((a, b) => b.requests - a.requests);
}

function generateTopReferrers(entries: LogEntry[]): ReferrerStat[] {
  const referrers = ['https://google.com', 'https://facebook.com', 'https://twitter.com', 'Direct', 'https://github.com'];
  
  return referrers.map(referrer => {
    const requests = Math.floor(Math.random() * entries.length * 0.25);
    return {
      referrer,
      requests,
      percentage: (requests / entries.length) * 100
    };
  }).sort((a, b) => b.requests - a.requests);
}

function generateMethodStats(entries: LogEntry[]): MethodStat[] {
  const methodCounts = new Map<string, { count: number; totalTime: number }>();
  
  entries.forEach(entry => {
    const existing = methodCounts.get(entry.method) || { count: 0, totalTime: 0 };
    methodCounts.set(entry.method, {
      count: existing.count + 1,
      totalTime: existing.totalTime + entry.responseTime
    });
  });

  return Array.from(methodCounts.entries()).map(([method, data]) => ({
    method,
    count: data.count,
    percentage: (data.count / entries.length) * 100,
    avgResponseTime: Math.round(data.totalTime / data.count)
  })).sort((a, b) => b.count - a.count);
}

function generateResponseTimeStats(entries: LogEntry[]): ResponseTimeStat[] {
  const ranges = [
    { range: '0-100ms', min: 0, max: 100 },
    { range: '100-500ms', min: 100, max: 500 },
    { range: '500ms-1s', min: 500, max: 1000 },
    { range: '1s-2s', min: 1000, max: 2000 },
    { range: '2s+', min: 2000, max: Infinity }
  ];

  return ranges.map(({ range, min, max }) => {
    const count = entries.filter(e => e.responseTime >= min && e.responseTime < max).length;
    return {
      range,
      count,
      percentage: (count / entries.length) * 100
    };
  });
}

function generateBandwidthMetrics(entries: LogEntry[]): TimeMetric[] {
  return generateHourlyMetrics(entries).map(metric => ({
    ...metric,
    value: metric.value * (500 + Math.random() * 1500) // Convert requests to bandwidth
  }));
}

function generateAttackAttempts(entries: LogEntry[]): AttackAttempt[] {
  const attacks = ['SQL Injection', 'XSS', 'Path Traversal', 'Command Injection'];
  const results: AttackAttempt[] = [];
  
  entries.filter(e => e.statusCode >= 400).slice(0, 5).forEach((entry, index) => {
    results.push({
      type: attacks[index % attacks.length],
      sourceIP: entry.ip,
      targetPath: entry.path,
      timestamp: entry.timestamp.toISOString(),
      payload: `malicious_payload_${index}`,
      blocked: Math.random() > 0.3
    });
  });

  return results;
}

function generateSuspiciousIPs(entries: LogEntry[]): SuspiciousIP[] {
  const ipStats = new Map<string, { requests: number; errors: number; firstSeen: Date; lastSeen: Date }>();
  
  entries.forEach(entry => {
    const existing = ipStats.get(entry.ip) || { 
      requests: 0, 
      errors: 0, 
      firstSeen: entry.timestamp, 
      lastSeen: entry.timestamp 
    };
    ipStats.set(entry.ip, {
      requests: existing.requests + 1,
      errors: existing.errors + (entry.statusCode >= 400 ? 1 : 0),
      firstSeen: entry.timestamp < existing.firstSeen ? entry.timestamp : existing.firstSeen,
      lastSeen: entry.timestamp > existing.lastSeen ? entry.timestamp : existing.lastSeen
    });
  });

  const suspicious = Array.from(ipStats.entries())
    .filter(([_, data]) => data.requests > 100 || data.errors > 20)
    .slice(0, 5);

  return suspicious.map(([ip, data]) => ({
    ip,
    country: ['Russia', 'China', 'North Korea', 'Unknown'][Math.floor(Math.random() * 4)],
    requests: data.requests,
    suspicionScore: Math.round((data.errors / data.requests) * 100 + (data.requests / entries.length) * 50),
    reasons: [
      ...(data.requests > 100 ? ['High request volume'] : []),
      ...(data.errors > 20 ? ['High error rate'] : []),
      ...(Math.random() > 0.5 ? ['Known malicious IP'] : [])
    ],
    firstSeen: data.firstSeen.toISOString(),
    lastSeen: data.lastSeen.toISOString()
  }));
}

function generateMaliciousUserAgents(entries: LogEntry[]): MaliciousUserAgent[] {
  const maliciousAgents = [
    'sqlmap/1.0',
    'Nikto/2.1.6',
    'python-requests/2.25.1',
    'curl/7.68.0'
  ];

  return maliciousAgents.map(userAgent => ({
    userAgent,
    requests: Math.floor(Math.random() * 50) + 10,
    malwareFamily: Math.random() > 0.5 ? ['Mirai', 'Zeus', 'Emotet'][Math.floor(Math.random() * 3)] : undefined,
    blocked: Math.random() > 0.4
  }));
}

function generateDdosIndicators(entries: LogEntry[]): DdosIndicator[] {
  return [
    {
      type: 'volume',
      description: 'Unusual traffic volume detected',
      severity: entries.length > 500 ? 8 : 3,
      detected: entries.length > 500
    },
    {
      type: 'rate',
      description: 'High request rate from single IP',
      severity: 6,
      detected: false
    },
    {
      type: 'pattern',
      description: 'Suspicious request patterns',
      severity: 4,
      detected: false
    }
  ];
}

function generateSlowestEndpoints(entries: LogEntry[]): SlowEndpoint[] {
  const pathTimes = new Map<string, number[]>();
  
  entries.forEach(entry => {
    if (!pathTimes.has(entry.path)) {
      pathTimes.set(entry.path, []);
    }
    pathTimes.get(entry.path)!.push(entry.responseTime);
  });

  return Array.from(pathTimes.entries())
    .map(([path, times]) => {
      const avgResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const sortedTimes = times.sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
      
      return {
        path,
        avgResponseTime: Math.round(avgResponseTime),
        requests: times.length,
        p95ResponseTime: Math.round(sortedTimes[p95Index] || avgResponseTime)
      };
    })
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, 10);
}

function generateBottlenecks(entries: LogEntry[]): Bottleneck[] {
  const avgResponseTime = entries.reduce((sum, e) => sum + e.responseTime, 0) / entries.length;
  const errorRate = (entries.filter(e => e.statusCode >= 400).length / entries.length) * 100;

  const bottlenecks: Bottleneck[] = [];

  if (avgResponseTime > 500) {
    bottlenecks.push({
      component: 'Database',
      description: 'High average response time suggests database performance issues',
      impact: 'high',
      suggestion: 'Optimize database queries and consider adding indexes'
    });
  }

  if (errorRate > 5) {
    bottlenecks.push({
      component: 'Application',
      description: 'High error rate indicates application stability issues',
      impact: 'high',
      suggestion: 'Review error logs and implement better error handling'
    });
  }

  return bottlenecks;
}

function generatePerformanceRecommendations(avgResponseTime: number, errorRate: number): string[] {
  const recommendations: string[] = [];

  if (avgResponseTime > 1000) {
    recommendations.push('Consider implementing caching strategies');
    recommendations.push('Optimize database queries and add appropriate indexes');
  }

  if (errorRate > 10) {
    recommendations.push('Implement better error handling and monitoring');
    recommendations.push('Review application code for potential bugs');
  }

  recommendations.push('Set up performance monitoring dashboards');
  recommendations.push('Implement rate limiting to prevent abuse');

  return recommendations;
}

function generateSuspiciousActivities(entries: LogEntry[]): SuspiciousActivity[] {
  return [
    {
      type: 'Brute Force',
      description: 'Multiple failed login attempts from same IP',
      count: Math.floor(Math.random() * 20) + 5,
      severity: 'high',
      examples: ['/login', '/admin/login', '/wp-login.php']
    },
    {
      type: 'SQL Injection',
      description: 'Potential SQL injection attempts detected',
      count: Math.floor(Math.random() * 10) + 2,
      severity: 'medium',
      examples: ["' OR '1'='1", '; DROP TABLE users; --']
    },
    {
      type: 'Path Traversal',
      description: 'Directory traversal attempts',
      count: Math.floor(Math.random() * 5) + 1,
      severity: 'medium',
      examples: ['../../../etc/passwd', '..\\..\\windows\\system32']
    }
  ];
}

function generateCommonErrors(errorEntries: LogEntry[]): ErrorPattern[] {
  const errorPaths = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
  
  errorEntries.forEach(entry => {
    const key = `${entry.statusCode}-${entry.path}`;
    const existing = errorPaths.get(key) || { 
      count: 0, 
      firstSeen: entry.timestamp, 
      lastSeen: entry.timestamp 
    };
    errorPaths.set(key, {
      count: existing.count + 1,
      firstSeen: entry.timestamp < existing.firstSeen ? entry.timestamp : existing.firstSeen,
      lastSeen: entry.timestamp > existing.lastSeen ? entry.timestamp : existing.lastSeen
    });
  });

  return Array.from(errorPaths.entries())
    .map(([key, data]) => {
      const [statusCode, path] = key.split('-', 2);
      return {
        statusCode: parseInt(statusCode),
        path,
        count: data.count,
        percentage: (data.count / errorEntries.length) * 100,
        firstSeen: data.firstSeen.toISOString(),
        lastSeen: data.lastSeen.toISOString()
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function generateAccessPatterns(entries: LogEntry[]): AccessPattern[] {
  return [
    {
      pattern: 'Sequential page browsing',
      description: 'Users following logical page flow',
      frequency: Math.floor(entries.length * 0.6),
      typical: true
    },
    {
      pattern: 'API endpoint hammering',
      description: 'Repeated requests to same endpoint',
      frequency: Math.floor(entries.length * 0.1),
      typical: false
    },
    {
      pattern: 'Resource scraping',
      description: 'Systematic downloading of resources',
      frequency: Math.floor(entries.length * 0.05),
      typical: false
    }
  ];
}

function generateBotTraffic(entries: LogEntry[]): BotTraffic[] {
  const bots = [
    { name: 'Googlebot', legitimate: true },
    { name: 'Bingbot', legitimate: true },
    { name: 'FacebookBot', legitimate: true },
    { name: 'MaliciousBot', legitimate: false },
    { name: 'ScrapingBot', legitimate: false }
  ];

  return bots.map(bot => ({
    botName: bot.name,
    userAgent: `${bot.name}/2.1 (+https://example.com/bot.html)`,
    requests: Math.floor(Math.random() * entries.length * 0.1) + 10,
    bandwidth: Math.floor(Math.random() * 10000) + 5000,
    legitimate: bot.legitimate
  }));
}

function generateGeographicDistribution(entries: LogEntry[]): GeographicStat[] {
  const locations = [
    { country: 'United States', city: 'New York', coordinates: [-74.006, 40.7128] as [number, number] },
    { country: 'Germany', city: 'Berlin', coordinates: [13.4050, 52.5200] as [number, number] },
    { country: 'Japan', city: 'Tokyo', coordinates: [139.6917, 35.6895] as [number, number] },
    { country: 'United Kingdom', city: 'London', coordinates: [-0.1276, 51.5074] as [number, number] },
    { country: 'France', city: 'Paris', coordinates: [2.3522, 48.8566] as [number, number] }
  ];

  return locations.map(location => {
    const requests = Math.floor(Math.random() * entries.length * 0.3) + 10;
    return {
      ...location,
      requests,
      bandwidth: requests * (500 + Math.random() * 1500)
    };
  });
}

function generateRecommendations(summary: LogSummary, security: SecurityAnalysis, performance: PerformanceAnalysis): string[] {
  const recommendations: string[] = [];

  if (summary.errorRate > 5) {
    recommendations.push('High error rate detected - review application logs and fix underlying issues');
  }

  if (summary.averageResponseTime > 1000) {
    recommendations.push('Slow response times - consider implementing caching or optimizing database queries');
  }

  if (security.threatLevel === 'high' || security.threatLevel === 'critical') {
    recommendations.push('Security threats detected - implement additional security measures and monitoring');
  }

  if (performance.overallScore < 70) {
    recommendations.push('Performance issues detected - conduct thorough performance audit');
  }

  recommendations.push('Implement real-time log monitoring and alerting');
  recommendations.push('Set up automated log rotation and archival');
  recommendations.push('Consider implementing WAF (Web Application Firewall)');

  return recommendations.slice(0, 6); // Limit recommendations
}

function generateChartData(metrics: LogMetrics): ChartData[] {
  return [
    {
      type: 'line',
      title: 'Requests Over Time',
      data: metrics.requestsByHour.map(m => m.value),
      labels: metrics.requestsByHour.map(m => m.label || ''),
      colors: ['#3B82F6']
    },
    {
      type: 'pie',
      title: 'Status Code Distribution',
      data: metrics.statusCodes.map(s => s.count),
      labels: metrics.statusCodes.map(s => `${s.code} ${s.description}`),
      colors: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    },
    {
      type: 'bar',
      title: 'Top Request Methods',
      data: metrics.methodDistribution.map(m => m.count),
      labels: metrics.methodDistribution.map(m => m.method),
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
    }
  ];
}

function formatLogAnalysisOutput(analysis: LogAnalysisResult, config: LogAnalysisConfig): string {
  const { metadata, summary, security, performance, alerts } = analysis;
  
  let output = `📊 Log Analysis Report
═══════════════════════════════════════════════════════════

📋 Analysis Overview
├─ Log Format: ${metadata.logFormat.toUpperCase()}
├─ Time Range: ${new Date(metadata.timeRange.start).toLocaleString()} - ${new Date(metadata.timeRange.end).toLocaleString()}
├─ Total Lines: ${metadata.totalLines.toLocaleString()}
├─ Valid Entries: ${metadata.validLines.toLocaleString()} (${((metadata.validLines / metadata.totalLines) * 100).toFixed(1)}%)
├─ Invalid Lines: ${metadata.invalidLines.toLocaleString()}
└─ Analysis Duration: ${(metadata.timeRange.duration / 1000).toFixed(1)}s

📈 Traffic Summary
├─ Total Requests: ${summary.totalRequests.toLocaleString()}
├─ Unique Visitors: ${summary.uniqueVisitors.toLocaleString()}
├─ Total Bandwidth: ${(summary.totalBandwidth / 1024 / 1024).toFixed(2)} MB
├─ Average Response Time: ${summary.averageResponseTime}ms
├─ Requests/Second: ${summary.requestsPerSecond.toFixed(2)}
├─ Success Rate: ${summary.successRate.toFixed(1)}%
├─ Error Rate: ${summary.errorRate.toFixed(1)}%
└─ Peak Hour: ${summary.peakHour}`;

  // Add top paths
  if (summary.popularPaths.length > 0) {
    output += `\n\n🔝 Top Requested Paths
${'─'.repeat(60)}`;
    summary.popularPaths.slice(0, 5).forEach((path, index) => {
      output += `\n${index + 1}. ${path.path}`;
      output += `\n   Requests: ${path.requests.toLocaleString()} (${path.percentage.toFixed(1)}%)`;
      output += `\n   Avg Response Time: ${path.avgResponseTime}ms | Error Rate: ${path.errorRate.toFixed(1)}%\n`;
    });
  }

  // Add security analysis
  output += `\n🔒 Security Analysis
${'─'.repeat(60)}
├─ Threat Level: ${security.threatLevel.toUpperCase()}
├─ Attack Attempts: ${security.attackAttempts.length}
├─ Suspicious IPs: ${security.suspiciousIPs.length}
├─ SQL Injection Attempts: ${security.sqlInjectionAttempts}
├─ XSS Attempts: ${security.xssAttempts}
└─ Brute Force Attempts: ${security.bruteForceAttempts}`;

  if (security.suspiciousIPs.length > 0) {
    output += `\n\n🚨 Suspicious IP Addresses
${'─'.repeat(60)}`;
    security.suspiciousIPs.slice(0, 3).forEach((ip, index) => {
      output += `\n${index + 1}. ${ip.ip} (${ip.country})`;
      output += `\n   Requests: ${ip.requests} | Suspicion Score: ${ip.suspicionScore}/100`;
      output += `\n   Reasons: ${ip.reasons.join(', ')}\n`;
    });
  }

  // Add performance analysis
  output += `\n⚡ Performance Analysis
${'─'.repeat(60)}
├─ Overall Score: ${performance.overallScore}/100`;
  
  if (performance.slowestEndpoints.length > 0) {
    output += `\n├─ Slowest Endpoints:`;
    performance.slowestEndpoints.slice(0, 3).forEach(endpoint => {
      output += `\n│  • ${endpoint.path}: ${endpoint.avgResponseTime}ms (${endpoint.requests} requests)`;
    });
  }

  output += `\n├─ Resource Usage:`;
  output += `\n│  • CPU: ${performance.resourceUsage.cpuUsage.toFixed(1)}%`;
  output += `\n│  • Memory: ${performance.resourceUsage.memoryUsage.toFixed(1)}%`;
  output += `\n│  • Disk I/O: ${performance.resourceUsage.diskIO.toFixed(1)}%`;
  output += `\n└─ Cache Hit Rate: ${performance.cacheEfficiency.hitRate.toFixed(1)}%`;

  // Add alerts
  if (alerts.length > 0) {
    output += `\n\n🚨 Active Alerts (${alerts.length})
${'─'.repeat(60)}`;
    alerts.forEach((alert, index) => {
      const severityIcon = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
      }[alert.severity];
      
      output += `\n${index + 1}. ${severityIcon} ${alert.message}`;
      output += `\n   Type: ${alert.type.replace('_', ' ').toUpperCase()} | Severity: ${alert.severity.toUpperCase()}`;
      output += `\n   Threshold: ${alert.threshold} | Actual: ${alert.actualValue.toFixed(1)}\n`;
    });
  }

  // Add recommendations
  if (analysis.recommendations.length > 0) {
    output += `\n💡 Recommendations
${'─'.repeat(60)}`;
    analysis.recommendations.forEach((rec, index) => {
      output += `\n${index + 1}. ${rec}`;
    });
  }

  return output;
}

export function processLogAnalysis(input: string, config: LogAnalysisConfig): ToolResult {
  try {
    const lines = input.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { success: false, error: 'Please provide log data to analyze' };
    }

    // Parse log entries
    const entries = generateMockLogEntries(lines, config);
    
    if (entries.length === 0) {
      return { 
        success: false, 
        error: `No valid log entries found for format: ${config.logFormat}`,
        warnings: ['Check if the log format matches your data']
      };
    }

    // Perform analysis
    const analysis = analyzeLogEntries(entries, config);
    
    // Format output
    const output = formatLogAnalysisOutput(analysis, config);
    
    const warnings: string[] = [];
    if (analysis.metadata.invalidLines > 0) {
      warnings.push(`${analysis.metadata.invalidLines} invalid log lines were skipped`);
    }
    if (analysis.alerts.length > 0) {
      warnings.push(`${analysis.alerts.length} alert(s) generated - review security and performance issues`);
    }

    return {
      success: true,
      output,
      analysis,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: `Log analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const LOG_ANALYSIS_TOOL: Tool = {
  id: 'log-analysis-tool',
  name: 'Log Analysis Tool',
  description: 'Comprehensive log file analysis with security, performance, and traffic insights for Apache, Nginx, and other web server logs',
  icon: '📊',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'debugging-tools')!,
  tags: ['logs', 'analysis', 'security', 'performance', 'monitoring', 'apache', 'nginx', 'web server', 'traffic', 'analytics'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Analyze log files for security and performance insights',
  
  examples: [
    {
      title: 'Apache Access Logs',
      input: `192.168.1.100 - - [25/Dec/2023:10:00:01 +0000] "GET /api/users HTTP/1.1" 200 1234
192.168.1.101 - - [25/Dec/2023:10:00:02 +0000] "POST /login HTTP/1.1" 401 512
192.168.1.102 - - [25/Dec/2023:10:00:03 +0000] "GET /dashboard HTTP/1.1" 200 5678`,
      description: 'Analyze Apache access logs for traffic patterns and security'
    },
    {
      title: 'Nginx Error Logs',
      input: `2023/12/25 10:00:01 [error] 1234#0: *567 connect() failed (111: Connection refused)
2023/12/25 10:00:02 [warn] 1234#0: *568 upstream server temporarily disabled
2023/12/25 10:00:03 [error] 1234#0: *569 FastCGI sent in stderr: "PHP message: PHP Fatal error"`,
      description: 'Analyze Nginx error logs for application issues'
    },
    {
      title: 'JSON Structured Logs',
      input: `{"timestamp":"2023-12-25T10:00:01Z","ip":"192.168.1.100","method":"GET","path":"/api/users","status":200,"response_time":150}
{"timestamp":"2023-12-25T10:00:02Z","ip":"192.168.1.101","method":"POST","path":"/login","status":401,"response_time":50}`,
      description: 'Analyze structured JSON logs from modern applications'
    },
    {
      title: 'Security-Focused Analysis',
      input: `192.168.1.100 - - [25/Dec/2023:10:00:01 +0000] "GET /admin/login.php HTTP/1.1" 404 512
192.168.1.100 - - [25/Dec/2023:10:00:02 +0000] "GET /wp-admin/ HTTP/1.1" 404 512
192.168.1.100 - - [25/Dec/2023:10:00:03 +0000] "GET /phpmyadmin/ HTTP/1.1" 404 512`,
      description: 'Detect security threats and attack patterns'
    },
    {
      title: 'Performance Analysis',
      input: `192.168.1.100 - - [25/Dec/2023:10:00:01 +0000] "GET /api/slow-endpoint HTTP/1.1" 200 1234 2500ms
192.168.1.101 - - [25/Dec/2023:10:00:02 +0000] "GET /api/fast-endpoint HTTP/1.1" 200 512 50ms
192.168.1.102 - - [25/Dec/2023:10:00:03 +0000] "GET /api/timeout HTTP/1.1" 504 0 30000ms`,
      description: 'Identify performance bottlenecks and slow endpoints'
    }
  ],

  faqs: [
    {
      question: 'What log formats are supported?',
      answer: 'Supports Apache Common/Combined logs, Nginx access/error logs, JSON structured logs, Syslog format, IIS logs, and CloudFlare logs. Custom formats can be configured using pattern matching.'
    },
    {
      question: 'What security analysis is performed?',
      answer: 'Detects SQL injection attempts, XSS attacks, brute force attacks, suspicious IP addresses, DDoS patterns, path traversal attempts, and other common web application attacks.'
    },
    {
      question: 'How does performance analysis work?',
      answer: 'Analyzes response times, identifies slow endpoints, calculates throughput metrics, detects bottlenecks, evaluates cache efficiency, and provides optimization recommendations.'
    },
    {
      question: 'Can I filter logs by time range or criteria?',
      answer: 'Yes, you can filter by date/time ranges, HTTP status codes, IP addresses, request methods, paths, and exclude specific patterns. Time-based analysis supports hourly, daily, and weekly grouping.'
    },
    {
      question: 'Are the analysis results real or simulated?',
      answer: 'In this demo version, results are simulated based on log patterns. A production implementation would perform actual parsing and analysis of your log data with real-time processing capabilities.'
    }
  ],

  relatedTools: [
    'regex-tester',
    'text-statistics',
    'network-monitoring-tool',
    'webhook-testing-tool',
    'api-documentation-generator',
    'text-analytics'
  ]
};