# Team Activity Monitor

Team Activity Monitor is a lightweight Express + browser UI that lets you ask about Jira issues and GitHub commits/pull requests for mapped teammates. The service proxies Jira, GitHub, and OpenAI, then renders responses in a chat-style interface.

## Requirements

- Node.js 22.x (use `nvm install 22 && nvm use 22` or your preferred manager)
- npm 10+ (bundled with Node 22)

## Installation

1. Clone this repository and switch into the project directory:

2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Run formatting/linting to ensure a clean workspace:
   ```bash
   npm run format
   ```

## Start Setup

- Development with auto-reload:
  ```bash
  npm run dev
  ```
- Production-style run:
  ```bash
  npm start
  ```
  Both commands boot `src/main.js`, which serves the API and the static frontend. Logs are written via `winston` to `logs/app.log`.

## Environment Variables

### 1. env-example file

Use the following template for your environment variables (save it as `.env.example` for the team and copy to `.env` locally):

```
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=team-member@example.com
JIRA_API_TOKEN=atlassian-api-token
GITHUB_TOKEN=ghp_yourGitHubToken
OPENAI_API_KEY=sk-yourOpenAIKey

# Optional overrides
PORT=3000
```

### 2. Updating your `.env`

1. Copy the example file: `cp .env.example .env`.
2. Fill in real credentials:
   - `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`: used by `config/config.js` to fetch Jira issues.
   - `GITHUB_TOKEN`: enables GitHub commit/PR lookups.
   - `OPENAI_API_KEY`: powers drafted responses.
3. Never commit `.env`; it is already covered by `.gitignore`.

### 3. Configuring the port

- The server defaults to port `3000`. Override it by setting `PORT` in your `.env`.
- Ensure the chosen port is free or update reverse proxies accordingly.

### 4. Team Member Mapping

For security reasons, real Jira/GitHub user identifiers are not stored in the repository.

To configure your own team mapping:

1. Copy the sample file:
    ```
    cp src/config/teamMap.sample.js src/config/teamMap.private.js
    ```

2. Replace the sample data with your real Jira/GitHub IDs.
3. `teamMap.private.js` is automatically excluded from Git and loaded at runtime.

## Checking the Interface

1. Start the server (`npm run dev` or `npm start`).
2. Open your browser to `http://localhost:<PORT>` (defaults to `http://localhost:3000`).
3. Enter a natural-language query such as “Show GitHub activity for Marvan this week”.
4. The chat window displays:
   - Your prompt bubbles on the right.
   - Formatted Jira/GitHub summaries on the left (parsed via `marked` for Markdown).
5. Monitor `logs/app.log` (or the terminal) for request/response traces if troubleshooting.

With the environment configured and the server running, you can now monitor teammate activity across Jira and GitHub in one place.
