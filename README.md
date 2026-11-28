# Dul Blog

A blog and content management web application built with **Astro**, featuring article publishing, role-based access control (**Admin** and **Editor**), **Google OAuth** authentication, **Prisma + Supabase PostgreSQL** for article and user data, and **Firebase** for daily expense tracking.

---

## Features

- **Post Article:** Create, edit, publish, and manage articles stored in PostgreSQL via Prisma.
- **Role-Based Dashboard:**
  - **Admin:** Manage articles, user accounts/roles, and overall application access.
  - **Editor:** Create, edit, and manage articles according to editor permissions.
- **Google OAuth Login:** Authenticate users via Google OAuth and enforce role permissions.
- **Daily Expense Tracker (`Expense Track`):** Track daily expenses using **Firebase** as the database store (verify branch/commit status if kept on a separate branch or not yet merged into the main branch).

---

## Tech Stack

- **Framework:** Astro
- **Database & ORM:** Prisma + Supabase (PostgreSQL)
- **Authentication:** Google OAuth
- **Expense Tracker Database:** Firebase

---

## Project Structure

```text
dul-blog/
├── src/                  # Astro pages, components, layouts, and server/API logic
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
├── .env.example          # Environment variable template
├── astro.config.*        # Astro configuration
├── package.json
└── README.md
```
# Environment Variables
Create a .env file in the root directory and set the required values:

```bash 
# Supabase / PostgreSQL (Prisma)
DATABASE_URL=your_supabase_postgresql_connection_string
DIRECT_URL=your_supabase_direct_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Firebase (Expense Tracker)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```


# Getting 
1. StartedClone the repository

```Bash
clone [https://github.com/Dulkh91/dul-blog.git](https://github.com/Dulkh91/dul-blog.git)
cd dul-blog
```
2. Install dependencies
```Bash
npm install
```
3. Configure environment variables

Copy .env.example to .env and fill in your Supabase, Google OAuth, and Firebase credentials.Push Prisma schema & generate client
```Bash
npx prisma generate
npx prisma db push

4. Run the development server
```Bash
npm run dev
```
