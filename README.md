# Emotional Journal 🌿

A Telegram Mini App for therapy support with journal entries, client-therapist connections, and intelligent notifications. Built with React, Node.js, Express, and Telegram Bot API.

## Features

### 📝 Telegram Bot
- **Message Journaling** — Every message sent to the bot is saved as a journal entry
- **Instant Confirmation** — Bot responds with "Saved for today, [date]" and a "View" button
- **Entry Context** — Click "View" to open the Mini App directly on that entry

### 📱 React Mini App
- **Client View**
  - Browse entries by month with calendar navigation
  - View, edit, and create entries
  - Rate your day on a 5-point scale (Negative → Positive)
  - Invite therapist via shareable link

- **Therapist View**
  - Switch between "My Journal" and "My Clients"
  - View client entries with timestamps
  - Add private notes (invisible to clients)
  - Highlight important entries
  - Rate client days privately
  - Manage notifications per client

### 🔗 Client-Therapist Connections
- **Invite System** — Generate shareable links to invite therapists or clients
- **Relationship Management** — Secure connection between client and therapist
- **Privacy** — Therapist notes and ratings are private

### 🔔 Smart Notifications
- **Client Reminders**
  - Daily reminder if no entries recorded
  - Reminder if fewer than 3 entries by end of day
  - Customizable time and toggle on/off

- **Therapist Notifications**
  - Per-client instant notifications (new entry alert)
  - Batch digest mode (summary at chosen time)
  - Therapy-friendly, supportive tone

### 🎨 Design
- **Scandinavian Aesthetic** — Minimal, calming interface
- **Pale Gray Background** — Reduces visual stress
- **Soft Accents** — Blush pink and soft blue geometric shapes
- **Bold Typography** — Clear hierarchy with sans-serif fonts
- **Generous Spacing** — Uncluttered, breathing room

## Tech Stack

### Frontend
- **React 19** — Modern UI library
- **TypeScript** — Type-safe code
- **Tailwind CSS 4** — Utility-first styling
- **Vite** — Lightning-fast build tool
- **Wouter** — Lightweight routing

### Backend
- **Node.js 22** — JavaScript runtime
- **Express 4** — Web framework
- **tRPC 11** — Type-safe RPC framework
- **Telegram Bot API** — Bot integration

### Database
- **SQLite/MySQL** — Persistent storage
- **Drizzle ORM** — Type-safe database queries
- **Migrations** — Schema versioning

### Deployment
- **Docker** — Containerization
- **Railway** — Hosting platform

## Project Structure

```
emotional-journal/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx      # Landing page
│   │   │   ├── JournalApp.tsx # Main app
│   │   │   └── NotFound.tsx  # 404 page
│   │   ├── components/       # Reusable components
│   │   │   ├── ClientJournalView.tsx
│   │   │   ├── TherapistJournalView.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── DayRatingPopup.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   └── dist/                 # Built output
├── server/                    # Node.js backend
│   ├── _core/
│   │   ├── index.ts          # Express server
│   │   ├── context.ts        # tRPC context
│   │   ├── env.ts            # Environment config
│   │   └── ...
│   ├── telegram-bot.ts       # Telegram bot handler
│   ├── notification-service.ts # Background jobs
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database helpers
│   └── *.test.ts             # Tests
├── drizzle/                  # Database
│   └── schema.ts             # Table definitions
├── Dockerfile                # Docker config
├── package.json              # Dependencies
├── vite.config.ts            # Vite config
└── README.md                 # This file
```

## Database Schema

### Users
- `id` — Primary key
- `telegramId` — Telegram user ID
- `name` — User's name
- `role` — "client" or "therapist"
- `createdAt` — Account creation date

### Journal Entries
- `id` — Primary key
- `userId` — User who created entry
- `text` — Entry content
- `entryDate` — Date of entry (can be backdated)
- `createdAt` — When entry was created
- `updatedAt` — Last edit time
- `therapistComments` — Private notes (therapist only)
- `isHighlighted` — Importance flag

### Day Ratings
- `id` — Primary key
- `userId` — User who rated
- `date` — Date being rated
- `clientRating` — Client's 5-point rating (visible to both)
- `therapistRating` — Therapist's 5-point rating (private)

### Client-Therapist Relationships
- `id` — Primary key
- `clientId` — Client user ID
- `therapistId` — Therapist user ID
- `connectedAt` — Connection date

### Invite Tokens
- `id` — Primary key
- `token` — Unique token
- `inviterId` — Who created invite
- `inviteType` — "invite_therapist" or "invite_client"
- `expiresAt` — Token expiration
- `usedAt` — When accepted

### Notification Settings
- `id` — Primary key
- `userId` — User
- `enabled` — Toggle on/off
- `reminderTime` — Time for daily reminder
- `therapistMode` — "per_client" or "batch_digest"
- `batchTime` — Time for batch digest

## Installation

### Prerequisites
- Node.js 22+
- pnpm (or npm)
- PostgreSQL or MySQL (for production)

### Local Development

```bash
# Clone repository
git clone https://github.com/orlengos-star/emotional-journal.git
cd emotional-journal

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## Environment Variables

### Required
```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=your_database_connection_string
JWT_SECRET=random_32_character_string
NODE_ENV=development
PORT=3000
```

### Optional (Manus OAuth)
```
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=your_manus_portal_url
VITE_FRONTEND_FORGE_API_URL=your_manus_api_url
VITE_FRONTEND_FORGE_API_KEY=your_manus_api_key
BUILT_IN_FORGE_API_URL=your_manus_api_url
BUILT_IN_FORGE_API_KEY=your_manus_api_key
OWNER_OPEN_ID=your_id
OWNER_NAME=your_name
```

## Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select this repository
5. Add PostgreSQL service
6. Set environment variables
7. Deploy!

See [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md) for detailed instructions.

### Docker

```bash
# Build image
docker build -t emotional-journal .

# Run container
docker run -p 3000:3000 \
  -e BOT_TOKEN=your_token \
  -e DATABASE_URL=your_db_url \
  -e JWT_SECRET=your_secret \
  emotional-journal
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/routers.test.ts
```

## API Endpoints

### tRPC Procedures

**Public:**
- `auth.me` — Get current user
- `auth.logout` — Logout

**Protected:**
- `journal.create` — Create entry
- `journal.update` — Edit entry
- `journal.delete` — Delete entry
- `journal.getByDate` — Get entries for date
- `journal.getByMonth` — Get entries for month
- `ratings.setClientRating` — Rate day (client)
- `ratings.setTherapistRating` — Rate day (therapist)
- `relationships.invite` — Generate invite link
- `relationships.accept` — Accept invite
- `relationships.getClients` — Get therapist's clients
- `settings.update` — Update notification settings

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start bot, show help |
| `/settings` | Open settings in Mini App |
| `/help` | Show available commands |
| Any message | Save as journal entry |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — See LICENSE file for details

## Support

- **Issues** — [GitHub Issues](https://github.com/orlengos-star/emotional-journal/issues)
- **Discussions** — [GitHub Discussions](https://github.com/orlengos-star/emotional-journal/discussions)
- **Email** — support@emotional-journal.app

## Acknowledgments

- Inspired by therapy practices and journaling benefits
- Built with modern web technologies
- Designed with accessibility and privacy in mind

---

**Ready to deploy?** See [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md) for step-by-step deployment instructions.

**Want to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Questions?** Open an issue or start a discussion!
