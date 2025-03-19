#!/bin/bash
set -eo pipefail

exec tsc --project tsconfig.json --noEmit
