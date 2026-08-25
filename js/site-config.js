/**
 * MovieWala - Centralized Site Configuration & SEO Utilities
 * 
 * Provides unified base URL resolution, metadata defaults, slug generators,
 * canonical link builders, and structured data (JSON-LD) generators.
 */

const SITE_CONFIG = {
  siteName: "MovieWala",
  tagline: "Your Movie Adda, Anytime.",
  defaultTitle: "MovieWala | Discover & Watch Movies Online",
  defaultDescription: "Discover and stream curated movies and cinema on MovieWala – Your Movie Adda, Anytime. Explore trending films, 4K UHD movies, and full-length cinema with zero buffering.",
  
  // Production Base URL (easily configurable for custom domain or GitHub Pages subpath)
  productionBaseUrl: "https://androdevsatyam.github.io/Movie-Wala",
  defaultImage: "assets/images/logo.svg",
  locale: "en_US",

  /**
   * Resolves the current base URL dynamically for GitHub Pages, custom domain, or local development.
   * @returns {string}
   */
  getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
      return `${window.location.origin}${pathname}`;
    }
    return this.productionBaseUrl;
  },

  /**
   * Generates an SEO-friendly URL-safe slug from a string title.
   * @param {string} title
   * @returns {string}
   */
  generateSlug(title) {
    if (!title) return '';
    return title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')      // Remove special characters
      .replace(/[\s_-]+/g, '-')       // Replace spaces and underscores with single hyphen
      .replace(/^-+|-+$/g, '');       // Trim leading and trailing hyphens
  },

  /**
   * Builds an absolute URL for a given relative path or query parameter.
   * @param {string} pathOrQuery
   * @returns {string}
   */
  getAbsoluteUrl(pathOrQuery = '') {
    const base = this.getBaseUrl();
    if (!pathOrQuery) return base;
    if (pathOrQuery.startsWith('http://') || pathOrQuery.startsWith('https://')) {
      return pathOrQuery;
    }
    if (pathOrQuery.startsWith('?')) {
      return `${base}/${pathOrQuery}`;
    }
    const cleanPath = pathOrQuery.startsWith('/') ? pathOrQuery : `/${pathOrQuery}`;
    return `${base}${cleanPath}`;
  },

  /**
   * Builds an SEO deep-link URL for an individual movie.
   * @param {string} slug
   * @returns {string}
   */
  getMovieUrl(slug) {
    return this.getAbsoluteUrl(`?movie=${encodeURIComponent(slug)}`);
  },

  /**
   * Generates Schema.org JSON-LD structured data for the homepage (WebSite + SearchAction).
   * @returns {Object}
   */
  getWebsiteSchema() {
    const baseUrl = this.getBaseUrl();
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": this.siteName,
      "alternateName": "Movie Wala",
      "description": this.defaultDescription,
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": this.siteName,
        "logo": {
          "@type": "ImageObject",
          "url": this.getAbsoluteUrl(this.defaultImage)
        }
      }
    };
  },

  /**
   * Generates Schema.org JSON-LD structured data for a specific movie (VideoObject & Movie).
   * Only genuine properties that actually exist are included.
   * @param {Object} video
   * @returns {Object}
   */
  getMovieSchema(video) {
    const baseUrl = this.getBaseUrl();
    const movieUrl = this.getMovieUrl(video.slug || this.generateSlug(video.name));
    const imageUrl = this.getAbsoluteUrl(video.picture || this.defaultImage);
    const embedUrl = `https://drive.google.com/file/d/${encodeURIComponent(video.file_id)}/preview`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.name,
      "description": video.description || `Watch ${video.name} in full HD on ${this.siteName} – ${this.tagline}`,
      "thumbnailUrl": [imageUrl],
      "embedUrl": embedUrl,
      "contentUrl": embedUrl,
      "url": movieUrl,
      "publisher": {
        "@type": "Organization",
        "name": this.siteName,
        "logo": {
          "@type": "ImageObject",
          "url": this.getAbsoluteUrl(this.defaultImage)
        }
      }
    };

    if (video.genre) {
      schema.genre = video.genre;
    }
    if (video.language) {
      schema.inLanguage = video.language;
    }
    if (video.year) {
      schema.dateCreated = video.year.toString();
      schema.uploadDate = `${video.year}-01-01T00:00:00+00:00`;
    }

    return schema;
  }
};

// Export to global scope
window.SITE_CONFIG = SITE_CONFIG;

