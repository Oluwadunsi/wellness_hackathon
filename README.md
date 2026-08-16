# JoyFlow

JoyFlow is a wellness-focused calendar optimiser created by **Eunice Adeniyi** for the **CS Girlies Annual Hackathon — Technology for Wellness**.

It imports calendar commitments from `.ics` or `.csv` files, combines them with the user’s desires and focus areas, and produces a more rounded weekly plan. Fixed commitments remain in place while JoyFlow looks for comfortable openings for activities such as exercise, cooking, rest, hobbies, and time with friends or family.

## Inspiration

Twenty-four hours can seem like a long time until midnight arrives and important areas of life have been unintentionally ignored. This is common for students and working professionals: work and business commitments enter the calendar first, while activities that support health, relationships, and enjoyment are left unscheduled.

JoyFlow treats those personal priorities as worthy of calendar space too.

## Core features

- Email and password authentication with account-specific data.
- One-time onboarding for personal focus areas.
- `.ics` and `.csv` calendar import.
- Natural-language desire capture.
- Seven-day schedule generation in Stockholm time.
- Fixed calendar commitments remain unchanged.
- Proposed activities are placed in comfortable morning, afternoon, or evening openings.
- Breathing room is maintained around existing commitments.
- Concise weekly insights explain scheduling decisions and suggest improvements.
- Responsive layouts for mobile, tablet, and desktop.
- Supabase Row Level Security protects user data.

## How AI is used

JoyFlow uses AI in two different ways:

### Development assistant

- **Tool:** Codex
- **Model:** 5.6 Sol
- **Reasoning level:** Low
- **Tier:** Paid

The project concept, requirements, UI direction, architecture, and database design were directed by the project author. Codex assisted with implementation and testing.

### AI inside the product

Supabase Edge Functions call **OpenAI `gpt-5.4-nano`** to:

- Convert natural-language desires into schedulable activities.
- Compare desires and focus areas with fixed commitments.
- Explain important scheduling decisions or compromises.
- Provide short, practical weekly suggestions.

The OpenAI key is stored as a Supabase Edge Function secret and is never exposed to the React frontend.

## Technology

- **Frontend:** React, TypeScript, Tailwind CSS
- **Build tool:** Vite
- **Backend:** Supabase
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **AI:** OpenAI through Supabase Edge Functions
- **Deployment:** Vercel
- **Version control:** Git and GitHub

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure frontend environment variables

Copy `.env.example` to `.env.local` and provide the public values from the Supabase project settings:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Never place the OpenAI API key in a `VITE_` environment variable.

### 3. Apply the database migrations

Run the SQL files in `supabase/migrations` in filename order, or push them with the linked Supabase CLI:

```bash
npx supabase db push
```

### 4. Configure and deploy the AI functions

```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
npx supabase functions deploy interpret-task
npx supabase functions deploy analyze-week
```

### 5. Start the application

```bash
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```

## Vercel deployment

1. Push the repository to GitHub and import it into Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel project environment variables.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add the deployed URL to the Supabase Authentication Site URL and allowed redirect URLs.

The included `vercel.json` sends React Router paths back to `index.html`, allowing routes such as `/dashboard` and `/weekly-plan` to work after a refresh.

## Hackathon tracks

- Technology for Wellness
- Best Use of AI
