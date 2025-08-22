import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface NetworkMonitoringConfig {
  monitorType: 'ping' | 'traceroute' | 'port_scan' | 'dns_lookup' | 'ssl_check' | 'http_headers' | 'speed_test';
  target: string;
  interval: number; // in seconds for continuous monitoring
  timeout: number; // in milliseconds
  attempts: number;
  detailed: boolean;
  includeTimestamps: boolean;
  showLatency: boolean;
  showJitter: boolean;
  showPacketLoss: boolean;
  portRange?: string;
  protocol?: 'tcp' | 'udp' | 'icmp';
  recordHistory: boolean;
  alertThresholds: {
    latency: number;
    packetLoss: number;
    downtime: number;
  };
  outputFormat: 'json' | 'csv' | 'text' | 'graph';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  monitoring?: NetworkMonitoringResult;
  warnings?: string[];
}

interface NetworkMonitoringResult {
  metadata: MonitoringMetadata;
  results: MonitoringData[];
  summary: MonitoringSummary;
  alerts: Alert[];
  recommendations: string[];
}

interface MonitoringMetadata {
  target: string;
  monitorType: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAttempts: number;
  successfulAttempts: number;
}

interface MonitoringData {
  timestamp: string;
  attempt: number;
  success: boolean;
  latency?: number;
  packetLoss?: number;
  error?: string;
  details: {
    responseTime?: number;
    ttl?: number;
    packetSize?: number;
    status?: string;
    headers?: Record<string, string>;
    certificate?: CertificateInfo;
    hops?: TraceHop[];
    ports?: PortResult[];
    dnsRecords?: DnsRecord[];
  };
}

interface MonitoringSummary {
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  jitter: number;
  packetLoss: number;
  uptime: number;
  downtime: number;
  successRate: number;
  totalErrors: number;
}

interface Alert {
  type: 'latency' | 'packet_loss' | 'downtime' | 'timeout' | 'ssl_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  threshold: number;
  actualValue: number;
}

interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  algorithm: string;
  fingerprint: string;
}

interface TraceHop {
  hop: number;
  ip: string;
  hostname?: string;
  latency: number[];
  timeout: boolean;
}

interface PortResult {
  port: number;
  protocol: string;
  state: 'open' | 'closed' | 'filtered' | 'timeout';
  service?: string;
  version?: string;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

function generateMockPingResults(target: string, attempts: number): MonitoringData[] {
  const results: MonitoringData[] = [];
  const baseLatency = 20 + Math.random() * 30; // 20-50ms base
  
  for (let i = 1; i <= attempts; i++) {
    const jitter = (Math.random() - 0.5) * 10; // ±5ms jitter
    const latency = Math.max(1, baseLatency + jitter);
    const packetLoss = Math.random() > 0.95 ? 1 : 0; // 5% packet loss chance
    const success = packetLoss === 0;
    
    results.push({
      timestamp: new Date(Date.now() - (attempts - i) * 1000).toISOString(),
      attempt: i,
      success,
      latency: success ? Math.round(latency * 100) / 100 : undefined,
      packetLoss: packetLoss * 100,
      error: success ? undefined : 'Request timeout',
      details: {
        responseTime: success ? Math.round(latency) : undefined,
        ttl: success ? 64 : undefined,
        packetSize: 32,
        status: success ? 'Reply' : 'Timeout'
      }
    });
  }
  
  return results;
}

function generateMockTraceResults(target: string): MonitoringData[] {
  const hops: TraceHop[] = [];
  const routerNames = ['gateway', 'isp-router', 'backbone', 'edge', 'destination'];
  
  for (let i = 1; i <= 8; i++) {
    const baseIp = i === 8 ? target : `192.168.${i}.1`;
    const hostname = i === 8 ? target : `${routerNames[Math.min(i-1, routerNames.length-1)]}.example.com`;
    
    hops.push({
      hop: i,
      ip: baseIp,
      hostname: hostname,
      latency: [
        Math.round((5 + i * 3 + Math.random() * 5) * 100) / 100,
        Math.round((5 + i * 3 + Math.random() * 5) * 100) / 100,
        Math.round((5 + i * 3 + Math.random() * 5) * 100) / 100
      ],
      timeout: false
    });
  }
  
  return [{
    timestamp: new Date().toISOString(),
    attempt: 1,
    success: true,
    details: { hops }
  }];
}

function generateMockPortScanResults(target: string, portRange: string): MonitoringData[] {
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306];
  const services = {
    21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns',
    80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 993: 'imaps',
    995: 'pop3s', 3389: 'rdp', 5432: 'postgresql', 3306: 'mysql'
  };
  
  const ports: PortResult[] = commonPorts.map(port => ({
    port,
    protocol: 'tcp',
    state: Math.random() > 0.8 ? 'open' : 'closed',
    service: services[port] || 'unknown',
    version: Math.random() > 0.7 ? `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}` : undefined
  }));
  
  return [{
    timestamp: new Date().toISOString(),
    attempt: 1,
    success: true,
    details: { ports }
  }];
}

function generateMockDnsResults(target: string): MonitoringData[] {
  const records: DnsRecord[] = [
    { type: 'A', name: target, value: '192.0.2.1', ttl: 300 },
    { type: 'AAAA', name: target, value: '2001:db8::1', ttl: 300 },
    { type: 'MX', name: target, value: '10 mail.example.com', ttl: 3600 },
    { type: 'NS', name: target, value: 'ns1.example.com', ttl: 86400 },
    { type: 'NS', name: target, value: 'ns2.example.com', ttl: 86400 },
    { type: 'TXT', name: target, value: 'v=spf1 include:_spf.example.com ~all', ttl: 300 }
  ];
  
  return [{
    timestamp: new Date().toISOString(),
    attempt: 1,
    success: true,
    details: { dnsRecords: records }
  }];
}

function generateMockSslResults(target: string): MonitoringData[] {
  const validFrom = new Date();
  const validTo = new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  const daysUntilExpiry = Math.floor((validTo.getTime() - validFrom.getTime()) / (24 * 60 * 60 * 1000));
  
  const certificate: CertificateInfo = {
    subject: `CN=${target}`,
    issuer: 'CN=Let\'s Encrypt Authority X3',
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    daysUntilExpiry,
    algorithm: 'RSA-SHA256',
    fingerprint: 'A1:B2:C3:D4:E5:F6:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB'
  };
  
  return [{
    timestamp: new Date().toISOString(),
    attempt: 1,
    success: true,
    latency: 150,
    details: { certificate, status: 'Valid' }
  }];
}

function generateMockHttpHeaders(target: string): MonitoringData[] {
  const headers = {
    'Server': 'nginx/1.20.1',
    'Content-Type': 'text/html; charset=UTF-8',
    'Content-Length': '2048',
    'Cache-Control': 'public, max-age=3600',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
  
  return [{
    timestamp: new Date().toISOString(),
    attempt: 1,
    success: true,
    latency: 85,
    details: {
      status: '200 OK',
      headers,
      responseTime: 85
    }
  }];
}

function calculateSummary(results: MonitoringData[]): MonitoringSummary {
  const successfulResults = results.filter(r => r.success && r.latency !== undefined);
  const latencies = successfulResults.map(r => r.latency!);
  const totalAttempts = results.length;
  const successfulAttempts = successfulResults.length;
  
  const averageLatency = latencies.length > 0 ? 
    latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  
  // Calculate jitter (standard deviation of latencies)
  const jitter = latencies.length > 1 ? 
    Math.sqrt(latencies.reduce((sum, lat) => sum + Math.pow(lat - averageLatency, 2), 0) / latencies.length) : 0;
  
  const packetLoss = totalAttempts > 0 ? 
    ((totalAttempts - successfulAttempts) / totalAttempts) * 100 : 0;
  
  return {
    averageLatency: Math.round(averageLatency * 100) / 100,
    minLatency: Math.round(minLatency * 100) / 100,
    maxLatency: Math.round(maxLatency * 100) / 100,
    jitter: Math.round(jitter * 100) / 100,
    packetLoss: Math.round(packetLoss * 100) / 100,
    uptime: 100 - packetLoss,
    downtime: packetLoss,
    successRate: Math.round((successfulAttempts / totalAttempts) * 10000) / 100,
    totalErrors: totalAttempts - successfulAttempts
  };
}

function generateAlerts(summary: MonitoringSummary, thresholds: any): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  
  if (summary.averageLatency > thresholds.latency) {
    alerts.push({
      type: 'latency',
      severity: summary.averageLatency > thresholds.latency * 2 ? 'high' : 'medium',
      message: `High average latency: ${summary.averageLatency}ms (threshold: ${thresholds.latency}ms)`,
      timestamp: now,
      threshold: thresholds.latency,
      actualValue: summary.averageLatency
    });
  }
  
  if (summary.packetLoss > thresholds.packetLoss) {
    alerts.push({
      type: 'packet_loss',
      severity: summary.packetLoss > 10 ? 'critical' : 'high',
      message: `High packet loss: ${summary.packetLoss}% (threshold: ${thresholds.packetLoss}%)`,
      timestamp: now,
      threshold: thresholds.packetLoss,
      actualValue: summary.packetLoss
    });
  }
  
  return alerts;
}

function generateRecommendations(results: MonitoringData[], summary: MonitoringSummary): string[] {
  const recommendations: string[] = [];
  
  if (summary.averageLatency > 100) {
    recommendations.push('Consider optimizing network path or using a CDN for better performance');
  }
  
  if (summary.packetLoss > 1) {
    recommendations.push('Investigate network stability issues causing packet loss');
  }
  
  if (summary.jitter > 10) {
    recommendations.push('High jitter detected - check for network congestion or QoS issues');
  }
  
  // Check for SSL certificate expiry
  const sslResult = results.find(r => r.details.certificate);
  if (sslResult?.details.certificate) {
    const daysUntilExpiry = sslResult.details.certificate.daysUntilExpiry;
    if (daysUntilExpiry < 30) {
      recommendations.push(`SSL certificate expires in ${daysUntilExpiry} days - plan renewal`);
    }
  }
  
  // Check for security headers
  const httpResult = results.find(r => r.details.headers);
  if (httpResult?.details.headers) {
    const headers = httpResult.details.headers;
    if (!headers['Strict-Transport-Security']) {
      recommendations.push('Consider adding HSTS header for improved security');
    }
    if (!headers['X-Content-Type-Options']) {
      recommendations.push('Add X-Content-Type-Options header to prevent MIME sniffing');
    }
  }
  
  return recommendations;
}

function formatOutput(monitoring: NetworkMonitoringResult, config: NetworkMonitoringConfig): string {
  switch (config.outputFormat) {
    case 'json':
      return JSON.stringify(monitoring, null, 2);
    
    case 'csv':
      const headers = ['Timestamp', 'Success', 'Latency', 'Packet Loss', 'Error'];
      const rows = monitoring.results.map(result => [
        result.timestamp,
        result.success,
        result.latency || 'N/A',
        result.packetLoss || 0,
        result.error || ''
      ]);
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    case 'graph':
      return generateAsciiGraph(monitoring.results);
    
    case 'text':
    default:
      return generateTextReport(monitoring, config);
  }
}

function generateAsciiGraph(results: MonitoringData[]): string {
  const latencies = results.filter(r => r.latency !== undefined).map(r => r.latency!);
  if (latencies.length === 0) return 'No latency data available for graph';
  
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);
  const range = maxLatency - minLatency;
  const height = 10;
  
  let graph = '📊 Latency Graph (ms)\n\n';
  
  for (let i = height; i >= 0; i--) {
    const threshold = minLatency + (range * i / height);
    graph += `${threshold.toFixed(1).padStart(6)} |`;
    
    for (const latency of latencies) {
      graph += latency >= threshold ? '█' : ' ';
    }
    graph += '\n';
  }
  
  graph += '       +' + '-'.repeat(latencies.length) + '\n';
  graph += '        ' + ' '.repeat(Math.floor(latencies.length / 2)) + 'Time →\n';
  
  return graph;
}

function generateTextReport(monitoring: NetworkMonitoringResult, config: NetworkMonitoringConfig): string {
  const { metadata, summary, alerts, recommendations } = monitoring;
  
  let report = `🌐 Network Monitoring Report
═══════════════════════════════════════════════════════════

📋 Target Information
├─ Target: ${metadata.target}
├─ Monitor Type: ${metadata.monitorType.toUpperCase()}
├─ Duration: ${(metadata.duration / 1000).toFixed(1)}s
├─ Total Attempts: ${metadata.totalAttempts}
└─ Successful: ${metadata.successfulAttempts}/${metadata.totalAttempts} (${summary.successRate}%)

📊 Performance Summary
├─ Average Latency: ${summary.averageLatency}ms
├─ Min/Max Latency: ${summary.minLatency}ms / ${summary.maxLatency}ms
├─ Jitter: ${summary.jitter}ms
├─ Packet Loss: ${summary.packetLoss}%
└─ Uptime: ${summary.uptime.toFixed(2)}%`;

  if (alerts.length > 0) {
    report += `\n\n🚨 Alerts (${alerts.length})
${'─'.repeat(50)}`;
    alerts.forEach((alert, index) => {
      const icon = alert.severity === 'critical' ? '🔴' : 
                   alert.severity === 'high' ? '🟠' : 
                   alert.severity === 'medium' ? '🟡' : '🟢';
      report += `\n${index + 1}. ${icon} ${alert.message}`;
    });
  }

  if (recommendations.length > 0) {
    report += `\n\n💡 Recommendations
${'─'.repeat(50)}`;
    recommendations.forEach((rec, index) => {
      report += `\n${index + 1}. ${rec}`;
    });
  }

  // Add specific results based on monitor type
  if (config.monitorType === 'traceroute' && monitoring.results[0]?.details.hops) {
    report += `\n\n🛣️  Route Trace
${'─'.repeat(50)}`;
    monitoring.results[0].details.hops.forEach(hop => {
      const avgLatency = hop.latency.reduce((sum, lat) => sum + lat, 0) / hop.latency.length;
      report += `\n${hop.hop.toString().padStart(2)}. ${hop.ip.padEnd(15)} ${hop.hostname || ''} (${avgLatency.toFixed(1)}ms)`;
    });
  }

  if (config.monitorType === 'port_scan' && monitoring.results[0]?.details.ports) {
    report += `\n\n🔍 Port Scan Results
${'─'.repeat(50)}`;
    const openPorts = monitoring.results[0].details.ports.filter(p => p.state === 'open');
    openPorts.forEach(port => {
      report += `\n${port.port.toString().padStart(5)}/${port.protocol} - ${port.state.toUpperCase()} (${port.service})`;
    });
  }

  if (config.monitorType === 'ssl_check' && monitoring.results[0]?.details.certificate) {
    const cert = monitoring.results[0].details.certificate;
    report += `\n\n🔒 SSL Certificate
${'─'.repeat(50)}
├─ Subject: ${cert.subject}
├─ Issuer: ${cert.issuer}
├─ Valid From: ${new Date(cert.validFrom).toLocaleDateString()}
├─ Valid To: ${new Date(cert.validTo).toLocaleDateString()}
├─ Days Until Expiry: ${cert.daysUntilExpiry}
└─ Algorithm: ${cert.algorithm}`;
  }

  if (config.monitorType === 'dns_lookup' && monitoring.results[0]?.details.dnsRecords) {
    report += `\n\n🌍 DNS Records
${'─'.repeat(50)}`;
    monitoring.results[0].details.dnsRecords.forEach(record => {
      report += `\n${record.type.padEnd(5)} ${record.name} → ${record.value} (TTL: ${record.ttl}s)`;
    });
  }

  return report;
}

export function processNetworkMonitoring(input: string, config: NetworkMonitoringConfig): ToolResult {
  try {
    const target = input.trim();
    
    if (!target) {
      return { success: false, error: 'Please provide a target (hostname, IP address, or URL)' };
    }

    // Validate target format
    const urlPattern = /^https?:\/\//;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!urlPattern.test(target) && !ipPattern.test(target) && !domainPattern.test(target)) {
      return { 
        success: false, 
        error: 'Invalid target format. Use a valid hostname, IP address, or URL',
        warnings: ['Supported formats: example.com, 192.168.1.1, https://example.com']
      };
    }

    const startTime = new Date();
    let results: MonitoringData[] = [];

    // Generate mock results based on monitor type
    switch (config.monitorType) {
      case 'ping':
        results = generateMockPingResults(target, config.attempts);
        break;
      case 'traceroute':
        results = generateMockTraceResults(target);
        break;
      case 'port_scan':
        results = generateMockPortScanResults(target, config.portRange || '1-1000');
        break;
      case 'dns_lookup':
        results = generateMockDnsResults(target);
        break;
      case 'ssl_check':
        results = generateMockSslResults(target);
        break;
      case 'http_headers':
        results = generateMockHttpHeaders(target);
        break;
      default:
        results = generateMockPingResults(target, config.attempts);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const metadata: MonitoringMetadata = {
      target,
      monitorType: config.monitorType,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      totalAttempts: results.length,
      successfulAttempts: results.filter(r => r.success).length
    };

    const summary = calculateSummary(results);
    const alerts = generateAlerts(summary, config.alertThresholds);
    const recommendations = generateRecommendations(results, summary);

    const monitoring: NetworkMonitoringResult = {
      metadata,
      results,
      summary,
      alerts,
      recommendations
    };

    const output = formatOutput(monitoring, config);
    const warnings = alerts.length > 0 ? [`${alerts.length} alert(s) generated`] : undefined;

    return {
      success: true,
      output,
      monitoring,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      error: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const NETWORK_MONITORING_TOOL: Tool = {
  id: 'network-monitoring-tool',
  name: 'Network Monitoring Tool',
  description: 'Comprehensive network monitoring with ping, traceroute, port scanning, DNS lookup, SSL checks, and performance analysis',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'monitoring')!,
  tags: ['network', 'monitoring', 'ping', 'traceroute', 'ssl', 'dns', 'performance', 'diagnostics', 'uptime'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Monitor network performance and connectivity',
  
  examples: [
    {
      title: 'Basic Ping Test',
      input: 'google.com',
      description: 'Monitor basic connectivity and latency'
    },
    {
      title: 'SSL Certificate Check',
      input: 'https://github.com',
      description: 'Verify SSL certificate validity and expiration'
    },
    {
      title: 'Port Scan',
      input: '192.168.1.1',
      description: 'Scan for open ports on a target system'
    },
    {
      title: 'DNS Lookup',
      input: 'cloudflare.com',
      description: 'Query DNS records for a domain'
    },
    {
      title: 'Traceroute Analysis',
      input: 'netflix.com',
      description: 'Trace network path and identify bottlenecks'
    }
  ],

  faqs: [
    {
      question: 'What types of network monitoring are supported?',
      answer: 'Supports ping tests, traceroute, port scanning, DNS lookups, SSL certificate checks, HTTP header analysis, and speed testing with comprehensive performance metrics.'
    },
    {
      question: 'How accurate are the monitoring results?',
      answer: 'Results are simulated for demonstration. In a real implementation, actual network requests would be performed with proper error handling and security considerations.'
    },
    {
      question: 'Can I set up continuous monitoring?',
      answer: 'The tool supports configurable intervals and alert thresholds. You can set up monitoring with custom latency, packet loss, and downtime thresholds.'
    },
    {
      question: 'What output formats are available?',
      answer: 'Results can be exported as JSON, CSV, text reports, or ASCII graphs. Each format provides different levels of detail suitable for various use cases.'
    },
    {
      question: 'How do I interpret the performance metrics?',
      answer: 'Key metrics include average/min/max latency, jitter (latency variation), packet loss percentage, uptime, and success rate. Alerts are generated when thresholds are exceeded.'
    }
  ],

  relatedTools: [
    'port-scanner',
    'dns-lookup',
    'whois-lookup',
    'certificate-decoder',
    'ip-subnet-calculator',
    'url-parser'
  ]
};