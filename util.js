import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const API = 'https://api.github.com';
/** HTTP util */
const token = process.env.GITHUB_TOKEN;
const httpGet = (url, Accept, errorHandle) =>
  axios
    .get(url, {headers: {Authorization: `Token ${token}`, Accept}})
    .then(({data}) => data)
    .catch((err) => ({
      status: err.response.status,
      stage: errorHandle.stage,
      error: [errorHandle.msg, err.response.statusText].join(','),
    }));
const buildQuery = (data) => {
  const items = [];
  for (const [key, val] of Object.entries(data)) {
    items.push([key, val].join(':'));
  }
  return items.join('+');
};

/** Repository */
export const getRepositories = async (language) => {
  // https://docs.github.com/en/rest/reference/search#search-repositories--parameters
  const q = buildQuery({language, sort: 'stars'});
  const url = `${API}/search/repositories?q=${q}`;
  const accept = 'application/vnd.github.v3+json';
  const errorHandle = {
    stage: 'Get repositories by language',
    msg: 'Invalid language',
  };
  const repositories = await httpGet(url, accept, errorHandle);
  return repositories;
};

export const getCustomizedRepositories = async (
  language,
  repoCount,
  commitCount
) => {
  const res = await getRepositories(language);
  // Error Check
  if (res.error) return res;

  // Step 1: get the top 20
  const topNRepositories = res.items
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, repoCount);
  // Step 2: construct the data
  const repositories = topNRepositories.map(
    ({full_name, stargazers_count, html_url}) => ({
      repository_name: full_name,
      star_count: stargazers_count,
      repo_url: html_url,
    })
  );

  // Step 3: get the authors data
  // for (let i = 0; i < repositories.length; i++) {
  //   const {repository_name} = repositories[i];
  //   const authors = await getCustomizedCommits(repository_name, commitCount);
  //   repositories[i].authors = authors;
  // }

  // Step 3+: Async optimization
  const promises = repositories.map((repo) => {
    return new Promise(async (resolve) => {
      const {repository_name} = repo;
      const authors = await getCustomizedCommits(repository_name, commitCount);
      repo.authors = authors;
      resolve();
    });
  });
  await Promise.all(promises);
  return repositories;
};

/** Commit */
export const getCommits = async (repo) => {
  const url = `${API}/repos/${repo}/commits`;
  const accept = 'application/vnd.github.cloak-preview+json';
  const errorHandle = {
    stage: 'Get commits by repo name',
    msg: 'Cannot access repo',
  };
  const commits = await httpGet(url, accept, errorHandle);
  return commits;
};

export const getCustomizedCommits = async (repo, commitCount) => {
  const res = await getCommits(repo);
  return res.slice(0, commitCount).map(({commit}) => {
    const {author, tree, url} = commit;
    return {name: author.name, commit_hash: tree.sha, commit_url: url};
  });
};
