import { useState, useEffect } from 'react';
import { processHackerNewsAIContent, type ContentGenerationConfig } from '../../../tools/web/hacker-news-ai-blog';

export function HackerNewsAIBlogGenerator({ className = '' }: { className?: string }) {
  const [config, setConfig] = useState<ContentGenerationConfig>({
    category: 'ai-ml',
    tone: 'professional',
    wordCount: 'medium',
    includeCodeExamples: false,
    focus: 'technical'
  });

  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await processHackerNewsAIContent('Generate tech article', config);
      if (result.success) {
        setOutput(result.output || '');
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (err) {
      setError('An error occurred generating the content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Stylish Hacker News AI Blog Container */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 p-6 rounded-2xl shadow-xl h-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg h-full overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 Hacker News AI Blog Generator</h1>
            <p className="text-gray-600">Transform HN discussions into engaging blog articles</p>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-2">Tech Category</label>
            <select
              value={config.category}
              onChange={(e) => setConfig({...config, category: e.target.value as any})}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
            >
              <option value="ai-ml">AI & Machine Learning</option>
              <option value="web-development">Web Development</option>
              <option value="startups">Startups & Business</option>
              <option value="security">Security & Privacy</option>
              <option value="dev-tools">Developer Tools</option>
              <option value="programming">Programming</option>
              <option value="blockchain">Blockchain & Crypto</option>
              <option value="cloud">Cloud Computing</option>
              <option value="data-science">Data Science</option>
            </select>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">Tone</label>
              <select
                value={config.tone}
                onChange={(e) => setConfig({...config, tone: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
              >
                <option value="professional">Professional</option>
                <option value="analytical">Analytical</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">Length</label>
              <select
                value={config.wordCount}
                onChange={(e) => setConfig({...config, wordCount: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
              >
                <option value="short">Short (~500 words)</option>
                <option value="medium">Medium (~1000 words)</option>
                <option value="long">Long (~1500 words)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">Focus</label>
              <select
                value={config.focus}
                onChange={(e) => setConfig({...config, focus: e.target.value as any})}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
              >
                <option value="technical">Technical</option>
                <option value="business">Business</option>
                <option value="educational">Educational</option>
                <option value="opinion">Opinion</option>
              </select>
            </div>
          </div>

          {/* Code Examples Toggle */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="codeExamples"
              checked={config.includeCodeExamples}
              onChange={(e) => setConfig({...config, includeCodeExamples: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="codeExamples" className="text-gray-700">Include code examples</label>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateContent}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md focus:outline-none disabled:opacity-50"
          >
            {isLoading ? 'Generating Article...' : 'Generate Blog Article'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-center text-sm">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {output && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Generated Article:</h3>
                <div className="text-gray-600 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                  {output}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">How It Works</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Fetches current trends from Hacker News</p>
              <p>• Analyzes community discussions and sentiment</p>
              <p>• Generates original, SEO-optimized articles</p>
              <p>• Creates engaging content from developer insights</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HackerNewsAIBlogGenerator;
