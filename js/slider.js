/**
 * High-End OTT Spotlight Carousel Slider
 * Material 3 inspired cinema rail with dynamic metadata chips,
 * backdrop blur, touch gestures, auto-rotation, search-focus, and instant playback re-initiation.
 */

const MaterialSlider = {
  elements: {
    container: null,
    track: null,
    prevBtn: null,
    nextBtn: null,
    pagination: null
  },

  videos: [],
  currentIndex: 0,
  autoPlayTimer: null,
  autoPlayDelay: 4500,
  isPaused: false,
  onSelectCallback: null,

  // Touch gesture state
  touchStartX: 0,
  touchEndX: 0,

  /**
   * Initializes the Material Slider.
   * @param {Object} domElements
   * @param {Array<Object>} videoList
   * @param {Function} onSelectVideo
   */
  init(domElements, videoList, onSelectVideo) {
    this.elements = { ...this.elements, ...domElements };
    this.videos = Array.isArray(videoList) ? videoList : [];
    this.onSelectCallback = onSelectVideo;
    this.currentIndex = 0;

    if (!this.elements.track || this.videos.length === 0) {
      if (this.elements.container) {
        this.elements.container.style.display = 'none';
      }
      return;
    }

    if (this.elements.container) {
      this.elements.container.style.display = 'block';
    }

    this.renderSlides();
    this.renderPagination();
    this.bindEvents();
    this.updateSlidePosition();
    this.startAutoPlay();
  },

  /**
   * Renders the Material 3 slide cards into the track.
   */
  renderSlides() {
    this.elements.track.innerHTML = '';

    this.videos.forEach((video, index) => {
      const slide = document.createElement('div');
      slide.className = 'material-slide';
      slide.dataset.index = index.toString();
      slide.dataset.fileId = video.file_id;
      slide.setAttribute('role', 'button');
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('aria-label', `Stream ${video.name}`);

      slide.innerHTML = `
        <div class="slide-card">
          <div class="slide-media">
            <img 
              src="${video.picture}" 
              alt="${video.name}" 
              class="slide-img" 
              loading="lazy"
              onerror="this.onerror=null;this.src='assets/images/placeholder.svg';"
            />
            <div class="slide-scrim"></div>
            
            <!-- Top Badges Row -->
            <div class="slide-top-badges">
              <span class="slide-match-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                98% Match
              </span>
              <span class="slide-quality-chip">4K HDR</span>
            </div>

            <!-- Animated Play FAB with Pulse Ring -->
            <div class="slide-play-fab" aria-hidden="true">
              <div class="play-fab-pulse"></div>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          <!-- Slide Metadata Info -->
          <div class="slide-meta">
            <h4 class="slide-title" title="${video.name}">${video.name}</h4>
            <div class="slide-actions">
              <span class="slide-cta">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Now
              </span>
              <span class="slide-badge">HD Stream</span>
            </div>
          </div>
        </div>
      `;

      // Click / Keyboard selection handler
      const selectAction = () => {
        if (typeof this.onSelectCallback === 'function') {
          this.onSelectCallback(video, index);
        }
      };

      slide.addEventListener('click', selectAction);
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectAction();
        }
      });

      this.elements.track.appendChild(slide);
    });
  },

  /**
   * Renders pagination pill indicators.
   */
  renderPagination() {
    if (!this.elements.pagination) return;
    this.elements.pagination.innerHTML = '';

    this.videos.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => {
        this.goToSlide(index);
        this.resetAutoPlay();
      });
      this.elements.pagination.appendChild(dot);
    });
  },

  /**
   * Binds navigation and gesture events.
   */
  bindEvents() {
    // Next / Previous Buttons
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => {
        this.prevSlide();
        this.resetAutoPlay();
      });
    }

    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => {
        this.nextSlide();
        this.resetAutoPlay();
      });
    }

    // Hover pauses auto-play
    if (this.elements.container) {
      this.elements.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
      this.elements.container.addEventListener('mouseleave', () => this.resumeAutoPlay());

      // Touch Gestures for mobile swipe
      this.elements.container.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.pauseAutoPlay();
      }, { passive: true });

      this.elements.container.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipeGesture();
        this.resumeAutoPlay();
      }, { passive: true });
    }

    // Responsive resize reposition
    window.addEventListener('resize', () => {
      this.updateSlidePosition();
    });
  },

  /**
   * Focuses and navigates to a specific slide from search Enter key.
   * @param {number} index
   */
  focusSlide(index) {
    if (index < 0 || index >= this.videos.length) return;

    this.currentIndex = index;
    this.updateSlidePosition();

    // Pause autoplay temporarily so user can inspect focused slide
    this.pauseAutoPlay();
    setTimeout(() => this.resumeAutoPlay(), 6000);

    // Apply glowing focus pulse to targeted slide
    const slides = this.elements.track ? this.elements.track.querySelectorAll('.material-slide') : [];
    slides.forEach((s) => s.classList.remove('slide-focused'));

    if (slides[index]) {
      slides[index].classList.add('slide-focused');
      setTimeout(() => {
        slides[index].classList.remove('slide-focused');
      }, 4000);
    }

    // Smooth scroll to the slider section
    if (this.elements.container) {
      this.elements.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /**
   * Handles touch swipe calculation.
   */
  handleSwipeGesture() {
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 40;

    if (diff > threshold) {
      this.nextSlide();
    } else if (diff < -threshold) {
      this.prevSlide();
    }
  },

  /**
   * Navigates to the next slide.
   */
  nextSlide() {
    if (this.videos.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.videos.length;
    this.updateSlidePosition();
  },

  /**
   * Navigates to the previous slide.
   */
  prevSlide() {
    if (this.videos.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.videos.length) % this.videos.length;
    this.updateSlidePosition();
  },

  /**
   * Navigates directly to a target slide index.
   * @param {number} index
   */
  goToSlide(index) {
    if (index >= 0 && index < this.videos.length) {
      this.currentIndex = index;
      this.updateSlidePosition();
    }
  },

  /**
   * Updates CSS transform of track and active classes on slides/dots.
   */
  updateSlidePosition() {
    if (!this.elements.track) return;

    const slides = this.elements.track.querySelectorAll('.material-slide');
    if (slides.length === 0) return;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === this.currentIndex);
    });

    if (this.elements.pagination) {
      const dots = this.elements.pagination.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === this.currentIndex);
      });
    }

    const activeSlide = slides[this.currentIndex];
    if (activeSlide && this.elements.container) {
      const containerWidth = this.elements.container.clientWidth;
      const slideWidth = activeSlide.offsetWidth;
      const slideLeft = activeSlide.offsetLeft;
      
      const targetOffset = slideLeft - (containerWidth / 2) + (slideWidth / 2);
      this.elements.track.style.transform = `translateX(${-Math.max(0, targetOffset)}px)`;
    }
  },

  /**
   * Starts automatic looping slideshow.
   */
  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, this.autoPlayDelay);
  },

  pauseAutoPlay() {
    this.isPaused = true;
  },

  resumeAutoPlay() {
    this.isPaused = false;
  },

  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  },

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
};

// Export to global scope
window.MaterialSlider = MaterialSlider;
