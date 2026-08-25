/**
 * Main Application Orchestrator
 * High-End OTT Video Streaming Platform with Instant Live Search & Filter
 */

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    videos: [],
    filteredVideos: [],
    activeCategory: 'all',
    searchQuery: '',

    // DOM Element References
    elements: {
      // Slider Elements
      sliderContainer: document.getElementById('heroSlider'),
      sliderTrack: document.getElementById('sliderTrack'),
      sliderPrev: document.getElementById('sliderPrev'),
      sliderNext: document.getElementById('sliderNext'),
      sliderPagination: document.getElementById('sliderPagination'),

      // Player Section Elements
      playerSection: document.getElementById('playerSection'),
      playerContainer: document.getElementById('playerContainer'),
      playerIframeWrapper: document.getElementById('playerIframeWrapper'),
      playerAmbientGlow: document.getElementById('playerAmbientGlow'),
      playerPlaceholder: document.getElementById('playerPlaceholder'),
      playerBufferLoader: document.getElementById('playerBufferLoader'),
      videoTitle: document.getElementById('videoTitle'),
      nowPlayingBadge: document.getElementById('nowPlayingBadge'),
      btnFullscreen: document.getElementById('btnFullscreen'),
      btnShare: document.getElementById('btnShare'),
      btnNext: document.getElementById('btnNext'),
      btnClosePlayer: document.getElementById('btnClosePlayer'),

      // Gallery & Filters
      galleryHeading: document.getElementById('galleryHeading'),
      galleryGrid: document.getElementById('galleryGrid'),
      galleryCount: document.getElementById('galleryCount'),
      categoryPills: document.querySelectorAll('.category-pill'),
      loadingState: document.getElementById('loadingState'),
      emptyState: document.getElementById('emptyState'),
      errorState: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage'),
      retryButton: document.getElementById('retryButton'),

      // Search & Toast
      searchBox: document.querySelector('.search-box'),
      searchInput: document.getElementById('searchInput'),
      searchClear: document.getElementById('searchClear'),
      searchDropdown: document.getElementById('searchDropdown'),
      toastContainer: document.getElementById('toastContainer')
    },

    /**
     * Initializes the application.
     */
    async init() {
      window.App = this;

      // Initialize VideoPlayer with complete DOM hooks
      VideoPlayer.init(
        {
          section: this.elements.playerSection,
          container: this.elements.playerContainer,
          iframeWrapper: this.elements.playerIframeWrapper,
          ambientGlow: this.elements.playerAmbientGlow,
          placeholder: this.elements.playerPlaceholder,
          bufferLoader: this.elements.bufferLoader,
          title: this.elements.videoTitle,
          nowPlayingBadge: this.elements.nowPlayingBadge,
          btnFullscreen: this.elements.btnFullscreen,
          btnShare: this.elements.btnShare,
          btnNext: this.elements.btnNext,
          btnClose: this.elements.btnClosePlayer
        },
        () => this.playNextVideo()
      );

      this.bindEvents();
      await this.fetchAndRenderVideos();
    },

    /**
     * Binds global UI event listeners.
     */
    bindEvents() {
      // Retry button handler
      if (this.elements.retryButton) {
        this.elements.retryButton.addEventListener('click', () => {
          this.fetchAndRenderVideos();
        });
      }

      // Live Search Input Handlers (input, keydown, search, focus)
      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener('input', (e) => {
          this.handleSearch(e.target.value);
        });

        this.elements.searchInput.addEventListener('focus', () => {
          if (this.elements.searchInput.value.trim().length > 0) {
            this.showSearchDropdown();
          }
        });

        this.elements.searchInput.addEventListener('search', (e) => {
          this.handleSearch(e.target.value);
        });

        this.elements.searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            this.hideSearchDropdown();
            this.elements.searchInput.blur();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            this.hideSearchDropdown();
            // When Enter is pressed, focus the matching video in the hero slider
            if (this.filteredVideos.length > 0) {
              const matchedVideo = this.filteredVideos[0];
              const originalIndex = this.videos.findIndex((v) => v.file_id === matchedVideo.file_id);
              const targetIdx = originalIndex >= 0 ? originalIndex : 0;
              MaterialSlider.focusSlide(targetIdx);
              this.showToast(`Focused in highlights: ${matchedVideo.name}`);
            }
          }
        });
      }

      // Clear search button handler
      if (this.elements.searchClear) {
        this.elements.searchClear.addEventListener('click', () => {
          if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.handleSearch('');
            this.elements.searchInput.focus();
          }
        });
      }

      // Close search dropdown on click outside
      document.addEventListener('click', (e) => {
        if (this.elements.searchBox && !this.elements.searchBox.contains(e.target)) {
          this.hideSearchDropdown();
        }
      });

      // Category filter pills handler
      if (this.elements.categoryPills) {
        this.elements.categoryPills.forEach((pill) => {
          pill.addEventListener('click', () => {
            this.elements.categoryPills.forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            this.activeCategory = pill.dataset.category || 'all';
            this.applyFilters();
          });
        });
      }
    },

    /**
     * Loads videos from VideoService and handles UI state transitions.
     */
    async fetchAndRenderVideos() {
      this.showState('loading');

      try {
        const videos = await VideoService.loadVideos();
        this.videos = videos;
        this.filteredVideos = [...videos];

        if (this.videos.length === 0) {
          this.showState('empty');
          VideoPlayer.showPlaceholder();
          return;
        }

        this.showState('content');

        // 1. Initialize Material Hero Carousel Slider with loaded videos
        MaterialSlider.init(
          {
            container: this.elements.sliderContainer,
            track: this.elements.sliderTrack,
            prevBtn: this.elements.sliderPrev,
            nextBtn: this.elements.sliderNext,
            pagination: this.elements.sliderPagination
          },
          this.videos,
          (selectedVideo, index) => {
            this.selectAndPlayVideo(selectedVideo, index);
          }
        );

        // 2. Render Catalog Cards
        this.renderGallery(this.filteredVideos);

        // 3. User choice by default (Placeholder state on start)
        VideoPlayer.showPlaceholder();

      } catch (error) {
        this.showState('error', error.message || 'Unable to load video catalog. Please try again later.');
        VideoPlayer.showPlaceholder();
      }
    },

    /**
     * Handles selecting and completely re-initiating the video player.
     * @param {Object} video
     * @param {number} index
     */
    selectAndPlayVideo(video, index) {
      VideoPlayer.reinitPlayer(video, index, this.videos.length);
      this.showToast(`Now Streaming: ${video.name}`);
      this.hideSearchDropdown();
    },

    /**
     * Advances to and plays the next video in queue.
     */
    playNextVideo() {
      if (this.videos.length === 0) return;
      const nextIdx = (VideoPlayer.currentIndex + 1) % this.videos.length;
      this.selectAndPlayVideo(this.videos[nextIdx], nextIdx);
    },

    /**
     * Applies search query and category filters in real-time.
     */
    applyFilters() {
      const rawQuery = this.elements.searchInput ? this.elements.searchInput.value : '';
      this.searchQuery = rawQuery.trim();

      const searchWords = this.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

      let results = [...this.videos];

      // Multi-word case-insensitive matching
      if (searchWords.length > 0) {
        results = results.filter((video) => {
          const title = (video.name || '').toLowerCase();
          return searchWords.every((word) => title.includes(word));
        });
      }

      this.filteredVideos = results;

      // When searching is active: Hide Hero Slider & Switch to Vertical List Layout
      if (this.searchQuery) {
        if (this.elements.sliderContainer) {
          this.elements.sliderContainer.classList.add('hidden');
        }
        if (this.elements.galleryGrid) {
          this.elements.galleryGrid.classList.add('vertical-list-mode');
        }
      } else {
        if (this.elements.sliderContainer) {
          this.elements.sliderContainer.classList.remove('hidden');
        }
        if (this.elements.galleryGrid) {
          this.elements.galleryGrid.classList.remove('vertical-list-mode');
        }
      }

      // Update Section Heading
      if (this.elements.galleryHeading) {
        if (this.searchQuery) {
          this.elements.galleryHeading.textContent = `Search Results for "${this.searchQuery}"`;
        } else if (this.activeCategory === 'trending') {
          this.elements.galleryHeading.textContent = 'Trending Titles';
        } else if (this.activeCategory === 'movies') {
          this.elements.galleryHeading.textContent = 'Movies & Films';
        } else if (this.activeCategory === '4k') {
          this.elements.galleryHeading.textContent = '4K Ultra HD Cinema';
        } else {
          this.elements.galleryHeading.textContent = 'Catalog Library';
        }
      }

      // Update Live Search Dropdown
      this.renderSearchDropdown(results, this.searchQuery);

      if (this.filteredVideos.length === 0) {
        this.showState('empty');
      } else {
        this.showState('content');
        this.renderGallery(this.filteredVideos, this.searchQuery);
      }
    },

    /**
     * Handles live search input changes.
     * @param {string} query
     */
    handleSearch(query) {
      const trimmed = (query || '').trim();

      if (this.elements.searchClear) {
        this.elements.searchClear.style.display = trimmed ? 'flex' : 'none';
      }

      this.applyFilters();

      if (trimmed) {
        this.showSearchDropdown();
      } else {
        this.hideSearchDropdown();
      }
    },

    /**
     * Shows search dropdown.
     */
    showSearchDropdown() {
      if (this.elements.searchDropdown && this.elements.searchInput.value.trim()) {
        this.elements.searchDropdown.classList.remove('hidden');
      }
    },

    /**
     * Hides search dropdown.
     */
    hideSearchDropdown() {
      if (this.elements.searchDropdown) {
        this.elements.searchDropdown.classList.add('hidden');
      }
    },

    /**
     * Renders matching results inside the live header search dropdown.
     * @param {Array<Object>} matches
     * @param {string} query
     */
    renderSearchDropdown(matches, query) {
      if (!this.elements.searchDropdown) return;

      if (!query) {
        this.elements.searchDropdown.innerHTML = '';
        this.hideSearchDropdown();
        return;
      }

      this.elements.searchDropdown.innerHTML = '';

      if (matches.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'dropdown-empty';
        emptyItem.innerHTML = `
          <span>No matching titles for "<strong>${this.escapeHtml(query)}</strong>"</span>
        `;
        this.elements.searchDropdown.appendChild(emptyItem);
        return;
      }

      const headerItem = document.createElement('div');
      headerItem.className = 'dropdown-header';
      headerItem.textContent = `${matches.length} ${matches.length === 1 ? 'Match Found' : 'Matches Found'} • Click to Play`;
      this.elements.searchDropdown.appendChild(headerItem);

      matches.forEach((video, idx) => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.setAttribute('role', 'option');
        item.setAttribute('tabindex', '0');

        item.innerHTML = `
          <div class="dropdown-thumb-wrap">
            <img 
              src="${video.picture}" 
              alt="${video.name}" 
              class="dropdown-thumb"
              onerror="this.onerror=null;this.src='assets/images/placeholder.svg';"
            />
          </div>
          <div class="dropdown-info">
            <div class="dropdown-title">${this.highlightMatch(video.name, query)}</div>
            <span class="dropdown-tag">HD Stream</span>
          </div>
          <div class="dropdown-play-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        `;

        const playAction = () => {
          const originalIndex = this.videos.findIndex((v) => v.file_id === video.file_id);
          this.selectAndPlayVideo(video, originalIndex >= 0 ? originalIndex : idx);
        };

        item.addEventListener('click', playAction);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            playAction();
          }
        });

        this.elements.searchDropdown.appendChild(item);
      });
    },

    /**
     * Highlights matched search query terms inside title string.
     * @param {string} text
     * @param {string} query
     * @returns {string}
     */
    highlightMatch(text, query) {
      if (!query) return this.escapeHtml(text);

      const words = query.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return this.escapeHtml(text);

      // Create regex for all words
      const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');

      return this.escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    },

    /**
     * Escapes HTML characters.
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m]);
    },

    /**
     * Manages view states: 'loading', 'empty', 'error', 'content'.
     * @param {'loading'|'empty'|'error'|'content'} state
     * @param {string} [customErrorMessage]
     */
    showState(state, customErrorMessage = '') {
      if (this.elements.loadingState) {
        this.elements.loadingState.classList.toggle('hidden', state !== 'loading');
      }
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.toggle('hidden', state !== 'empty');
      }
      if (this.elements.errorState) {
        this.elements.errorState.classList.toggle('hidden', state !== 'error');
        if (state === 'error' && this.elements.errorMessage) {
          this.elements.errorMessage.textContent = customErrorMessage || 'Unable to load videos. Please try again later.';
        }
      }
      if (this.elements.galleryGrid) {
        this.elements.galleryGrid.classList.toggle('hidden', state !== 'content');
      }
    },

    /**
     * Renders high-end OTT video cards into the gallery grid.
     * @param {Array<Object>} videoList
     * @param {string} [query]
     */
    renderGallery(videoList, query = '') {
      if (!this.elements.galleryGrid) return;

      this.elements.galleryGrid.innerHTML = '';

      if (this.elements.galleryCount) {
        this.elements.galleryCount.textContent = `${videoList.length} ${videoList.length === 1 ? 'Title' : 'Titles'}`;
      }

      videoList.forEach((video, index) => {
        const card = this.createVideoCard(video, index, videoList.length, query);
        this.elements.galleryGrid.appendChild(card);
      });

      if (VideoPlayer.currentVideo) {
        VideoPlayer.updateActiveCardUI(VideoPlayer.currentVideo.file_id);
      }
    },

    /**
     * Creates an accessible, high-end OTT video card DOM node.
     * @param {Object} video
     * @param {number} index
     * @param {number} total
     * @param {string} [query]
     * @returns {HTMLElement}
     */
    createVideoCard(video, index, total, query = '') {
      const card = document.createElement('article');
      card.className = 'video-card';
      card.dataset.fileId = video.file_id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Stream ${video.name}`);

      // Thumbnail wrapper with 16:9 cinema aspect ratio
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = 'card-thumbnail-wrapper';

      const img = document.createElement('img');
      img.className = 'card-thumbnail';
      img.src = video.picture;
      img.alt = video.name;
      img.loading = 'lazy';
      img.onerror = () => {
        img.onerror = null;
        img.src = 'assets/images/placeholder.svg';
      };

      // Top Chips Row
      const topBadges = document.createElement('div');
      topBadges.className = 'card-top-badges';
      topBadges.innerHTML = `
        <span class="card-match-tag">★ 9.4</span>
        <span class="card-quality-tag">4K UHD</span>
      `;

      // Play Overlay with Neon Glow & Circle
      const playOverlay = document.createElement('div');
      playOverlay.className = 'card-play-overlay';
      playOverlay.innerHTML = `
        <div class="play-btn-circle">
          <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      `;

      // Live "Now Playing" Indicator
      const nowPlayingIndicator = document.createElement('div');
      nowPlayingIndicator.className = 'now-playing-indicator';
      nowPlayingIndicator.innerHTML = `
        <span class="pulse-dot"></span>
        <span>Streaming</span>
      `;

      thumbnailContainer.appendChild(img);
      thumbnailContainer.appendChild(topBadges);
      thumbnailContainer.appendChild(playOverlay);
      thumbnailContainer.appendChild(nowPlayingIndicator);

      // Card Information (Title & Stream Action row)
      const infoContainer = document.createElement('div');
      infoContainer.className = 'card-info';

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.innerHTML = query ? this.highlightMatch(video.name, query) : this.escapeHtml(video.name);
      title.title = video.name;

      const footer = document.createElement('div');
      footer.className = 'card-footer';
      footer.innerHTML = `
        <span class="card-action">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Stream Now
        </span>
        <span class="card-badge">HD</span>
      `;

      infoContainer.appendChild(title);
      infoContainer.appendChild(footer);

      card.appendChild(thumbnailContainer);
      card.appendChild(infoContainer);

      // Selection trigger: Click or Keyboard (Enter / Space)
      const selectVideoAction = () => {
        const originalIndex = this.videos.findIndex((v) => v.file_id === video.file_id);
        this.selectAndPlayVideo(video, originalIndex >= 0 ? originalIndex : index);
      };

      card.addEventListener('click', selectVideoAction);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectVideoAction();
        }
      });

      return card;
    },

    /**
     * Displays a floating toast notification.
     * @param {string} message
     */
    showToast(message) {
      if (!this.elements.toastContainer) return;

      const toast = document.createElement('div');
      toast.className = 'app-toast';
      toast.textContent = message;

      this.elements.toastContainer.appendChild(toast);

      // Auto fade out
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
      }, 2600);
    }
  };

  App.init();
});
