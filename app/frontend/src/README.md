# Code Review Cockpit

A unique, visually striking React frontend for an AI-powered code review platform. Features a "DevOps cockpit" aesthetic with dark theme, neon accents, and real-time analysis capabilities.

## Features

### 🏠 Storytelling Home Page
- Animated hero section with gradient text and glowing effects
- Visual journey showing the 4-step review process
- Feature showcase with hover animations
- Call-to-action section

### 📊 Mission Control Dashboard
- Real-time review status monitoring
- Filterable review cards (by status, source, search)
- Quick statistics overview
- Responsive grid layout

### 🔍 Review Detail View
- 3-zone layout: header, file sidebar, comments panel
- Grouped comments by file with filtering
- Timeline and metadata views
- Severity and category badges
- Expandable suggested fixes

### 📤 Submission Interfaces
- **Manual Diff**: Paste git diffs for instant analysis
- **GitHub PR**: Connect repository and PR number
- Real-time status updates and polling
- Example data loading

### ⚙️ Settings & Configuration
- API key management (local storage)
- Read-only backend configuration display
- Pipeline, LLM, and GitHub settings
- Security warnings and usage guidelines

### 📈 Metrics & Observability
- Real-time system metrics
- Interactive charts (Recharts)
- LLM performance tracking
- Review status breakdown

## Design System

### Color Palette
- **Cyan** (`#00d9ff`): Primary actions, status indicators
- **Purple** (`#a855f7`): GitHub integration, secondary actions
- **Green** (`#10b981`): Success states, completed reviews
- **Yellow** (`#fbbf24`): Warnings, pending states
- **Red** (`#ef4444`): Errors, critical issues

### Visual Features
- Dark mode by default with subtle gradients
- Neon glow effects on interactive elements
- Animated status indicators
- Custom badges and pills
- Motion animations (Framer Motion)

## Tech Stack

- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Shadcn/ui** components (customized)
- **Recharts** for data visualization
- **Motion (Framer Motion)** for animations
- **Sonner** for toast notifications

## Backend Integration

The frontend expects these backend endpoints:

- `POST /api/v1/reviews` - Create new review
- `GET /api/v1/reviews/:id` - Get review details
- `GET /api/v1/reviews` - List reviews (optional)
- `GET /api/v1/config` - Get configuration (optional)
- `GET /metrics` - Prometheus metrics (optional)
- `GET /health` - Health check

### Environment Variables

Create a `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### API Key

The service requires an API key (X-API-Key header). Configure it in Settings page.

## Project Structure

```
/
├── api/
│   └── client.ts           # API client with type-safe methods
├── components/
│   ├── common/             # Reusable components (StatusPill, etc.)
│   ├── dashboard/          # Dashboard-specific components
│   ├── home/               # Home page sections
│   ├── layout/             # Layout components (AppShell)
│   ├── review/             # Review detail components
│   └── ui/                 # Shadcn components
├── pages/
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── ReviewDetailPage.tsx
│   ├── ManualSubmitPage.tsx
│   ├── GitHubSubmitPage.tsx
│   ├── SettingsPage.tsx
│   └── MetricsPage.tsx
├── types/
│   └── index.ts            # TypeScript type definitions
└── App.tsx                 # Main app with routing
```

## Usage

1. **Home Page**: Learn about the platform
2. **Submit Review**: Choose manual diff or GitHub PR
3. **Monitor**: Watch real-time analysis in dashboard
4. **Review Details**: Inspect comments, filters, and suggestions
5. **Metrics**: Track system performance and health

## Unique Features

- No generic AI chat interface
- Custom "cockpit" theme with asymmetric panels
- Real-time polling for running reviews
- GitHub-style code review aesthetics
- Terminal-inspired command snippets
- Narrative timeline view for comments

## Security Note

This is designed as an **internal/admin tool**. API keys are stored in browser localStorage. Not recommended for production use with sensitive data or public access.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Future Enhancements

- WebSocket support for real-time updates
- Advanced filtering and search
- Export/download review reports
- Dark/light theme toggle
- Multi-language support
- Review comparison view
