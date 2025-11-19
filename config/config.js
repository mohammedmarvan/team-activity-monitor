import dotenv from 'dotenv';

dotenv.config();

export const jira = {
  baseUrl: process.env.JIRA_BASE_URL,
  email: process.env.JIRA_EMAIL,
  token: process.env.JIRA_API_TOKEN,
};

export const github = {
  token: process.env.GITHUB_TOKEN,
};

export const openai = {
  apiKey: process.env.OPENAI_API_KEY,
};
