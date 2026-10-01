#!/usr/bin/env bash
# Resolve (and create) this repo's subagent-driven-development scratch workspace.
# Usage: sdd-workspace.sh
#
# Prints the scratch workspace path on stdout. Uses the repo-local directory
# only when it is already ignored; otherwise uses a repo-specific cache path
# outside the repository. Never creates or changes any .gitignore.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: not inside a git repository" >&2
  exit 1
}

if git -C "$REPO_ROOT" check-ignore -q -- .hero-mmt-kit/sdd/progress.md; then
  SDD_DIR="${REPO_ROOT}/.hero-mmt-kit/sdd"
else
  REPO_KEY="$(printf '%s' "$REPO_ROOT" | git hash-object --stdin)"
  SDD_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/hero-mmt-kit/sdd/$REPO_KEY"
fi
mkdir -p "$SDD_DIR"

echo "$SDD_DIR"
