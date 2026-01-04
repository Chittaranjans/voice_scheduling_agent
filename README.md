# Voice Scheduling Agent

A real-time voice assistant that helps you schedule meetings using natural conversation, powered by AI and Google Calendar integration.

## Features

- 🎤 **Voice Recognition**: Speak naturally to schedule meetings
- 🤖 **AI Conversation**: Natural language understanding for dates, times, and meeting details
- 📅 **Google Calendar Integration**: Automatically creates and edits calendar events
- ✏️ **Edit Existing Events**: Change meeting times, update titles, or add attendees to events already on your calendar
- 🔊 **Text-to-Speech**: Voice responses for a hands-free experience
- 👥 **Attendee Support**: Add attendees by email to meetings
- 📋 **Calendar Context**: AI reads existing events to avoid conflicts
- 🎨 **Live Waveform Visualization**: Real-time audio visualization during recording
- 📱 **Responsive Design**: Works on desktop and mobile browsers

## Demo

1. **Connect Google Calendar**: Sign in with your Google account
2. **Click the Microphone**: Start speaking naturally
3. **Schedule a Meeting**: Say something like "Schedule a meeting with John tomorrow at 3pm"
4. **Confirm**: The AI will confirm details and create the event

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini AI
- **Calendar**: Google Calendar API
- **Authentication**: Google OAuth 2.0

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Google Cloud project with Calendar API enabled
- Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/Chittaranjans/voice_scheduling_agent.git
cd voice_scheduling_agent

# Install dependencies
npm install
# or
bun install
```

### Environment Variables

Create a `.env.local` file with the following:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Calendar API** and **Google People API**
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:3001/api/auth/callback`
6. Copy Client ID and Secret to `.env.local`

### Run Development Server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
voice-agent/
├── app/
│   ├── api/
│   │   ├── auth/           # Google OAuth endpoints
│   │   ├── calendar/       # Calendar CRUD operations
│   │   ├── conversation/   # AI conversation endpoint
│   │   └── user/           # User profile endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── voice-agent.tsx     # Main voice agent component
│   └── calendar-sidebar.tsx # Calendar sidebar component
├── lib/
│   ├── gemini.ts           # Gemini AI integration
│   ├── google-calendar.ts  # Google Calendar API
│   └── utils.ts
└── public/
    └── icon.svg            # App favicon
```

## Architecture

### System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Browser/UI    │────▶│   Next.js API    │────▶│  Google APIs    │
│   (React)       │     │   Routes         │     │  (Calendar/AI)  │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Web Speech API │     │  HTTP-Only       │
│  (Voice I/O)    │     │  Cookies         │
└─────────────────┘     └──────────────────┘
```

### Request Flow

1. **User speaks** → Web Speech API converts voice to text
2. **Text sent to** `/api/conversation` → Gemini AI processes natural language
3. **AI extracts** meeting details (date, time, title, attendees)
4. **Calendar API** creates/updates events via `/api/calendar/create`
5. **Response spoken** back to user via Text-to-Speech

## Authentication & Security

### OAuth 2.0 Flow

```
User clicks "Connect"
        │
        ▼
┌─────────────────────────────────────────┐
│  GET /api/auth/google                   │
│  → Generates Google OAuth URL           │
│  → Redirects to Google consent screen   │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  User grants permission on Google       │
│  → Google redirects to callback URL     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  GET /api/auth/callback                 │
│  → Exchanges code for access token      │
│  → Stores token in HTTP-only cookie     │
│  → Redirects to app                     │
└─────────────────────────────────────────┘
```

### Cookie Security

| Security Feature | Implementation |
|-----------------|----------------|
| **HTTP-Only** | Cookies cannot be accessed by JavaScript (XSS protection) |
| **Secure Flag** | Cookies only sent over HTTPS in production |
| **SameSite** | Set to `Lax` to prevent CSRF attacks |
| **Server-Side Only** | Tokens never exposed to client-side code |

### How Your Data is Protected

1. **No Password Storage**: We use Google OAuth - we never see or store your Google password
2. **Limited Scopes**: We only request access to:
   - `calendar` - Read/write calendar events
   - `calendar.events` - Manage calendar events
   - `userinfo.profile` - Your name (for personalized greetings)
   - `userinfo.email` - Your email address
3. **Token Security**: Access tokens are stored in HTTP-only cookies, inaccessible to JavaScript
4. **No Database**: No user data is stored on our servers - everything is session-based
5. **Disconnect Anytime**: Click "Disconnect" to immediately revoke access and clear cookies

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Initiates OAuth flow |
| `/api/auth/callback` | GET | Handles OAuth callback |
| `/api/auth/status` | GET | Checks if user is authenticated |
| `/api/auth/disconnect` | POST | Clears auth cookies |
| `/api/conversation` | POST | Processes voice input with AI |
| `/api/calendar/create` | POST | Creates/updates calendar events |
| `/api/calendar/events` | GET | Fetches upcoming events |
| `/api/user/profile` | GET | Gets user profile info |

## Author

**Chittaranjan**
- GitHub: [@chittaranjans](https://github.com/chittaranjans)
- Email: chittaedu18@gmail.com
