#!/usr/bin/env bash
# ScholarHUB workflow helper
#
# Automates the GitHub issue/PR/merge/sync route. No secrets are stored in
# this file; tokens must be exported as environment variables.
#
# Usage:
#   export GITHUB_TOKEN=ghp_xxx
#   export GITCODE_TOKEN=xxx
#
#   # 1. Create an issue
#   .trae/scripts/workflow-helper.sh issue "title" "body"
#
#   # 2. Push your feature branch, then open a PR linked to the issue
#   .trae/scripts/workflow-helper.sh pr <branch> <issue-number> "PR title"
#
#   # 3. Wait for CI to go green
#   .trae/scripts/workflow-helper.sh wait <pr-number>
#
#   # 4. Merge the PR
#   .trae/scripts/workflow-helper.sh merge <pr-number>
#
#   # 5. Sync the merged main to GitCode
#   .trae/scripts/workflow-helper.sh sync

set -euo pipefail

REPO_OWNER="MS33834"
REPO_NAME="scholarhub"
GITCODE_OWNER="badhope"
GITCODE_REPO="scholarhub"

GITHUB_API="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}"
GITCODE_URL="https://${GITCODE_OWNER}:${GITCODE_TOKEN}@gitcode.com/${GITCODE_OWNER}/${GITCODE_REPO}.git"

ensure_token() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Error: $name is not set" >&2
    exit 1
  fi
}

github_post() {
  local path="$1"
  local data="$2"
  curl -fsSL \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$data" \
    "${GITHUB_API}${path}"
}

github_get() {
  local path="$1"
  curl -fsSL \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "${GITHUB_API}${path}"
}

github_put() {
  local path="$1"
  local data="$2"
  curl -fsSL -X PUT \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$data" \
    "${GITHUB_API}${path}"
}

create_issue() {
  local title="$1"
  local body="$2"
  ensure_token GITHUB_TOKEN
  local payload
  payload=$(jq -n --arg title "$title" --arg body "$body" '{title:$title, body:$body}')
  github_post "/issues" "$payload"
}

create_pr() {
  local branch="$1"
  local issue="$2"
  local title="$3"
  ensure_token GITHUB_TOKEN
  local body="Closes #${issue}"
  local payload
  payload=$(jq -n \
    --arg title "$title" \
    --arg body "$body" \
    --arg head "$branch" \
    --arg base "main" \
    '{title:$title, body:$body, head:$head, base:$base}')
  github_post "/pulls" "$payload"
}

wait_ci() {
  local pr_number="$1"
  ensure_token GITHUB_TOKEN
  echo "Polling CI status for PR #${pr_number}..."
  while true; do
    local status
    status=$(github_get "/pulls/${pr_number}" | jq -r '.merge_state_status // .state')
    local conclusion
    conclusion=$(github_get "/pulls/${pr_number}" | jq -r '._links.statuses.href' 2>/dev/null || true)
    # Simpler: list check runs for the PR head
    local head_sha
    head_sha=$(github_get "/pulls/${pr_number}" | jq -r '.head.sha')
    local check_runs
    check_runs=$(curl -fsSL \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${head_sha}/check-runs")
    local overall
    overall=$(echo "$check_runs" | jq -r '[.check_runs[].conclusion // .check_runs[].status] | if all(. == "success") then "success" elif any(. == "failure" or . == "cancelled" or . == "timed_out") then "failure" else "pending" end')
    echo "  status: ${overall}"
    if [[ "$overall" == "success" ]]; then
      echo "CI is green."
      break
    elif [[ "$overall" == "failure" ]]; then
      echo "CI failed. Aborting." >&2
      exit 1
    fi
    sleep 15
  done
}

merge_pr() {
  local pr_number="$1"
  ensure_token GITHUB_TOKEN
  github_put "/pulls/${pr_number}/merge" '{"merge_method":"squash"}'
}

sync_gitcode() {
  ensure_token GITCODE_TOKEN
  echo "Syncing main to GitCode mirror..."
  git checkout main
  git pull github main
  git push "$GITCODE_URL" main
  echo "Sync complete."
}

command="${1:-}"
shift || true

case "$command" in
  issue)
    create_issue "$1" "$2"
    ;;
  pr)
    create_pr "$1" "$2" "$3"
    ;;
  wait)
    wait_ci "$1"
    ;;
  merge)
    merge_pr "$1"
    ;;
  sync)
    sync_gitcode
    ;;
  *)
    echo "Unknown command: $command" >&2
    echo "Usage: $0 {issue|pr|wait|merge|sync} ..." >&2
    exit 1
    ;;
esac
