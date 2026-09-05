# V3RTEX

A modern DSA practice and learning platform designed to make algorithmic problem solving more structured, interactive, and feedback-driven.

## Tech Stack

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-000000?logo=drizzle&logoColor=white)

## Overview

V3RTEX combines curated coding problems with progress tracking, solution analysis, and AI-assisted learning in a single developer-focused interface.

The platform is designed around a simple workflow:

**Learn → Solve → Submit → Analyze → Improve**

## Features

- **DSA Practice**
  - Problems across arrays, hashing, graphs, trees, dynamic programming, greedy algorithms, and more.
  - Difficulty-based problem organization.
  - Topic and tag-based discovery.

- **Interactive Problem Solving**
  - Problem statements with examples and constraints.
  - Structured coding interface with starter templates.
  - Submission and result tracking.

- **Solution Analysis**
  - Time and space complexity tracking.
  - Submission history and attempt-based progress.
  - Feedback-oriented solution evaluation.

- **AI Learning Assistant**
  - Context-aware assistance while practicing.
  - Helps explain concepts and guide problem-solving approaches.
  - Designed to support learning rather than simply provide solutions.

- **Progress Dashboard**
  - Track solved problems and learning activity.
  - View performance trends and submission history.
  - Organize preparation around DSA topics.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Wouter
- Radix UI
- Lucide Icons

### Backend
- Node.js
- Express
- TypeScript
- Zod
- Drizzle ORM

### AI
- Gemini API

## Architecture

The project follows a modular full-stack architecture with separate application, API, database, and shared type layers.

```text
Frontend
   │
   ▼
API Layer
   │
   ├── Application Services
   ├── Validation
   └── Data Access
           │
           ▼
       Database

AI Assistant
   │
   ▼
Gemini API
```
## Project Structure

```text
.
├── apps/
│   ├── api/
│   └── web/
├── lib/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   └── db/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tsconfig.json
```

## V3RTEX focuses on:

1. Reducing friction between learning and practice
2. Making DSA progress measurable
3. Providing meaningful feedback on submissions
4. Keeping AI assistance focused on learning
5. Maintaining a clean and responsive experience

## License

This project is intended for personal and portfolio use by @aziraxariza.
