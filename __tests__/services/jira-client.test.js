import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock config
jest.mock('../../config/config.js', () => ({
  jira: {
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    token: 'test-token',
  },
}));

describe('jira-client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserIssues', () => {
    it('should fetch and format user issues', async () => {
      const mockResponse = {
        data: {
          issues: [
            {
              key: 'PROJ-1',
              fields: {
                summary: 'Test Issue 1',
                status: { name: 'In Progress' },
                updated: '2025-01-01T00:00:00Z',
                timetracking: { timeSpent: '2h' },
              },
            },
            {
              key: 'PROJ-2',
              fields: {
                summary: 'Test Issue 2',
                status: { name: 'To Do' },
                updated: '2025-01-02T00:00:00Z',
                timetracking: { timeSpent: '1h' },
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      const jiraClient = await import('../../src/services/jira-client.js');
      const result = await jiraClient.getUserIssues('test@example.com');

      expect(axios.post).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/search/jql',
        expect.objectContaining({
          jql: expect.stringContaining('assignee="test@example.com"'),
          fields: ['summary', 'status', 'updated', 'timetracking'],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            Accept: 'application/json',
          }),
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'PROJ-1',
        summary: 'Test Issue 1',
        status: 'In Progress',
        updated: '2025-01-01T00:00:00Z',
        timetracking: { timeSpent: '2h' },
      });
    });

    it('should return empty array when no issues are found', async () => {
      axios.post.mockResolvedValue({
        data: {
          issues: [],
        },
      });

      const jiraClient = await import('../../src/services/jira-client.js');
      const result = await jiraClient.getUserIssues('test@example.com');

      expect(result).toHaveLength(0);
    });

    it('should use correct JQL query with status filter', async () => {
      axios.post.mockResolvedValue({
        data: { issues: [] },
      });

      const { getUserIssues } = await import('../../src/services/jira-client.js');
      await getUserIssues('user@example.com');

      const callArgs = axios.post.mock.calls[0];
      const jql = callArgs[1].jql;

      expect(jql).toContain('assignee="user@example.com"');
      expect(jql).toContain('statusCategory != Done');
      expect(jql).toContain('ORDER BY updated DESC');
    });
  });
});

