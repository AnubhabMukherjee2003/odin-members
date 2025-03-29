# Odin Members

A members-only community platform built with Node.js, Express, and PostgreSQL. This project features multiple user levels, post management, and secure authentication.

## 🌟 Features

- **User Authentication**: Secure login/signup system using Passport.js
- **Membership Levels**: Three different access tiers (regular users, members, admins)
- **Content Visibility**: Content visibility based on membership level
- **Post Management**: Create and manage posts with admin moderation

## 🚀 Live Demo

* [Vercel Deployment](https://odin-members.vercel.app)
* [Koyeb Deployment](https://injured-hyacinth-personalmine-37417a8b.koyeb.app)

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (with connection pooling)
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session with pg-simple store
- **View Engine**: EJS templates
- **Form Validation**: express-validator
- **Styling**: Custom CSS with modern animations

## 📋 User Levels

1. **Regular Users (Level 0)**
   - Can view limited post content
   - Cannot create posts

2. **Members (Level 1)**
   - Can view full post content
   - Can create new posts
   - Passcode required to upgrade

3. **Admins (Level 2)**
   - Full site access
   - Can delete any post
   - Can manage content

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14+)
- PostgreSQL database

### Local Development

1. Clone the repository
```bash
git clone https://github.com/AnubhabMukherjee2003/odin-members
cd odin-members