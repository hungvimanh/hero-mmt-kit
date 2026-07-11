#!/usr/bin/env bash
# Build a single reviewable diff package for BASE..HEAD.
# Usage: review-package.sh BASE HEAD [OUTFILE]
#
# Writes commit log, diffstat, and a full unified diff (10 lines context) to
# OUTFILE (default: <sdd-workspace>/review-<base7>..<head7>.diff) and prints
# OUTFILE's path on stdout. Purpose: a reviewer subagent reads the whole
# change with one Read instead of re-running git itself or the controller
# re-deriving the diff in-context.

set -euo pipefail

BASE="${1:?usage: review-package.sh BASE HEAD [OUTFILE]}"
HEAD="${2:?usage: review-package.sh BASE HEAD [OUTFILE]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BASE7="$(git rev-parse --short=7 "$BASE")"
HEAD7="$(git rev-parse --short=7 "$HEAD")"

if [[ -z "${3:-}" ]]; then
  SDD_DIR="$(bash "$SCRIPT_DIR/sdd-workspace.sh")"
  OUTFILE="${SDD_DIR}/review-${BASE7}..${HEAD7}.diff"
else
  OUTFILE="$3"
fi

{
  echo "## Commits ${BASE7}..${HEAD7}"
  git log --oneline "${BASE}..${HEAD}"
  echo
  echo "## Diffstat"
  git diff --stat "${BASE}..${HEAD}"
  echo
  echo "## Full diff (10 lines context)"
  git diff -U10 "${BASE}..${HEAD}"
} > "$OUTFILE"

echo "$OUTFILE"
