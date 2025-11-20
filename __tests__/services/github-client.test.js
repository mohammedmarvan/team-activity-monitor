import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock config
jest.mock('../../config/config.js', () => ({
  github: {
    token: 'test-token',
  },
}));

describe('github-client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentCommits', () => {
    it('should fetch and filter recent commits', async () => {
      const mockEvents = [
        {
          type: 'PushEvent',
          repo: { name: 'test/repo' },
          payload: { head: 'abc123' },
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          type: 'PullRequestEvent',
          repo: { name: 'test/repo2' },
          payload: { head: 'def456' },
          created_at: '2025-01-02T00:00:00Z',
        },
        {
          type: 'PushEvent',
          repo: { name: 'test/repo3' },
          payload: { head: 'ghi789' },
          created_at: '2025-01-03T00:00:00Z',
        },
      ];

      axios.get.mockResolvedValue({ data: mockEvents });

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getRecentCommits('testuser');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.github.com/users/testuser/events',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token test-token',
          }),
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        repo: 'test/repo',
        commitId: 'abc123',
        timestamp: '2025-01-01T00:00:00Z',
      });
    });

    it('should return empty array when no PushEvents are found', async () => {
      axios.get.mockResolvedValue({
        data: [
          {
            type: 'PullRequestEvent',
            repo: { name: 'test/repo' },
            payload: { head: 'abc123' },
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getRecentCommits('testuser');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPullRequests', () => {
    it('should fetch and format pull requests', async () => {
      const mockPRs = {
        items: [
          {
            title: 'Test PR',
            html_url: 'https://github.com/test/repo/pull/1',
            state: 'open',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            title: 'Another PR',
            html_url: 'https://github.com/test/repo/pull/2',
            state: 'closed',
            updated_at: '2025-01-02T00:00:00Z',
          },
        ],
      };

      axios.get.mockResolvedValue({ data: mockPRs });

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getPullRequests('testuser');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.github.com/search/issues?q=author:testuser+type:pr',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token test-token',
          }),
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        title: 'Test PR',
        url: 'https://github.com/test/repo/pull/1',
        state: 'open',
        updated: '2025-01-01T00:00:00Z',
      });
    });

    it('should handle 422 error (user not found)', async () => {
      const error = {
        response: {
          status: 422,
        },
      };
      axios.get.mockRejectedValue(error);

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getPullRequests('invaliduser');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Could not find GitHub user');
    });

    it('should handle 404 error (user does not exist)', async () => {
      const error = {
        response: {
          status: 404,
        },
      };
      axios.get.mockRejectedValue(error);

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getPullRequests('nonexistent');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('does not exist');
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      const githubClient = await import('../../src/services/github-client.js');
      const result = await githubClient.getPullRequests('testuser');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('unexpected error');
    });
  });
});

