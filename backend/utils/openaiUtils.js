const axios = require('axios');
const { OpenAI } = require('openai');
const { Paragraph, TextRun } = require('docx');
const fs = require('fs');

const cleanAndFormatResponse = (responseText) => {
    if (!responseText) return 'No response';
    let cleanedText = responseText
        .replace(/[#*_-]/g, '')
        .replace(/\s*\n\s*\n/g, '\n')
        .replace(/•/g, '-');
    cleanedText = cleanedText.replace(/(\d+\.)\s*/g, '\n$1 ');
    cleanedText = cleanedText.replace(/:\s*/g, ':\n');
    cleanedText = cleanedText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
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

const callOpenAIWithTimeout = async (prompt, timeout = 90000) => {
    const response = await axios.get("http://54.205.162.22:5001/api/get-api-settings");
    const apiKey = response.data.apiKey;
    const model = response.data.model;
    const openai = new OpenAI({ apiKey });
    return Promise.race([
        openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: "Provide a detailed response to the prompt and try to consume the full token limit. Generate around 2000 words" },
                { role: "user", content: prompt }
            ],
            max_tokens: 2700,
            temperature: 1,
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