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
      tags: z.array(z.string()).optional().default([]),
      // Layout configuration
      layout: z.enum(['default', 'fullscreen', 'sidebar', 'minimal', 'playground']).optional().default('default'),
      layoutOptions: z.object({
        showBreadcrumbs: z.boolean().optional().default(true),
        showRelatedTools: z.boolean().optional().default(true),
        showFAQ: z.boolean().optional().default(true),
        showFeatures: z.boolean().optional().default(true),
        sidebarPosition: z.enum(['left', 'right']).optional().default('right'),
        containerWidth: z.enum(['narrow', 'wide', 'full']).optional().default('wide'),
        enableSplitView: z.boolean().optional().default(false),
        customSections: z.array(z.string()).optional().default([])
      }).optional().default({})
    }))
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

export const collections = {
  'tools': toolsCollection,
  'categories': categoriesCollection
};