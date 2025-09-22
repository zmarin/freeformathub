export interface CDNPackage {
  name: string;
  description: string;
  version: string;
  tags: string[];
  urls: {
    js?: string;
    css?: string;
    esm?: string;
  };
  dependencies?: string[];
  size?: {
    gzipped: number;
    uncompressed: number;
  };
  popularity: number;
  documentation?: string;
  repository?: string;
  license?: string;
}

export interface PackageSearchResult {
  packages: CDNPackage[];
  totalCount: number;
  searchTime: number;
}

export interface CDNProvider {
  name: string;
  baseUrl: string;
  searchEndpoint?: string;
  formatUrl: (packageName: string, version?: string, file?: string) => string;
}

// Popular CDN providers
export const CDN_PROVIDERS: CDNProvider[] = [
  {
    name: 'jsDelivr',
    baseUrl: 'https://cdn.jsdelivr.net',
    searchEndpoint: 'https://data.jsdelivr.com/v1/packages',
    formatUrl: (packageName, version = 'latest', file) => {
      const baseUrl = `https://cdn.jsdelivr.net/npm/${packageName}@${version}`;
      return file ? `${baseUrl}/${file}` : `${baseUrl}`;
    }
  },
  {
    name: 'unpkg',
    baseUrl: 'https://unpkg.com',
    formatUrl: (packageName, version = 'latest', file) => {
      const baseUrl = `https://unpkg.com/${packageName}@${version}`;
      return file ? `${baseUrl}/${file}` : `${baseUrl}`;
    }
  },
  {
    name: 'cdnjs',
    baseUrl: 'https://cdnjs.cloudflare.com',
    searchEndpoint: 'https://api.cdnjs.com/libraries',
    formatUrl: (packageName, version, file) => {
      return `https://cdnjs.cloudflare.com/ajax/libs/${packageName}/${version}/${file}`;
    }
  }
];

// Popular packages database
export const POPULAR_PACKAGES: CDNPackage[] = [
  // JavaScript Libraries
  {
    name: 'react',
    description: 'A JavaScript library for building user interfaces',
    version: '18.2.0',
    tags: ['ui', 'framework', 'component'],
    urls: {
      js: 'https://unpkg.com/react@18.2.0/umd/react.development.js',
      esm: 'https://unpkg.com/react@18.2.0/index.js'
    },
    popularity: 100,
    documentation: 'https://reactjs.org/docs',
    repository: 'https://github.com/facebook/react',
    license: 'MIT'
  },
  {
    name: 'react-dom',
    description: 'React package for working with the DOM',
    version: '18.2.0',
    tags: ['react', 'dom', 'renderer'],
    urls: {
      js: 'https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js'
    },
    dependencies: ['react'],
    popularity: 95,
    documentation: 'https://reactjs.org/docs',
    repository: 'https://github.com/facebook/react',
    license: 'MIT'
  },
  {
    name: 'vue',
    description: 'The Progressive JavaScript Framework',
    version: '3.3.4',
    tags: ['framework', 'reactive', 'component'],
    urls: {
      js: 'https://unpkg.com/vue@3.3.4/dist/vue.global.js',
      esm: 'https://unpkg.com/vue@3.3.4/dist/vue.esm-browser.js'
    },
    popularity: 90,
    documentation: 'https://vuejs.org/guide/',
    repository: 'https://github.com/vuejs/core',
    license: 'MIT'
  },
  {
    name: 'jquery',
    description: 'JavaScript library for DOM manipulation',
    version: '3.7.1',
    tags: ['dom', 'ajax', 'utility'],
    urls: {
      js: 'https://code.jquery.com/jquery-3.7.1.min.js'
    },
    popularity: 85,
    documentation: 'https://api.jquery.com/',
    repository: 'https://github.com/jquery/jquery',
    license: 'MIT'
  },
  {
    name: 'lodash',
    description: 'A modern JavaScript utility library',
    version: '4.17.21',
    tags: ['utility', 'functional', 'helper'],
    urls: {
      js: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
    },
    popularity: 80,
    documentation: 'https://lodash.com/docs',
    repository: 'https://github.com/lodash/lodash',
    license: 'MIT'
  },
  {
    name: 'three',
    description: 'JavaScript 3D library',
    version: '0.156.1',
    tags: ['3d', 'webgl', 'graphics'],
    urls: {
      js: 'https://threejs.org/build/three.min.js',
      esm: 'https://threejs.org/build/three.module.js'
    },
    popularity: 75,
    documentation: 'https://threejs.org/docs/',
    repository: 'https://github.com/mrdoob/three.js',
    license: 'MIT'
  },
  {
    name: 'd3',
    description: 'Data visualization library',
    version: '7.8.5',
    tags: ['visualization', 'charts', 'svg'],
    urls: {
      js: 'https://d3js.org/d3.v7.min.js',
      esm: 'https://cdn.skypack.dev/d3@7'
    },
    popularity: 70,
    documentation: 'https://d3js.org/',
    repository: 'https://github.com/d3/d3',
    license: 'BSD-3-Clause'
  },
  {
    name: 'chart.js',
    description: 'Simple yet flexible JavaScript charting',
    version: '4.4.0',
    tags: ['charts', 'canvas', 'visualization'],
    urls: {
      js: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
    },
    popularity: 65,
    documentation: 'https://www.chartjs.org/docs/',
    repository: 'https://github.com/chartjs/Chart.js',
    license: 'MIT'
  },
  {
    name: 'gsap',
    description: 'Professional-grade animation library',
    version: '3.12.2',
    tags: ['animation', 'tween', 'timeline'],
    urls: {
      js: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
    },
    popularity: 60,
    documentation: 'https://greensock.com/docs/',
    repository: 'https://github.com/greensock/GSAP',
    license: 'Standard License'
  },
  {
    name: 'anime.js',
    description: 'Lightweight JavaScript animation library',
    version: '3.2.1',
    tags: ['animation', 'css', 'svg'],
    urls: {
      js: 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js'
    },
    popularity: 55,
    documentation: 'https://animejs.com/documentation/',
    repository: 'https://github.com/juliangarnier/anime',
    license: 'MIT'
  },

  // CSS Frameworks
  {
    name: 'bootstrap',
    description: 'The most popular HTML, CSS, and JS library',
    version: '5.3.2',
    tags: ['css', 'framework', 'responsive'],
    urls: {
      css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
      js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
    },
    popularity: 95,
    documentation: 'https://getbootstrap.com/docs/5.3/',
    repository: 'https://github.com/twbs/bootstrap',
    license: 'MIT'
  },
  {
    name: 'tailwindcss',
    description: 'A utility-first CSS framework',
    version: '3.3.5',
    tags: ['css', 'utility', 'framework'],
    urls: {
      css: 'https://cdn.tailwindcss.com'
    },
    popularity: 90,
    documentation: 'https://tailwindcss.com/docs',
    repository: 'https://github.com/tailwindlabs/tailwindcss',
    license: 'MIT'
  },
  {
    name: 'bulma',
    description: 'Modern CSS framework based on Flexbox',
    version: '0.9.4',
    tags: ['css', 'flexbox', 'framework'],
    urls: {
      css: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css'
    },
    popularity: 70,
    documentation: 'https://bulma.io/documentation/',
    repository: 'https://github.com/jgthms/bulma',
    license: 'MIT'
  },
  {
    name: 'foundation',
    description: 'Advanced responsive front-end framework',
    version: '6.7.5',
    tags: ['css', 'responsive', 'framework'],
    urls: {
      css: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.7.5/dist/css/foundation.min.css',
      js: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.7.5/dist/js/foundation.min.js'
    },
    popularity: 60,
    documentation: 'https://get.foundation/sites/docs/',
    repository: 'https://github.com/foundation/foundation-sites',
    license: 'MIT'
  },

  // Icon Libraries
  {
    name: 'font-awesome',
    description: 'The iconic SVG, font, and CSS toolkit',
    version: '6.4.2',
    tags: ['icons', 'fonts', 'svg'],
    urls: {
      css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
    },
    popularity: 85,
    documentation: 'https://fontawesome.com/docs',
    repository: 'https://github.com/FortAwesome/Font-Awesome',
    license: 'Font Awesome Free License'
  },
  {
    name: 'feather-icons',
    description: 'Simply beautiful open source icons',
    version: '4.29.0',
    tags: ['icons', 'svg', 'stroke'],
    urls: {
      js: 'https://unpkg.com/feather-icons@4.29.0/dist/feather.min.js'
    },
    popularity: 65,
    documentation: 'https://feathericons.com/',
    repository: 'https://github.com/feathericons/feather',
    license: 'MIT'
  },

  // Utility Libraries
  {
    name: 'moment',
    description: 'Parse, validate, manipulate, and display dates',
    version: '2.29.4',
    tags: ['date', 'time', 'formatting'],
    urls: {
      js: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js'
    },
    popularity: 75,
    documentation: 'https://momentjs.com/docs/',
    repository: 'https://github.com/moment/moment',
    license: 'MIT'
  },
  {
    name: 'axios',
    description: 'Promise based HTTP client for the browser and node.js',
    version: '1.5.1',
    tags: ['http', 'ajax', 'promise'],
    urls: {
      js: 'https://cdn.jsdelivr.net/npm/axios@1.5.1/dist/axios.min.js'
    },
    popularity: 80,
    documentation: 'https://axios-http.com/docs/intro',
    repository: 'https://github.com/axios/axios',
    license: 'MIT'
  }
];

export class CDNPackageManager {
  private packages: CDNPackage[] = [...POPULAR_PACKAGES];
  private cache: Map<string, PackageSearchResult> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly cacheLifetime = 5 * 60 * 1000; // 5 minutes

  async searchPackages(
    query: string,
    options: {
      limit?: number;
      tags?: string[];
      provider?: string;
      includeUnpopular?: boolean;
    } = {}
  ): Promise<PackageSearchResult> {
    const { limit = 20, tags = [], provider, includeUnpopular = false } = options;
    const cacheKey = `${query}-${JSON.stringify(options)}`;

    // Check cache
    if (this.cache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const startTime = performance.now();

    try {
      let results: CDNPackage[] = [];

      if (query.length === 0) {
        // Return popular packages when no query
        results = this.packages
          .filter(pkg => includeUnpopular || pkg.popularity >= 50)
          .sort((a, b) => b.popularity - a.popularity);
      } else {
        // Search local packages first
        results = this.searchLocalPackages(query, tags, includeUnpopular);

        // If we need more results and have internet access, search CDN
        if (results.length < limit && typeof window !== 'undefined') {
          const remoteResults = await this.searchRemotePackages(query, provider);
          results = [...results, ...remoteResults].slice(0, limit);
        }
      }

      // Apply filters
      if (tags.length > 0) {
        results = results.filter(pkg =>
          tags.some(tag => pkg.tags.includes(tag))
        );
      }

      const searchResult: PackageSearchResult = {
        packages: results.slice(0, limit),
        totalCount: results.length,
        searchTime: performance.now() - startTime
      };

      // Cache result
      this.cache.set(cacheKey, searchResult);
      this.cacheExpiry.set(cacheKey, Date.now() + this.cacheLifetime);

      return searchResult;
    } catch (error) {
      console.warn('Package search failed:', error);
      return {
        packages: [],
        totalCount: 0,
        searchTime: performance.now() - startTime
      };
    }
  }

  private searchLocalPackages(
    query: string,
    tags: string[] = [],
    includeUnpopular: boolean = false
  ): CDNPackage[] {
    const lowerQuery = query.toLowerCase();

    return this.packages
      .filter(pkg => {
        // Popularity filter
        if (!includeUnpopular && pkg.popularity < 50) return false;

        // Text search
        const matchesName = pkg.name.toLowerCase().includes(lowerQuery);
        const matchesDescription = pkg.description.toLowerCase().includes(lowerQuery);
        const matchesTags = pkg.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

        return matchesName || matchesDescription || matchesTags;
      })
      .sort((a, b) => {
        // Prioritize exact name matches
        const aExact = a.name.toLowerCase() === lowerQuery ? 1 : 0;
        const bExact = b.name.toLowerCase() === lowerQuery ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Then by name start matches
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Finally by popularity
        return b.popularity - a.popularity;
      });
  }

  private async searchRemotePackages(
    query: string,
    provider?: string
  ): Promise<CDNPackage[]> {
    const targetProvider = provider
      ? CDN_PROVIDERS.find(p => p.name === provider)
      : CDN_PROVIDERS[0]; // Default to jsDelivr

    if (!targetProvider?.searchEndpoint) {
      return [];
    }

    try {
      const response = await fetch(
        `${targetProvider.searchEndpoint}?name=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseRemoteResults(data, targetProvider);
    } catch (error) {
      console.warn('Remote package search failed:', error);
      return [];
    }
  }

  private parseRemoteResults(data: any, provider: CDNProvider): CDNPackage[] {
    // This would need to be customized for each CDN provider's API format
    if (provider.name === 'jsDelivr') {
      return (data.packages || []).map((pkg: any) => ({
        name: pkg.name,
        description: pkg.description || '',
        version: pkg.version || 'latest',
        tags: pkg.keywords || [],
        urls: {
          js: provider.formatUrl(pkg.name, pkg.version, pkg.mainFile),
        },
        popularity: Math.floor(Math.random() * 50) + 25, // Estimated
        repository: pkg.repository,
        license: pkg.license
      }));
    }

    return [];
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  getPackageByName(name: string): CDNPackage | null {
    return this.packages.find(pkg => pkg.name === name) || null;
  }

  getPopularPackages(limit: number = 10): CDNPackage[] {
    return this.packages
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  getPackagesByTag(tag: string): CDNPackage[] {
    return this.packages.filter(pkg => pkg.tags.includes(tag));
  }

  generateImportCode(pkg: CDNPackage, type: 'script' | 'link' | 'import' = 'script'): string {
    switch (type) {
      case 'script':
        if (pkg.urls.js) {
          return `<script src="${pkg.urls.js}"></script>`;
        }
        break;
      case 'link':
        if (pkg.urls.css) {
          return `<link rel="stylesheet" href="${pkg.urls.css}">`;
        }
        break;
      case 'import':
        if (pkg.urls.esm) {
          return `import * as ${pkg.name.replace(/[^a-zA-Z0-9]/g, '')} from '${pkg.urls.esm}';`;
        } else if (pkg.urls.js) {
          return `// Note: This package may not support ES modules\n// <script src="${pkg.urls.js}"></script>`;
        }
        break;
    }
    return '// Package URL not available for this type';
  }

  addCustomPackage(pkg: CDNPackage): void {
    const existingIndex = this.packages.findIndex(p => p.name === pkg.name);
    if (existingIndex >= 0) {
      this.packages[existingIndex] = pkg;
    } else {
      this.packages.push(pkg);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getAvailableTags(): string[] {
    const tags = new Set<string>();
    this.packages.forEach(pkg => {
      pkg.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
}

export default CDNPackageManager;