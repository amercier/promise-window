#!/usr/bin/env bash
#
# deploy-github.sh
# ----------------
#
# Syntax:
#
#     GITHUB_TOKEN=... deploy-github.sh DIR REPO
#
# - `GITHUB_TOKEN`: GitHub API token with repo permission
# - `DIR`: directory to deploy
# - `REPO`: USER/REPO. Ex: amercier/promise-window

BRANCH=gh-pages

if [ $# -ne 2 ]; then echo "Syntax: $0 REPO DIR" 2>&1; exit 1; fi
if [ ! -e "$1" ]; then echo "Directory \"$1\" does not exist" 2>&1; exit 1; fi
if [ ! -d "$1" ]; then echo "File \"$1\" exists but is not a directory" 2>&1; exit 1; fi
if [ ! -r "$1" ]; then echo "Directory \"$1\" exists but is not readable" 2>&1; exit 1; fi
if [ ! -w "$1" ]; then echo "Directory \"$1\" exists but is not readable" 2>&1; exit 1; fi
if [ "$GITHUB_TOKEN" = "" ]; then echo "Missing GITHUB_TOKEN environment variable, not deploying." 2>&1; exit 1; fi

echo "Deploying \"$1\" to repository $2 on branch $BRANCH..."

( cd "$1"
  git init
  git config user.name "Travis CI"
  git config user.email "travis@nodemeatspace.com"
  git add .
  git commit -m "Deployed to Github Pages"
  git push --force --quiet "https://${GITHUB_TOKEN}@github.com/$2.git" "master:$BRANCH" # --quiet to prevent leaking token
)

echo "Done"
