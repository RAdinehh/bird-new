#!/usr/bin/env python3
"""
scripts/apply.py - Auto patch pipeline

Usage:
  python3 scripts/apply.py "commit message" << 'PATCH'
  ...patch code...
  PATCH

  # only commit (no patch):
  echo "" | python3 scripts/apply.py "commit message"

Pipeline:
  1. git tag pre-auto-<ts>   (rollback point)
  2. run patch (from stdin)
  3. npx tsc --noEmit
  4. git add -A + commit + push
  On fail: git reset --hard <tag> + delete tag
"""
import sys
import os
import subprocess
from datetime import datetime

def run(cmd, capture=False, stdin=None):
    print("$ " + cmd)
    if capture:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True, input=stdin)
    return subprocess.run(cmd, shell=True, input=stdin, text=True)

def rollback(tag):
    print("")
    print("=== ROLLBACK to " + tag + " ===")
    subprocess.run("git reset --hard " + tag, shell=True)
    subprocess.run("git tag -d " + tag, shell=True)
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("FAIL: usage: python3 scripts/apply.py <commit message>")
        sys.exit(1)
    msg = sys.argv[1]
    tag = "pre-auto-" + datetime.now().strftime("%Y%m%d_%H%M%S")
    patch = sys.stdin.read()
    has_patch = bool(patch.strip())

    # 1. ensure clean tree (warn only)
    res = run("git status --porcelain", capture=True)
    dirty = bool(res.stdout.strip())

    # 2. tag
    subprocess.run("git tag " + tag, shell=True, check=True)
    print("OK: tag " + tag + " (rollback point)")

    # 3. run patch if provided
    if has_patch:
        patch_path = os.path.join(os.getcwd(), ".patch_running.py")
        try:
            with open(patch_path, "w", encoding="utf-8") as f:
                f.write(patch)
            print("=== RUN PATCH ===")
            res = subprocess.run("python3 " + patch_path, shell=True)
            if res.returncode != 0:
                print("FAIL: patch exit " + str(res.returncode))
                rollback(tag)
        finally:
            try:
                os.unlink(patch_path)
            except Exception:
                pass
    else:
        print("NOTE: empty patch — commit only mode")

    # 4. tsc
    print("=== TSC ===")
    res = run("npx tsc --noEmit", capture=True)
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr)
        print("FAIL: tsc")
        rollback(tag)
    print("OK: TSC")

    # 5. stage all
    subprocess.run("git add -A", shell=True, check=True)

    # 6. any change?
    res = run("git status --porcelain", capture=True)
    if not res.stdout.strip():
        print("NOTE: nothing to commit")
        subprocess.run("git tag -d " + tag, shell=True)
        sys.exit(0)

    # 7. commit (via stdin to avoid shell escaping)
    print("=== COMMIT ===")
    res = subprocess.run(["git", "commit", "-F", "-"], input=msg, text=True, capture_output=True)
    print(res.stdout)
    if res.returncode != 0:
        print(res.stderr)
        print("FAIL: commit")
        rollback(tag)

    # 8. push
    print("=== PUSH ===")
    res = run("git push")
    if res.returncode != 0:
        print("FAIL: push")
        rollback(tag)

    print("")
    print("=== SUCCESS ===")
    print("rollback if needed: git reset --hard " + tag)
    print("cleanup tag:       git tag -d " + tag)

if __name__ == "__main__":
    main()
