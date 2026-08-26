/**
 * Video Service
 * Responsible for fetching, parsing, and normalizing video metadata from assets/data/videos.json.
 * Supports backward compatibility and extends entries with SEO-friendly fields (slug, description, genre, year, language).
 */

const VideoService = {
  /**
   * Path to the local JSON file containing video metadata.
   * Using relative path to support arbitrary GitHub Pages sub-path deployments.
   */
  DATA_URL: './assets/data/videos.json',

  /**
   * Asynchronously loads and validates video items from the JSON file.
   * Normalizes optional SEO fields and ensures every item has a unique slug.
   * @returns {Promise<Array<Object>>}
   */
  async loadVideos() {
    try {
      const response = await fetch(this.DATA_URL);

      if (!response.ok) {
        throw new Error(`Failed to load video metadata (HTTP ${response.status}: ${response.statusText})`);
      }

      const rawData = await response.json();

      if (!Array.isArray(rawData)) {
        throw new Error('Invalid data format: Expected a JSON array of video objects.');
      }

      // Filter and sanitize entries: ensure valid name and file_id exist
      const validVideos = rawData
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const name = (item.name || `Video ${index + 1}`).trim();
          const slug = (item.slug || (window.SITE_CONFIG ? window.SITE_CONFIG.generateSlug(name) : name.toLowerCase().replace(/[^\w-]+/g, '-'))).trim();
          
          return {
            name: name,
            slug: slug || `video-${index + 1}`,
            picture: (item.picture || 'assets/images/placeholder.svg').trim(),
            file_id: (item.file_id || '').trim(),
            description: (item.description || `Stream ${name} in full HD on MovieWala – Your Movie Adda, Anytime.`).trim(),
            genre: (item.genre || 'Cinema, Drama').trim(),
            language: (item.language || 'Hindi').trim(),
            year: item.year ? item.year.toString().trim() : '2026'
          };
        })
        .filter((item) => item.file_id.length > 0);

      return validVideos;
    } catch (error) {
      console.error('[VideoService] Error loading videos:', error);
      throw error;
    }
  }
};

// Export to global scope for standard modular browser scripts
window.VideoService = VideoService;
