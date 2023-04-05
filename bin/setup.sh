#!/bin/sh
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

printf "\n${GREEN}*** Starting zokrates container ***${NC}\n"
docker-compose up -d api

# delay needed to ensure all container are in running state.
sleep 5

printf "\n${GREEN}*** Running setup for factor.zok ***${NC}\n"
curl -d '{"filepath": "factor.zok"}' -H "Content-Type: application/json" -X POST http://localhost:8080/generate-keys

# printf "\n${GREEN}*** Running setup for square.zok ***${NC}\n"
# curl -d '{"filepath": "examples/square.zok"}' -H "Content-Type: application/json" -X POST http://localhost:8080/generate-keys

# printf "\n${GREEN}*** Running setup for prove-ownership-of-sk.zok ***${NC}\n"
# curl -d '{"filepath": "examples/prove-ownership-of-sk.zok"}' -H "Content-Type: application/json" -X POST http://localhost:8080/generate-keys


printf "\n${GREEN}*** Setups complete ***${NC}\n"

printf "\n${GREEN}*** Generate-Proof for factor.zok ***${NC}\n"
curl -d '{"folderpath": "factor", "inputs": "632"}' -H "Content-Type: application/json" -X POST http://localhost:8080/generate-proof

printf "\n${GREEN}*** Generate-Proof complete ***${NC}\n"

