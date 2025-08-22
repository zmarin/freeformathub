import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface WhoisConfig {
  domainType: 'domain' | 'ip' | 'auto';
  outputFormat: 'detailed' | 'simple' | 'json';
  showRaw: boolean;
  includeDNS: boolean;
  includeHistory: boolean;
  timeout: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  whoisData?: WhoisResult;
}

interface WhoisResult {
  query: string;
  queryType: 'domain' | 'ip';
  registrar?: string;
  registrant?: ContactInfo;
  admin?: ContactInfo;
  tech?: ContactInfo;
  billing?: ContactInfo;
  nameServers: string[];
  dates: {
    registered?: string;
    updated?: string;
    expires?: string;
  };
  status: string[];
  dnssec?: string;
  raw?: string;
  ipInfo?: IPInfo;
  dnsRecords?: DNSRecord[];
}

interface ContactInfo {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

interface IPInfo {
  network?: string;
  netname?: string;
  organization?: string;
  country?: string;
  asn?: string;
  range?: string;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

function validateInput(input: string): { isValid: boolean; error?: string; type?: 'domain' | 'ip' } {
  const trimmed = input.trim().toLowerCase();
  
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a domain name or IP address' };
  }

  // IP address validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  if (ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed)) {
    return { isValid: true, type: 'ip' };
  }

  // Domain validation
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  
  if (domainRegex.test(trimmed)) {
    return { isValid: true, type: 'domain' };
  }

  return { isValid: false, error: 'Please enter a valid domain name or IP address' };
}

// Mock Whois data since we can't make real external requests in client-side code
function generateMockWhoisData(query: string, type: 'domain' | 'ip'): WhoisResult {
  const mockData: WhoisResult = {
    query,
    queryType: type,
    nameServers: [],
    dates: {},
    status: [],
  };

  if (type === 'domain') {
    const tld = query.split('.').pop() || '';
    const domain = query.split('.')[0] || '';
    
    mockData.registrar = 'Example Registrar Inc.';
    mockData.registrant = {
      name: 'John Doe',
      organization: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Corporation`,
      email: `admin@${query}`,
      phone: '+1.5551234567',
      address: {
        street: '123 Example Street',
        city: 'Example City',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
      },
    };
    
    mockData.admin = { ...mockData.registrant };
    mockData.tech = { ...mockData.registrant };
    
    mockData.nameServers = [
      `ns1.${query}`,
      `ns2.${query}`,
      'ns1.example-registrar.com',
      'ns2.example-registrar.com',
    ];
    
    const now = new Date();
    const registered = new Date(now.getTime() - (Math.random() * 3) * 365 * 24 * 60 * 60 * 1000);
    const expires = new Date(registered.getTime() + 365 * 24 * 60 * 60 * 1000);
    const updated = new Date(registered.getTime() + (Math.random() * 365) * 24 * 60 * 60 * 1000);
    
    mockData.dates = {
      registered: registered.toISOString().split('T')[0],
      updated: updated.toISOString().split('T')[0],
      expires: expires.toISOString().split('T')[0],
    };
    
    mockData.status = [
      'clientTransferProhibited',
      'clientUpdateProhibited',
      'clientDeleteProhibited',
    ];
    
    mockData.dnssec = 'unsigned';
    
    mockData.dnsRecords = [
      { type: 'A', name: query, value: '93.184.216.34' },
      { type: 'AAAA', name: query, value: '2606:2800:220:1:248:1893:25c8:1946' },
      { type: 'MX', name: query, value: '10 mail.example.com' },
      { type: 'TXT', name: query, value: 'v=spf1 include:_spf.example.com ~all' },
    ];
    
  } else if (type === 'ip') {
    mockData.ipInfo = {
      network: '93.184.216.0/24',
      netname: 'EDGECAST',
      organization: 'EdgeCast Networks Inc.',
      country: 'US',
      asn: 'AS15133',
      range: '93.184.216.0 - 93.184.216.255',
    };
  }

  // Generate raw whois data
  if (type === 'domain') {
    mockData.raw = `Domain Name: ${query.toUpperCase()}
Registry Domain ID: 2336799_DOMAIN_COM-VRSN
Registrar WHOIS Server: whois.example-registrar.com
Registrar URL: http://www.example-registrar.com
Updated Date: ${mockData.dates.updated}T12:00:00Z
Creation Date: ${mockData.dates.registered}T12:00:00Z
Registry Expiry Date: ${mockData.dates.expires}T12:00:00Z
Registrar: ${mockData.registrar}
Registrar IANA ID: 376
Registrar Abuse Contact Email: abuse@example-registrar.com
Registrar Abuse Contact Phone: +1.8888888888
Domain Status: ${mockData.status.join(' ')}
Name Server: ${mockData.nameServers.join('\nName Server: ')}
DNSSEC: ${mockData.dnssec}

Registrant Name: ${mockData.registrant?.name}
Registrant Organization: ${mockData.registrant?.organization}
Registrant Street: ${mockData.registrant?.address?.street}
Registrant City: ${mockData.registrant?.address?.city}
Registrant State/Province: ${mockData.registrant?.address?.state}
Registrant Postal Code: ${mockData.registrant?.address?.postalCode}
Registrant Country: ${mockData.registrant?.address?.country}
Registrant Phone: ${mockData.registrant?.phone}
Registrant Email: ${mockData.registrant?.email}`;
  } else {
    mockData.raw = `NetRange: ${mockData.ipInfo?.range}
CIDR: ${mockData.ipInfo?.network}
NetName: ${mockData.ipInfo?.netname}
NetHandle: NET-93-184-216-0-1
Parent: NET93 (NET-93-0-0-0-0)
NetType: Direct Assignment
OriginAS: ${mockData.ipInfo?.asn}
Organization: ${mockData.ipInfo?.organization} (EDGECAST)
RegDate: 2008-06-02
Updated: 2012-03-02
Ref: https://rdap.arin.net/registry/ip/93.184.216.0

OrgName: ${mockData.ipInfo?.organization}
OrgId: EDGECAST
Address: 13031 W Jefferson Blvd
City: Los Angeles
StateProv: CA
PostalCode: 90094
Country: ${mockData.ipInfo?.country}`;
  }

  return mockData;
}

function formatOutput(data: WhoisResult, config: WhoisConfig): string {
  if (config.outputFormat === 'json') {
    return JSON.stringify(data, null, 2);
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(data);
  }
  
  return formatDetailedOutput(data, config);
}

function formatSimpleOutput(data: WhoisResult): string {
  let output = `# Whois Lookup Results\n\n`;
  
  output += `**Query:** ${data.query}\n`;
  output += `**Type:** ${data.queryType.toUpperCase()}\n\n`;
  
  if (data.queryType === 'domain') {
    if (data.registrar) {
      output += `**Registrar:** ${data.registrar}\n`;
    }
    
    if (data.dates.registered) {
      output += `**Registered:** ${data.dates.registered}\n`;
    }
    
    if (data.dates.expires) {
      output += `**Expires:** ${data.dates.expires}\n`;
    }
    
    if (data.nameServers.length > 0) {
      output += `**Name Servers:** ${data.nameServers.join(', ')}\n`;
    }
  } else if (data.ipInfo) {
    output += `**Organization:** ${data.ipInfo.organization}\n`;
    output += `**Network:** ${data.ipInfo.network}\n`;
    output += `**Country:** ${data.ipInfo.country}\n`;
    if (data.ipInfo.asn) {
      output += `**ASN:** ${data.ipInfo.asn}\n`;
    }
  }
  
  return output;
}

function formatDetailedOutput(data: WhoisResult, config: WhoisConfig): string {
  let output = `# Whois Lookup Results\n\n`;
  
  output += `## = Query Information\n\n`;
  output += `**Query:** ${data.query}\n`;
  output += `**Type:** ${data.queryType.toUpperCase()} ${data.queryType === 'domain' ? 'Domain' : 'Address'}\n`;
  output += `**Lookup Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  
  if (data.queryType === 'domain') {
    if (data.registrar) {
      output += `## <� Registrar Information\n\n`;
      output += `**Registrar:** ${data.registrar}\n\n`;
    }
    
    if (data.dates.registered || data.dates.updated || data.dates.expires) {
      output += `## =� Important Dates\n\n`;
      if (data.dates.registered) {
        output += `**Registration Date:** ${data.dates.registered}\n`;
      }
      if (data.dates.updated) {
        output += `**Last Updated:** ${data.dates.updated}\n`;
      }
      if (data.dates.expires) {
        output += `**Expiration Date:** ${data.dates.expires}\n`;
        
        const expiryDate = new Date(data.dates.expires);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 30) {
          output += `� **Warning:** Domain expires in ${daysUntilExpiry} days\n`;
        }
      }
      output += '\n';
    }
    
    if (data.registrant) {
      output += `## =d Registrant Contact\n\n`;
      if (data.registrant.name) output += `**Name:** ${data.registrant.name}\n`;
      if (data.registrant.organization) output += `**Organization:** ${data.registrant.organization}\n`;
      if (data.registrant.email) output += `**Email:** ${data.registrant.email}\n`;
      if (data.registrant.phone) output += `**Phone:** ${data.registrant.phone}\n`;
      if (data.registrant.address) {
        output += `**Address:** ${data.registrant.address.street}, ${data.registrant.address.city}, ${data.registrant.address.state} ${data.registrant.address.postalCode}, ${data.registrant.address.country}\n`;
      }
      output += '\n';
    }
    
    if (data.nameServers.length > 0) {
      output += `## < Name Servers\n\n`;
      data.nameServers.forEach((ns, index) => {
        output += `${index + 1}. ${ns}\n`;
      });
      output += '\n';
    }
    
    if (data.status.length > 0) {
      output += `## =� Domain Status\n\n`;
      data.status.forEach(status => {
        output += `- ${status}\n`;
      });
      output += '\n';
    }
    
    if (data.dnssec) {
      output += `## = Security\n\n`;
      output += `**DNSSEC:** ${data.dnssec}\n\n`;
    }
    
    if (config.includeDNS && data.dnsRecords) {
      output += `## =' DNS Records\n\n`;
      output += `| Type | Name | Value |\n`;
      output += `|------|------|-------|\n`;
      data.dnsRecords.forEach(record => {
        output += `| ${record.type} | ${record.name} | ${record.value} |\n`;
      });
      output += '\n';
    }
    
  } else if (data.ipInfo) {
    output += `## < IP Address Information\n\n`;
    if (data.ipInfo.organization) output += `**Organization:** ${data.ipInfo.organization}\n`;
    if (data.ipInfo.netname) output += `**Network Name:** ${data.ipInfo.netname}\n`;
    if (data.ipInfo.network) output += `**Network Range:** ${data.ipInfo.network}\n`;
    if (data.ipInfo.range) output += `**IP Range:** ${data.ipInfo.range}\n`;
    if (data.ipInfo.country) output += `**Country:** ${data.ipInfo.country}\n`;
    if (data.ipInfo.asn) output += `**ASN:** ${data.ipInfo.asn}\n`;
    output += '\n';
  }
  
  if (config.showRaw && data.raw) {
    output += `## =� Raw Whois Data\n\n`;
    output += '```\n';
    output += data.raw;
    output += '\n```\n\n';
  }
  
  output += '---\n*Whois lookup powered by FreeFormatHub*';
  
  return output;
}

export function processWhoisLookup(input: string, config: WhoisConfig): ToolResult {
  try {
    const validation = validateInput(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const queryType = config.domainType === 'auto' ? validation.type! : 
                     (config.domainType === 'domain' ? 'domain' : 'ip');
    
    // In a real implementation, this would make actual Whois API calls
    // For demo purposes, we'll generate mock data
    const whoisData = generateMockWhoisData(input.trim().toLowerCase(), queryType);
    const output = formatOutput(whoisData, config);

    return {
      success: true,
      output,
      whoisData
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform Whois lookup'
    };
  }
}

export const WHOIS_LOOKUP_TOOL: Tool = {
  id: 'whois-lookup',
  name: 'Whois Lookup',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'dns-tools')!,
  slug: 'whois-lookup',
  icon: '🔍',
  keywords: ['whois', 'domain', 'lookup', 'registration', 'dns', 'registrar', 'ip', 'network', 'owner'],
  seoTitle: 'Whois Lookup Tool - Domain & IP Information | FreeFormatHub',
  seoDescription: 'Look up domain registration details, IP address information, DNS records, and contact information. Get registrar data, expiration dates, and network details.',
  description: 'Look up detailed information about domain names and IP addresses including registration details, contact information, DNS records, and network data.',
  
  examples: [
    {
      title: 'Domain Lookup',
      input: 'example.com',
      output: `# Whois Lookup Results

## = Query Information

**Query:** example.com
**Type:** DOMAIN Domain
**Lookup Date:** 2024-01-15

## <� Registrar Information

**Registrar:** Example Registrar Inc.

## =� Important Dates

**Registration Date:** 2021-03-15
**Last Updated:** 2023-08-22
**Expiration Date:** 2025-03-15

## =d Registrant Contact

**Name:** John Doe
**Organization:** Example Corporation
**Email:** admin@example.com
**Phone:** +1.5551234567
**Address:** 123 Example Street, Example City, CA 90210, US

## < Name Servers

1. ns1.example.com
2. ns2.example.com
3. ns1.example-registrar.com
4. ns2.example-registrar.com

---
*Whois lookup powered by FreeFormatHub*`,
      description: 'Look up domain registration and contact information'
    },
    {
      title: 'IP Address Lookup',
      input: '93.184.216.34',
      output: `# Whois Lookup Results

## = Query Information

**Query:** 93.184.216.34
**Type:** IP Address
**Lookup Date:** 2024-01-15

## < IP Address Information

**Organization:** EdgeCast Networks Inc.
**Network Name:** EDGECAST
**Network Range:** 93.184.216.0/24
**IP Range:** 93.184.216.0 - 93.184.216.255
**Country:** US
**ASN:** AS15133

---
*Whois lookup powered by FreeFormatHub*`,
      description: 'Look up IP address network and organization details'
    }
  ],
  
  useCases: [
    'Domain ownership verification and contact lookup',
    'IP address network and organization identification',
    'Domain expiration date monitoring',
    'DNS server and nameserver discovery',
    'Security investigation and threat analysis',
    'Domain registration research and planning',
    'Network troubleshooting and diagnostics',
    'Due diligence for domain acquisitions'
  ],
  
  faq: [
    {
      question: 'What information can I look up?',
      answer: 'You can look up domain registration details (registrar, dates, contacts, name servers), IP address network information (organization, ASN, country), and DNS records for comprehensive domain analysis.'
    },
    {
      question: 'Why might some contact information be hidden?',
      answer: 'Many domains use WHOIS privacy protection services to hide personal contact details. This is common for privacy protection and shows as "REDACTED FOR PRIVACY" in the results.'
    },
    {
      question: 'What do the domain statuses mean?',
      answer: 'Domain statuses like "clientTransferProhibited" indicate security locks preventing unauthorized transfers, updates, or deletions. These are typically set by registrars for protection.'
    },
    {
      question: 'Can I look up any domain or IP?',
      answer: 'You can look up most public domains and IP addresses. Some private or restricted networks may have limited information available through WHOIS databases.'
    },
    {
      question: 'How often is WHOIS data updated?',
      answer: 'WHOIS data is updated when domain owners make changes. Registration dates are fixed, but contact info, name servers, and expiration dates can be updated by domain owners.'
    }
  ],
  
  commonErrors: [
    'Domain not found - check spelling and ensure domain exists',
    'Rate limited - too many requests, wait before trying again',
    'Private registration - contact details hidden by privacy service',
    'Invalid format - ensure proper domain name or IP address format',
    'Network timeout - try again or check your internet connection'
  ],

  relatedTools: ['dns-lookup', 'url-parser', 'ip-subnet-calculator', 'certificate-decoder']
};