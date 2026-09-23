# Career Orbit

A local-first career planner built around Simoné Govender's 13-week Task 5 action plan.

## What works immediately

- Daily task lists with checkboxes, priorities, dates, time blocks and editing
- 13-week roadmap with interactive weekly checklists
- Goal progress, application pipeline, networking follow-ups and reference bank
- Google Calendar event links for individual tasks
- Automatic saving in the browser
- JSON backup and restore
- Responsive layout for desktop and mobile

## Optional cloud backup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the project's SQL editor.
3. In Authentication settings, add the published website URL as a redirect URL.
4. Open **Settings** in the site and add the project URL and public anon key.
5. Enter an email address to receive a magic sign-in link.

The row-level security policies keep each signed-in person's plan private.

## Optional direct Google Calendar connection

The one-click calendar links work without setup. For browser authorization, create a Google OAuth web client, add the published site under Authorized JavaScript origins, then paste the browser client ID into **Settings**.

## Publishing

This is a static site. Publish the repository root with GitHub Pages.
