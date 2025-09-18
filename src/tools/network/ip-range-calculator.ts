import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface IpRangeConfig {
  mode: 'calculate' | 'validate';
  showBinary: boolean;
  showHostCount: boolean;
  includePrivateInfo: boolean;
  outputFormat: 'simple' | 'detailed' | 'table';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  rangeInfo?: IpRangeInfo;
}

interface IpRangeInfo {
  input: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIP: string;
  lastUsableIP: string;
  subnetMask: string;
  cidr: number;
  totalAddresses: number;
  usableAddresses: number;
  networkClass: string;
  isPrivate: boolean;
  binary?: {
    networkAddress: string;
    broadcastAddress: string;
    subnetMask: string;
  };
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

function getNetworkAddress(ip: string, cidr: number): string {
  const ipNum = ipToNumber(ip);
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  return numberToIp(ipNum & mask);
}

function getBroadcastAddress(ip: string, cidr: number): string {
  const ipNum = ipToNumber(ip);
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const network = ipNum & mask;
  const broadcast = network | (0xFFFFFFFF >>> cidr);
  return numberToIp(broadcast);
}

function getUsableRange(networkAddress: string, broadcastAddress: string): { first: string; last: string } {
  const networkNum = ipToNumber(networkAddress);
  const broadcastNum = ipToNumber(broadcastAddress);

  return {
    first: numberToIp(networkNum + 1),
    last: numberToIp(broadcastNum - 1)
  };
}

function getNetworkClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0], 10);

  if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Reserved)';

  return 'Unknown';
}

function isPrivateIP(ip: string): boolean {
  const ipNum = ipToNumber(ip);

  // 10.0.0.0/8
  if (ipNum >= ipToNumber('10.0.0.0') && ipNum <= ipToNumber('10.255.255.255')) return true;

  // 172.16.0.0/12
  if (ipNum >= ipToNumber('172.16.0.0') && ipNum <= ipToNumber('172.31.255.255')) return true;

  // 192.168.0.0/16
  if (ipNum >= ipToNumber('192.168.0.0') && ipNum <= ipToNumber('192.168.255.255')) return true;

  return false;
}

function ipToBinary(ip: string): string {
  return ip.split('.').map(octet =>
    parseInt(octet, 10).toString(2).padStart(8, '0')
  ).join('.');
}

function formatOutput(rangeInfo: IpRangeInfo, config: IpRangeConfig): string {
  if (config.outputFormat === 'simple') {
    return `First usable IP: ${rangeInfo.firstUsableIP}
Last usable IP: ${rangeInfo.lastUsableIP}
Usable addresses: ${rangeInfo.usableAddresses}`;
  }

  if (config.outputFormat === 'table') {
    return `| Property | Value |
|----------|-------|
| Network | ${rangeInfo.input} |
| First Usable IP | ${rangeInfo.firstUsableIP} |
| Last Usable IP | ${rangeInfo.lastUsableIP} |
| Network Address | ${rangeInfo.networkAddress} |
| Broadcast Address | ${rangeInfo.broadcastAddress} |
| Subnet Mask | ${rangeInfo.subnetMask} |
| Usable Addresses | ${rangeInfo.usableAddresses} |
| Total Addresses | ${rangeInfo.totalAddresses} |
| Network Class | ${rangeInfo.networkClass} |
| Private Network | ${rangeInfo.isPrivate ? 'Yes' : 'No'} |`;
  }

  // Detailed format
  let output = `# IP Range Calculator Results

## 🎯 Usable IP Address Range

- **First Usable IP**: ${rangeInfo.firstUsableIP}
- **Last Usable IP**: ${rangeInfo.lastUsableIP}
- **Total Usable Addresses**: ${rangeInfo.usableAddresses}

## 📊 Network Information

- **Input**: ${rangeInfo.input}
- **Network Address**: ${rangeInfo.networkAddress}
- **Broadcast Address**: ${rangeInfo.broadcastAddress}
- **Subnet Mask**: ${rangeInfo.subnetMask}
- **CIDR Notation**: /${rangeInfo.cidr}
- **Total Addresses**: ${rangeInfo.totalAddresses}

## 🏷️ Classification

- **Network Class**: ${rangeInfo.networkClass}
- **Private Network**: ${rangeInfo.isPrivate ? 'Yes' : 'No'}`;

  if (config.showBinary && rangeInfo.binary) {
    output += `

## 🔢 Binary Representation

- **Network Address**: ${rangeInfo.binary.networkAddress}
- **Broadcast Address**: ${rangeInfo.binary.broadcastAddress}
- **Subnet Mask**: ${rangeInfo.binary.subnetMask}`;
  }

  return output;
}

export function processIpRange(input: string, config: IpRangeConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide an IP address with CIDR notation (e.g., 192.168.1.0/24)'
      };
    }

    const parsed = parseIPWithCIDR(input.trim());
    if (!parsed) {
      return {
        success: false,
        error: 'Invalid IP/CIDR format. Please use format: IP/CIDR (e.g., 192.168.1.0/24)'
      };
    }

    const { ip, cidr } = parsed;

    if (config.mode === 'validate') {
      return {
        success: true,
        output: `✅ Valid IP/CIDR notation: ${ip}/${cidr}`
      };
    }

    // Calculate range information
    const networkAddress = getNetworkAddress(ip, cidr);
    const broadcastAddress = getBroadcastAddress(ip, cidr);
    const subnetMask = getSubnetMask(cidr);
    const usableRange = getUsableRange(networkAddress, broadcastAddress);

    const totalAddresses = Math.pow(2, 32 - cidr);
    const usableAddresses = Math.max(0, totalAddresses - 2);

    const rangeInfo: IpRangeInfo = {
      input: `${ip}/${cidr}`,
      networkAddress,
      broadcastAddress,
      firstUsableIP: usableRange.first,
      lastUsableIP: usableRange.last,
      subnetMask,
      cidr,
      totalAddresses,
      usableAddresses,
      networkClass: getNetworkClass(networkAddress),
      isPrivate: isPrivateIP(networkAddress)
    };

    if (config.showBinary) {
      rangeInfo.binary = {
        networkAddress: ipToBinary(networkAddress),
        broadcastAddress: ipToBinary(broadcastAddress),
        subnetMask: ipToBinary(subnetMask)
      };
    }

    const output = formatOutput(rangeInfo, config);

    return {
      success: true,
      output,
      rangeInfo
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate IP range'
    };
  }
}

export const IP_RANGE_CALCULATOR_TOOL: Tool = {
  id: 'ip-range-calculator',
  name: 'First Usable IP Address Calculator - IP Range Tool',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'network')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'network')!.subcategories!.find(sub => sub.id === 'ip-tools')!,
  slug: 'ip-range-calculator',
  icon: '🌐',
  keywords: ['first usable ip address calculator', 'last usable ip', 'ip range calculator', 'usable ip addresses', 'network range', 'subnet range', 'dhcp range', 'ip calculator', 'cidr range'],
  seoTitle: 'First & Last Usable IP Address Calculator - Free IP Range Tool',
  seoDescription: 'Calculate first and last usable IP addresses in any subnet. Find usable IP ranges for DHCP, network planning, and IP address management.',
  description: 'Find the first and last usable IP addresses in any subnet or network range. Perfect for DHCP configuration, network planning, and IP address management tasks.',

  examples: [
    {
      title: 'DHCP Pool Planning - Class C Network',
      input: '192.168.1.0/24',
      output: `# IP Range Calculator Results

## 🎯 Usable IP Address Range

- **First Usable IP**: 192.168.1.1
- **Last Usable IP**: 192.168.1.254
- **Total Usable Addresses**: 254

Perfect for setting up DHCP pools: 192.168.1.10 to 192.168.1.200`,
      description: 'Calculate usable IP range for DHCP server configuration'
    },
    {
      title: 'Small Office Network - /28 Subnet',
      input: '10.1.1.16/28',
      output: `## 🎯 Usable IP Address Range

- **First Usable IP**: 10.1.1.17
- **Last Usable IP**: 10.1.1.30
- **Total Usable Addresses**: 14

Network: 10.1.1.16 to 10.1.1.31 (16 total addresses)`,
      description: 'Find usable IPs in a small subnet for device assignments'
    },
    {
      title: 'Large Private Network - Class A',
      input: '10.0.0.0/8',
      output: `## 🎯 Usable IP Address Range

- **First Usable IP**: 10.0.0.1
- **Last Usable IP**: 10.255.255.254
- **Total Usable Addresses**: 16,777,214

Massive range for enterprise networks and cloud deployments`,
      description: 'Calculate the enormous usable range in a Class A private network'
    }
  ],

  useCases: [
    'Find first and last usable IP addresses for DHCP configuration',
    'Calculate IP ranges for network device assignment',
    'Plan subnets for VLANs and network segmentation',
    'Determine available IPs for server deployment',
    'Network troubleshooting and IP conflict resolution',
    'Cloud network planning and IP allocation',
    'IoT device network planning',
    'Network documentation and inventory management'
  ],

  faq: [
    {
      question: 'What is the first usable IP address in a subnet?',
      answer: 'The first usable IP address is the network address + 1. It\'s the first IP that can be assigned to a device (the network address itself is reserved for the subnet identifier).'
    },
    {
      question: 'What is the last usable IP address in a subnet?',
      answer: 'The last usable IP address is the broadcast address - 1. It\'s the highest IP that can be assigned to a device (the broadcast address itself is reserved for network broadcasts).'
    },
    {
      question: 'How many usable IP addresses are in my subnet?',
      answer: 'The number of usable IPs = 2^(host bits) - 2. For example, a /24 network has 8 host bits, so 2^8 - 2 = 254 usable addresses.'
    },
    {
      question: 'Can I use the network and broadcast addresses?',
      answer: 'No, the network address (first in range) identifies the subnet itself, and the broadcast address (last in range) is used for broadcasts. Only the addresses in between are usable for devices.'
    },
    {
      question: 'What\'s the best practice for DHCP pool configuration?',
      answer: 'Reserve some IPs at the beginning for static assignments (servers, printers) and configure DHCP to use a smaller range within the usable IPs. For example, in 192.168.1.0/24, use 192.168.1.100-200 for DHCP.'
    },
    {
      question: 'How do I calculate this manually?',
      answer: 'For a /24 network like 192.168.1.0/24: Network=192.168.1.0, Broadcast=192.168.1.255, so usable range is 192.168.1.1 to 192.168.1.254. This tool does it instantly!'
    }
  ],

  commonErrors: [
    'Assigning the network address (first IP) to a device',
    'Assigning the broadcast address (last IP) to a device',
    'Overlapping DHCP ranges with static IP assignments',
    'Not leaving room for network growth in IP planning',
    'Using /32 networks (single host) for multi-device subnets'
  ],

  relatedTools: ['ip-subnet-calculator', 'network-monitoring-tool', 'cidr-calculator'],

  howItWorks: [
    {
      title: 'Enter Network Address',
      icon: '📝',
      description: 'Input your network in CIDR notation (like 192.168.1.0/24). The tool instantly recognizes the format and validates the IP address and subnet mask.',
      keywords: ['cidr notation', 'network address', 'subnet mask', 'ip input']
    },
    {
      title: 'Automatic Calculation',
      icon: '⚡',
      description: 'The calculator instantly determines your network range, identifies the unusable network and broadcast addresses, and shows your usable IP range.',
      keywords: ['automatic calculation', 'network range', 'broadcast address', 'usable range']
    },
    {
      title: 'Usable Range Display',
      icon: '🎯',
      description: 'See the first and last usable IP addresses prominently displayed, along with the total count of available addresses for device assignment.',
      keywords: ['first usable ip', 'last usable ip', 'available addresses', 'device assignment']
    },
    {
      title: 'Network Planning Info',
      icon: '📊',
      description: 'Get additional context like network class, private/public status, and binary representations to help with network planning and documentation.',
      keywords: ['network planning', 'network class', 'private network', 'network documentation']
    }
  ],

  problemsSolved: [
    {
      problem: 'Network administrators waste time manually calculating which IP addresses can actually be assigned to devices in a subnet.',
      solution: 'Instantly shows the first and last usable IP addresses, eliminating guesswork and preventing assignment of reserved network/broadcast addresses.',
      icon: '🎯',
      keywords: ['usable ip range', 'device assignment', 'network administration', 'ip planning']
    },
    {
      problem: 'DHCP server configuration requires knowing the exact usable range to avoid conflicts with static assignments and reserved addresses.',
      solution: 'Provides the complete usable range with clear boundaries, making DHCP pool configuration straightforward and conflict-free.',
      icon: '🔧',
      keywords: ['dhcp configuration', 'ip conflicts', 'static assignments', 'dhcp pool']
    },
    {
      problem: 'Network planning and documentation requires understanding exactly how many devices can be connected to each subnet.',
      solution: 'Shows total usable addresses and range boundaries, enabling accurate capacity planning and network growth projections.',
      icon: '📈',
      keywords: ['network capacity', 'growth planning', 'subnet sizing', 'device limits']
    }
  ],

  whyChoose: [
    {
      title: 'Instant Usable IP Discovery',
      description: 'No more manual subnet math - instantly see which IPs you can actually assign to devices, servers, and network equipment.',
      icon: '⚡',
      keywords: ['instant calculation', 'usable ips', 'device assignment', 'no manual math']
    },
    {
      title: 'DHCP-Friendly Results',
      description: 'Results are formatted perfectly for DHCP server configuration, showing exactly which ranges are safe to use for automatic assignment.',
      icon: '🔧',
      keywords: ['dhcp friendly', 'server configuration', 'automatic assignment', 'safe ranges']
    },
    {
      title: 'Network Planning Context',
      description: 'Beyond just the range, get network class, private/public status, and capacity information to make informed networking decisions.',
      icon: '📋',
      keywords: ['network planning', 'capacity information', 'private public', 'networking decisions']
    },
    {
      title: 'Security & Privacy',
      description: 'All calculations happen in your browser - sensitive network information never leaves your device, keeping your infrastructure plans private.',
      icon: '🔒',
      keywords: ['browser calculation', 'private tool', 'sensitive networks', 'infrastructure security']
    }
  ]
};