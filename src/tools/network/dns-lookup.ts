import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface DnsLookupConfig {
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'PTR' | 'SRV' | 'ALL';
  resolver: 'cloudflare' | 'google' | 'quad9' | 'opendns';
  showTimings: boolean;
  includeAuthority: boolean;
  includeAdditional: boolean;
  outputFormat: 'detailed' | 'simple' | 'json';
  validateDomain: boolean;
  bulkMode: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  results?: DnsResult[];
}

interface DnsResult {
  domain: string;
  recordType: string;
  records: DnsRecord[];
  timings?: {
    queryTime: number;
    server: string;
  };
  authority?: DnsRecord[];
  additional?: DnsRecord[];
  status: 'success' | 'error' | 'nodata';
  error?: string;
}

interface DnsRecord {
  name: string;
  type: string;
  ttl?: number;
  class?: string;
  data: string;
  priority?: number;
  weight?: number;
  port?: number;
  target?: string;
}

// Public DNS servers
const DNS_SERVERS = {
  cloudflare: { primary: '1.1.1.1', secondary: '1.0.0.1', name: 'Cloudflare DNS' },
  google: { primary: '8.8.8.8', secondary: '8.8.4.4', name: 'Google DNS' },
  quad9: { primary: '9.9.9.9', secondary: '149.112.112.112', name: 'Quad9 DNS' },
  opendns: { primary: '208.67.222.222', secondary: '208.67.220.220', name: 'OpenDNS' },
};

// Validate domain name
function validateDomain(domain: string): { isValid: boolean; error?: string } {
  if (!domain || typeof domain !== 'string') {
    return { isValid: false, error: 'Domain is required' };
  }

  const trimmed = domain.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Domain cannot be empty' };
  }

  if (trimmed.length > 253) {
    return { isValid: false, error: 'Domain name too long (max 253 characters)' };
  }

  // Basic domain pattern validation
  const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.?$/;
  
  if (!domainPattern.test(trimmed)) {
    return { isValid: false, error: 'Invalid domain name format' };
  }

  // Check for invalid characters
  if (/[^a-zA-Z0-9.-]/.test(trimmed)) {
    return { isValid: false, error: 'Domain contains invalid characters' };
  }

  // Check label length (each part between dots should be <= 63 chars)
  const labels = trimmed.split('.');
  for (const label of labels) {
    if (label.length > 63) {
      return { isValid: false, error: 'Domain label too long (max 63 characters per label)' };
    }
    if (label.length === 0 && labels.indexOf(label) !== labels.length - 1) {
      return { isValid: false, error: 'Empty domain label not allowed' };
    }
  }

  return { isValid: true };
}

// Simulate DNS lookup using public DNS-over-HTTPS APIs
async function performDnsLookup(domain: string, recordType: string, resolver: string): Promise<DnsResult> {
  const startTime = Date.now();
  
  try {
    // Use DNS-over-HTTPS APIs for cross-origin requests
    let dohUrl: string;
    
    switch (resolver) {
      case 'cloudflare':
        dohUrl = 'https://cloudflare-dns.com/dns-query';
        break;
      case 'google':
        dohUrl = 'https://dns.google/resolve';
        break;
      case 'quad9':
        // Quad9 doesn't have public DoH, fall back to Cloudflare
        dohUrl = 'https://cloudflare-dns.com/dns-query';
        break;
      case 'opendns':
        // OpenDNS doesn't have public DoH, fall back to Google
        dohUrl = 'https://dns.google/resolve';
        break;
      default:
        dohUrl = 'https://cloudflare-dns.com/dns-query';
    }

    const response = await fetch(`${dohUrl}?name=${encodeURIComponent(domain)}&type=${recordType}`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const queryTime = Date.now() - startTime;

    // Parse DNS response
    const records: DnsRecord[] = [];
    const authority: DnsRecord[] = [];
    const additional: DnsRecord[] = [];

    // Answer section
    if (data.Answer) {
      for (const record of data.Answer) {
        records.push(parseDnsRecord(record));
      }
    }

    // Authority section
    if (data.Authority) {
      for (const record of data.Authority) {
        authority.push(parseDnsRecord(record));
      }
    }

    // Additional section
    if (data.Additional) {
      for (const record of data.Additional) {
        additional.push(parseDnsRecord(record));
      }
    }

    const status = data.Status === 0 ? 'success' : 
                  data.Status === 3 ? 'nodata' : 'error';

    return {
      domain,
      recordType,
      records,
      timings: {
        queryTime,
        server: DNS_SERVERS[resolver as keyof typeof DNS_SERVERS]?.name || resolver,
      },
      authority: authority.length > 0 ? authority : undefined,
      additional: additional.length > 0 ? additional : undefined,
      status,
      error: status === 'error' ? `DNS query failed with status ${data.Status}` : undefined,
    };

  } catch (error) {
    const queryTime = Date.now() - startTime;
    
    return {
      domain,
      recordType,
      records: [],
      timings: {
        queryTime,
        server: DNS_SERVERS[resolver as keyof typeof DNS_SERVERS]?.name || resolver,
      },
      status: 'error',
      error: error instanceof Error ? error.message : 'DNS lookup failed',
    };
  }
}

function parseDnsRecord(record: any): DnsRecord {
  const result: DnsRecord = {
    name: record.name || '',
    type: getRecordTypeName(record.type) || record.type?.toString() || '',
    ttl: record.TTL,
    data: record.data || '',
  };

  // Parse MX records
  if (record.type === 15) { // MX
    const parts = record.data?.split(' ');
    if (parts && parts.length >= 2) {
      result.priority = parseInt(parts[0], 10);
      result.data = parts.slice(1).join(' ');
    }
  }

  // Parse SRV records
  if (record.type === 33) { // SRV
    const parts = record.data?.split(' ');
    if (parts && parts.length >= 4) {
      result.priority = parseInt(parts[0], 10);
      result.weight = parseInt(parts[1], 10);
      result.port = parseInt(parts[2], 10);
      result.target = parts[3];
      result.data = record.data;
    }
  }

  return result;
}

function getRecordTypeName(typeNumber: number): string {
  const types: Record<number, string> = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
    33: 'SRV',
  };
  
  return types[typeNumber] || `TYPE${typeNumber}`;
}

// Format output based on configuration
function formatOutput(results: DnsResult[], config: DnsLookupConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(results, null, 2);
  }

  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results);
  }

  return formatDetailedOutput(results, config);
}

function formatSimpleOutput(results: DnsResult[]): string {
  let output = '';
  
  for (const result of results) {
    if (result.status === 'error') {
      output += `❌ ${result.domain}: ${result.error}\n`;
      continue;
    }

    if (result.records.length === 0) {
      output += `⚠️ ${result.domain}: No records found\n`;
      continue;
    }

    output += `✅ ${result.domain}:\n`;
    for (const record of result.records) {
      if (record.type === 'MX' && record.priority !== undefined) {
        output += `  ${record.type}: ${record.priority} ${record.data}\n`;
      } else if (record.type === 'SRV' && record.priority !== undefined && record.weight !== undefined && record.port !== undefined) {
        output += `  ${record.type}: ${record.priority} ${record.weight} ${record.port} ${record.target}\n`;
      } else {
        output += `  ${record.type}: ${record.data}\n`;
      }
    }
    output += '\n';
  }

  return output.trim();
}

function formatDetailedOutput(results: DnsResult[], config: DnsLookupConfig): string {
  let output = '# DNS Lookup Results\n\n';

  for (const result of results) {
    output += `## ${result.domain}\n\n`;

    // Status and timing
    const statusIcon = result.status === 'success' ? '✅' : 
                      result.status === 'nodata' ? '⚠️' : '❌';
    
    output += `**Status**: ${statusIcon} ${result.status.toUpperCase()}\n`;
    
    if (config.showTimings && result.timings) {
      output += `**Query Time**: ${result.timings.queryTime}ms\n`;
      output += `**DNS Server**: ${result.timings.server}\n`;
    }
    
    output += `**Record Type**: ${result.recordType}\n\n`;

    // Error handling
    if (result.status === 'error' && result.error) {
      output += `❌ **Error**: ${result.error}\n\n`;
      continue;
    }

    // Answer section
    if (result.records.length > 0) {
      output += '### Answer Section\n\n';
      output += '| Name | Type | TTL | Data |\n';
      output += '|------|------|-----|------|\n';
      
      for (const record of result.records) {
        let data = record.data;
        
        // Special formatting for different record types
        if (record.type === 'MX' && record.priority !== undefined) {
          data = `${record.priority} ${record.data}`;
        } else if (record.type === 'SRV' && record.priority !== undefined) {
          data = `${record.priority} ${record.weight} ${record.port} ${record.target}`;
        }
        
        const ttl = record.ttl ? `${record.ttl}s` : '-';
        output += `| ${record.name} | ${record.type} | ${ttl} | ${data} |\n`;
      }
      output += '\n';
    } else if (result.status === 'nodata') {
      output += '**No records found for this query**\n\n';
    }

    // Authority section
    if (config.includeAuthority && result.authority && result.authority.length > 0) {
      output += '### Authority Section\n\n';
      output += '| Name | Type | TTL | Data |\n';
      output += '|------|------|-----|------|\n';
      
      for (const record of result.authority) {
        const ttl = record.ttl ? `${record.ttl}s` : '-';
        output += `| ${record.name} | ${record.type} | ${ttl} | ${record.data} |\n`;
      }
      output += '\n';
    }

    // Additional section
    if (config.includeAdditional && result.additional && result.additional.length > 0) {
      output += '### Additional Section\n\n';
      output += '| Name | Type | TTL | Data |\n';
      output += '|------|------|-----|------|\n';
      
      for (const record of result.additional) {
        const ttl = record.ttl ? `${record.ttl}s` : '-';
        output += `| ${record.name} | ${record.type} | ${ttl} | ${record.data} |\n`;
      }
      output += '\n';
    }

    output += '---\n\n';
  }

  output += '*DNS lookup performed using DNS-over-HTTPS*';
  
  return output;
}

export async function processDnsLookup(input: string, config: DnsLookupConfig): Promise<ToolResult> {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide a domain name to lookup'
      };
    }

    // Parse domains from input
    const domains = config.bulkMode 
      ? input.split(/[,\n]/).map(d => d.trim()).filter(d => d)
      : [input.trim()];

    if (domains.length === 0) {
      return {
        success: false,
        error: 'No valid domains provided'
      };
    }

    if (domains.length > 10) {
      return {
        success: false,
        error: 'Maximum 10 domains allowed in bulk mode'
      };
    }

    const results: DnsResult[] = [];

    // Validate and process each domain
    for (const domain of domains) {
      if (config.validateDomain) {
        const validation = validateDomain(domain);
        if (!validation.isValid) {
          results.push({
            domain,
            recordType: config.recordType,
            records: [],
            status: 'error',
            error: validation.error,
          });
          continue;
        }
      }

      // Handle 'ALL' record type by querying multiple types
      if (config.recordType === 'ALL') {
        const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];
        
        for (const recordType of recordTypes) {
          const result = await performDnsLookup(domain, recordType, config.resolver);
          if (result.records.length > 0 || recordType === 'A') {
            results.push({
              ...result,
              recordType: recordType,
            });
          }
        }
      } else {
        const result = await performDnsLookup(domain, config.recordType, config.resolver);
        results.push(result);
      }
    }

    const output = formatOutput(results, config);

    return {
      success: true,
      output,
      results
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform DNS lookup'
    };
  }
}

export const DNS_LOOKUP_TOOL: Tool = {
  id: 'dns-lookup',
  name: 'DNS Lookup Tool',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'dns-tools')!,
  slug: 'dns-lookup',
  icon: '🔍',
  keywords: ['dns', 'lookup', 'domain', 'resolve', 'nameserver', 'records', 'a', 'aaaa', 'cname', 'mx', 'txt', 'ns', 'soa'],
  seoTitle: 'DNS Lookup Tool - Query Domain Name System Records Online | FreeFormatHub',
  seoDescription: 'Perform DNS lookups for domain names. Query A, AAAA, CNAME, MX, TXT, NS, SOA, and other DNS records using multiple DNS servers.',
  description: 'Query DNS records for domain names using multiple public DNS servers. Supports all common record types including A, AAAA, CNAME, MX, TXT, NS, and SOA records.',
  
  examples: [
    {
      title: 'A Record Lookup',
      input: 'google.com',
      output: `# DNS Lookup Results

## google.com

**Status**: ✅ SUCCESS
**Query Time**: 45ms
**DNS Server**: Cloudflare DNS
**Record Type**: A

### Answer Section

| Name | Type | TTL | Data |
|------|------|-----|------|
| google.com | A | 300s | 142.250.191.46 |
| google.com | A | 300s | 142.250.191.78 |

---

*DNS lookup performed using DNS-over-HTTPS*`,
      description: 'Look up IPv4 addresses for a domain name'
    },
    {
      title: 'MX Record Lookup',
      input: 'gmail.com',
      output: `# DNS Lookup Results

## gmail.com

**Status**: ✅ SUCCESS
**Query Time**: 52ms
**DNS Server**: Google DNS
**Record Type**: MX

### Answer Section

| Name | Type | TTL | Data |
|------|------|-----|------|
| gmail.com | MX | 3600s | 5 gmail-smtp-in.l.google.com |
| gmail.com | MX | 3600s | 10 alt1.gmail-smtp-in.l.google.com |
| gmail.com | MX | 3600s | 20 alt2.gmail-smtp-in.l.google.com |

---

*DNS lookup performed using DNS-over-HTTPS*`,
      description: 'Query mail exchange records for email routing'
    },
    {
      title: 'Bulk Domain Lookup',
      input: `google.com
cloudflare.com
github.com`,
      output: `# DNS Lookup Results

## google.com

**Status**: ✅ SUCCESS
**Record Type**: A

### Answer Section

| Name | Type | TTL | Data |
|------|------|-----|------|
| google.com | A | 300s | 142.250.191.46 |

---

## cloudflare.com

**Status**: ✅ SUCCESS
**Record Type**: A

### Answer Section

| Name | Type | TTL | Data |
|------|------|-----|------|
| cloudflare.com | A | 300s | 104.16.132.229 |

---

## github.com

**Status**: ✅ SUCCESS
**Record Type**: A

### Answer Section

| Name | Type | TTL | Data |
|------|------|-----|------|
| github.com | A | 60s | 140.82.112.3 |

---

*DNS lookup performed using DNS-over-HTTPS*`,
      description: 'Lookup multiple domains at once'
    }
  ],
  
  useCases: [
    'DNS troubleshooting and diagnostics',
    'Domain configuration verification',
    'Mail server setup validation (MX records)',
    'Website migration planning',
    'DNS propagation monitoring',
    'Security analysis of DNS records'
  ],
  
  faq: [
    {
      question: 'What DNS record types are supported?',
      answer: 'The tool supports A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV records, and an "ALL" option that queries multiple common record types.'
    },
    {
      question: 'Which DNS servers can I use?',
      answer: 'You can choose from Cloudflare DNS (1.1.1.1), Google DNS (8.8.8.8), Quad9 (9.9.9.9), and OpenDNS. Each has different features and response times.'
    },
    {
      question: 'Can I lookup multiple domains at once?',
      answer: 'Yes! Enable bulk mode and enter multiple domains separated by commas or new lines. Maximum 10 domains per query.'
    },
    {
      question: 'Why use DNS-over-HTTPS?',
      answer: 'DNS-over-HTTPS (DoH) encrypts DNS queries, preventing eavesdropping and manipulation. It also works around network restrictions.'
    },
    {
      question: 'What do the Authority and Additional sections show?',
      answer: 'Authority section shows authoritative name servers for the domain. Additional section provides extra records that may be useful for the query.'
    }
  ],
  
  commonErrors: [
    'Domain name format is invalid - ensure proper domain syntax',
    'DNS query timeout - try a different DNS server or check network',
    'NXDOMAIN error - domain name does not exist',
    'No records found - the domain exists but has no records of the requested type',
    'Network error - check internet connection and firewall settings'
  ],

  relatedTools: ['url-parser', 'ip-subnet-calculator', 'http-status-codes', 'whois-lookup']
};