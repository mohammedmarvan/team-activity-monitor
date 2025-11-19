import axios from 'axios';
import { jira } from '../../config/config.js';

const authHeader = {
  headers: {
    Authorization: `Basic ${Buffer.from(`${jira.email}:${jira.token}`).toString('base64')}`,
    Accept: 'application/json',
  },
};

export async function getUserIssues(username) {
  const jql = `assignee="${username}" AND statusCategory != Done ORDER BY updated DESC`;
  const url = `${jira.baseUrl}/rest/api/3/search/jql`;
  const body = {
    jql,
    fields: ['summary', 'status', 'updated'],
  };

  const response = await axios.post(url, body, authHeader);

  return response.data.issues.map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    updated: issue.fields.updated,
  }));
}
