import { Tool, ToolExample } from '../../types/tool';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface AICliCommand {
  id: string;
  command: string;
  description: string;
  tool: 'claude' | 'ollama' | 'openai' | 'gemini' | 'cursor' | 'copilot' | 'aider';
  category: 'chat' | 'code' | 'models' | 'config' | 'auth' | 'files' | 'server';
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
  officialDocs?: string;
}

export const AI_CLI_COMMANDS: AICliCommand[] = [
  // Claude Code CLI
  {
    id: 'claude-start-chat',
    command: 'claude',
    description: 'Start interactive Claude Code session',
    tool: 'claude',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'claude [options]',
    examples: [
      { command: 'claude', description: 'Start interactive session in current directory' },
      { command: 'claude --help', description: 'Show help information' },
      { command: 'claude --version', description: 'Show version information' }
    ],
    flags: [
      { flag: '--help', description: 'Show help information' },
      { flag: '--version', description: 'Show version information' },
      { flag: '--debug', description: 'Enable debug mode' }
    ],
    tags: ['interactive', 'chat', 'assistant'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code'
  },
  {
    id: 'claude-dangerous-skip',
    command: 'claude --dangerously-skip-permissions',
    description: 'Skip permission prompts (use with extreme caution)',
    tool: 'claude',
    category: 'config',
    riskLevel: 'dangerous',
    syntax: 'claude --dangerously-skip-permissions',
    examples: [
      { command: 'claude --dangerously-skip-permissions', description: 'Start Claude without permission prompts' }
    ],
    flags: [
      { flag: '--dangerously-skip-permissions', description: 'Skip all permission prompts - DANGEROUS', example: 'claude --dangerously-skip-permissions' }
    ],
    notes: [
      'This flag bypasses all security prompts',
      'Only use in trusted environments',
      'Can lead to unintended file modifications or system changes'
    ],
    tags: ['dangerous', 'permissions', 'security'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/security'
  },
  {
    id: 'claude-config',
    command: 'claude config',
    description: 'Configure Claude Code settings',
    tool: 'claude',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'claude config [subcommand]',
    examples: [
      { command: 'claude config show', description: 'Display current configuration' },
      { command: 'claude config reset', description: 'Reset configuration to defaults' }
    ],
    flags: [
      { flag: 'show', description: 'Display current configuration' },
      { flag: 'reset', description: 'Reset to default settings' }
    ],
    tags: ['config', 'settings', 'setup'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/configuration'
  },

  // Ollama CLI
  {
    id: 'ollama-run',
    command: 'ollama run',
    description: 'Run a local AI model',
    tool: 'ollama',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'ollama run <model> [prompt]',
    examples: [
      { command: 'ollama run llama2', description: 'Start interactive chat with Llama 2' },
      { command: 'ollama run codellama "Write a Python function"', description: 'One-shot prompt with CodeLlama' },
      { command: 'ollama run mistral', description: 'Start chat with Mistral model' }
    ],
    flags: [
      { flag: '<model>', description: 'Model name to run (e.g., llama2, codellama, mistral)' },
      { flag: '[prompt]', description: 'Optional initial prompt' }
    ],
    tags: ['models', 'chat', 'local'],
    officialDocs: 'https://github.com/ollama/ollama'
  },
  {
    id: 'ollama-pull',
    command: 'ollama pull',
    description: 'Download a model from registry',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama pull <model>',
    examples: [
      { command: 'ollama pull llama2', description: 'Download Llama 2 model' },
      { command: 'ollama pull codellama:7b', description: 'Download specific CodeLlama variant' },
      { command: 'ollama pull mistral:latest', description: 'Download latest Mistral model' }
    ],
    flags: [
      { flag: '<model>', description: 'Model name to download' },
      { flag: ':tag', description: 'Specific model variant (e.g., 7b, 13b, latest)' }
    ],
    tags: ['download', 'models', 'registry'],
    officialDocs: 'https://github.com/ollama/ollama#model-library'
  },
  {
    id: 'ollama-list',
    command: 'ollama list',
    description: 'List installed models',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama list',
    examples: [
      { command: 'ollama list', description: 'Show all downloaded models with sizes' }
    ],
    flags: [],
    tags: ['models', 'list', 'info'],
    officialDocs: 'https://github.com/ollama/ollama'
  },
  {
    id: 'ollama-serve',
    command: 'ollama serve',
    description: 'Start Ollama API server',
    tool: 'ollama',
    category: 'server',
    riskLevel: 'safe',
    syntax: 'ollama serve',
    examples: [
      { command: 'ollama serve', description: 'Start server on default port 11434' },
      { command: 'OLLAMA_HOST=0.0.0.0 ollama serve', description: 'Start server accessible from all interfaces' }
    ],
    flags: [
      { flag: 'OLLAMA_HOST', description: 'Environment variable to set host address' },
      { flag: 'OLLAMA_PORT', description: 'Environment variable to set port' }
    ],
    tags: ['server', 'api', 'daemon'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/api.md'
  },

  // OpenAI CLI
  {
    id: 'openai-chat',
    command: 'openai api chat.completions.create',
    description: 'Create chat completion via OpenAI API',
    tool: 'openai',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'openai api chat.completions.create [options]',
    examples: [
      { command: 'openai api chat.completions.create -m gpt-4 -g user "Hello"', description: 'Simple chat with GPT-4' },
      { command: 'openai api chat.completions.create -m gpt-3.5-turbo --max-tokens 100', description: 'Chat with token limit' }
    ],
    flags: [
      { flag: '-m, --model', description: 'Model to use (gpt-4, gpt-3.5-turbo)' },
      { flag: '-g, --message', description: 'Add a message with role (user, system, assistant)' },
      { flag: '--max-tokens', description: 'Maximum tokens in response' },
      { flag: '--temperature', description: 'Sampling temperature (0-2)' }
    ],
    tags: ['chat', 'api', 'gpt'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/chat'
  },
  {
    id: 'openai-models',
    command: 'openai api models.list',
    description: 'List available OpenAI models',
    tool: 'openai',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'openai api models.list',
    examples: [
      { command: 'openai api models.list', description: 'Show all available models' }
    ],
    flags: [],
    tags: ['models', 'list', 'api'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/models'
  },
  {
    id: 'openai-auth',
    command: 'openai api key set',
    description: 'Set OpenAI API key',
    tool: 'openai',
    category: 'auth',
    riskLevel: 'caution',
    syntax: 'openai api key set <api-key>',
    examples: [
      { command: 'openai api key set sk-...', description: 'Set your OpenAI API key' }
    ],
    flags: [
      { flag: '<api-key>', description: 'Your OpenAI API key starting with sk-' }
    ],
    notes: [
      'Keep your API key secure',
      'Never share or commit API keys to version control'
    ],
    tags: ['auth', 'api-key', 'setup'],
    officialDocs: 'https://platform.openai.com/docs/quickstart'
  },

  // Google Gemini CLI
  {
    id: 'gemini-chat',
    command: 'gemini chat',
    description: 'Start interactive chat with Gemini',
    tool: 'gemini',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'gemini chat [options]',
    examples: [
      { command: 'gemini chat', description: 'Start interactive Gemini chat' },
      { command: 'gemini chat --model gemini-pro', description: 'Chat with specific Gemini model' }
    ],
    flags: [
      { flag: '--model', description: 'Specify Gemini model variant' },
      { flag: '--temperature', description: 'Control response randomness' }
    ],
    tags: ['chat', 'google', 'gemini'],
    officialDocs: 'https://ai.google.dev/docs'
  },

  // Cursor AI
  {
    id: 'cursor-ai',
    command: 'cursor',
    description: 'Open Cursor AI code editor',
    tool: 'cursor',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'cursor [file/directory]',
    examples: [
      { command: 'cursor .', description: 'Open current directory in Cursor' },
      { command: 'cursor myfile.py', description: 'Open specific file in Cursor' }
    ],
    flags: [
      { flag: '[path]', description: 'File or directory to open' }
    ],
    tags: ['editor', 'ide', 'ai-assisted'],
    officialDocs: 'https://cursor.sh/'
  },

  // GitHub Copilot CLI
  {
    id: 'copilot-suggest',
    command: 'gh copilot suggest',
    description: 'Get command suggestions from GitHub Copilot',
    tool: 'copilot',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'gh copilot suggest [query]',
    examples: [
      { command: 'gh copilot suggest "find large files"', description: 'Get command suggestions for finding large files' },
      { command: 'gh copilot suggest "compress directory"', description: 'Get compression command suggestions' }
    ],
    flags: [
      { flag: '[query]', description: 'Natural language description of what you want to do' }
    ],
    tags: ['suggestions', 'github', 'copilot'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli'
  },
  {
    id: 'copilot-explain',
    command: 'gh copilot explain',
    description: 'Explain a command using GitHub Copilot',
    tool: 'copilot',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'gh copilot explain <command>',
    examples: [
      { command: 'gh copilot explain "tar -xzf archive.tar.gz"', description: 'Explain what a tar command does' },
      { command: 'gh copilot explain "docker run -it ubuntu bash"', description: 'Explain Docker command' }
    ],
    flags: [
      { flag: '<command>', description: 'Command to explain' }
    ],
    tags: ['explain', 'help', 'github'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli'
  },

  // Aider AI
  {
    id: 'aider-start',
    command: 'aider',
    description: 'Start Aider AI pair programming session',
    tool: 'aider',
    category: 'code',
    riskLevel: 'caution',
    syntax: 'aider [files...]',
    examples: [
      { command: 'aider', description: 'Start Aider in current directory' },
      { command: 'aider main.py utils.py', description: 'Start Aider with specific files' },
      { command: 'aider --model gpt-4', description: 'Use specific model with Aider' }
    ],
    flags: [
      { flag: '[files...]', description: 'Files to include in the session' },
      { flag: '--model', description: 'Specify AI model to use' },
      { flag: '--auto-commits', description: 'Enable automatic git commits' }
    ],
    notes: [
      'Aider can modify files directly',
      'Use git to track changes',
      'Review changes before committing'
    ],
    tags: ['pair-programming', 'ai', 'coding'],
    officialDocs: 'https://aider.chat/'
  }
];

const examples: ToolExample[] = [
  {
    title: 'Find Claude CLI Commands',
    input: 'claude',
    description: 'Search for all Claude Code CLI commands and their usage'
  },
  {
    title: 'Search Dangerous Commands',
    input: 'dangerous',
    description: 'Filter commands by risk level to see potentially harmful operations'
  },
  {
    title: 'Ollama Model Management',
    input: 'ollama pull',
    description: 'Find commands for downloading and managing local AI models'
  },
  {
    title: 'API Authentication Setup',
    input: 'auth api key',
    description: 'Search for commands to set up API keys for various AI services'
  }
];

export const AI_CLI_ASSISTANT_TOOL: Tool = {
  id: 'ai-cli-assistant',
  name: 'AI CLI Assistant',
  slug: 'ai-cli-assistant',
  description: 'Comprehensive reference for AI and developer tool command-line interfaces including Claude Code, Ollama, OpenAI CLI, and more',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  examples,
  relatedTools: ['cli-commands-reference', 'git-diff-visualizer', 'json-formatter'],
  tags: ['ai', 'cli', 'commands', 'reference', 'claude', 'ollama', 'openai', 'copilot'],
  searchTerms: [
    'ai cli',
    'claude commands',
    'ollama commands',
    'openai cli',
    'github copilot',
    'ai assistant',
    'command line ai',
    'developer tools',
    'cli reference',
    'ai tools'
  ],
  faqs: [
    {
      question: 'What is the --dangerously-skip-permissions flag in Claude?',
      answer: 'This flag bypasses all security permission prompts in Claude Code CLI. Use with extreme caution as it can lead to unintended file modifications or system changes. Only use in trusted environments.'
    },
    {
      question: 'How do I download models with Ollama?',
      answer: 'Use "ollama pull <model-name>" to download models. For example: "ollama pull llama2" or "ollama pull codellama:7b" for specific variants.'
    },
    {
      question: 'What\'s the difference between local and API-based AI tools?',
      answer: 'Local tools like Ollama run models on your machine (privacy, no internet needed), while API tools like OpenAI CLI use cloud services (more powerful models, requires internet and API keys).'
    },
    {
      question: 'How do I secure my API keys?',
      answer: 'Never commit API keys to version control, use environment variables, and consider using tools like .env files or secure credential managers. Rotate keys regularly.'
    }
  ]
};

export function processAICliCommands(query: string, filters: {
  tool?: string;
  category?: string;
  riskLevel?: string;
}): {
  results: AICliCommand[];
  totalCount: number;
} {
  let filteredCommands = AI_CLI_COMMANDS;

  // Apply filters
  if (filters.tool) {
    filteredCommands = filteredCommands.filter(cmd => cmd.tool === filters.tool);
  }
  if (filters.category) {
    filteredCommands = filteredCommands.filter(cmd => cmd.category === filters.category);
  }
  if (filters.riskLevel) {
    filteredCommands = filteredCommands.filter(cmd => cmd.riskLevel === filters.riskLevel);
  }

  // Apply search query
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filteredCommands = filteredCommands.filter(cmd =>
      cmd.command.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm) ||
      cmd.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      cmd.examples.some(ex => ex.command.toLowerCase().includes(searchTerm)) ||
      cmd.flags.some(flag => flag.flag.toLowerCase().includes(searchTerm))
    );
  }

  return {
    results: filteredCommands,
    totalCount: filteredCommands.length
  };
}