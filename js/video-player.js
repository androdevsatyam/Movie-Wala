/**
 * High-End OTT Video Player Controller
 * Responsible for complete player re-initiation, DOM iframe re-creation,
 * streaming buffer management, ambient glow illumination, and cinema toolbar actions.
 */

const VideoPlayer = {
  elements: {
    section: null,
    container: null,
    iframeWrapper: null,
    ambientGlow: null,
    title: null,
    metaPills: null,
    nowPlayingBadge: null,
    placeholder: null,
    bufferLoader: null,
    btnFullscreen: null,
    btnShare: null,
    btnNext: null,
    btnClose: null
  },

  currentVideo: null,
  currentIndex: -1,
  totalVideos: 0,
  onNextCallback: null,

  /**
   * Initializes player elements and event handlers.
   * @param {Object} domElements
   * @param {Function} [onNext]
   */
  init(domElements, onNext) {
    this.elements = { ...this.elements, ...domElements };
    this.onNextCallback = onNext;
    this.bindToolbarEvents();
    this.hidePlayerSection();
  },

  /**
   * Binds cinema player toolbar buttons.
   */
  bindToolbarEvents() {
    // Fullscreen toggle
    if (this.elements.btnFullscreen) {
      this.elements.btnFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Share link button
    if (this.elements.btnShare) {
      this.elements.btnShare.addEventListener('click', () => {
        this.shareCurrentVideo();
      });
    }

    // Next video button
    if (this.elements.btnNext) {
      this.elements.btnNext.addEventListener('click', () => {
        if (typeof this.onNextCallback === 'function') {
          this.onNextCallback();
        }
      });
    }

    // Close Player button (collapses player back to home screen browse mode)
    if (this.elements.btnClose) {
      this.elements.btnClose.addEventListener('click', () => {
        this.closePlayer();
      });
    }
  },

  /**
   * Generates a preview URL using the public file_id.
   * @param {string} fileId
   * @returns {string}
   */
  getVideoPreviewUrl(fileId) {
    if (!fileId) return '';
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  },

  getGoogleDrivePreviewUrl(fileId) {
    return this.getVideoPreviewUrl(fileId);
  },

  /**
   * Completely RE-INITIATES the Video Player with a selected video.
   * Unhides player section, destroys existing iframe, and freshly creates
   * a new DOM iframe element to guarantee fresh playback and instant responsiveness.
   * 
   * @param {Object} video - Video object { name, picture, file_id }
   * @param {number} [index] - Current video index
   * @param {number} [total] - Total videos in playlist
   */
  reinitPlayer(video, index = 0, total = 0) {
    if (!video || !video.file_id) {
      console.warn('[VideoPlayer] Invalid video passed to reinitPlayer:', video);
      this.hidePlayerSection();
      return;
    }

    this.currentVideo = video;
    this.currentIndex = index;
    this.totalVideos = total;

    const previewUrl = this.getVideoPreviewUrl(video.file_id);

    // 1. Unhide and display the player section dynamically
    if (this.elements.section) {
      this.elements.section.classList.remove('hidden');
    }

    // 2. Hide placeholder if present
    if (this.elements.placeholder) {
      this.elements.placeholder.classList.add('hidden');
    }

    // 3. Activate ambient glow
    if (this.elements.ambientGlow) {
      this.elements.ambientGlow.classList.add('active');
    }

    // 4. Update Video Title & Streaming Metadata
    if (this.elements.title) {
      this.elements.title.textContent = video.name;
    }

    if (this.elements.nowPlayingBadge) {
      this.elements.nowPlayingBadge.style.display = 'inline-flex';
      this.elements.nowPlayingBadge.textContent = total > 0 ? `Streaming • #${index + 1} of ${total}` : 'Streaming Now';
    }

    // 5. Show streaming buffer loader while new iframe connects
    if (this.elements.bufferLoader) {
      this.elements.bufferLoader.classList.remove('hidden');
    }

    // 6. Completely Re-create the <iframe> in the DOM
    if (this.elements.iframeWrapper) {
      this.elements.iframeWrapper.innerHTML = '';

      const newIframe = document.createElement('iframe');
      newIframe.id = 'videoPlayer';
      newIframe.className = 'active-stream-frame';
      newIframe.title = video.name || 'Video Player';
      newIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
      newIframe.setAttribute('allowfullscreen', 'true');
      newIframe.src = previewUrl;

      newIframe.addEventListener('load', () => {
        if (this.elements.bufferLoader) {
          this.elements.bufferLoader.classList.add('hidden');
        }
      });

      this.elements.iframeWrapper.appendChild(newIframe);
    }

    // 7. Highlight active card across gallery and slider
    this.updateActiveCardUI(video.file_id);

    // 8. Smoothly scroll player into view
    if (this.elements.section) {
      const offsetTop = this.elements.section.getBoundingClientRect().top + window.pageYOffset - 75;
      window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
    }
  },

  /**
   * Alias for reinitPlayer.
   */
  playVideo(video, index = 0, total = 0) {
    this.reinitPlayer(video, index, total);
  },

  /**
   * Closes and hides the player section, restoring clean home screen layout.
   */
  closePlayer() {
    this.currentVideo = null;
    this.currentIndex = -1;

    if (this.elements.iframeWrapper) {
      this.elements.iframeWrapper.innerHTML = '';
    }
    if (this.elements.bufferLoader) {
      this.elements.bufferLoader.classList.add('hidden');
    }
    if (this.elements.ambientGlow) {
      this.elements.ambientGlow.classList.remove('active');
    }
    if (this.elements.section) {
      this.elements.section.classList.add('hidden');
    }

    // Clear active highlights
    const cards = document.querySelectorAll('.video-card, .material-slide');
    cards.forEach((card) => {
      card.classList.remove('active');
      card.setAttribute('aria-selected', 'false');
    });

    if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast('Player closed');
    }
  },

  /**
   * Hides the player section on start.
   */
  hidePlayerSection() {
    if (this.elements.section) {
      this.elements.section.classList.add('hidden');
    }
    if (this.elements.iframeWrapper) {
      this.elements.iframeWrapper.innerHTML = '';
    }
  },

  /**
   * Backward compatibility placeholder method.
   */
  showPlaceholder() {
    this.hidePlayerSection();
  },

  /**
   * Toggles Fullscreen for the player container.
   */
  toggleFullscreen() {
    const target = this.elements.container || this.elements.section;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  },

  /**
   * Shares current video URL.
   */
  shareCurrentVideo() {
    if (!this.currentVideo) return;

    const url = window.location.href.split('?')[0] + `?v=${this.currentIndex}`;
    const shareData = {
      title: `Watch ${this.currentVideo.name} on MovieWala`,
      text: `Stream "${this.currentVideo.name}" in HD on MovieWala`,
      url: url
    };

    if (navigator.share && window.isSecureContext) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast('Link copied to clipboard! 📋');
        }
      });
    }
  },

  /**
   * Updates visual active states on video cards in the DOM.
   * @param {string} fileId
   */
  updateActiveCardUI(fileId) {
    const cards = document.querySelectorAll('.video-card, .material-slide');
    cards.forEach((card) => {
      if (card.dataset.fileId === fileId) {
        card.classList.add('active');
        card.setAttribute('aria-selected', 'true');
      } else {
        card.classList.remove('active');
        card.setAttribute('aria-selected', 'false');
      }
    });
  }
};

// Export to global scope
window.VideoPlayer = VideoPlayer;
