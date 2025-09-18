import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface SubnetCalculatorConfig {
  mode: 'calculate' | 'validate' | 'split';
  includePrivateInfo: boolean;
  includeBroadcast: boolean;
  includeWildcard: boolean;
  showBinary: boolean;
  splitIntoSubnets: number;
  outputFormat: 'detailed' | 'compact' | 'table';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  networkInfo?: NetworkInfo;
}

interface NetworkInfo {
  network: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIP: string;
  lastUsableIP: string;
  subnetMask: string;
  wildcardMask: string;
  cidr: number;
  totalHosts: number;
  usableHosts: number;
  networkClass: string;
  isPrivate: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  binary: {
    networkAddress: string;
    subnetMask: string;
    wildcardMask: string;
  };
  subnets?: SubnetInfo[];
}

interface SubnetInfo {
  network: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIP: string;
  lastUsableIP: string;
  usableHosts: number;
}

// Helper functions for IP calculations
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function numberToIp(num: number): string {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF
  ].join('.');
}

function isValidIPv4(ip: string): boolean {
  const octets = ip.split('.');
  if (octets.length !== 4) return false;
  
  return octets.every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255 && octet === num.toString();
  });
}

function isValidCIDR(cidr: number): boolean {
  return cidr >= 0 && cidr <= 32;
}

function parseIPWithCIDR(input: string): { ip: string; cidr: number } | null {
  const parts = input.split('/');
  if (parts.length !== 2) return null;
  
  const ip = parts[0].trim();
  const cidr = parseInt(parts[1].trim(), 10);
  
  if (!isValidIPv4(ip) || !isValidCIDR(cidr)) return null;
  
  return { ip, cidr };
}

function getSubnetMask(cidr: number): string {
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  return numberToIp(mask);
}

function getWildcardMask(cidr: number): string {
  const wildcardNum = (0xFFFFFFFF >>> cidr);
  return numberToIp(wildcardNum);
}

function getNetworkAddress(ip: string, cidr: number): string {
  const ipNum = ipToNumber(ip);
  const maskNum = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const networkNum = ipNum & maskNum;
  return numberToIp(networkNum);
}

function getBroadcastAddress(ip: string, cidr: number): string {
  const ipNum = ipToNumber(ip);
  const maskNum = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const networkNum = ipNum & maskNum;
  const broadcastNum = networkNum | (0xFFFFFFFF >>> cidr);
  return numberToIp(broadcastNum);
}

function getUsableRange(networkAddress: string, broadcastAddress: string): { first: string; last: string } {
  const networkNum = ipToNumber(networkAddress);
  const broadcastNum = ipToNumber(broadcastAddress);
  
  const firstUsableNum = networkNum + 1;
  const lastUsableNum = broadcastNum - 1;
  
  return {
    first: numberToIp(firstUsableNum),
    last: numberToIp(lastUsableNum)
  };
}

function getNetworkClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0], 10);
  
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
  
  return 'Unknown';
}

function isPrivateIP(ip: string): boolean {
  const octets = ip.split('.').map(o => parseInt(o, 10));
  const [a, b] = octets;
  
  // 10.0.0.0/8
  if (a === 10) return true;
  
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  
  return false;
}

function isLoopbackIP(ip: string): boolean {
  return ip.startsWith('127.');
}

function isMulticastIP(ip: string): boolean {
  const firstOctet = parseInt(ip.split('.')[0], 10);
  return firstOctet >= 224 && firstOctet <= 239;
}

function ipToBinary(ip: string): string {
  return ip.split('.').map(octet => 
    parseInt(octet, 10).toString(2).padStart(8, '0')
  ).join('.');
}

function calculateSubnets(networkAddress: string, originalCIDR: number, numSubnets: number): SubnetInfo[] {
  if (numSubnets <= 1) return [];
  
  // Calculate the number of bits needed for subnetting
  const bitsNeeded = Math.ceil(Math.log2(numSubnets));
  const newCIDR = originalCIDR + bitsNeeded;
  
  if (newCIDR > 30) return []; // Not enough bits for subnetting
  
  const subnets: SubnetInfo[] = [];
  const networkNum = ipToNumber(networkAddress);
  const subnetSize = Math.pow(2, 32 - newCIDR);
  
  for (let i = 0; i < numSubnets; i++) {
    const subnetNetworkNum = networkNum + (i * subnetSize);
    const subnetBroadcastNum = subnetNetworkNum + subnetSize - 1;
    
    const subnetNetwork = numberToIp(subnetNetworkNum);
    const subnetBroadcast = numberToIp(subnetBroadcastNum);
    const usableRange = getUsableRange(subnetNetwork, subnetBroadcast);
    
    subnets.push({
      network: `${subnetNetwork}/${newCIDR}`,
      networkAddress: subnetNetwork,
      broadcastAddress: subnetBroadcast,
      firstUsableIP: usableRange.first,
      lastUsableIP: usableRange.last,
      usableHosts: subnetSize - 2
    });
  }
  
  return subnets.slice(0, numSubnets);
}

function validateInput(input: string): string | null {
  if (!input.trim()) {
    return 'Please provide an IP address with CIDR notation (e.g., 192.168.1.0/24)';
  }
  
  const parsed = parseIPWithCIDR(input);
  if (!parsed) {
    return 'Invalid format. Use IP/CIDR notation (e.g., 192.168.1.0/24)';
  }
  
  return null;
}

function formatOutput(networkInfo: NetworkInfo, config: SubnetCalculatorConfig): string {
  if (config.outputFormat === 'compact') {
    return formatCompactOutput(networkInfo, config);
  } else if (config.outputFormat === 'table') {
    return formatTableOutput(networkInfo, config);
  }
  
  return formatDetailedOutput(networkInfo, config);
}

function formatDetailedOutput(networkInfo: NetworkInfo, config: SubnetCalculatorConfig): string {
  let output = `# IP Subnet Calculator Results\n\n`;
  
  output += `## Network Information\n\n`;
  output += `- **Network**: ${networkInfo.network}\n`;
  output += `- **Network Address**: ${networkInfo.networkAddress}\n`;
  if (config.includeBroadcast) {
    output += `- **Broadcast Address**: ${networkInfo.broadcastAddress}\n`;
  }
  output += `- **Subnet Mask**: ${networkInfo.subnetMask}\n`;
  if (config.includeWildcard) {
    output += `- **Wildcard Mask**: ${networkInfo.wildcardMask}\n`;
  }
  output += `- **CIDR Notation**: /${networkInfo.cidr}\n`;
  output += `- **First Usable IP**: ${networkInfo.firstUsableIP}\n`;
  output += `- **Last Usable IP**: ${networkInfo.lastUsableIP}\n`;
  output += `- **Total Host Addresses**: ${networkInfo.totalHosts.toLocaleString()}\n`;
  output += `- **Usable Host Addresses**: ${networkInfo.usableHosts.toLocaleString()}\n`;
  
  if (config.includePrivateInfo) {
    output += `\n## Classification\n\n`;
    output += `- **Network Class**: ${networkInfo.networkClass}\n`;
    output += `- **Private Network**: ${networkInfo.isPrivate ? 'Yes' : 'No'}\n`;
    output += `- **Loopback**: ${networkInfo.isLoopback ? 'Yes' : 'No'}\n`;
    output += `- **Multicast**: ${networkInfo.isMulticast ? 'Yes' : 'No'}\n`;
  }
  
  if (config.showBinary) {
    output += `\n## Binary Representation\n\n`;
    output += `- **Network Address**: ${networkInfo.binary.networkAddress}\n`;
    output += `- **Subnet Mask**: ${networkInfo.binary.subnetMask}\n`;
    if (config.includeWildcard) {
      output += `- **Wildcard Mask**: ${networkInfo.binary.wildcardMask}\n`;
    }
  }
  
  if (networkInfo.subnets && networkInfo.subnets.length > 0) {
    output += `\n## Subnets\n\n`;
    networkInfo.subnets.forEach((subnet, index) => {
      output += `### Subnet ${index + 1}\n`;
      output += `- **Network**: ${subnet.network}\n`;
      output += `- **Network Address**: ${subnet.networkAddress}\n`;
      output += `- **Broadcast Address**: ${subnet.broadcastAddress}\n`;
      output += `- **Usable Range**: ${subnet.firstUsableIP} - ${subnet.lastUsableIP}\n`;
      output += `- **Usable Hosts**: ${subnet.usableHosts.toLocaleString()}\n\n`;
    });
  }
  
  output += `---\n*Calculated by FreeFormatHub IP Subnet Calculator*`;
  
  return output;
}

function formatCompactOutput(networkInfo: NetworkInfo, config: SubnetCalculatorConfig): string {
  let output = `Network: ${networkInfo.network}\n`;
  output += `Range: ${networkInfo.firstUsableIP} - ${networkInfo.lastUsableIP}\n`;
  output += `Subnet Mask: ${networkInfo.subnetMask}\n`;
  output += `Usable Hosts: ${networkInfo.usableHosts.toLocaleString()}\n`;
  
  if (networkInfo.subnets && networkInfo.subnets.length > 0) {
    output += `\nSubnets:\n`;
    networkInfo.subnets.forEach((subnet, index) => {
      output += `${index + 1}. ${subnet.network} (${subnet.usableHosts} hosts)\n`;
    });
  }
  
  return output;
}

function formatTableOutput(networkInfo: NetworkInfo, config: SubnetCalculatorConfig): string {
  let output = `| Property | Value |\n`;
  output += `|----------|-------|\n`;
  output += `| Network | ${networkInfo.network} |\n`;
  output += `| Network Address | ${networkInfo.networkAddress} |\n`;
  output += `| Broadcast Address | ${networkInfo.broadcastAddress} |\n`;
  output += `| Subnet Mask | ${networkInfo.subnetMask} |\n`;
  output += `| First Usable IP | ${networkInfo.firstUsableIP} |\n`;
  output += `| Last Usable IP | ${networkInfo.lastUsableIP} |\n`;
  output += `| Total Hosts | ${networkInfo.totalHosts.toLocaleString()} |\n`;
  output += `| Usable Hosts | ${networkInfo.usableHosts.toLocaleString()} |\n`;
  
  if (networkInfo.subnets && networkInfo.subnets.length > 0) {
    output += `\n## Subnets\n\n`;
    output += `| # | Network | Network Address | Broadcast | Usable Range | Hosts |\n`;
    output += `|---|---------|----------------|-----------|--------------|-------|\n`;
    networkInfo.subnets.forEach((subnet, index) => {
      output += `| ${index + 1} | ${subnet.network} | ${subnet.networkAddress} | ${subnet.broadcastAddress} | ${subnet.firstUsableIP} - ${subnet.lastUsableIP} | ${subnet.usableHosts.toLocaleString()} |\n`;
    });
  }
  
  return output;
}

export function processSubnetCalculator(input: string, config: SubnetCalculatorConfig): ToolResult {
  try {
    const error = validateInput(input);
    if (error) {
      return { success: false, error };
    }
    
    const parsed = parseIPWithCIDR(input.trim())!;
    const { ip, cidr } = parsed;
    
    if (config.mode === 'validate') {
      return {
        success: true,
        output: `✅ Valid IPv4 network: ${ip}/${cidr}\n\nNetwork class: ${getNetworkClass(ip)}\nPrivate network: ${isPrivateIP(ip) ? 'Yes' : 'No'}`
      };
    }
    
    // Calculate network information
    const networkAddress = getNetworkAddress(ip, cidr);
    const broadcastAddress = getBroadcastAddress(ip, cidr);
    const subnetMask = getSubnetMask(cidr);
    const wildcardMask = getWildcardMask(cidr);
    const usableRange = getUsableRange(networkAddress, broadcastAddress);
    
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = Math.max(0, totalHosts - 2);
    
    const networkInfo: NetworkInfo = {
      network: `${networkAddress}/${cidr}`,
      networkAddress,
      broadcastAddress,
      firstUsableIP: usableRange.first,
      lastUsableIP: usableRange.last,
      subnetMask,
      wildcardMask,
      cidr,
      totalHosts,
      usableHosts,
      networkClass: getNetworkClass(networkAddress),
      isPrivate: isPrivateIP(networkAddress),
      isLoopback: isLoopbackIP(networkAddress),
      isMulticast: isMulticastIP(networkAddress),
      binary: {
        networkAddress: ipToBinary(networkAddress),
        subnetMask: ipToBinary(subnetMask),
        wildcardMask: ipToBinary(wildcardMask)
      }
    };
    
    // Calculate subnets if requested
    if (config.mode === 'split' && config.splitIntoSubnets > 1) {
      networkInfo.subnets = calculateSubnets(networkAddress, cidr, config.splitIntoSubnets);
    }
    
    const output = formatOutput(networkInfo, config);
    
    return {
      success: true,
      output,
      networkInfo
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate subnet information'
    };
  }
}

export const IP_SUBNET_CALCULATOR_TOOL: Tool = {
  id: 'ip-subnet-calculator',
  name: 'IP Subnet Calculator - Netmask & CIDR Calculator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'ip-tools')!,
  slug: 'ip-subnet-calculator',
  icon: '🌐',
  keywords: ['ip netmask calculator', 'netmask calculator', 'ip subnet calculator', 'netmask cidr calculator', 'subnet calculator', 'first usable ip address calculator', 'cidr', 'network', 'wildcard', 'subnet mask', 'ip range'],
  seoTitle: 'IP Subnet Calculator - Netmask, CIDR & First/Last Usable IP Calculator',
  seoDescription: 'Calculate IP subnet masks, CIDR notation, first & last usable IP addresses. Free netmask calculator with network analysis and subnet planning tools.',
  description: 'Calculate IP subnets, netmasks, CIDR notation, and find first/last usable IP addresses. Complete network calculator with subnet splitting and binary analysis for network engineers.',
  
  examples: [
    {
      title: 'First & Last Usable IP Calculator',
      input: '192.168.1.0/24',
      output: `# IP Subnet Calculator Results

## Network Information

- **Network**: 192.168.1.0/24
- **Netmask**: 255.255.255.0 (CIDR /24)
- **First Usable IP**: 192.168.1.1 ⭐
- **Last Usable IP**: 192.168.1.254 ⭐
- **Network Address**: 192.168.1.0
- **Broadcast Address**: 192.168.1.255
- **Usable Host Addresses**: 254`,
      description: 'Find first and last usable IP addresses in a subnet - perfect for DHCP configuration'
    },
    {
      title: 'Private Network Analysis',
      input: '10.0.0.0/8',
      output: `# IP Subnet Calculator Results

## Network Information

- **Network**: 10.0.0.0/8
- **Network Address**: 10.0.0.0
- **Broadcast Address**: 10.255.255.255
- **Subnet Mask**: 255.0.0.0
- **First Usable IP**: 10.0.0.1
- **Last Usable IP**: 10.255.255.254
- **Usable Host Addresses**: 16,777,214

## Classification

- **Network Class**: A
- **Private Network**: Yes`,
      description: 'Analyze a large private network with classification details'
    },
    {
      title: 'Small Subnet with Binary',
      input: '172.16.10.0/28',
      output: `# IP Subnet Calculator Results

## Network Information

- **Network**: 172.16.10.0/28
- **Subnet Mask**: 255.255.255.240
- **First Usable IP**: 172.16.10.1
- **Last Usable IP**: 172.16.10.14
- **Usable Host Addresses**: 14

## Binary Representation

- **Network Address**: 10101100.00010000.00001010.00000000
- **Subnet Mask**: 11111111.11111111.11111111.11110000`,
      description: 'Calculate small subnet with binary representation'
    }
  ],
  
  useCases: [
    'Find first and last usable IP addresses in any subnet',
    'Calculate netmask and CIDR notation for network planning',
    'Subnet design for VLANs and network segmentation',
    'DHCP pool configuration with usable IP ranges',
    'Network troubleshooting and IP verification',
    'Learning and understanding subnetting concepts'
  ],
  
  faq: [
    {
      question: 'How do I find the first usable IP address in a subnet?',
      answer: 'The first usable IP address is always the network address + 1. For example, in subnet 192.168.1.0/24, the network address is 192.168.1.0, so the first usable IP is 192.168.1.1. This calculator shows you both automatically.'
    },
    {
      question: 'What is CIDR notation?',
      answer: 'CIDR (Classless Inter-Domain Routing) notation represents an IP network using an IP address followed by a slash and the number of network bits (e.g., 192.168.1.0/24). The number after the slash indicates how many bits are used for the network portion.'
    },
    {
      question: 'How do I calculate the number of usable hosts?',
      answer: 'The number of usable hosts equals 2^(32-CIDR) - 2. The -2 accounts for the network address (first IP) and broadcast address (last IP) which cannot be assigned to hosts.'
    },
    {
      question: 'What are private IP address ranges?',
      answer: 'Private IP ranges are: 10.0.0.0/8 (Class A), 172.16.0.0/12 (Class B), and 192.168.0.0/16 (Class C). These addresses are not routed on the public internet and are used for internal networks.'
    },
    {
      question: 'What is a wildcard mask?',
      answer: 'A wildcard mask is the inverse of a subnet mask. It shows which bits are ignored when matching IP addresses. It\'s commonly used in access control lists (ACLs) and routing protocols.'
    },
    {
      question: 'How does subnet splitting work?',
      answer: 'Subnet splitting divides a larger network into smaller subnets by borrowing bits from the host portion. Each split requires additional network bits, reducing the number of available host addresses per subnet.'
    }
  ],
  
  commonErrors: [
    'Invalid CIDR notation - ensure format is IP/number (e.g., 192.168.1.0/24)',
    'CIDR value out of range - must be between 0 and 32 for IPv4',
    'Invalid IP address format - each octet must be 0-255',
    'Insufficient bits for subnet splitting - cannot create more subnets than available host bits allow'
  ],
  relatedTools: ['url-encoder', 'hash-generator', 'regex-tester'],
  howItWorks: [
    {
      title: 'Enter Network Details',
      icon: '📝',
      description: 'Paste CIDR blocks (e.g., 10.0.0.0/16) or individual addresses. The calculator validates IPv4 syntax and highlights formatting mistakes before processing.',
      keywords: ['cidr input', 'ipv4 validation', 'network address', 'subnet calculator', 'ip planner']
    },
    {
      title: 'Select Calculation Mode',
      icon: '⚙️',
      description: 'Switch between calculations, validations, or subnet splitting. Toggle broadcast, wildcard, binary views, and choose detailed, compact, or tabular output formats.',
      keywords: ['subnet split', 'wildcard mask', 'binary mask', 'output formats', 'network mode']
    },
    {
      title: 'Review Rich Network Data',
      icon: '📊',
      description: 'Receive instant results with network/broadcast addresses, usable host ranges, classification, private/multicast flags, and optional binary breakdown for ACL work.',
      keywords: ['usable hosts', 'network classification', 'private network', 'binary representation', 'acl planning']
    },
    {
      title: 'Export & Document',
      icon: '📄',
      description: 'Copy the generated markdown-style report, download output, or store runs in tool history to share with teammates and paste into change requests.',
      keywords: ['network report', 'copy results', 'download subnet', 'documentation', 'change management']
    }
  ],
  problemsSolved: [
    {
      problem: 'Subnet math by hand is slow and error-prone, especially when juggling multiple VLANs or address pools under deadline.',
      solution: 'Compute masks, usable ranges, totals, and binary representations instantly so network engineers can focus on architecture instead of arithmetic.',
      icon: '⏱️',
      keywords: ['subnet math', 'usable range', 'network automation', 'vlan planning', 'binary mask']
    },
    {
      problem: 'Documentation requires consistent reporting of private status, network class, and wildcard masks for security reviews.',
      solution: 'Auto-generated summaries include private/public flags, loopback/multicast indicators, and wildcard masks ready for ACLs and change tickets.',
      icon: '📋',
      keywords: ['network documentation', 'wildcard mask', 'acl planning', 'security review', 'change ticket']
    },
    {
      problem: 'Splitting address space into even subnets can be confusing without visualizing the new ranges and host counts.',
      solution: 'Use the split mode to carve networks into equal subnets with clear start/end addresses and host availability for each child subnet.',
      icon: '🧩',
      keywords: ['subnetting', 'split network', 'host count', 'network segmentation', 'ip planning']
    }
  ],
  whyChoose: [
    {
      title: 'Private & Offline',
      description: 'Network inventories, infrastructure plans, and customer ranges stay on your device. Ideal for sensitive enterprise environments.',
      icon: '🔒',
      keywords: ['offline calculator', 'secure networking', 'no upload', 'sensitive data']
    },
    {
      title: 'Operator-Grade Detail',
      description: 'Fields for wildcard masks, binary output, and classification mirror what engineers need for ACLs, BGP policies, and firewall rules.',
      icon: '🛠️',
      keywords: ['acl planning', 'firewall rules', 'bgp policies', 'network engineering']
    },
    {
      title: 'Flexible Output',
      description: 'Switch between detailed markdown, compact summaries, or tables to match internal documentation standards and runbooks.',
      icon: '🗂️',
      keywords: ['markdown report', 'compact output', 'table view', 'documentation']
    },
    {
      title: 'Integrated History',
      description: 'Revisit previous calculations through tool history, making audits and troubleshooting faster when networks evolve.',
      icon: '🕒',
      keywords: ['tool history', 'network audit', 'troubleshooting', 'repeatable workflow']
    }
  ]
};
