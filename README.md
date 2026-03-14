# Ultra-Fast Portfolio & Blog Template ⚡

> A minimalist, zero-bundle-size, perfectly optimized developer portfolio and markdown blog.

This project is a radically simple approach to building a personal portfolio and technical blog. It abandons heavy SPA frameworks (React, Next.js, etc.) and complex build pipelines in favor of the raw, native web platform. 

The result? **A perfect 100/100/100/100 Google Lighthouse score** in Performance, Accessibility, Best Practices, and SEO.

## Features

- **Perfect Lighthouse Score:** Blazing fast metrics across the board.
- **Zero JavaScript Build Step:** No Webpack, Vite, or Rollup. Just native ES modules and vanilla DOM APIs.
- **Semantic UI & Styling:** Powered by [Oat UI (`@knadh/oat`)](https://github.com/knadh/oat), an incredibly tiny ~8KB classless CSS library that styles native HTML elements out-of-the-box.
- **Static Markdown Blog:** Write your posts in `.md` files in the `posts/` folder. They are dynamically fetched and rendered on the client side using `marked.js` and syntax-highlighted with `highlight.js`.
- **Intelligent Client-Side Caching:** Blog post content and metadata are aggressively cached in `sessionStorage` to make navigation instantaneous after the first load.
- **Automated Image Optimization:** A custom Python script automatically resizes, compresses, and converts heavy PNGs/JPGs into hyper-efficient WebP formats.
- **Technical SEO:** Built-in Open Graph tags, Twitter cards, structured JSON-LD schema, and a pre-configured `sitemap.xml` and RSS `feed.xml`.

## Architecture & Tech Stack

- **Structure:** HTML5 & Semantic Markup
- **Styling:** Custom CSS + CSS Variables (`styles.css`) stacked on top of Oat UI.
- **Interactivity:** Vanilla JavaScript (`site.js`).
- **Markdown parsing:** `marked.js` (via CDN)
- **Asset Pipeline:** Python (`Pillow`) for automated image optimization.

## Quick Start (Local Development)

Because there is no Node.js build step, running this site locally is as simple as starting a local web server.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/portfolio.git
   cd portfolio
   ```

2. **Serve the project:**
   You can use any local web server. Python 3 is the easiest option:
   ```bash
   python3 -m http.server
   ```

3. **Visit your local site:**
   Open `http://localhost:8000` in your browser.

## How to Add a Blog Post

1. Create a new markdown file in the `posts/` directory (e.g., `my-new-post.md`).
2. Add the required frontmatter at the very top of your `.md` file:
   ```yaml
   ---
   title: "My New Post Title"
   date: "2026-04-01"
   slug: "my-new-post"
   description: "A short description of this post for the SEO and card."
   ---
   ```
3. Register the post in `posts/index.json` so the frontend knows it exists:
   ```json
   {
     "slug": "my-new-post",
     "title": "My New Post Title",
     "date": "2026-04-01",
     "displayDate": "Apr 1, 2026",
     "description": "A short description of this post for the SEO and card."
   }
   ```
   *(Note: The search/filter functions explicitly use this JSON manifest. It ensures the UI doesn't have to download every single markdown file just to render the homepage card list).*

## Image Optimization Pipeline

To keep the Lighthouse score perfect, NEVER serve raw, unoptimized images. 

1. Install Python prerequisites (if you haven't already):
   ```bash
   pip3 install Pillow
   ```
2. Drop your heavy `.png` or `.jpg` image files into the `image/source/` directory.
3. Run the optimization script:
   ```bash
   python3 optimize_images.py
   ```
4. The script will automatically resize, compress, and dump `.webp` files into the `image/optimized/` folder. Use *(e.g., `<img src="./image/optimized/my-image.webp" />`)* in your markdown or HTML files.

*The `image/source/` folder ignores heavy images via `.gitignore` to keep the repository lightweight.*

## Customization

- **Colors & Theme:** You can override global variables inside `styles.css`.
- **Navigation:** Edit the `<nav>` inside `index.html`, `blogs.html`, `about.html`, etc.
- **SEO & Social:** Update the `<title>`, `<meta>`, and `application/ld+json` tags in the `<head>` of each HTML document to match your details.

## License

This project is open-sourced under the [MIT License](LICENSE). Feel free to fork it, modify it, and use it for your own personal developer portfolio!
