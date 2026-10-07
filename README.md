<div align="center">
  <img src="public/logo.png" alt="X Downloader Logo" width="200" />
  
  # X Downloader

  **A fast, free, and ad-free tool to download high-quality videos and images from X (Twitter).**

  [![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
</div>

---

## ✨ Features

- 📥 **Media Downloading**: Extract and download original, high-quality images and videos from any X (Twitter) post.
- ⚡ **Lightning Fast**: Built with React & Vite for instantaneous performance.
- 🌍 **AI Translation Built-in**: Seamlessly translate foreign posts to your native language using Google Translate or Gemini AI models.
- 🌓 **Dark Mode Ready**: Beautiful, minimal UI with automatic theme switching based on your system preference.
- 💾 **Smart Caching**: Optimized network requests utilizing TanStack Query for a buttery smooth experience.
- 🕒 **History Management**: Keep track of your previously analyzed posts right in your browser storage.

## 🛠 Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Forms & Validation**: [TanStack Form](https://tanstack.com/form) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+) and [pnpm](https://pnpm.io/) installed.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/x-downloader.git
cd x-downloader
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```
The application will be running at `http://localhost:3002`.

## ⚙️ Environment Variables

Create a `.env` file in the root directory (optional, used for dynamic SEO generation during build):

```env
VITE_SITE_URL=https://your-domain.com
```

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
