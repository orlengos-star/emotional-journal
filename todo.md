# Emotional Journal - Project TODO

## Phase 1: Architecture & Planning
- [x] Initialize project with web-db-user scaffold
- [x] Create comprehensive TODO list
- [x] Set up environment variables and secrets

## Phase 2: Database Schema & Migrations
- [x] Define User table (Telegram ID, name, role: client/therapist)
- [x] Define JournalEntry table (user ID, text, created date, edited date, custom date, therapist comments, highlight flag)
- [x] Define DayRating table (user ID, date, client rating, therapist rating)
- [x] Define ClientTherapistRelationship table (linking table)
- [x] Define NotificationSettings table (user preferences)
- [x] Define InviteToken table (for shareable links)
- [x] Run Drizzle migrations and verify schema

## Phase 3: Telegram Bot Implementation
- [x] Set up Telegram bot with node-telegram-bot-api or telegraf
- [x] Implement message handler to save user messages as journal entries
- [x] Add inline "View" button that opens Mini App with entry context
- [x] Implement confirmation message with date ("Saved for today, Feb 18")
- [x] Add error handling and logging
- [ ] Test bot message flow end-to-end

## Phase 4: Mini App Frontend - Core Structure
- [x] Set up Telegram Mini App SDK integration
- [x] Create main layout with navigation between views
- [x] Implement client view: timeline/calendar navigation
- [x] Implement therapist view with mode switcher (My Journal / My Clients)
- [x] Add responsive design for mobile-first experience
- [x] Create loading states and error boundaries

## Phase 5: tRPC Procedures & Backend Logic
- [x] Create procedures for journal entry CRUD operations
- [x] Implement day rating procedures (client and therapist)
- [x] Add client-therapist relationship procedures
- [x] Implement invite token generation and validation
- [x] Add notification settings procedures
- [x] Implement query procedures for fetching entries by date range
- [x] Add therapist-specific procedures (highlight, add notes)

## Phase 6: Mini App UI Features - Client Side
- [x] Build entry list/timeline view with scrollable navigation
- [x] Implement calendar-based date navigation
- [x] Create entry detail view with edit functionality
- [x] Add new entry creation form with custom date picker
- [x] Implement day rating popup (5-point scale)
- [x] Add entry editing with timestamp tracking
- [x] Create empty state messaging

## Phase 7: Mini App UI Features - Therapist Side
- [x] Build client list view with search/filter
- [x] Implement therapist's own journal view
- [x] Create client entry view with highlight toggle
- [x] Add private notes editor (invisible to client)
- [x] Implement therapist day rating (5-point scale, private)
- [x] Add visual indicators for highlighted entries
- [ ] Create client summary/stats view

## Phase 8: Invite & Connection System
- [x] Implement invite link generation (both directions)
- [x] Create invite acceptance flow
- [x] Add settings page with invite buttons
- [ ] Implement connection status display
- [ ] Add ability to disconnect from therapist/client
- [x] Create shareable link UI with copy-to-clipboard

## Phase 9: Notification System
- [x] Implement client notification settings UI (toggle, time picker)
- [x] Create therapist notification settings (per-client vs batch digest)
- [x] Build background job for daily reminder checks
- [x] Implement entry count checking (< 3 entries trigger)
- [x] Add Telegram notification sending via bot
- [x] Create supportive, therapy-friendly notification messages
- [ ] Test notification timing and delivery

## Phase 10: Design & Styling
- [x] Apply Scandinavian aesthetic (pale cool gray background, generous spacing)
- [x] Implement bold black sans-serif typography with thin subtitles
- [ ] Add abstract geometric shapes (soft pastel blue and blush pink)
- [x] Create consistent color palette across all views
- [ ] Implement smooth transitions and micro-interactions
- [ ] Ensure accessibility (contrast, keyboard navigation)
- [ ] Test responsive design on various screen sizes

## Phase 11: Testing & Validation
- [x] Write vitest tests for tRPC procedures
- [ ] Test bot message handling and inline button flow
- [ ] Test invite system end-to-end
- [ ] Validate notification scheduling
- [ ] Test client-therapist relationship flows
- [ ] Verify data privacy (private notes, therapist ratings)
- [ ] Load test with multiple concurrent users

## Phase 12: Deployment & Final Setup
- [x] Set up environment variables (BOT_TOKEN, database URL, etc.)
- [x] Configure Telegram webhook or polling
- [ ] Deploy to production environment
- [ ] Set up monitoring and error logging
- [ ] Create user documentation
- [ ] Test full end-to-end flow in production
- [ ] Create checkpoint for deployment

## MVP Scope - NOT Included
- [ ] Emotion selection system
- [ ] Complex analytics or charts
- [ ] Long onboarding flow
- [ ] Separate mobile app
- [ ] Social or public sharing features
