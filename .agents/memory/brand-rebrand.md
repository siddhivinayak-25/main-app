---
name: Brand rebrand to hiresprint
description: How the project name, logo assets, and Founder section are managed
---

The project was rebranded from HireOS to **hiresprint**.

**Brand assets (user-provided):**
- Icon: `frontend/public/assets/hiresprint-logo.png` (document-in-tray icon)
- Wordmark: `frontend/public/assets/hiresprint-name.png` (lowercase Inter, "hire" in purple, "sprint" in black)
- Originals are kept in `attached_assets/` for reference

**Why:** The user wants the brand to read as lowercase, with the icon mark and wordmark as separate assets so they can be used independently (e.g., icon-only on mobile, full lockup in nav/footer).

**How to apply:**
- Use `frontend/src/components/brand/BrandLogo.jsx` everywhere a logo is needed. It supports `size`, `variant` (dark/light), and `showText`.
- Replace any remaining "HireOS" text in user-facing copy with "hiresprint".
- The Monaco editor theme is named `hiresprint-dark` (defined in `CodeEditor.jsx`).

**Founder section:**
- `frontend/src/components/homepage/FounderSection.jsx` renders the founder card on the landing page.
- Details: Siddhivinayak Waghmode, COEP Technological University, BTech in Manufacturing Science & Technology.
- Social links: LinkedIn, GitHub, Email (no contact form).
