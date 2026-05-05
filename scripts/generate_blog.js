const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateBlog() {
    try {
        console.log('--- Starting Auto-Blogger ---');
        
        // 1. Generate content via OpenAI with Web Search
        const response = await client.responses.create({
            model: "gpt-5.5",
            tools: [{ type: "web_search" }],
            instructions: `
                You are the creative director at Landsick Media. You write in a real, down-to-earth human voice—never sound like an AI.
                
                WRITING STYLE RULES:
                - ABSOLUTELY NO EM DASHES (—). Use commas, colons, or simple periods instead.
                - 8th grade reading level: Keep sentences punchy and words simple. No fluff.
                - Sound like a filmmaker talking to a friend: Use "we", "us", and "you".
                - Avoid "robotic" transition words (e.g., "In conclusion", "Furthermore", "Delve into", "Ever-evolving").
                
                CONTENT RULES:
                - Use the web_search tool to find one TRUE, specific filmmaking or camera news story from the last 7 days.
                - Do not make things up. Use real data from your search.
                - YOU MUST CITE YOUR SOURCES. At the end of the post, add a small "Sources:" section with clickable <a> links to the articles you found.
                
                FORMAT:
                - Return the result strictly as a JSON object with these keys:
                  {
                    "title": "Short, catchy title",
                    "date": "Month Day, Year",
                    "excerpt": "A 1-sentence hook (no em-ashes!)",
                    "slug": "simple-url-slug",
                    "content": "Full HTML content with H2s and P tags. Include the 'Sources' section at the bottom."
                  }
            `,
            input: "Research the latest news in filmmaking and write this week's blog post.",
        });

        let rawText = response.output_text;
        // Strip markdown code blocks if present
        if (rawText.includes('```')) {
            rawText = rawText.replace(/```json|```/g, '').trim();
        }

        const data = JSON.parse(rawText);
        const { title, date, excerpt, slug, content } = data;

        console.log(`Generated: ${title}`);

        // 2. Load the template
        const templatePath = path.join(__dirname, '../blog-template.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        // 3. Inject content into template
        const finalHtml = template
            .replace(/{{POST_TITLE}}/g, title)
            .replace(/{{POST_DATE}}/g, date)
            .replace(/{{POST_EXCERPT}}/g, excerpt)
            .replace(/{{POST_SLUG}}/g, slug)
            .replace(/{{POST_CONTENT}}/g, content);

        // 4. Save the new post
        const postPath = path.join(__dirname, `../blog/${slug}.html`);
        fs.writeFileSync(postPath, finalHtml);
        console.log(`Saved new post to: blog/${slug}.html`);

        // 5. Update the Blog Index (blog.html)
        const blogIndexPath = path.join(__dirname, '../blog.html');
        let blogIndex = fs.readFileSync(blogIndexPath, 'utf8');

        const newCard = `
                <!-- Generated Post: ${slug} -->
                <article class="blog-card">
                    <span class="blog-date">${date}</span>
                    <h3 class="blog-card-title">${title}</h3>
                    <p class="blog-excerpt">${excerpt}</p>
                    <a href="blog/${slug}.html" class="blog-more-btn">Read Post <i class="fas fa-arrow-right"></i></a>
                </article>`;

        blogIndex = blogIndex.replace('<!-- POSTS_START -->', `<!-- POSTS_START -->${newCard}`);
        fs.writeFileSync(blogIndexPath, blogIndex);
        
        console.log('Blog index updated successfully.');

    } catch (error) {
        console.error('FAILED to generate blog:', error);
    }
}

generateBlog();
