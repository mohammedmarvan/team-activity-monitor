import OpenAI from 'openai';
import { openai } from '../../config/config.js';

const client = new OpenAI({
  apiKey: openai.apiKey,
});

export async function generateResponse(name, { jira, commits, prs }, intent) {
  let instructions = `
Summarize this team member's activity:
Name: ${name}
`;

  if (intent !== 'github') {
    instructions += `
JIRA Issues: ${jira?.length ? JSON.stringify(jira, null, 2) : 'None'}
  `;
  }

  if (intent !== 'jira') {
    instructions += `
GitHub Commits: ${commits?.length ? JSON.stringify(commits, null, 2) : 'None'}
GitHub PRs: ${prs?.length ? JSON.stringify(prs, null, 2) : 'None'}
After the summary, provide two separate bullet lists:
 - One for commits (repo, message, timestamp)
 - One for pull requests (title, repo, state, updated)
    `;
  }

  instructions += `
Respond in a concise, neutral tone.
Only summarize data that is included above.
Do NOT comment on missing sections.
`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: 'Generate a summary of the above activity.' },
    ],
  });

  return completion.choices[0].message.content;
}
