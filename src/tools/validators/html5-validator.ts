import type { Tool, ToolConfig, ToolResult } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import { validateHtmlDocument, processHtmlBeautifier } from '../formatters/html-beautifier';

export interface Html5ValidatorConfig extends ToolConfig {
  includeWarnings: boolean;
  prettifyOutput: boolean;
  indentSize: number;
}

export const HTML5_VALIDATOR_TOOL: Tool = {
  id: 'html5-validator',
  name: 'HTML5 Validator',
  description:
    'Validate HTML5 markup for unclosed tags, structural issues, and malformed attributes with optional prettified output and Markdown reports.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'validators')!.subcategories!.find(
    sub => sub.id === 'format-validation'
  )!,
  slug: 'html5-validator',
  icon: '🛡️',
  keywords: [
    'html5 validator',
    'html validation',
    'html lint',
    'html checker',
    'markup validation',
    'html prettier',
    'html quality'
  ],
  seoTitle: 'HTML5 Validator & Linter - Check HTML Markup Online',
  seoDescription:
    'Validate HTML5 markup for unclosed tags, mismatched elements, and invalid attributes. Get readable reports and optional prettified output — all offline in your browser.',
  examples: [
    {
      title: 'Valid HTML document',
      input: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Example</title>
  </head>
  <body>
    <main>
      <h1>Hello World</h1>
      <p>Welcome to valid markup.</p>
    </main>
  </body>
</html>`,
      output: '✅ HTML passed validation',
      description: 'Clean HTML document without structural issues.'
    },
    {
      title: 'Mismatched tags',
      input: `<div class="container">
  <p>Paragraph without closing div
  <span>Nested content</span>
</div>`,
      output: '❌ HTML failed validation',
      description: 'Highlights unclosed tags to speed up debugging.'
    }
  ],
  useCases: [
    'Catch unclosed tags and attribute typos before deployments',
    'Validate HTML exported from WYSIWYG editors or CMS systems',
    'Provide QA reports for landing pages and marketing content',
    'Prettify HTML while reviewing validation results',
    'Teach HTML5 fundamentals with immediate feedback'
  ],
  commonErrors: [
    'Unexpected closing tags that do not match the latest opening tag',
    'Unclosed block-level elements causing layout issues',
    'Attributes with spaces or invalid characters in their names',
    'Nested inline elements that break semantic structure',
    'Duplicated IDs or missing doctype declarations'
  ],
  faq: [
    {
      question: 'Does this validator support HTML5?',
      answer: 'Yes. It checks HTML5 documents for common structural issues like unclosed tags, mismatches, and invalid attributes.'
    },
    {
      question: 'Will this tool prettify my HTML?',
      answer: 'Enable the prettify option to output formatted HTML while validating, making diffs easier to review.'
    },
    {
      question: 'Do you send my HTML to a server?',
      answer: 'No. Validation and formatting happen entirely in your browser, keeping staging or production markup private.'
    },
    {
      question: 'Can I ignore warnings?',
      answer: 'Yes. Toggle the warnings option to hide advisory messages and focus on blocking errors.'
    },
    {
      question: 'Does it detect accessibility issues?',
      answer: 'It focuses on structural HTML validation. Pair it with accessibility testing tools for comprehensive reviews.'
    }
  ],
  relatedTools: [
    'html-beautifier',
    'css-beautifier',
    'js-beautifier',
    'css-minifier',
    'regex-tester'
  ],
  howItWorks: [
    {
      title: 'Paste or Upload HTML',
      icon: '📥',
      description:
        'Drop raw HTML from templates, CMS exports, or landing pages into the editor. The validator accepts full documents or snippets.',
      keywords: ['paste html', 'upload html', 'html snippet', 'cms export', 'landing page']
    },
    {
      title: 'Configure Validation Output',
      icon: '⚙️',
      description:
        'Choose whether to show warnings and prettify valid markup. Adjust indentation to match your team’s coding standards.',
      keywords: ['show warnings', 'prettify html', 'indentation', 'coding standards']
    },
    {
      title: 'Run Instant Analysis',
      icon: '⚡',
      description:
        'The tool scans the DOM structure for unclosed tags, mismatches, and invalid attributes. Results are summarised with precise line numbers.',
      keywords: ['validate html', 'line numbers', 'dom analysis', 'mismatched tags']
    },
    {
      title: 'Review & Share Reports',
      icon: '📤',
      description:
        'Copy the Markdown report, download results, or share prettified markup with your team for quick fixes and QA documentation.',
      keywords: ['markdown report', 'download results', 'team collaboration', 'qa documentation']
    }
  ],
  problemsSolved: [
    {
      problem: 'Broken HTML slips into production because structural issues are hard to spot in large files.',
      solution: 'Automated validation pinpoints unclosed tags, invalid attributes, and mismatches with line numbers before deploys.',
      icon: '🚨',
      keywords: ['production bugs', 'unclosed tags', 'pre deployment', 'html quality']
    },
    {
      problem: 'Marketing teams need readable reports when reviewing third-party HTML snippets.',
      solution: 'Readable Markdown summaries and prettified output make stakeholder reviews painless.',
      icon: '📝',
      keywords: ['marketing review', 'stakeholder report', 'html summary', 'prettified output']
    },
    {
      problem: 'Developers waste time manually reformatting HTML to understand validation errors.',
      solution: 'Prettify and validate in one step, aligning code style and making diffs easy to understand.',
      icon: '⏱️',
      keywords: ['prettify html', 'speed up diffs', 'code style', 'developer productivity']
    }
  ],
  whyChoose: [
    {
      title: 'Client-Side Validation',
      description:
        'Run checks locally without sending markup to third parties — perfect for NDAs, unreleased campaigns, and internal dashboards.',
      icon: '🔒',
      keywords: ['client-side', 'secure validation', 'nda safe', 'no upload']
    },
    {
      title: 'Actionable Error Reports',
      description:
        'Line numbers, instance paths, and human-readable messages keep designers and developers aligned on fixes.',
      icon: '📊',
      keywords: ['line numbers', 'error reports', 'team alignment', 'readable messages']
    },
    {
      title: 'Integrated Prettier',
      description:
        'Optional prettify output leverages the HTML beautifier, so you can deliver clean markup alongside validation feedback.',
      icon: '💡',
      keywords: ['html prettier', 'clean markup', 'beautifier integration', 'formatted output']
    },
    {
      title: 'History Friendly',
      description:
        'Store runs with configuration snapshots to track QA cycles or document fixes for regulated industries.',
      icon: '🗂️',
      keywords: ['history', 'qa cycle', 'compliance', 'snapshot']
    }
  ]
};

export function validateHtml5(
  input: string,
  config: Html5ValidatorConfig
): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Please provide HTML content to validate.'
    };
  }

  const { errors, warnings } = validateHtmlDocument(input);

  const visibleWarnings = config.includeWarnings ? warnings : [];
  const isValid = errors.length === 0;

  const reportLines: string[] = [];
  if (isValid) {
    reportLines.push('✅ HTML passed validation');
  } else {
    reportLines.push('❌ HTML failed validation');
    reportLines.push('');
    reportLines.push('### Errors');
    errors.forEach((error, index) => {
      reportLines.push(
        `${index + 1}. Line ${error.line}, Column ${error.column}: ${error.message} (${error.code})`
      );
    });
  }

  if (visibleWarnings.length > 0) {
    reportLines.push('');
    reportLines.push('### Warnings');
    visibleWarnings.forEach((warning, index) => {
      reportLines.push(
        `${index + 1}. Line ${warning.line}, Column ${warning.column}: ${warning.message} (${warning.code})`
      );
    });
  }

  let prettified: string | undefined;
  if (config.prettifyOutput) {
    const beautifyResult = processHtmlBeautifier(input, {
      mode: 'beautify',
      indentSize: config.indentSize,
      indentType: 'spaces',
      maxLineLength: 120,
      preserveComments: true,
      preserveEmptyLines: false,
      sortAttributes: false,
      removeTrailingSpaces: true,
      selfCloseTags: true,
      validateHtml: false,
    });

    if (beautifyResult.success && beautifyResult.output) {
      prettified = beautifyResult.output;
    }
  }

  return {
    success: isValid,
    output: reportLines.join('\n'),
    metadata: {
      valid: isValid,
      errorCount: errors.length,
      warningCount: visibleWarnings.length,
      prettified,
    }
  };
}
