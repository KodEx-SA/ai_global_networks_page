# 📡 AI Global Networks - API Documentation

> **Complete API reference for the AI Global Networks Intelligence Hub**

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Chat Completion](#chat-completion)
  - [Available Models](#available-models)
- [Request/Response Formats](#requestresponse-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Streaming](#streaming)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

---

## 🌟 Overview

The AI Global Networks API provides access to advanced AI language models through a simple REST interface. The API supports:

- **Multiple AI Models** - Llama, Mixtral, Gemma, and more
- **Streaming Responses** - Real-time word-by-word output
- **Chat Completions** - Conversational AI interactions
- **Model Information** - Query available models
- **Health Monitoring** - Check API status

**API Version:** `v1`  
**Protocol:** `HTTP/HTTPS`  
**Format:** `JSON`  
**Streaming:** `Server-Sent Events (SSE)`

---

## 🔐 Authentication

The API uses **Groq API Key** authentication configured on the server side.

### **Server Configuration**

Authentication is handled via environment variables:

```bash
# .env file
GROQ_API_KEY=gsk_your_api_key_here
```

### **Client Requests**

Clients do **not** need to provide authentication. The server proxies requests to Groq API with the configured key.

```javascript
// No Authorization header needed
fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* ... */ })
})
```

---

## 🌐 Base URL

### **Local Development**
```
http://localhost:3000
```

### **Production**
```
https://your-domain.com
```

### **API Prefix**
All endpoints are prefixed with `/api`:
```
http://localhost:3000/api/health
http://localhost:3000/api/chat
http://localhost:3000/api/models
```

---

## 📍 Endpoints

### **Health Check**

Check API status and configuration.

#### **Endpoint**
```http
GET /api/health
```

#### **Request**
```bash
curl http://localhost:3000/api/health
```

#### **Response**
```json
{
  "status": "ok",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "environment": "development",
  "apiConfigured": true
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ok"` or `"degraded"` |
| `timestamp` | string | ISO 8601 timestamp |
| `environment` | string | `"development"` or `"production"` |
| `apiConfigured` | boolean | Whether GROQ_API_KEY is set |

#### **Status Codes**

| Code | Description |
|------|-------------|
| `200` | API is healthy |
| `503` | API key not configured |

---

### **Chat Completion**

Send messages to AI models and receive responses.

#### **Endpoint**
```http
POST /api/chat
```

#### **Request Headers**
```http
Content-Type: application/json
```

#### **Request Body**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is AI Global Networks?"
    }
  ],
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": true
}
```

#### **Request Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `messages` | array | **Yes** | - | Array of message objects |
| `model` | string | No | `llama-3.3-70b-versatile` | Model identifier |
| `temperature` | number | No | `0.7` | Randomness (0-2) |
| `max_tokens` | number | No | `2048` | Maximum response length |
| `stream` | boolean | No | `false` | Enable streaming |

#### **Message Object**

```json
{
  "role": "user",
  "content": "Your message here"
}
```

**Roles:**
- `system` - System instructions (added automatically)
- `user` - User messages
- `assistant` - AI responses (for context)

#### **Response (Non-Streaming)**

```json
{
  "message": "AI Global Networks is a leading company specializing in AI automation and integration solutions...",
  "model": "llama-3.3-70b-versatile",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 120,
    "total_tokens": 165
  }
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | AI-generated response |
| `model` | string | Model used for generation |
| `usage` | object | Token usage statistics |

#### **Response (Streaming)**

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

```
data: {"choices":[{"delta":{"content":"AI"}}]}

data: {"choices":[{"delta":{"content":" Global"}}]}

data: {"choices":[{"delta":{"content":" Networks"}}]}

data: [DONE]
```

See [Streaming](#streaming) section for details.

#### **Status Codes**

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `500` | Server Error |
| `503` | API key not configured |

---

### **Available Models**

Retrieve list of available AI models.

#### **Endpoint**
```http
GET /api/models
```

#### **Request**
```bash
curl http://localhost:3000/api/models
```

#### **Response**
```json
{
  "data": [
    {
      "id": "llama-3.3-70b-versatile",
      "object": "model",
      "created": 1704096000,
      "owned_by": "groq"
    },
    {
      "id": "llama-3.3-70b-specdec",
      "object": "model",
      "created": 1704096000,
      "owned_by": "groq"
    },
    {
      "id": "llama-3.1-8b-instant",
      "object": "model",
      "created": 1704096000,
      "owned_by": "groq"
    },
    {
      "id": "mixtral-8x7b-32768",
      "object": "model",
      "created": 1704096000,
      "owned_by": "groq"
    },
    {
      "id": "gemma2-9b-it",
      "object": "model",
      "created": 1704096000,
      "owned_by": "groq"
    }
  ]
}
```

#### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | Array of model objects |
| `id` | string | Model identifier |
| `object` | string | Object type (always "model") |
| `created` | number | Unix timestamp |
| `owned_by` | string | Model provider |

#### **Status Codes**

| Code | Description |
|------|-------------|
| `200` | Success |
| `500` | Failed to fetch models |

---

## 📤 Request/Response Formats

### **Content Type**
All requests and responses use `application/json` except for streaming responses which use `text/event-stream`.

### **Request Format**
```http
POST /api/chat HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Content-Length: 123

{
  "messages": [...],
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7
}
```

### **Response Format (Success)**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Response text here",
  "model": "llama-3.3-70b-versatile",
  "usage": {...}
}
```

### **Response Format (Error)**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Messages array is required and cannot be empty"
}
```

---

## ❌ Error Handling

### **Error Response Format**

```json
{
  "error": "Error message describing what went wrong"
}
```

### **Common Errors**

#### **400 Bad Request**
```json
{
  "error": "Messages array is required and cannot be empty"
}
```

**Causes:**
- Missing `messages` parameter
- Empty `messages` array
- Invalid message format
- Temperature out of range (0-2)
- Max tokens out of range (1-4096)

#### **500 Internal Server Error**
```json
{
  "error": "Server configuration error"
}
```

**Causes:**
- GROQ_API_KEY not configured
- Groq API error
- Network error

#### **503 Service Unavailable**
```json
{
  "status": "degraded",
  "apiConfigured": false
}
```

**Causes:**
- API key not set in environment

### **Error Handling Best Practices**

```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  console.log(data.message);
} catch (error) {
  console.error('API Error:', error.message);
  // Display user-friendly error message
}
```

---

## ⏱️ Rate Limiting

### **Current Limits**
- **Rate:** 30 requests per minute
- **Window:** 60 seconds (sliding)
- **Scope:** Per API endpoint

### **Rate Limit Headers**
Currently not implemented, but planned:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704096000
```

### **Rate Limit Exceeded**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded. Try again in 30 seconds."
}
```

### **Best Practices**
- Implement exponential backoff
- Cache responses when possible
- Use streaming to reduce total requests
- Monitor rate limit headers (when available)

---

## 📡 Streaming

### **Overview**

Streaming allows you to receive AI responses in real-time as they're generated, rather than waiting for the complete response.

### **Enable Streaming**

Set `stream: true` in your request:

```json
{
  "messages": [...],
  "stream": true
}
```

### **Streaming Response Format**

Server-Sent Events (SSE) format:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" there"}}]}

data: {"choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

### **Parsing Streaming Response**

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder('utf-8');
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'data: [DONE]') continue;
    
    if (trimmed.startsWith('data: ')) {
      const jsonStr = trimmed.slice(6);
      
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices[0]?.delta?.content || '';
        
        if (content) {
          // Display content in real-time
          console.log(content);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}
```

### **Streaming vs Non-Streaming**

| Feature | Streaming | Non-Streaming |
|---------|-----------|---------------|
| **Speed** | Instant first word | Wait for complete response |
| **UX** | Better (real-time) | Slower (loading spinner) |
| **Complexity** | Higher | Lower |
| **Use Case** | Chatbots, live demos | Batch processing |

---

## 💻 Code Examples

### **JavaScript (Fetch API)**

#### **Simple Request**
```javascript
async function sendMessage(message) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      stream: false
    })
  });

  const data = await response.json();
  return data.message;
}

// Usage
const reply = await sendMessage('What is AI?');
console.log(reply);
```

#### **Streaming Request**
```javascript
async function streamMessage(message, onChunk) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content) onChunk(content);
        } catch (e) {}
      }
    }
  }
}

// Usage
await streamMessage('Hello!', (chunk) => {
  process.stdout.write(chunk);
});
```

### **Python (Requests)**

```python
import requests
import json

def send_message(message):
    url = 'http://localhost:3000/api/chat'
    
    payload = {
        'messages': [
            {'role': 'user', 'content': message}
        ],
        'model': 'llama-3.3-70b-versatile',
        'temperature': 0.7,
        'stream': False
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    return data['message']

# Usage
reply = send_message('What is AI?')
print(reply)
```

### **cURL**

#### **Non-Streaming**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is AI?"}
    ],
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "stream": false
  }'
```

#### **Streaming**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "messages": [
      {"role": "user", "content": "What is AI?"}
    ],
    "stream": true
  }'
```

### **Node.js (axios)**

```javascript
const axios = require('axios');

async function sendMessage(message) {
  try {
    const response = await axios.post('http://localhost:3000/api/chat', {
      messages: [
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7
    });

    return response.data.message;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
sendMessage('What is AI?')
  .then(reply => console.log(reply))
  .catch(error => console.error(error));
```

---

## ✅ Best Practices

### **1. Message Context**

Include conversation history for context:

```javascript
const messages = [
  { role: 'user', content: 'What is AI?' },
  { role: 'assistant', content: 'AI is artificial intelligence...' },
  { role: 'user', content: 'Tell me more' }  // Context from previous
];
```

### **2. Temperature Settings**

Choose appropriate temperature for your use case:

| Temperature | Use Case |
|-------------|----------|
| `0.0 - 0.3` | Factual answers, code generation |
| `0.4 - 0.7` | Balanced (recommended) |
| `0.8 - 1.2` | Creative writing |
| `1.3 - 2.0` | Highly creative, experimental |

### **3. Error Handling**

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/chat', {...});
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  // Process data
} catch (error) {
  // Show user-friendly error
  console.error('Failed to get response:', error.message);
}
```

### **4. Streaming Implementation**

Use buffering to handle incomplete chunks:

```javascript
let buffer = '';  // IMPORTANT: Buffer for incomplete chunks

// Add to buffer
buffer += chunk;

// Split and keep incomplete
const lines = buffer.split('\n');
buffer = lines.pop() || '';  // Keep last incomplete line
```

### **5. Rate Limiting**

Implement client-side throttling:

```javascript
let lastRequest = 0;
const MIN_INTERVAL = 2000; // 2 seconds

async function sendMessage(message) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;
  
  if (timeSinceLastRequest < MIN_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequest = Date.now();
  // Send request...
}
```

### **6. Token Management**

Monitor token usage to optimize costs:

```javascript
const response = await fetch('/api/chat', {...});
const data = await response.json();

console.log('Tokens used:', data.usage.total_tokens);
// Adjust max_tokens based on usage
```

### **7. Model Selection**

Choose the right model for your needs:

```javascript
// For simple queries
const simpleModel = 'llama-3.1-8b-instant';

// For complex reasoning
const complexModel = 'llama-3.3-70b-versatile';

// For speed
const fastModel = 'llama-3.3-70b-specdec';
```

---

## 🔒 Security Considerations

### **1. API Key Protection**

- ✅ Store API key in `.env` file
- ✅ Never commit `.env` to version control
- ✅ Use server-side proxy (as implemented)
- ❌ Never expose API key in client code

### **2. Input Validation**

Server validates all inputs:

```javascript
// Implemented in server.js
if (!messages || !Array.isArray(messages) || messages.length === 0) {
  return res.status(400).json({ error: 'Invalid messages' });
}
```

### **3. CORS Configuration**

```javascript
// server.js
app.use(cors());  // Enable for all origins

// Production: Restrict origins
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

### **4. Rate Limiting**

Implement to prevent abuse (planned feature).

---

## 📚 Additional Resources

- **Groq API Docs**: https://console.groq.com/docs
- **SSE Specification**: https://html.spec.whatwg.org/multipage/server-sent-events.html
- **Project README**: [README.md](./README.md)
- **Troubleshooting**: [README.md#troubleshooting](./README.md#troubleshooting)

---

## 📞 Support

For API support:
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-global-networks/issues)
- **Email**: support@aiglobalnetworks.com
- **Docs**: [Full Documentation](./README.md)

---

<div align="center">

**API Documentation v1.0**

Built with ❤️ by AI Global Networks Team

[Website](https://aiglobalnetworks.com) • [GitHub](https://github.com/yourusername/ai-global-networks)

</div>