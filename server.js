/**
 * AI Global Networks - Backend Server
 * Clean, modular, maintainable Express server with Groq API integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ==================== CONFIGURATION ====================
const CONFIG = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_API_URL: "https://api.groq.com/openai/v1/chat/completions",
    MAX_TOKENS: 2048,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX: 30, // 30 requests per minute
};

// ==================== LOGGER ====================
const Logger = {
    info: (message, meta = {}) => {
        if (CONFIG.NODE_ENV === 'development') {
            console.log(`[INFO] ${message}`, meta);
        }
    },

    error: (message, error = {}) => {
        console.error(`[ERROR] ${message}`, error.message || error);
    },

    warn: (message, meta = {}) => {
        if (CONFIG.NODE_ENV === 'development') {
            console.warn(`[WARN] ${message}`, meta);
        }
    },

    success: (message) => {
        console.log(`[SUCCESS] ${message}`);
    },
};

// ==================== COMPANY CONTEXT ====================
const COMPANY_CONTEXT = `You are an AI assistant for AI Global Networks, a leading company specializing in AI automation and integration solutions.

ABOUT AI GLOBAL NETWORKS:
- We help businesses automate workflows and integrate AI into their operations
- Founded with a mission to make AI accessible and practical for all industries
- Expert team with years of experience in AI, machine learning, and automation

OUR SERVICES:
1. Smart Automation - Automate repetitive tasks with AI
2. AI Integrations - Connect AI with your existing tools and apps
3. Custom AI Solutions - Personalized AI tools for your business needs
4. 24/7 Support - Round-the-clock assistance from our expert team

INDUSTRIES WE SERVE:
- Customer Support (AI chatbots, ticket automation)
- Healthcare (patient management, diagnosis assistance)
- Marketing (content generation, campaign optimization)
- Education (personalized learning, grading automation)
- Finance (fraud detection, automated reporting)

OUR APPLICATIONS:
- Sensi Sezuire - AI-powered security monitoring
- Block Spy - Blockchain intelligence and analytics
- Ubizo iMarket - Smart marketplace automation
- Woman in AI - Empowering women in technology
- Ethical AI - Responsible AI development tools
- 24/7 Property Hunter - Automated real estate finder

SKILLS DEVELOPMENT PROGRAMS:
- Cybersecurity training
- Data Science bootcamps
- Software Development courses
- Design Thinking workshops

PRICING:
- Free tier available for small businesses
- Professional plans starting at competitive rates
- Enterprise solutions with custom pricing
- No credit card required to get started

When answering questions:
- Be professional, friendly, and helpful
- Reference our specific services when relevant
- Encourage users to explore our solutions
- Provide accurate information about AI automation
- If unsure about specific pricing or technical details, suggest contacting our team
- Always maintain a positive, solution-oriented tone`;

// ==================== VALIDATORS ====================
const Validators = {
    validateApiKey() {
        if (!CONFIG.GROQ_API_KEY) {
            Logger.error('GROQ_API_KEY is not configured in environment variables');
            return false;
        }
        return true;
    },

    validateChatRequest(body) {
        const { messages, model, temperature, max_tokens } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return { valid: false, error: 'Messages array is required and cannot be empty' };
        }

        if (messages.some(msg => !msg.role || !msg.content)) {
            return { valid: false, error: 'Each message must have role and content' };
        }

        if (temperature && (temperature < 0 || temperature > 2)) {
            return { valid: false, error: 'Temperature must be between 0 and 2' };
        }

        if (max_tokens && (max_tokens < 1 || max_tokens > 4096)) {
            return { valid: false, error: 'Max tokens must be between 1 and 4096' };
        }

        return { valid: true };
    },
};

// ==================== GROQ API CLIENT ====================
const GroqClient = {
    async sendRequest(messages, options = {}) {
        const {
            model = 'llama-3.3-70b-versatile',
            temperature = 0.7,
            max_tokens = CONFIG.MAX_TOKENS,
            stream = false,
        } = options;

        const systemMessage = {
            role: 'system',
            content: COMPANY_CONTEXT,
        };

        const requestBody = {
            model,
            messages: [systemMessage, ...messages],
            temperature,
            max_tokens,
            top_p: 1,
            stream,
        };

        try {
            const response = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            return response;
        } catch (error) {
            Logger.error('Groq API request failed', error);
            throw error;
        }
    },
};

// ==================== EXPRESS APP SETUP ====================
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Request logging middleware (development only)
if (CONFIG.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            Logger.info(`${req.method} ${req.path}`, {
                status: res.statusCode,
                duration: `${duration}ms`
            });
        });
        next();
    });
}

// ==================== API ROUTES ====================

/**
 * Health Check Endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    const isHealthy = Validators.validateApiKey();

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: CONFIG.NODE_ENV,
        apiConfigured: !!CONFIG.GROQ_API_KEY,
    });
});

/**
 * Chat Endpoint - Streaming & Non-Streaming
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
    // Validate API key
    if (!Validators.validateApiKey()) {
        return res.status(500).json({
            error: 'Server configuration error.',
        });
    }

    // Validate request body
    const validation = Validators.validateChatRequest(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    const { messages, model, temperature, max_tokens, stream = false } = req.body;

    try {
        const response = await GroqClient.sendRequest(messages, {
            model,
            temperature,
            max_tokens,
            stream,
        });

        // Check for API errors
        if (!response.ok) {
            const errorData = await response.json();
            Logger.error('Groq API error', errorData);

            return res.status(response.status).json({
                error: errorData.error?.message || 'AI service error',
            });
        }

        // Handle streaming response
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        res.write('data: [DONE]\n\n');
                        res.end();
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            res.write(`${line}\n\n`);
                        }
                    }
                }
            } catch (streamError) {
                Logger.error('Streaming error', streamError);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Streaming failed' });
                }
            }
        }
        // Handle non-streaming response
        else {
            const data = await response.json();

            res.json({
                message: data.choices[0]?.message?.content || '',
                model: data.model,
                usage: data.usage,
            });
        }
    } catch (error) {
        Logger.error('Chat endpoint error', error);

        if (!res.headersSent) {
            res.status(500).json({
                error: 'An unexpected error occurred. Please try again.',
            });
        }
    }
});

/**
 * Available Models Endpoint
 * GET /api/models
 */
app.get('/api/models', async (req, res) => {
    if (!Validators.validateApiKey()) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        Logger.error('Models endpoint error', error);
        res.status(500).json({ error: 'Failed to fetch available models' });
    }
});

// ==================== STATIC ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    Logger.error('Unhandled error', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: CONFIG.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

// ==================== SERVER STARTUP ====================
const server = app.listen(CONFIG.PORT, () => {
    Logger.success(`Server running on port ${CONFIG.PORT}`);
    Logger.info(`Environment: ${CONFIG.NODE_ENV}`);
    Logger.info(`API Key: ${CONFIG.GROQ_API_KEY ? 'Configured' : 'Not Set'}`);

    if (!CONFIG.GROQ_API_KEY) {
        Logger.warn('GROQ_API_KEY not found. Please set it in .env file');
    }
});

// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = (signal) => {
    Logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(() => {
        Logger.success('Server closed successfully');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        Logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection', { reason, promise });
});

// ==================== EXPORTS ====================
module.exports = app;