<div align="center">

# 📚 StudentHub

**Upload. Share. Ace the semester.**

A resource-sharing platform where students post, discover, and organize academic materials — notes, PDFs, past papers — by semester and subject.

🔗 **Live:** [studenthub-4io3.onrender.com](https://studenthub-4io3.onrender.com)
*(hosted on Render's free tier — the first load after inactivity may take ~30-60s to spin up)*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-File%20Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?logo=greensock&logoColor=white)](https://gsap.com/)

</div>

---

## 🧭 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Creating an Admin](#-creating-an-admin)
- [Roadmap](#-roadmap)

---

## 🎯 Overview

StudentHub is a full-stack Node.js web app built for a simple problem: study materials scattered across group chats and drives, gone the moment someone leaves the group. StudentHub gives every semester and subject a home — searchable, filterable, and owned by the people who uploaded it.

Built with an Express + MongoDB backend, EJS-rendered views styled like an "answer booklet," and a GSAP-powered animation layer that brings every card, table, and flash message to life.

---

## ✨ Features

| | |
|---|---|
| 🔐 **Auth** | Secure signup/login with bcrypt-hashed passwords and session-based auth |
| 📤 **Upload & Browse** | Post resources and filter the library by semester and subject |
| 🗂️ **My Uploads** | A personal library view of everything you've shared |
| 🛡️ **Ownership Controls** | Only the uploader (or an admin) can edit or delete a resource |
| 👑 **Admin Role** | Promotable admin accounts with elevated access across all resources |
| 👤 **Profile Management** | Edit your name and change your password |
| ☁️ **Cloud Storage** | Files stored and served via Cloudinary |
| 💬 **Flash Messages** | Instant success/error feedback on every key action |
| 🎬 **Animated UI** | GSAP entrance and scroll-reveal animations sitewide |

---

## 🛠️ Tech Stack

**Backend** · Node.js, Express
**Database** · MongoDB, Mongoose
**Views** · EJS, Bootstrap 5
**Auth** · express-session, bcrypt
**File Uploads** · Multer + Cloudinary (`multer-storage-cloudinary`)
**Validation** · express-validator
**Extras** · connect-flash, express-rate-limit, method-override, GSAP + ScrollTrigger

---

## 📁 Project Structure

```
studenthub/
├── app.js                      # App entry point
├── config/                     # DB, Cloudinary, Multer, allowed-emails config
├── controllers/                 # Route handlers (auth, resources, profile, admin, index)
├── middleware/                  # Auth guards, error handler, rate limiter, validators
├── models/                      # Mongoose models (User, Resource)
├── routes/                      # Express routers
├── views/                       # EJS templates
│   ├── partials/                  # Shared header/footer
│   ├── auth/                      # Login/register
│   ├── resources/                 # Resource CRUD views
│   ├── profile/                   # Profile page
│   └── admin/                     # Admin dashboard
├── public/
│   ├── css/style.css              # "Register & Answer-Booklet" design system
│   └── js/animations.js           # Global GSAP animation layer
└── scripts/makeAdmin.js         # One-off script to promote a user to admin
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB instance (local or Atlas)
- A Cloudinary account

### Installation

```bash
git clone https://github.com/tan-ishk007/studenthub.git
cd studenthub
npm install
```

### Run it

```bash
npm run dev    # nodemon — auto-restarts on changes
# or
npm start      # plain node
```

Then open **http://localhost:3000** 🎉

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in real values (`.env` is gitignored — never commit it):

```env
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

See `.env.example` for the additional variables used by the Google Drive import (below).

> ⚠️ **If this repo was ever pushed with real Google OAuth credentials hardcoded in `scripts/generateToken.js`, rotate that Client Secret in Google Cloud Console.** It's now read from `.env` instead (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`), but an old committed secret in git history stays valid until you rotate it.

---

## 👑 Creating an Admin

```bash
node scripts/makeAdmin.js <user-email>
```

---

## 📥 Importing resources from Google Drive

`scripts/importFromDrive.js` recursively walks a Google Drive folder and imports every file it finds as a real Resource — same as if someone had filled out the "Upload a Resource" form by hand, just automated:

- **Semester** is detected from folder names (e.g. `5TH SEM`) — never guessed by AI, since a wrong guess would misfile a resource permanently. Files where no semester folder is found are skipped and listed in the report for manual review.
- **Subject** and **Category** start from folder-name heuristics (`scripts/driveClassify.js`) and are cleaned up / filled in by Google's Gemini API when `GEMINI_API_KEY` is set. Category is always one of the app's real categories (Notes, PYQs, Books, Assignments, Coding, Lab Files, Others).
- **Title** and **Description** are AI-written from the filename and folder context (spelling/casing fixed). Without a Gemini key, the title falls back to a cleaned-up version of the filename and the description falls back to a simple template.
- The actual file is downloaded from Drive (Google Docs/Slides/Sheets/Drawings are exported to a supported format first) and uploaded to Cloudinary, exactly like a manual upload.
- Re-running the script is safe — files already imported (matched by their Drive file ID) are skipped, not duplicated.

### One-time setup

1. Create an OAuth client (type "Desktop app") in Google Cloud Console and put its ID/secret in `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
2. Run `node scripts/generateToken.js`, open the printed URL, authorize, and paste the code back in. Save the printed JSON as `scripts/token.json` (gitignored).
3. Get a Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and put it in `.env` as `GEMINI_API_KEY` (optional but recommended — see `.env.example`).
4. Set `DRIVE_FOLDER_ID` and `DRIVE_IMPORT_UPLOADER_EMAIL` in `.env`.

### Running it

```bash
npm run import:drive:dry   # preview what would be imported — no uploads, no DB writes
npm run import:drive       # the real thing
```

Each run writes a full report to `scripts/importReport.json` (gitignored) listing what was imported, skipped, and failed, and why.

---

## 🗺️ Roadmap

- [ ] Admin dashboard moderation view (admin powers currently only work via direct resource URLs)
- [ ] Centralized 404/500 error handling
- [ ] Re-upload flow for resources with broken pre-fix Cloudinary URLs
- [ ] Deployment (Render/Railway) with production env config
- [ ] Login rate limiting, friendlier validation messages, optional email verification

---

<div align="center">

Built by a student, for students. ✏️

</div>
