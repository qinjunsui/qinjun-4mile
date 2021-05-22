# 4 Mile Coding Challenge

- Author: Qinjun Sui
- Date: 05/21/2021

## Demo

- https://qinjun-4mile.uc.r.appspot.com/api/data?language=javascript&repo_count=20&commit_count=50
- https://qinjun-4mile.uc.r.appspot.com/api/data?language=python&repo_count=10&commit_count=30
- https://qinjun-4mile.uc.r.appspot.com/api/data?language=go&repo_count=5&commit_count=15

## Run Command

For first time installation

```
npm install
```

For running in local

```
npm start
```

## High level implementation plan

1. Get the top-N repositories by language, fetch the repo name, repo url and star count.
2. Get the commits info by Using the repo name above.
3. Construct the return data.

## Query properties

| Name         |  Type  |   Default    | Comment                                                                          |
| ------------ | :----: | :----------: | :------------------------------------------------------------------------------- |
| language     | string | `javascript` | Example: `java` , `javascript` , `python` , `java` , `ruby` , `php`              |
| repo_count   | number |     `20`     | Expect to take number, if invalid input detect, it will be set to default value. |
| commit_count | number |     `50`     | Expect to take number, if invalid input detect, it will be set to default value. |

## Testing endpoint

For the finish endpoint

* http://localhost:8080/api/data?language=javascript&repo_count=20&commit_count=50
* http://localhost:8080/api/data?language=python&repo_count=10&commit_count=30
* http://localhost:8080/api/data?language=go&repo_count=5&commit_count=15

For commits

* http://localhost:8080/api/commits?repo=vuejs/vue
* http://localhost:8080/api/commits?repo=ytdl-org/youtube-dl

For repositories

* http://localhost:8080/api/repositories?language=go
* http://localhost:8080/api/repositories?language=ruby
* http://localhost:8080/api/repositories?language=php

##  JSON response

Sample endpoint

* http://localhost:8080/api/data?language=php&repo_count=2&commit_count=3

Notes: for testing purpose, I limited the repo count and commit count to a small number.

```json
{
  "commit_count": 3,
  "repo_count": 2,
  "results": [
    {
      "repository_name": "laravel/laravel",
      "star_count": 65277,
      "repo_url": "https://github.com/laravel/laravel",
      "authors": [
        {
          "name": "Taylor Otwell",
          "commit_hash": "b3c2e8d569dbe59af69f6682483d2352b950ab58",
          "commit_url": "https://api.github.com/repos/laravel/laravel/git/commits/c5d38d469a447d6831c3cf56d193be7941d6586f"
        },
        {
          "name": "Dries Vints",
          "commit_hash": "1411436be267ad7b8aba1697c9fb91e5bdd394d0",
          "commit_url": "https://api.github.com/repos/laravel/laravel/git/commits/afa06fac2aa9a83ad843b9968a21bb013f015704"
        },
        {
          "name": "Hiren Keraliya",
          "commit_hash": "21f2dd845fb4902c544949c57b15d50a3d69fc78",
          "commit_url": "https://api.github.com/repos/laravel/laravel/git/commits/d3efbaab58945ee97c4719283b04632fe474c0e7"
        }
      ]
    },
    {
      "repository_name": "danielmiessler/SecLists",
      "star_count": 31600,
      "repo_url": "https://github.com/danielmiessler/SecLists",
      "authors": [
        {
          "name": "g0tmi1k",
          "commit_hash": "94d27ad4e22fc3719f19e6fbfc6170d16321d057",
          "commit_url": "https://api.github.com/repos/danielmiessler/SecLists/git/commits/285474cf9bff85f3323c5a1ae436f78acd1cb62c"
        },
        {
          "name": "CHackA0101",
          "commit_hash": "94d27ad4e22fc3719f19e6fbfc6170d16321d057",
          "commit_url": "https://api.github.com/repos/danielmiessler/SecLists/git/commits/872ccb43b0e7e4ed4ab5e256e26e9e6b5f3f9623"
        },
        {
          "name": "g0tmi1k",
          "commit_hash": "f804adcd97ba3117b1cc20b12eeb03d71cebfb35",
          "commit_url": "https://api.github.com/repos/danielmiessler/SecLists/git/commits/7693c73c26dff5cc64f5bcd872138a887c50b572"
        }
      ]
    }
  ]
}
```

## API Token Application
- Go to Github -> Settings Page -> Developer settings
- Go to Personal access tokens -> Generate new token
- For security reason, there will be a .env file in my local and will be removed on git push

## Error Handling

Invalid language input
Sample test error url:

* http://localhost:8080/api/data?language=lata&repo_count=8&commit_count=a
* http://localhost:8080/api/repositories?language=lata

```js
.catch((err) => ({
    status: err.response.status,
    stage: errorHandle.stage,
    error: [errorHandle.msg, err.response.statusText].join(','),
}))

errorHandle = {
    stage: 'Get repositories by language',
    msg: 'Invalid language',
};

errorHandle = {
    stage: 'Get commits by repo name',
    msg: 'Cannot access repo',
}
```

## Optimization

For the search commits by repo name part, we will need to make nested API call.
The most straight-forward solution: waiting for the call resolve one-by-one. But it will take a long time to wait.
Optimization: use asynchronous approach. Since all these calls are independent, we can fetch all the calls at the same time, and using a Promise.all() method to sync on the finish stage.

```js
// Before optimization, wait one-by-one
for (let i = 0; i < repositories.length; i++) {
    const {
        repository_name
    } = repositories[i];
    const authors = await getCustomizedCommits(repository_name, commitCount);
    repositories[i].authors = authors;
}

// Optimization with asynchronous
const promises = repositories.map((repo) => {
    return new Promise(async (resolve) => {
        const {
            repository_name
        } = repo;
        const authors = await getCustomizedCommits(repository_name, commitCount);
        repo.authors = authors;
        resolve();
    });
});
await Promise.all(promises);
```

## Next Step

* Building a frontend UI for easily change the input data.
* Construct a dashboard table to show the metric factors like stars, commit frequency or commit time to analyze the behavior of the community.
