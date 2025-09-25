import type { Tool, ToolExample } from '../../types/tool';
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
  // Claude Code CLI (Anthropic)
  {
    id: 'claude-chat-session',
    command: 'claude chat',
    description: 'Open an interactive Claude Code chat session in the current project directory.',
    tool: 'claude',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'claude chat [--model MODEL_ID] [--project PROJECT_NAME] [--prompt "TEXT"]',
    examples: [
      { command: 'claude chat --model claude-3.5-sonnet', description: 'Start a session using the Claude 3.5 Sonnet model.' },
      { command: 'claude chat --project onboarding --prompt "Summarize CONTRIBUTING.md"', description: 'Send a one-off prompt against the onboarding project.' }
    ],
    flags: [
      { flag: '--model <id>', description: 'Override the default Claude model for this session.' },
      { flag: '--project <name>', description: 'Associate the conversation with a named Claude project.' },
      { flag: '--prompt "text"', description: 'Send a single prompt and exit without entering interactive mode.' }
    ],
    notes: [
      'The CLI reads authentication and defaults from claude config; override as needed per session.',
      'Use Ctrl+C twice to exit cleanly and persist conversation history.'
    ],
    relatedCommands: ['claude-config-get', 'claude-projects-list'],
    tags: ['anthropic', 'interactive', 'terminal'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/chat'
  },
  {
    id: 'claude-prompt-file',
    command: 'claude prompt',
    description: 'Run a non-interactive prompt by piping stdin or referencing a prompt file.',
    tool: 'claude',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'claude prompt [--file PROMPT_FILE] [--model MODEL_ID] [--system SYSTEM_PROMPT_FILE]',
    examples: [
      { command: 'claude prompt --file prompts/standup.md', description: 'Execute a saved daily stand-up prompt script.' },
      { command: 'cat TODO.md | claude prompt --model claude-3.5-haiku', description: 'Stream a TODO list to Claude for quick suggestions.' }
    ],
    flags: [
      { flag: '--file <path>', description: 'Load the primary prompt content from a local file.' },
      { flag: '--model <id>', description: 'Choose a different Claude model (for example claude-3.5-haiku).' },
      { flag: '--system <path>', description: 'Attach a system prompt file to steer the assistant.' }
    ],
    notes: [
      'Supports standard input, making it easy to compose prompts with other UNIX tools.',
      'Files are not uploaded automatically; ensure sensitive data is scrubbed before sending.'
    ],
    relatedCommands: ['claude-chat-session', 'claude-config-set-model'],
    tags: ['scripts', 'automation', 'anthropic'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/prompt-mode'
  },
  {
    id: 'claude-config-get',
    command: 'claude config get',
    description: 'Inspect the active Claude Code configuration values.',
    tool: 'claude',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'claude config get [key]',
    examples: [
      { command: 'claude config get', description: 'Print the full configuration as TOML.' },
      { command: 'claude config get default_model', description: 'Check which Claude model is used by default.' }
    ],
    flags: [
      { flag: '[key]', description: 'Optional key to narrow the output (for example default_model).' }
    ],
    notes: [
      'Configuration is stored in $CLAUDE_HOME (defaults to ~/.claude).',
      'Use this command to confirm updates after running claude config set.'
    ],
    relatedCommands: ['claude-config-set-model', 'claude-config-set-editor'],
    tags: ['settings', 'anthropic', 'diagnostics'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/configuration'
  },
  {
    id: 'claude-config-set-model',
    command: 'claude config set default_model claude-3.5-sonnet',
    description: 'Persist a new default Claude model for subsequent sessions.',
    tool: 'claude',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'claude config set <key> <value>',
    examples: [
      { command: 'claude config set default_model claude-3.5-sonnet', description: 'Use Claude 3.5 Sonnet for all future chats.' },
      { command: 'claude config set editor vim', description: 'Change the editor opened for quick file inspections.' }
    ],
    flags: [
      { flag: '<key>', description: 'Configuration key to update (for example default_model).' },
      { flag: '<value>', description: 'New value for the setting.' }
    ],
    notes: [
      'Restart existing sessions to pick up new defaults.',
      'Combine with claude config get to confirm applied values.'
    ],
    relatedCommands: ['claude-config-get', 'claude-chat-session'],
    tags: ['anthropic', 'defaults', 'setup'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/configuration'
  },
  {
    id: 'claude-projects-list',
    command: 'claude projects list',
    description: 'List Claude project workspaces the CLI is aware of.',
    tool: 'claude',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'claude projects list',
    examples: [
      { command: 'claude projects list', description: 'Print all projects with their associated paths and metadata.' }
    ],
    flags: [],
    notes: [
      'Projects retain chat history and context such as repo ignore rules.',
      'Use in combination with claude projects use to switch context quickly.'
    ],
    relatedCommands: ['claude-projects-create', 'claude-chat-session'],
    tags: ['projects', 'workspace', 'anthropic'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/projects'
  },
  {
    id: 'claude-projects-create',
    command: 'claude projects create',
    description: 'Create a new Claude project pointing at a local repository.',
    tool: 'claude',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'claude projects create <name> --path PATH [--default-model MODEL_ID]',
    examples: [
      { command: 'claude projects create web-app --path ~/Projects/web-app', description: 'Register a local repo as a Claude project.' },
      { command: 'claude projects create docs --path ./docs --default-model claude-3.5-haiku', description: 'Use a lightweight model for documentation work.' }
    ],
    flags: [
      { flag: '--path <dir>', description: 'Absolute or relative path to the project root.' },
      { flag: '--default-model <id>', description: 'Override the model for this project only.' }
    ],
    notes: [
      'Projects store per-repository settings, ignore rules, and chat history.',
      'Ensure the path exists and you have write permissions before creating a project.'
    ],
    relatedCommands: ['claude-projects-list', 'claude-chat-session'],
    tags: ['workspace', 'repo', 'anthropic'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/projects'
  },
  {
    id: 'claude-upgrade',
    command: 'claude upgrade',
    description: 'Update the Claude CLI to the latest available release.',
    tool: 'claude',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'claude upgrade [--pre-release]',
    examples: [
      { command: 'claude upgrade', description: 'Download and install the most recent stable build.' }
    ],
    flags: [
      { flag: '--pre-release', description: 'Opt into the latest pre-release build for early features.' }
    ],
    notes: [
      'If installed via Homebrew or pipx, prefer the package manager upgrade path.',
      'Re-run claude --version to verify the new version after upgrading.'
    ],
    relatedCommands: ['claude-chat-session'],
    tags: ['anthropic', 'maintenance'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/installation'
  },
  {
    id: 'claude-dangerously-skip',
    command: 'claude --dangerously-skip-permissions',
    description: 'Bypass Claude’s safety prompts and file modification confirmations.',
    tool: 'claude',
    category: 'config',
    riskLevel: 'dangerous',
    syntax: 'claude --dangerously-skip-permissions [subcommand]',
    examples: [
      { command: 'claude --dangerously-skip-permissions chat --project maintenance', description: 'Start a chat session without any permission gating.' }
    ],
    flags: [
      { flag: '--dangerously-skip-permissions', description: 'Disable confirmation prompts for file edits and tool execution.' }
    ],
    notes: [
      'Only use inside disposable environments or CI workflows where prompts block automation.',
      'Consider read-only access instead if you only need to inspect code.'
    ],
    relatedCommands: ['claude-config-get'],
    tags: ['anthropic', 'ci', 'unsafe'],
    officialDocs: 'https://docs.claude.com/en/docs/claude-code/security'
  },

  // Ollama CLI
  {
    id: 'ollama-run',
    command: 'ollama run',
    description: 'Start an interactive session with a local Ollama model.',
    tool: 'ollama',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'ollama run <model> [prompt]',
    examples: [
      { command: 'ollama run llama3 "Draft release notes for v1.2"', description: 'One-shot prompt against the llama3 model.' },
      { command: 'ollama run codellama', description: 'Open interactive mode for CodeLlama.' }
    ],
    flags: [
      { flag: '<model>', description: 'Model tag to run (for example llama3 | mistral | codellama).' },
      { flag: '[prompt]', description: 'Optional initial prompt to send immediately.' }
    ],
    notes: [
      'Running a model for the first time will trigger an implicit pull.',
      'Use Ctrl+C twice to exit interactive mode.'
    ],
    relatedCommands: ['ollama-pull', 'ollama-ps'],
    tags: ['local-models', 'chat', 'llm'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#run'
  },
  {
    id: 'ollama-pull',
    command: 'ollama pull',
    description: 'Download a model and cache it locally for offline use.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama pull <model[:tag]>',
    examples: [
      { command: 'ollama pull llama3', description: 'Download the latest llama3 model.' },
      { command: 'ollama pull codellama:34b', description: 'Pull a specific tagged variant for coding tasks.' }
    ],
    flags: [
      { flag: '<model[:tag]>', description: 'Model slug with optional size or variant tag.' }
    ],
    notes: [
      'Pulled models are stored under ~/.ollama/models by default.',
      'Combine with ollama list to confirm availability.'
    ],
    relatedCommands: ['ollama-list', 'ollama-run'],
    tags: ['download', 'models', 'management'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#pull'
  },
  {
    id: 'ollama-list',
    command: 'ollama list',
    description: 'List models currently installed on the local Ollama instance.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama list',
    examples: [
      { command: 'ollama list', description: 'Show installed models, sizes, and modified times.' }
    ],
    flags: [],
    notes: [
      'Use this command before pruning to double-check what is cached.',
      'Outputs both model size on disk and digest hash.'
    ],
    relatedCommands: ['ollama-pull', 'ollama-rm'],
    tags: ['inventory', 'models'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#list'
  },
  {
    id: 'ollama-show',
    command: 'ollama show',
    description: 'Inspect model metadata, parameters, and Modelfile instructions.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama show <model> [--format json]',
    examples: [
      { command: 'ollama show llama3', description: 'View the default system prompt and template for llama3.' },
      { command: 'ollama show codellama --format json', description: 'Export metadata in JSON for scripting.' }
    ],
    flags: [
      { flag: '--format json', description: 'Return output as JSON for automated tooling.' }
    ],
    notes: [
      'Helpful when building custom Modelfiles or checking default prompts.',
      'Requires the model to be present locally.'
    ],
    relatedCommands: ['ollama-create', 'ollama-run'],
    tags: ['introspection', 'models', 'metadata'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#show'
  },
  {
    id: 'ollama-create',
    command: 'ollama create',
    description: 'Build a custom Ollama model from a Modelfile definition.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'caution',
    syntax: 'ollama create <model> -f Modelfile',
    examples: [
      { command: 'ollama create sql-helper -f Modelfile', description: 'Create a tuned model with SQL-friendly defaults.' }
    ],
    flags: [
      { flag: '-f <file>', description: 'Path to the Modelfile containing build instructions.' }
    ],
    notes: [
      'Model builds may consume significant disk space and GPU resources.',
      'Use semantic version tags (for example sql-helper:1.0) to manage updates.'
    ],
    relatedCommands: ['ollama-show', 'ollama-run'],
    tags: ['custom-models', 'build'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/modelfile.md'
  },
  {
    id: 'ollama-serve',
    command: 'ollama serve',
    description: 'Run the Ollama HTTP server for API access and remote clients.',
    tool: 'ollama',
    category: 'server',
    riskLevel: 'safe',
    syntax: 'ollama serve [--host HOST] [--port PORT]',
    examples: [
      { command: 'ollama serve', description: 'Start the server on the default localhost:11434 endpoint.' },
      { command: 'OLLAMA_HOST=0.0.0.0 ollama serve', description: 'Expose the API to your local network.' }
    ],
    flags: [
      { flag: '--host <address>', description: 'Bind the API server to a specific interface.' },
      { flag: '--port <number>', description: 'Change the default listening port (11434).' }
    ],
    notes: [
      'Requests are authenticated by network boundary; secure the host if exposed publicly.',
      'Clients such as the Ollama Python SDK expect the server to be running.'
    ],
    relatedCommands: ['ollama-run', 'ollama-stop'],
    tags: ['api', 'serving', 'http'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/openapi.md'
  },
  {
    id: 'ollama-ps',
    command: 'ollama ps',
    description: 'List running Ollama model processes.',
    tool: 'ollama',
    category: 'server',
    riskLevel: 'safe',
    syntax: 'ollama ps',
    examples: [
      { command: 'ollama ps', description: 'Display active sessions and their durations.' }
    ],
    flags: [],
    notes: [
      'Use to confirm whether long-running chats or embeddings jobs are still active.',
      'Combine with ollama stop to free GPU memory when a session hangs.'
    ],
    relatedCommands: ['ollama-stop', 'ollama-serve'],
    tags: ['monitoring', 'processes'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#ps'
  },
  {
    id: 'ollama-stop',
    command: 'ollama stop',
    description: 'Terminate a running Ollama session or model by name.',
    tool: 'ollama',
    category: 'server',
    riskLevel: 'caution',
    syntax: 'ollama stop <model>',
    examples: [
      { command: 'ollama stop codellama', description: 'Stop the Codellama session to release GPU memory.' }
    ],
    flags: [
      { flag: '<model>', description: 'Active model name returned by ollama ps.' }
    ],
    notes: [
      'Active requests are terminated immediately, so warn collaborators before stopping shared sessions.'
    ],
    relatedCommands: ['ollama-ps', 'ollama-serve'],
    tags: ['process-control', 'cleanup'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#stop'
  },
  {
    id: 'ollama-rm',
    command: 'ollama rm',
    description: 'Remove a cached model from local storage.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'caution',
    syntax: 'ollama rm <model>',
    examples: [
      { command: 'ollama rm mistral', description: 'Delete the mistral model to free disk space.' }
    ],
    flags: [
      { flag: '<model>', description: 'Model slug to remove from ~/.ollama/models.' }
    ],
    notes: [
      'Re-running ollama run will re-download the model if needed again.',
      'Combine with ollama prune to clean up dangling blobs.'
    ],
    relatedCommands: ['ollama-list', 'ollama-prune'],
    tags: ['cleanup', 'storage'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#rm'
  },
  {
    id: 'ollama-prune',
    command: 'ollama prune',
    description: 'Delete unused layers and blobs that are no longer referenced by models.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'caution',
    syntax: 'ollama prune',
    examples: [
      { command: 'ollama prune', description: 'Free disk space after removing old model versions.' }
    ],
    flags: [],
    notes: [
      'Pruning is irreversible; ensure no required models rely on the layers being deleted.',
      'Run ollama list beforehand to confirm desired models remain installed.'
    ],
    relatedCommands: ['ollama-rm', 'ollama-list'],
    tags: ['maintenance', 'storage'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#prune'
  },
  {
    id: 'ollama-embed',
    command: 'ollama embed',
    description: 'Generate embeddings from local models for semantic search or RAG pipelines.',
    tool: 'ollama',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'ollama embed --model MODEL_ID --input "TEXT" [--output OUTPUT.json]',
    examples: [
      { command: 'ollama embed --model nomic-embed-text --input "Find me the docs"', description: 'Return a JSON array of vector values for quick experiments.' },
      { command: 'ollama embed --model nomic-embed-text --input-file docs.txt --output embeddings.json', description: 'Batch embed a corpus from a file.' }
    ],
    flags: [
      { flag: '--model <id>', description: 'Embedding model to use (for example nomic-embed-text).' },
      { flag: '--input "text"', description: 'Inline text content to embed.' },
      { flag: '--input-file <path>', description: 'Read input lines from a file.' },
      { flag: '--output <file>', description: 'Write embeddings to a JSON file.' }
    ],
    notes: [
      'Ensure the selected model supports embedding generation; not all chat models do.',
      'Input files are processed line-by-line to avoid exhausting memory.'
    ],
    relatedCommands: ['ollama-run'],
    tags: ['embeddings', 'rag', 'vector'],
    officialDocs: 'https://github.com/ollama/ollama/blob/main/docs/cli.md#embed'
  },

  // OpenAI CLI
  {
    id: 'openai-chat-completions',
    command: 'openai api chat.completions.create',
    description: 'Create a chat completion with an OpenAI hosted model.',
    tool: 'openai',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'openai api chat.completions.create -m MODEL -g ROLE "MESSAGE" [--temperature VALUE]',
    examples: [
      { command: 'openai api chat.completions.create -m gpt-4o-mini -g user "Summarize the PR diff"', description: 'Generate a terse summary for a code review.' },
      { command: 'openai api chat.completions.create -m gpt-4o-mini -g system "You are a release assistant" -g user "Draft release notes"', description: 'Prime the assistant with a system prompt before asking for help.' }
    ],
    flags: [
      { flag: '-m <model>', description: 'Model identifier (for example gpt-4o-mini, gpt-4.1).' },
      { flag: '-g <role> "text"', description: 'Add a message with role user | system | assistant.' },
      { flag: '--temperature <value>', description: 'Control randomness (defaults to model preset).' }
    ],
    notes: [
      'The CLI reads OPENAI_API_KEY from the environment; set it before running commands.',
      'Use --response-format json to enforce JSON output for integrations.'
    ],
    relatedCommands: ['openai-responses-create', 'openai-embeddings'],
    tags: ['openai', 'chat', 'api'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/chat/create'
  },
  {
    id: 'openai-responses-create',
    command: 'openai api responses.create',
    description: 'Invoke the Responses API for unified multimodal generation.',
    tool: 'openai',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'openai api responses.create -m MODEL -p "PROMPT" [--input-file FILE]',
    examples: [
      { command: 'openai api responses.create -m gpt-4o -p "Draft onboarding email copy"', description: 'Request a one-shot text response using the new API.' },
      { command: 'openai api responses.create -m gpt-4o -p "Summarize the following" --input-file notes.md', description: 'Provide a supplemental input file that is uploaded automatically.' }
    ],
    flags: [
      { flag: '-m <model>', description: 'Model identifier compatible with the Responses endpoint.' },
      { flag: '-p "prompt"', description: 'Primary prompt content to send with the request.' },
      { flag: '--input-file <path>', description: 'Upload a local file and reference it inside the prompt.' }
    ],
    notes: [
      'Responses API consolidates chat, instructions, and tool outputs under a single interface.',
      'Large input files count toward your token budget; trim them before uploading.'
    ],
    relatedCommands: ['openai-chat-completions', 'openai-files-upload'],
    tags: ['responses', 'multimodal', 'openai'],
    officialDocs: 'https://platform.openai.com/docs/guides/responses'
  },
  {
    id: 'openai-embeddings',
    command: 'openai api embeddings.create',
    description: 'Generate vector embeddings for semantic search or retrieval.',
    tool: 'openai',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'openai api embeddings.create -m MODEL -i "TEXT" [--input-file FILE]',
    examples: [
      { command: 'openai api embeddings.create -m text-embedding-3-large -i "Customer asked for refund"', description: 'Embed inline text for a helpdesk use case.' },
      { command: 'openai api embeddings.create -m text-embedding-3-small --input-file faqs.txt', description: 'Embed a collection of FAQ entries from a file.' }
    ],
    flags: [
      { flag: '-m <model>', description: 'Embedding model (text-embedding-3-large, text-embedding-3-small, etc.).' },
      { flag: '-i "text"', description: 'Inline string to embed; repeats allowed for batching.' },
      { flag: '--input-file <path>', description: 'Read newline-delimited strings from a file.' }
    ],
    notes: [
      'Embeddings are returned as JSON arrays; pipe through jq to format the output.',
      'Use batching to minimize request overhead when embedding many rows.'
    ],
    relatedCommands: ['openai-files-upload'],
    tags: ['embeddings', 'vector', 'openai'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/embeddings/create'
  },
  {
    id: 'openai-images-generate',
    command: 'openai api images.generate',
    description: 'Create images using DALL·E and save them locally.',
    tool: 'openai',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'openai api images.generate -m gpt-image-1 -p "PROMPT" [-n COUNT] [-o OUTPUT.png]',
    examples: [
      { command: 'openai api images.generate -m gpt-image-1 -p "Minimalist CLI mascot" -o mascot.png', description: 'Render a single image and write it to disk.' },
      { command: 'openai api images.generate -m gpt-image-1 -p "Dark terminal background" -n 4', description: 'Generate multiple variations for comparison.' }
    ],
    flags: [
      { flag: '-p "prompt"', description: 'Text description of the image to generate.' },
      { flag: '-n <count>', description: 'Number of output images (defaults to 1).' },
      { flag: '-o <file>', description: 'Write the first image to a specific file path.' }
    ],
    notes: [
      'When multiple images are generated, remaining outputs are printed as base64 strings.',
      'Use --size to request non-default resolutions if needed.'
    ],
    relatedCommands: ['openai-files-upload'],
    tags: ['images', 'generation'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/images/create'
  },
  {
    id: 'openai-audio-speech',
    command: 'openai api audio.speech.create',
    description: 'Synthesize speech using OpenAI text-to-speech models.',
    tool: 'openai',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'openai api audio.speech.create -m MODEL -v VOICE -f FORMAT -o OUTPUT -t "TEXT"',
    examples: [
      { command: 'openai api audio.speech.create -m gpt-4o-mini-tts -v alloy -f mp3 -o greeting.mp3 -t "Welcome to the deployment walkthrough."', description: 'Generate an MP3 voice-over for onboarding.' }
    ],
    flags: [
      { flag: '-v <voice>', description: 'Voice preset (for example alloy, verse).' },
      { flag: '-f <format>', description: 'Audio format such as mp3, wav, or flac.' },
      { flag: '-o <file>', description: 'Output file path; defaults to stdout if omitted.' },
      { flag: '-t "text"', description: 'Text to speak. Use --input-file for long scripts.' }
    ],
    notes: [
      'Large scripts can be streamed via stdin to avoid shell quoting issues.',
      'Audio synthesis consumes tokens similar to chat requests—budget accordingly.'
    ],
    relatedCommands: ['openai-chat-completions'],
    tags: ['tts', 'multimodal'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/audio/createSpeech'
  },
  {
    id: 'openai-files-upload',
    command: 'openai api files.upload',
    description: 'Upload files for fine-tuning, batches, or response augmentation.',
    tool: 'openai',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'openai api files.upload -f FILE_PATH -p PURPOSE',
    examples: [
      { command: 'openai api files.upload -f training.jsonl -p fine-tune', description: 'Upload a JSONL dataset for fine-tuning tasks.' },
      { command: 'openai api files.upload -f faq.md -p assistants', description: 'Store a reference document for the Assistants API.' }
    ],
    flags: [
      { flag: '-f <file>', description: 'Path to the file you wish to upload.' },
      { flag: '-p <purpose>', description: 'Purpose tag (fine-tune, batch, assistants, etc.).' }
    ],
    notes: [
      'Uploads are stored in encrypted form and can be listed via openai api files.list.',
      'Keep JSONL files under line-count limits (per docs) to avoid rejection.'
    ],
    relatedCommands: ['openai-fine-tuning-create', 'openai-batch-create'],
    tags: ['files', 'assets'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/files/create'
  },
  {
    id: 'openai-fine-tuning-create',
    command: 'openai api fine_tuning.jobs.create',
    description: 'Kick off a fine-tuning job for supported GPT models.',
    tool: 'openai',
    category: 'models',
    riskLevel: 'caution',
    syntax: 'openai api fine_tuning.jobs.create -t TRAIN_FILE_ID -m MODEL_ID [--validation-file FILE_ID]',
    examples: [
      { command: 'openai api fine_tuning.jobs.create -t file-abc123 -m gpt-4o-mini', description: 'Start tuning gpt-4o-mini with an uploaded dataset.' }
    ],
    flags: [
      { flag: '-t <file-id>', description: 'Training file identifier returned by files.upload.' },
      { flag: '-m <model>', description: 'Base model eligible for fine-tuning.' },
      { flag: '--validation-file <file-id>', description: 'Optional validation dataset for monitoring overfitting.' }
    ],
    notes: [
      'Fine-tuning incurs extra cost and may take several minutes to complete.',
      'Track progress with openai api fine_tuning.jobs.retrieve JOB_ID.'
    ],
    relatedCommands: ['openai-files-upload'],
    tags: ['fine-tune', 'training'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/fine-tuning'
  },
  {
    id: 'openai-batch-create',
    command: 'openai api batches.create',
    description: 'Submit batch jobs for cost-effective offline processing.',
    tool: 'openai',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'openai api batches.create -f BATCH_FILE_ID -m MODEL_ID',
    examples: [
      { command: 'openai api batches.create -f file-batch123 -m gpt-4o-mini', description: 'Queue a batch job for asynchronous processing.' }
    ],
    flags: [
      { flag: '-f <file-id>', description: 'Uploaded JSONL file containing batch requests.' },
      { flag: '-m <model>', description: 'Model to execute the batch against.' }
    ],
    notes: [
      'Batch jobs run asynchronously; poll with openai api batches.retrieve JOB_ID.',
      'Ideal for large embedding or classification workloads outside real-time flows.'
    ],
    relatedCommands: ['openai-files-upload'],
    tags: ['batch', 'cost-optimization'],
    officialDocs: 'https://platform.openai.com/docs/api-reference/batch'
  },

  // Google Gemini / Vertex AI CLI via gcloud
  {
    id: 'gcloud-auth-application-default',
    command: 'gcloud auth application-default login',
    description: 'Authenticate the Google Cloud CLI for Vertex AI / Gemini access.',
    tool: 'gemini',
    category: 'auth',
    riskLevel: 'safe',
    syntax: 'gcloud auth application-default login',
    examples: [
      { command: 'gcloud auth application-default login', description: 'Launch the browser flow to generate ADC credentials.' }
    ],
    flags: [],
    notes: [
      'Application Default Credentials are required for most Vertex AI SDKs.',
      'Run gcloud config set project PROJECT_ID after authenticating to target the correct project.'
    ],
    relatedCommands: ['gcloud-config-set-project'],
    tags: ['vertex-ai', 'authentication'],
    officialDocs: 'https://cloud.google.com/docs/authentication/provide-credentials-adc'
  },
  {
    id: 'gcloud-config-set-project',
    command: 'gcloud config set project PROJECT_ID',
    description: 'Set the active Google Cloud project for subsequent CLI commands.',
    tool: 'gemini',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'gcloud config set project <PROJECT_ID>',
    examples: [
      { command: 'gcloud config set project ai-lab-123', description: 'Target the ai-lab-123 project for future commands.' }
    ],
    flags: [
      { flag: '<PROJECT_ID>', description: 'The Google Cloud project identifier.' }
    ],
    notes: [
      'Project configuration is stored under ~/.config/gcloud; repeat if you work across multiple orgs.'
    ],
    relatedCommands: ['gcloud-auth-application-default'],
    tags: ['setup', 'vertex-ai'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/config/set'
  },
  {
    id: 'gcloud-ai-models-list',
    command: 'gcloud ai models list',
    description: 'List available Vertex AI models, including Gemini endpoints.',
    tool: 'gemini',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'gcloud ai models list --region REGION',
    examples: [
      { command: 'gcloud ai models list --region=us-central1', description: 'Enumerate models in the us-central1 region.' }
    ],
    flags: [
      { flag: '--region <region>', description: 'Regional endpoint to query (for example us-central1).' }
    ],
    notes: [
      'Gemini models are region-specific; choose the same region you plan to deploy in.',
      'Use --filter "displayName~gemini" to narrow the output to generative models.'
    ],
    relatedCommands: ['gcloud-ai-models-describe', 'gcloud-ai-endpoints-create'],
    tags: ['vertex-ai', 'inventory', 'models'],
    officialDocs: 'https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.models/list'
  },
  {
    id: 'gcloud-ai-models-describe',
    command: 'gcloud ai models describe',
    description: 'Inspect metadata for a specific Vertex AI or Gemini model.',
    tool: 'gemini',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'gcloud ai models describe MODEL_ID --region REGION',
    examples: [
      { command: 'gcloud ai models describe 1234567890123456789 --region=us-central1', description: 'Retrieve deployment resources and supported formats.' }
    ],
    flags: [
      { flag: '--region <region>', description: 'Region where the model is hosted.' }
    ],
    notes: [
      'Combine with --format json to integrate model metadata into automation scripts.'
    ],
    relatedCommands: ['gcloud-ai-models-list'],
    tags: ['vertex-ai', 'metadata'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/ai/models/describe'
  },
  {
    id: 'gcloud-ai-endpoints-create',
    command: 'gcloud ai endpoints create',
    description: 'Create a Vertex AI endpoint to serve Gemini or other models.',
    tool: 'gemini',
    category: 'server',
    riskLevel: 'safe',
    syntax: 'gcloud ai endpoints create --region REGION --display-name NAME',
    examples: [
      { command: 'gcloud ai endpoints create --region=us-central1 --display-name=gemini-text-prod', description: 'Create a managed online endpoint ready for deployment.' }
    ],
    flags: [
      { flag: '--region <region>', description: 'Region for the endpoint (Gemini currently supports us-central1).' },
      { flag: '--display-name <name>', description: 'Friendly name for the endpoint.' }
    ],
    notes: [
      'Endpoints are billed while deployed models are active; delete unused endpoints to save cost.'
    ],
    relatedCommands: ['gcloud-ai-endpoints-deploy', 'gcloud-ai-endpoints-predict'],
    tags: ['deployment', 'vertex-ai'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/ai/endpoints/create'
  },
  {
    id: 'gcloud-ai-endpoints-deploy',
    command: 'gcloud ai endpoints deploy-model',
    description: 'Deploy a Vertex AI model (such as Gemini-pro-vision) to an endpoint.',
    tool: 'gemini',
    category: 'server',
    riskLevel: 'caution',
    syntax: 'gcloud ai endpoints deploy-model ENDPOINT_ID --model MODEL_ID --region REGION --traffic-split=0=100 [--machine-type TYPE]',
    examples: [
      { command: 'gcloud ai endpoints deploy-model 123 --model 456 --region=us-central1 --traffic-split=0=100 --machine-type=n1-standard-4', description: 'Deploy the model and route 100% of traffic to the new revision.' }
    ],
    flags: [
      { flag: '--traffic-split=REVISION=WEIGHT', description: 'Control live traffic percentages across deployed revisions.' },
      { flag: '--machine-type <type>', description: 'Select the serving machine type (cost scales accordingly).' }
    ],
    notes: [
      'Deployments incur cost immediately; monitor usage and scale down when idle.',
      'Use gcloud ai endpoints describe to verify deployment state.'
    ],
    relatedCommands: ['gcloud-ai-endpoints-create', 'gcloud-ai-endpoints-predict'],
    tags: ['deployment', 'vertex-ai', 'operations'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/ai/endpoints/deploy-model'
  },
  {
    id: 'gcloud-ai-endpoints-predict',
    command: 'gcloud ai endpoints predict',
    description: 'Send prediction requests to a deployed Vertex AI / Gemini endpoint.',
    tool: 'gemini',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'gcloud ai endpoints predict ENDPOINT_ID --region REGION --json-request=FILE',
    examples: [
      { command: 'gcloud ai endpoints predict 123 --region=us-central1 --json-request=prompt.json', description: 'Send a JSON payload containing the prompt and parameters.' }
    ],
    flags: [
      { flag: '--json-request <file>', description: 'Path to a JSON request body conforming to the endpoint schema.' },
      { flag: '--region <region>', description: 'Region hosting the endpoint.' }
    ],
    notes: [
      'The request format varies by model type—use the sample payloads from the model documentation.',
      'Combine with --format json to capture responses programmatically.'
    ],
    relatedCommands: ['gcloud-ai-endpoints-deploy'],
    tags: ['prediction', 'vertex-ai'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/ai/endpoints/predict'
  },
  {
    id: 'gcloud-ai-operations-list',
    command: 'gcloud ai operations list',
    description: 'Check the status of asynchronous Vertex AI operations such as tuning or deployment.',
    tool: 'gemini',
    category: 'models',
    riskLevel: 'safe',
    syntax: 'gcloud ai operations list --region REGION [--filter "state=RUNNING"]',
    examples: [
      { command: 'gcloud ai operations list --region=us-central1 --filter="state=RUNNING"', description: 'Monitor long-running operations in the chosen region.' }
    ],
    flags: [
      { flag: '--filter <expr>', description: 'Filter operations by state, target, or creation time.' }
    ],
    notes: [
      'Pair with gcloud ai operations describe OPERATION_ID for detailed progress.',
      'Operations include fine-tuning, deployments, and dataset imports.'
    ],
    relatedCommands: ['gcloud-ai-endpoints-deploy'],
    tags: ['monitoring', 'vertex-ai'],
    officialDocs: 'https://cloud.google.com/sdk/gcloud/reference/ai/operations/list'
  },

  // Cursor CLI (VS Code-compatible)
  {
    id: 'cursor-open-workspace',
    command: 'cursor <path>',
    description: 'Open a folder or file in Cursor from the command line.',
    tool: 'cursor',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'cursor [--new-window] [path]',
    examples: [
      { command: 'cursor .', description: 'Open the current directory in Cursor.' },
      { command: 'cursor ~/Projects/ai-cli --new-window', description: 'Launch a separate window for a different repository.' }
    ],
    flags: [
      { flag: '--new-window', description: 'Force opening in a new window instead of reusing the last workspace.' }
    ],
    notes: [
      'Install the cursor CLI from the app (Settings → Command Line) before using this command.',
      'Paths may be files or directories; multiple paths open multiple editors.'
    ],
    relatedCommands: ['cursor-install-extension'],
    tags: ['ide', 'workspace'],
    officialDocs: 'https://cursor.sh/docs/cli'
  },
  {
    id: 'cursor-install-extension',
    command: 'cursor --install-extension',
    description: 'Install a VS Code-compatible extension into Cursor.',
    tool: 'cursor',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'cursor --install-extension PUBLISHER.EXTENSION',
    examples: [
      { command: 'cursor --install-extension ms-python.python', description: 'Add the Microsoft Python extension to Cursor.' }
    ],
    flags: [
      { flag: '--install-extension <publisher.extension>', description: 'Qualified extension identifier to install.' }
    ],
    notes: [
      'Use cursor --list-extensions to confirm the installation or find extension IDs.',
      'Extensions install into Cursor’s isolated profile and do not affect VS Code.'
    ],
    relatedCommands: ['cursor-list-extensions'],
    tags: ['extensions', 'setup'],
    officialDocs: 'https://cursor.sh/docs/cli#extensions'
  },
  {
    id: 'cursor-list-extensions',
    command: 'cursor --list-extensions',
    description: 'List extensions currently installed in Cursor.',
    tool: 'cursor',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'cursor --list-extensions',
    examples: [
      { command: 'cursor --list-extensions', description: 'Display installed extensions with versions.' }
    ],
    flags: [],
    notes: [
      'Add --show-versions to print version numbers alongside identifiers.'
    ],
    relatedCommands: ['cursor-install-extension'],
    tags: ['extensions', 'inventory'],
    officialDocs: 'https://cursor.sh/docs/cli#extensions'
  },
  {
    id: 'cursor-diff',
    command: 'cursor --diff',
    description: 'Launch the Cursor diff view for two files or directories.',
    tool: 'cursor',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'cursor --diff FILE1 FILE2',
    examples: [
      { command: 'cursor --diff src/app.ts src/app.generated.ts', description: 'Visually compare generated code to the current implementation.' }
    ],
    flags: [
      { flag: '--diff <file1> <file2>', description: 'Open a side-by-side comparison between two paths.' }
    ],
    notes: [
      'Supports directory diffs when both arguments are folders.',
      'Useful in review workflows when combined with AI suggestions.'
    ],
    relatedCommands: ['cursor-open-workspace'],
    tags: ['diff', 'reviews'],
    officialDocs: 'https://cursor.sh/docs/cli'
  },
  {
    id: 'cursor-proxy',
    command: 'cursor --proxy-server',
    description: 'Route Cursor network traffic through a proxy (useful behind corporate firewalls).',
    tool: 'cursor',
    category: 'config',
    riskLevel: 'caution',
    syntax: 'cursor --proxy-server=PROXY_URL [path]',
    examples: [
      { command: 'cursor --proxy-server="http://localhost:7890" .', description: 'Open the current workspace while routing traffic through a local proxy.' }
    ],
    flags: [
      { flag: '--proxy-server=<url>', description: 'Proxy URL in the format scheme://host:port.' }
    ],
    notes: [
      'Ensure the proxy allows WebSocket connections required by Cursor’s cloud features.',
      'Remove the option when no longer needed to avoid latency.'
    ],
    relatedCommands: ['cursor-open-workspace'],
    tags: ['network', 'corporate'],
    officialDocs: 'https://cursor.sh/docs/cli'
  },

  // GitHub Copilot CLI (gh extension)
  {
    id: 'gh-copilot-install',
    command: 'gh extension install github/gh-copilot --pre-release',
    description: 'Install the GitHub Copilot CLI extension for the gh tool.',
    tool: 'copilot',
    category: 'config',
    riskLevel: 'safe',
    syntax: 'gh extension install github/gh-copilot [--pre-release]',
    examples: [
      { command: 'gh extension install github/gh-copilot --pre-release', description: 'Install the Copilot CLI extension with the latest preview build.' }
    ],
    flags: [
      { flag: '--pre-release', description: 'Opt into the newest preview release of the extension.' }
    ],
    notes: [
      'Requires gh CLI version 2.46 or later.',
      'Authenticate gh with gh auth login before installing extensions.'
    ],
    relatedCommands: ['gh-copilot-explain'],
    tags: ['installation', 'setup'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli/installing-github-copilot-in-the-cli'
  },
  {
    id: 'gh-copilot-explain',
    command: 'gh copilot explain',
    description: 'Ask Copilot to explain a command, diff, or snippet.',
    tool: 'copilot',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'gh copilot explain [--command "CMD"] [--file PATH]',
    examples: [
      { command: 'gh copilot explain --command "git rebase --onto main feature"', description: 'Get a plain-language explanation of a complex Git command.' },
      { command: 'gh copilot explain --file changes.patch', description: 'Ask Copilot to describe a diff or patch file.' }
    ],
    flags: [
      { flag: '--command "text"', description: 'Provide a shell command to explain.' },
      { flag: '--file <path>', description: 'Read content from a file or diff to explain.' }
    ],
    notes: [
      'The CLI streams the explanation back to the terminal; press Ctrl+C to cancel.',
      'Requires GitHub Copilot subscription tied to your GitHub account.'
    ],
    relatedCommands: ['gh-copilot-suggest'],
    tags: ['documentation', 'learning'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli#gh-copilot-explain'
  },
  {
    id: 'gh-copilot-suggest',
    command: 'gh copilot suggest',
    description: 'Generate content such as TODOs, release notes, or commit messages.',
    tool: 'copilot',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'gh copilot suggest -m "MESSAGE" [-F FILE] [--context PATH]',
    examples: [
      { command: 'gh copilot suggest -m "Write a changelog entry" -F diff.patch', description: 'Draft release notes using the supplied diff as context.' },
      { command: 'gh copilot suggest -m "Summarize README" --context README.md', description: 'Provide structured output derived from a project file.' }
    ],
    flags: [
      { flag: '-m "message"', description: 'Instruction for Copilot to act on.' },
      { flag: '-F <file>', description: 'Include a diff or file as additional context.' },
      { flag: '--context <path>', description: 'Folder or file path to provide broader context.' }
    ],
    notes: [
      'Command output is a suggestion—review before committing.',
      'Combine with gh copilot tests or review for richer workflows.'
    ],
    relatedCommands: ['gh-copilot-tests', 'gh-copilot-review'],
    tags: ['automation', 'productivity'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli#gh-copilot-suggest'
  },
  {
    id: 'gh-copilot-tests',
    command: 'gh copilot tests',
    description: 'Ask Copilot to propose or translate tests for your project.',
    tool: 'copilot',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'gh copilot tests [--command "TEST_COMMAND"] [--context PATH]',
    examples: [
      { command: 'gh copilot tests --command "pytest -k auth" --context tests/auth_test.py', description: 'Request assistance interpreting failed pytest output.' }
    ],
    flags: [
      { flag: '--command "text"', description: 'Test command to explain or expand.' },
      { flag: '--context <path>', description: 'Optional path for additional context (source or test files).' }
    ],
    notes: [
      'Use to translate failing test logs or brainstorm new cases.',
      'Copilot suggestions should still be reviewed by maintainers.'
    ],
    relatedCommands: ['gh-copilot-suggest'],
    tags: ['testing', 'quality'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli#gh-copilot-tests'
  },
  {
    id: 'gh-copilot-review',
    command: 'gh copilot review',
    description: 'Summarize or review a pull request directly from the terminal.',
    tool: 'copilot',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'gh copilot review --pull-request NUMBER [--comment] [--summary]',
    examples: [
      { command: 'gh copilot review --pull-request 42 --summary', description: 'Generate a summary for PR #42.' },
      { command: 'gh copilot review --pull-request 42 --comment', description: 'Ask Copilot to leave draft review comments.' }
    ],
    flags: [
      { flag: '--pull-request <number>', description: 'Target pull request number or URL.' },
      { flag: '--summary', description: 'Produce a summary feedback block.' },
      { flag: '--comment', description: 'Suggest inline review comments (requires confirmation before posting).' }
    ],
    notes: [
      'Copilot cannot merge PRs—use the summary as input for manual review decisions.',
      'Draft comments are shown locally before submission; confirm accuracy before sending.'
    ],
    relatedCommands: ['gh-copilot-explain'],
    tags: ['code-review', 'productivity'],
    officialDocs: 'https://docs.github.com/en/copilot/github-copilot-in-the-cli/using-github-copilot-in-the-cli#gh-copilot-review'
  },

  // Aider CLI (pair programming assistant)
  {
    id: 'aider-start-session',
    command: 'aider .',
    description: 'Start an Aider chat session in the current repository.',
    tool: 'aider',
    category: 'chat',
    riskLevel: 'safe',
    syntax: 'aider [path]',
    examples: [
      { command: 'aider .', description: 'Launch aider in the current Git repository with default settings.' }
    ],
    flags: [
      { flag: '--model <id>', description: 'Override the default model (for example gpt-4o-mini, claude-3.5-sonnet).' },
      { flag: '--ide', description: 'Enable IDE-style multiline editor prompts.' }
    ],
    notes: [
      'Aider expects a Git repository so it can stage and show diffs.',
      'Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or other provider keys before launching.'
    ],
    relatedCommands: ['aider-select-model', 'aider-watch'],
    tags: ['pair-programming', 'chat'],
    officialDocs: 'https://aider.chat/docs/usage/'
  },
  {
    id: 'aider-select-model',
    command: 'aider --model gpt-4o-mini --openai-api-key $OPENAI_API_KEY .',
    description: 'Start aider with a specific provider and API key environment variable.',
    tool: 'aider',
    category: 'auth',
    riskLevel: 'safe',
    syntax: 'aider --model MODEL_ID [--openai-api-key KEY | --anthropic-api-key KEY] PATH',
    examples: [
      { command: 'aider --model gpt-4o-mini --openai-api-key $OPENAI_API_KEY .', description: 'Use OpenAI’s GPT-4o mini model for the session.' },
      { command: 'AIDER_ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY aider --model claude-3.5-sonnet .', description: 'Select an Anthropic model by exporting the key.' }
    ],
    flags: [
      { flag: '--model <id>', description: 'Model specifier (gpt-4o, gpt-4o-mini, claude-3.5-sonnet, etc.).' },
      { flag: '--openai-api-key <key>', description: 'Pass the OpenAI key inline (prefer env vars for security).' },
      { flag: '--anthropic-api-key <key>', description: 'Pass the Anthropic key inline if needed.' }
    ],
    notes: [
      'Inline API keys will appear in shell history; prefer exporting variables instead.',
      'Use aider --models to list supported providers and ids.'
    ],
    relatedCommands: ['aider-start-session'],
    tags: ['authentication', 'configuration'],
    officialDocs: 'https://aider.chat/docs/usage/'
  },
  {
    id: 'aider-watch',
    command: 'aider --watch src --watch tests',
    description: 'Continuously monitor directories for changes and feed updates to the assistant.',
    tool: 'aider',
    category: 'files',
    riskLevel: 'safe',
    syntax: 'aider --watch PATH [--watch PATH...]',
    examples: [
      { command: 'aider --watch src --watch tests', description: 'Watch source and test folders to keep aider in sync.' }
    ],
    flags: [
      { flag: '--watch <path>', description: 'Directory or file to watch for incremental updates.' }
    ],
    notes: [
      'Useful when working alongside other editors to keep aider aware of file edits.',
      'Too many watch paths can increase CPU usage—watch only relevant folders.'
    ],
    relatedCommands: ['aider-start-session'],
    tags: ['automation', 'sync'],
    officialDocs: 'https://aider.chat/docs/usage/options/'
  },
  {
    id: 'aider-apply-patches',
    command: 'aider --apply',
    description: 'Automatically apply AI-generated patches without manual review.',
    tool: 'aider',
    category: 'code',
    riskLevel: 'caution',
    syntax: 'aider --apply [path]',
    examples: [
      { command: 'aider --apply .', description: 'Accept aider’s patches automatically during the session.' }
    ],
    flags: [
      { flag: '--apply', description: 'Apply patches immediately instead of showing a diff first.' }
    ],
    notes: [
      'Review changes via git diff frequently—auto-apply can overwrite work in progress.',
      'Combine with --dry-run in CI pipelines to preview changes safely.'
    ],
    relatedCommands: ['aider-dry-run'],
    tags: ['automation', 'unsafe'],
    officialDocs: 'https://aider.chat/docs/usage/options/'
  },
  {
    id: 'aider-commit',
    command: 'aider --commit',
    description: 'Automatically create Git commits for accepted suggestions.',
    tool: 'aider',
    category: 'files',
    riskLevel: 'caution',
    syntax: 'aider --commit [--commit-message "TEXT"] [path]',
    examples: [
      { command: 'aider --commit --commit-message "docs: update quick-start" docs', description: 'Let aider create commits with a custom message.' }
    ],
    flags: [
      { flag: '--commit', description: 'Stage and commit AI changes after confirmation.' },
      { flag: '--commit-message "text"', description: 'Override the generated commit message.' }
    ],
    notes: [
      'Ensure your Git user/email is configured to avoid rejected commits.',
      'Review commits before pushing to shared branches.'
    ],
    relatedCommands: ['aider-apply-patches'],
    tags: ['git', 'automation'],
    officialDocs: 'https://aider.chat/docs/usage/options/'
  },
  {
    id: 'aider-dry-run',
    command: 'aider --dry-run',
    description: 'Preview aider’s planned edits without touching the working tree.',
    tool: 'aider',
    category: 'code',
    riskLevel: 'safe',
    syntax: 'aider --dry-run [path]',
    examples: [
      { command: 'aider --dry-run --model claude-3.5-sonnet .', description: 'Emulate a session for CI gating without modifying files.' }
    ],
    flags: [
      { flag: '--dry-run', description: 'Generate suggested changes while leaving files unchanged.' }
    ],
    notes: [
      'Ideal for CI checks that validate aider prompts or catch regressions.',
      'Pair with --apply in follow-up jobs once suggestions are approved.'
    ],
    relatedCommands: ['aider-apply-patches'],
    tags: ['ci', 'validation'],
    officialDocs: 'https://aider.chat/docs/usage/examples/ci/'
  }
];

const examples: ToolExample[] = [
  {
    title: 'Compare Claude Project Commands',
    input: 'claude project',
    description: 'Surface project management subcommands to streamline Claude Code setups.'
  },
  {
    title: 'Manage Local Ollama Models',
    input: 'ollama model list',
    description: 'Review how to download, inspect, and prune local Ollama models safely.'
  },
  {
    title: 'Deploy Gemini Endpoints',
    input: 'gcloud ai endpoints',
    description: 'Find the sequence of Vertex AI commands needed to deploy Gemini APIs.'
  },
  {
    title: 'Generate Release Notes with Copilot',
    input: 'gh copilot suggest',
    description: 'Locate Copilot CLI commands that help craft changelogs and reviews.'
  }
];

export const AI_CLI_ASSISTANT_TOOL: Tool = {
  id: 'ai-cli-assistant',
  name: 'AI CLI Assistant',
  slug: 'ai-cli-assistant',
  description: 'Authoritative AI CLI reference covering Claude Code, Ollama, OpenAI, Vertex AI Gemini, Cursor, GitHub Copilot, and aider with syntax, flags, and safety notes.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  examples,
  relatedTools: ['cli-commands-reference', 'git-diff-visualizer', 'json-formatter'],
  tags: ['ai', 'cli', 'commands', 'reference', 'claude', 'ollama', 'openai', 'copilot', 'gemini', 'aider'],
  searchTerms: [
    'ai cli',
    'claude commands',
    'ollama models',
    'openai cli',
    'vertex ai gemini',
    'cursor cli',
    'github copilot terminal',
    'aider automation',
    'command line ai reference'
  ],
  faqs: [
    {
      question: 'How do I choose the right Claude model for the CLI?',
      answer: 'Run "claude config get default_model" to view the current default and "claude config set default_model <id>" to change it. The Claude docs list available model IDs and recommended use cases.'
    },
    {
      question: 'What is the safest way to test aider in CI?',
      answer: 'Use "aider --dry-run" in CI pipelines to preview changes without touching the working tree. When satisfied, rerun with "--apply" or review the generated diff manually.'
    },
    {
      question: 'Which commands set up Vertex AI Gemini access?',
      answer: 'Authenticate with "gcloud auth application-default login", set your project via "gcloud config set project", then list or deploy models using the "gcloud ai" subcommands provided.'
    },
    {
      question: 'Can GitHub Copilot CLI push changes automatically?',
      answer: 'Copilot CLI generates explanations, suggestions, and review summaries but does not merge or push changes. Always review the output before committing to your repository.'
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

  if (filters.tool) {
    filteredCommands = filteredCommands.filter(cmd => cmd.tool === filters.tool);
  }
  if (filters.category) {
    filteredCommands = filteredCommands.filter(cmd => cmd.category === filters.category);
  }
  if (filters.riskLevel) {
    filteredCommands = filteredCommands.filter(cmd => cmd.riskLevel === filters.riskLevel);
  }

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
