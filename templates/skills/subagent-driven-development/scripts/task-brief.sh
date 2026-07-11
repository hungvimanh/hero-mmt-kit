#!/usr/bin/env bash
# Extract one task's full markdown section from a plan file.
# Usage: task-brief.sh PLAN_FILE N [OUTFILE]
#
# Finds the heading matching "Task N" at whatever heading level it uses
# (writing-plans emits "### Task N: [Component Name]") and copies everything
# up to (not including) the next heading at the same or shallower level,
# respecting fenced code blocks (``` or ~~~) so a heading-looking line
# inside a fenced step (e.g. a comment in example code) doesn't end the
# section early.
#
# Writes the section to OUTFILE (default: <sdd-workspace>/task-N-brief.md)
# and prints OUTFILE's path on stdout. Purpose: the implementer reads its
# task from a file instead of the controller re-typing/paraphrasing the
# full task text into the dispatch prompt.

set -euo pipefail

PLAN_FILE="${1:?usage: task-brief.sh PLAN_FILE N [OUTFILE]}"
TASK_N="${2:?usage: task-brief.sh PLAN_FILE N [OUTFILE]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

[[ -f "$PLAN_FILE" ]] || { echo "error: plan file not found: $PLAN_FILE" >&2; exit 1; }

if [[ -z "${3:-}" ]]; then
  SDD_DIR="$(bash "$SCRIPT_DIR/sdd-workspace.sh")"
  OUTFILE="${SDD_DIR}/task-${TASK_N}-brief.md"
else
  OUTFILE="$3"
fi

awk -v task="$TASK_N" '
  BEGIN { in_section = 0; in_fence = 0; fence = ""; level = 0; found = 0 }
  {
    line = $0
    if (match(line, /^(```|~~~)/)) {
      marker = substr(line, RSTART, 3)
      if (!in_fence) { in_fence = 1; fence = marker }
      else if (marker == fence) { in_fence = 0; fence = "" }
    }

    if (!in_fence && match(line, /^#+[ \t]/)) {
      hashes = line; sub(/[ \t].*/, "", hashes); this_level = length(hashes)
      is_target = (line ~ ("^#+[ \t]+Task[ \t]+" task "([^0-9.].*)?$"))

      # Any heading at the same or shallower level ends the current section
      # (not just another Task heading) - e.g. a "## Wave 2" group header
      # between tasks must also close the task section before it.
      if (in_section && this_level <= level) { in_section = 0 }
      if (is_target && !in_section) { in_section = 1; level = this_level; found = 1 }
    }

    if (in_section) print line
  }
  END { if (!found) { print "TASK_NOT_FOUND" > "/dev/stderr"; exit 3 } }
' "$PLAN_FILE" > "$OUTFILE"

echo "$OUTFILE"
