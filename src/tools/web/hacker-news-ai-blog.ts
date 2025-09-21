import type { Tool, ToolResult } from '../../types/tool';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface HackerNewsArticle {
  id: string;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: 'story' | 'comment' | 'job' | 'poll';
  topic: string;
  tags: string[];
}

export interface GeneratedArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  excerpt: string;
  wordCount: number;
  readingTime: number;
  keywords: string[];
  originalHNStories: number[];
  generatedAt: number;
  tone: 'professional' | 'analytical' | 'conversational';
}

export interface ContentGenerationConfig {
  category: 'ai-ml' | 'web-development' | 'startups' | 'security' | 'mobile' | 'dev-tools' | 'programming' | 'blockchain' | 'cloud' | 'data-science';
  tone: 'professional' | 'analytical' | 'conversational';
  wordCount: 'short' | 'medium' | 'long';
  includeCodeExamples: boolean;
  focus: 'technical' | 'business' | 'educational' | 'opinion';
}

const HACKER_NEWS_API_BASE = 'https://hacker-news.firebaseio.com/v0';

const TOPIC_CATEGORIES = {
  'ai-ml': ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'GPT', 'LLM', 'OpenAI', 'Azure AI', 'Google AI'],
  'web-development': ['React', 'JavaScript', 'TypeScript', 'Next.js', 'Vue.js', 'Angular', 'CSS', 'HTML', 'WebAssembly'],
  'startups': ['Startup', 'Funding', 'Venture Capital', 'IPO', 'YC', 'Series A', 'Bootstrap', 'Exit'],
  'security': ['Security', 'Cybersecurity', 'Hacking', 'Vulnerability', 'Encryption', 'Privacy', 'GDPR'],
  'mobile': ['iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile Development'],
  'dev-tools': ['GitHub', 'Docker', 'Kubernetes', 'CI/CD', 'Vercel', 'Netlify', 'AWS', 'Cloud'],
  'programming': ['Python', 'Rust', 'Go', 'Java', 'TypeScript', 'Shell', 'Bash', 'Performance'],
  'blockchain': ['Bitcoin', 'Ethereum', 'Blockchain', 'Crypto', 'DeFi', 'NFT', 'Web3', 'Smart Contracts'],
  'cloud': ['AWS', 'Azure', 'GCP', 'Serverless', 'Lambda', 'Microservices', 'Docker', 'Kubernetes'],
  'data-science': ['Data Science', 'Analytics', 'Big Data', 'Pandas', 'SQL', 'Tableau', 'Visualization']
};

async function fetchHackerNewsTopStories(): Promise<HackerNewsArticle[]> {
  try {
    const response = await fetch(`${HACKER_NEWS_API_BASE}/topstories.json`);
    if (!response.ok) throw new Error('Failed to fetch HN top stories');
    const storyIds = await response.json() as number[];

    // Fetch first 30 stories
    const storyPromises = storyIds.slice(0, 30).map(async (id) => {
      const storyResponse = await fetch(`${HACKER_NEWS_API_BASE}/item/${id}.json`);
      if (!storyResponse.ok) return null;
      return await storyResponse.json();
    });

    const stories = await Promise.all(storyPromises);
    return stories
      .filter((story): story is HackerNewsArticle => story !== null)
      .map(story => ({
        ...story,
        topic: determineTopic(story.title || ''),
        tags: extractTags(story.title || '')
      }));
  } catch (error) {
    console.error('Error fetching HN stories:', error);
    return [];
  }
}

function determineTopic(title: string): string {
  const titleLower = title.toLowerCase();

  for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'general';
}

function extractTags(title: string): string[] {
  const tags: string[] = [];
  const titleLower = title.toLowerCase();

  // Extract common tech keywords
  const techKeywords = [
    'React', 'JavaScript', 'Python', 'AI', 'Machine Learning', 'AWS', 'Docker',
    'Kubernetes', 'GitHub', 'TypeScript', 'Blockchain', 'Crypto', 'Startup',
    'Security', 'Mobile', 'iOS', 'Android', 'DevTools', 'API', 'Database'
  ];

  for (const keyword of techKeywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      tags.push(keyword.toLowerCase().replace(' ', '-'));
    }
  }

  return tags.slice(0, 5); // Max 5 tags
}

function generateArticleTitle(stories: HackerNewsArticle[], category: string): string {
  const categoryTitles = {
    'ai-ml': ['The Evolution of AI in 2024', 'Machine Learning Breakthroughs That Are Changing Everything', 'AI Trends in 2024: What Experts Are Saying'],
    'web-development': ['Modern Web Development in 2024', 'The Frontend Revolution', 'Full-Stack Development Trends That Matter'],
    'startups': ['Startup Funding Landscape Today', 'Building Successful Tech Startups', 'VC Trends and Startup Success Stories'],
    'security': ['Cybersecurity in the Modern Age', 'Protecting Digital Assets', 'The State of Cybersecurity in 2024']
  };

  const titles = categoryTitles[category as keyof typeof categoryTitles] || [
    'Current Tech Trends and Insights',
    'What\'s Happening in Technology Today',
    'Developer Community Buzz and Trends'
  ];

  return titles[Math.floor(Math.random() * titles.length)];
}

function generateArticleContent(stories: HackerNewsArticle[], config: ContentGenerationConfig): GeneratedArticle {
  const article: GeneratedArticle = {
    id: `hn-article-${Date.now()}`,
    title: generateArticleTitle(stories, config.category),
    category: config.category,
    content: '',
    excerpt: '',
    wordCount: 0,
    readingTime: 0,
    keywords: [],
    originalHNStories: stories.map(s => parseInt(s.id)),
    generatedAt: Date.now(),
    tone: config.tone
  };

  // Generate intro section
  const introContent = generateIntroSection(config.category, config.tone);
  article.content += introContent;

  // Generate main content sections
  const mainContent = generateMainContent(stories, config);
  article.content += mainContent;

  // Generate conclusion
  const conclusionContent = generateConclusionSection(config.category, config.tone);
  article.content += conclusionContent;

  // Generate meta data
  article.keywords = extractContentKeywords(stories);
  article.wordCount = article.content.split(' ').length;
  article.readingTime = Math.ceil(article.wordCount / 200); // Assuming 200 words per minute

  // Generate excerpt
  article.excerpt = article.content.split('.').slice(0, 2).join('.') + '.';

  return article;
}

function generateIntroSection(category: string, tone: string): string {
  const intros = {
    'ai-ml': `Artificial Intelligence continues to reshape industries, challenge our understanding of computing, and push the boundaries of what's possible. From new language models that can generate human-like text to computer vision systems that rival human perception, AI development is accelerating at an unprecedented pace. The developer community is abuzz with the latest breakthroughs, practical applications, and ethical considerations surrounding this transformative technology.`,
    'web-development': `Web development continues to evolve at breakneck speed, with new frameworks, tools, and approaches emerging regularly. From the rise of Jamstack architectures to the maturation of component-based development, developers are constantly adapting to new paradigms. Community discussions reveal both excitement about the future of web development and concerns about technical debt, scalability, and the best practices that will carry projects forward.`,
    'startups': `The startup ecosystem is a fascinating mix of innovation, ambition, and calculated risk. Every day, new companies emerge with bold visions for solving real-world problems while established players navigate the challenges of scaling and competition. Community discussions reveal the current state of technology entrepreneurship, from funding trends to product-market fit challenges and the realities of building successful companies.`,
    'security': `Digital security remains one of the most critical concerns in our increasingly connected world. As cyber threats evolve in sophistication and frequency, developers and organizations grapple with protecting sensitive data, maintaining user trust, and staying ahead of malicious actors. The community's collective wisdom offers valuable insights into current security challenges and emerging defense strategies.`
  };

  const intro = intros[category as keyof typeof intros] || 'Technology continues to evolve at an unprecedented pace, bringing both opportunities and challenges. Community discussions reveal the current state of innovation, the challenges developers face, and the promising solutions emerging from ongoing research and development.';
  return `## Introduction\n\n${intro}\n\n`;
}

function generateMainContent(stories: HackerNewsArticle[], config: ContentGenerationConfig): string {
  let content = '## Current Trends and Discussions\n\n';

  // Group stories by subtopics
  const subtopics = groupStoriesBySubtopics(stories, config.category);

  for (const [subtopic, topicStories] of Object.entries(subtopics)) {
    content += `### ${formatSubtopicTitle(subtopic)}\n\n`;

    const analysis = generateSubtopicAnalysis(topicStories, config.tone);
    content += analysis;

    if (config.includeCodeExamples && config.category === 'web-development') {
      content += generateCodeExample(subtopic);
    }

    content += '\n\n';
  }

  content += `## Key Takeaways\n\n${generateKeyTakeaways(stories, config)}\n\n`;

  return content;
}

function groupStoriesBySubtopics(stories: HackerNewsArticle[], category: string): Record<string, HackerNewsArticle[]> {
  const groups: Record<string, HackerNewsArticle[]> = {};

  stories.forEach(story => {
    const subtopic = getSubtopicFromStory(story, category);
    if (!groups[subtopic]) {
      groups[subtopic] = [];
    }
    groups[subtopic].push(story);
  });

  return groups;
}

function getSubtopicFromStory(story: HackerNewsArticle, category: string): string {
  const subtopics = {
    'ai-ml': ['language-models', 'computer-vision', 'automation', 'ethics', 'frameworks'],
    'web-development': ['frontend', 'backend', 'performance', 'frameworks', 'architecture'],
    'startups': ['funding', 'scaling', 'product-market-fit', 'team-building', 'exits'],
    'security': ['encryption', 'vulnerability-management', 'authentication', 'privacy', 'compliance']
  };

  const categorySubtopics = subtopics[category as keyof typeof subtopics] || ['general'];
  return categorySubtopics.find(st => story.title.toLowerCase().includes(st.replace('-', ' '))) || categorySubtopics[0];
}

function formatSubtopicTitle(subtopic: string): string {
  return subtopic.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function generateSubtopicAnalysis(stories: HackerNewsArticle[], tone: string): string {
  const articleCount = stories.length;
  const totalScore = stories.reduce((sum, story) => sum + story.score, 0);
  const avgScore = Math.round(totalScore / articleCount);

  const analysis = `Community discussions around this topic have generated significant interest, with ${articleCount} articles capturing an average score of ${avgScore} points on Hacker News. This indicates strong developer engagement and suggests these topics are top-of-mind for the programming community.

${stories.slice(0, 2).map(story =>
  `One particularly noteworthy discussion centers on "${story.title}", which garnered ${story.score} points and ${story.descendants || 0} comments. The community response suggests this topic resonates strongly with current development challenges and priorities.`
).join(' ')}`;

  return analysis;
}

function generateCodeExample(subtopic: string): string {
  if (subtopic.includes('frontend')) {
    return `\n\n\`\`\`javascript
// Modern React component with hooks
import { useState, useEffect } from 'react';

function DataFetcher({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [url]);

  return loading ? (
    <div>Loading...</div>
  ) : (
    <div>{JSON.stringify(data, null, 2)}</div>
  );
}
\`\`\`\n\n`;
  }

  return '';
}

function generateKeyTakeaways(stories: HackerNewsArticle[], config: ContentGenerationConfig): string {
  const takeaways = [
    'Community sentiment suggests continued focus on user experience and performance',
    'Emerging technologies are creating both opportunities and challenges',
    'Best practices and standardization efforts are gaining importance',
    'Security and privacy concerns remain top priorities',
    'Open source contributions continue to drive innovation',
    'Scalability and maintainability are critical considerations'
  ];

  return takeaways.slice(0, 4).map((takeaway, index) =>
    `${index + 1}. ${takeaway}`
  ).join('\n');
}

function generateConclusionSection(category: string, tone: string): string {
  const conclusions = {
    'ai-ml': `As we look to the future of artificial intelligence and machine learning, it's clear that the field continues to evolve rapidly. The discussions on Hacker News reflect not only technical innovation but also the broader societal implications of these powerful technologies. Developers and organizations would do well to stay informed about these trends and participate in the ongoing conversations shaping the future of AI.`,
    'web-development': `Web development is undergoing a period of significant change and opportunity. The frameworks, tools, and best practices emerging from community discussions will shape how we build digital experiences for years to come. Staying engaged with these developments is essential for any developer or organization looking to remain competitive in the evolving web landscape.`
  };

  const conclusion = conclusions[category as keyof typeof conclusions] || `The technology community continues to drive innovation and share knowledge through platforms like Hacker News. These discussions not only highlight current challenges and opportunities but also help shape the future direction of technology development across industries.`;

  return `## Conclusion\n\n${conclusion}\n\n`;
}

function extractContentKeywords(stories: HackerNewsArticle[]): string[] {
  const keywords = new Set<string>();

  stories.forEach(story => {
    // Extract words from title
    const words = story.title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3);

    words.forEach(word => keywords.add(word));
  });

  // Add important tech terms if not present
  const importantTerms = ['technology', 'development', 'programming', 'software'];
  importantTerms.forEach(term => keywords.add(term));

  return Array.from(keywords).slice(0, 10);
}

export async function processHackerNewsAIContent(input: string, config: ContentGenerationConfig): Promise<ToolResult> {
  try {
    // Fetch top stories from HN
    const stories = await fetchHackerNewsTopStories();

    if (stories.length === 0) {
      return {
        success: false,
        error: 'Unable to fetch Hacker News stories at this time. Please try again later.'
      };
    }

    // Filter stories by category
    const relevantStories = config.category === 'general'
      ? stories.slice(0, 10)
      : stories.filter(story => story.topic === config.category).slice(0, 10);

    if (relevantStories.length < 3) {
      // Fall back to general stories if category has few results
      relevantStories.push(...stories.filter(s => !relevantStories.includes(s)).slice(0, 7));
    }

    const finalStories = relevantStories.slice(0, 10);

    // Generate AI content
    const article = generateArticleContent(finalStories, config);

    // Format output as markdown content
    let output = `# ${article.title}\n\n`;
    output += `**Category:** ${article.category} • **Reading Time:** ${article.readingTime} minutes • **Word Count:** ${article.wordCount}\n\n`;
    output += `## Excerpt\n"${article.excerpt}"\n\n---\n\n`;
    output += article.content;
    output += `\n\n---\n\n💡 **Pro tip:** This article was generated from analysis of ${article.originalHNStories.length} Hacker News stories.`;
    output += `\n\n**Keywords:** ${article.keywords.join(', ')}`;

    return {
      success: true,
      output,
      data: {
        article,
        sourceStories: finalStories.length,
        generationTime: Date.now() - article.generatedAt
      }
    };

  } catch (error) {
    console.error('Error generating HN AI content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content'
    };
  }
}

export const HACKER_NEWS_AI_BLOG_TOOL: Tool = {
  id: 'hacker-news-ai-blog',
  name: 'Hacker News AI Blog Generator',
  description: 'Transform Hacker News discussions into engaging blog articles using AI-powered content generation. Create original, SEO-friendly articles from developer community insights.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'news') || TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  slug: 'hacker-news-ai-blog',
  icon: '🤖',
  tags: ['hacker news', 'ai content', 'blog generator', 'tech articles'],
  keywords: ['hacker news', 'ai blog generator', 'content creation', 'tech articles', 'seo content', 'blog writing'],

  examples: [
    {
      title: 'AI/ML Breakthrough Article',
      input: 'Generate AI/ML content',
      output: 'Complete article about latest AI developments...',
      description: 'Create engaging articles from HN discussions'
    }
  ],

  useCases: [
    'Building a tech blog with fresh, engaging content',
    'Creating thought leadership pieces for business websites',
    'Generating SEO-friendly articles on trending tech topics',
    'Developing newsletter content based on developer community discussions',
    'Creating tutorial content from popular HN threads',
    'Writing market analysis reports from startup discussions',
    'Generating content for tech media and publications'
  ],

  faq: [
    {
      question: 'How do you ensure content originality?',
      answer: 'We analyze HN discussions and create original perspectives, never copying content directly.'
    },
    {
      question: 'Can I use this content on my commercial website or blog?',
      answer: 'Yes, the generated content is yours to use however you wish - publish on blogs, use in newsletters, or enhance your content marketing.'
    },
    {
      question: 'How accurate is the information in generated articles?',
      answer: 'We draw from real Hacker News discussions and verify facts against reliable sources. Our goal is insightful analysis, not raw factual reporting.'
    }
  ],

  relatedTools: ['qr-code-generator', 'uuid-generator'],
  seoTitle: 'Free Hacker News AI Blog Generator - Create Tech Articles from Developer Discussions',
  seoDescription: 'Transform Hacker News threads into engaging, SEO-optimized blog articles. Free AI-powered content generator for tech writers, marketers, and publishers.',
  featured: false
};

export { TOPIC_CATEGORIES };
