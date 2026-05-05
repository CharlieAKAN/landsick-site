const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const client = null;

async function generateBlog() {
    const aiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    
    try {
        console.log('--- Starting Auto-Blogger (Sync Mode) ---');
        
        // 1. Generate new content
        const response = await aiClient.responses.create({
            model: "gpt-5.5",
            tools: [{ type: "web_search" }],
            instructions: `
                You are the creative director at Landsick Media. You write in a real, down-to-earth human voice—never sound like an AI.
                
                STYLE:
                - NO EM DASHES (—). Use commas, colons, or periods.
                - 8th grade reading level. Punchy and simple.
                - Sound like a filmmaker: Use "we", "us", and "you".
                - Avoid "robotic" transitions (e.g. "In conclusion").
                
                CONTENT:
                - Find one TRUE, specific filmmaking news story from the last 7 days.
                - YOU MUST CITE YOUR SOURCES with <a> links at the bottom.
                - Return JSON:
                  {
                    "title": "Short title",
                    "date": "May 5, 2026",
                    "isoDate": "2026-05-05",
                    "excerpt": "A 1-sentence hook",
                    "slug": "url-slug",
                    "tags": ["keyword1", "keyword2", "up to 15"],
                    "content": "HTML content with H2s/P tags"
                  }
            `,
            input: "Research the latest filmmaking news and write this week's blog post.",
        });

        let rawText = response.output_text;
        if (rawText.includes('```')) {
            rawText = rawText.replace(/```json|```/g, '').trim();
        }

        const data = JSON.parse(rawText);
        const { title, date, isoDate, excerpt, slug, tags, content } = data;

        console.log(`Successfully Generated: ${title}`);

        // Generate Word Cloud
        const wordCloudHtml = (tags || []).map(tag => {
            const size = Math.floor(Math.random() * (4 - 1 + 1) + 1);
            return `<span style="font-size: ${size}rem;">${tag}</span>`;
        }).join('\n');

        // 2. Save the New Post
        const blogDir = path.join(__dirname, '../blog');
        if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

        const templatePath = path.join(__dirname, '../blog-template.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        const finalHtml = template
            .replace(/{{POST_TITLE}}/g, title)
            .replace(/{{POST_DATE}}/g, date)
            .replace(/{{POST_EXCERPT}}/g, excerpt)
            .replace(/{{POST_SLUG}}/g, slug)
            .replace(/{{POST_CONTENT}}/g, content)
            .replace(/{{WORD_CLOUD}}/g, wordCloudHtml);

        const postPath = path.join(blogDir, `${slug}.html`);
        fs.writeFileSync(postPath, finalHtml);
        console.log(`✓ Saved: blog/${slug}.html`);

        // 3. FULL SYNC: Rebuild the blog.html index
        await syncIndex();

    } catch (error) {
        console.error('CRITICAL ERROR:', error.message);
        process.exit(1);
    }
}

async function syncIndex() {
    console.log('--- Syncing Blog Index ---');
    const blogDir = path.join(__dirname, '../blog');
    const blogIndexPath = path.join(__dirname, '../blog.html');
    
    if (!fs.existsSync(blogDir)) return;

    // Scan for all post files
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== '.gitkeep');
    const posts = [];

    files.forEach(file => {
        const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
        // Extract metadata from the hidden comment
        const match = content.match(/<!-- METADATA: (.*?) -->/);
        if (match) {
            try {
                const meta = JSON.parse(match[1]);
                // Try to find a date in the content if isoDate isn't in meta yet
                // For older files, we'll just use the date string
                posts.push(meta);
            } catch (e) {
                console.warn(`Could not parse metadata for ${file}`);
            }
        }
    });

    // Sort posts by date (Newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate Cards HTML
    const cardsHtml = posts.map(post => `
                <!-- Generated Post: ${post.slug} -->
                <article class="blog-card">
                    <span class="blog-date">${post.date}</span>
                    <h3 class="blog-card-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="blog/${post.slug}.html" class="blog-more-btn">Read Post <i class="fas fa-arrow-right"></i></a>
                </article>`).join('\n');

    // Update blog.html
    let blogIndex = fs.readFileSync(blogIndexPath, 'utf8');
    const startTag = '<!-- POSTS_START -->';
    const endTag = '<!-- POSTS_END -->';
    
    const startIndex = blogIndex.indexOf(startTag) + startTag.length;
    const endIndex = blogIndex.indexOf(endTag);
    
    if (startIndex > -1 && endIndex > -1) {
        const newIndexHtml = blogIndex.substring(0, startIndex) + '\n' + cardsHtml + '\n' + blogIndex.substring(endIndex);
        fs.writeFileSync(blogIndexPath, newIndexHtml);
        console.log(`✓ Blog index synced. (${posts.length} posts found)`);
    } else {
        console.error('Markers not found in blog.html');
    }
}

// Check for --sync-only flag
if (process.argv.includes('--sync-only')) {
    syncIndex();
} else {
    generateBlog();
}
