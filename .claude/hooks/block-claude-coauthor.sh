#!/usr/bin/env bash
# PreToolUse hook for Bash: block any tool call whose command contains an
# AI-attribution Co-Authored-By trailer (Claude, Anthropic, etc.).
#
# Why: per .claude/rules/git.md, no AI attribution lines in commits.
# Text rules alone are not enough — subagents inheriting the default
# system prompt will add the trailer anyway. This hook is the enforcement.

set -u

input=$(cat)

# Match "Co-Authored-By:" followed (eventually) by Claude / Anthropic / AI
# email markers. Case-insensitive, scans the whole payload (works across
# multi-line heredocs because grep -E with no -F still matches on a single
# logical input).
if printf '%s' "$input" | grep -iE -- 'co-authored-by:[^"\\]*(claude|anthropic|noreply@anthropic\.com)' >/dev/null 2>&1; then
  echo "BLOCKED: commit message contains an AI Co-Authored-By trailer." >&2
  echo "" >&2
  echo "This repo's .claude/rules/git.md forbids AI attribution lines." >&2
  echo "Re-issue the commit with the trailer removed (just the subject + optional body)." >&2
  exit 2
fi

exit 0
