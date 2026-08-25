# MovieWala - HD Video Gallery & Player (GitHub Pages)

A modern, fast, responsive video gallery and player web application designed for seamless hosting on **GitHub Pages**.

Videos are hosted on cloud storage (shared publicly with "Anyone with the link") and embedded dynamically inside the page using the cloud player iframe. Video metadata is loaded asynchronously from a local JSON catalog (`assets/data/videos.json`).

---

## ✨ Features

- **Zero Heavy Dependencies**: Built with 100% native HTML5, modern CSS3 (Material 3 inspired design), and vanilla JavaScript.
- **Material 3 Hero Carousel**: An interactive slider looping through all video thumbnails with auto-scroll, touch swipe gestures, next/prev navigation, and click-to-play support.
- **User-Initiated Playback**: No video auto-plays on startup. The player container defaults to a clean `placeholder.svg` view with a clear prompt until the user explicitly selects a video.
- **SVG Branding & Favicon**: Dedicated `favicon.svg` and `logo.svg` vector assets for crisp display across high-DPI displays and browser tabs.
- **GitHub Pages Subpath Ready**: Uses strictly relative path references (`./assets/...`), allowing the site to work identically at `https://username.github.io/repository-name/` or custom domains.
- **Responsive Layout**: Designed for Desktop, Laptop, Tablet, and Mobile screens with CSS Grid and 16:9 aspect ratio player preservation.
- **Dynamic Stream Integration**: Uses the cloud video `file_id` to generate standard streaming preview player URLs.
- **Interactive UI**:
  - Live search/filtering
  - Skeleton loading states
  - Active video card indication & glowing borders
  - Hover effects & play button animations
  - Image fallback mechanism to placeholder thumbnail
  - Accessible keyboard navigation (Enter/Space to select)
  - Mobile touch optimization with smooth scroll-to-player

---

## 📁 Project Structure

```text
movie_wala/
│
├── index.html                  # Semantic HTML5 layout & containers
│
├── css/
│   └── style.css               # Material 3 dark palette, CSS Grid & responsive layout
│
├── js/
│   ├── video-service.js        # Loads & validates assets/data/videos.json
│   ├── slider.js               # Material 3 animated thumbnail carousel
│   ├── video-player.js         # Generates preview URLs & manages iframe
│   └── app.js                  # App lifecycle, gallery rendering & search
│
├── assets/
│   ├── data/
│   │   └── videos.json         # Video metadata catalog
│   └── images/
│       ├── favicon.svg         # Modern vector favicon
│       ├── logo.svg            # Modern vector brand logo
│       ├── placeholder.svg     # Fallback & default player placeholder
│       ├── video_1.svg         # Sample thumbnail 1
│       └── video_2.svg         # Sample thumbnail 2
│
└── README.md
```

---

## 🎥 How to Add New Videos

Adding a new video does **not** require modifying any HTML or JavaScript files. You only need to update `assets/data/videos.json`.

### Step 1: Upload Video & Get File ID

1. Upload your video file (`.mp4`, `.mov`, `.mkv`, etc.) to cloud storage.
2. Share the file with **Anyone with the link** as **Viewer**.
3. Copy the link and extract the unique `file_id` from the URL.

### Step 2: Add Entry to `assets/data/videos.json`

Open `assets/data/videos.json` and append your video object:

```json
[
  {
    "name": "My New Video Title",
    "picture": "assets/images/my_thumbnail.jpg",
    "file_id": "YOUR_FILE_ID_HERE"
  }
]
```

*(Optional)* Place your custom thumbnail image in `assets/images/`. If the thumbnail is omitted or fails to load, the site will automatically fall back to `assets/images/placeholder.svg`.

### Step 3: Commit and Push

```bash
git add assets/data/videos.json assets/images/
git commit -m "Add new video: My New Video Title"
git push origin main
```

---

## 💻 Local Development & Testing

```bash
python3 -m http.server 8080
```
Open your browser and navigate to:
```text
http://localhost:8080
```

---

## 🚀 GitHub Pages Deployment

1. Initialize git and push to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MovieWala video gallery"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
2. In your repository on GitHub:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch: `main` and folder: `/ (root)`.
   - Click **Save**.
3. After a few moments, your site will be live at:
   ```text
   https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
   ```
