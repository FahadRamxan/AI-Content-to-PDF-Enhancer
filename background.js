// Background script for AI processing and PDF generation
class BackgroundProcessor {
    constructor() {
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'enhanceContent') {
                this.handleEnhanceContent(request, sendResponse);
                return true; // Keep message channel open for async response
            }
        });
    }

    async handleEnhanceContent(request, sendResponse) {
        try {
            const { content, options, apiKey, model } = request;
            
            const enhancedContent = await this.enhanceContentWithAI(
                content, 
                options, 
                apiKey, 
                model
            );
            
            sendResponse({
                success: true,
                enhancedContent: enhancedContent
            });
            
        } catch (error) {
            console.error('Error enhancing content:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async enhanceContentWithAI(content, options, apiKey, model) {
        const enhancedContent = {};
        
        // Build the system prompt based on selected options
        let systemPrompt = `You are an AI content enhancement assistant. Your task is to analyze web content and provide enhancements based on the user's requirements.

Original content metadata:
- Title: ${content.title}
- URL: ${content.url}
- Domain: ${content.domain}
- Word count: ~${content.text.split(' ').length} words

Content text:
${content.text}

Please provide responses in JSON format with the following structure:
{`;

        const tasks = [];
        
        if (options.summarize) {
            systemPrompt += `
  "summary": "A concise, well-structured summary of the main points",`;
            tasks.push('summarize');
        }
        
        if (options.expandContext) {
            systemPrompt += `
  "context": "Additional context, background information, and related insights that would help readers better understand the topic",`;
            tasks.push('expand context');
        }
        
        if (options.validateClaims) {
            systemPrompt += `
  "validation": [
    {
      "claim": "A specific claim from the content",
      "status": "verified/questionable/false",
      "reasoning": "Explanation of the validation"
    }
  ]`;
            tasks.push('validate claims');
        }
        
        systemPrompt += `
}

Requirements:
- Be factual and objective
- Provide high-quality, accurate information
- If validating claims, focus on the most significant or questionable assertions
- Keep summaries concise but comprehensive
- Make context additions genuinely valuable and educational`;

        try {
            const response = await this.callOpenAI(systemPrompt, apiKey, model);
            
            // Parse the JSON response
            const parsedResponse = JSON.parse(response);
            
            if (options.summarize && parsedResponse.summary) {
                enhancedContent.summary = parsedResponse.summary;
            }
            
            if (options.expandContext && parsedResponse.context) {
                enhancedContent.context = parsedResponse.context;
            }
            
            if (options.validateClaims && parsedResponse.validation) {
                enhancedContent.validation = parsedResponse.validation;
            }
            
            return enhancedContent;
            
        } catch (error) {
            throw new Error(`AI processing failed: ${error.message}`);
        }
    }

    async callOpenAI(prompt, apiKey, model) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from OpenAI');
        }

        return data.choices[0].message.content;
    }

}

// Initialize the background processor
new BackgroundProcessor();
