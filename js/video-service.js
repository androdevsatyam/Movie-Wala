/**
 * Video Service
 * Responsible for fetching and parsing video metadata from assets/data/videos.json.
 */

const VideoService = {
  /**
   * Path to the local JSON file containing video metadata.
   * Using relative path to support arbitrary GitHub Pages sub-path deployments.
   */
  DATA_URL: './assets/data/videos.json',

  /**
   * Asynchronously loads and validates video items from the JSON file.
   * @returns {Promise<Array<{name: string, picture: string, file_id: string}>>}
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
        .map((item) => ({
          name: (item.name || 'Untitled Video').trim(),
          picture: (item.picture || 'assets/images/placeholder.svg').trim(),
          file_id: (item.file_id || '').trim()
        }))
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

