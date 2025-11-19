import nlp from 'compromise';
import { teamMap } from '../../config/teamMap.private.js';

const teamNames = Object.keys(teamMap);

const teamPlugin = {
  tags: {
    TeamMember: {
      isA: 'Person',
    },
  },
  words: teamNames.reduce((acc, name) => {
    acc[name.toLowerCase()] = 'TeamMember';
    return acc;
  }, {}),
};

nlp.extend(teamPlugin);

function extractName(query) {
  let cleaned = query
    .replace(/’s/gi, '')
    .replace(/'s/gi, '')
    .replace(/[?.,!;:]+$/g, '')
    .replace(/([A-Za-z]+)[?.,!;:]/g, '$1');
  const doc = nlp(cleaned);
  const names = doc.match('#TeamMember').out('array');

  const teamMatches = doc.match('#TeamMember').out('array');
  if (teamMatches.length) return teamMatches[0];

  const people = doc.people().out('array');
  if (people.length) return people[0];

  return null;
}

export function parseQuery(query) {
  const lower = query.toLowerCase();

  let intent = null;
  if (lower.includes('issue') || lower.includes('ticket') || lower.includes('working on')) {
    intent = 'jira';
  } else if (lower.includes('commit') || lower.includes('pull request') || lower.includes('pr')) {
    intent = 'github';
  } else if (lower.includes('activity') || lower.includes('activities')) {
    intent = 'both';
  }

  const name = extractName(query);

  return { intent, name };
}
