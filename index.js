import compression from 'compression';
import Express from 'express';
import cors from 'cors';

import {
  getCommits,
  getCustomizedRepositories,
  getRepositories,
} from './util';

const PORT = 8080;
const ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://qinjun-4mile.uc.r.appspot.com'
  : `http://localhost:${PORT}`
const app = Express();
app.use(compression());
app.use(cors()); // enable for frontend, in case we want to do the next step.

/**
 * @url /api/data
 * @query {string} language
 * @query {number} repo_count
 * @query {number} commit_count
 */
app.get('/api/data', async (req, res) => {
  const language = req.query.language || 'javascript';
  const repo_count = Number(req.query.repo_count);
  const commit_count = Number(req.query.commit_count);
  const errMsgs = []
  if (repo_count <= 0 || isNaN(repo_count) || !Number.isInteger(repo_count)) {
    errMsgs.push(`repo_count mush be a positive integer, ${req.query.repo_count} is invalid.`)
  }
  if (commit_count <= 0 || isNaN(commit_count) || !Number.isInteger(commit_count)) {
    errMsgs.push(`commit_count mush be a positive integer, ${req.query.commit_count} is invalid.`)
  }
  if (errMsgs.length) {
    return res.json({
      status: 500, stage: 'Query params retrieving', error: errMsgs.join(' ')
    })
  }
  const results = await getCustomizedRepositories(
    language,
    repo_count,
    commit_count
  );
  if (results.error) {
    return res.json(results);
  }
  res.json({ language, commit_count, repo_count, results });
});

/**
 * @url /api/repositories
 * @query {string} language
 */
app.get('/api/repositories', async (req, res) => {
  const language = req.query.language;
  if (!language) {
    return res.json({
      status: 500,
      stage: 'Getting repositories by language',
      error: 'Missing laugnage input'
    })
  }
  const repo = await getRepositories(language);
  res.json(repo);
});

/**
 * @url /api/commits
 * @query {string} repo
 */
app.get('/api/commits', async (req, res) => {
  const repo = req.query.repo || '';
  if (!repo) {
    return res.json({
      status: 500,
      stage: 'Getting commits by repository name',
      error: 'Missing repository name input'
    })
  }
  const commits = await getCommits(repo);
  res.json(commits);
});

app.use('*', (_, res) => {
  res.json({
    message: `This is Qinjun's 4-mile project!`,
    sampleDataUrl: `${ORIGIN}/api/data?language=python&repo_count=10&commit_count=30`,
    sampleRepositoriesUrl: `${ORIGIN}/api/repositories?language=ruby`,
    sampleCommitsUrl: `${ORIGIN}/api/commits?repo=vuejs/vue`
  });
});

// For GCP deploy reason, need to choose port 8080
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
