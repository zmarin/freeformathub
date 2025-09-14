import type { Tool, ToolResult } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface HtmlVisualizerOptions {
  autoRun: boolean;
  theme: 'light' | 'dark' | 'auto';
  layout: 'horizontal' | 'vertical';
  showLineNumbers: boolean;
  wrapLines: boolean;
}

export interface HtmlVisualizerInput {
  html: string;
  css: string;
  javascript: string;
  options: HtmlVisualizerOptions;
}

export interface HtmlVisualizerResult extends ToolResult {
  previewHtml?: string;
  stats?: {
    htmlLines: number;
    cssLines: number;
    jsLines: number;
    totalSize: number;
    processingTime: number;
  };
  errors?: string[];
  warnings?: string[];
}

export function processHtmlVisualizer(input: HtmlVisualizerInput): HtmlVisualizerResult {
  const startTime = performance.now();
  const { html, css, javascript } = input;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic HTML structure validation
    if (html && !html.includes('<!DOCTYPE') && !html.includes('<html')) {
      warnings.push('Consider adding a DOCTYPE declaration for better browser compatibility');
    }

    // CSS validation (basic)
    if (css && css.includes('expression(')) {
      errors.push('CSS expressions are not allowed for security reasons');
    }

    // JavaScript validation (basic)
    if (javascript) {
      // Check for potentially dangerous functions
      const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval'];
      dangerousFunctions.forEach(func => {
        if (javascript.includes(func + '(')) {
          warnings.push(`Use of ${func}() detected - be cautious with dynamic code execution`);
        }
      });
    }

    // Build the complete HTML document
    const previewHtml = buildPreviewDocument(html, css, javascript);

    // Calculate statistics
    const stats = {
      htmlLines: html ? html.split('\n').length : 0,
      cssLines: css ? css.split('\n').length : 0,
      jsLines: javascript ? javascript.split('\n').length : 0,
      totalSize: (html?.length || 0) + (css?.length || 0) + (javascript?.length || 0),
      processingTime: Math.round(performance.now() - startTime)
    };

    return {
      success: true,
      previewHtml,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
    };
  }
}

function buildPreviewDocument(html: string, css: string, javascript: string): string {
  // If HTML contains a full document, use it as is but inject CSS and JS
  if (html.includes('<!DOCTYPE') || html.includes('<html')) {
    let fullHtml = html;

    // Inject CSS
    if (css) {
      const cssTag = `<style>\n${css}\n</style>`;
      if (fullHtml.includes('</head>')) {
        fullHtml = fullHtml.replace('</head>', `${cssTag}\n</head>`);
      } else if (fullHtml.includes('<head>')) {
        fullHtml = fullHtml.replace('<head>', `<head>\n${cssTag}`);
      } else {
        // Fallback: add to beginning
        fullHtml = cssTag + '\n' + fullHtml;
      }
    }

    // Inject JavaScript
    if (javascript) {
      const jsTag = `<script>\n${javascript}\n</script>`;
      if (fullHtml.includes('</body>')) {
        fullHtml = fullHtml.replace('</body>', `${jsTag}\n</body>`);
      } else {
        // Fallback: add to end
        fullHtml = fullHtml + '\n' + jsTag;
      }
    }

    return fullHtml;
  }

  // Build a complete document from fragments
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Visualizer Preview</title>
    <style>
        /* Reset and base styles */
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }

        /* User styles */
        ${css || ''}
    </style>
</head>
<body>
    ${html || '<p>Add HTML content to see the preview</p>'}

    <script>
        // Capture console output for debugging
        (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            window.consoleOutput = [];

            console.log = function(...args) {
                window.consoleOutput.push({type: 'log', message: args.join(' ')});
                originalLog.apply(console, args);
            };

            console.error = function(...args) {
                window.consoleOutput.push({type: 'error', message: args.join(' ')});
                originalError.apply(console, args);
            };

            console.warn = function(...args) {
                window.consoleOutput.push({type: 'warn', message: args.join(' ')});
                originalWarn.apply(console, args);
            };

            // User JavaScript
            try {
                ${javascript || ''}
            } catch (error) {
                console.error('JavaScript Error:', error.message);
            }
        })();
    </script>
</body>
</html>`;
}

// Predefined templates for quick start
export const HTML_TEMPLATES = {
  basic: {
    name: 'Basic HTML Page',
    html: `<div class="container">
    <h1>Welcome to HTML Visualizer</h1>
    <p>Start editing the HTML, CSS, and JavaScript to see live updates!</p>
    <button id="clickMe">Click me!</button>
</div>`,
    css: `.container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    padding: 20px;
}

h1 {
    color: #2563eb;
    margin-bottom: 20px;
}

button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background: #2563eb;
}`,
    javascript: `document.getElementById('clickMe').addEventListener('click', function() {
    alert('Hello from HTML Visualizer!');
});`
  },

  responsive: {
    name: 'Responsive Card',
    html: `<div class="card">
    <img src="https://via.placeholder.com/300x200" alt="Placeholder">
    <div class="card-content">
        <h2>Responsive Card</h2>
        <p>This card adapts to different screen sizes.</p>
        <button class="btn">Learn More</button>
    </div>
</div>`,
    css: `.card {
    max-width: 400px;
    margin: 20px auto;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    background: white;
}

.card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.card-content {
    padding: 20px;
}

.card h2 {
    margin: 0 0 10px 0;
    color: #1f2937;
}

.card p {
    color: #6b7280;
    margin-bottom: 15px;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

@media (max-width: 480px) {
    .card {
        margin: 10px;
        max-width: none;
    }
}`,
    javascript: `// Add interactive hover effect
document.addEventListener('DOMContentLoaded', function() {
    const card = document.querySelector('.card');

    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.transition = 'transform 0.3s ease';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});`
  },

  form: {
    name: 'Interactive Form',
    html: `<form class="modern-form">
    <h2>Contact Form</h2>

    <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" required>
    </div>

    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" required>
    </div>

    <div class="form-group">
        <label for="message">Message</label>
        <textarea id="message" rows="4" required></textarea>
    </div>

    <button type="submit">Send Message</button>

    <div id="result"></div>
</form>`,
    css: `.modern-form {
    max-width: 500px;
    margin: 20px auto;
    padding: 30px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modern-form h2 {
    text-align: center;
    color: #2d3748;
    margin-bottom: 30px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #4a5568;
    font-weight: 500;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 2px solid #e2e8f0;
    border-radius: 5px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #4299e1;
}

button {
    width: 100%;
    background: #4299e1;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s;
}

button:hover {
    background: #3182ce;
}

#result {
    margin-top: 20px;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
}

.success {
    background: #c6f6d5;
    color: #22543d;
}`,
    javascript: `document.querySelector('.modern-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const result = document.getElementById('result');

    // Simple validation
    if (!name || !email || !message) {
        result.innerHTML = 'Please fill in all fields.';
        result.className = 'error';
        return;
    }

    // Simulate form submission
    result.innerHTML = \`Thank you, \${name}! Your message has been sent.\`;
    result.className = 'success';

    // Clear form
    this.reset();
});`
  },

  animation: {
    name: 'CSS Animation Demo',
    html: `<div class="animation-demo">
    <h2>CSS Animation Examples</h2>

    <div class="demo-section">
        <h3>Bouncing Ball</h3>
        <div class="ball"></div>
    </div>

    <div class="demo-section">
        <h3>Loading Spinner</h3>
        <div class="spinner"></div>
    </div>

    <div class="demo-section">
        <h3>Hover Effects</h3>
        <div class="hover-card">Hover me!</div>
    </div>
</div>`,
    css: `.animation-demo {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    text-align: center;
}

.demo-section {
    margin: 40px 0;
    padding: 20px;
    border: 2px dashed #e2e8f0;
    border-radius: 10px;
}

.demo-section h3 {
    margin-top: 0;
    color: #2d3748;
}

/* Bouncing Ball Animation */
.ball {
    width: 50px;
    height: 50px;
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    border-radius: 50%;
    margin: 20px auto;
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-50px); }
}

/* Loading Spinner */
.spinner {
    width: 40px;
    height: 40px;
    margin: 20px auto;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Hover Card */
.hover-card {
    display: inline-block;
    padding: 20px 40px;
    background: #6c5ce7;
    color: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.hover-card:hover {
    transform: scale(1.1) rotate(-2deg);
    box-shadow: 0 8px 25px rgba(108, 92, 231, 0.4);
}`,
    javascript: `// Add some interactive animations
document.addEventListener('DOMContentLoaded', function() {
    const ball = document.querySelector('.ball');

    // Click to change ball color
    ball.addEventListener('click', function() {
        const colors = [
            'linear-gradient(45deg, #ff6b6b, #ee5a24)',
            'linear-gradient(45deg, #4834d4, #686de0)',
            'linear-gradient(45deg, #00d2d3, #54a0ff)',
            'linear-gradient(45deg, #2ed573, #7bed9f)'
        ];

        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.style.background = randomColor;
    });

    console.log('Animation demo loaded! Click the ball to change its color.');
});`
  }
};

// Tool metadata for registration
export const HTML_VISUALIZER_TOOL: Tool = {
  id: 'html-visualizer',
  name: 'HTML Visualizer',
  slug: 'html-visualizer',
  description: 'Interactive HTML, CSS, and JavaScript editor with live preview',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'development')!,
  tags: ['html', 'css', 'javascript', 'preview', 'editor', 'codepen'],
  icon: 'Code2',
  gradient: 'from-blue-500 to-purple-600',

  // SEO
  seoTitle: 'HTML Live Preview Editor | Interactive Code Visualizer Tool',
  seoDescription: 'Create and test HTML, CSS, and JavaScript with instant live preview. Secure online code editor with templates and real-time visualization.',
  seoKeywords: 'html editor, css preview, javascript tester, code visualizer, web development, online editor, codepen alternative',

  // Usage examples
  examples: [
    {
      title: 'Basic HTML Structure',
      description: 'Create a simple webpage with HTML, CSS, and JavaScript',
      input: HTML_TEMPLATES.basic
    },
    {
      title: 'Responsive Design',
      description: 'Build responsive components that work on all devices',
      input: HTML_TEMPLATES.responsive
    },
    {
      title: 'Interactive Forms',
      description: 'Create forms with validation and user interaction',
      input: HTML_TEMPLATES.form
    },
    {
      title: 'CSS Animations',
      description: 'Experiment with CSS animations and transitions',
      input: HTML_TEMPLATES.animation
    }
  ],

  // Use cases
  useCases: [
    'Prototyping web interfaces quickly',
    'Testing HTML, CSS, and JavaScript snippets',
    'Learning web development concepts',
    'Creating interactive demonstrations',
    'Debugging front-end code issues',
    'Building responsive design mockups'
  ],

  // FAQ
  faqs: [
    {
      question: 'Is my code secure when using the HTML Visualizer?',
      answer: 'Yes, all code runs in a sandboxed iframe with strict security policies. No code is sent to our servers - everything processes locally in your browser.'
    },
    {
      question: 'Can I use external libraries like jQuery or Bootstrap?',
      answer: 'Yes, you can include external libraries by adding CDN links in your HTML head section or by copying the library code directly into the JavaScript panel.'
    },
    {
      question: 'Does the preview update automatically?',
      answer: 'Yes, the live preview updates automatically as you type (with a short delay for performance). You can also manually refresh using the Run Preview button.'
    },
    {
      question: 'Can I save my work?',
      answer: 'You can download your complete HTML file using the export options. The tool also remembers your last session in your browser locally.'
    },
    {
      question: 'What are the limitations compared to full IDEs?',
      answer: 'This tool is designed for quick prototyping and testing. For complex projects, you may want to use a full IDE, but it\'s perfect for learning, experimenting, and sharing code snippets.'
    }
  ]
};