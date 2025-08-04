const axios = require('axios');
const { OpenAI } = require('openai');
const { Paragraph, TextRun } = require('docx');
const fs = require('fs');

const cleanAndFormatResponse = (responseText) => {
    if (!responseText) return 'No response';
    let cleanedText = responseText
        .replace(/\*\*/g, '') // Remove double asterisks for bold
        .replace(/#/g, '') // Remove hash for headers
        .replace(/\s*\n\s*\n/g, '\n\n') // Preserve double line breaks for paragraphs
        .replace(/•/g, '-'); // Convert bullet points
    
    // Better formatting for numbered lists
    cleanedText = cleanedText.replace(/(\d+\.)\s*/g, '\n$1 ');
    
    // Better formatting for colons
    cleanedText = cleanedText.replace(/:\s*/g, ':\n');
    
    // Clean up excessive whitespace while preserving structure
    cleanedText = cleanedText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
    
    // Ensure proper spacing between sections
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
    
    return cleanedText;
};

const createFormattedParagraphs = (prompt, response) => {
    const cleanedResponse = cleanAndFormatResponse(response);
    const paragraphs = [];
    paragraphs.push(
        new Paragraph({}),
        new Paragraph({
            children: [new TextRun({ text: `Prompt: ${prompt}`, bold: true, color: 'FF0000' })],
        }),
        new Paragraph({})
    );
    const lines = cleanedResponse.split('\n');
    lines.forEach((line) => {
        if (/^\d+\./.test(line) || line.endsWith(':')) {
            paragraphs.push(new Paragraph({}));
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: line, bold: true })],
                })
            );
        } else {
            paragraphs.push(
                new Paragraph({
                    children: [new TextRun({ text: line })],
                })
            );
        }
    });
    return paragraphs;
};

const callOpenAIWithTimeout = async (prompt, timeout = 120000) => {
    const response = await axios.get("http://54.205.162.22:5000/api/get-api-settings");
    const apiKey = response.data.apiKey;
    const model = response.data.model;
    const openai = new OpenAI({ apiKey });
    
    // Enhanced system prompt for better quality responses
    const systemPrompt = `You are an expert AI assistant with deep knowledge across all domains. Your task is to provide comprehensive, well-structured, and insightful responses.

IMPORTANT GUIDELINES:
- Provide detailed, thorough responses with depth and nuance
- Use clear, professional language with proper formatting
- Include relevant examples, explanations, and context
- Structure your response logically with clear sections
- Be comprehensive but avoid unnecessary repetition
- Use bullet points, numbered lists, and proper paragraph breaks for readability
- Ensure your response is informative, engaging, and valuable
- Aim for 1500-2500 words of high-quality content
- Think step-by-step and provide thorough analysis
- Include practical insights and actionable information when relevant
- Use the most current and up-to-date information available
- Provide cutting-edge insights and modern perspectives
- Include recent developments and trends when applicable

Format your response with proper structure, clear headings, and easy-to-follow organization. Always strive to provide the most current and relevant information.`;

    return Promise.race([
        openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            max_tokens: 4000, // Increased token limit for longer responses
            temperature: 0.7, // Balanced creativity and consistency
            top_p: 0.9, // Better response quality
            frequency_penalty: 0.1, // Reduce repetition
            presence_penalty: 0.1, // Encourage diverse topics
            response_format: { type: "text" }, // Ensure text format
            seed: null, // Allow for fresh responses each time
            logprobs: false, // Disable for better performance
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("OpenAI request timed out")), timeout)
        ),
    ]);
};

const generateUniqueFilename = (baseName, extension) => {
    let counter = 0;
    let filename = `${baseName}${extension}`;
    while (fs.existsSync(filename)) {
        counter++;
        filename = `${baseName}(${counter})${extension}`;
    }
    return filename;
};

module.exports = {
    cleanAndFormatResponse,
    createFormattedParagraphs,
    callOpenAIWithTimeout,
    generateUniqueFilename,
}; 