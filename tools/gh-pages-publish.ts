const { cd, exec, echo, touch } = require("shelljs");
const { readFileSync } = require("fs");
const url = require("url");

if (process.env.TRAVIS_PULL_REQUEST !== "false") {
  echo("This run was triggered by a pull request and therefore the docs won't be published.");
  process.exit(0);
}

let repoUrl;
let pkg = JSON.parse(readFileSync("package.json") as any);
if (typeof pkg.repository === "object") {
  if (!pkg.repository.hasOwnProperty("url")) {
    throw new Error("URL does not exist in repository section");
  }
  repoUrl = pkg.repository.url;
} else {
  repoUrl = pkg.repository;
}

let parsedUrl = url.parse(repoUrl);
let repository = (parsedUrl.host || "") + (parsedUrl.path || "");
let ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

echo("Deploying docs!!!");
cd("docs");
touch(".nojekyll");
exec("git init");
exec("git add .");
exec(`git config user.name "Horus Lugo"`);
exec(`git config user.email "horusgoul@gmail.com"`);
exec(`git commit -m "docs(docs): update gh-pages"`);
exec(`git push --force --quiet "https://${ghToken}@${repository}" master:gh-pages`);
echo("Docs deployed!!");
