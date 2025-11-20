import { parseQuery } from '../services/query-parser.js';
import { teamMap } from '../../config/teamMap.private.js';
import { getUserIssues } from '../services/jira-client.js';
import { getRecentCommits, getPullRequests } from '../services/github-client.js';
import { generateResponse } from '../services/response-generator.js';
import logger from '../utils/logger.js';
import { getCache, setCache } from '../utils/cache.js';

export async function askController(req, res) {
  const query = req.body.query;
  logger.info(`Received query: ${query}`);

  const { intent, name } = parseQuery(query);

  if (!name) {
    logger.warn('Name could not be extracted');
    return res.json({ answer: "Sorry, I couldn't identify the team member's name." });
  }

  const identity = teamMap[name.toLowerCase()];
  if (!identity) {
    logger.warn(`No mapping found for ${name}`);
    return res.json({ answer: `I don't have records for ${name}.` });
  }

  // Check cache
  const cacheKey = `${intent}:${name.toLowerCase()}`;

  const cached = getCache(cacheKey);
  if (cached) {
    logger.info(`Serving cached data for ${name}`);
    return res.json({ answer: cached });
  }

  try {
    let jira = null,
      commits = null,
      prs = null;

    if (intent === 'jira') {
      jira = await getUserIssues(identity.jira);
    } else if (intent === 'github') {
      [commits, prs] = await Promise.all([
        getRecentCommits(identity.github),
        getPullRequests(identity.github),
      ]);
    } else if (intent === 'both') {
      [jira, commits, prs] = await Promise.all([
        getUserIssues(identity.jira),
        getRecentCommits(identity.github),
        getPullRequests(identity.github),
      ]);
    }

    const noJira = !jira || jira.length === 0;
    const noCommits = !commits || commits.length === 0;
    const noPrs = !prs || prs.length === 0;

    if (intent === 'jira' && noJira) {
      return res.json({ answer: `There are no active Jira issues assigned to ${name}.` });
    }

    if (intent === 'github' && noCommits && noPrs) {
      return res.json({
        answer: `There are no recent GitHub commits or pull requests by ${name}.`,
      });
    }

    if (intent === 'both' && noJira && noCommits && noPrs) {
      return res.json({ answer: `${name} has no recent activity on Jira or GitHub.` });
    }

    const answer = await generateResponse(name, { jira, commits, prs }, intent);
    logger.info(`Generated response for ${name}`);

    // set to cache
    setCache(cacheKey, answer);
    res.json({ answer });
  } catch (err) {
    logger.error(`Error fetching data for ${name}: ${err.message}`);
    res.json({ answer: 'Something went wrong while fetching data, Please give a try again...' });
  }
}
