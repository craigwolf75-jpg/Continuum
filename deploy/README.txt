CONTINUUM PRE-PILOT PREVIEW · deploy runbook (Prompt 2c Section B)

1. Deploy:  cd into this folder, run:  npx vercel --prod
   (or create a project in the Vercel dashboard and upload via CLI)
   No build step; this is a static site. Framework preset: Other.

2. Zones:
   /            public marketing site (indexable)
   /demo        Demo Mode (noindex + X-Robots-Tag; PROTECT THIS PATH)
   /app, /hub   reserved; disallowed in robots.txt

3. Protection (dashboard, you control this):
   Project > Settings > Deployment Protection.
   Protect /demo (path-based if your plan supports it; otherwise protect
   the whole deployment and share only via bypass links).
   Set a fresh password; store it in your password manager only.
   Rotate after each cluster of meetings.

4. Per-meeting sharing: generate one shareable bypass link per meeting,
   named for the partner and date; revoke after the meeting.
   Hand partners a /demo link, never /hub.

5. No custom domain on this preview. Bare .vercel.app only.
