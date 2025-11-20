import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/services/query-parser.js', () => ({
  parseQuery: jest.fn(),
}));

jest.mock('../../config/teamMap.private.js', () => ({
  teamMap: {
    marvan: {
      jira: 'testuser1@example.com',
      github: 'mohammedmarvan',
    },
    abhishek: {
      jira: 'abhishek@example.com',
      github: 'abhishek-dev',
    },
  },
}));

jest.mock('../../src/services/jira-client.js', () => ({
  getUserIssues: jest.fn(),
}));

jest.mock('../../src/services/github-client.js', () => ({
  getRecentCommits: jest.fn(),
  getPullRequests: jest.fn(),
}));

jest.mock('../../src/services/response-generator.js', () => ({
  generateResponse: jest.fn(),
}));

jest.mock('../../src/utils/logger.js', () => {
  return {
    __esModule: true,
    default: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };
});

describe('askController', () => {
  let askController;
  let parseQuery;
  let getUserIssues;
  let getRecentCommits;
  let getPullRequests;
  let generateResponse;
  let req, res;

  beforeEach(async () => {
    jest.clearAllMocks();

    const queryParser = await import('../../src/services/query-parser.js');
    const jiraClient = await import('../../src/services/jira-client.js');
    const githubClient = await import('../../src/services/github-client.js');
    const responseGen = await import('../../src/services/response-generator.js');
    const controller = await import('../../src/controllers/askController.js');

    parseQuery = queryParser.parseQuery;
    getUserIssues = jiraClient.getUserIssues;
    getRecentCommits = githubClient.getRecentCommits;
    getPullRequests = githubClient.getPullRequests;
    generateResponse = responseGen.generateResponse;
    askController = controller.askController;

    req = {
      body: {
        query: 'What is Marvan working on?',
      },
    };

    res = {
      json: jest.fn(),
    };
  });

  it('should return error when name cannot be extracted', async () => {
    parseQuery.mockReturnValue({ intent: 'jira', name: null });

    await askController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      answer: "Sorry, I couldn't identify the team member's name.",
    });
  });

  it('should return error when team member is not in teamMap', async () => {
    parseQuery.mockReturnValue({ intent: 'jira', name: 'unknown' });

    await askController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      answer: "I don't have records for unknown.",
    });
  });

  it('should fetch Jira issues when intent is jira', async () => {
    parseQuery.mockReturnValue({ intent: 'jira', name: 'marvan' });
    getUserIssues.mockResolvedValue([
      {
        key: 'PROJ-1',
        summary: 'Test Issue',
        status: 'In Progress',
        updated: '2025-01-01T00:00:00Z',
      },
    ]);
    generateResponse.mockResolvedValue('Marvan has 1 active Jira issue.');

    await askController(req, res);

    expect(getUserIssues).toHaveBeenCalledWith('testuser1@example.com');
    expect(generateResponse).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      answer: 'Marvan has 1 active Jira issue.',
    });
  });

  it('should return message when no Jira issues found', async () => {
    parseQuery.mockReturnValue({ intent: 'jira', name: 'marvan' });
    getUserIssues.mockResolvedValue([]);

    await askController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      answer: 'There are no active Jira issues assigned to marvan.',
    });
    expect(generateResponse).not.toHaveBeenCalled();
  });

  it('should fetch GitHub data when intent is github', async () => {
    parseQuery.mockReturnValue({ intent: 'github', name: 'marvan' });
    getRecentCommits.mockResolvedValue([
      { repo: 'test/repo', commitId: 'abc123', timestamp: '2025-01-01T00:00:00Z' },
    ]);
    getPullRequests.mockResolvedValue([
      { title: 'Test PR', url: 'https://github.com/test/repo/pull/1', state: 'open' },
    ]);
    generateResponse.mockResolvedValue('Marvan has 1 commit and 1 PR.');

    await askController(req, res);

    expect(getRecentCommits).toHaveBeenCalledWith('mohammedmarvan');
    expect(getPullRequests).toHaveBeenCalledWith('mohammedmarvan');
    expect(generateResponse).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      answer: 'Marvan has 1 commit and 1 PR.',
    });
  });

  it('should return message when no GitHub activity found', async () => {
    parseQuery.mockReturnValue({ intent: 'github', name: 'marvan' });
    getRecentCommits.mockResolvedValue([]);
    getPullRequests.mockResolvedValue([]);

    await askController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      answer: 'There are no recent GitHub commits or pull requests by marvan.',
    });
    expect(generateResponse).not.toHaveBeenCalled();
  });

  it('should fetch both Jira and GitHub data when intent is both', async () => {
    parseQuery.mockReturnValue({ intent: 'both', name: 'marvan' });
    getUserIssues.mockResolvedValue([{ key: 'PROJ-1', summary: 'Issue 1' }]);
    getRecentCommits.mockResolvedValue([{ repo: 'test/repo', commitId: 'abc123' }]);
    getPullRequests.mockResolvedValue([{ title: 'PR 1' }]);
    generateResponse.mockResolvedValue('Marvan has activity on both platforms.');

    await askController(req, res);

    expect(getUserIssues).toHaveBeenCalled();
    expect(getRecentCommits).toHaveBeenCalled();
    expect(getPullRequests).toHaveBeenCalled();
    expect(generateResponse).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    parseQuery.mockReturnValue({ intent: 'jira', name: 'marvan' });
    getUserIssues.mockRejectedValue(new Error('API Error'));

    await askController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      answer: 'Something went wrong while fetching data, Please give a try again...',
    });
  });
});
