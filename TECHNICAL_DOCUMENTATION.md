# Emotional Journal Telegram Mini App - Technical Documentation

## Deployment URL

**Public URL:** `https://3000-iax8am8xxy7fwy74btlag-372ff1d5.us2.manus.computer`

This is the live development server where the Mini App is currently running and accessible. Users can access this URL to use the Emotional Journal application.

---

## Architecture Overview

The Emotional Journal is a full-stack therapy support application built with modern web technologies. It consists of three main components:

1. **Telegram Bot** — Handles user messages and saves them as journal entries
2. **React Mini App** — Web-based interface for clients and therapists
3. **Backend API** — tRPC procedures with SQLite database

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 | User interface for Mini App |
| **Backend** | Node.js, Express 4, tRPC 11 | API and business logic |
| **Database** | SQLite via Drizzle ORM | Data persistence |
| **Bot** | node-telegram-bot-api | Telegram integration |
| **Testing** | Vitest | Unit and integration tests |
| **Build** | Vite 7, esbuild | Development and production builds |

---

## Database Schema

### 1. **users** Table
Stores user accounts with Telegram and authentication information.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) NOT NULL UNIQUE,
  telegramId VARCHAR(64),
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin', 'client', 'therapist') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `openId`: Manus OAuth identifier (unique per user)
- `telegramId`: Telegram user ID for bot communication
- `role`: Determines access level (client or therapist)
- `name`, `email`: User profile information

### 2. **journalEntries** Table
Stores all journal entries written by users.

```sql
CREATE TABLE journalEntries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  entryText LONGTEXT NOT NULL,
  entryDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  therapistComments LONGTEXT,
  isHighlighted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**Fields:**
- `entryText`: The journal entry content
- `entryDate`: The date the entry is for (allows backdating)
- `therapistComments`: Private notes only visible to therapist
- `isHighlighted`: Flag for therapist to mark important entries

### 3. **dayRatings** Table
Stores emotional ratings for each day (5-point scale).

```sql
CREATE TABLE dayRatings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  ratingDate DATE NOT NULL,
  clientRating INT,
  therapistRating INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY (userId, ratingDate)
);
```

**Fields:**
- `clientRating`: 1-5 scale (Negative to Positive), visible to both
- `therapistRating`: 1-5 scale, private to therapist only
- `ratingDate`: The date being rated

### 4. **clientTherapistRelationships** Table
Links clients to their therapists.

```sql
CREATE TABLE clientTherapistRelationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  therapistId INT NOT NULL,
  connectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES users(id),
  FOREIGN KEY (therapistId) REFERENCES users(id),
  UNIQUE KEY (clientId, therapistId)
);
```

**Fields:**
- `clientId`: User ID of the client
- `therapistId`: User ID of the therapist
- `connectedAt`: When the connection was established

### 5. **inviteTokens** Table
Stores shareable invite links for connecting clients and therapists.

```sql
CREATE TABLE inviteTokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(64) NOT NULL UNIQUE,
  fromUserId INT NOT NULL,
  fromRole ENUM('client', 'therapist') NOT NULL,
  expiresAt TIMESTAMP,
  usedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fromUserId) REFERENCES users(id)
);
```

**Fields:**
- `token`: Unique invite code (URL-safe)
- `fromRole`: Whether invite is from client or therapist
- `expiresAt`: When the invite expires
- `usedAt`: When the invite was accepted

### 6. **notificationSettings** Table
Stores user notification preferences.

```sql
CREATE TABLE notificationSettings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  isEnabled BOOLEAN DEFAULT TRUE,
  notifyIfNoEntries BOOLEAN DEFAULT TRUE,
  notifyIfFewEntries BOOLEAN DEFAULT TRUE,
  minEntriesThreshold INT DEFAULT 3,
  reminderTime VARCHAR(5) DEFAULT '09:00',
  reminderTimeEnd VARCHAR(5) DEFAULT '21:00',
  therapistNotificationMode ENUM('per_client', 'batch_digest') DEFAULT 'per_client',
  batchDigestTime VARCHAR(5) DEFAULT '18:00',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**Fields:**
- `notifyIfNoEntries`: Send reminder if no entries today
- `minEntriesThreshold`: Minimum entries before reminding
- `therapistNotificationMode`: "per_client" for instant or "batch_digest" for daily summary
- `batchDigestTime`: Time to send daily digest (HH:MM format)

### 7. **notificationLog** Table
Tracks all notifications sent to users for audit purposes.

```sql
CREATE TABLE notificationLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  notificationType VARCHAR(64),
  message LONGTEXT,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## Backend Structure

### File Organization

```
server/
├── _core/                    # Core framework files
│   ├── index.ts             # Server entry point
│   ├── context.ts           # tRPC context builder
│   ├── trpc.ts              # tRPC configuration
│   ├── env.ts               # Environment variables
│   ├── oauth.ts             # OAuth integration
│   └── ...other utilities
├── routers.ts               # tRPC procedure definitions
├── db.ts                    # Database query helpers
├── telegram-bot.ts          # Telegram bot handler
├── notification-service.ts  # Notification jobs
├── storage.ts               # S3 file storage
└── *.test.ts               # Test files
```

### Key Backend Files

#### **server/routers.ts** — tRPC Procedure Definitions
Defines all API endpoints as tRPC procedures. Organized into routers:

- **auth.me** — Get current user
- **auth.logout** — Clear session
- **journal.create** — Create new entry
- **journal.getByDateRange** — Fetch entries for date range
- **journal.update** — Edit entry
- **journal.delete** — Remove entry
- **rating.upsert** — Save/update day rating
- **rating.getByDate** — Get rating for specific date
- **relationship.getMyTherapists** — Get connected therapists
- **relationship.getMyClients** — Get connected clients (therapist only)
- **relationship.acceptInvite** — Accept invite link
- **notifications.getSettings** — Get notification preferences
- **notifications.updateSettings** — Update notification settings
- **invites.generate** — Create shareable invite link

#### **server/db.ts** — Database Helpers
Provides reusable query functions:

```typescript
// Journal entries
export async function createJournalEntry(userId: number, text: string, entryDate: Date)
export async function getJournalEntriesByDateRange(userId: number, start: Date, end: Date)
export async function updateJournalEntry(entryId: number, text: string)
export async function deleteJournalEntry(entryId: number)

// Day ratings
export async function upsertDayRating(userId: number, date: Date, rating: number, isTherapist: boolean)
export async function getDayRating(userId: number, date: Date)

// Relationships
export async function getClientTherapists(clientId: number)
export async function getTherapistClients(therapistId: number)
export async function createClientTherapistRelationship(clientId: number, therapistId: number)

// Invites
export async function createInviteToken(userId: number, role: 'client' | 'therapist')
export async function acceptInviteToken(token: string, acceptingUserId: number)

// Notifications
export async function getOrCreateNotificationSettings(userId: number)
export async function updateNotificationSettings(userId: number, settings: Partial<NotificationSettings>)
export async function getEntriesCountForDay(userId: number, date: Date)
```

#### **server/telegram-bot.ts** — Telegram Bot Handler
Initializes the Telegram bot and handles incoming messages:

```typescript
export function initializeTelegramBot()
```

**Flow:**
1. User sends message to bot in Telegram
2. Bot receives message via polling
3. Message is saved as journal entry for today
4. Bot sends confirmation: "Saved for today, Feb 18."
5. Inline button "View" opens Mini App with entry context
6. Therapist receives notification if configured

#### **server/notification-service.ts** — Background Jobs
Runs scheduled tasks for reminders and digests:

```typescript
// Check if user should receive daily reminder
export async function shouldSendDailyReminder(userId: number): Promise<boolean>

// Send reminder via Telegram
export async function sendDailyReminder(userId: number): Promise<void>

// Notify therapist of new client entry
export async function notifyTherapistOfNewEntry(clientId: number, entryId: number): Promise<void>

// Send batch digest summary
export async function sendTherapistBatchDigest(therapistId: number): Promise<void>

// Start background jobs (runs on server startup)
export function startNotificationJobs(): void
```

**Job Schedule:**
- Every 1 minute: Check if daily reminders should be sent
- Every 1 hour: Check if batch digests should be sent

---

## Frontend Structure

### File Organization

```
client/src/
├── pages/                   # Page-level components
│   ├── Home.tsx            # Landing page
│   ├── JournalApp.tsx      # Main app container
│   └── NotFound.tsx        # 404 page
├── components/             # Reusable components
│   ├── ClientJournalView.tsx    # Client interface
│   ├── TherapistJournalView.tsx # Therapist interface
│   ├── EntryCard.tsx            # Entry display
│   ├── DayRatingPopup.tsx       # Rating modal
│   ├── SettingsPanel.tsx        # Settings UI
│   ├── DashboardLayout.tsx      # Layout wrapper
│   └── ui/                      # shadcn/ui components
├── contexts/               # React contexts
│   └── ThemeContext.tsx    # Theme management
├── hooks/                  # Custom hooks
│   └── useAuth.ts         # Auth state
├── lib/
│   ├── trpc.ts            # tRPC client
│   └── utils.ts           # Utility functions
├── types/
│   └── index.ts           # TypeScript types
├── App.tsx                # Main app component
├── main.tsx               # React entry point
└── index.css              # Global styles
```

### Key Frontend Components

#### **pages/JournalApp.tsx** — Main Application
Container component that manages the app state and routing:

- Loads current user via `trpc.auth.me.useQuery()`
- Determines if user is client or therapist
- Renders appropriate view (ClientJournalView or TherapistJournalView)
- Handles navigation between views

#### **components/ClientJournalView.tsx** — Client Interface
Displays journal entries with month-based navigation:

**Features:**
- Month picker with Previous/Next buttons
- Calendar showing days with entries
- Entry list for selected month
- "New Entry" button to create entries
- Click entry to view/edit
- Day rating button (5-point scale)

**Data Flow:**
```
useQuery(journal.getByDateRange) 
  → Fetch entries for month
  → Display in list
  → useMutation(journal.update) on edit
  → useMutation(rating.upsert) on rating
```

#### **components/TherapistJournalView.tsx** — Therapist Interface
Dual-mode interface for therapist's own journal and client management:

**My Journal Tab:**
- Same as client view for therapist's own entries
- Can rate own days

**My Clients Tab:**
- List of connected clients
- Click client to view their entries
- Can add private notes (invisible to client)
- Can rate client's day (private, 5-point scale)
- Can highlight important entries

**Data Flow:**
```
useQuery(relationship.getMyClients)
  → List clients
  → useQuery(journal.getByDateRange, clientId)
  → Display client entries
  → useMutation(journal.update) to add notes
  → useMutation(rating.upsert) for private rating
```

#### **components/DayRatingPopup.tsx** — Rating Modal
5-point scale popup for rating days:

**Options:**
1. 😞 Negative
2. 😕 Mostly Negative
3. 😐 Neutral
4. 🙂 Mostly Positive
5. 😊 Positive

**Behavior:**
- Appears when user clicks "Rate the day"
- Shows current rating if exists
- Saves on selection
- Displays to both client and therapist (client rating)
- Therapist can also set private rating

#### **components/SettingsPanel.tsx** — Settings UI
Configuration panel for notifications and invites:

**Sections:**

1. **Notification Settings** (Client)
   - Toggle notifications on/off
   - Time range picker (start/end time)
   - "Notify if no entries" checkbox
   - "Notify if fewer than X entries" with threshold input

2. **Notification Settings** (Therapist)
   - Toggle notifications on/off
   - Mode selector: "Per client" or "Batch digest"
   - Time picker for batch digest

3. **Invite Section**
   - "Invite my therapist" button → generates link
   - "Invite my client" button → generates link
   - Copy-to-clipboard for invite links
   - Shows connected therapists/clients

**Data Flow:**
```
useQuery(notifications.getSettings)
  → Load current settings
  → useMutation(notifications.updateSettings) on change
  → useMutation(invites.generate) for new invite
  → useMutation(relationship.acceptInvite) for accepting
```

#### **components/EntryCard.tsx** — Entry Display
Card component for displaying individual entries:

**Shows:**
- Entry date
- Entry text (truncated or full)
- Day rating if exists
- Therapist highlights (visual indicator)
- Edit/delete buttons (if owner)
- Notes indicator (if therapist has added notes)

---

## Telegram Bot Flow

### Message Handling

**Sequence Diagram:**

```
User sends message to bot
    ↓
Bot receives via polling (telegram-bot.ts)
    ↓
Extract message text and user ID
    ↓
Get or create user in database
    ↓
Create journal entry for today
    ↓
Send confirmation: "Saved for today, Feb 18."
    ↓
Add inline "View" button
    ↓
Button opens Mini App with entry ID in URL
    ↓
User can view/edit entry in Mini App
```

### Code Flow

```typescript
// server/telegram-bot.ts

bot.on('message', async (msg) => {
  // 1. Extract message info
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from?.id;
  
  // 2. Get or create user
  const user = await db.getUserByTelegramId(userId);
  
  // 3. Save entry
  const entry = await db.createJournalEntry(
    user.id,
    text,
    new Date()
  );
  
  // 4. Send confirmation with inline button
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  await bot.sendMessage(
    chatId,
    `✅ Saved for today, ${today}.`,
    {
      reply_markup: {
        inline_keyboard: [[{
          text: 'View',
          url: `${MINI_APP_URL}?entryId=${entry.id}`
        }]]
      }
    }
  );
  
  // 5. Notify therapist if configured
  await notifyTherapistOfNewEntry(user.id, entry.id);
});
```

---

## Notification System

### Daily Reminders

**Trigger Conditions:**
- User has notifications enabled
- Current time is within reminder window (e.g., 9 AM - 9 PM)
- User has 0 entries today (if "notifyIfNoEntries" enabled)
- OR user has < threshold entries (if "notifyIfFewEntries" enabled)

**Message:**
```
🌿 Good morning! How are you feeling today? 
Take a moment to journal your thoughts and feelings.
```

### Therapist Notifications

**Mode 1: Per-Client (Instant)**
- Sent immediately when client adds entry
- Message: "📝 Your client has written a new journal entry. Open the app to read it."

**Mode 2: Batch Digest (Daily)**
- Sent at configured time (e.g., 6 PM)
- Message: 
```
📊 Daily Digest - New Client Entries:

👤 Client #123: 2 entries
👤 Client #456: 1 entry

Open the app to view all entries.
```

### Background Jobs

**Job 1: Daily Reminder Check** (Every 1 minute)
```typescript
for each user:
  if shouldSendDailyReminder(user.id):
    sendDailyReminder(user.id)
```

**Job 2: Batch Digest Check** (Every 1 hour)
```typescript
for each therapist:
  if therapist.notificationMode === 'batch_digest':
    if currentTime === therapist.batchDigestTime:
      sendTherapistBatchDigest(therapist.id)
```

---

## Authentication Flow

### Manus OAuth Integration

1. User clicks "Sign In" button
2. Redirected to Manus OAuth portal
3. User authenticates with Manus
4. Callback to `/api/oauth/callback` with authorization code
5. Backend exchanges code for access token
6. User info stored in database
7. Session cookie set
8. Redirected to app

### Protected Routes

All tRPC procedures use `protectedProcedure` which:
- Checks for valid session cookie
- Extracts user info from JWT
- Injects `ctx.user` into procedure
- Returns UNAUTHORIZED error if not authenticated

---

## Testing

### Test Files

1. **server/auth.logout.test.ts** — Auth flow tests
2. **server/telegram-bot.test.ts** — Bot configuration tests
3. **server/routers.test.ts** — tRPC procedure tests

### Test Coverage

- ✅ Bot token validation
- ✅ Auth logout functionality
- ✅ Protected procedure authorization
- ✅ User context injection

### Running Tests

```bash
pnpm test                    # Run all tests
pnpm test server/routers.test.ts  # Run specific test
```

---

## Environment Variables

### Required Secrets

```
BOT_TOKEN=<telegram-bot-token>
DATABASE_URL=<mysql-connection-string>
JWT_SECRET=<session-signing-key>
VITE_APP_ID=<manus-oauth-app-id>
OAUTH_SERVER_URL=<manus-oauth-url>
```

### Auto-Injected Variables

```
VITE_OAUTH_PORTAL_URL
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
OWNER_OPEN_ID
OWNER_NAME
```

---

## Design System

### Color Palette (Scandinavian Aesthetic)

| Purpose | OKLCH Value | Description |
|---------|------------|-------------|
| Background | `oklch(0.98 0.001 250)` | Pale cool gray |
| Foreground | `oklch(0.13 0.02 250)` | Deep charcoal |
| Primary | `oklch(0.65 0.15 250)` | Soft pastel blue |
| Secondary | `oklch(0.70 0.12 10)` | Soft blush pink |
| Accent | `oklch(0.65 0.15 250)` | Accent blue |
| Muted | `oklch(0.85 0.005 250)` | Subtle gray |
| Border | `oklch(0.90 0.003 250)` | Subtle border |

### Typography

- **Font Family:** Inter (sans-serif)
- **Headings:** Bold, 700 weight
- **Body:** Regular, 400 weight
- **Subtitles:** Thin, 300 weight

### Spacing & Radius

- **Border Radius:** 0.5rem (soft, rounded corners)
- **Container Padding:** Responsive (1rem mobile, 2rem desktop)
- **Gap:** Generous negative space for calming effect

---

## Deployment Considerations

### Current Setup

- **Environment:** Development server on Manus platform
- **Database:** MySQL/TiDB managed by Manus
- **Bot Polling:** Long-polling (checks for messages every few seconds)
- **Notifications:** In-memory job scheduler

### Production Recommendations

1. **Switch to Webhook** — Replace polling with Telegram webhook for better performance
2. **Use Job Queue** — Replace in-memory jobs with Redis/Bull for reliability
3. **Add Monitoring** — Implement error tracking (Sentry) and logging
4. **Database Backups** — Set up automated backups
5. **Rate Limiting** — Add rate limits to API endpoints
6. **CDN** — Cache static assets with CDN
7. **SSL/TLS** — Ensure all connections are encrypted

---

## Key Files Summary

### Critical Files

| File | Purpose | Lines |
|------|---------|-------|
| `server/routers.ts` | All API procedures | ~400 |
| `server/db.ts` | Database queries | ~300 |
| `server/telegram-bot.ts` | Bot handler | ~150 |
| `server/notification-service.ts` | Notification jobs | ~250 |
| `client/src/pages/JournalApp.tsx` | Main app | ~200 |
| `client/src/components/ClientJournalView.tsx` | Client UI | ~250 |
| `client/src/components/TherapistJournalView.tsx` | Therapist UI | ~300 |
| `drizzle/schema.ts` | Database schema | ~200 |

### Total Lines of Code

- **Backend:** ~1,500 lines
- **Frontend:** ~2,000 lines
- **Tests:** ~300 lines
- **Configuration:** ~200 lines
- **Total:** ~4,000 lines

---

## Next Steps

1. **Test with Real Telegram Bot** — Create bot via BotFather and test message flow
2. **Add Emotion Tags** — Implement optional emoji mood indicators
3. **Build Analytics** — Create therapist dashboard with mood trends
4. **Implement Search** — Add entry search and filtering
5. **Mobile Optimization** — Test on mobile devices and optimize UX
6. **Accessibility** — Audit for WCAG compliance
7. **Performance** — Optimize queries and add caching

---

## Support & Documentation

For questions or issues:
1. Check the test files for usage examples
2. Review the tRPC procedure definitions in `server/routers.ts`
3. Examine component implementations in `client/src/components/`
4. Review database schema in `drizzle/schema.ts`

All code follows TypeScript best practices with full type safety end-to-end.
