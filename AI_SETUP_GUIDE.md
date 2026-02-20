# 🤖 AI Chat Integration Guide

## Overview
Smart Read now includes an AI Chat assistant that helps you learn English better! The AI can answer questions about the text, explain vocabulary, and provide tips for learning.

## Current Implementation
The app comes with a **demo AI mode** that works out of the box without any configuration.

## Features 🎯

### Current Demo Mode
- ✅ Chat interface ready to use
- ✅ Context-aware responses
- ✅ Interactive words (click to translate)
- ✅ Voice pronunciation for AI responses
- ✅ Works on all devices without API key

### To Enable Professional AI (Optional)

## Step 1: Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Create API key
4. Copy the key

## Step 2: Update script.js

Open `script.js` and find the `queryGroqAI` function (around line 470):

**Replace this section:**
```javascript
// Note: For free usage, we'll use a simpler approach
// You'll need to set up Groq API key for production
// For now, returning a demo response

// In production, uncomment and use this with your API key:
/*
const apiKey = 'your-groq-api-key-here';
...
*/

// For demo: simulate AI response with context-aware answers
return generateDemoResponse(userMessage, context);
```

**With this:**
```javascript
const apiKey = 'YOUR_GROQ_API_KEY_HERE'; // Replace with your key
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{
            role: 'system',
            content: `You are an English teacher helping students learn. Context: ${context || 'General English learning'}. Keep answers brief and helpful.`,
        }, {
            role: 'user',
            content: userMessage
        }],
        max_tokens: 300,
        temperature: 0.7
    })
});

const data = await response.json();
if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
} else {
    throw new Error('API Error');
}
```

## Step 3: Deploy

```bash
git add script.js
git commit -m "Add Groq API integration for AI chat"
git push origin main
```

---

## Free AI Services Comparison

| Service | Free Tier | Speed | Quality |
|---------|-----------|-------|---------|
| **Groq** | 10k requests/month | Very Fast ⚡ | Excellent |
| Hugging Face | Unlimited | Fast | Good |
| Cohere | 100 requests/month | Good | Good |
| Together AI | Limited | Good | Excellent |

## How to Use AI Chat

1. **Select a Topic** - Choose from Science, Tech, etc.
2. **Read the Text** - Understand the context
3. **Ask Questions** - Type any question in the chat box
4. **Get Answers** - AI responds related to the topic
5. **Click Words** - All AI response words are clickable for translation
6. **Hear Pronunciation** - Click any word to hear it spoken

## Example Questions

- "What does 'galaxy' mean?"
- "Can you explain this paragraph?"
- "Give me more examples of this word"
- "What is the pronunciation?"
- "How do I use this word in a sentence?"

---

## 🔐 Security Notes

⚠️ **Never commit your API key to GitHub!**

**Better practice:**
1. Create `.env` file with your API key
2. Add `.env` to `.gitignore`
3. Use environment variables in your code

For this app:
```
# .env file
GROQ_API_KEY=your_key_here
```

Then in code:
```javascript
const apiKey = process.env.GROQ_API_KEY;
```

---

## Troubleshooting

### Q: Chat responds with repeated text
**A:** The demo mode is active. Add your Groq API key to activate professional AI.

### Q: Words not clickable in AI response
**A:** Refresh the page. Make sure JavaScript is enabled.

### Q: API returns 401 error
**A:** Check if your API key is correct and active.

---

## Future Improvements

🚀 Potential additions:
- Image generation for vocabulary
- Quiz mode with AI questions
- Voice input for chat
- Multiple language support
- Chat history save
- Grammar checking

---

## More Info

- [Groq Documentation](https://www.groq.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Building AI Apps](https://huggingface.co/learn)

---

**Happy learning with AI! 🌟**
