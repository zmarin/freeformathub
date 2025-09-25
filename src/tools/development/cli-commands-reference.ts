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

const linuxCommands: CLICommand[] = [
  {
    id: 'linux-ls',
    command: 'ls',
    description: 'List directory contents with flexible formatting options',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'ls [options] [directory]',
    examples: [
      {
        command: 'ls -la',
        description: 'List all files, including hidden ones, in long format',
        output: 'drwxr-xr-x  8 user user  4096 Jan 10 12:02 .\ndrwxr-xr-x 21 user user  4096 Jan 10 11:59 ..\n-rw-r--r--  1 user user 1240 Jan 10 11:58 README.md'
      },
      {
        command: 'ls -lh /var/log',
        description: 'Show file sizes in human-readable format within /var/log'
      },
      {
        command: 'ls -lt --color',
        description: 'Sort by modification time and colorize the output'
      }
    ],
    flags: [
      { flag: '-l', description: 'Long listing format with permissions, owners, and timestamps' },
      { flag: '-a', description: 'Include hidden files that start with a dot (.)' },
      { flag: '-h', description: 'Display file sizes in human-readable units' },
      { flag: '-t', description: 'Sort results by modification time' },
      { flag: '--color', description: 'Force colorized output when supported' }
    ],
    notes: [
      'Combine options like ls -lhat for a detailed, sorted view.',
      'Hidden files and folders begin with a dot and require -a to appear.',
      'Use ls --group-directories-first (GNU coreutils) to list folders before files.'
    ],
    relatedCommands: ['find', 'tree', 'stat', 'file'],
    tags: ['directory', 'listing', 'filesystem', 'permissions', 'sorting']
  },
  {
    id: 'linux-cd',
    command: 'cd',
    description: 'Change the current working directory',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'cd [directory]',
    examples: [
      {
        command: 'cd /var/www',
        description: 'Move into the /var/www directory'
      },
      {
        command: 'cd ..',
        description: 'Navigate to the parent directory'
      },
      {
        command: 'cd -',
        description: 'Toggle back to the previous working directory'
      }
    ],
    flags: [
      { flag: '..', description: 'Parent directory shortcut' },
      { flag: '~', description: 'Home directory shortcut (cd ~)' },
      { flag: '-', description: 'Switch to the previous directory' }
    ],
    notes: [
      'cd with no arguments returns to the user home directory.',
      'Use absolute paths for predictability in scripts.',
      'Pair with pwd to confirm the new working directory.'
    ],
    relatedCommands: ['pwd', 'ls', 'pushd', 'popd'],
    tags: ['navigation', 'directory', 'shell', 'filesystem']
  },
  {
    id: 'linux-pwd',
    command: 'pwd',
    description: 'Print the current working directory path',
    platform: 'linux',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'pwd',
    examples: [
      {
        command: 'pwd',
        description: 'Display the full path to the current directory'
      },
      {
        command: 'pwd -P',
        description: 'Resolve symbolic links and show the physical directory'
      }
    ],
    flags: [
      { flag: '-L', description: 'Print the logical path, preserving symbolic links (default)' },
      { flag: '-P', description: 'Print the physical path, resolving symbolic links' }
    ],
    notes: [
      'Useful in scripts to confirm context before running file operations.',
      'Pairs well with cd when navigating complex directory structures.'
    ],
    relatedCommands: ['cd', 'ls'],
    tags: ['shell', 'directory', 'path', 'context']
  },
  {
    id: 'linux-mkdir',
    command: 'mkdir',
    description: 'Create new directories',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'mkdir [options] directory',
    examples: [
      {
        command: 'mkdir logs',
        description: 'Create a directory named logs in the current location'
      },
      {
        command: 'mkdir -p releases/2024/01',
        description: 'Create nested directories if they do not yet exist'
      },
      {
        command: 'mkdir -m 750 private',
        description: 'Create a directory with custom permissions (rwxr-x---)'
      }
    ],
    flags: [
      { flag: '-p', description: 'Create parent directories as needed' },
      { flag: '-m', description: 'Set directory permissions (mode) on creation' },
      { flag: '-v', description: 'Print a message for each created directory' }
    ],
    notes: [
      'Use -p for idempotent directory creation in deployment scripts.',
      'Combine with install -d for advanced permission handling.'
    ],
    relatedCommands: ['rm', 'rmdir', 'install'],
    tags: ['directories', 'filesystem', 'scaffolding', 'automation']
  },
  {
    id: 'linux-rm',
    command: 'rm',
    description: 'Remove files or directories',
    platform: 'linux',
    category: 'files',
    riskLevel: 'dangerous',
    syntax: 'rm [options] file...',
    examples: [
      {
        command: 'rm error.log',
        description: 'Delete a single file'
      },
      {
        command: 'rm -i *.tmp',
        description: 'Interactively delete files matching the pattern'
      },
      {
        command: 'rm -rf node_modules',
        description: 'Forcefully delete a directory and its contents'
      }
    ],
    flags: [
      { flag: '-r', description: 'Recursively remove directories and their contents' },
      { flag: '-f', description: 'Ignore nonexistent files and never prompt' },
      { flag: '-i', description: 'Prompt before every removal' },
      { flag: '-d', description: 'Remove empty directories' },
      { flag: '--preserve-root', description: 'Protect the root directory from accidental deletion' }
    ],
    notes: [
      'Always double-check patterns before running rm -rf.',
      'Consider using trash-cli or safe-rm on shared systems.',
      'Combine with find -delete for controlled cleanups.'
    ],
    relatedCommands: ['find', 'unlink', 'rmdir', 'trash-put'],
    tags: ['delete', 'filesystem', 'cleanup', 'dangerous']
  },
  {
    id: 'linux-cp',
    command: 'cp',
    description: 'Copy files and directories',
    platform: 'linux',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'cp [options] source target',
    examples: [
      {
        command: 'cp config.example config.local',
        description: 'Copy a configuration template to a new file'
      },
      {
        command: 'cp -r public/ dist/',
        description: 'Recursively copy a directory tree'
      },
      {
        command: 'cp -a src/ backup/',
        description: 'Copy directories while preserving permissions and timestamps'
      }
    ],
    flags: [
      { flag: '-r', description: 'Copy directories recursively' },
      { flag: '-a', description: 'Archive mode: preserve attributes and symlinks' },
      { flag: '-i', description: 'Prompt before overwriting existing files' },
      { flag: '-u', description: 'Copy only when the source is newer' },
      { flag: '-v', description: 'Explain what is being done (verbose)' }
    ],
    notes: [
      'Archive mode (-a) is ideal for backups or deployments.',
      'Use rsync for long-running or resumable copy operations.',
      'Combine with glob patterns carefully to avoid unintended copies.'
    ],
    relatedCommands: ['mv', 'rsync', 'install'],
    tags: ['copy', 'filesystem', 'backup', 'deployment']
  },
  {
    id: 'linux-mv',
    command: 'mv',
    description: 'Move or rename files and directories',
    platform: 'linux',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'mv [options] source target',
    examples: [
      {
        command: 'mv draft.txt docs/final.txt',
        description: 'Move a file into a different directory with a new name'
      },
      {
        command: 'mv *.log archive/',
        description: 'Move multiple log files into an archive folder'
      },
      {
        command: 'mv -n config.json config.backup.json',
        description: 'Rename a file without overwriting if the target exists'
      }
    ],
    flags: [
      { flag: '-i', description: 'Prompt before overwrite' },
      { flag: '-n', description: 'Do not overwrite an existing file' },
      { flag: '-f', description: 'Force move by overwriting destination files' },
      { flag: '-v', description: 'Verbose output showing moves' }
    ],
    notes: [
      'mv acts as rename when source and destination are in the same directory.',
      'Use -n to guard against accidental overwrites.',
      'Combine with find -exec for bulk renaming workflows.'
    ],
    relatedCommands: ['cp', 'rename', 'rsync'],
    tags: ['move', 'rename', 'filesystem', 'cleanup']
  },
  {
    id: 'linux-touch',
    command: 'touch',
    description: 'Create empty files or update file timestamps',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'touch [options] file...',
    examples: [
      {
        command: 'touch newfile.txt',
        description: 'Create an empty file if it does not yet exist'
      },
      {
        command: 'touch -t 202401011200 release.txt',
        description: 'Set a specific timestamp (YYYYMMDDhhmm format)'
      },
      {
        command: 'find src -type f -exec touch {} +',
        description: 'Update timestamps for all files within src'
      }
    ],
    flags: [
      { flag: '-a', description: 'Change access time only' },
      { flag: '-m', description: 'Change modification time only' },
      { flag: '-t', description: 'Specify a custom timestamp' },
      { flag: '-c', description: 'Do not create files; only update existing ones' }
    ],
    notes: [
      'Touch is often used to trigger rebuilds or redeploys in watchers.',
      'Combine with make to manage dependency timestamps.'
    ],
    relatedCommands: ['stat', 'find', 'date'],
    tags: ['timestamps', 'filesystem', 'builds']
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
        command: 'grep -r "ERROR" logs/',
        description: 'Recursively search for the string ERROR in the logs directory'
      },
      {
        command: 'grep -n "TODO" src/app.js',
        description: 'Show line numbers for matches within a single file'
      },
      {
        command: 'grep -v "^#" config.conf',
        description: 'Print only lines that do not start with #' }
    ],
    flags: [
      { flag: '-r', description: 'Recursively search directories' },
      { flag: '-n', description: 'Print line numbers with matches' },
      { flag: '-i', description: 'Case-insensitive match' },
      { flag: '-v', description: 'Invert match to show non-matching lines' },
      { flag: '-E', description: 'Use extended regular expressions' }
    ],
    notes: [
      'Pipe other commands into grep to filter output (e.g., ps aux | grep nginx).',
      'Prefer ripgrep (rg) for large codebases when performance matters.',
      'Escape special regex characters or use fixed-string mode with -F.'
    ],
    relatedCommands: ['rg', 'awk', 'sed', 'find'],
    tags: ['search', 'regex', 'text', 'filtering']
  },
  {
    id: 'linux-find',
    command: 'find',
    description: 'Search for files and directories using flexible conditions',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'find [path] [expression]',
    examples: [
      {
        command: 'find . -name "*.ts" -maxdepth 2',
        description: 'Find TypeScript files within two directory levels'
      },
      {
        command: 'find /var/log -type f -mtime -7',
        description: 'Locate log files modified within the last seven days'
      },
      {
        command: 'find . -type f -size +100M -exec ls -lh {} \;',
        description: 'Find large files over 100MB and list their sizes'
      }
    ],
    flags: [
      { flag: '-name', description: 'Match files by name pattern (supports wildcards)' },
      { flag: '-type', description: 'Filter by type: f=file, d=directory, l=symlink' },
      { flag: '-mtime', description: 'Filter by modification time in days' },
      { flag: '-size', description: 'Filter by file size (+/- units)' },
      { flag: '-exec', description: 'Execute a command on each match' }
    ],
    notes: [
      'Quote patterns to prevent shell expansion before find sees them.',
      'Test destructive operations with -print before adding -delete.',
      'Combine with xargs for efficient batch processing.'
    ],
    relatedCommands: ['locate', 'fd', 'xargs', 'grep'],
    tags: ['search', 'filesystem', 'automation', 'scripting']
  },
  {
    id: 'linux-chmod',
    command: 'chmod',
    description: 'Change file or directory permissions',
    platform: 'linux',
    category: 'security',
    riskLevel: 'caution',
    syntax: 'chmod [options] mode file...',
    examples: [
      {
        command: 'chmod 644 report.txt',
        description: 'Set read/write for owner, read-only for group and others'
      },
      {
        command: 'chmod -R 755 public',
        description: 'Recursively set directories to rwxr-xr-x'
      },
      {
        command: 'chmod u+x deploy.sh',
        description: 'Make a script executable for the owner'
      }
    ],
    flags: [
      { flag: '-R', description: 'Apply changes recursively' },
      { flag: 'u/g/o', description: 'Target user, group, or others (symbolic mode)' },
      { flag: '+/-/=', description: 'Add, remove, or set permissions explicitly' },
      { flag: 'X', description: 'Execute only if target is a directory or already executable' }
    ],
    notes: [
      'Numeric modes (e.g., 755) are concise; symbolic modes are expressive.',
      'Beware of chmod 777 – it grants full access to everyone.',
      'Use chmod --reference=FILE to mirror permissions from another file.'
    ],
    relatedCommands: ['chown', 'umask', 'setfacl', 'stat'],
    tags: ['permissions', 'security', 'filesystem', 'ownership']
  },
  {
    id: 'linux-chown',
    command: 'chown',
    description: 'Change file ownership and group',
    platform: 'linux',
    category: 'security',
    riskLevel: 'caution',
    syntax: 'chown [options] owner[:group] file...',
    examples: [
      {
        command: 'sudo chown deploy:deploy /var/www/app',
        description: 'Assign both owner and group to the deploy user'
      },
      {
        command: 'sudo chown -R www-data:www-data public/',
        description: 'Recursively change ownership to www-data'
      },
      {
        command: 'sudo chown --from=root deploy config.yml',
        description: 'Change owner only if the current owner is root'
      }
    ],
    flags: [
      { flag: '-R', description: 'Apply changes recursively' },
      { flag: '--from', description: 'Only change ownership if current owner matches' },
      { flag: '--dereference', description: 'Affect the referenced file (not symlink)' },
      { flag: '--no-preserve-root', description: 'Allow recursive changes on / (not recommended)' }
    ],
    notes: [
      'Requires elevated privileges for system-owned files.',
      'Use stat or ls -l to confirm ownership changes.',
      'Combine with chmod to fully fix permission issues.'
    ],
    relatedCommands: ['chmod', 'chgrp', 'stat', 'sudo'],
    tags: ['ownership', 'permissions', 'security', 'filesystem']
  },
  {
    id: 'linux-tar',
    command: 'tar',
    description: 'Archive and extract files with tarballs',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'tar [options] file...',
    examples: [
      {
        command: 'tar -czf backup.tar.gz project/',
        description: 'Create a gzip-compressed archive of the project directory'
      },
      {
        command: 'tar -xvf backup.tar.gz -C /tmp/restore',
        description: 'Extract an archive into /tmp/restore'
      },
      {
        command: 'tar -tzf backup.tar.gz',
        description: 'List archive contents without extracting'
      }
    ],
    flags: [
      { flag: '-c', description: 'Create a new archive' },
      { flag: '-x', description: 'Extract files from an archive' },
      { flag: '-t', description: 'List archive contents' },
      { flag: '-z', description: 'Filter archive through gzip' },
      { flag: '-f', description: 'Name the archive file to operate on' }
    ],
    notes: [
      'Combine with --exclude to skip unnecessary files.',
      'Use pigz for faster parallel gzip compression.',
      'tar archives can be streamed over SSH for remote backups.'
    ],
    relatedCommands: ['gzip', 'zip', 'rsync', 'scp'],
    tags: ['archive', 'compression', 'backup', 'deployment']
  },
  {
    id: 'linux-tail',
    command: 'tail',
    description: 'Output the end of files, optionally following updates',
    platform: 'linux',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'tail [options] file',
    examples: [
      {
        command: 'tail -n 20 access.log',
        description: 'Show the last 20 lines of a log file'
      },
      {
        command: 'tail -f -n 100 app.log',
        description: 'Follow a growing log file, starting with the last 100 lines'
      },
      {
        command: 'tail -F /var/log/nginx/error.log',
        description: 'Follow a log and retry if the file is rotated'
      }
    ],
    flags: [
      { flag: '-n', description: 'Number of lines to display (default 10)' },
      { flag: '-f', description: 'Output appended data as the file grows' },
      { flag: '-F', description: 'Follow by name, retrying when the file is rotated' },
      { flag: '-c', description: 'Output bytes instead of lines' }
    ],
    notes: [
      'Combine with grep to watch for specific patterns in real time.',
      'Use multitail or lnav for richer log viewing experiences.'
    ],
    relatedCommands: ['head', 'less', 'multitail', 'journalctl'],
    tags: ['logs', 'monitoring', 'debugging', 'streaming']
  },
  {
    id: 'linux-df',
    command: 'df',
    description: 'Report file system disk space usage',
    platform: 'linux',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'df [options] [file]',
    examples: [
      {
        command: 'df -h',
        description: 'Show disk usage in human-readable units'
      },
      {
        command: 'df -hT',
        description: 'Include file system type along with usage statistics'
      },
      {
        command: 'df -i',
        description: 'Show inode usage instead of block usage'
      }
    ],
    flags: [
      { flag: '-h', description: 'Human-readable sizes (e.g., 1G, 500M)' },
      { flag: '-T', description: 'Display file system type' },
      { flag: '-i', description: 'Show inode information' },
      { flag: '--total', description: 'Produce a grand total' }
    ],
    notes: [
      'Monitoring inode exhaustion is crucial on servers with many small files.',
      'Combine with du for directory-level breakdowns.'
    ],
    relatedCommands: ['du', 'lsblk', 'mount'],
    tags: ['storage', 'monitoring', 'filesystem']
  },
  {
    id: 'linux-du',
    command: 'du',
    description: 'Estimate file and directory space usage',
    platform: 'linux',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'du [options] [file...]',
    examples: [
      {
        command: 'du -sh *',
        description: 'Summarize disk usage for items in current directory'
      },
      {
        command: 'du -h --max-depth=2 /var',
        description: 'Show directory sizes for /var up to depth 2'
      },
      {
        command: 'du -hc logs/',
        description: 'Summarize logs directory with a grand total'
      }
    ],
    flags: [
      { flag: '-s', description: 'Show only the total for each argument' },
      { flag: '-h', description: 'Human-readable sizes' },
      { flag: '--max-depth', description: 'Limit recursion depth' },
      { flag: '-c', description: 'Show a grand total' }
    ],
    notes: [
      'Use du -sh . to quickly gauge the size of a project.',
      'ncdu provides an interactive view for cleanup tasks.'
    ],
    relatedCommands: ['df', 'ls', 'ncdu'],
    tags: ['storage', 'analysis', 'filesystem', 'cleanup']
  },
  {
    id: 'linux-ip',
    command: 'ip',
    description: 'Show and configure IP networking, routing, and tunnels',
    platform: 'linux',
    category: 'networking',
    riskLevel: 'caution',
    syntax: 'ip [options] OBJECT COMMAND',
    examples: [
      {
        command: 'ip addr show',
        description: 'Display IP addresses and interface details'
      },
      {
        command: 'ip route',
        description: 'Show routing table entries'
      },
      {
        command: 'sudo ip link set eth0 up',
        description: 'Bring the eth0 interface online'
      }
    ],
    flags: [
      { flag: 'addr', description: 'Operate on IPv4/IPv6 addresses' },
      { flag: 'link', description: 'Operate on network interfaces' },
      { flag: 'route', description: 'Manage routing table entries' },
      { flag: 'neigh', description: 'Manage ARP/neighbor table entries' },
      { flag: '-s', description: 'Provide more detailed statistics' }
    ],
    notes: [
      'Replaces older ifconfig/route/netstat utilities.',
      'Configuration changes may not persist across reboots without network scripts.',
      'Requires sudo for link up/down or route changes.'
    ],
    relatedCommands: ['ifconfig', 'ss', 'ping', 'ethtool'],
    tags: ['network', 'interfaces', 'routing', 'diagnostics']
  },
  {
    id: 'linux-ping',
    command: 'ping',
    description: 'Check network connectivity to a host',
    platform: 'linux',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'ping [options] host',
    examples: [
      {
        command: 'ping google.com',
        description: 'Send ICMP echo requests until interrupted'
      },
      {
        command: 'ping -c 5 192.168.1.1',
        description: 'Send exactly five packets to a local router'
      },
      {
        command: 'ping -I eth0 internal.example.com',
        description: 'Send packets using a specific network interface'
      }
    ],
    flags: [
      { flag: '-c', description: 'Stop after sending count packets' },
      { flag: '-i', description: 'Interval between packets in seconds' },
      { flag: '-I', description: 'Bind to a specific interface' },
      { flag: '-W', description: 'Timeout before concluding no reply' }
    ],
    notes: [
      'Requires CAP_NET_RAW capabilities; run with sudo when necessary.',
      'Use fping or nping for batch or advanced scenarios.'
    ],
    relatedCommands: ['traceroute', 'mtr', 'nc', 'telnet'],
    tags: ['network', 'latency', 'diagnostics', 'connectivity']
  },
  {
    id: 'linux-curl',
    command: 'curl',
    description: 'Transfer data to or from a server using many protocols',
    platform: 'linux',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'curl [options] [url]',
    examples: [
      {
        command: 'curl -I https://freeformathub.com',
        description: 'Fetch HTTP response headers only'
      },
      {
        command: 'curl -L -o archive.zip https://example.com/file.zip',
        description: 'Follow redirects and download to a specific filename'
      },
      {
        command: 'curl -X POST -H "Content-Type: application/json" -d "{\"name\":\"cli\"}" https://api.test.dev/users',
        description: 'Send JSON data in a POST request'
      }
    ],
    flags: [
      { flag: '-L', description: 'Follow HTTP redirects' },
      { flag: '-H', description: 'Add custom headers to the request' },
      { flag: '-d', description: 'Send data in POST requests' },
      { flag: '-o', description: 'Write output to file instead of stdout' },
      { flag: '-u', description: 'Supply user:password credentials' }
    ],
    notes: [
      'curl --help all prints protocol-specific switches.',
      'Use --fail-with-body to exit non-zero without printing HTML error pages.',
      'Pairs nicely with jq for parsing JSON responses.'
    ],
    relatedCommands: ['wget', 'httpie', 'wget2', 'scp'],
    tags: ['http', 'api', 'network', 'debugging', 'automation']
  },
  {
    id: 'linux-ssh',
    command: 'ssh',
    description: 'Connect securely to remote machines or execute remote commands',
    platform: 'linux',
    category: 'networking',
    riskLevel: 'caution',
    syntax: 'ssh [options] user@host [command]',
    examples: [
      {
        command: 'ssh user@server.example.com',
        description: 'Open a shell session on a remote server'
      },
      {
        command: 'ssh -i ~/.ssh/id_ed25519 deploy@prod -- "sudo systemctl restart app"',
        description: 'Run a remote command through SSH using a specific key'
      },
      {
        command: 'ssh -L 8080:localhost:3000 user@jump-host',
        description: 'Forward local port 8080 to remote localhost:3000'
      }
    ],
    flags: [
      { flag: '-i', description: 'Use a specific private key file' },
      { flag: '-L', description: 'Forward local port to remote destination' },
      { flag: '-R', description: 'Forward remote port to local destination' },
      { flag: '-p', description: 'Connect using a non-default port' },
      { flag: '-J', description: 'Connect via a jump host (ProxyJump)' }
    ],
    notes: [
      'Configure connection shortcuts in ~/.ssh/config.',
      'Use ControlMaster multiplexing to reuse sessions for speed.',
      'Combine with ssh-copy-id to install public keys on servers.'
    ],
    relatedCommands: ['scp', 'sftp', 'ssh-keygen', 'mosh'],
    tags: ['remote', 'security', 'tunneling', 'automation']
  },
  {
    id: 'linux-journalctl',
    command: 'journalctl',
    description: 'Query and view logs managed by systemd journal',
    platform: 'linux',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'journalctl [options]',
    examples: [
      {
        command: 'journalctl -u nginx --since "1 hour ago"',
        description: 'View nginx service logs from the past hour'
      },
      {
        command: 'journalctl -f',
        description: 'Follow the journal in real-time'
      },
      {
        command: 'journalctl --disk-usage',
        description: 'Report disk usage consumed by the journal'
      }
    ],
    flags: [
      { flag: '-u', description: 'Filter logs by systemd unit' },
      { flag: '-f', description: 'Follow new log entries' },
      { flag: '--since/--until', description: 'Limit logs by time window' },
      { flag: '-p', description: 'Filter by priority (e.g., warning)' },
      { flag: '--output', description: 'Control output format (json, short, cat, etc.)' }
    ],
    notes: [
      'journalctl requires sudo for system-level unit logs.',
      'Use journalctl --user for user-level service logs.',
      'Vacuum old logs with journalctl --vacuum-time=7d to reclaim space.'
    ],
    relatedCommands: ['systemctl', 'tail', 'less', 'logger'],
    tags: ['logs', 'systemd', 'monitoring', 'debugging']
  },
  {
    id: 'linux-systemctl',
    command: 'systemctl',
    description: 'Control and inspect systemd services and units',
    platform: 'linux',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'systemctl [command] [unit]',
    examples: [
      {
        command: 'sudo systemctl status nginx',
        description: 'Check status and recent logs for nginx service'
      },
      {
        command: 'sudo systemctl restart nginx',
        description: 'Restart a service and reload configuration'
      },
      {
        command: 'sudo systemctl enable nginx',
        description: 'Enable nginx to start automatically on boot'
      }
    ],
    flags: [
      { flag: 'status', description: 'Show service status and recent log messages' },
      { flag: 'start/stop/restart', description: 'Manage lifecycle of a service' },
      { flag: 'enable/disable', description: 'Configure whether a service starts at boot' },
      { flag: 'list-units', description: 'List active units' },
      { flag: '--user', description: 'Operate on user-level services' }
    ],
    notes: [
      'Requires sudo for managing system services.',
      'Use systemctl daemon-reload after editing unit files.',
      'Combine with journalctl -u service for troubleshooting.'
    ],
    relatedCommands: ['journalctl', 'service', 'loginctl'],
    tags: ['systemd', 'services', 'boot', 'management']
  },
  {
    id: 'linux-top',
    command: 'top',
    description: 'Display dynamic real-time view of running processes',
    platform: 'linux',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'top [options]',
    examples: [
      {
        command: 'top',
        description: 'Show continuously updating process list'
      },
      {
        command: 'top -p $(pgrep node)',
        description: 'Monitor only Node.js processes'
      },
      {
        command: 'top -d 1',
        description: 'Refresh the display every second'
      }
    ],
    flags: [
      { flag: '-p', description: 'Monitor specific PIDs only' },
      { flag: '-d', description: 'Delay between screen updates' },
      { flag: '-u', description: 'Show processes for a specific user' }
    ],
    notes: [
      'Interactive commands: press h for help, k to kill, r to renice.',
      'htop offers a more user-friendly alternative with mouse support.'
    ],
    relatedCommands: ['htop', 'ps', 'vmstat', 'nmon'],
    tags: ['monitoring', 'processes', 'performance', 'system']
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
        description: 'Show processes for all users with detailed information'
      },
      {
        command: 'ps -ef | grep nginx',
        description: 'Find nginx-related processes'
      },
      {
        command: 'ps -eo pid,cmd,%cpu,%mem --sort=-%cpu | head',
        description: 'Show top CPU-consuming processes'
      }
    ],
    flags: [
      { flag: 'aux', description: 'Display processes from all users in BSD style output' },
      { flag: '-ef', description: 'Show processes in full-format listing and include headers' },
      { flag: '--forest', description: 'Display hierarchical process tree' },
      { flag: '-o', description: 'Customize output format by columns' }
    ],
    notes: [
      'Use ps aux | grep pattern to find specific processes.',
      'Combine with watch for periodic refresh: watch -n1 ps aux --sort=-%cpu.'
    ],
    relatedCommands: ['top', 'htop', 'pgrep', 'pkill'],
    tags: ['processes', 'monitoring', 'analysis']
  },
  {
    id: 'linux-kill',
    command: 'kill',
    description: 'Send signals to processes, often to terminate them',
    platform: 'linux',
    category: 'processes',
    riskLevel: 'dangerous',
    syntax: 'kill [signal] pid...',
    examples: [
      {
        command: 'kill 1234',
        description: 'Request graceful termination of process 1234'
      },
      {
        command: 'kill -9 1234',
        description: 'Forcefully terminate a process that ignores normal signals'
      },
      {
        command: 'pkill -f "node server.js"',
        description: 'Send SIGTERM to processes matching the pattern'
      }
    ],
    flags: [
      { flag: '-9', description: 'SIGKILL – Force kill without cleanup' },
      { flag: '-15', description: 'SIGTERM – Default graceful termination' },
      { flag: '-HUP', description: 'SIGHUP – Reload configuration for many daemons' },
      { flag: '-STOP/-CONT', description: 'Pause and resume process execution' }
    ],
    notes: [
      'Always try SIGTERM before SIGKILL to allow clean shutdown.',
      'Use kill -l to list all available signals.',
      'Combine with pgrep/ps to locate PIDs safely.'
    ],
    relatedCommands: ['pkill', 'killall', 'ps', 'systemctl'],
    tags: ['signals', 'processes', 'troubleshooting', 'dangerous']
  }
];

const macosCommands: CLICommand[] = [
  {
    id: 'macos-open',
    command: 'open',
    description: 'Open files, directories, or URLs using the default macOS handler',
    platform: 'macos',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'open [options] target',
    examples: [
      {
        command: 'open /Applications',
        description: 'Reveal the Applications folder in Finder'
      },
      {
        command: 'open https://freeformathub.com',
        description: 'Launch the default browser to a URL'
      },
      {
        command: 'open -a "Visual Studio Code" project/',
        description: 'Open a specific app with the provided directory'
      }
    ],
    flags: [
      { flag: '-a', description: 'Specify which application to use when opening' },
      { flag: '-R', description: 'Reveal the file in Finder instead of opening it' },
      { flag: '-n', description: 'Open a new instance of the application' },
      { flag: '-g', description: 'Open without bringing the application to the foreground' },
      { flag: '-u', description: 'Pass a URL to the application' }
    ],
    notes: [
      'Use open . to view the current directory in Finder.',
      'Combine with -a Terminal . to open a path in a specific terminal emulator.'
    ],
    relatedCommands: ['say', 'osascript', 'qlmanage'],
    tags: ['finder', 'automation', 'workflow', 'apps']
  },
  {
    id: 'macos-brew',
    command: 'brew',
    description: 'Manage packages, casks, and taps with Homebrew',
    platform: 'macos',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'brew [command] [package]',
    examples: [
      {
        command: 'brew update && brew upgrade',
        description: 'Refresh formulae metadata and upgrade installed packages'
      },
      {
        command: 'brew install node',
        description: 'Install a package from the Homebrew core tap'
      },
      {
        command: 'brew list --cask',
        description: 'List installed GUI applications managed via casks'
      }
    ],
    flags: [
      { flag: 'install', description: 'Install a package or cask' },
      { flag: 'upgrade', description: 'Upgrade installed packages to latest versions' },
      { flag: 'cleanup', description: 'Remove old downloads and outdated package files' },
      { flag: 'doctor', description: 'Check system for common issues' },
      { flag: '--cask', description: 'Operate on macOS applications distributed as casks' }
    ],
    notes: [
      'Use brew bundle dump to snapshot installed packages.',
      'Install Homebrew to /opt/homebrew on Apple Silicon for best compatibility.'
    ],
    relatedCommands: ['port', 'npm', 'pip'],
    tags: ['package-manager', 'development', 'automation', 'mac']
  },
  {
    id: 'macos-defaults',
    command: 'defaults',
    description: 'Read and write macOS user defaults (plist) settings',
    platform: 'macos',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'defaults [command] domain [key] [value]',
    examples: [
      {
        command: 'defaults read com.apple.finder AppleShowAllFiles',
        description: 'Check whether Finder shows hidden files'
      },
      {
        command: 'defaults write com.apple.finder AppleShowAllFiles -bool true && killall Finder',
        description: 'Show hidden files in Finder and restart it'
      },
      {
        command: 'defaults delete NSGlobalDomain NSAutomaticSpellingCorrectionEnabled',
        description: 'Remove a setting and revert to default behavior'
      }
    ],
    flags: [
      { flag: 'read', description: 'Read the value for a domain/key' },
      { flag: 'write', description: 'Set the value for a domain/key' },
      { flag: 'delete', description: 'Remove a key or entire domain' },
      { flag: '-g', description: 'Use the global domain (NSGlobalDomain)' }
    ],
    notes: [
      'Always back up settings before making bulk edits.',
      'Many changes require restarting the target app or using killall to reload preferences.'
    ],
    relatedCommands: ['plutil', 'killall', 'scutil'],
    tags: ['preferences', 'automation', 'scripting', 'customization']
  },
  {
    id: 'macos-softwareupdate',
    command: 'softwareupdate',
    description: 'Manage macOS updates from the command line',
    platform: 'macos',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'softwareupdate [options]',
    examples: [
      {
        command: 'softwareupdate -l',
        description: 'List available macOS updates'
      },
      {
        command: 'sudo softwareupdate -i -a',
        description: 'Install all available updates'
      },
      {
        command: 'sudo softwareupdate --install-rosetta',
        description: 'Install Rosetta 2 for running Intel apps on Apple Silicon'
      }
    ],
    flags: [
      { flag: '-l', description: 'List available updates' },
      { flag: '-i', description: 'Install specified update(s)' },
      { flag: '-a', description: 'Apply to all available updates' },
      { flag: '--background', description: 'Download updates without installing' },
      { flag: '--install-rosetta', description: 'Install Rosetta translation layer' }
    ],
    notes: [
      'Requires sudo for installing system updates.',
      'Combine with --restart to reboot automatically after installing updates.'
    ],
    relatedCommands: ['system_profiler', 'sw_vers', 'pkgutil'],
    tags: ['updates', 'maintenance', 'macos', 'system']
  },
  {
    id: 'macos-diskutil',
    command: 'diskutil',
    description: 'Inspect and manage disks, partitions, and volumes',
    platform: 'macos',
    category: 'system',
    riskLevel: 'dangerous',
    syntax: 'diskutil [verb] [options]',
    examples: [
      {
        command: 'diskutil list',
        description: 'List all disks and volumes'
      },
      {
        command: 'diskutil eraseDisk APFS "FastStorage" disk2',
        description: 'Erase a disk and create a new APFS container'
      },
      {
        command: 'diskutil repairPermissions /',
        description: 'Repair permissions on the system volume (pre-El Capitan)'
      }
    ],
    flags: [
      { flag: 'list', description: 'Display attached disks and partitions' },
      { flag: 'info', description: 'Show detailed info about a disk or volume' },
      { flag: 'eraseDisk', description: 'Erase and repartition an entire disk' },
      { flag: 'apfs addVolume', description: 'Add APFS volumes to an existing container' },
      { flag: 'mount/umount', description: 'Mount or unmount a disk or volume' }
    ],
    notes: [
      'Double-check disk identifiers before destructive operations.',
      'APFS snapshots can be managed via diskutil apfs listSnapshots.'
    ],
    relatedCommands: ['hdiutil', 'mount', 'fsck'],
    tags: ['storage', 'partitions', 'dangerous', 'administration']
  },
  {
    id: 'macos-spctl',
    command: 'spctl',
    description: 'Manage Gatekeeper security policy for launching apps',
    platform: 'macos',
    category: 'security',
    riskLevel: 'caution',
    syntax: 'spctl [options]',
    examples: [
      {
        command: 'spctl --status',
        description: 'Check whether Gatekeeper is enforcing signing requirements'
      },
      {
        command: 'sudo spctl --master-disable',
        description: 'Allow apps from anywhere (disables Gatekeeper)'
      },
      {
        command: 'sudo spctl --add --label "Trusted" /Applications/MyApp.app',
        description: 'Whitelist a specific app for launching'
      }
    ],
    flags: [
      { flag: '--status', description: 'Display current Gatekeeper status' },
      { flag: '--master-enable/--master-disable', description: 'Enable or disable Gatekeeper globally' },
      { flag: '--add', description: 'Add an app to the allow list' },
      { flag: '--list', description: 'List existing rules and labels' }
    ],
    notes: [
      'Disabling Gatekeeper reduces system security—re-enable after troubleshooting.',
      'Use spctl --assess -vv path to analyze why an app is blocked.'
    ],
    relatedCommands: ['codesign', 'xattr', 'security'],
    tags: ['gatekeeper', 'security', 'apps', 'policy']
  },
  {
    id: 'macos-pmset',
    command: 'pmset',
    description: 'Configure power management settings',
    platform: 'macos',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'pmset [options]',
    examples: [
      {
        command: 'pmset -g',
        description: 'Display current power management settings'
      },
      {
        command: 'sudo pmset sleep 0',
        description: 'Disable system sleep entirely'
      },
      {
        command: 'sudo pmset -a displaysleep 10 disksleep 15',
        description: 'Set display sleep to 10 minutes and disk sleep to 15 minutes'
      }
    ],
    flags: [
      { flag: '-g', description: 'Show current power settings' },
      { flag: '-a', description: 'Apply settings to all power sources' },
      { flag: '-b', description: 'Apply settings when on battery' },
      { flag: '-c', description: 'Apply settings when on charger' },
      { flag: 'sleep/displaysleep', description: 'Set sleep timers in minutes' }
    ],
    notes: [
      'Requires sudo for modifying system-wide power settings.',
      'Reset to defaults with pmset restoredefaults after experimentation.'
    ],
    relatedCommands: ['caffeinate', 'pmtool', 'system_profiler'],
    tags: ['power', 'battery', 'energy', 'configuration']
  },
  {
    id: 'macos-system-profiler',
    command: 'system_profiler',
    description: 'Generate detailed hardware and software reports',
    platform: 'macos',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'system_profiler [datatype] [options]',
    examples: [
      {
        command: 'system_profiler SPHardwareDataType',
        description: 'Show CPU, memory, and hardware identifiers'
      },
      {
        command: 'system_profiler SPApplicationsDataType | grep -B2 -A2 "Xcode"',
        description: 'Find details about the Xcode installation'
      },
      {
        command: 'system_profiler -detailLevel mini > report.txt',
        description: 'Export a concise system report to a file'
      }
    ],
    flags: [
      { flag: '-detailLevel', description: 'Control report verbosity (mini, basic, full)' },
      { flag: '-xml', description: 'Output results as XML' },
      { flag: 'datatype', description: 'Request specific data types (SPUSBDataType, etc.)' }
    ],
    notes: [
      'Reports help troubleshoot hardware compatibility issues.',
      'Use with sudo for information requiring elevated access.'
    ],
    relatedCommands: ['sw_vers', 'systeminfo', 'lshw'],
    tags: ['hardware', 'inventory', 'diagnostics', 'reporting']
  },
  {
    id: 'macos-pbcopy',
    command: 'pbcopy',
    description: 'Copy stdin data to the macOS clipboard',
    platform: 'macos',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'pbcopy [options]',
    examples: [
      {
        command: 'cat ~/.ssh/id_rsa.pub | pbcopy',
        description: 'Copy a public SSH key to the clipboard'
      },
      {
        command: 'pbcopy < config.json',
        description: 'Copy file contents without intermediate editors'
      },
      {
        command: 'echo "Deployment complete" | pbcopy',
        description: 'Copy arbitrary text from shell output'
      }
    ],
    flags: [
      { flag: '-Prefer', description: 'Specify the data type (txt, rtf, ps)' }
    ],
    notes: [
      'Use pbpaste to retrieve clipboard contents in scripts.',
      'Combines well with jq or sed for quick text transformations.'
    ],
    relatedCommands: ['pbpaste', 'clip', 'xclip'],
    tags: ['clipboard', 'automation', 'text', 'workflow']
  },
  {
    id: 'macos-say',
    command: 'say',
    description: 'Convert text to audible speech or audio files',
    platform: 'macos',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'say [options] [string]',
    examples: [
      {
        command: 'say "Build complete"',
        description: 'Announce a spoken message'
      },
      {
        command: 'say -v Ava "Welcome to FreeFormatHub"',
        description: 'Use a specific voice when speaking'
      },
      {
        command: 'say -o reminder.aiff "Stand up and stretch"',
        description: 'Export spoken text to an audio file'
      }
    ],
    flags: [
      { flag: '-v', description: 'Choose a voice' },
      { flag: '-r', description: 'Set speech rate in words per minute' },
      { flag: '-o', description: 'Write audio output to a file' }
    ],
    notes: [
      'Automate notifications by chaining say with build scripts.',
      'List available voices with say -v ?.'
    ],
    relatedCommands: ['afplay', 'osascript', 'open'],
    tags: ['tts', 'automation', 'notifications']
  }
];

const windowsCommands: CLICommand[] = [
  {
    id: 'windows-dir',
    command: 'dir',
    description: 'List files and directories in the current location',
    platform: 'windows',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'dir [drive:][path][filename] [options]',
    examples: [
      {
        command: 'dir',
        description: 'List files in the current directory'
      },
      {
        command: 'dir *.log /s',
        description: 'Search recursively for .log files'
      },
      {
        command: 'dir /o:-d',
        description: 'Sort results by date in descending order'
      }
    ],
    flags: [
      { flag: '/a', description: 'Show files with specified attributes (H, S, D)' },
      { flag: '/s', description: 'Display files in specified directory and subdirectories' },
      { flag: '/b', description: 'Use bare format (names only)' },
      { flag: '/o:<sortorder>', description: 'Sort by name, size, date, etc.' },
      { flag: '/p', description: 'Pause after each screen of information' }
    ],
    notes: [
      'Combine with clip for clipboard usage: dir | clip.',
      'Use wildcards to match multiple files quickly.'
    ],
    relatedCommands: ['tree', 'where', 'forfiles'],
    tags: ['listing', 'filesystem', 'navigation']
  },
  {
    id: 'windows-cd',
    command: 'cd',
    description: 'Change the current working directory',
    platform: 'windows',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'cd [/d] [drive:][path]',
    examples: [
      {
        command: 'cd C:\\Projects',
        description: 'Switch to a specific directory on drive C'
      },
      {
        command: 'cd /d D:\\Logs',
        description: 'Change drive and directory simultaneously'
      },
      {
        command: 'cd ..',
        description: 'Move up one directory level'
      }
    ],
    flags: [
      { flag: '/d', description: 'Change the current drive in addition to the directory' },
      { flag: '..', description: 'Navigate to the parent directory' },
      { flag: '\\', description: 'Quickly jump to the root of the current drive' }
    ],
    notes: [
      'Use pushd/popd for stack-based navigation.',
      'Case-insensitive but path separators must be escaped in scripts.'
    ],
    relatedCommands: ['pushd', 'popd', 'dir'],
    tags: ['navigation', 'filesystem', 'shell']
  },
  {
    id: 'windows-copy',
    command: 'copy',
    description: 'Copy files from one location to another',
    platform: 'windows',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'copy [/y | /-y] source [source2 ...] destination',
    examples: [
      {
        command: 'copy config.sample config.ini',
        description: 'Copy a single file and rename it'
      },
      {
        command: 'copy /y *.txt backup\\',
        description: 'Copy all .txt files into the backup directory, overwriting existing files'
      },
      {
        command: 'copy /b image1.jpg + image2.jpg combined.jpg',
        description: 'Concatenate binary files (advanced usage)'
      }
    ],
    flags: [
      { flag: '/y', description: 'Suppress prompts when overwriting existing files' },
      { flag: '/-y', description: 'Prompt before overwriting' },
      { flag: '/a', description: 'Text mode copy; stops at Ctrl+Z' },
      { flag: '/b', description: 'Binary mode copy; copy entire file' }
    ],
    notes: [
      'For directories or advanced scenarios use robocopy instead.',
      'Supports copying multiple files to a single destination.'
    ],
    relatedCommands: ['xcopy', 'robocopy', 'move'],
    tags: ['copy', 'filesystem', 'windows', 'backup']
  },
  {
    id: 'windows-move',
    command: 'move',
    description: 'Move files or rename directories',
    platform: 'windows',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'move [/y | /-y] source destination',
    examples: [
      {
        command: 'move report.txt archive\\',
        description: 'Move a file into the archive directory'
      },
      {
        command: 'move /-y *.log Logs\\',
        description: 'Move and prompt before overwriting duplicates'
      },
      {
        command: 'move build build-old',
        description: 'Rename a directory'
      }
    ],
    flags: [
      { flag: '/y', description: 'Suppress overwrite prompts' },
      { flag: '/-y', description: 'Prompt before overwrite' }
    ],
    notes: [
      'Wildcard expansion is handled by CMD, not move itself.',
      'Use robocopy /move for large directory migrations.'
    ],
    relatedCommands: ['copy', 'rename', 'robocopy'],
    tags: ['rename', 'filesystem', 'organization']
  },
  {
    id: 'windows-del',
    command: 'del',
    description: 'Delete files from the command prompt',
    platform: 'windows',
    category: 'files',
    riskLevel: 'dangerous',
    syntax: 'del [/p] [/f] [/s] [/q] [/a[:attributes]] names',
    examples: [
      {
        command: 'del /p temp.txt',
        description: 'Delete a file with confirmation'
      },
      {
        command: 'del /s /q *.tmp',
        description: 'Silently delete .tmp files from current tree'
      },
      {
        command: 'del /a:h secret.txt',
        description: 'Delete a hidden file'
      }
    ],
    flags: [
      { flag: '/q', description: 'Quiet mode; do not prompt for confirmation' },
      { flag: '/s', description: 'Delete specified files from all subdirectories' },
      { flag: '/f', description: 'Force deletion of read-only files' },
      { flag: '/p', description: 'Prompt for confirmation before each file' },
      { flag: '/a', description: 'Select files based on attributes (R, H, S)' }
    ],
    notes: [
      'Use recycle.exe or PowerShell Remove-Item -Confirm for safer deletions.',
      'Deletion cannot be undone—double-check paths and wildcards.'
    ],
    relatedCommands: ['erase', 'rd', 'PowerShell Remove-Item'],
    tags: ['delete', 'cleanup', 'dangerous', 'filesystem']
  },
  {
    id: 'windows-md',
    command: 'mkdir',
    description: 'Create directories from the command prompt',
    platform: 'windows',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'mkdir directoryName',
    examples: [
      {
        command: 'mkdir builds',
        description: 'Create a directory named builds'
      },
      {
        command: 'mkdir C:\\Logs\\2024\\01',
        description: 'Create a nested folder structure in a single command'
      },
      {
        command: 'mkdir "My Documents"',
        description: 'Create a directory containing spaces in its name'
      }
    ],
    flags: [
      { flag: 'md', description: 'Alias for mkdir that behaves identically' }
    ],
    notes: [
      'Directories are created recursively without needing extra switches.',
      'Use quotes when paths contain spaces.'
    ],
    relatedCommands: ['rd', 'attrib', 'dir'],
    tags: ['directories', 'scaffolding', 'filesystem']
  },
  {
    id: 'windows-ipconfig',
    command: 'ipconfig',
    description: 'Display network configuration and refresh DHCP leases',
    platform: 'windows',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'ipconfig [options]',
    examples: [
      {
        command: 'ipconfig',
        description: 'Display summary of IPv4 and IPv6 addresses'
      },
      {
        command: 'ipconfig /all',
        description: 'Show full network configuration details'
      },
      {
        command: 'ipconfig /release && ipconfig /renew',
        description: 'Release and renew DHCP leases'
      }
    ],
    flags: [
      { flag: '/all', description: 'Display full TCP/IP configuration' },
      { flag: '/flushdns', description: 'Clear the DNS resolver cache' },
      { flag: '/release', description: 'Release current DHCP leases' },
      { flag: '/renew', description: 'Renew DHCP leases' }
    ],
    notes: [
      'Run CMD as administrator for flushdns operations.',
      'Pair with nslookup for DNS troubleshooting.'
    ],
    relatedCommands: ['netstat', 'ping', 'nslookup'],
    tags: ['network', 'diagnostics', 'ip', 'dhcp']
  },
  {
    id: 'windows-ping',
    command: 'ping',
    description: 'Test connectivity to hosts using ICMP echo requests',
    platform: 'windows',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'ping [-t] [-a] [-n count] target',
    examples: [
      {
        command: 'ping microsoft.com',
        description: 'Ping a hostname until interrupted (default 4 packets)'
      },
      {
        command: 'ping -n 10 192.168.0.1',
        description: 'Send a specific number of echo requests'
      },
      {
        command: 'ping -t server01',
        description: 'Ping continuously until stopped with Ctrl+C'
      }
    ],
    flags: [
      { flag: '-n', description: 'Number of echo requests to send' },
      { flag: '-t', description: 'Ping the specified host until stopped' },
      { flag: '-a', description: 'Resolve address to hostname' },
      { flag: '-l', description: 'Specify the size of send buffer' }
    ],
    notes: [
      'Some hosts block ICMP; failure does not always mean downtime.',
      'Use pathping or tracert for routing diagnostics.'
    ],
    relatedCommands: ['tracert', 'pathping', 'telnet'],
    tags: ['network', 'latency', 'diagnostics']
  },
  {
    id: 'windows-netstat',
    command: 'netstat',
    description: 'Display network connections, routing tables, and statistics',
    platform: 'windows',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'netstat [options]',
    examples: [
      {
        command: 'netstat -an',
        description: 'List all connections with numeric addresses'
      },
      {
        command: 'netstat -ano | findstr :443',
        description: 'Find the process using port 443'
      },
      {
        command: 'netstat -r',
        description: 'Display the routing table'
      }
    ],
    flags: [
      { flag: '-a', description: 'Show all connections and listening ports' },
      { flag: '-n', description: 'Show addresses and ports numerically' },
      { flag: '-o', description: 'Display the owning process ID' },
      { flag: '-r', description: 'Display the routing table' },
      { flag: '-s', description: 'Show per-protocol statistics' }
    ],
    notes: [
      'Use with findstr to filter for specific ports or processes.',
      'Pair with tasklist /fi "pid eq <id>" to identify the owning application.'
    ],
    relatedCommands: ['ipconfig', 'tasklist', 'Get-NetTCPConnection'],
    tags: ['network', 'ports', 'security', 'diagnostics']
  },
  {
    id: 'windows-tasklist',
    command: 'tasklist',
    description: 'Display running processes and associated details',
    platform: 'windows',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'tasklist [options]',
    examples: [
      {
        command: 'tasklist',
        description: 'Show all running processes and memory usage'
      },
      {
        command: 'tasklist /fi "imagename eq chrome.exe"',
        description: 'Filter results to Chrome processes'
      },
      {
        command: 'tasklist /svc',
        description: 'Show services hosted by each process'
      }
    ],
    flags: [
      { flag: '/fi', description: 'Apply filters (imagename, pid, services)' },
      { flag: '/svc', description: 'Display services hosted in each process' },
      { flag: '/m', description: 'List DLL modules loaded by each process' },
      { flag: '/v', description: 'Verbose output with session details' }
    ],
    notes: [
      'Use tasklist | find "PID" for quick filtering without /fi.',
      'Combine with taskkill to terminate rogue processes.'
    ],
    relatedCommands: ['taskkill', 'wmic process', 'Get-Process'],
    tags: ['processes', 'monitoring', 'windows', 'diagnostics']
  },
  {
    id: 'windows-taskkill',
    command: 'taskkill',
    description: 'Terminate processes by PID or image name',
    platform: 'windows',
    category: 'processes',
    riskLevel: 'dangerous',
    syntax: 'taskkill [/f] [/t] [/pid processID | /im imageName]',
    examples: [
      {
        command: 'taskkill /pid 1234',
        description: 'Terminate process with PID 1234'
      },
      {
        command: 'taskkill /im notepad.exe /f',
        description: 'Forcefully close all Notepad instances'
      },
      {
        command: 'taskkill /im chrome.exe /t',
        description: 'Terminate Chrome and all child processes'
      }
    ],
    flags: [
      { flag: '/pid', description: 'Specify process ID to terminate' },
      { flag: '/im', description: 'Specify process image name to terminate' },
      { flag: '/f', description: 'Force termination (cannot be canceled)' },
      { flag: '/t', description: 'Terminate process and any child processes' }
    ],
    notes: [
      'Use tasklist to identify process IDs beforehand.',
      'Force-killing processes can cause data loss—use with caution.'
    ],
    relatedCommands: ['tasklist', 'wmic process', 'Get-Process'],
    tags: ['processes', 'terminate', 'dangerous', 'troubleshooting']
  },
  {
    id: 'windows-systeminfo',
    command: 'systeminfo',
    description: 'Display detailed operating system configuration information',
    platform: 'windows',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'systeminfo [options]',
    examples: [
      {
        command: 'systeminfo',
        description: 'Print a comprehensive system summary'
      },
      {
        command: 'systeminfo | findstr /c:"OS Version"',
        description: 'Filter output to show the OS version'
      },
      {
        command: 'systeminfo /fo csv /nh > system.csv',
        description: 'Export system information to a CSV file'
      }
    ],
    flags: [
      { flag: '/fo', description: 'Format output (table, list, csv)' },
      { flag: '/nh', description: 'Omit header when used with CSV output' }
    ],
    notes: [
      'Useful for collecting baseline info during incident response.',
      'Pair with wmic for specialized hardware queries.'
    ],
    relatedCommands: ['wmic', 'Get-ComputerInfo', 'system_profiler'],
    tags: ['system', 'inventory', 'diagnostics']
  },
  {
    id: 'windows-shutdown',
    command: 'shutdown',
    description: 'Shutdown, restart, or log off the system',
    platform: 'windows',
    category: 'system',
    riskLevel: 'caution',
    syntax: 'shutdown [/s | /r | /l | /h] [options]',
    examples: [
      {
        command: 'shutdown /r /t 0',
        description: 'Restart immediately without delay'
      },
      {
        command: 'shutdown /s /t 60 /c "Applying updates"',
        description: 'Schedule a shutdown in 60 seconds with a custom comment'
      },
      {
        command: 'shutdown /a',
        description: 'Abort a shutdown in progress'
      }
    ],
    flags: [
      { flag: '/s', description: 'Shutdown the computer' },
      { flag: '/r', description: 'Restart the computer' },
      { flag: '/t', description: 'Set the time-out period before shutdown (seconds)' },
      { flag: '/c', description: 'Provide a shutdown comment (max 512 characters)' },
      { flag: '/a', description: 'Abort a pending shutdown' }
    ],
    notes: [
      'Requires administrative privileges for remote shutdown operations.',
      'Use shutdown /i for a graphical remote shutdown dialog.'
    ],
    relatedCommands: ['powercfg', 'logoff', 'restart-computer'],
    tags: ['system', 'maintenance', 'automation']
  }
];

const powershellCommands: CLICommand[] = [
  {
    id: 'powershell-get-help',
    command: 'Get-Help',
    description: 'Display help information about PowerShell cmdlets and concepts',
    platform: 'powershell',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'Get-Help [-Name] <String> [options]',
    examples: [
      {
        command: 'Get-Help Get-Process',
        description: 'Show basic help for a cmdlet'
      },
      {
        command: 'Get-Help Get-Process -Detailed',
        description: 'Display detailed help including parameters and examples'
      },
      {
        command: 'Update-Help; Get-Help about_Remote',
        description: 'Update help files and read conceptual documentation'
      }
    ],
    flags: [
      { flag: '-Detailed', description: 'Show detailed help with parameter descriptions' },
      { flag: '-Examples', description: 'Show examples only' },
      { flag: '-Full', description: 'Show complete help including parameter types' },
      { flag: '-Online', description: 'Open the online version of the help topic' }
    ],
    notes: [
      'Run Update-Help periodically to download the latest documentation.',
      'Use Set-ExecutionPolicy RemoteSigned before downloading help on some systems.'
    ],
    relatedCommands: ['Get-Command', 'Update-Help', 'Get-Member'],
    tags: ['documentation', 'discoverability', 'learning']
  },
  {
    id: 'powershell-get-command',
    command: 'Get-Command',
    description: 'Discover available cmdlets, functions, scripts, and executables',
    platform: 'powershell',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'Get-Command [[-Name] <String[]>] [options]',
    examples: [
      {
        command: 'Get-Command *service*',
        description: 'List commands related to services'
      },
      {
        command: 'Get-Command -Module Microsoft.PowerShell.Management',
        description: 'Show commands exported by a module'
      },
      {
        command: 'Get-Command -CommandType Application',
        description: 'Find external executables available in PATH'
      }
    ],
    flags: [
      { flag: '-Module', description: 'List commands from specific modules' },
      { flag: '-CommandType', description: 'Filter by type (Cmdlet, Function, Alias, Application)' },
      { flag: '-ParameterName', description: 'Find cmdlets with a specific parameter' },
      { flag: '-Verb/-Noun', description: 'Search by PowerShell verb or noun naming conventions' }
    ],
    notes: [
      'Use Get-Command Verb-* to learn consistent command naming patterns.',
      'Pair with Get-Help for quick onboarding onto unfamiliar modules.'
    ],
    relatedCommands: ['Get-Help', 'Get-Member', 'Get-Alias'],
    tags: ['discovery', 'automation', 'workflow']
  },
  {
    id: 'powershell-get-service',
    command: 'Get-Service',
    description: 'Retrieve the status of services on local or remote computers',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'Get-Service [[-Name] <String[]>] [options]',
    examples: [
      {
        command: 'Get-Service',
        description: 'List all services and their statuses'
      },
      {
        command: 'Get-Service -Name wuauserv',
        description: 'Check the status of Windows Update service'
      },
      {
        command: 'Get-Service | Where-Object {$_.Status -eq "Running"}',
        description: 'Filter to show only running services'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Specify service names (supports wildcards)' },
      { flag: '-ComputerName', description: 'Query services on a remote computer' },
      { flag: '-DependentServices', description: 'Include dependent service information' }
    ],
    notes: [
      'Pipe results to Start-Service or Stop-Service for management.',
      'Use Get-Service -DisplayName for friendly names shown in Services MMC.'
    ],
    relatedCommands: ['Start-Service', 'Stop-Service', 'Restart-Service'],
    tags: ['services', 'monitoring', 'automation']
  },
  {
    id: 'powershell-start-service',
    command: 'Start-Service',
    description: 'Start stopped Windows services',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'caution',
    syntax: 'Start-Service [-Name] <String[]>',
    examples: [
      {
        command: 'Start-Service -Name nginx',
        description: 'Start a specific service'
      },
      {
        command: 'Get-Service | Where-Object {$_.Status -eq "Stopped"} | Start-Service',
        description: 'Start all stopped services (use carefully)'
      },
      {
        command: 'Start-Service -DisplayName "Print Spooler"',
        description: 'Start a service using its display name'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Specify service name' },
      { flag: '-DisplayName', description: 'Specify display name' },
      { flag: '-InputObject', description: 'Pipe service objects from Get-Service' }
    ],
    notes: [
      'Requires administrative privileges for many system services.',
      'Pair with Set-Service for startup type adjustments.'
    ],
    relatedCommands: ['Stop-Service', 'Restart-Service', 'Set-Service'],
    tags: ['services', 'administration', 'automation']
  },
  {
    id: 'powershell-stop-service',
    command: 'Stop-Service',
    description: 'Stop running services with optional force flags',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'caution',
    syntax: 'Stop-Service [-Name] <String[]> [options]',
    examples: [
      {
        command: 'Stop-Service -Name wuauserv -Force',
        description: 'Force stop the Windows Update service'
      },
      {
        command: 'Get-Service -DisplayName "Print Spooler" | Stop-Service',
        description: 'Pipe service objects into Stop-Service'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Specify service name to stop' },
      { flag: '-Force', description: 'Force a service to stop despite dependencies' },
      { flag: '-PassThru', description: 'Return the service object for further processing' }
    ],
    notes: [
      'Use -Force sparingly; dependent services may fail.',
      'Combine with Start-Service -PassThru | Stop-Service to restart with logging.'
    ],
    relatedCommands: ['Start-Service', 'Restart-Service', 'Stop-Process'],
    tags: ['services', 'administration', 'caution']
  },
  {
    id: 'powershell-get-process',
    command: 'Get-Process',
    description: 'List processes running on local or remote systems',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'safe',
    syntax: 'Get-Process [[-Name] <String[]>] [options]',
    examples: [
      {
        command: 'Get-Process',
        description: 'Display all running processes'
      },
      {
        command: 'Get-Process -Name powershell',
        description: 'List processes matching a specific name'
      },
      {
        command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5',
        description: 'Find the top CPU-consuming processes'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Filter by process name' },
      { flag: '-Id', description: 'Filter by process ID' },
      { flag: '-IncludeUserName', description: 'Include the owning user account (requires elevation)' },
      { flag: '-ComputerName', description: 'Query processes on a remote computer' }
    ],
    notes: [
      'Pipe results to Stop-Process to terminate processes.',
      'Use Format-Table -AutoSize for readable output.'
    ],
    relatedCommands: ['Stop-Process', 'Wait-Process', 'tasklist'],
    tags: ['processes', 'monitoring', 'diagnostics']
  },
  {
    id: 'powershell-stop-process',
    command: 'Stop-Process',
    description: 'Stop running processes by name or ID',
    platform: 'powershell',
    category: 'processes',
    riskLevel: 'dangerous',
    syntax: 'Stop-Process [-Name] <String[]> [-Force]',
    examples: [
      {
        command: 'Stop-Process -Id 1234',
        description: 'Terminate a process by ID'
      },
      {
        command: 'Stop-Process -Name notepad -Force',
        description: 'Forcefully stop all Notepad processes'
      },
      {
        command: 'Get-Process chrome | Where-Object {$_.CPU -gt 500} | Stop-Process',
        description: 'Stop Chrome processes consuming excessive CPU'
      }
    ],
    flags: [
      { flag: '-Id', description: 'Specify process IDs to stop' },
      { flag: '-Name', description: 'Specify process names to stop' },
      { flag: '-Force', description: 'Force termination without prompt' },
      { flag: '-PassThru', description: 'Return the stopped process objects' }
    ],
    notes: [
      'Requires elevation for terminating protected system processes.',
      'Forceful termination can cause data loss in the target application.'
    ],
    relatedCommands: ['Get-Process', 'taskkill', 'kill'],
    tags: ['processes', 'terminate', 'dangerous']
  },
  {
    id: 'powershell-get-content',
    command: 'Get-Content',
    description: 'Read content from files or streams',
    platform: 'powershell',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'Get-Content [-Path] <String[]> [options]',
    examples: [
      {
        command: 'Get-Content .\\logs\\app.log -Tail 20',
        description: 'Read the last 20 lines of a log file'
      },
      {
        command: 'Get-Content config.json | ConvertFrom-Json',
        description: 'Read a JSON config file and convert to an object'
      },
      {
        command: 'Get-Content -Path .\\build.log -Wait',
        description: 'Follow a log file as it grows'
      }
    ],
    flags: [
      { flag: '-Tail', description: 'Read the last n lines of a file' },
      { flag: '-Wait', description: 'Wait for new lines and output them as they are written' },
      { flag: '-Raw', description: 'Return the entire file as a single string' },
      { flag: '-Encoding', description: 'Specify encoding (UTF8, UTF7, UTF32, ASCII)' }
    ],
    notes: [
      'Use -Raw when reading JSON or XML for parsing as a single string.',
      'Get-Content is aliased as cat, gc, and type.'
    ],
    relatedCommands: ['Set-Content', 'Add-Content', 'Out-File'],
    tags: ['files', 'logs', 'streaming', 'automation']
  },
  {
    id: 'powershell-set-content',
    command: 'Set-Content',
    description: 'Write or replace content in files',
    platform: 'powershell',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'Set-Content [-Path] <String[]> [-Value] <String[]> [options]',
    examples: [
      {
        command: '"name=production" | Set-Content .\\.env',
        description: 'Overwrite .env with new content'
      },
      {
        command: 'Set-Content config.json -Value ($config | ConvertTo-Json -Depth 4)',
        description: 'Write JSON object data to a file'
      },
      {
        command: 'Get-Service | Select-Object Name,Status | Set-Content services.txt',
        description: 'Export service statuses to a text file'
      }
    ],
    flags: [
      { flag: '-Encoding', description: 'Specify output encoding' },
      { flag: '-NoClobber', description: 'Prevent overwriting an existing file' },
      { flag: '-Force', description: 'Override read-only attributes' }
    ],
    notes: [
      'Use Add-Content to append instead of overwriting.',
      'Supports pipeline input for flexible data transformations.'
    ],
    relatedCommands: ['Add-Content', 'Out-File', 'Export-Csv'],
    tags: ['files', 'output', 'automation']
  },
  {
    id: 'powershell-test-connection',
    command: 'Test-Connection',
    description: 'Send ICMP echo requests to test network connectivity',
    platform: 'powershell',
    category: 'networking',
    riskLevel: 'safe',
    syntax: 'Test-Connection [-ComputerName] <String[]> [options]',
    examples: [
      {
        command: 'Test-Connection -ComputerName server01 -Count 4',
        description: 'Ping a remote server four times'
      },
      {
        command: 'Test-Connection -ComputerName 8.8.8.8 -AsJob',
        description: 'Run the connectivity test as a background job'
      },
      {
        command: 'Test-Connection -Traceroute server01',
        description: 'Trace the network path to a host'
      }
    ],
    flags: [
      { flag: '-Count', description: 'Number of pings to send to each target' },
      { flag: '-AsJob', description: 'Run the command as a background job' },
      { flag: '-Traceroute', description: 'Perform a traceroute in addition to ping' },
      { flag: '-Quiet', description: 'Return a Boolean value instead of detailed output' }
    ],
    notes: [
      'Unlike ping.exe, Test-Connection returns rich objects for scripting.',
      'Use Test-NetConnection in newer PowerShell versions for advanced diagnostics.'
    ],
    relatedCommands: ['Test-NetConnection', 'Ping', 'Invoke-WebRequest'],
    tags: ['network', 'diagnostics', 'connectivity']
  },
  {
    id: 'powershell-invoke-webrequest',
    command: 'Invoke-WebRequest',
    description: 'Send HTTP and HTTPS requests and parse responses',
    platform: 'powershell',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'Invoke-WebRequest [-Uri] <uri> [options]',
    examples: [
      {
        command: 'Invoke-WebRequest https://freeformathub.com -UseBasicParsing',
        description: 'Fetch a page and parse basic HTML content'
      },
      {
        command: 'Invoke-WebRequest -Method Post -Uri https://api.dev/login -Body @{user="cli"; pass="secret"}',
        description: 'Send form data in a POST request'
      },
      {
        command: 'Invoke-WebRequest -Uri https://api.dev/data -OutFile data.json',
        description: 'Download a response directly to a file'
      }
    ],
    flags: [
      { flag: '-Method', description: 'Specify HTTP method (GET, POST, PUT, DELETE)' },
      { flag: '-Headers', description: 'Send custom HTTP headers' },
      { flag: '-Body', description: 'Provide request body content' },
      { flag: '-OutFile', description: 'Save response body to a file' },
      { flag: '-UseBasicParsing', description: 'Use limited parser (legacy Windows PowerShell requirement)' }
    ],
    notes: [
      'Use Invoke-RestMethod for JSON APIs—it auto-converts responses to objects.',
      'Combine with ConvertTo-Json and ConvertFrom-Json for data transformations.'
    ],
    relatedCommands: ['Invoke-RestMethod', 'curl', 'wget'],
    tags: ['http', 'api', 'automation', 'scripting']
  },
  {
    id: 'powershell-set-executionpolicy',
    command: 'Set-ExecutionPolicy',
    description: 'Change the PowerShell script execution policy',
    platform: 'powershell',
    category: 'security',
    riskLevel: 'caution',
    syntax: 'Set-ExecutionPolicy <PolicyName> [Scope] [options]',
    examples: [
      {
        command: 'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser',
        description: 'Allow locally-created scripts to run for current user'
      },
      {
        command: 'Set-ExecutionPolicy AllSigned -Force',
        description: 'Require all scripts to be signed by a trusted publisher'
      },
      {
        command: 'Get-ExecutionPolicy -List',
        description: 'Review execution policy precedence' }
    ],
    flags: [
      { flag: '-Scope', description: 'Apply policy to Process, CurrentUser, LocalMachine, or UserPolicy' },
      { flag: '-Force', description: 'Suppress confirmation prompts' },
      { flag: '-ExecutionPolicy', description: 'Policy options: Restricted, RemoteSigned, AllSigned, Unrestricted, Bypass' }
    ],
    notes: [
      'Lowering execution policy increases security risk—only relax when necessary.',
      'Group Policy can override execution policy for domain-joined machines.'
    ],
    relatedCommands: ['Get-ExecutionPolicy', 'Unblock-File', 'Get-AuthenticodeSignature'],
    tags: ['security', 'scripting', 'policies']
  },
  {
    id: 'powershell-import-module',
    command: 'Import-Module',
    description: 'Load PowerShell modules into the current session',
    platform: 'powershell',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'Import-Module [-Name] <String[]> [options]',
    examples: [
      {
        command: 'Import-Module Az',
        description: 'Load Azure PowerShell module commands'
      },
      {
        command: 'Import-Module .\\Modules\\Deploy.psm1 -Force',
        description: 'Load a local module and overwrite previously imported versions'
      },
      {
        command: 'Get-Module -ListAvailable | Import-Module',
        description: 'Load all modules discovered on the system (use with caution)'
      }
    ],
    flags: [
      { flag: '-Name', description: 'Specify module name (supports wildcards)' },
      { flag: '-Force', description: 'Import even if module is already loaded' },
      { flag: '-DisableNameChecking', description: 'Skip verb-noun naming checks' },
      { flag: '-PassThru', description: 'Return the module object upon import' }
    ],
    notes: [
      'Use Install-Module from PowerShell Gallery to add new modules.',
      'Modules in PSModulePath are auto-discovered by name.'
    ],
    relatedCommands: ['Get-Module', 'Remove-Module', 'Install-Module'],
    tags: ['modules', 'extensions', 'automation', 'devops']
  },
  {
    id: 'powershell-get-history',
    command: 'Get-History',
    description: 'Retrieve the command history for the current PowerShell session',
    platform: 'powershell',
    category: 'system',
    riskLevel: 'safe',
    syntax: 'Get-History [options]',
    examples: [
      {
        command: 'Get-History | Select-Object -Last 10',
        description: 'Review the last 10 executed commands'
      },
      {
        command: 'Get-History | Export-Clixml history.xml',
        description: 'Export the command history to a file'
      },
      {
        command: 'Invoke-History 257',
        description: 'Re-run a specific command from history by ID'
      }
    ],
    flags: [
      { flag: '-Id', description: 'Retrieve specific command entry by ID' }
    ],
    notes: [
      'Use Clear-History to wipe sensitive commands from the session log.',
      'Persistent history is stored differently in Windows PowerShell vs. PowerShell Core.'
    ],
    relatedCommands: ['Invoke-History', 'Clear-History', 'history'],
    tags: ['productivity', 'automation', 'shell']
  }
];

const dockerCommands: CLICommand[] = [
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
        description: 'Show all running containers'
      },
      {
        command: 'docker ps -a',
        description: 'Show running and exited containers'
      },
      {
        command: 'docker ps --format "{{.Names}}\t{{.Status}}"',
        description: 'Custom-format output for scripts'
      }
    ],
    flags: [
      { flag: '-a', description: 'Include stopped containers' },
      { flag: '-q', description: 'Only display numeric container IDs' },
      { flag: '--format', description: 'Format output using Go templates' },
      { flag: '--filter', description: 'Filter containers using key=value pairs' }
    ],
    notes: [
      'Combine with docker stop $(docker ps -q) to stop all running containers.',
      'Use --last to list the most recently created containers.'
    ],
    relatedCommands: ['docker images', 'docker logs', 'docker inspect'],
    tags: ['containers', 'runtime', 'listing', 'devops']
  },
  {
    id: 'docker-images',
    command: 'docker images',
    description: 'List local Docker images',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker images [options]',
    examples: [
      {
        command: 'docker images',
        description: 'Show all local images'
      },
      {
        command: 'docker images --digests',
        description: 'Display digests for reproducible deployments'
      },
      {
        command: 'docker images --filter dangling=true',
        description: 'Show untagged images that can be pruned'
      }
    ],
    flags: [
      { flag: '--filter', description: 'Filter output based on conditions (dangling, reference)' },
      { flag: '--format', description: 'Format output using Go templates' },
      { flag: '--digests', description: 'Display image digests' }
    ],
    notes: [
      'Prune unused images with docker image prune.',
      'Use docker history IMAGE to inspect layer details.'
    ],
    relatedCommands: ['docker pull', 'docker rmi', 'docker ps'],
    tags: ['images', 'registry', 'cleanup', 'devops']
  },
  {
    id: 'docker-run',
    command: 'docker run',
    description: 'Create and start a new container from an image',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker run [options] image [command]',
    examples: [
      {
        command: 'docker run --rm alpine echo "Hello"',
        description: 'Run a short-lived container and remove it afterward'
      },
      {
        command: 'docker run -d -p 8080:80 nginx',
        description: 'Run nginx detached and map port 80 to 8080'
      },
      {
        command: 'docker run -it --name devshell node:20-bullseye /bin/bash',
        description: 'Start an interactive shell in a Node.js image'
      }
    ],
    flags: [
      { flag: '--rm', description: 'Remove container automatically after exit' },
      { flag: '-d', description: 'Run container in detached mode' },
      { flag: '-p', description: 'Publish container ports to the host' },
      { flag: '--name', description: 'Assign a custom container name' },
      { flag: '-v', description: 'Mount volumes or bind mounts' }
    ],
    notes: [
      'Use --env-file to pass environment variables.',
      'Combine with --health-cmd for production-grade health checks.'
    ],
    relatedCommands: ['docker exec', 'docker start', 'docker compose'],
    tags: ['containers', 'runtime', 'orchestration', 'devops']
  },
  {
    id: 'docker-build',
    command: 'docker build',
    description: 'Build Docker images from a Dockerfile',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker build [options] path',
    examples: [
      {
        command: 'docker build -t myapp:latest .',
        description: 'Build an image using the Dockerfile in the current directory'
      },
      {
        command: 'docker build -f Dockerfile.prod -t myapp:prod .',
        description: 'Specify an alternate Dockerfile'
      },
      {
        command: 'docker build --build-arg NODE_ENV=production .',
        description: 'Pass build arguments into the Dockerfile'
      }
    ],
    flags: [
      { flag: '-t', description: 'Tag the resulting image' },
      { flag: '-f', description: 'Specify path to Dockerfile' },
      { flag: '--build-arg', description: 'Set build-time variables' },
      { flag: '--platform', description: 'Target a specific OS/architecture' },
      { flag: '--progress', description: 'Set build output type (auto, plain, tty)' }
    ],
    notes: [
      'Use docker buildx for multi-architecture builds.',
      'Leverage .dockerignore to keep build contexts lean.'
    ],
    relatedCommands: ['docker run', 'docker push', 'docker tag'],
    tags: ['images', 'build', 'ci', 'devops']
  },
  {
    id: 'docker-logs',
    command: 'docker logs',
    description: 'View logs from a container',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker logs [options] container',
    examples: [
      {
        command: 'docker logs web',
        description: 'Show accumulated logs for container named web'
      },
      {
        command: 'docker logs -f --tail 100 api',
        description: 'Follow logs in real-time showing last 100 lines'
      },
      {
        command: 'docker logs --since 10m worker',
        description: 'Show logs from the past ten minutes'
      }
    ],
    flags: [
      { flag: '-f', description: 'Follow log output (stream)' },
      { flag: '--tail', description: 'Number of lines to show from the end' },
      { flag: '--since/--until', description: 'Filter logs by time range' },
      { flag: '--details', description: 'Show extra attributes with log messages' }
    ],
    notes: [
      'Logging driver determines available features; journald, json-file, etc.',
      'Use docker compose logs for aggregated multi-service view.'
    ],
    relatedCommands: ['docker ps', 'docker inspect', 'docker compose logs'],
    tags: ['logs', 'debugging', 'monitoring', 'containers']
  },
  {
    id: 'docker-exec',
    command: 'docker exec',
    description: 'Run a command in a running container',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker exec [options] container command',
    examples: [
      {
        command: 'docker exec -it api /bin/bash',
        description: 'Open an interactive shell inside the api container'
      },
      {
        command: 'docker exec db pg_isready',
        description: 'Run a diagnostic command in a container'
      },
      {
        command: 'docker exec -u root web ls -lah /root',
        description: 'Execute commands as a different user'
      }
    ],
    flags: [
      { flag: '-i', description: 'Keep STDIN open even if not attached' },
      { flag: '-t', description: 'Allocate a pseudo-TTY' },
      { flag: '-u', description: 'Run command as specified user' },
      { flag: '-d', description: 'Run command in background' },
      { flag: '-w', description: 'Working directory inside the container' }
    ],
    notes: [
      'Container must be running to use docker exec.',
      'Combine -it for interactive troubleshooting sessions.'
    ],
    relatedCommands: ['docker run', 'docker attach', 'docker cp'],
    tags: ['containers', 'debugging', 'interactive', 'devops']
  },
  {
    id: 'docker-compose',
    command: 'docker compose',
    description: 'Define and run multi-container applications',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker compose [command] [options]',
    examples: [
      {
        command: 'docker compose up',
        description: 'Start services defined in docker-compose.yml'
      },
      {
        command: 'docker compose up -d db redis',
        description: 'Start specific services in detached mode'
      },
      {
        command: 'docker compose down --volumes',
        description: 'Stop services and remove volumes'
      }
    ],
    flags: [
      { flag: 'up', description: 'Create and start containers' },
      { flag: 'down', description: 'Stop and remove containers, networks, and volumes' },
      { flag: '--profile', description: 'Enable or disable service profiles' },
      { flag: '-f', description: 'Use an alternate compose file' },
      { flag: '--build', description: 'Build images before starting containers' }
    ],
    notes: [
      'docker compose replaces the legacy docker-compose binary.',
      'Use multiple -f flags to merge compose files for environments.'
    ],
    relatedCommands: ['docker run', 'docker build', 'docker logs'],
    tags: ['compose', 'orchestration', 'devops', 'workflow']
  },
  {
    id: 'docker-stop',
    command: 'docker stop',
    description: 'Stop running containers gracefully',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker stop [options] container [container...]',
    examples: [
      {
        command: 'docker stop web',
        description: 'Send SIGTERM then SIGKILL after timeout'
      },
      {
        command: 'docker stop $(docker ps -q)',
        description: 'Stop all running containers'
      },
      {
        command: 'docker stop --time 30 worker',
        description: 'Give container 30 seconds to shut down'
      }
    ],
    flags: [
      { flag: '--time', description: 'Seconds to wait before killing the container (default 10)' }
    ],
    notes: [
      'Graceful stop allows containers to finish work; avoid docker kill when possible.',
      'Handles multiple container names or IDs in one command.'
    ],
    relatedCommands: ['docker kill', 'docker start', 'docker restart'],
    tags: ['containers', 'lifecycle', 'devops']
  },
  {
    id: 'docker-rm',
    command: 'docker rm',
    description: 'Remove stopped containers',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker rm [options] container [container...]',
    examples: [
      {
        command: 'docker rm web',
        description: 'Remove a stopped container named web'
      },
      {
        command: 'docker rm $(docker ps -aq -f status=exited)',
        description: 'Remove all exited containers'
      },
      {
        command: 'docker rm -f stale',
        description: 'Force remove a running container (equivalent to stop + rm)' }
    ],
    flags: [
      { flag: '-f', description: 'Force removal of running containers' },
      { flag: '-v', description: 'Remove anonymous volumes associated with the container' }
    ],
    notes: [
      'docker container prune removes all stopped containers in one shot.',
      'Use docker ps -a to review containers before deletion.'
    ],
    relatedCommands: ['docker stop', 'docker container prune', 'docker rm -v'],
    tags: ['cleanup', 'containers', 'devops']
  },
  {
    id: 'docker-volume',
    command: 'docker volume',
    description: 'Manage Docker volumes for persistent data',
    platform: 'docker',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'docker volume [command] [options]',
    examples: [
      {
        command: 'docker volume ls',
        description: 'List volumes on the host'
      },
      {
        command: 'docker volume inspect data_volume',
        description: 'Inspect metadata and mountpoints for a volume'
      },
      {
        command: 'docker volume rm old_volume',
        description: 'Remove an unused volume'
      },
    ],
    flags: [
      { flag: 'create', description: 'Create a new volume' },
      { flag: 'inspect', description: 'Display detailed information about a volume' },
      { flag: 'rm', description: 'Remove one or more volumes' },
      { flag: 'prune', description: 'Remove all unused volumes' }
    ],
    notes: [
      'Bind mounts are configured via docker run -v; named volumes via docker volume create.',
      'Pruning removes volumes not referenced by any container.'
    ],
    relatedCommands: ['docker run', 'docker inspect', 'docker system prune'],
    tags: ['volumes', 'storage', 'stateful', 'devops']
  },
  {
    id: 'docker-network',
    command: 'docker network',
    description: 'Manage Docker networks for container connectivity',
    platform: 'docker',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'docker network [command] [options]',
    examples: [
      {
        command: 'docker network ls',
        description: 'List available Docker networks'
      },
      {
        command: 'docker network create --driver bridge devnet',
        description: 'Create a custom bridge network'
      },
      {
        command: 'docker network connect devnet web',
        description: 'Attach a container to an existing network' }
    ],
    flags: [
      { flag: 'create', description: 'Create a new network' },
      { flag: 'connect', description: 'Attach a container to a network' },
      { flag: 'disconnect', description: 'Detach a container from a network' },
      { flag: 'inspect', description: 'View network configuration and connected containers' }
    ],
    notes: [
      'Custom networks allow service discovery by container name.',
      'Use overlay networks with swarm or Kubernetes for multi-host connectivity.'
    ],
    relatedCommands: ['docker compose', 'docker inspect', 'docker swarm'],
    tags: ['networking', 'containers', 'connectivity', 'devops']
  },
  {
    id: 'docker-prune',
    command: 'docker system prune',
    description: 'Clean up unused Docker data to reclaim disk space',
    platform: 'docker',
    category: 'development',
    riskLevel: 'dangerous',
    syntax: 'docker system prune [options]',
    examples: [
      {
        command: 'docker system prune',
        description: 'Remove stopped containers, unused networks, and dangling images'
      },
      {
        command: 'docker system prune --volumes',
        description: 'Additionally remove unused volumes (potentially destructive)'
      },
      {
        command: 'docker image prune -a',
        description: 'Remove all unused images, not just dangling ones'
      }
    ],
    flags: [
      { flag: '--all', description: 'Include all unused images, not just dangling ones' },
      { flag: '--force', description: 'Do not prompt for confirmation' },
      { flag: '--volumes', description: 'Also prune unused volumes' }
    ],
    notes: [
      'Review docker system df before pruning to understand disk usage.',
      'Make sure important containers and volumes are running or backed up before pruning.'
    ],
    relatedCommands: ['docker image prune', 'docker container prune', 'docker volume prune'],
    tags: ['cleanup', 'maintenance', 'dangerous', 'devops']
  }
];

const gitCommands: CLICommand[] = [
  {
    id: 'git-status',
    command: 'git status',
    description: 'Show working tree status and staged changes',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git status [options]',
    examples: [
      {
        command: 'git status',
        description: 'Display full status with branch and change summary'
      },
      {
        command: 'git status -s',
        description: 'Show status in concise short format'
      },
      {
        command: 'git status --ignored',
        description: 'Include ignored files in the status output'
      }
    ],
    flags: [
      { flag: '-s/--short', description: 'Show status in short format (XY paths)' },
      { flag: '--branch', description: 'Show branch and tracking info (default in full mode)' },
      { flag: '--ignored', description: 'Show ignored files as well' },
      { flag: '--show-stash', description: 'Display if stash entries are available' }
    ],
    notes: [
      'Short status codes: M=modified, A=added, D=deleted, ??=untracked.',
      'Run before commits to review what will be included.'
    ],
    relatedCommands: ['git add', 'git diff', 'git stash'],
    tags: ['version-control', 'workflow', 'review']
  },
  {
    id: 'git-add',
    command: 'git add',
    description: 'Add file contents to the staging area',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git add [options] [pathspec...]',
    examples: [
      {
        command: 'git add src/app.ts',
        description: 'Stage a specific file'
      },
      {
        command: 'git add .',
        description: 'Stage all changes in the current directory'
      },
      {
        command: 'git add -p',
        description: 'Interactively stage portions of files'
      }
    ],
    flags: [
      { flag: '-A', description: 'Stage all changes (add, modify, delete)' },
      { flag: '-p', description: 'Interactively stage hunks' },
      { flag: '-u', description: 'Stage tracked files with modifications or deletions' },
      { flag: '--intent-to-add', description: 'Record a path that will be added later' }
    ],
    notes: [
      'Use git add -p to keep commits focused and review each change.',
      'git add . respects .gitignore entries and skip-worktree marks.'
    ],
    relatedCommands: ['git status', 'git commit', 'git restore --staged'],
    tags: ['staging', 'workflow', 'commits']
  },
  {
    id: 'git-commit',
    command: 'git commit',
    description: 'Record staged changes with a message',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git commit [options]',
    examples: [
      {
        command: 'git commit -m "feat: add CLI reference"',
        description: 'Create a commit with a message'
      },
      {
        command: 'git commit --amend',
        description: 'Modify the most recent commit without changing message'
      },
      {
        command: 'git commit --amend -m "fix: update copy"',
        description: 'Amend the last commit and update its message'
      }
    ],
    flags: [
      { flag: '-m', description: 'Provide commit message inline' },
      { flag: '--amend', description: 'Modify the most recent commit' },
      { flag: '--no-verify', description: 'Skip pre-commit and commit-msg hooks' },
      { flag: '--author', description: 'Override the author information' }
    ],
    notes: [
      'Use git commit --amend only for unpublished commits to avoid rewriting shared history.',
      'Combine with git commit --fixup for autosquash workflows.'
    ],
    relatedCommands: ['git add', 'git push', 'git rebase'],
    tags: ['commits', 'history', 'workflow']
  },
  {
    id: 'git-push',
    command: 'git push',
    description: 'Update remote refs with local commits',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git push [options] [remote] [branch]',
    examples: [
      {
        command: 'git push origin main',
        description: 'Push local main branch to origin remote'
      },
      {
        command: 'git push --set-upstream origin feature/cli-guide',
        description: 'Push a new branch and set upstream tracking'
      },
      {
        command: 'git push --force-with-lease',
        description: 'Force push safely while verifying remote updates'
      }
    ],
    flags: [
      { flag: '--set-upstream', description: 'Establish upstream tracking for current branch' },
      { flag: '--force-with-lease', description: 'Force push but fail if remote has unseen commits' },
      { flag: '--tags', description: 'Push tags along with commits' },
      { flag: '--delete', description: 'Delete a remote branch' }
    ],
    notes: [
      'Use --force-with-lease instead of --force to protect collaborators.',
      'Push without specifying remote defaults to upstream configured with git push -u.'
    ],
    relatedCommands: ['git fetch', 'git pull', 'git remote'],
    tags: ['remotes', 'collaboration', 'workflow']
  },
  {
    id: 'git-pull',
    command: 'git pull',
    description: 'Fetch from a remote repository and merge',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git pull [options] [remote] [branch]',
    examples: [
      {
        command: 'git pull',
        description: 'Fetch and merge changes from upstream for current branch'
      },
      {
        command: 'git pull --rebase',
        description: 'Rebase local commits on top of upstream changes'
      },
      {
        command: 'git pull origin main',
        description: 'Explicitly pull from origin/main'
      }
    ],
    flags: [
      { flag: '--rebase', description: 'Use rebase instead of merge to incorporate upstream changes' },
      { flag: '--ff-only', description: 'Refuse non fast-forward merges' },
      { flag: '--no-commit', description: 'Perform merge but do not commit automatically' }
    ],
    notes: [
      'Configure pull.rebase=true to make --rebase the default.',
      'Resolve conflicts promptly and run tests after pulling significant changes.'
    ],
    relatedCommands: ['git fetch', 'git merge', 'git rebase'],
    tags: ['remotes', 'sync', 'collaboration']
  },
  {
    id: 'git-fetch',
    command: 'git fetch',
    description: 'Download objects and refs from another repository',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git fetch [options] [remote] [refspec]',
    examples: [
      {
        command: 'git fetch',
        description: 'Fetch updates for default remote and branches'
      },
      {
        command: 'git fetch origin feature/cli-guide',
        description: 'Fetch a single remote branch'
      },
      {
        command: 'git fetch --prune',
        description: 'Remove local references to deleted remote branches'
      }
    ],
    flags: [
      { flag: '--prune', description: 'Delete removed remote-tracking references' },
      { flag: '--tags', description: 'Fetch all tags' },
      { flag: '--depth', description: 'Limit history depth for shallow fetches' },
      { flag: '--all', description: 'Fetch all remotes' }
    ],
    notes: [
      'Fetch is read-only—review differences before merging.',
      'Combine with git switch to inspect remote-tracking branches.'
    ],
    relatedCommands: ['git pull', 'git remote', 'git rebase'],
    tags: ['remotes', 'sync', 'analysis']
  },
  {
    id: 'git-merge',
    command: 'git merge',
    description: 'Join histories of different branches',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git merge [options] <commit>',
    examples: [
      {
        command: 'git merge feature/login',
        description: 'Merge a feature branch into the current branch'
      },
      {
        command: 'git merge --no-ff release/2024.01',
        description: 'Create a merge commit even if fast-forward is possible'
      },
      {
        command: 'git merge --squash feature/experiments',
        description: 'Combine changes without creating a merge commit'
      }
    ],
    flags: [
      { flag: '--no-ff', description: 'Create a merge commit even when fast-forwarding' },
      { flag: '--squash', description: 'Squash changes into the current branch without committing' },
      { flag: '--abort', description: 'Abort the merge and reset to pre-merge state' },
      { flag: '--ff-only', description: 'Refuse to merge unless fast-forward is possible' }
    ],
    notes: [
      'Resolve conflicts using git status and git mergetool.',
      'Run tests after merges to ensure compatibility.'
    ],
    relatedCommands: ['git rebase', 'git cherry-pick', 'git mergetool'],
    tags: ['branches', 'workflow', 'history']
  },
  {
    id: 'git-rebase',
    command: 'git rebase',
    description: 'Reapply commits on top of another base tip',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git rebase [options] [upstream [branch]]',
    examples: [
      {
        command: 'git rebase origin/main',
        description: 'Rebase current branch onto origin/main'
      },
      {
        command: 'git rebase -i HEAD~5',
        description: 'Interactively rewrite the last five commits'
      },
      {
        command: 'git rebase --onto main feature-old feature-new',
        description: 'Move a feature branch onto a new base'
      }
    ],
    flags: [
      { flag: '-i', description: 'Interactive mode for editing, squashing, or reordering commits' },
      { flag: '--autosquash', description: 'Automatically reorder fixup/squash commits created with --fixup' },
      { flag: '--continue', description: 'Continue after resolving conflicts' },
      { flag: '--abort', description: 'Stop the rebase and reset to original branch' }
    ],
    notes: [
      'Avoid rebasing shared branches that others have pulled.',
      'Use git rebase --autostash to stash uncommitted changes before rebasing.'
    ],
    relatedCommands: ['git merge', 'git cherry-pick', 'git reset'],
    tags: ['history', 'cleanup', 'workflow']
  },
  {
    id: 'git-checkout',
    command: 'git checkout',
    description: 'Switch branches or restore working tree files',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git checkout [options] [branch|path]',
    examples: [
      {
        command: 'git checkout feature/new-ui',
        description: 'Switch to an existing branch'
      },
      {
        command: 'git checkout -b hotfix/logging',
        description: 'Create and switch to a new branch'
      },
      {
        command: 'git checkout -- README.md',
        description: 'Discard changes to a file and restore from HEAD'
      }
    ],
    flags: [
      { flag: '-b', description: 'Create a new branch before checking it out' },
      { flag: '--', description: 'Separate branch name from file paths to avoid ambiguity' },
      { flag: '--detach', description: 'Check out a commit but stay detached from branches' }
    ],
    notes: [
      'git switch and git restore provide clearer alternatives for newer workflows.',
      'Use caution when discarding changes—there is no undo without backups.'
    ],
    relatedCommands: ['git switch', 'git restore', 'git reset'],
    tags: ['branches', 'workflow', 'files']
  },
  {
    id: 'git-switch',
    command: 'git switch',
    description: 'Dedicated command to switch branches',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git switch [options] [branch]',
    examples: [
      {
        command: 'git switch main',
        description: 'Switch to the main branch'
      },
      {
        command: 'git switch -c feature/api',
        description: 'Create and switch to a new branch'
      },
      {
        command: 'git switch -',
        description: 'Toggle back to the previously checked out branch'
      }
    ],
    flags: [
      { flag: '-c', description: 'Create a new branch and switch to it' },
      { flag: '-C', description: 'Create or reset a branch to start point' },
      { flag: '-', description: 'Switch to the last branch' }
    ],
    notes: [
      'git switch is safer than git checkout because it does not operate on individual files by default.',
      'Use git switch --detach to inspect a commit without moving HEAD.'
    ],
    relatedCommands: ['git checkout', 'git branch', 'git restore'],
    tags: ['branches', 'workflow', 'navigation']
  },
  {
    id: 'git-branch',
    command: 'git branch',
    description: 'List, create, or delete branches',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git branch [options] [branch-name]',
    examples: [
      {
        command: 'git branch',
        description: 'List local branches highlighting the current one'
      },
      {
        command: 'git branch -vv',
        description: 'Show tracking branches and last commit summary'
      },
      {
        command: 'git branch -d feature/login',
        description: 'Delete a merged branch'
      }
    ],
    flags: [
      { flag: '-a', description: 'List both local and remote-tracking branches' },
      { flag: '-d', description: 'Delete a branch (fails if unmerged)' },
      { flag: '-D', description: 'Force delete a branch regardless of merge status' },
      { flag: '-m', description: 'Rename the current branch' }
    ],
    notes: [
      'Use -r to list remote branches only.',
      'Always ensure branches are pushed or merged before deletion.'
    ],
    relatedCommands: ['git switch', 'git checkout', 'git merge'],
    tags: ['branches', 'management', 'workflow']
  },
  {
    id: 'git-stash',
    command: 'git stash',
    description: 'Save and restore local modifications without committing',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git stash [push] [options]',
    examples: [
      {
        command: 'git stash push -m "wip: refactor"',
        description: 'Stash changes with a custom message'
      },
      {
        command: 'git stash list',
        description: 'List stored stashes with their messages'
      },
      {
        command: 'git stash apply stash@{1}',
        description: 'Reapply a specific stash entry without deleting it'
      }
    ],
    flags: [
      { flag: '-u/--include-untracked', description: 'Include untracked files in the stash' },
      { flag: '-a/--all', description: 'Include ignored files as well' },
      { flag: 'pop', description: 'Apply the latest stash and remove it from the stack' },
      { flag: 'drop', description: 'Delete a specific stash entry' }
    ],
    notes: [
      'Use git stash show -p stash@{0} to inspect diff before applying.',
      'Stashes are local only—they are not pushed to remotes.'
    ],
    relatedCommands: ['git status', 'git commit', 'git worktree'],
    tags: ['workflow', 'changes', 'productivity']
  },
  {
    id: 'git-log',
    command: 'git log',
    description: 'Browse commit history with flexible formatting',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git log [options] [revision-range]',
    examples: [
      {
        command: 'git log --oneline --graph --decorate --all',
        description: 'Show history graph with branches in one line per commit'
      },
      {
        command: 'git log -p --stat --author="Alice" --since="2 weeks ago"',
        description: 'Filter commits by author and time, including patches and stats'
      },
      {
        command: 'git log --first-parent main',
        description: 'View main branch history following merge commits' }
    ],
    flags: [
      { flag: '--oneline', description: 'Condense each commit to a single line' },
      { flag: '--graph', description: 'Draw ASCII graph of branch structure' },
      { flag: '-p', description: 'Show diffs for each commit' },
      { flag: '--stat', description: 'Show diffstat summary for each commit' },
      { flag: '--pretty', description: 'Customize log output format' }
    ],
    notes: [
      'Combine with git shortlog for release notes.',
      'Use git log --merges to inspect merge commits only.'
    ],
    relatedCommands: ['git show', 'git diff', 'git blame'],
    tags: ['history', 'analysis', 'review']
  },
  {
    id: 'git-diff',
    command: 'git diff',
    description: 'Show differences between commits, branches, or working tree',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git diff [options] [commit [commit]] [--] [path...]',
    examples: [
      {
        command: 'git diff',
        description: 'Show unstaged changes compared to index'
      },
      {
        command: 'git diff --cached',
        description: 'Show staged changes compared to last commit'
      },
      {
        command: 'git diff main...feature',
        description: 'Compare diverged branches against their merge base'
      }
    ],
    flags: [
      { flag: '--cached', description: 'Compare index with last commit (staged changes)' },
      { flag: '--stat', description: 'Show summary of changes per file' },
      { flag: '--word-diff', description: 'Highlight changes at word granularity' },
      { flag: '--color-moved', description: 'Highlight moved lines in diffs' }
    ],
    notes: [
      'Use git diff --name-only for lists of changed files.',
      'Paired with git apply to apply patches manually.'
    ],
    relatedCommands: ['git status', 'git show', 'git add'],
    tags: ['diffs', 'review', 'analysis']
  },
  {
    id: 'git-clone',
    command: 'git clone',
    description: 'Clone an existing repository into a new directory',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git clone [options] <repo> [directory]',
    examples: [
      {
        command: 'git clone https://github.com/freeformathub/cli-guides.git',
        description: 'Clone repository over HTTPS'
      },
      {
        command: 'git clone --depth 1 git@github.com:org/project.git',
        description: 'Perform a shallow clone with limited history'
      },
      {
        command: 'git clone --branch develop repo.git project-dev',
        description: 'Clone a specific branch into a custom directory'
      }
    ],
    flags: [
      { flag: '--depth', description: 'Create a shallow clone with truncated history' },
      { flag: '--branch', description: 'Checkout a specific branch after cloning' },
      { flag: '--recurse-submodules', description: 'Initialize submodules after cloning' },
      { flag: '--origin', description: 'Set a custom remote name instead of origin' }
    ],
    notes: [
      'Use git submodule update --init --recursive after cloning to sync nested repos.',
      'Shallow clones are faster but limit history for blame and bisect.'
    ],
    relatedCommands: ['git fetch', 'git remote', 'git submodule'],
    tags: ['onboarding', 'setup', 'remotes']
  },
  {
    id: 'git-reset',
    command: 'git reset',
    description: 'Move branch tip and optionally adjust index or working tree',
    platform: 'git',
    category: 'development',
    riskLevel: 'dangerous',
    syntax: 'git reset [mode] [commit]',
    examples: [
      {
        command: 'git reset HEAD~1',
        description: 'Undo the last commit but preserve working tree changes (mixed mode)' },
      {
        command: 'git reset --hard origin/main',
        description: 'Reset working tree and index to match remote branch' },
      {
        command: 'git reset --soft HEAD^',
        description: 'Move HEAD back but keep changes staged' }
    ],
    flags: [
      { flag: '--soft', description: 'Move HEAD only, keep index and working tree intact' },
      { flag: '--mixed', description: 'Reset index but not working tree (default)' },
      { flag: '--hard', description: 'Reset index and working tree to match target (destructive)' },
      { flag: '--keep', description: 'Reset but keep local changes that do not conflict' }
    ],
    notes: [
      'Avoid using --hard on shared branches to prevent data loss.',
      'Use git reflog to recover commits if reset goes wrong.'
    ],
    relatedCommands: ['git revert', 'git checkout', 'git reflog'],
    tags: ['history', 'dangerous', 'cleanup']
  },
  {
    id: 'git-revert',
    command: 'git revert',
    description: 'Create a new commit that undoes changes from a previous commit',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git revert [options] commit',
    examples: [
      {
        command: 'git revert HEAD',
        description: 'Create a commit that undoes the last commit'
      },
      {
        command: 'git revert --no-commit abc123..def789',
        description: 'Revert a range of commits without creating commits automatically' },
      {
        command: 'git revert -m 1 <merge-commit>',
        description: 'Revert a merge commit preserving branch history' }
    ],
    flags: [
      { flag: '--no-commit', description: 'Stage the revert without committing immediately' },
      { flag: '--edit', description: 'Edit the commit message before finalizing' },
      { flag: '-m', description: 'Specify parent number when reverting a merge commit' }
    ],
    notes: [
      'Preferred alternative to git reset on shared branches.',
      'Conflicts during revert must be resolved before committing.'
    ],
    relatedCommands: ['git reset', 'git cherry-pick', 'git commit'],
    tags: ['history', 'undo', 'safe']
  },
  {
    id: 'git-cherry-pick',
    command: 'git cherry-pick',
    description: 'Apply commits from other branches onto the current branch',
    platform: 'git',
    category: 'development',
    riskLevel: 'caution',
    syntax: 'git cherry-pick [options] <commit...>',
    examples: [
      {
        command: 'git cherry-pick abc123',
        description: 'Apply a specific commit to current branch'
      },
      {
        command: 'git cherry-pick --no-commit abc123',
        description: 'Apply changes without committing immediately' },
      {
        command: 'git cherry-pick A..B',
        description: 'Apply a range of commits sequentially' }
    ],
    flags: [
      { flag: '--continue', description: 'Continue after resolving conflicts' },
      { flag: '--abort', description: 'Abort and reset to state before cherry-pick' },
      { flag: '--no-commit', description: 'Do not automatically create commits' },
      { flag: '--signoff', description: 'Add Signed-off-by line to commit message' }
    ],
    notes: [
      'Use sparingly; cherry-picked commits diverge from original branch history.',
      'When picking multiple commits, consider git cherry-pick --replay.'
    ],
    relatedCommands: ['git revert', 'git rebase', 'git merge'],
    tags: ['workflow', 'patching', 'history']
  },
  {
    id: 'git-tag',
    command: 'git tag',
    description: 'Create, list, or delete tags',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git tag [options] [tagname] [commit]',
    examples: [
      {
        command: 'git tag v1.0.0',
        description: 'Create a lightweight tag for current commit'
      },
      {
        command: 'git tag -a v1.1.0 -m "Release 1.1"',
        description: 'Create an annotated tag with message'
      },
      {
        command: 'git push origin --tags',
        description: 'Push all tags to remote' }
    ],
    flags: [
      { flag: '-a', description: 'Create an annotated tag' },
      { flag: '-d', description: 'Delete a local tag' },
      { flag: '-s', description: 'Sign a tag with GPG' },
      { flag: '-l/--list', description: 'List tags with optional pattern' }
    ],
    notes: [
      'Annotated tags store author, date, message, and signature metadata.',
      'Use git describe --tags to derive human-readable version numbers.'
    ],
    relatedCommands: ['git push', 'git show', 'git describe'],
    tags: ['releases', 'history', 'metadata']
  },
  {
    id: 'git-blame',
    command: 'git blame',
    description: 'Show last commit and author for each line of a file',
    platform: 'git',
    category: 'development',
    riskLevel: 'safe',
    syntax: 'git blame [options] file',
    examples: [
      {
        command: 'git blame src/app.ts',
        description: 'Show who last modified each line'
      },
      {
        command: 'git blame -L 42,80 src/app.ts',
        description: 'Blame a specific range of lines' },
      {
        command: 'git blame --show-email README.md',
        description: 'Display committer email addresses' }
    ],
    flags: [
      { flag: '-L', description: 'Limit output to specific line range' },
      { flag: '--show-email', description: 'Include author email addresses' },
      { flag: '--show-name', description: 'Include author names (default)' },
      { flag: '--reverse', description: 'Use reverse annotation to find introduced lines' }
    ],
    notes: [
      'Use git blame --help to explore heuristics for ignoring whitespace.',
      'Pair with git show to inspect the commit for a specific line.'
    ],
    relatedCommands: ['git show', 'git log', 'git annotate'],
    tags: ['analysis', 'history', 'audit']
  },
  {
    id: 'git-clean',
    command: 'git clean',
    description: 'Remove untracked files and directories from the working tree',
    platform: 'git',
    category: 'development',
    riskLevel: 'dangerous',
    syntax: 'git clean [options]',
    examples: [
      {
        command: 'git clean -n',
        description: 'Preview which files would be removed'
      },
      {
        command: 'git clean -fd',
        description: 'Remove untracked files and directories forcefully' },
      {
        command: 'git clean -X',
        description: 'Remove only files ignored by .gitignore' }
    ],
    flags: [
      { flag: '-n', description: 'Dry run; show what would be removed' },
      { flag: '-f', description: 'Force removal of untracked files' },
      { flag: '-d', description: 'Include directories when cleaning' },
      { flag: '-x', description: 'Remove ignored and untracked files (dangerous)' },
      { flag: '-X', description: 'Remove only ignored files' }
    ],
    notes: [
      'Always run git clean -n before destructive cleanups.',
      'Combine with git clean -fd --exclude to preserve files selectively.'
    ],
    relatedCommands: ['git reset', 'git stash', 'git status'],
    tags: ['cleanup', 'dangerous', 'workflow']
  }
];

export const CLI_COMMANDS_DATABASE: CLICommand[] = [
  ...linuxCommands,
  ...macosCommands,
  ...windowsCommands,
  ...powershellCommands,
  ...dockerCommands,
  ...gitCommands
];

const examples: ToolExample[] = [
  {
    title: 'Browse macOS automation commands',
    input: {
      options: {
        searchQuery: 'brew',
        platform: 'macos',
        category: 'development',
        riskLevel: 'all',
        showExamples: true,
        showFlags: true
      }
    },
    output: {
      success: true,
      message: 'Highlighted Homebrew commands with install and upgrade workflows'
    }
  },
  {
    title: 'Audit dangerous file removal commands',
    input: {
      options: {
        searchQuery: 'remove',
        platform: 'linux',
        category: 'files',
        riskLevel: 'dangerous',
        showExamples: true,
        showFlags: true
      }
    },
    output: {
      success: true,
      message: 'Surfaced high-risk commands like rm -rf with safety notes'
    }
  },
  {
    title: 'Docker compose troubleshooting',
    input: {
      options: {
        searchQuery: 'compose',
        platform: 'docker',
        category: 'development',
        riskLevel: 'all',
        showExamples: true,
        showFlags: true
      }
    },
    output: {
      success: true,
      message: 'Returned docker compose workflows for multi-service projects'
    }
  }
];

export async function processCliCommandsReference(
  input: CLICommandsReferenceInput
): Promise<CLICommandsReferenceResult> {
  try {
    const { options } = input;
    let filteredCommands = CLI_COMMANDS_DATABASE;

    if (options.searchQuery.trim()) {
      const query = options.searchQuery.toLowerCase();
      filteredCommands = filteredCommands.filter(cmd =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.tags.some(tag => tag.toLowerCase().includes(query)) ||
        cmd.examples.some(example =>
          example.command.toLowerCase().includes(query) ||
          example.description.toLowerCase().includes(query)
        )
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
  description: 'Searchable command-line reference covering Linux, macOS, Windows, PowerShell, Docker, and Git with syntax, flags, and safety tips',
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
    title: 'CLI Commands Reference - Cross-Platform Terminal Cheat Sheet',
    description: 'Searchable CLI reference with syntax, flags, and examples for Linux, macOS, Windows, PowerShell, Docker, and Git. Includes safety warnings and related tips.',
    keywords: [
      'cli commands', 'command line reference', 'bash commands', 'shell commands',
      'linux commands', 'mac commands', 'windows cmd', 'powershell', 'docker commands',
      'git commands', 'terminal cheat sheet', 'devops tools'
    ]
  },
  faqs: [
    {
      question: 'What platforms and command types are covered?',
      answer: 'Linux, macOS, Windows CMD, PowerShell, Docker, and Git commands are curated with syntax, flags, examples, and related commands.'
    },
    {
      question: 'How do risk levels work?',
      answer: 'Commands are tagged Safe, Caution, or Dangerous based on potential side effects such as data loss or service disruption. Always double-check destructive commands before running them.'
    },
    {
      question: 'Can I search for specific use cases?',
      answer: 'Yes. Search across command names, descriptions, tags, and example text to find workflows like "deploy container" or "reset permissions" quickly.'
    },
    {
      question: 'How often is this list updated?',
      answer: 'The reference grows as we collect more frequently used commands from open documentation and internal runbooks. Suggestions are welcome via pull requests.'
    }
  ]
};
