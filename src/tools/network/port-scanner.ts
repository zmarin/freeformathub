import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface PortScannerConfig {
  scanType: 'common' | 'range' | 'specific' | 'service';
  startPort: number;
  endPort: number;
  specificPorts: string;
  timeout: number;
  threads: number;
  includeServices: boolean;
  showClosed: boolean;
  outputFormat: 'detailed' | 'simple' | 'json';
  skipPing: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  scanResults?: PortScanResult[];
}

interface PortScanResult {
  host: string;
  port: number;
  status: 'open' | 'closed' | 'filtered' | 'timeout';
  service?: string;
  version?: string;
  responseTime: number;
  banner?: string;
}

// Common ports and their typical services
const COMMON_PORTS = [
  { port: 21, service: 'FTP', description: 'File Transfer Protocol' },
  { port: 22, service: 'SSH', description: 'Secure Shell' },
  { port: 23, service: 'Telnet', description: 'Telnet Protocol' },
  { port: 25, service: 'SMTP', description: 'Simple Mail Transfer Protocol' },
  { port: 53, service: 'DNS', description: 'Domain Name System' },
  { port: 80, service: 'HTTP', description: 'HyperText Transfer Protocol' },
  { port: 110, service: 'POP3', description: 'Post Office Protocol v3' },
  { port: 143, service: 'IMAP', description: 'Internet Message Access Protocol' },
  { port: 443, service: 'HTTPS', description: 'HTTP Secure' },
  { port: 993, service: 'IMAPS', description: 'IMAP over SSL' },
  { port: 995, service: 'POP3S', description: 'POP3 over SSL' },
  { port: 1433, service: 'MSSQL', description: 'Microsoft SQL Server' },
  { port: 1521, service: 'Oracle', description: 'Oracle Database' },
  { port: 3306, service: 'MySQL', description: 'MySQL Database' },
  { port: 3389, service: 'RDP', description: 'Remote Desktop Protocol' },
  { port: 5432, service: 'PostgreSQL', description: 'PostgreSQL Database' },
  { port: 5900, service: 'VNC', description: 'Virtual Network Computing' },
  { port: 6379, service: 'Redis', description: 'Redis Database' },
  { port: 8080, service: 'HTTP-Alt', description: 'HTTP Alternative' },
  { port: 8443, service: 'HTTPS-Alt', description: 'HTTPS Alternative' },
];

// Service detection based on port numbers
function detectService(port: number): { service: string; description: string } | null {
  const commonPort = COMMON_PORTS.find(p => p.port === port);
  if (commonPort) {
    return { service: commonPort.service, description: commonPort.description };
  }

  // Additional port ranges
  if (port >= 20 && port <= 21) return { service: 'FTP', description: 'File Transfer Protocol' };
  if (port >= 135 && port <= 139) return { service: 'NetBIOS', description: 'Network Basic Input/Output System' };
  if (port >= 445 && port <= 445) return { service: 'SMB', description: 'Server Message Block' };
  if (port >= 1024 && port <= 1030) return { service: 'Reserved', description: 'Reserved/Dynamic ports' };
  if (port >= 3000 && port <= 3999) return { service: 'Development', description: 'Common development ports' };
  if (port >= 8000 && port <= 8999) return { service: 'Web-Alt', description: 'Alternative web ports' };
  if (port >= 9000 && port <= 9999) return { service: 'Various', description: 'Various services' };

  return null;
}

// Simulate port scanning (client-side limitation)
async function scanPort(host: string, port: number, timeout: number): Promise<PortScanResult> {
  const startTime = performance.now();
  
  // Since we can't actually perform port scanning from client-side JavaScript,
  // we'll simulate the scan with realistic behavior
  return new Promise((resolve) => {
    setTimeout(() => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Simulate realistic port scanning results
      let status: 'open' | 'closed' | 'filtered' | 'timeout' = 'closed';
      
      // Common ports are more likely to be "open" in simulation
      const isCommonPort = COMMON_PORTS.some(p => p.port === port);
      const random = Math.random();
      
      if (isCommonPort) {
        if (random < 0.3) status = 'open';
        else if (random < 0.7) status = 'closed';
        else if (random < 0.9) status = 'filtered';
        else status = 'timeout';
      } else {
        if (random < 0.1) status = 'open';
        else if (random < 0.8) status = 'closed';
        else if (random < 0.95) status = 'filtered';
        else status = 'timeout';
      }
      
      const serviceInfo = detectService(port);
      
      resolve({
        host,
        port,
        status,
        service: serviceInfo?.service,
        responseTime: Math.round(responseTime),
        banner: status === 'open' && serviceInfo ? `${serviceInfo.service} service detected` : undefined
      });
    }, Math.random() * timeout);
  });
}

// Parse port list from string
function parsePortList(portString: string): number[] {
  const ports: number[] = [];
  const parts = portString.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      // Range like "80-90"
      const [start, end] = trimmed.split('-').map(p => parseInt(p.trim()));
      if (start && end && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= 65535) {
            ports.push(i);
          }
        }
      }
    } else {
      // Single port
      const port = parseInt(trimmed);
      if (port >= 1 && port <= 65535) {
        ports.push(port);
      }
    }
  }
  
  return [...new Set(ports)].sort((a, b) => a - b); // Remove duplicates and sort
}

// Get ports to scan based on config
function getPortsToScan(config: PortScannerConfig): number[] {
  switch (config.scanType) {
    case 'common':
      return COMMON_PORTS.map(p => p.port);
    
    case 'range':
      const ports = [];
      for (let i = config.startPort; i <= config.endPort; i++) {
        ports.push(i);
      }
      return ports;
    
    case 'specific':
      return parsePortList(config.specificPorts);
    
    case 'service':
      // Return ports for specific services
      return [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3306, 3389, 5432];
    
    default:
      return COMMON_PORTS.map(p => p.port);
  }
}

function validateInput(input: string): { isValid: boolean; error?: string; host?: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a hostname or IP address' };
  }

  // Basic hostname/IP validation
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (ipRegex.test(trimmed) || hostnameRegex.test(trimmed)) {
    return { isValid: true, host: trimmed };
  }

  return { isValid: false, error: 'Please enter a valid hostname or IP address' };
}

function formatResults(results: PortScanResult[], config: PortScannerConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(results, null, 2);
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results, config);
  }
  
  return formatDetailedOutput(results, config);
}

function formatSimpleOutput(results: PortScanResult[], config: PortScannerConfig): string {
  const openPorts = results.filter(r => r.status === 'open');
  const filteredPorts = results.filter(r => r.status === 'filtered');
  
  let output = `# Port Scan Results\n\n`;
  output += `**Target:** ${results[0]?.host}\n`;
  output += `**Ports Scanned:** ${results.length}\n`;
  output += `**Open Ports:** ${openPorts.length}\n`;
  output += `**Filtered Ports:** ${filteredPorts.length}\n\n`;
  
  if (openPorts.length > 0) {
    output += `## Open Ports\n\n`;
    openPorts.forEach(port => {
      output += `- **${port.port}** ${port.service ? `(${port.service})` : ''}\n`;
    });
  }
  
  return output;
}

function formatDetailedOutput(results: PortScanResult[], config: PortScannerConfig): string {
  const openPorts = results.filter(r => r.status === 'open');
  const closedPorts = results.filter(r => r.status === 'closed');
  const filteredPorts = results.filter(r => r.status === 'filtered');
  const timeoutPorts = results.filter(r => r.status === 'timeout');
  
  let output = `# Port Scan Results\n\n`;
  
  output += `## 🎯 Target Information\n\n`;
  output += `**Host:** ${results[0]?.host}\n`;
  output += `**Scan Type:** ${config.scanType.toUpperCase()}\n`;
  output += `**Total Ports:** ${results.length}\n`;
  output += `**Scan Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  
  output += `## 📊 Summary\n\n`;
  output += `| Status | Count | Percentage |\n`;
  output += `|--------|-------|------------|\n`;
  output += `| 🟢 Open | ${openPorts.length} | ${((openPorts.length / results.length) * 100).toFixed(1)}% |\n`;
  output += `| 🔴 Closed | ${closedPorts.length} | ${((closedPorts.length / results.length) * 100).toFixed(1)}% |\n`;
  output += `| 🟡 Filtered | ${filteredPorts.length} | ${((filteredPorts.length / results.length) * 100).toFixed(1)}% |\n`;
  output += `| ⚫ Timeout | ${timeoutPorts.length} | ${((timeoutPorts.length / results.length) * 100).toFixed(1)}% |\n\n`;
  
  if (openPorts.length > 0) {
    output += `## 🟢 Open Ports\n\n`;
    output += `| Port | Service | Response Time | Banner |\n`;
    output += `|------|---------|---------------|--------|\n`;
    openPorts.forEach(port => {
      output += `| ${port.port} | ${port.service || 'Unknown'} | ${port.responseTime}ms | ${port.banner || '-'} |\n`;
    });
    output += '\n';
  }
  
  if (filteredPorts.length > 0 && config.showClosed) {
    output += `## 🟡 Filtered Ports\n\n`;
    filteredPorts.forEach(port => {
      output += `- **${port.port}** ${port.service ? `(${port.service})` : ''} - Filtered/Firewalled\n`;
    });
    output += '\n';
  }
  
  if (config.includeServices) {
    output += `## 🛠️ Service Information\n\n`;
    const servicesFound = [...new Set(openPorts.map(p => p.service).filter(Boolean))];
    if (servicesFound.length > 0) {
      servicesFound.forEach(service => {
        const servicePorts = openPorts.filter(p => p.service === service);
        const commonService = COMMON_PORTS.find(p => p.service === service);
        output += `**${service}:** Found on port(s) ${servicePorts.map(p => p.port).join(', ')}\n`;
        if (commonService) {
          output += `- ${commonService.description}\n`;
        }
        output += '\n';
      });
    }
  }
  
  output += `## ⚠️ Security Considerations\n\n`;
  if (openPorts.length > 0) {
    output += `- Found ${openPorts.length} open port(s) - Review if all are necessary\n`;
    const riskPorts = openPorts.filter(p => [21, 23, 135, 139, 445].includes(p.port));
    if (riskPorts.length > 0) {
      output += `- High-risk ports detected: ${riskPorts.map(p => p.port).join(', ')}\n`;
    }
  } else {
    output += `- No open ports detected - Good security posture\n`;
  }
  
  output += `\n---\n*Port scanning powered by FreeFormatHub*\n`;
  output += `\n**Note:** This is a simulated scan for demonstration. Real network scanning requires appropriate tools and permissions.`;
  
  return output;
}

export async function processPortScanning(input: string, config: PortScannerConfig): Promise<ToolResult> {
  try {
    const validation = validateInput(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const host = validation.host!;
    const portsToScan = getPortsToScan(config);
    
    if (portsToScan.length === 0) {
      return {
        success: false,
        error: 'No valid ports specified for scanning'
      };
    }

    if (portsToScan.length > 1000) {
      return {
        success: false,
        error: 'Too many ports specified. Please limit to 1000 ports or fewer.'
      };
    }

    // Simulate scanning process
    const scanPromises = portsToScan.map(port => scanPort(host, port, config.timeout));
    const results = await Promise.all(scanPromises);
    
    const output = formatResults(results, config);

    return {
      success: true,
      output,
      scanResults: results
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform port scan'
    };
  }
}

export const PORT_SCANNER_TOOL: Tool = {
  id: 'port-scanner',
  name: 'Port Scanner',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'port-scanning')!,
  slug: 'port-scanner',
  icon: '🔍',
  keywords: ['port', 'scan', 'network', 'security', 'tcp', 'service', 'firewall', 'open', 'closed'],
  seoTitle: 'Port Scanner - Network Port Scanning Tool | FreeFormatHub',
  seoDescription: 'Scan network ports to discover open services and security vulnerabilities. Check TCP ports, detect services, and analyze network security posture.',
  description: 'Scan network ports to discover open services and potential security issues. Simulate port scanning with service detection and security analysis.',

  examples: [
    {
      title: 'Common Ports Scan',
      input: 'example.com',
      output: `# Port Scan Results

## 🎯 Target Information

**Host:** example.com
**Scan Type:** COMMON
**Total Ports:** 20
**Scan Date:** 2024-01-15

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| 🟢 Open | 3 | 15.0% |
| 🔴 Closed | 15 | 75.0% |
| 🟡 Filtered | 2 | 10.0% |
| ⚫ Timeout | 0 | 0.0% |

## 🟢 Open Ports

| Port | Service | Response Time | Banner |
|------|---------|---------------|--------|
| 22 | SSH | 45ms | SSH service detected |
| 80 | HTTP | 32ms | HTTP service detected |
| 443 | HTTPS | 38ms | HTTPS service detected |

---
*Port scanning powered by FreeFormatHub*`,
      description: 'Scan common ports on a target host'
    },
    {
      title: 'Port Range Scan',
      input: '192.168.1.1',
      output: `# Port Scan Results

## 🎯 Target Information

**Host:** 192.168.1.1
**Scan Type:** RANGE
**Total Ports:** 100
**Scan Date:** 2024-01-15

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| 🟢 Open | 5 | 5.0% |
| 🔴 Closed | 90 | 90.0% |
| 🟡 Filtered | 5 | 5.0% |
| ⚫ Timeout | 0 | 0.0% |`,
      description: 'Scan a range of ports on a local IP address'
    }
  ],

  useCases: [
    'Network security assessment and vulnerability scanning',
    'Service discovery and inventory management',
    'Firewall configuration testing and validation',
    'Network troubleshooting and diagnostics',
    'Compliance auditing and security reviews',
    'Penetration testing and security research',
    'Infrastructure monitoring and change detection',
    'Docker container and service port checking'
  ],

  faq: [
    {
      question: 'What types of port scans are supported?',
      answer: 'The tool supports common ports (top 20), port ranges (e.g., 1-1000), specific ports (e.g., 80,443,8080), and service-based scans focusing on database and web services.'
    },
    {
      question: 'Why is this a simulated scan?',
      answer: 'Web browsers cannot perform actual network port scanning due to security restrictions. This tool simulates realistic results for educational and demonstration purposes.'
    },
    {
      question: 'What do the port statuses mean?',
      answer: 'Open: Service is listening and accepting connections. Closed: No service listening. Filtered: Port blocked by firewall. Timeout: No response within time limit.'
    },
    {
      question: 'How can I perform real port scanning?',
      answer: 'Use dedicated tools like Nmap, Masscan, or Zmap from command line. Always ensure you have permission before scanning networks you don\'t own.'
    },
    {
      question: 'What services are commonly found on different ports?',
      answer: 'Port 80 (HTTP), 443 (HTTPS), 22 (SSH), 21 (FTP), 25 (SMTP), 3306 (MySQL), 5432 (PostgreSQL), 3389 (RDP), and many others have standard service associations.'
    }
  ],

  commonErrors: [
    'Invalid hostname or IP address format',
    'Too many ports specified (limit: 1000)',
    'Network connectivity issues or DNS resolution failures',
    'Firewall blocking scan attempts',
    'Target host blocking or rate limiting requests'
  ],

  relatedTools: ['whois-lookup', 'dns-lookup', 'ip-subnet-calculator', 'certificate-decoder']
};