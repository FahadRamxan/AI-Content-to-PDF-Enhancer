// Content script to extract web page content
class ContentExtractor {
    constructor() {
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractContent') {
                const content = this.extractPageContent();
                sendResponse(content);
            }
            return true;
        });
    }

    extractPageContent() {
        const content = {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            text: '',
            headings: [],
            links: [],
            images: [],
            metadata: this.extractMetadata()
        };

        // Extract main text content
        content.text = this.extractMainText();
        
        // Extract headings
        content.headings = this.extractHeadings();
        
        // Extract links
        content.links = this.extractLinks();
        
        // Extract images
        content.images = this.extractImages();

        return content;
    }

    extractMainText() {
        // Remove script and style elements
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, aside, .ad, .advertisement, .sidebar');
        const tempDoc = document.cloneNode(true);
        
        elementsToRemove.forEach(el => {
            const tempEl = tempDoc.querySelector(el.tagName.toLowerCase());
            if (tempEl) tempEl.remove();
        });

        // Try to find main content area
        let mainContent = this.findMainContentArea();
        
        if (!mainContent) {
            // Fallback to body if no main content area found
            mainContent = document.body;
        }

        // Extract text while preserving paragraph structure
        const textContent = this.extractTextWithStructure(mainContent);
        
        return textContent.trim();
    }

    findMainContentArea() {
        // Common selectors for main content
        const mainSelectors = [
            'main',
            'article',
            '[role="main"]',
            '.main-content',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '#main',
            '#content'
        ];

        for (const selector of mainSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                return element;
            }
        }

        return null;
    }

    extractTextWithStructure(element) {
        let text = '';
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    
                    const tagName = node.tagName?.toLowerCase();
                    if (['script', 'style', 'nav', 'footer', 'aside'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br'].includes(tagName)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent.trim();
                if (textContent) {
                    text += textContent + ' ';
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
                    text += '\n\n';
                } else if (tagName === 'br') {
                    text += '\n';
                }
            }
        }

        return text.replace(/\n\s*\n/g, '\n\n').trim();
    }

    extractHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingElements.forEach(heading => {
            if (heading.textContent.trim()) {
                headings.push({
                    level: parseInt(heading.tagName.charAt(1)),
                    text: heading.textContent.trim(),
                    id: heading.id || null
                });
            }
        });

        return headings;
    }

    extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            if (text && href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                links.push({
                    text: text,
                    url: href,
                    internal: href.includes(window.location.hostname)
                });
            }
        });

        // Remove duplicates
        const uniqueLinks = links.filter((link, index, self) => 
            index === self.findIndex(l => l.url === link.url)
        );

        return uniqueLinks.slice(0, 50); // Limit to 50 links
    }

    extractImages() {
        const images = [];
        const imageElements = document.querySelectorAll('img[src]');
        
        imageElements.forEach(img => {
            const src = img.src;
            const alt = img.alt || '';
            
            if (src && !src.startsWith('data:') && img.width > 50 && img.height > 50) {
                images.push({
                    src: src,
                    alt: alt,
                    width: img.width,
                    height: img.height
                });
            }
        });

        return images.slice(0, 20); // Limit to 20 images
    }

    extractMetadata() {
        const metadata = {};
        
        // Extract meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property');
            const content = meta.getAttribute('content');
            
            if (name && content) {
                metadata[name] = content;
            }
        });

        // Extract canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            metadata.canonical = canonical.href;
        }

        // Extract publish date
        const publishDate = this.extractPublishDate();
        if (publishDate) {
            metadata.publishDate = publishDate;
        }

        // Extract author
        const author = this.extractAuthor();
        if (author) {
            metadata.author = author;
        }

        return metadata;
    }

    extractPublishDate() {
        // Try various selectors for publish date
        const dateSelectors = [
            'time[datetime]',
            '.publish-date',
            '.date',
            '.post-date',
            '[itemprop="datePublished"]',
            'meta[property="article:published_time"]'
        ];

        for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const dateValue = element.getAttribute('datetime') || 
                               element.getAttribute('content') || 
                               element.textContent;
                
                if (dateValue) {
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString();
                    }
                }
            }
        }

        return null;
    }

    extractAuthor() {
        // Try various selectors for author
        const authorSelectors = [
            '[itemprop="author"]',
            '.author',
            '.byline',
            '.post-author',
            'meta[name="author"]'
        ];

        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const authorValue = element.getAttribute('content') || element.textContent;
                if (authorValue && authorValue.trim()) {
                    return authorValue.trim();
                }
            }
        }

        return null;
    }
}

// Initialize the content extractor
new ContentExtractor();

