# Free State Action Now

An independent civic-evidence platform for Free State, South Africa.

## What this is
A community reporting platform that documents municipal service delivery failures with GPS-verified, SHA-256 hashed evidence — building a court-admissible public record.

## Tech stack
- React (Base44 platform)
- Base44 entities (Municipality, Report, EvidenceItem, EscalationEvent, LegalNotice, etc.)
- Backend functions (Deno/TypeScript)

## Structure
```
src/
  App.jsx                  # Root router + auth context
  api/entities.js          # Entity imports
  components/
    Badges.jsx             # Category, status, audit badges
    Layout.jsx             # Nav, footer, independence banner
  pages/
    Home.jsx
    Reports.jsx
    ReportDetail.jsx
    SubmitReport.jsx       # 5-step submission form
    Directory.jsx          # Municipality + officials directory
    Newsroom.jsx
    LegalWatch.jsx
    Stats.jsx
    About.jsx
    StaticPage.jsx         # Privacy, terms, acceptable use, cookies
    admin/
      AdminLayout.jsx
      Moderation.jsx       # Report moderation queue
      Curation.jsx         # News + legal curation queue
      Officials.jsx        # Officials directory management
      Notices.jsx          # Legal notice workflow
      Flags.jsx            # Moderation flags
functions/
  generateLegalNoticeDraft.ts
  monitorNews.ts
  monitorSAFLII.ts
  processEvidenceUpload.ts
```

## Legal basis
- Constitution s152 (objects of local government)
- Municipal Systems Act s73 (basic services)
- PAJA s6(2)(g) (unreasonable delay)

## Design
- Background: `#0A0A0A`
- Text: `#F5F5F0`
- Accent: `#E8A838`

## Status
Platform in active development. Municipalities seeded. Evidence pipeline live.
