# Yun-Zhi

A minimal, white chatbot interface inspired by Google Gemini, built with Next.js, Tailwind CSS, and the Gemini API.

## Deployment to Vercel

To deploy this project to Vercel, follow these steps:

1.  **Push to GitHub**: Push this repository to your GitHub account.
2.  **Import in Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **Add New...** > **Project**.
    *   Import the `yun-zhi` repository.
3.  **Configure Project**:
    *   Framework Preset: **Next.js** (should be detected automatically).
    *   Root Directory: `./` (default).
4.  **Environment Variables**:
    *   Expand the **Environment Variables** section.
    *   Add the following variable:
        *   **Key**: `NEXT_PUBLIC_GEMINI_API_KEY`
        *   **Value**: Your Google Gemini API Key (get it from [Google AI Studio](https://aistudio.google.com/)).
5.  **Deploy**: Click **Deploy**.

## Development

To run locally:

```bash
npm install
npm run dev
```

Create a `.env.local` file with:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```
