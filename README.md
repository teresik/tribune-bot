# Discord Tribune Schedule Management Bot

## Overview
A specialized bot to organize and coordinate tribunes (streams/live sessions) on a Discord server. It automates schedule creation, participant sign‑ups, session management, and auto-republishing of the schedule message.

## Key Features
- 📅 Two week schemes:
  - Week 1: Monday, Wednesday, Friday, Sunday
  - Week 2: Tuesday, Thursday, Saturday
- 🕒 Time slots: 21:00–22:00, 22:00–23:00, 23:00–00:00
- 👥 Interactive sign-up via buttons and modals
- 🧩 Participant roles: host, backup
- 🔄 Auto-update and auto-republish of the schedule message
- 🧠 Registration and changes history
- 🛡️ Error handling, validation, and session timeouts

## Tech Stack
- Language: JavaScript (Node.js)
- Packages:
  - discord.js v14.19.3 — Discord API
  - node-schedule v2.1.1 — task scheduling (republish/updates)
  - nodemon v3.0.1 — dev auto-restart
  - dotenv v16.5.0 — environment variables
- Data storage: JSON files (schedule, history, service IDs)

## Installation & Setup
### Requirements
- Node.js 16.9.0+
- npm
- Discord account and an app in Discord Developer Portal

### Steps
1. Clone the repository:
   git clone https://github.com/username/tribunebot.git
   cd tribunebot
2. Install dependencies:
   npm install
3. Configure:
   - Option A (recommended) via .env in project root:
     DISCORD_TOKEN=YOUR_BOT_TOKEN
     CHANNEL_ID=SCHEDULE_CHANNEL_ID
   - Option B via config.json:
     {
       "token": "YOUR_BOT_TOKEN",
       "channelId": "SCHEDULE_CHANNEL_ID"
     }
4. Enable privileged intents in Discord Developer Portal:
   - Bot → enable SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT
5. Register slash commands:
   node deploy-commands.js
6. Run:
   - Production: npm start
   - Development (auto-restart): npm run dev

## Usage
### Slash Commands
- /week1 — create schedule for week 1 (Mon, Wed, Fri, Sun)
- /manage — manage the active schedule message (update/republish)
- /register — manual registration/adjustment (admins)
- /leave — unregister
- /history — show changes/registrations history
- (Optional) /week2 — create schedule for week 2 (Tue, Thu, Sat), if enabled

Note: Buttons under the schedule message trigger the sign-up interface: select day, time slot, and role.

### Typical Flow
1. Admin runs /week1 to publish a schedule.
2. Bot posts a message with sign-up buttons.
3. Members register via buttons/modals.
4. The schedule message auto-updates.
5. Scheduled jobs can republish the message when needed.

## Project Structure
- src/index.js — bot entry point
- src/commands — slash command implementations (/week1, /manage, /register, /leave, /history)
- src/handlers — interactions handling, message updates, unregister button
- src/features — signup and management logic (UI, modals, handlers)
- src/jobs/autoRepublish.js — scheduled jobs for republishing/updates
- src/services — data handling (schedule, history, storage, logging)
- src/tribunes — formatters and time slices
- src/utils — helpers (dates, roles, texts, embeds)
- config.json or .env — configuration
- data.json / history.json / storage.json — schedule data, history, and service info

## Configuration
- .env:
  - DISCORD_TOKEN — bot token
  - CHANNEL_ID — channel ID for schedule publishing
- config.json:
  - token — bot token
  - channelId — channel ID
- Additional parameters may be declared in src/config.js and constants.js if needed.

## npm Scripts
- npm start — run the bot
- npm run dev — run in development mode (nodemon)
- node deploy-commands.js — register commands

## Development Tips
- Add new commands to src/commands and register via deploy-commands.js.
- Adjust schedule formatting in the formatting module.
- Modify time slots and role logic in corresponding utils/constants.
- Use stored message IDs and atomic updates for stability.

## Troubleshooting
- “Used disallowed intents”: enable required intents in Discord Developer Portal.
- Bot not responding: check slash command registration and token/permissions.
- Message not updating: ensure the bot can edit messages in the channel.
- Registration conflicts: review validation for roles/slots and the change history.

## License
MIT — free to use, modify, and distribute with copyright notice preserved.

