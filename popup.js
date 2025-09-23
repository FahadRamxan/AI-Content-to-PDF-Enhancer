// Popup script for the AI Web Content Enhancer extension
class PopupManager {
    constructor() {
        this.currentPageContent = null;
        this.enhancedContent = null;
        this.apiKey = null;
        this.model = 'gpt-4';
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        await this.loadCurrentPageInfo();
    }

    async loadSettings() {
        const result = await chrome.storage.local.get(['apiKey', 'model']);
        this.apiKey = result.apiKey || '';
        this.model = result.model || 'gpt-4';
        
        document.getElementById('api-key').value = this.apiKey;
        document.getElementById('model').value = this.model;
    }

    setupEventListeners() {
        // Save API key
        document.getElementById('save-key').addEventListener('click', () => {
            this.saveApiKey();
        });

        // Model selection
        document.getElementById('model').addEventListener('change', (e) => {
            this.model = e.target.value;
            chrome.storage.local.set({ model: this.model });
        });

        // Process content button
        document.getElementById('process-content').addEventListener('click', () => {
            this.processContent();
        });

        // Generate PDF button
        document.getElementById('generate-pdf').addEventListener('click', () => {
            this.generatePDF();
        });

        // Enter key in API key field
        document.getElementById('api-key').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    async loadCurrentPageInfo() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            document.getElementById('page-title').textContent = tab.title || 'Unknown';
            document.getElementById('page-url').textContent = tab.url || 'Unknown';

            // Extract content from the current tab
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
            this.currentPageContent = response;
            
        } catch (error) {
            console.error('Error loading page info:', error);
            document.getElementById('page-title').textContent = 'Error loading page';
            document.getElementById('page-url').textContent = 'Please refresh the page';
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('api-key').value.trim();
        
        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showError('API key should start with "sk-"');
            return;
        }

        this.apiKey = apiKey;
        await chrome.storage.local.set({ apiKey: this.apiKey });
        
        this.showSuccess('API key saved successfully');
    }

    async processContent() {
        if (!this.apiKey) {
            this.showError('Please enter and save your OpenAI API key first');
            return;
        }

        if (!this.currentPageContent || !this.currentPageContent.text) {
            this.showError('No content found on this page. Please refresh and try again.');
            return;
        }

        const options = this.getSelectedOptions();
        
        this.showProcessing(true);
        
        try {
            // Send content to background script for AI processing
            const response = await chrome.runtime.sendMessage({
                action: 'enhanceContent',
                content: this.currentPageContent,
                options: options,
                apiKey: this.apiKey,
                model: this.model
            });

            if (response.success) {
                this.enhancedContent = response.enhancedContent;
                this.displayResults(response.enhancedContent);
                document.getElementById('generate-pdf').disabled = false;
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }
            
        } catch (error) {
            console.error('Error processing content:', error);
            this.showError('Error processing content: ' + error.message);
        } finally {
            this.showProcessing(false);
        }
    }

    getSelectedOptions() {
        return {
            summarize: document.getElementById('summarize').checked,
            expandContext: document.getElementById('expand-context').checked,
            validateClaims: document.getElementById('validate-claims').checked
        };
    }

    displayResults(enhancedContent) {
        const resultsSection = document.querySelector('.results-section');
        const previewContent = document.getElementById('preview-content');
        
        let html = '';
        
        if (enhancedContent.summary) {
            html += `<h4>Summary</h4><p>${enhancedContent.summary}</p><br>`;
        }
        
        if (enhancedContent.context) {
            html += `<h4>Additional Context</h4><p>${enhancedContent.context}</p><br>`;
        }
        
        if (enhancedContent.validation && enhancedContent.validation.length > 0) {
            html += `<h4>Fact Validation</h4>`;
            enhancedContent.validation.forEach(item => {
                html += `<p><strong>Claim:</strong> ${item.claim}</p>`;
                html += `<p><strong>Status:</strong> ${item.status}</p>`;
                html += `<p><strong>Reasoning:</strong> ${item.reasoning}</p><br>`;
            });
        }
        
        previewContent.innerHTML = html;
        resultsSection.style.display = 'block';
    }

    async generatePDF() {
        if (!this.enhancedContent) {
            this.showError('No enhanced content available. Please process content first.');
            return;
        }

        try {
            this.showProcessing(true);
            document.getElementById('generate-pdf').textContent = 'Generating PDF...';
            
            // Create HTML content for PDF
            const htmlContent = this.createPDFHTML();
            
            // Create a new tab with the content for printing to PDF
            const tab = await chrome.tabs.create({
                url: 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent),
                active: false
            });

            // Wait a moment for the tab to load, then trigger print
            setTimeout(async () => {
                try {
                    // Focus the tab and trigger print dialog
                    await chrome.tabs.update(tab.id, { active: true });
                    
                    // Show instructions to user
                    this.showSuccess('PDF tab opened! Use Ctrl+P or Cmd+P to print/save as PDF, then close the tab.');
                    
                    // Close our popup so user can see the PDF tab
                    window.close();
                    
                } catch (error) {
                    console.error('Error opening PDF tab:', error);
                    chrome.tabs.remove(tab.id);
                    throw new Error('Failed to open PDF tab');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showError('Error generating PDF: ' + error.message);
        } finally {
            this.showProcessing(false);
            document.getElementById('generate-pdf').textContent = 'Generate PDF';
        }
    }

    createPDFHTML() {
        const currentDate = new Date().toLocaleDateString();
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Enhanced Content Report - ${this.currentPageContent.title}</title>
            <style>
                @page {
                    margin: 1in;
                    size: letter;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 8.5in;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                    page-break-after: avoid;
                }
                
                .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .header p {
                    margin: 5px 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .metadata {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    border-left: 4px solid #667eea;
                    page-break-inside: avoid;
                }
                
                .metadata h3 {
                    margin-top: 0;
                    color: #667eea;
                    font-size: 18px;
                    margin-bottom: 15px;
                }
                
                .metadata p {
                    margin: 8px 0;
                    font-size: 14px;
                }
                
                .section {
                    margin-bottom: 35px;
                    page-break-inside: avoid;
                }
                
                .section h2 {
                    color: #667eea;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                
                .enhanced-section {
                    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
                    border: 1px solid #d1d9ff;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 20px;
                }
                
                .enhanced-section h3 {
                    color: #667eea;
                    margin-top: 0;
                    font-size: 16px;
                }
                
                .validation-item {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    padding: 20px;
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                
                .validation-item .claim {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .validation-item .status {
                    font-weight: 600;
                    margin-bottom: 10px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    display: inline-block;
                }
                
                .validation-item .status.verified {
                    background: #d4edda;
                    color: #155724;
                }
                
                .validation-item .status.questionable {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .validation-item .status.false {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .original-content {
                    background: #fff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    line-height: 1.7;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                    color: #666;
                    font-size: 12px;
                    page-break-inside: avoid;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .header {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .enhanced-section {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .validation-item .status {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>AI-Enhanced Content Report</h1>
                <p>Intelligent Web Content Analysis & Enhancement</p>
                <p>Generated on ${currentDate}</p>
            </div>

            <div class="metadata">
                <h3>Source Information</h3>
                <p><strong>Title:</strong> ${this.currentPageContent.title}</p>
                <p><strong>URL:</strong> ${this.currentPageContent.url}</p>
                <p><strong>Domain:</strong> ${this.currentPageContent.domain}</p>
                <p><strong>Word Count:</strong> ~${this.currentPageContent.text.split(' ').length} words</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;

        if (this.currentPageContent.metadata && this.currentPageContent.metadata.author) {
            html += `<p><strong>Author:</strong> ${this.currentPageContent.metadata.author}</p>`;
        }

        if (this.currentPageContent.metadata && this.currentPageContent.metadata.publishDate) {
            html += `<p><strong>Published:</strong> ${new Date(this.currentPageContent.metadata.publishDate).toLocaleDateString()}</p>`;
        }

        html += `</div>`;

        // Add enhanced content sections
        if (this.enhancedContent.summary) {
            html += `
            <div class="section">
                <h2>AI-Generated Summary</h2>
                <div class="enhanced-section">
                    <p>${this.enhancedContent.summary.replace(/\n/g, '</p><p>')}</p>
                </div>
            </div>`;
        }

        if (this.enhancedContent.context) {
            html += `
            <div class="section">
                <h2>Additional Context & Background</h2>
                <div class="enhanced-section">
                    <p>${this.enhancedContent.context.replace(/\n/g, '</p><p>')}</p>
                </div>
            </div>`;
        }

        if (this.enhancedContent.validation && this.enhancedContent.validation.length > 0) {
            html += `
            <div class="section">
                <h2>Fact Validation</h2>
                <div class="enhanced-section">`;
            
            this.enhancedContent.validation.forEach(item => {
                const statusClass = item.status.toLowerCase().replace(/\s+/g, '');
                html += `
                <div class="validation-item">
                    <div class="claim"><strong>Claim:</strong> ${item.claim}</div>
                    <div class="status ${statusClass}"><strong>Status:</strong> ${item.status}</div>
                    <div class="reasoning"><strong>Reasoning:</strong> ${item.reasoning}</div>
                </div>`;
            });
            
            html += `</div></div>`;
        }

        // Add original content (truncated if too long)
        let contentText = this.currentPageContent.text;
        if (contentText.length > 5000) {
            contentText = contentText.substring(0, 5000) + '... [Content truncated for PDF]';
        }

        html += `
            <div class="section">
                <h2>Original Content</h2>
                <div class="original-content">
                    <p>${contentText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>
                </div>
            </div>

            <div class="footer">
                <p><strong>Generated by AI Web Content Enhancer</strong></p>
                <p>Enhanced content is AI-generated and should be verified independently</p>
                <p>This report contains original content enhanced with artificial intelligence</p>
            </div>
            
            <script>
                // Auto-trigger print dialog when page loads
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>`;

        return html;
    }

    showProcessing(show) {
        const processBtn = document.getElementById('process-content');
        const btnText = processBtn.querySelector('.btn-text');
        const spinner = processBtn.querySelector('.loading-spinner');
        const progressSection = document.querySelector('.progress-section');

        if (show) {
            processBtn.disabled = true;
            btnText.textContent = 'Processing...';
            spinner.style.display = 'block';
            progressSection.style.display = 'block';
        } else {
            processBtn.disabled = false;
            btnText.textContent = 'Enhance Content';
            spinner.style.display = 'none';
            progressSection.style.display = 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
            ${type === 'error' ? 'background: #dc3545;' : 'background: #28a745;'}
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
