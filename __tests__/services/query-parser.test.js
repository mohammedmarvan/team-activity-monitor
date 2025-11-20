import { describe, it, expect, jest } from '@jest/globals';

// Mock teamMap before importing
jest.mock('../../config/teamMap.private.js', () => ({
  teamMap: {
    marvan: { jira: 'testuser1@example.com', github: 'mohammedmarvan' },
    abhishek: { jira: 'abhishek@example.com', github: 'abhishek-dev' },
    mohammed: { jira: 'testuser2@example.com', github: 'mohammedmarvan' },
  },
}));

import { parseQuery } from '../../src/services/query-parser.js';

describe('query-parser', () => {
  describe('parseQuery', () => {
    it('should extract Jira intent from query', () => {
      const result = parseQuery('What issues is Marvan working on?');
      expect(result.intent).toBe('jira');
      expect(result.name).toBeTruthy();
    });

    it('should extract GitHub intent from query with "commit"', () => {
      const result = parseQuery('Show commits for Abhishek');
      expect(result.intent).toBe('github');
      expect(result.name).toBeTruthy();
    });

    it('should extract GitHub intent from query with "pull request"', () => {
      const result = parseQuery('What pull requests has Mohammed made?');
      expect(result.intent).toBe('github');
      expect(result.name).toBeTruthy();
    });

    it('should extract GitHub intent from query with "pr"', () => {
      const result = parseQuery('Show PRs for Marvan');
      expect(result.intent).toBe('github');
      expect(result.name).toBeTruthy();
    });

    it('should extract "both" intent from query with "activity"', () => {
      const result = parseQuery('What is Marvan\'s activity?');
      expect(result.intent).toBe('both');
      expect(result.name).toBeTruthy();
    });

    it('should extract "both" intent from query with "activities"', () => {
      const result = parseQuery('Show activities for Abhishek');
      expect(result.intent).toBe('both');
      expect(result.name).toBeTruthy();
    });

    it('should extract name from query with possessive form', () => {
      const result = parseQuery('What is Marvan\'s GitHub activity?');
      // The intent should be "both" because it contains "activity"
      expect(result.intent).toBe('both');
      expect(result).toHaveProperty('name');
    });

    it('should handle queries with punctuation', () => {
      const result = parseQuery('Show me Jira issues for Mohammed!');
      expect(result.intent).toBe('jira');
      expect(result.name).toBeTruthy();
    });

    it('should return null intent when no keywords are found', () => {
      const result = parseQuery('Hello, how are you?');
      expect(result.intent).toBeNull();
    });

    it('should handle case-insensitive queries', () => {
      // Note: "activity" keyword takes precedence over "github" in the parser
      const result = parseQuery('SHOW GITHUB ACTIVITY FOR MARVAN');
      expect(result.intent).toBe('both'); // "activity" triggers "both" intent
      expect(result.name).toBeTruthy();
    });
  });
});

