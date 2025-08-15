[33mcommit eab4dafd35019d324b2a5aa3027dff559db1d639[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Author: CaboAi <caboconnectai@gmail.com>
Date:   Thu Aug 14 17:47:55 2025 -0700

    Implement UI/UX improvements and fix modal layout issues
    
    - Update navigation header to clean centered design with user info on right
    - Fix credit balance buttons to maintain blue color consistently
    - Resolve overlapping date/time/duration layout in class management modal
    - Add click-outside-to-close functionality to modals
    - Enhance dropdown styling with dark theme for better UX
    - Remove spinner arrows from credit cost input for type-only interaction
    - Update peak booking times with realistic hourly mock data (12-hour format)
    - Fix analytics dashboard time period selectors with proper data ranges
    - Remove redundant Settings button from studio management header
    - Improve overall responsive design and mobile PWA experience

app/api/studio-management/analytics/route.ts
app/api/studio-management/classes/route.ts
app/auth/signin/page.tsx
app/dashboard/page.tsx
app/favicon.ico
app/layout.tsx
app/pricing/page.tsx
app/profile/page.tsx
app/studio-management/page.tsx
app/studio/page.tsx
components/business/credit-display.tsx
components/layout/navigation-header.tsx
components/studio/analytics-dashboard.tsx
components/studio/class-management-modal.tsx
components/ui/button.tsx
components/ui/calendar.tsx
components/ui/calendar24.tsx
components/ui/popover.tsx
lib/auth.ts
lib/demo-data.ts
mobile-improvements.md
package-lock.json
package.json
public/cf-logo.svg
public/favicon.svg
public/manifest.json
public/sw.js
types/index.ts
