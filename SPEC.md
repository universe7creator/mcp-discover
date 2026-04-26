# MCP Server Discover — SPEC.md

## 1. Concept & Vision

**Find and deploy MCP servers in one click.** A sleek developer tool directory where developers discover MCP servers (browser, git, slack, github, etc.), preview documentation, and deploy a running server to Vercel with their own API key pre-wired — in seconds. No config files, no terminal commands, no friction.

**Emotional target:** "Finally, a place where I can find MCP servers without hunting through GitHub and get them running without reading 500 lines of README."

---

## 2. Design Language

**Aesthetic:** Developer-tool minimal — dark IDE-inspired palette, monospace accents, clean geometry. Think Raycast meets Vercel dashboard.

**Color Palette:**
- Background: `#0a0a0f`
- Surface: `#111118`
- Card: `#1a1a24`
- Border: `#2a2a3a`
- Primary: `#6366f1` (indigo — action/deploy)
- Accent: `#22d3ee` (cyan — highlight/category)
- Text primary: `#f1f1f5`
- Text muted: `#6b6b80`
- Success: `#22c55e`

**Typography:**
- UI: `Inter`, weight 400/500/600
- Code/tag labels: `JetBrains Mono`

**Motion:** Subtle — card hover lift (translateY -2px, 150ms ease), search input focus glow, button press scale(0.97).

---

## 3. Layout & Structure

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: Logo + "MCP Server Discover" + tagline         │
├─────────────────────────────────────────────────────────┤
│ SEARCH BAR: full-width, placeholder "Search MCP..."    │
├─────────────────────────────────────────────────────────┤
│ FILTER TAGS: [All] [Browser] [Git] [Messaging] [AI]... │
├─────────────────────────────────────────────────────────┤
│ SERVER GRID: 3-col responsive card grid                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Category tag │ │ Server name │ │ Description  │    │
│  │              │ │ + icon      │ │ 2 lines max  │    │
│  │ Capabilities │ │             │ │              │    │
│  │              │ │[Deploy →]  │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────┤
│ FOOTER: Minimal — "Powered by UniverseCreator"          │
└─────────────────────────────────────────────────────────┘
```

**Responsive:** 3-col → 2-col → 1-col

---

## 4. Features & Interactions

### Search
- Real-time client-side filter as user types
- Matches server name, description, category, capabilities
- Empty state: "No MCP servers match your search" with clear button

### Filter Tags
- Clicking a tag filters the grid
- Active tag highlighted with primary color
- "All" clears category filter

### Server Cards
- Shows: category badge, server name, description (truncated), capability list
- Hover: subtle lift + border glow
- "Deploy to Vercel →" button triggers deploy flow

### Deploy Flow
1. User clicks "Deploy to Vercel"
2. Modal opens: "Configure your API Key" — input for the server's required API key (e.g., GitHub token, Slack webhook)
3. User pastes key, clicks "Deploy"
4. Button shows spinner → Success state with deployed URL
5. Error state shows retry option

### Deploy Modal States
- **Input:** API key field (password type), server info, Deploy button
- **Loading:** Spinner + "Deploying to Vercel..."
- **Success:** Green checkmark + "Deployed!" + live URL copy button
- **Error:** Red message + "Retry" button

---

## 5. Component Inventory

### Search Bar
- Full-width input, rounded-lg, dark surface background
- Left icon (magnifier), placeholder text
- Focus: indigo ring glow

### Filter Tag Pill
- Rounded-full, small padding, monospace font
- Default: dark surface, muted text
- Active: primary indigo bg, white text
- Hover: border highlight

### Server Card
- Rounded-xl, card background, border
- Category badge (top-left, small monospace)
- Server name (bold, with emoji/icon)
- Description (2-line clamp, muted)
- Capability tags (small pills, cyan accent)
- Deploy button (bottom, full-width, primary style)

### Deploy Modal
- Overlay: black 70% opacity
- Modal: centered, max-w-md, surface bg, rounded-2xl
- API key input with show/hide toggle
- Copy button for success URL

---

## 6. Technical Approach

**Stack:** Single HTML file + vanilla JS (no build step) + Vercel serverless function

### Files
```
products/mcp-discover/
├── SPEC.md
├── product.json
├── public/
│   ├── index.html        # Full single-page app
│   └── api/
│       └── deploy/
│           └── index.js  # Vercel serverless: POST /api/deploy
```

### Serverless Deploy Handler (`/api/deploy`)
**Request:**
```json
POST /api/deploy
{ "server": "github", "apiKey": "ghp_xxxx", "projectName": "my-github-mcp" }
```

**Action:** Calls Vercel Deploy Hook + returns deploy URL

**Response:**
```json
{ "success": true, "url": "https://my-github-mcp.vercel.app", "deployId": "dpl_xxx" }
```

### MCP Server Catalog (hardcoded in index.html)
12 servers across categories:
- **Browser:** Puppeteer, Playwright
- **Git:** GitHub, GitLab
- **Messaging:** Slack, Discord, Teams
- **Cloud:** AWS SDK, Google Cloud
- **AI:** OpenAI, Anthropic, Pinecone, Chroma

### Data Model
Each server entry:
```js
{
  id: "github",
  name: "GitHub",
  icon: "🐙",
  category: "Git",
  description: "Interact with GitHub repositories, issues, PRs",
  capabilities: ["repos", "issues", "PRs", "actions"],
  requiredKey: "GitHub Personal Access Token",
  deployHook: "https://vercel.com/api/v1/deploy/hooks/VERCEL_DEPLOY_HOOK_ID", // per server template
  templateUrl: "https://github.com/universe7creator/mcp-server-github"
}
```

---

## 7. Vercel Deploy Configuration

```json
// vercel.json (root of products/mcp-discover/)
{
  "redirects": [
    { "source": "/(.*)", "destination": "/public/$1" }
  ]
}
```

Note: Since this is a static HTML + serverless function setup, the serverless function at `api/deploy/index.js` handles deploy hook triggering. The `vercel.json` routes `/api/deploy` to the function.
