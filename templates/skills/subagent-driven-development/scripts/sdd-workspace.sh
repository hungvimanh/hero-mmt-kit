#!/usr/bin/env bash
# Resolve (and create) this repo's subagent-driven-development scratch workspace.
# Usage: sdd-workspace.sh
#
# Prints the absolute path to <repo-root>/.hero-mmt-kit/sdd/ on stdout.
# Creates the directory and a self-ignoring .gitignore inside it if missing,
# so task briefs, review packages, and the progress ledger never need the
# user's own .gitignore touched. Only this subtree is ignored — the rest of
# .hero-mmt-kit/ (config.json, session.json) stays tracked as before.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: not inside a git repository" >&2
  exit 1
}

SDD_DIR="${REPO_ROOT}/.hero-mmt-kit/sdd"
mkdir -p "$SDD_DIR"

if [[ ! -f "${SDD_DIR}/.gitignore" ]]; then
  printf '*\n' > "${SDD_DIR}/.gitignore"
fi

echo "$SDD_DIR"
