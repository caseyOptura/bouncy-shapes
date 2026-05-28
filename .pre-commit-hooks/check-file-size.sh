#!/usr/bin/env bash
set -euo pipefail
# Rejects any staged .html or .js file that exceeds 400 lines.
# Keeps individual files reviewable and prevents LLM-generated monoliths
# from sneaking in through a single commit.

MAX_LINES=400
FAILED=0

for file in "$@"; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "ERROR: $file has $lines lines (max $MAX_LINES)"
    FAILED=1
  fi
done

exit $FAILED
