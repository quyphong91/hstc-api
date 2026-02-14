# HSTC API

**Vietnamese HS Code Classification API** - Free, open-source REST API for searching Vietnamese Harmonized System (HS) Code Explanatory Notes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 🌟 Features

- 🔍 **Bilingual Search** - Search in Vietnamese or English across 28MB of Explanatory Notes
- 📚 **Comprehensive Data** - 97 chapters with EN (Explanatory Notes) and SEN (Supplementary Explanatory Notes)
- 🚀 **Fast & Free** - Completely free with generous rate limits (1000/hour per IP)
- 🔓 **Open Source** - MIT licensed, host it yourself or use our free hosted service
- 🤖 **AI-Ready** - Perfect for ChatGPT Custom GPTs, Claude integrations, and other AI assistants
- ⚡ **High Performance** - In-memory caching, <500ms response times

## 🚀 Quick Start

### Using the Hosted API (Recommended)

```bash
# Search for HS codes
curl -X POST https://api.tracuuhs.com/v1/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "milk", "language": "en", "maxResults": 5}'
```

### Self-Hosting

```bash
# Clone the repository
git clone https://github.com/quyphong91/hstc-api.git
cd hstc-api

# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## 📖 API Endpoints

### POST /api/v1/search

Search through Explanatory Notes and Supplementary Explanatory Notes.

**Request:**
```json
{
  "keyword": "plastic bottles",
  "language": "en",
  "matchType": "tokens",
  "material": "plastic",
  "functionFeature": "water storage",
  "maxResults": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "hsCode": "3923",
        "source": "en",
        "snippet": "Carboys, bottles, flasks and similar articles...",
        "chapterNumber": 39
      }
    ],
    "totalMatches": 15,
    "query": { "keyword": "plastic bottles", "filters": {} }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-14T10:30:00Z",
    "processingTime": 27,
    "attribution": {
      "poweredBy": "tracuuhs.com",
      "documentation": "https://tracuuhs.com/api/docs",
      "source": "open-source",
      "github": "https://github.com/quyphong91/hstc-api"
    }
  }
}
```

### GET /api/v1/chapters

List all available chapters with metadata.

**Response:**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "chapterNumber": 1,
        "title": {
          "vi": "Động vật sống",
          "en": "Live animals"
        },
        "hasEN": true,
        "hasSEN": true
      }
    ]
  }
}
```

### GET /api/v1/chapters/:chapterNumber

Get detailed notes for a specific chapter.

**Query Parameters:**
- `source` (optional): `en` | `sen` | `both` (default: `both`)
- `language` (optional): `vi` | `en` (default: `vi`)

**Example:**
```bash
curl "https://api.tracuuhs.com/v1/chapters/4?source=both&language=vi"
```

### GET /api/v1/headings/:headingCode

Get detailed notes for a specific 4-digit HS heading.

**Example:**
```bash
curl "https://api.tracuuhs.com/v1/headings/0401?language=en"
```

### GET /api/v1/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-14T10:30:00Z",
  "dataVersion": "2024",
  "uptime": 3600.5
}
```

## 🔐 Authentication (Optional)

API keys are optional and used for higher rate limits and usage analytics (not for billing).

```bash
curl -X POST https://api.tracuuhs.com/v1/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"keyword": "coffee"}'
```

**Rate Limits:**
- Without API key: 1000 requests/hour per IP
- With API key: 5000 requests/hour

Get a free API key at: [https://tracuuhs.com/developer](https://tracuuhs.com/developer)

## 🤖 AI Integration Examples

### Custom GPT (ChatGPT)

Use our pre-built Custom GPT: [HSTC - Vietnamese HS Code Expert](https://chatgpt.com/g/hstc-hs-code)

Or create your own using our OpenAPI schema in [docs/API.md](docs/API.md).

### Claude Desktop (MCP Server)

Coming soon! We're working on an MCP server wrapper for Claude Desktop users.

### Direct API Integration

```javascript
// Example: Node.js / JavaScript
const response = await fetch('https://api.tracuuhs.com/v1/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    keyword: 'máy tính xách tay',
    language: 'vi',
    maxResults: 10
  })
});

const data = await response.json();
console.log(data.data.matches);
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t hstc-api .

# Run container
docker run -p 3000:3000 -e PORT=3000 hstc-api
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guides (Vercel, Railway, DigitalOcean, etc.).

## 📚 Documentation

- [API Reference](docs/API.md) - Complete endpoint documentation with examples
- [Deployment Guide](docs/DEPLOYMENT.md) - Self-hosting instructions
- [Website Documentation](https://tracuuhs.com/api/docs) - Interactive API explorer

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

**Project Structure:**
```
hstc-api/
├── src/
│   ├── data/              # JSON data files (EN/SEN notes, chapters)
│   ├── routes/            # API route handlers
│   ├── middleware/        # Auth, rate limiting, attribution
│   ├── utils/             # Search logic, data loading, types
│   ├── server.ts          # Express app setup
│   └── index.ts           # Server entry point
├── scripts/
│   └── convert-data.ts    # Data conversion utilities
├── docs/                  # Documentation
└── package.json
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs** - Open an issue on GitHub
2. **Suggest Features** - Share your ideas via GitHub issues
3. **Submit PRs** - Fix bugs, improve docs, add features
4. **Improve Data** - Submit corrections to EN/SEN notes
5. **Share Use Cases** - Show us what you built with the API!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Data Source**: Vietnamese Customs General Department
- **Powered by**: [tracuuhs.com](https://tracuuhs.com)
- **Maintained by**: [@quyphong91](https://github.com/quyphong91)

## 🌐 Links

- **Website**: [https://tracuuhs.com](https://tracuuhs.com)
- **API Documentation**: [https://tracuuhs.com/api/docs](https://tracuuhs.com/api/docs)
- **Custom GPT**: [https://tracuuhs.com/custom-gpt](https://tracuuhs.com/custom-gpt)
- **Developer Portal**: [https://tracuuhs.com/developer](https://tracuuhs.com/developer)
- **GitHub**: [https://github.com/quyphong91/hstc-api](https://github.com/quyphong91/hstc-api)

## 💬 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/quyphong91/hstc-api/issues)
- **Documentation**: [https://tracuuhs.com/api/docs](https://tracuuhs.com/api/docs)
- **Community**: Join our discussions on GitHub

---

**Made with ❤️ for the Vietnamese trade community**

Free and open source forever. Self-host or use our hosted service at [api.tracuuhs.com](https://api.tracuuhs.com)
