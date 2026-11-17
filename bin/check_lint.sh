#!/bin/bash

set -e

export TERM=xterm

function pprint() {
  local s=("$@") b w
  for l in "${s[@]}"; do
    ((w<${#l})) && { b="$l"; w="${#l}"; }
  done
  tput setaf 3
  echo "-${b//?/-}-"
  for l in "${s[@]}"; do
    printf '%s%*s%s\n' "$(tput setaf 2)" "-$w" "$l"
  done
  tput setaf 3
  echo "-${b//?/-}-"
  tput sgr 0
}

pprint "Installing dependencies if needed"
bin/install-deps.sh

pprint "Check code format"
pnpm check-fmt

pprint "Linting API code"
cd api && pnpm lint

# TODO: Re-enable linting of webapp code
# pprint "Linting webapp code"
# cd ../webapp && pnpm lint

pprint "All Linting checks passed!"
