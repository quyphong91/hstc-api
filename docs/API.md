# HSTC API Reference

Complete API documentation for the HSTC Vietnamese HS Code Classification API.

**Base URL:** `https://api.tracuuhs.com/v1`

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Search Notes](#post-apiv1search)
  - [List Chapters](#get-apiv1chapters)
  - [Get Chapter](#get-apiv1chapterschapternumber)
  - [Get Heading](#get-apiv1headingsheadingcode)
  - [Health Check](#get-apiv1health)
- [OpenAPI Schema](#openapi-schema-for-custom-gpts)

---

## Authentication

API keys are **optional** and used for:
- Higher rate limits (5000/hour vs 1000/hour)
- Usage analytics (not for billing)
- Tracking API usage patterns

### Using API Keys

Include the API key in the `Authorization` header:

```bash
Authorization: Bearer your-api-key-here
```

**Example:**
```bash
curl -X POST https://api.tracuuhs.com/v1/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"keyword": "coffee"}'
```

**Get a Free API Key:** [https://tracuuhs.com/developer](https://tracuuhs.com/developer)

---

## Rate Limiting

### Limits

| Tier | Rate Limit | Applies To |
|------|------------|------------|
| **Public** | 1000 requests/hour | Per IP address |
| **With API Key** | 5000 requests/hour | Per API key |

### Rate Limit Headers

All responses include rate limit information:

```
RateLimit-Policy: 1000;w=3600
RateLimit-Limit: 1000
RateLimit-Remaining: 995
RateLimit-Reset: 3600
```

- `RateLimit-Limit`: Maximum requests allowed in the time window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Seconds until the limit resets

### Exceeding Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 1000 requests per hour per IP. Consider getting a free API key for higher limits (5000/hour).",
    "details": {
      "limit": 1000,
      "windowMs": 3600000,
      "suggestion": "Visit https://tracuuhs.com/developer to get a free API key, or self-host from https://github.com/quyphong91/hstc-api"
    }
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z"
  }
}
```

---

## Error Handling

All error responses follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "reason": "detailed_reason"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-14T10:30:00Z"
  }
}
```

### HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| `200` | OK | Request successful |
| `400` | INVALID_REQUEST | Validation error (missing/invalid parameters) |
| `401` | INVALID_API_KEY | API key is invalid or too short |
| `404` | NOT_FOUND | Chapter, heading, or endpoint not found |
| `429` | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| `500` | INTERNAL_SERVER_ERROR | Server error |

### Error Examples

**Missing Required Field:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "keyword is required and must be a non-empty string",
    "details": {
      "field": "body",
      "reason": "keyword is required and must be a non-empty string"
    }
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2026-02-14T10:30:00Z"
  }
}
```

**Invalid API Key:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "Invalid API key. Visit https://tracuuhs.com/developer to get a valid key."
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z"
  }
}
```

---

## Endpoints

### POST /api/v1/search

Search through Explanatory Notes (EN) and Supplementary Explanatory Notes (SEN) for HS code classification.

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `keyword` | string | Yes | - | Search keyword (Vietnamese or English) |
| `language` | string | No | `"vi"` | Search language: `"vi"` or `"en"` |
| `matchType` | string | No | `"tokens"` | Match strategy: `"tokens"` (flexible) or `"exact"` (strict) |
| `material` | string | No | - | Material/composition filter |
| `functionFeature` | string | No | - | Function/usage filter |
| `maxResults` | number | No | `20` | Maximum results (1-100) |

**Example Request:**

```bash
curl -X POST https://api.tracuuhs.com/v1/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "keyword": "plastic bottles",
    "language": "en",
    "matchType": "tokens",
    "material": "plastic",
    "functionFeature": "water storage",
    "maxResults": 10
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "hsCode": "3923",
        "source": "en",
        "snippet": "Carboys, bottles, flasks and similar articles for the conveyance or packing of goods...",
        "chapterNumber": 39
      },
      {
        "hsCode": "3924",
        "source": "sen",
        "snippet": "...plastic containers for household use including bottles...",
        "chapterNumber": 39
      }
    ],
    "totalMatches": 15,
    "query": {
      "keyword": "plastic bottles",
      "filters": {
        "material": "plastic",
        "functionFeature": "water storage"
      }
    }
  },
  "meta": {
    "requestId": "req_1771049564584",
    "timestamp": "2026-02-14T06:12:44.584Z",
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

**Match Types:**

- **`tokens`** (default): Flexible matching - all words in the keyword must appear in the text (not necessarily consecutive)
  - Example: `"plastic bottles"` matches text containing both "plastic" and "bottles" anywhere
- **`exact`**: Strict matching - the exact phrase must appear in the text
  - Example: `"plastic bottles"` only matches text with the exact phrase "plastic bottles"

**Vietnamese Example:**

```bash
curl -X POST https://api.tracuuhs.com/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "sữa bò",
    "language": "vi",
    "maxResults": 5
  }'
```

---

### GET /api/v1/chapters

List all available chapters with metadata.

**Query Parameters:** None

**Example Request:**

```bash
curl https://api.tracuuhs.com/v1/chapters
```

**Example Response:**

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
      },
      {
        "chapterNumber": 2,
        "title": {
          "vi": "Thịt và các sản phẩm dạng thịt ăn được",
          "en": "Meat and edible meat offal"
        },
        "hasEN": true,
        "hasSEN": true
      }
    ],
    "total": 97
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z",
    "attribution": {
      "poweredBy": "tracuuhs.com",
      "documentation": "https://tracuuhs.com/api/docs",
      "source": "open-source",
      "github": "https://github.com/quyphong91/hstc-api"
    }
  }
}
```

---

### GET /api/v1/chapters/:chapterNumber

Get detailed Explanatory Notes for a specific chapter.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `chapterNumber` | number | Chapter number (1-97) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | `"both"` | Data source: `"en"`, `"sen"`, or `"both"` |
| `language` | string | `"vi"` | Response language: `"vi"` or `"en"` |

**Example Request:**

```bash
curl "https://api.tracuuhs.com/v1/chapters/4?source=both&language=vi"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "chapterNumber": 4,
    "title": {
      "vi": "Sản phẩm từ sữa; trứng chim; mật ong thiên nhiên; các sản phẩm ăn được có nguồn gốc động vật, chưa được chi tiết hoặc ghi ở nơi khác",
      "en": "Dairy produce; birds' eggs; natural honey; edible products of animal origin, not elsewhere specified or included"
    },
    "enNotes": [
      {
        "type": "heading",
        "vi": "04.01",
        "en": "04.01"
      },
      {
        "type": "paragraph",
        "vi": "Nhóm này bao gồm sữa và kem sữa...",
        "en": "This heading covers milk and cream..."
      }
    ],
    "senNotes": [
      {
        "type": "heading",
        "vi": "0401.10.10 0401.20.10",
        "en": "0401.10.10 0401.20.10"
      },
      {
        "type": "paragraph",
        "vi": "Chất béo sữa không quá 1% tính theo trọng lượng",
        "en": "Of a fat content, by weight, not exceeding 1%"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z",
    "attribution": {
      "poweredBy": "tracuuhs.com",
      "documentation": "https://tracuuhs.com/api/docs",
      "source": "open-source",
      "github": "https://github.com/quyphong91/hstc-api"
    }
  }
}
```

---

### GET /api/v1/headings/:headingCode

Get detailed Explanatory Notes for a specific 4-digit HS heading.

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `headingCode` | string | 4-digit HS heading code (e.g., "0401") |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | `"vi"` | Response language: `"vi"` or `"en"` |

**Example Request:**

```bash
curl "https://api.tracuuhs.com/v1/headings/0401?language=en"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "headingCode": "0401",
    "chapterNumber": 4,
    "title": {
      "vi": "Sữa và kem sữa, chưa cô đặc hoặc chưa thêm đường hoặc chất làm ngọt khác",
      "en": "Milk and cream, not concentrated nor containing added sugar or other sweetening matter"
    },
    "enNotes": [
      {
        "type": "heading",
        "vi": "04.01",
        "en": "04.01"
      },
      {
        "type": "paragraph",
        "vi": "Nhóm này bao gồm sữa và kem sữa tươi...",
        "en": "This heading covers fresh milk and cream..."
      }
    ],
    "senNotes": [
      {
        "type": "paragraph",
        "vi": "Sản phẩm có hàm lượng chất béo sữa không quá 1%...",
        "en": "Products with milk fat content not exceeding 1%..."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z",
    "attribution": {
      "poweredBy": "tracuuhs.com",
      "documentation": "https://tracuuhs.com/api/docs",
      "source": "open-source",
      "github": "https://github.com/quyphong91/hstc-api"
    }
  }
}
```

---

### GET /api/v1/health

Health check endpoint to verify API availability.

**Example Request:**

```bash
curl https://api.tracuuhs.com/v1/health
```

**Example Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-14T10:30:00Z",
  "dataVersion": "2024",
  "uptime": 3600.5
}
```

---

## OpenAPI Schema for Custom GPTs

Use this OpenAPI 3.1 schema to integrate HSTC API with ChatGPT Custom GPTs or other OpenAPI-compatible platforms.

```yaml
openapi: 3.1.0
info:
  title: HSTC Vietnamese HS Code API
  description: API for searching Vietnamese HS Code Explanatory Notes and Supplementary Explanatory Notes
  version: 1.0.0
  contact:
    name: HSTC API Support
    url: https://tracuuhs.com/api/docs

servers:
  - url: https://api.tracuuhs.com/v1
    description: Production server

paths:
  /search:
    post:
      operationId: searchHSNotes
      summary: Search HS Code Explanatory Notes
      description: Search across EN (Explanatory Notes) and SEN (Supplementary Explanatory Notes) for keywords with optional material and function filters
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                keyword:
                  type: string
                  description: Search keyword in Vietnamese or English
                  example: "plastic bottles"
                language:
                  type: string
                  enum: [vi, en]
                  default: vi
                  description: Search language
                matchType:
                  type: string
                  enum: [tokens, exact]
                  default: tokens
                  description: Match strategy - tokens (flexible) or exact (strict)
                material:
                  type: string
                  description: Optional material/composition filter
                  example: "plastic"
                functionFeature:
                  type: string
                  description: Optional function/usage filter
                  example: "water storage"
                maxResults:
                  type: integer
                  default: 20
                  minimum: 1
                  maximum: 100
                  description: Maximum results to return
              required:
                - keyword
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      matches:
                        type: array
                        items:
                          type: object
                          properties:
                            hsCode:
                              type: string
                              description: HS Code or Heading (4-digit)
                            source:
                              type: string
                              enum: [en, sen]
                              description: Source of the match (EN or SEN)
                            snippet:
                              type: string
                              description: Relevant text excerpt (~150 chars)
                            chapterNumber:
                              type: integer
                              description: Chapter number (1-97)
                      totalMatches:
                        type: integer
                      query:
                        type: object
                  meta:
                    type: object
                    properties:
                      requestId:
                        type: string
                      timestamp:
                        type: string
                        format: date-time
                      processingTime:
                        type: integer
                      attribution:
                        type: object
        '400':
          description: Bad request (validation error)
        '429':
          description: Rate limit exceeded
      security:
        - BearerAuth: []

  /chapters:
    get:
      operationId: listChapters
      summary: List all available chapters
      description: Get a list of all 97 chapters with titles and metadata
      responses:
        '200':
          description: List of chapters
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      chapters:
                        type: array
                        items:
                          type: object
                          properties:
                            chapterNumber:
                              type: integer
                            title:
                              type: object
                              properties:
                                vi:
                                  type: string
                                en:
                                  type: string
                            hasEN:
                              type: boolean
                            hasSEN:
                              type: boolean
      security:
        - BearerAuth: []

  /chapters/{chapterNumber}:
    get:
      operationId: getChapterDetails
      summary: Get chapter details
      description: Get detailed Explanatory Notes for a specific chapter
      parameters:
        - name: chapterNumber
          in: path
          required: true
          schema:
            type: integer
            minimum: 1
            maximum: 97
          description: Chapter number (1-97)
        - name: source
          in: query
          schema:
            type: string
            enum: [en, sen, both]
            default: both
          description: Data source
        - name: language
          in: query
          schema:
            type: string
            enum: [vi, en]
            default: vi
          description: Response language
      responses:
        '200':
          description: Chapter details
        '404':
          description: Chapter not found
      security:
        - BearerAuth: []

  /headings/{headingCode}:
    get:
      operationId: getHeadingDetails
      summary: Get heading details
      description: Get detailed Explanatory Notes for a specific 4-digit HS heading
      parameters:
        - name: headingCode
          in: path
          required: true
          schema:
            type: string
            pattern: '^\\d{4}$'
          description: 4-digit HS heading code (e.g., "0401")
        - name: language
          in: query
          schema:
            type: string
            enum: [vi, en]
            default: vi
          description: Response language
      responses:
        '200':
          description: Heading details
        '404':
          description: Heading not found
      security:
        - BearerAuth: []

  /health:
    get:
      operationId: healthCheck
      summary: Health check
      description: Check API availability and version
      responses:
        '200':
          description: API is healthy
      security: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
      description: Optional API key for higher rate limits (5000/hour vs 1000/hour). Get a free key at https://tracuuhs.com/developer
```

### Custom GPT Instructions Template

Use these instructions when creating a Custom GPT:

```
You are an expert in Vietnamese HS Code classification using the Harmonized System nomenclature. You help users identify correct HS codes for their products by searching through official Explanatory Notes (EN) and Supplementary Explanatory Notes (SEN).

When a user describes a product:
1. Use the searchHSNotes action to find relevant HS codes in the HSTC API
2. Analyze the Explanatory Notes snippets returned
3. If needed, use getHeadingDetails to get full context for specific headings
4. Provide the most likely HS code(s) with clear explanations
5. Cite specific excerpts from EN/SEN that support your recommendation
6. **IMPORTANT: Provide an audit trail** for user self-review:
   - For each suggested HS code, include direct links to full Explanatory Notes
   - EN (Explanatory Notes) link format: https://tracuuhs.com/chu-giai-hs/full/{chapterNumber}
   - SEN (Supplementary Explanatory Notes) link format: https://tracuuhs.com/chu-giai-sen/full/{chapterNumber}
   - Example: "You can review the full EN for Chapter 39 at: https://tracuuhs.com/chu-giai-hs/full/39"
7. Always warn that final classification should be verified with Vietnam Customs

Search strategy:
- Start with keyword search using product description
- Add material filter if user mentions material (e.g., "plastic", "steel")
- Add function filter if user mentions usage (e.g., "water storage")
- Use Vietnamese language for Vietnamese queries, English for English queries
- If initial search returns no results, try broader keywords

Response format:
1. Suggested HS code(s) with confidence level
2. Explanation with specific EN/SEN excerpts
3. **Audit trail section** with links to full notes for self-review
4. Disclaimer about verifying with customs

Always respond in Vietnamese unless the user explicitly requests English.
Be concise but thorough. Prioritize accuracy over speed.
Enable user self-review by providing traceable sources.
```

---

## Code Examples

### JavaScript / Node.js

```javascript
const HSTC_API_KEY = 'your-api-key';
const HSTC_API_URL = 'https://api.tracuuhs.com/v1';

async function searchHSCode(keyword, language = 'vi') {
  const response = await fetch(`${HSTC_API_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HSTC_API_KEY}`
    },
    body: JSON.stringify({
      keyword,
      language,
      maxResults: 10
    })
  });

  const data = await response.json();
  return data.data.matches;
}

// Usage
const results = await searchHSCode('điện thoại di động', 'vi');
console.log(results);
```

### Python

```python
import requests

HSTC_API_KEY = 'your-api-key'
HSTC_API_URL = 'https://api.tracuuhs.com/v1'

def search_hs_code(keyword, language='vi'):
    response = requests.post(
        f'{HSTC_API_URL}/search',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {HSTC_API_KEY}'
        },
        json={
            'keyword': keyword,
            'language': language,
            'maxResults': 10
        }
    )
    data = response.json()
    return data['data']['matches']

# Usage
results = search_hs_code('điện thoại di động', 'vi')
print(results)
```

### PHP

```php
<?php

function searchHSCode($keyword, $language = 'vi') {
    $apiKey = 'your-api-key';
    $apiUrl = 'https://api.tracuuhs.com/v1/search';

    $data = [
        'keyword' => $keyword,
        'language' => $language,
        'maxResults' => 10
    ];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    return $result['data']['matches'];
}

// Usage
$results = searchHSCode('điện thoại di động', 'vi');
print_r($results);
?>
```

---

## Need Help?

- **Documentation**: [https://tracuuhs.com/api/docs](https://tracuuhs.com/api/docs)
- **GitHub Issues**: [https://github.com/quyphong91/hstc-api/issues](https://github.com/quyphong91/hstc-api/issues)
- **Developer Portal**: [https://tracuuhs.com/developer](https://tracuuhs.com/developer)

---

**Powered by [tracuuhs.com](https://tracuuhs.com)** - Free and open source forever.
