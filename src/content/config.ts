import { defineCollection, z } from 'astro:content';

// Tool metadata collection for enhanced content management
const toolsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    category: z.string(),
    name: z.string(),
    description: z.string(),
    tools: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      slug: z.string(),
      icon: z.string(),
      keywords: z.array(z.string()),
      examples: z.array(z.object({
        title: z.string(),
        input: z.string(),
        output: z.string(),
        description: z.string().optional()
      })),
      useCases: z.array(z.string()),
      commonErrors: z.array(z.string()),
      faq: z.array(z.object({
        question: z.string(),
        answer: z.string()
      })),
      relatedTools: z.array(z.string()),
      seoTitle: z.string(),
      seoDescription: z.string(),
      featured: z.boolean().optional().default(false),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
      tags: z.array(z.string()).optional().default([])
    }))
  })
});

// Educational tutorials collection
const tutorialsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    author: z.string().optional().default('FreeFormatHub Team'),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    readTime: z.number().optional(), // minutes
    relatedTools: z.array(z.string()).optional().default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    ogImage: z.string().optional()
  })
});

// How-to guides collection
const guidesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    author: z.string().optional().default('FreeFormatHub Team'),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    readTime: z.number().optional(), // minutes
    relatedTools: z.array(z.string()).optional().default([]),
    prerequisites: z.array(z.string()).optional().default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    ogImage: z.string().optional()
  })
});

// FAQ collection for common questions
const faqCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string().optional(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    featured: z.boolean().optional().default(false),
    relatedTools: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  })
});

// Category metadata collection
const categoriesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.string(),
    featured: z.boolean().optional().default(false),
    order: z.number().optional().default(0),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    ogImage: z.string().optional(),
    introText: z.string().optional(),
    benefits: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional()
    })).optional().default([]),
    commonUseCases: z.array(z.string()).optional().default([]),
    relatedCategories: z.array(z.string()).optional().default([])
  })
});

// Blog posts collection for announcements and updates
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    author: z.string().optional().default('FreeFormatHub Team'),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
    readTime: z.number().optional(), // minutes
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    ogImage: z.string().optional(),
    category: z.string().optional()
  })
});

export const collections = {
  'tools': toolsCollection,
  'tutorials': tutorialsCollection,
  'guides': guidesCollection,
  'faq': faqCollection,
  'categories': categoriesCollection,
  'blog': blogCollection
};