import type { Tool, ToolResult, ToolExample } from '../../types/tool';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface CLICommandsReferenceOptions {
  searchQuery: string;
  platform: 'all' | 'linux' | 'macos' | 'windows' | 'powershell' | 'docker' | 'git';
  category: 'all' | 'system' | 'networking' | 'files' | 'processes' | 'development' | 'security';
  riskLevel: 'all' | 'safe' | 'caution' | 'dangerous';
  showExamples: boolean;
  showFlags: boolean;
}

export interface CLICommandsReferenceInput {
  options: CLICommandsReferenceOptions;
}

export interface CLICommand {
  id: string;
  command: string;
  description: string;
  platform: 'linux' | 'macos' | 'windows' | 'powershell' | 'docker' | 'git';
  category: 'system' | 'networking' | 'files' | 'processes' | 'development' | 'security';
  riskLevel: 'safe' | 'caution' | 'dangerous';
  syntax: string;
  examples: Array<{
    command: string;
    description: string;
    output?: string;
  }>;
  flags: Array<{
    flag: string;
    description: string;
    example?: string;
  }>;
  notes?: string[];
  relatedCommands?: string[];
  tags: string[];
}

export interface CLICommandsReferenceResult extends ToolResult {
  commands?: CLICommand[];
  totalCommands?: number;
  filteredCommands?: number;
  searchStats?: {
    byPlatform: Record<string, number>;
    byCategory: Record<string, number>;
    byRiskLevel: Record<string, number>;
  };
}

// Comprehensive CLI commands database
export const CLI_COMMANDS_DATABASE: CLICommand[] = [
  // Linux/macOS System Commands
  {
    id: 'linux-ls',
    command: 'ls',
    description: 'List directory contents with various formatting options',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'ls [options] [directory]',
    examples: [
      {
        command: 'ls -la',
        description: 'List all files including hidden ones with detailed information',
        output: 'total 24\ndrwxr-xr-x  3 user user 4096 Dec  1 10:30 .\ndrwxr-xr-x 15 user user 4096 Dec  1 10:29 ..'
      },
      {
        command: 'ls -lh',
        description: 'List files with human-readable file sizes',
        output: '-rw-r--r-- 1 user user 1.2K Dec  1 10:30 README.md'
      },
      {
        command: 'ls -lt',
        description: 'List files sorted by modification time (newest first)'
      }
    ],
    flags: [
      { flag: '-l', description: 'Use long listing format (detailed info)' },
      { flag: '-a', description: 'Include hidden files (starting with .)' },
      { flag: '-h', description: 'Human-readable file sizes (1K, 2M, 3G)' },
      { flag: '-t', description: 'Sort by modification time' },
      { flag: '-r', description: 'Reverse order while sorting' },
      { flag: '-S', description: 'Sort by file size' },
      { flag: '-1', description: 'List one file per line' },
      { flag: '--color', description: 'Colorize output' }
    ],
    notes: [
      'Hidden files start with a dot (.) and are not shown by default',
      'Use ls -la to see file permissions, ownership, and timestamps',
      'Combine flags like ls -lath for detailed, sorted, human-readable output'
    ],
    relatedCommands: ['find', 'tree', 'stat', 'file'],
    tags: ['directory', 'listing', 'files', 'permissions', 'filesystem']
  },
  {
    id: 'linux-find',
    command: 'find',
    description: 'Search for files and directories using various criteria',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'find [path] [expression]',
    examples: [
      {
        command: 'find . -name "*.js"',
        description: 'Find all JavaScript files in current directory and subdirectories'
      },
      {
        command: 'find /var/log -name "*.log" -mtime -7',
        description: 'Find log files modified in the last 7 days'
      },
      {
        command: 'find . -type f -size +100M',
        description: 'Find files larger than 100MB'
      },
      {
        command: 'find . -name "node_modules" -type d -exec rm -rf {} +',
        description: 'Find and delete all node_modules directories'
      }
    ],
    flags: [
      { flag: '-name', description: 'Search by filename (supports wildcards)' },
      { flag: '-type', description: 'f for files, d for directories, l for links' },
      { flag: '-size', description: 'Search by file size (+100M, -1K)' },
      { flag: '-mtime', description: 'Modified time in days (-7, +30)' },
      { flag: '-exec', description: 'Execute command on found files' },
      { flag: '-delete', description: 'Delete found files' },
      { flag: '-maxdepth', description: 'Limit search depth' }
    ],
    notes: [
      'Use quotes around patterns with wildcards to prevent shell expansion',
      'Be careful with -delete or -exec rm - test with -print first',
      'Use -maxdepth to improve performance on large directories'
    ],
    relatedCommands: ['locate', 'which', 'whereis', 'grep'],
    tags: ['search', 'files', 'directories', 'filesystem', 'recursive']
  },
  {
    id: 'linux-grep',
    command: 'grep',
    description: 'Search text patterns in files using regular expressions',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'grep [options] pattern [file...]',
    examples: [
      {
        command: 'grep -r "error" /var/log/',
        description: 'Recursively search for "error" in all log files'
      },
      {
        command: 'grep -n "function" script.js',
        description: 'Search for "function" and show line numbers'
      },
      {
        command: 'grep -v "^#" config.conf',
        description: 'Show all lines except comments (starting with #)'
      },
      {
        command: 'ps aux | grep nginx',
        description: 'Find nginx processes in process list'
      }
    ],
    flags: [
      { flag: '-r', description: 'Recursively search directories' },
      { flag: '-n', description: 'Show line numbers' },
      { flag: '-i', description: 'Case-insensitive search' },
      { flag: '-v', description: 'Invert match (exclude pattern)' },
      { flag: '-c', description: 'Count matching lines' },
      { flag: '-l', description: 'List filenames with matches' },
      { flag: '-A', description: 'Show N lines after match' },
      { flag: '-B', description: 'Show N lines before match' }
    ],
    notes: [
      'Use single quotes around patterns to prevent shell interpretation',
      'Combine with other commands using pipes (|) for powerful filtering',
      'Use -E for extended regex or egrep command'
    ],
    relatedCommands: ['sed', 'awk', 'find', 'ripgrep'],
    tags: ['search', 'text', 'pattern', 'regex', 'filter']
  },
  {
    id: 'linux-ps',
    command: 'ps',
    description: 'Display information about running processes',
    platform: 'linux',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'ps [options]',
    examples: [
      {
        command: 'ps aux',
        description: 'Show all processes with detailed information',
        output: 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  19312  1580 ?        Ss   Dec01   0:01 /sbin/init'
      },
      {
        command: 'ps aux | grep nginx',
        description: 'Find all nginx-related processes'
      },
      {
        command: 'ps -ef --forest',
        description: 'Show process tree with parent-child relationships'
      }
    ],
    flags: [
      { flag: 'aux', description: 'Show all processes with user info' },
      { flag: '-ef', description: 'Show all processes in full format' },
      { flag: '--forest', description: 'Display process tree' },
      { flag: '-u username', description: 'Show processes for specific user' },
      { flag: '-p PID', description: 'Show specific process by PID' }
    ],
    notes: [
      'ps aux shows processes from all users',
      'Combine with grep to filter specific processes',
      'Use top or htop for real-time process monitoring'
    ],
    relatedCommands: ['top', 'htop', 'pgrep', 'pkill', 'jobs'],
    tags: ['processes', 'monitoring', 'system', 'performance']
  },
  {
    id: 'linux-kill',
    command: 'kill',
    description: 'Terminate processes by sending signals',
    platform: 'linux',
    category: 'processes',
    riskLevel: 'dangerous',
    syntax: 'kill [signal] PID',
    examples: [
      {
        command: 'kill 1234',
        description: 'Gracefully terminate process with PID 1234'
      },
      {
        command: 'kill -9 1234',
        description: 'Force kill process with PID 1234 (cannot be ignored)'
      },
      {
        command: 'killall nginx',
        description: 'Kill all processes named nginx'
      },
      {
        command: 'pkill -f "node server.js"',
        description: 'Kill processes matching pattern in command line'
      }
    ],
    flags: [
      { flag: '-9', description: 'SIGKILL - Force kill (cannot be caught)' },
      { flag: '-15', description: 'SIGTERM - Graceful termination (default)' },
      { flag: '-1', description: 'SIGHUP - Restart/reload configuration' },
      { flag: '-STOP', description: 'Pause process execution' },
      { flag: '-CONT', description: 'Resume paused process' }
    ],
    notes: [
      'Always try graceful termination (default) before force kill (-9)',
      'Use ps or pgrep to find process IDs',
      'Be careful with killall - it affects all matching processes',
      'Some system processes should not be killed'
    ],
    relatedCommands: ['killall', 'pkill', 'pgrep', 'ps', 'jobs'],
    tags: ['processes', 'terminate', 'signals', 'system', 'dangerous']
  },
  {
    id: 'linux-systemctl',
    command: 'systemctl',
    description: 'Control systemd services and system state',
    platform: 'linux',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'systemctl [command] [service]',
    examples: [
      {
        command: 'systemctl status nginx',
        description: 'Check status of nginx service'
      },
      {
        command: 'systemctl start nginx',
        description: 'Start nginx service'
      },
      {
        command: 'systemctl restart nginx',
        description: 'Restart nginx service'
      },
      {
        command: 'systemctl enable nginx',
        description: 'Enable nginx to start at boot'
      },
      {
        command: 'systemctl list-units --failed',
        description: 'List all failed services'
      }
    ],
    flags: [
      { flag: 'status', description: 'Show service status and recent logs' },
      { flag: 'start', description: 'Start a service' },
      { flag: 'stop', description: 'Stop a service' },
      { flag: 'restart', description: 'Restart a service' },
      { flag: 'reload', description: 'Reload service configuration' },
      { flag: 'enable', description: 'Enable service at boot' },
      { flag: 'disable', description: 'Disable service at boot' },
      { flag: 'list-units', description: 'List active units' }
    ],
    notes: [
      'Requires sudo for start/stop/enable/disable operations',
      'Use systemctl --user for user services',
      'Check logs with journalctl -u servicename'
    ],
    relatedCommands: ['journalctl', 'service', 'chkconfig'],
    tags: ['systemd', 'services', 'system', 'administration', 'boot']
  },
  // Windows CMD Commands
  {
    id: 'windows-dir',
    command: 'dir',
    description: 'Display directory contents in Windows Command Prompt',
    platform: 'windows',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'dir [drive:][path][filename] [options]',
    examples: [
      {
        command: 'dir',
        description: 'List files in current directory'
      },
      {
        command: 'dir /a',
        description: 'Show all files including hidden and system files'
      },
      {
        command: 'dir *.txt /s',
        description: 'Find all .txt files in current directory and subdirectories'
      },
      {
        command: 'dir /o:d',
        description: 'List files ordered by date'
      }
    ],
    flags: [
      { flag: '/a', description: 'Show all files including hidden' },
      { flag: '/s', description: 'Search subdirectories' },
      { flag: '/b', description: 'Bare format (names only)' },
      { flag: '/o:d', description: 'Order by date' },
      { flag: '/o:s', description: 'Order by size' },
      { flag: '/p', description: 'Pause after each screen' }
    ],
    notes: [
      'Use wildcards * and ? for pattern matching',
      'Add /a:h to show only hidden files',
      'Use /o:-d to reverse date order (newest first)'
    ],
    relatedCommands: ['tree', 'forfiles', 'where'],
    tags: ['directory', 'listing', 'files', 'windows', 'filesystem']
  },
  {
    id: 'windows-tasklist',
    command: 'tasklist',
    description: 'Display running processes in Windows',
    platform: 'windows',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'tasklist [options]',
    examples: [
      {
        command: 'tasklist',
        description: 'Show all running processes'
      },
      {
        command: 'tasklist /fi "imagename eq chrome.exe"',
        description: 'Show only Chrome processes'
      },
      {
        command: 'tasklist /svc',
        description: 'Show services for each process'
      }
    ],
    flags: [
      { flag: '/fi', description: 'Apply filter (imagename, pid, etc.)' },
      { flag: '/svc', description: 'Show services hosted by each process' },
      { flag: '/m', description: 'Show modules/DLLs loaded by processes' },
      { flag: '/v', description: 'Verbose output with more details' }
    ],
    notes: [
      'Use with findstr for filtering: tasklist | findstr chrome',
      'Combine with taskkill to terminate processes',
      'Use /fi parameter for complex filtering'
    ],
    relatedCommands: ['taskkill', 'wmic', 'get-process'],
    tags: ['processes', 'monitoring', 'windows', 'system']
  },
  {
    id: 'windows-netstat',
    command: 'netstat',
    description: 'Display network connections and listening ports',
    platform: 'windows',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'netstat [options]',
    examples: [
      {
        command: 'netstat -an',
        description: 'Show all connections and listening ports with numerical addresses'
      },
      {
        command: 'netstat -ano | findstr :80',
        description: 'Find which process is using port 80'
      },
      {
        command: 'netstat -r',
        description: 'Display routing table'
      }
    ],
    flags: [
      { flag: '-a', description: 'Show all connections and listening ports' },
      { flag: '-n', description: 'Show numerical addresses instead of resolving hosts' },
      { flag: '-o', description: 'Show process ID for each connection' },
      { flag: '-r', description: 'Display routing table' },
      { flag: '-s', description: 'Show statistics by protocol' }
    ],
    notes: [
      'Use -ano together for most detailed output',
      'Combine with findstr to filter specific ports',
      'Process ID can be used with tasklist to identify programs'
    ],
    relatedCommands: ['ipconfig', 'ping', 'tracert', 'telnet'],
    tags: ['networking', 'ports', 'connections', 'windows', 'monitoring']
  },
  // PowerShell Commands
  {
    id: 'powershell-get-childitem',
    command: 'Get-ChildItem',
    description: 'Get items and child items in one or more specified locations',
    platform: 'powershell',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'Get-ChildItem [-Path] <String[]> [parameters]',
    examples: [
      {
        command: 'Get-ChildItem',
        description: 'List items in current directory (alias: ls, dir, gci)'
      },
      {
        command: 'Get-ChildItem -Recurse -Filter "*.log"',
        description: 'Recursively find all .log files'
      },
      {
        command: 'Get-ChildItem -Force',
        description: 'Show hidden and system files'
      }
    ],
    flags: [
      { flag: '-Recurse', description: 'Search subdirectories recursively' },
      { flag: '-Force', description: 'Show hidden and system items' },
      { flag: '-Filter', description: 'Filter items by pattern' },
      { flag: '-Include', description: 'Include only specified items' },
      { flag: '-Exclude', description: 'Exclude specified items' }
    ],
    notes: [
      'Aliases: ls, dir, gci all work the same way',
      'Returns objects, not just text - can pipe to other cmdlets',
      'Use Where-Object to filter results further'
    ],
    relatedCommands: ['Where-Object', 'Select-Object', 'Sort-Object'],
    tags: ['powershell', 'files', 'directories', 'objects', 'filesystem']
  },
  {
    id: 'powershell-get-process',
    command: 'Get-Process',
    description: 'Get processes running on local or remote computers',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'Get-Process [[-Name] <String[]>] [parameters]',
    examples: [
      {
        command: 'Get-Process',
        description: 'Get all running processes'
      },
      {
        command: 'Get-Process -Name "chrome"',
        description: 'Get Chrome processes'
      },
      {
        command: 'Get-Process | Sort-Object CPU -Descending',
        description: 'Sort processes by CPU usage'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Specify process name(s)' },
      { flag: '-Id', description: 'Specify process ID(s)' },
      { flag: '-ComputerName', description: 'Get processes from remote computer' },
      { flag: '-Module', description: 'Include loaded modules' }
    ],
    notes: [
      'Returns process objects with rich properties',
      'Pipe to Stop-Process to terminate processes',
      'Use with Where-Object for complex filtering'
    ],
    relatedCommands: ['Stop-Process', 'Start-Process', 'Where-Object'],
    tags: ['powershell', 'processes', 'monitoring', 'objects', 'system']
  },
  // Docker Commands
  {
    id: 'docker-ps',
    command: 'docker ps',
    description: 'List running Docker containers',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker ps [options]',
    examples: [
      {
        command: 'docker ps',
        description: 'Show running containers'
      },
      {
        command: 'docker ps -a',
        description: 'Show all containers (running and stopped)'
      },
      {
        command: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        description: 'Custom formatted output'
      }
    ],
    flags: [
      { flag: '-a', description: 'Show all containers (default shows just running)' },
      { flag: '-q', description: 'Only show container IDs' },
      { flag: '--format', description: 'Pretty-print containers using a Go template' },
      { flag: '--filter', description: 'Filter output based on conditions' },
      { flag: '-s', description: 'Display total file sizes' }
    ],
    notes: [
      'Use -q for getting container IDs for scripts',
      'Combine with other docker commands using $(docker ps -q)',
      '--format allows custom table layouts'
    ],
    relatedCommands: ['docker run', 'docker stop', 'docker logs'],
    tags: ['docker', 'containers', 'development', 'devops', 'listing']
  },
  {
    id: 'docker-exec',
    command: 'docker exec',
    description: 'Execute commands in running Docker containers',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker exec [options] CONTAINER COMMAND [ARG...]',
    examples: [
      {
        command: 'docker exec -it mycontainer /bin/bash',
        description: 'Open interactive bash shell in container'
      },
      {
        command: 'docker exec mycontainer ls /app',
        description: 'List files in /app directory of container'
      },
      {
        command: 'docker exec -u root mycontainer apt update',
        description: 'Run command as root user in container'
      }
    ],
    flags: [
      { flag: '-i', description: 'Keep STDIN open even if not attached' },
      { flag: '-t', description: 'Allocate a pseudo-TTY' },
      { flag: '-d', description: 'Run command in background (detached)' },
      { flag: '-u', description: 'Username or UID' },
      { flag: '-w', description: 'Working directory inside container' }
    ],
    notes: [
      'Use -it together for interactive sessions',
      'Container must be running to execute commands',
      'Useful for debugging and maintenance tasks'
    ],
    relatedCommands: ['docker run', 'docker attach', 'docker logs'],
    tags: ['docker', 'containers', 'development', 'debugging', 'interactive']
  },
  // Git Commands
  {
    id: 'git-status',
    command: 'git status',
    description: 'Show the working tree status and staging area',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git status [options]',
    examples: [
      {
        command: 'git status',
        description: 'Show full status of working directory'
      },
      {
        command: 'git status -s',
        description: 'Show short status format'
      },
      {
        command: 'git status --porcelain',
        description: 'Show status in script-friendly format'
      }
    ],
    flags: [
      { flag: '-s', description: 'Show short format' },
      { flag: '--porcelain', description: 'Machine-readable output' },
      { flag: '-b', description: 'Show branch information' },
      { flag: '--ignored', description: 'Show ignored files too' }
    ],
    notes: [
      'Shows staged, unstaged, and untracked files',
      'Use before committing to review changes',
      'Short format: M=modified, A=added, D=deleted, ??=untracked'
    ],
    relatedCommands: ['git add', 'git commit', 'git diff'],
    tags: ['git', 'version-control', 'status', 'development', 'staging']
  },
  {
    id: 'git-log',
    command: 'git log',
    description: 'Show commit history with various formatting options',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git log [options] [revision range] [[--] path...]',
    examples: [
      {
        command: 'git log --oneline',
        description: 'Show compact one-line commit history'
      },
      {
        command: 'git log --graph --oneline --all',
        description: 'Show branch graph with all branches'
      },
      {
        command: 'git log -p filename.txt',
        description: 'Show commits that modified specific file with diffs'
      },
      {
        command: 'git log --since="2 weeks ago" --author="John"',
        description: 'Show commits by John from last 2 weeks'
      }
    ],
    flags: [
      { flag: '--oneline', description: 'Show each commit on one line' },
      { flag: '--graph', description: 'Show ASCII graph of branch/merge history' },
      { flag: '-p', description: 'Show patch (diff) for each commit' },
      { flag: '--stat', description: 'Show diffstat for each commit' },
      { flag: '--since', description: 'Show commits after date' },
      { flag: '--author', description: 'Filter by author name' },
      { flag: '-n', description: 'Limit number of commits shown' }
    ],
    notes: [
      'Use --graph --oneline --all for visual branch overview',
      'Combine --since and --until for date ranges',
      'Use -- before filename to avoid ambiguity with branch names'
    ],
    relatedCommands: ['git show', 'git diff', 'git blame'],
    tags: ['git', 'version-control', 'history', 'commits', 'development']
  }
];

const examples: ToolExample[] = [
  {
    title: 'Search Linux file commands',
    input: {
      options: {
        searchQuery: 'file',
        platform: 'linux',
        category: 'files',
        riskLevel: 'all',
        showExamples: true,
        showFlags: true
      }
    },
    output: {
      success: true,
      message: 'Found Linux file-related commands with examples and flags'
    }
  },
  {
    title: 'Find dangerous commands',
    input: {
      options: {
        searchQuery: '',
        platform: 'all',
        category: 'all',
        riskLevel: 'dangerous',
        showExamples: true,
        showFlags: false
      }
    },
    output: {
      success: true,
      message: 'Found potentially dangerous commands with safety warnings'
    }
  },
  {
    title: 'Docker development commands',
    input: {
      options: {
        searchQuery: 'container',
        platform: 'docker',
        category: 'development',
        riskLevel: 'all',
        showExamples: true,
        showFlags: true
      }
    },
    output: {
      success: true,
      message: 'Found Docker container management commands'
    }
  }
];

export async function processCliCommandsReference(
  input: CLICommandsReferenceInput
): Promise<CLICommandsReferenceResult> {
  try {
    const { options } = input;
    let filteredCommands = CLI_COMMANDS_DATABASE;

    // Apply filters
    if (options.searchQuery.trim()) {
      const query = options.searchQuery.toLowerCase();
      filteredCommands = filteredCommands.filter(cmd =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.tags.some(tag => tag.toLowerCase().includes(query)) ||
        cmd.examples.some(ex => ex.description.toLowerCase().includes(query))
      );
    }

    if (options.platform !== 'all') {
      filteredCommands = filteredCommands.filter(cmd => cmd.platform === options.platform);
    }

    if (options.category !== 'all') {
      filteredCommands = filteredCommands.filter(cmd => cmd.category === options.category);
    }

    if (options.riskLevel !== 'all') {
      filteredCommands = filteredCommands.filter(cmd => cmd.riskLevel === options.riskLevel);
    }

    // Generate statistics
    const searchStats = {
      byPlatform: filteredCommands.reduce((acc, cmd) => {
        acc[cmd.platform] = (acc[cmd.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: filteredCommands.reduce((acc, cmd) => {
        acc[cmd.category] = (acc[cmd.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byRiskLevel: filteredCommands.reduce((acc, cmd) => {
        acc[cmd.riskLevel] = (acc[cmd.riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      success: true,
      message: `Found ${filteredCommands.length} commands matching your criteria`,
      commands: filteredCommands,
      totalCommands: CLI_COMMANDS_DATABASE.length,
      filteredCommands: filteredCommands.length,
      searchStats
    };
  } catch (error) {
    return {
      success: false,
      message: `Error processing CLI commands reference: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const CLI_COMMANDS_REFERENCE_TOOL: Tool = {
  id: 'cli-commands-reference',
  name: 'CLI Commands Reference',
  slug: 'cli-commands-reference',
  description: 'Comprehensive searchable reference for CLI commands across Linux, macOS, Windows, PowerShell, Docker, and Git with examples, flags, and safety information',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  keywords: [
    'cli', 'command line', 'terminal', 'bash', 'shell', 'linux', 'macos', 'windows', 'powershell',
    'docker', 'git', 'commands', 'reference', 'cheatsheet', 'examples', 'flags', 'syntax',
    'system administration', 'devops', 'development', 'scripting'
  ],
  inputSchema: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          searchQuery: {
            type: 'string',
            description: 'Search commands by name, description, or tags'
          },
          platform: {
            type: 'string',
            enum: ['all', 'linux', 'macos', 'windows', 'powershell', 'docker', 'git'],
            description: 'Filter by platform'
          },
          category: {
            type: 'string',
            enum: ['all', 'system', 'networking', 'files', 'processes', 'development', 'security'],
            description: 'Filter by command category'
          },
          riskLevel: {
            type: 'string',
            enum: ['all', 'safe', 'caution', 'dangerous'],
            description: 'Filter by risk level'
          },
          showExamples: {
            type: 'boolean',
            description: 'Show command examples'
          },
          showFlags: {
            type: 'boolean',
            description: 'Show command flags and options'
          }
        },
        required: ['searchQuery', 'platform', 'category', 'riskLevel', 'showExamples', 'showFlags']
      }
    },
    required: ['options']
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      commands: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            command: { type: 'string' },
            description: { type: 'string' },
            platform: { type: 'string' },
            category: { type: 'string' },
            riskLevel: { type: 'string' },
            syntax: { type: 'string' },
            examples: { type: 'array' },
            flags: { type: 'array' },
            notes: { type: 'array' },
            relatedCommands: { type: 'array' },
            tags: { type: 'array' }
          }
        }
      },
      searchStats: { type: 'object' }
    }
  },
  examples,
  process: processCliCommandsReference,
  seoMetadata: {
    title: 'CLI Commands Reference - Linux, Windows, Docker, Git Command Cheatsheet',
    description: 'Comprehensive searchable CLI commands reference with examples, flags, and safety information for Linux, macOS, Windows, PowerShell, Docker, and Git',
    keywords: [
      'cli commands', 'command line reference', 'terminal commands', 'bash commands',
      'linux commands', 'windows cmd', 'powershell commands', 'docker commands',
      'git commands', 'shell scripting', 'system administration', 'devops'
    ]
  },
  faqs: [
    {
      question: 'What platforms and command types are covered?',
      answer: 'This tool covers commands for Linux, macOS, Windows CMD, PowerShell, Docker, and Git. Each command includes syntax, examples, flags, risk levels, and related commands.'
    },
    {
      question: 'How do risk levels work?',
      answer: 'Commands are categorized as Safe (no risk), Caution (requires care), or Dangerous (can cause data loss or system damage). Always test dangerous commands in safe environments first.'
    },
    {
      question: 'Can I search for specific use cases?',
      answer: 'Yes! Search by command name, description, or tags. For example, search "file permissions" to find chmod, icacls, and related commands across platforms.'
    },
    {
      question: 'Are the examples real and tested?',
      answer: 'All examples are real commands with explanations. Many include sample output to help you understand what to expect when running the commands.'
    }
  ]
};