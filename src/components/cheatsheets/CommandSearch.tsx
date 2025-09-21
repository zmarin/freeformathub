import { useMemo, useState } from 'react';

type Platform = 'linux' | 'windows' | 'powershell';
type CategoryId =
  | 'navigation'
  | 'file-ops'
  | 'text-processing'
  | 'processes'
  | 'networking'
  | 'system-info'
  | 'package-management'
  | 'containers';

interface CommandEntry {
  id: string;
  command: string;
  platform: Platform;
  summary: string;
  example?: string;
  category: CategoryId;
  tags: string[];
  tip?: string;
}

const CATEGORY_CONFIG: Record<
  CategoryId,
  { title: string; description: string }
> = {
  'navigation': {
    title: 'Navigation & Discovery',
    description:
      'Move through the filesystem, list contents, and locate files quickly.',
  },
  'file-ops': {
    title: 'File & Directory Operations',
    description: 'Create, copy, move, and clean up files or directories safely.',
  },
  'text-processing': {
    title: 'Search & Text Processing',
    description: 'Stream, filter, and inspect logs or text-based data.',
  },
  'processes': {
    title: 'Processes & Services',
    description:
      'Inspect running workloads, restart services, and monitor resource usage.',
  },
  'networking': {
    title: 'Networking & Connectivity',
    description:
      'Validate connectivity, inspect open ports, and transfer files securely.',
  },
  'system-info': {
    title: 'System Information & Health',
    description:
      'Check resource usage, platform details, uptime, and diagnostic reports.',
  },
  'package-management': {
    title: 'Packages & Updates',
    description:
      'Install software, update dependencies, and manage execution policies.',
  },
  'containers': {
    title: 'Containers & Virtualization',
    description: 'Build, run, and inspect Docker containers and Compose stacks.',
  },
};

const CATEGORY_ORDER: CategoryId[] = [
  'navigation',
  'file-ops',
  'text-processing',
  'processes',
  'networking',
  'system-info',
  'package-management',
  'containers',
];

const PLATFORM_LABELS: Record<Platform, string> = {
  'linux': 'Linux & macOS',
  'windows': 'Windows Command Prompt',
  'powershell': 'PowerShell',
};

const PLATFORM_BADGES: Record<Platform, string> = {
  'linux':
    'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200 border border-green-200 dark:border-green-500/40',
  'windows':
    'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 border border-blue-200 dark:border-blue-500/40',
  'powershell':
    'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40',
};

const COMMANDS: CommandEntry[] = [
  // Linux & macOS
  {
    id: 'linux-pwd',
    command: 'pwd',
    platform: 'linux',
    summary: 'Print the current working directory.',
    example: 'pwd',
    category: 'navigation',
    tags: ['path', 'context'],
  },
  {
    id: 'linux-ls',
    command: 'ls -al',
    platform: 'linux',
    summary: 'List directory contents with permissions and hidden files.',
    example: 'ls -al /var/log',
    category: 'navigation',
    tags: ['listing', 'permissions', 'hidden-files'],
  },
  {
    id: 'linux-cd',
    command: 'cd /etc/nginx',
    platform: 'linux',
    summary: 'Change the current directory.',
    example: 'cd ~/projects/freeformathub',
    category: 'navigation',
    tags: ['path', 'navigation'],
  },
  {
    id: 'linux-find',
    command: 'find . -name "*.log" -mtime -1',
    platform: 'linux',
    summary: 'Locate files matching a pattern that were modified recently.',
    example: 'find /var/log -name "*.log" -mtime -1',
    category: 'navigation',
    tags: ['search', 'files', 'audit'],
  },
  {
    id: 'mac-open-finder',
    command: 'open .',
    platform: 'linux',
    summary: 'Open the current directory in Finder or launch files with default apps.',
    example: 'open README.md',
    category: 'navigation',
    tags: ['macos', 'finder'],
  },
  {
    id: 'mac-mdls',
    command: 'mdls file.txt',
    platform: 'linux',
    summary: 'Inspect Spotlight metadata and extended attributes for files.',
    category: 'navigation',
    tags: ['macos', 'metadata'],
  },
  {
    id: 'mac-mdfind',
    command: 'mdfind "search term"',
    platform: 'linux',
    summary: 'Search the Spotlight index directly from the terminal.',
    category: 'navigation',
    tags: ['macos', 'search'],
  },
  {
    id: 'linux-grep',
    command: 'grep -R "ERROR" /var/log/nginx',
    platform: 'linux',
    summary: 'Recursively search files for a case-sensitive pattern.',
    example: 'grep -R "timeout" src/',
    category: 'text-processing',
    tags: ['logs', 'pattern-matching'],
  },
  {
    id: 'mac-sed-inline',
    command: "sed -i '' 's/old/new/g' file.txt",
    platform: 'linux',
    summary: 'BSD sed requires an empty backup suffix when editing in place.',
    category: 'text-processing',
    tags: ['macos', 'sed'],
  },
  {
    id: 'linux-tail',
    command: 'tail -f /var/log/syslog',
    platform: 'linux',
    summary: 'Stream file updates in real time for live troubleshooting.',
    example: 'tail -f storage/logs/laravel.log',
    category: 'text-processing',
    tags: ['logs', 'monitoring'],
  },
  {
    id: 'linux-chmod',
    command: 'chmod 755 deploy.sh',
    platform: 'linux',
    summary: 'Update file permissions using symbolic or octal notation.',
    example: 'chmod u+x scripts/migrate.sh',
    category: 'file-ops',
    tags: ['permissions', 'executable'],
  },
  {
    id: 'mac-ls-extended',
    command: 'ls -la@',
    platform: 'linux',
    summary: 'List files with macOS extended attributes and ACLs.',
    category: 'file-ops',
    tags: ['macos', 'attributes'],
  },
  {
    id: 'linux-chown',
    command: 'sudo chown -R www-data:www-data /var/www/app',
    platform: 'linux',
    summary: 'Transfer ownership of files or directories recursively.',
    example: 'sudo chown -R $USER:$USER ~/apps',
    category: 'file-ops',
    tags: ['ownership', 'permissions', 'recursive'],
  },
  {
    id: 'linux-cp',
    command: 'cp -r src/ backup/',
    platform: 'linux',
    summary: 'Copy directories recursively, preserving structure.',
    example: 'cp -r config/ config.backup/',
    category: 'file-ops',
    tags: ['copy', 'backup'],
  },
  {
    id: 'linux-tar',
    command: 'tar -czvf logs.tar.gz /var/log/nginx/',
    platform: 'linux',
    summary: 'Create a compressed archive using gzip.',
    example: 'tar -czvf release.tar.gz dist/',
    category: 'file-ops',
    tags: ['archive', 'compression'],
  },
  {
    id: 'mac-xattr',
    command: 'xattr -l file.txt',
    platform: 'linux',
    summary: 'Inspect or troubleshoot macOS extended attributes.',
    category: 'file-ops',
    tags: ['macos', 'attributes'],
  },
  {
    id: 'mac-find-exec',
    command: 'find . -name "*.log" -exec rm {} \\;',
    platform: 'linux',
    summary: 'BSD find terminates -exec with a semicolon; use + only on GNU find.',
    category: 'file-ops',
    tags: ['macos', 'find'],
  },
  {
    id: 'linux-rm',
    command: 'rm -rf build/',
    platform: 'linux',
    summary: 'Delete files or directories recursively and forcefully.',
    example: 'rm -rf node_modules/.cache',
    category: 'file-ops',
    tags: ['cleanup', 'danger'],
    tip: 'Double-check the target path—recursive deletes are irreversible.',
  },
  {
    id: 'linux-ps',
    command: 'ps aux | grep node',
    platform: 'linux',
    summary: 'Display running processes and filter for a keyword.',
    example: 'ps aux | grep php-fpm',
    category: 'processes',
    tags: ['process', 'filter'],
  },
  {
    id: 'linux-systemctl-status',
    command: 'sudo systemctl status nginx',
    platform: 'linux',
    summary: 'Inspect systemd service state, logs, and uptime.',
    example: 'sudo systemctl status docker',
    category: 'processes',
    tags: ['services', 'systemd'],
  },
  {
    id: 'linux-systemctl-restart',
    command: 'sudo systemctl restart nginx',
    platform: 'linux',
    summary: 'Restart a systemd-managed service.',
    example: 'sudo systemctl restart app.service',
    category: 'processes',
    tags: ['services', 'restart'],
  },
  {
    id: 'mac-launchctl-list',
    command: 'launchctl list',
    platform: 'linux',
    summary: 'List launch agents and daemons managed by launchd on macOS.',
    category: 'processes',
    tags: ['macos', 'services'],
  },
  {
    id: 'mac-launchctl-load',
    command: 'sudo launchctl load /Library/LaunchDaemons/com.example.app.plist',
    platform: 'linux',
    summary: 'Load or unload launchd property lists to control services.',
    category: 'processes',
    tags: ['macos', 'services'],
    tip: 'Use `launchctl bootout system /path.plist` on recent macOS releases to unload.',
  },
  {
    id: 'linux-journalctl',
    command: 'journalctl -u nginx --since "1 hour ago"',
    platform: 'linux',
    summary: 'Review recent service logs using journalctl time filters.',
    example: 'journalctl -u docker --since "yesterday"',
    category: 'text-processing',
    tags: ['logs', 'systemd', 'audit'],
  },
  {
    id: 'linux-top',
    command: 'top',
    platform: 'linux',
    summary: 'Live view of CPU, memory, and process activity.',
    example: 'top -H',
    category: 'processes',
    tags: ['monitoring', 'performance'],
  },
  {
    id: 'mac-top-sort',
    command: 'top -o cpu',
    platform: 'linux',
    summary: 'macOS top uses BSD flags; -o cpu sorts by CPU usage.',
    category: 'processes',
    tags: ['macos', 'monitoring'],
  },
  {
    id: 'linux-df',
    command: 'df -h',
    platform: 'linux',
    summary: 'Display disk usage with human-readable units.',
    example: 'df -h /dev/sda1',
    category: 'system-info',
    tags: ['disk', 'capacity'],
  },
  {
    id: 'linux-du',
    command: 'du -sh *',
    platform: 'linux',
    summary: 'Summarize directory sizes in the current path.',
    example: 'du -sh var/*',
    category: 'system-info',
    tags: ['disk', 'cleanup'],
  },
  {
    id: 'mac-system-profiler',
    command: 'system_profiler SPHardwareDataType',
    platform: 'linux',
    summary: 'Detailed hardware summary on macOS (CPU, memory, identifiers).',
    category: 'system-info',
    tags: ['macos', 'hardware'],
  },
  {
    id: 'mac-sw-vers',
    command: 'sw_vers',
    platform: 'linux',
    summary: 'Show macOS product version, build number, and marketing name.',
    category: 'system-info',
    tags: ['macos', 'version'],
  },
  {
    id: 'linux-uptime',
    command: 'uptime',
    platform: 'linux',
    summary: 'Show system uptime and load averages.',
    example: 'uptime',
    category: 'system-info',
    tags: ['load', 'health'],
  },
  {
    id: 'mac-date-parse',
    command: 'date -j -f "%Y-%m-%d" "2024-01-01" "+%s"',
    platform: 'linux',
    summary: 'BSD date syntax parses timestamps without mutating system time.',
    category: 'system-info',
    tags: ['macos', 'date'],
  },
  {
    id: 'linux-uname',
    command: 'uname -a',
    platform: 'linux',
    summary: 'Print kernel version and architecture information.',
    example: 'uname -r',
    category: 'system-info',
    tags: ['kernel', 'platform'],
  },
  {
    id: 'linux-ip',
    command: 'ip addr show',
    platform: 'linux',
    summary: 'Display network interfaces and IP configuration.',
    example: 'ip addr show eth0',
    category: 'networking',
    tags: ['network', 'interfaces'],
  },
  {
    id: 'mac-ifconfig',
    command: 'ifconfig',
    platform: 'linux',
    summary: 'macOS retains BSD ifconfig output alongside ip tooling.',
    example: 'ifconfig en0',
    category: 'networking',
    tags: ['macos', 'network'],
  },
  {
    id: 'linux-ss',
    command: 'ss -tulpn',
    platform: 'linux',
    summary: 'List listening sockets with process owners.',
    example: 'sudo ss -tulpn | grep 5432',
    category: 'networking',
    tags: ['ports', 'tcp', 'udp'],
  },
  {
    id: 'linux-curl',
    command: 'curl -I https://example.com',
    platform: 'linux',
    summary: 'Fetch HTTP headers for a quick health check.',
    example: 'curl -s https://api.example.com/health | jq',
    category: 'networking',
    tags: ['http', 'testing'],
  },
  {
    id: 'mac-networksetup',
    command: 'networksetup -listallhardwareports',
    platform: 'linux',
    summary: 'List macOS network adapters and corresponding device names.',
    example: 'networksetup -getinfo "Wi-Fi"',
    category: 'networking',
    tags: ['macos', 'network'],
  },
  {
    id: 'mac-airport-scan',
    command: '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s',
    platform: 'linux',
    summary: 'Scan nearby Wi-Fi networks using the legacy airport utility.',
    category: 'networking',
    tags: ['macos', 'wifi'],
    tip: 'Create an alias, e.g. `alias airport="/System/.../airport"`, to shorten the path.',
  },
  {
    id: 'linux-scp',
    command: 'scp backup.tar.gz deploy@host:/var/backups/',
    platform: 'linux',
    summary: 'Securely copy files between hosts over SSH.',
    example: 'scp -r dist/ deploy@host:/var/www/app/',
    category: 'networking',
    tags: ['transfer', 'ssh'],
  },
  {
    id: 'linux-apt-update',
    command: 'sudo apt update && sudo apt upgrade',
    platform: 'linux',
    summary: 'Refresh package indexes and install upgrades (Debian/Ubuntu).',
    example: 'sudo apt update && sudo apt upgrade -y',
    category: 'package-management',
    tags: ['packages', 'updates'],
  },
  {
    id: 'linux-apt-install',
    command: 'sudo apt install build-essential',
    platform: 'linux',
    summary: 'Install packages with dependencies.',
    example: 'sudo apt install nginx ufw',
    category: 'package-management',
    tags: ['packages', 'install'],
  },
  {
    id: 'mac-brew-install',
    command: 'brew install jq',
    platform: 'linux',
    summary: 'Install Homebrew formulae on macOS systems.',
    example: 'brew install node',
    category: 'package-management',
    tags: ['macos', 'packages'],
  },
  {
    id: 'linux-snap',
    command: 'sudo snap install --classic code',
    platform: 'linux',
    summary: 'Install snap packages with classic confinement.',
    example: 'sudo snap install --classic go',
    category: 'package-management',
    tags: ['packages', 'snap'],
  },
  {
    id: 'mac-brew-upgrade',
    command: 'brew update && brew upgrade',
    platform: 'linux',
    summary: 'Refresh tap metadata and upgrade installed Homebrew packages.',
    category: 'package-management',
    tags: ['macos', 'packages'],
  },
  {
    id: 'mac-brew-services',
    command: 'brew services restart redis',
    platform: 'linux',
    summary: 'Control background services installed via Homebrew.',
    category: 'package-management',
    tags: ['macos', 'services'],
  },
  // Windows CMD
  {
    id: 'windows-dir',
    command: 'dir',
    platform: 'windows',
    summary: 'List files and folders in the current directory.',
    example: 'dir C:\\Logs',
    category: 'navigation',
    tags: ['listing', 'filesystem'],
  },
  {
    id: 'windows-cd',
    command: 'cd C:\\Projects\\App',
    platform: 'windows',
    summary: 'Change the current working directory.',
    example: 'cd ..',
    category: 'navigation',
    tags: ['navigation', 'filesystem'],
  },
  {
    id: 'windows-tree',
    command: 'tree /F',
    platform: 'windows',
    summary: 'Display directory structure with files.',
    example: 'tree C:\\Repos\\FreeFormatHub /F',
    category: 'navigation',
    tags: ['structure', 'audit'],
  },
  {
    id: 'windows-copy',
    command: 'copy config.example.json config.json',
    platform: 'windows',
    summary: 'Copy files while staying in Command Prompt.',
    example: 'copy NUL .env',
    category: 'file-ops',
    tags: ['copy', 'files'],
  },
  {
    id: 'windows-robocopy',
    command: 'robocopy C:\\Projects C:\\Backup /MIR /XF *.log',
    platform: 'windows',
    summary: 'Mirror directories with retry logic and filtering.',
    example: 'robocopy .\\build \\ileserver\\share /E',
    category: 'file-ops',
    tags: ['backup', 'sync'],
    tip: 'Robocopy is resilient—review flags before running destructive mirrors.',
  },
  {
    id: 'windows-del',
    command: 'del /S /Q *.tmp',
    platform: 'windows',
    summary: 'Delete files recursively without confirmation prompts.',
    example: 'del /S /Q node_modules\\*.log',
    category: 'file-ops',
    tags: ['cleanup', 'danger'],
  },
  {
    id: 'windows-findstr',
    command: 'findstr /S /I "error" *.log',
    platform: 'windows',
    summary: 'Search files recursively for a case-insensitive pattern.',
    example: 'findstr /S /I "Timeout" logs\\*.log',
    category: 'text-processing',
    tags: ['logs', 'search'],
  },
  {
    id: 'windows-type',
    command: 'type README.txt',
    platform: 'windows',
    summary: 'Print the contents of a text file to the console.',
    example: 'type C:\\Windows\\System32\\drivers\\etc\\hosts',
    category: 'text-processing',
    tags: ['view', 'text'],
  },
  {
    id: 'windows-ipconfig',
    command: 'ipconfig /all',
    platform: 'windows',
    summary: 'Display full network adapter configuration.',
    example: 'ipconfig /flushdns',
    category: 'networking',
    tags: ['network', 'diagnostics'],
  },
  {
    id: 'windows-ping',
    command: 'ping -n 5 api.example.com',
    platform: 'windows',
    summary: 'Send multiple ICMP echo requests.',
    example: 'ping -t localhost',
    category: 'networking',
    tags: ['connectivity', 'latency'],
  },
  {
    id: 'windows-tracert',
    command: 'tracert example.com',
    platform: 'windows',
    summary: 'Trace the route packets take to a destination.',
    example: 'tracert 8.8.8.8',
    category: 'networking',
    tags: ['routing', 'diagnostics'],
  },
  {
    id: 'windows-netstat',
    command: 'netstat -ano | findstr :3000',
    platform: 'windows',
    summary: 'Show active connections with owning process IDs.',
    example: 'netstat -ano | findstr 443',
    category: 'networking',
    tags: ['ports', 'monitoring'],
  },
  {
    id: 'windows-tasklist',
    command: 'tasklist',
    platform: 'windows',
    summary: 'List running processes with memory usage.',
    example: 'tasklist /FI "IMAGENAME eq node.exe"',
    category: 'processes',
    tags: ['process', 'monitoring'],
  },
  {
    id: 'windows-taskkill',
    command: 'taskkill /F /IM node.exe',
    platform: 'windows',
    summary: 'Forcefully terminate processes by image name.',
    example: 'taskkill /PID 1234 /T',
    category: 'processes',
    tags: ['process', 'terminate'],
  },
  {
    id: 'windows-systeminfo',
    command: 'systeminfo',
    platform: 'windows',
    summary: 'Dump OS build, hardware, and patch level information.',
    example: 'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"',
    category: 'system-info',
    tags: ['diagnostics', 'inventory'],
  },
  {
    id: 'windows-sfc',
    command: 'sfc /scannow',
    platform: 'windows',
    summary: 'Scan protected system files and repair issues automatically.',
    example: 'sfc /verifyonly',
    category: 'system-info',
    tags: ['integrity', 'repair'],
  },
  {
    id: 'windows-chkdsk',
    command: 'chkdsk C: /F',
    platform: 'windows',
    summary: 'Check disk integrity and fix detected errors.',
    example: 'chkdsk D: /F /R',
    category: 'system-info',
    tags: ['disk', 'maintenance'],
  },
  {
    id: 'windows-where',
    command: 'where node',
    platform: 'windows',
    summary: 'Locate executables in the PATH variable.',
    example: 'where git',
    category: 'navigation',
    tags: ['path', 'executables'],
  },
  {
    id: 'windows-set',
    command: 'set PATH',
    platform: 'windows',
    summary: 'Display environment variable values within the session.',
    example: 'set NODE_ENV',
    category: 'system-info',
    tags: ['environment', 'variables'],
  },
  {
    id: 'windows-setx',
    command: 'setx NODE_ENV production',
    platform: 'windows',
    summary: 'Persist environment variables for future sessions.',
    example: 'setx API_URL https://api.example.com',
    category: 'system-info',
    tags: ['environment', 'variables'],
    tip: 'Restart your shell to load new values created with setx.',
  },
  {
    id: 'windows-schtasks',
    command: 'schtasks /Query /FO TABLE',
    platform: 'windows',
    summary: 'List scheduled tasks in a formatted table.',
    example: 'schtasks /Create /SC DAILY /TN Backup /TR backup.bat /ST 01:00',
    category: 'processes',
    tags: ['automation', 'scheduling'],
  },
  {
    id: 'windows-winget-search',
    command: 'winget search vscode',
    platform: 'windows',
    summary: 'Discover packages available via Windows Package Manager.',
    example: 'winget search --source msstore "PowerToys"',
    category: 'package-management',
    tags: ['packages', 'search'],
  },
  {
    id: 'windows-winget-install',
    command: 'winget install --id Microsoft.VisualStudioCode',
    platform: 'windows',
    summary: 'Install applications using winget identifiers.',
    example: 'winget install --id Git.Git -e',
    category: 'package-management',
    tags: ['packages', 'install'],
  },
  // PowerShell
  {
    id: 'ps-get-childitem',
    command: 'Get-ChildItem',
    platform: 'powershell',
    summary: 'List directory contents (alias: ls, dir).',
    example: 'Get-ChildItem -Force C:\\Logs',
    category: 'navigation',
    tags: ['listing', 'filesystem'],
  },
  {
    id: 'ps-get-location',
    command: 'Get-Location',
    platform: 'powershell',
    summary: 'Return the current working directory path.',
    example: 'Get-Location | Select-Object -ExpandProperty Path',
    category: 'navigation',
    tags: ['path', 'context'],
  },
  {
    id: 'ps-set-location',
    command: 'Set-Location ..',
    platform: 'powershell',
    summary: 'Change the current working directory (alias: cd).',
    example: 'Set-Location C:\\Projects\\FreeFormatHub',
    category: 'navigation',
    tags: ['navigation', 'filesystem'],
  },
  {
    id: 'ps-get-content',
    command: 'Get-Content .\\logs\\app.log -Tail 50',
    platform: 'powershell',
    summary: 'Stream the last lines of a file, similar to tail -f.',
    example: 'Get-Content ./logs/app.log -Wait',
    category: 'text-processing',
    tags: ['logs', 'monitoring'],
  },
  {
    id: 'ps-select-string',
    command: 'Select-String -Pattern "Exception" -Path *.log',
    platform: 'powershell',
    summary: 'Search files for patterns using regex-capable cmdlet.',
    example: 'Select-String -Pattern "ERROR" -Path .\\*.txt -SimpleMatch',
    category: 'text-processing',
    tags: ['search', 'regex'],
  },
  {
    id: 'ps-get-process',
    command: 'Get-Process',
    platform: 'powershell',
    summary: 'List running processes with rich object metadata.',
    example: 'Get-Process -Name node',
    category: 'processes',
    tags: ['process', 'monitoring'],
  },
  {
    id: 'ps-stop-process',
    command: 'Stop-Process -Name node -Force',
    platform: 'powershell',
    summary: 'Terminate processes using names or IDs.',
    example: 'Stop-Process -Id 4242 -Force',
    category: 'processes',
    tags: ['process', 'terminate'],
  },
  {
    id: 'ps-get-service',
    command: 'Get-Service',
    platform: 'powershell',
    summary: 'List Windows services with status information.',
    example: 'Get-Service -Name wuauserv',
    category: 'processes',
    tags: ['services', 'status'],
  },
  {
    id: 'ps-restart-service',
    command: 'Restart-Service -Name Spooler',
    platform: 'powershell',
    summary: 'Restart a Windows service gracefully.',
    example: 'Restart-Service -DisplayName "Print Spooler" -Force',
    category: 'processes',
    tags: ['services', 'restart'],
  },
  {
    id: 'ps-get-eventlog',
    command: 'Get-EventLog -LogName Application -Newest 20',
    platform: 'powershell',
    summary: 'Read legacy Windows event logs in chronological order.',
    example: 'Get-EventLog -LogName System -After (Get-Date).AddHours(-2)',
    category: 'text-processing',
    tags: ['logs', 'diagnostics'],
  },
  {
    id: 'ps-get-winevent',
    command: 'Get-WinEvent -LogName System -MaxEvents 50',
    platform: 'powershell',
    summary: 'Query modern Windows event logs efficiently.',
    example: 'Get-WinEvent -FilterHashtable @{ProviderName="Service Control Manager"; StartTime=(Get-Date).AddHours(-1)}',
    category: 'text-processing',
    tags: ['logs', 'filter'],
  },
  {
    id: 'ps-test-connection',
    command: 'Test-Connection server01 -Count 4',
    platform: 'powershell',
    summary: 'PowerShell-native ping with average latency reporting.',
    example: 'Test-Connection 8.8.8.8 -Quiet',
    category: 'networking',
    tags: ['connectivity', 'latency'],
  },
  {
    id: 'ps-get-nettcpconnection',
    command: 'Get-NetTCPConnection -State Listen',
    platform: 'powershell',
    summary: 'List listening TCP ports with owning process identifiers.',
    example: 'Get-NetTCPConnection -State Listen | Select-Object -First 10',
    category: 'networking',
    tags: ['network', 'ports'],
  },
  {
    id: 'ps-invoke-webrequest',
    command: 'Invoke-WebRequest https://example.com -OutFile page.html',
    platform: 'powershell',
    summary: 'Download resources over HTTP or submit forms.',
    example: 'Invoke-WebRequest -Uri https://api.example.com/health',
    category: 'networking',
    tags: ['http', 'download'],
  },
  {
    id: 'ps-get-help',
    command: 'Get-Help Get-Service -Online',
    platform: 'powershell',
    summary: 'Open the latest documentation for a cmdlet.',
    example: 'Get-Help Test-Connection -Detailed',
    category: 'system-info',
    tags: ['documentation', 'help'],
  },
  {
    id: 'ps-install-module',
    command: 'Install-Module Pester -Scope CurrentUser',
    platform: 'powershell',
    summary: 'Install modules from the PowerShell Gallery.',
    example: 'Install-Module Az -AllowClobber',
    category: 'package-management',
    tags: ['modules', 'install'],
  },
  {
    id: 'ps-get-executionpolicy',
    command: 'Get-ExecutionPolicy',
    platform: 'powershell',
    summary: 'Review script execution security policy.',
    example: 'Get-ExecutionPolicy -Scope CurrentUser',
    category: 'system-info',
    tags: ['security', 'policy'],
  },
  {
    id: 'ps-set-executionpolicy',
    command: 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned',
    platform: 'powershell',
    summary: 'Allow locally written scripts while blocking unsigned downloads.',
    example: 'Set-ExecutionPolicy Bypass -Scope Process',
    category: 'package-management',
    tags: ['security', 'policy'],
    tip: 'Use the Process scope for one-off sessions to minimize risk.',
  },
  {
    id: 'ps-new-item',
    command: 'New-Item -ItemType Directory -Path . -Name logs',
    platform: 'powershell',
    summary: 'Create directories or files with explicit types.',
    example: 'New-Item -ItemType File -Path . -Name .gitignore',
    category: 'file-ops',
    tags: ['create', 'filesystem'],
  },
  {
    id: 'ps-copy-item',
    command: 'Copy-Item -Path .\\config.json -Destination .\\backup\\',
    platform: 'powershell',
    summary: 'Copy files or directories with rich pipeline support.',
    example: 'Copy-Item -Path src -Destination dist -Recurse',
    category: 'file-ops',
    tags: ['copy', 'pipeline'],
  },
  {
    id: 'ps-remove-item',
    command: 'Remove-Item -Path .\\tmp\\ -Recurse -Force',
    platform: 'powershell',
    summary: 'Delete directories recursively while bypassing prompts.',
    example: 'Remove-Item -Path .\\build -Recurse -Force',
    category: 'file-ops',
    tags: ['cleanup', 'danger'],
  },
  {
    id: 'ps-start-transcript',
    command: 'Start-Transcript -Path .\\session.log',
    platform: 'powershell',
    summary: 'Record PowerShell session output for auditing.',
    example: 'Start-Transcript -Append -Path .\\transcripts\\deploy.log',
    category: 'system-info',
    tags: ['auditing', 'logging'],
  },
  // Container tooling
  {
    id: 'docker-ps',
    command: 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    platform: 'linux',
    summary: 'List running containers with friendly columns.',
    category: 'containers',
    tags: ['docker', 'inventory'],
  },
  {
    id: 'docker-logs-follow',
    command: 'docker logs -f web',
    platform: 'linux',
    summary: 'Stream container logs for live debugging.',
    category: 'containers',
    tags: ['docker', 'logs'],
    tip: 'Add `--tail 200` to limit the backlog before following.',
  },
  {
    id: 'docker-exec-shell',
    command: 'docker exec -it web /bin/bash',
    platform: 'linux',
    summary: 'Open an interactive shell inside a running container.',
    category: 'containers',
    tags: ['docker', 'debugging'],
  },
  {
    id: 'docker-compose-up',
    command: 'docker compose up -d',
    platform: 'linux',
    summary: 'Start services defined in docker-compose.yml in detached mode.',
    category: 'containers',
    tags: ['docker', 'compose'],
  },
  {
    id: 'docker-compose-logs',
    command: 'docker compose logs -f api',
    platform: 'linux',
    summary: 'Follow logs for compose services without leaving the host shell.',
    category: 'containers',
    tags: ['docker', 'compose', 'logs'],
  },
  {
    id: 'docker-system-prune',
    command: 'docker system prune -af',
    platform: 'linux',
    summary: 'Remove unused containers, networks, dangling images, and caches.',
    category: 'containers',
    tags: ['docker', 'cleanup'],
    tip: 'Run in CI to keep build agents lean; review output before using on production hosts.',
  },
];

const platformFilters: Array<{ id: 'all' | Platform; label: string }> = [
  { id: 'all', label: 'All platforms' },
  { id: 'linux', label: PLATFORM_LABELS.linux },
  { id: 'windows', label: PLATFORM_LABELS.windows },
  { id: 'powershell', label: PLATFORM_LABELS.powershell },
];

const CommandSearch = () => {
  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');

  const queryFiltered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return COMMANDS;
    }

    const terms = trimmed.split(/\s+/);
    return COMMANDS.filter((entry) => {
      const haystack = [
        entry.command,
        entry.summary,
        entry.example ?? '',
        entry.tags.join(' '),
        PLATFORM_LABELS[entry.platform],
      ]
        .join(' ')
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [query]);

  const platformCounts = useMemo(() => {
    return queryFiltered.reduce(
      (acc, entry) => {
        acc[entry.platform] += 1;
        return acc;
      },
      { linux: 0, windows: 0, powershell: 0 } as Record<Platform, number>,
    );
  }, [queryFiltered]);

  const filteredCommands = useMemo(() => {
    if (platformFilter === 'all') {
      return queryFiltered;
    }
    return queryFiltered.filter((entry) => entry.platform === platformFilter);
  }, [queryFiltered, platformFilter]);

  const groupedCommands = useMemo(() => {
    return CATEGORY_ORDER.map((categoryId) => {
      const commands = filteredCommands.filter(
        (entry) => entry.category === categoryId,
      );

      return {
        id: categoryId,
        title: CATEGORY_CONFIG[categoryId].title,
        description: CATEGORY_CONFIG[categoryId].description,
        commands,
      };
    }).filter((section) => section.commands.length > 0);
  }, [filteredCommands]);

  const totalMatches = filteredCommands.length;

  const handleClear = () => {
    setQuery('');
    setPlatformFilter('all');
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Command explorer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              Search across Linux, Windows, and PowerShell commands. Filter by
              platform to focus on the environment you are troubleshooting.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Search command syntax or descriptions
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. permissions, restart service, open ports"
              className="mt-2 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {platformFilters.map((filter) => {
              const isActive = platformFilter === filter.id;
              const countLabel =
                filter.id === 'all'
                  ? `${queryFiltered.length}`
                  : `${platformCounts[filter.id]}`;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setPlatformFilter(filter.id)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:text-blue-200',
                  ].join(' ')}
                >
                  <span>{filter.label}</span>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                    {countLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {totalMatches} command{totalMatches === 1 ? '' : 's'} matching
            your filters.
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {groupedCommands.length === 0 ? (
          <div className="p-6 sm:p-8 text-gray-600 dark:text-gray-300">
            <p className="font-medium">No commands matched your search.</p>
            <p className="mt-2 text-sm">
              Try different keywords (for example "port" or "permissions"), or
              switch platforms to see the full catalog.
            </p>
          </div>
        ) : (
          groupedCommands.map((section) => (
            <div key={section.id} className="p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {section.description}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                  {section.commands.length} command
                  {section.commands.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {section.commands.map((entry) => (
                  <article
                    key={entry.id}
                    className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {entry.command}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${PLATFORM_BADGES[entry.platform]}`}
                      >
                        {PLATFORM_LABELS[entry.platform]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      {entry.summary}
                    </p>

                    {entry.example && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Example
                        </p>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900/90 px-3 py-2 text-xs text-green-100">
                          <code>{entry.example}</code>
                        </pre>
                      </div>
                    )}

                    {entry.tip && (
                      <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
                        Tip: {entry.tip}
                      </p>
                    )}

                    {entry.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <span
                            key={`${entry.id}-${tag}`}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-slate-800 dark:text-gray-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default CommandSearch;
