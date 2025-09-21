import React, { useState, useMemo } from 'react';
import { Search, Copy, Filter, X, Smile, Heart, Flag, Coffee, Star, Palette } from 'lucide-react';
import { EMOJI_DATA, processEmojiData, type EmojiData } from '../../../tools/development/emoji-reference';

const EmojiReference: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showSkinTonesOnly, setShowSkinTonesOnly] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  const { results, totalCount, categories } = useMemo(() => {
    return processEmojiData(query, {
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      hasSkinTones: showSkinTonesOnly
    });
  }, [query, selectedCategory, selectedSubcategory, showSkinTonesOnly]);

  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return [...new Set(EMOJI_DATA
      .filter(emoji => emoji.category === selectedCategory)
      .map(emoji => emoji.subcategory)
      .filter(Boolean)
    )].sort();
  }, [selectedCategory]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setShowSkinTonesOnly(undefined);
    setQuery('');
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Smileys & Emotion': <Smile className="w-4 h-4" />,
      'People & Body': <Star className="w-4 h-4" />,
      'Animals & Nature': <Heart className="w-4 h-4" />,
      'Food & Drink': <Coffee className="w-4 h-4" />,
      'Travel & Places': <Star className="w-4 h-4" />,
      'Activities': <Palette className="w-4 h-4" />,
      'Objects': <Star className="w-4 h-4" />,
      'Symbols': <Star className="w-4 h-4" />,
      'Flags': <Flag className="w-4 h-4" />
    };
    return iconMap[category] || <Star className="w-4 h-4" />;
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedSubcategory,
    showSkinTonesOnly !== undefined ? 'skinTones' : ''
  ].filter(Boolean).length;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Copy Feedback */}
      {copyFeedback && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copyFeedback}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emojis by name, shortcode, keywords, or Unicode..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}

          <div className="text-sm text-gray-600">
            {totalCount} emoji{totalCount !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory(''); // Reset subcategory when category changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory && subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All subcategories</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skin Tones</label>
                <select
                  value={showSkinTonesOnly === undefined ? '' : showSkinTonesOnly.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setShowSkinTonesOnly(value === '' ? undefined : value === 'true');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All emojis</option>
                  <option value="true">With skin tone variants</option>
                  <option value="false">No skin tone variants</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="space-y-6">
        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Smile className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No emojis found</p>
            <p>Try adjusting your search terms or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((emoji) => (
              <div key={emoji.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{emoji.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{emoji.name}</h3>
                  <p className="text-sm text-gray-600">{emoji.description}</p>
                </div>

                <div className="space-y-3">
                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getCategoryIcon(emoji.category)}
                      {emoji.category}
                    </span>
                    {emoji.subcategory && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {emoji.subcategory.replace('-', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Codes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Unicode</span>
                        <code className="block text-sm font-mono text-gray-800">{emoji.unicode}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emoji.unicode, 'Unicode')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy Unicode"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs font-medium text-gray-500">HTML</span>
                        <code className="block text-sm font-mono text-gray-800">{emoji.htmlCode}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emoji.htmlCode, 'HTML code')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy HTML code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs font-medium text-gray-500">CSS</span>
                        <code className="block text-sm font-mono text-gray-800">{emoji.cssCode}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emoji.cssCode, 'CSS code')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy CSS code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Shortcode</span>
                        <code className="block text-sm font-mono text-gray-800">{emoji.shortcode}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emoji.shortcode, 'Shortcode')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy shortcode"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Emoji</span>
                        <span className="block text-sm">{emoji.emoji}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emoji.emoji, 'Emoji')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy emoji"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Skin Tones */}
                  {emoji.skinTones && emoji.skinTones.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">Skin Tone Variants</span>
                      <div className="flex flex-wrap gap-1">
                        {emoji.skinTones.map((tone, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(tone, 'Skin tone variant')}
                            className="text-xl hover:bg-gray-100 p-1 rounded"
                            title="Click to copy"
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aliases */}
                  {emoji.aliases.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 block mb-1">Aliases</span>
                      <div className="flex flex-wrap gap-1">
                        {emoji.aliases.map((alias, idx) => (
                          <code key={idx} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {alias}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {emoji.keywords.slice(0, 4).map((keyword, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {keyword}
                        </span>
                      ))}
                      {emoji.keywords.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{emoji.keywords.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiReference;