#!/bin/sh
set -u

TIMEOUT_SECONDS="${TOOLCHAIN_TIMEOUT_SECONDS:-8}"
TEMP_FILES=""

cleanup() {
  for file in $TEMP_FILES; do
    rm -f "$file"
  done
}

trap cleanup EXIT INT TERM

make_temp_file() {
  file="$(mktemp)"
  TEMP_FILES="$TEMP_FILES $file"
  printf '%s\n' "$file"
}

fail() {
  printf '%s\n' "toolchain check failed: $*" >&2
  exit 1
}

case "$TIMEOUT_SECONDS" in
  "" | *[!0-9]*)
    fail "TOOLCHAIN_TIMEOUT_SECONDS must be a positive integer"
    ;;
esac

if [ "$TIMEOUT_SECONDS" -lt 1 ]; then
  fail "TOOLCHAIN_TIMEOUT_SECONDS must be at least 1"
fi

script_dir="$(CDPATH= cd "$(dirname "$0")" && pwd)" ||
  fail "could not resolve script directory"
repo_root="$(CDPATH= cd "$script_dir/.." && pwd)" ||
  fail "could not resolve repository root"

timeout_cmd=""
command -v timeout >/dev/null 2>&1 && timeout_cmd="timeout"
command -v gtimeout >/dev/null 2>&1 && timeout_cmd="gtimeout"

run_with_timeout() {
  label="$1"
  shift
  output_file="$1"
  shift

  if [ -n "$timeout_cmd" ]; then
    run_with_timeout_native "$label" "$output_file" "$@"
    return
  fi

  run_with_timeout_fallback "$label" "$output_file" "$@"
}

run_with_timeout_native() {
  label="$1"
  shift
  output_file="$1"
  shift

  tmp_stderr="$(make_temp_file)"

  "$timeout_cmd" "$TIMEOUT_SECONDS" "$@" >"$output_file" 2>"$tmp_stderr"
  status="$?"

  if [ "$status" -eq 124 ]; then
    fail "$label did not finish within ${TIMEOUT_SECONDS}s"
  fi

  stderr="$(cat "$tmp_stderr")"
  if [ "$status" -ne 0 ]; then
    fail "$label exited with status $status${stderr:+: $stderr}"
  fi
}

run_with_timeout_fallback() {
  label="$1"
  shift
  output_file="$1"
  shift

  tmp_stderr="$(make_temp_file)"
  tmp_status="$(make_temp_file)"
  rm -f "$tmp_status"

  (
    "$@" >"$output_file" 2>"$tmp_stderr"
    printf '%s\n' "$?" >"$tmp_status"
  ) &
  pid="$!"

  elapsed=0
  while [ ! -f "$tmp_status" ] && kill -0 "$pid" 2>/dev/null; do
    if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
      kill -TERM "$pid" 2>/dev/null || true
      sleep 1
      kill -KILL "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      fail "$label did not finish within ${TIMEOUT_SECONDS}s"
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  wait "$pid" 2>/dev/null || true
  status="$(cat "$tmp_status" 2>/dev/null || printf '%s' "$?")"
  stderr="$(cat "$tmp_stderr")"

  if [ "$status" -ne 0 ]; then
    fail "$label exited with status $status${stderr:+: $stderr}"
  fi
}

required_bun_version() {
  package_json="$repo_root/package.json"

  if [ ! -f "$package_json" ]; then
    fail "package.json was not found at $package_json"
  fi

  version="$(sed -n 's/.*"packageManager": "bun@\([^"]*\)".*/\1/p' "$package_json")"

  if [ -z "$version" ]; then
    fail "packageManager bun version was not found in $package_json"
  fi

  printf '%s\n' "$version"
}

required_node_version() {
  for version_file in "$repo_root/.node-version" "$repo_root/.nvmrc"; do
    if [ -f "$version_file" ]; then
      version="$(sed -n '1p' "$version_file" | tr -d '[:space:]')"
      version="${version#v}"

      case "$version" in
        "" | *[!0-9.]*)
          continue
          ;;
      esac

      printf '%s\n' "$version"
      return 0
    fi
  done

  fail "node version was not found in .node-version or .nvmrc"
}

require_command() {
  name="$1"
  command -v "$name" >/dev/null 2>&1 || fail "$name is not available in PATH"
}

require_command bun
require_command node

bun_path="$(command -v bun)"
case "$bun_path" in
  *"/.nvm/"*)
    fail "bun resolves to $bun_path. Install the official Bun runtime and put ~/.bun/bin before NVM in PATH."
    ;;
esac

expected_bun="$(required_bun_version)"
bun_version_file="$(make_temp_file)"
run_with_timeout "bun --version" "$bun_version_file" bun --version
bun_version="$(cat "$bun_version_file")"

if [ -n "$expected_bun" ] && [ "$bun_version" != "$expected_bun" ]; then
  fail "expected Bun $expected_bun, got $bun_version from $bun_path"
fi

node_version_file="$(make_temp_file)"
run_with_timeout "node --version" "$node_version_file" node --version
node_version="$(cat "$node_version_file")"
node_version="${node_version#v}"
expected_node_version="$(required_node_version)"

if [ "$node_version" != "$expected_node_version" ]; then
  fail "expected Node $expected_node_version LTS, got v$node_version"
fi

exit 0
