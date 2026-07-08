<div align="center">

# 📚 StudentHub

**Upload. Share. Ace the semester.**

A resource-sharing platform where students post, discover, and organize academic materials — notes, PDFs, past papers — by semester and subject.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-File%20Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?logo=greensock&logoColor=white)](https://gsap.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

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
- [License](#-license)

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

Create a `.env` file in the project root (already gitignored — never commit this):

```env
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

---

## 👑 Creating an Admin

```bash
node scripts/makeAdmin.js <user-email>
```

---

## 🗺️ Roadmap

- [ ] Admin dashboard moderation view (admin powers currently only work via direct resource URLs)
- [ ] Centralized 404/500 error handling
- [ ] Re-upload flow for resources with broken pre-fix Cloudinary URLs
- [ ] Deployment (Render/Railway) with production env config
- [ ] Login rate limiting, friendlier validation messages, optional email verification

---

## 📄 License

MIT — free to use, modify, and build on. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built by a student, for students. ✏️

</div>
