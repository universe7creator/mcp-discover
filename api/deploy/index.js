// Vercel serverless function: POST /api/deploy
// Triggers a Vercel deploy hook for the specified MCP server template
//
// Request body:
// {
//   server: "github" | "gitlab" | "slack" | ...,
//   apiKey: "ghp_xxxx" | "slack-token-xxx" | ...,
//   projectName: "my-mcp-github"
// }
//
// Response:
//   { success: true, url: "https://my-mcp-github.vercel.app", deployId: "dpl_xxx" }
//   { success: false, error: "..." }

const TEMPLATE_DEPLOY_HOOKS = {
  github:     process.env.GITHUB_DEPLOY_HOOK,
  gitlab:     process.env.GITLAB_DEPLOY_HOOK,
  puppeteer:  process.env.PUPPETEER_DEPLOY_HOOK,
  playwright: process.env.PLAYWRIGHT_DEPLOY_HOOK,
  slack:      process.env.SLACK_DEPLOY_HOOK,
  discord:    process.env.DISCORD_DEPLOY_HOOK,
  teams:      process.env.TEAMS_DEPLOY_HOOK,
  aws:        process.env.AWS_DEPLOY_HOOK,
  googlecloud:process.env.GOOGLECLOUD_DEPLOY_HOOK,
  openai:     process.env.OPENAI_DEPLOY_HOOK,
  anthropic:  process.env.ANTHROPIC_DEPLOY_HOOK,
  pinecone:   process.env.PINECONE_DEPLOY_HOOK,
  chroma:     process.env.CHROMA_DEPLOY_HOOK,
};

const TEMPLATE_REPOS = {
  github:     "universe7creator/mcp-server-github",
  gitlab:     "universe7creator/mcp-server-gitlab",
  puppeteer:  "universe7creator/mcp-server-puppeteer",
  playwright: "universe7creator/mcp-server-playwright",
  slack:      "universe7creator/mcp-server-slack",
  discord:    "universe7creator/mcp-server-discord",
  teams:      "universe7creator/mcp-server-teams",
  aws:        "universe7creator/mcp-server-aws",
  googlecloud:"universe7creator/mcp-server-gcp",
  openai:     "universe7creator/mcp-server-openai",
  anthropic:  "universe7creator/mcp-server-anthropic",
  pinecone:   "universe7creator/mcp-server-pinecone",
  chroma:     "universe7creator/mcp-server-chroma",
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { server, apiKey, projectName } = req.body || {};

  if (!server || !TEMPLATE_DEPLOY_HOOKS[server]) {
    return res.status(400).json({ success: false, error: "Unknown server: " + (server || "undefined") });
  }

  if (!projectName || typeof projectName !== "string") {
    return res.status(400).json({ success: false, error: "projectName is required" });
  }

  const deployHook = TEMPLATE_DEPLOY_HOOKS[server];
  if (!deployHook) {
    return res.status(503).json({ success: false, error: "Deploy hook not configured for this server" });
  }

  const repo = TEMPLATE_REPOS[server];

  // Build the deploy hook URL with optional env vars
  // The deploy hook POSTs to Vercel's deploy trigger API
  try {
    const body = {
      gitSource: {
        type: "github",
        repo,
        branch: "main",
      },
      env: apiKey ? [
        { key: "MCP_API_KEY", value: apiKey, target: "production" },
        { key: "MCP_SERVER_TYPE", value: server, target: "production" },
      ] : [
        { key: "MCP_SERVER_TYPE", value: server, target: "production" },
      ],
    };

    const hookRes = await fetch(deployHook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!hookRes.ok) {
      const text = await hookRes.text();
      console.error("Deploy hook error:", hookRes.status, text);
      return res.status(502).json({ success: false, error: "Deploy hook rejected request: " + hookRes.status });
    }

    const result = await hookRes.json();
    const deployId = result?.deployId || result?.id || "pending";

    return res.status(200).json({
      success: true,
      url: `https://${projectName}.vercel.app`,
      deployId,
      server,
      repo,
    });
  } catch (err) {
    console.error("Deploy error:", err);
    return res.status(500).json({ success: false, error: "Internal deploy error: " + err.message });
  }
};
