import axios from 'axios';
import { github } from '../../config/config.js';

const headers = {
  Authorization: `token ${github.token}`,
  Accept: 'application/vnd.github.v3+json',
};

export async function getRecentCommits(username) {
  const events = await axios.get(`https://api.github.com/users/${username}/events`, { headers });
  return events.data
    .filter(e => e.type === 'PushEvent')
    .map(e => ({
      repo: e.repo.name,
      commitId: e.payload.head,
      timestamp: e.created_at,
    }));
}

export async function getPullRequests(username) {
  try {
    const prs = await axios.get(
      `https://api.github.com/search/issues?q=author:${username}+type:pr`,
      { headers }
    );

    return prs.data.items.map(pr => ({
      title: pr.title,
      url: pr.html_url,
      state: pr.state,
      updated: pr.updated_at,
    }));
  } catch (error) {
    if (error.response) {
      if (error.response.status === 422) {
        console.warn(`User ${username} not found or invalid query`);
        return { error: `Could not find GitHub user "${username}".` };
      }
      if (error.response.status === 404) {
        console.warn(`User ${username} does not exist`);
        return { error: `GitHub user "${username}" does not exist.` };
      }
    }
    console.error('Unexpected error:', error.message);
    return { error: 'An unexpected error occurred while fetching GitHub data.' };
  }
}
