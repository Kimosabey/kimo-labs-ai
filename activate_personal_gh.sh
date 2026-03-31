#!/bin/bash

# Kimo Labs: Personal GitHub CLI Activation Script
# Use this to isolate your Personal account (Kimosabey) from your default Office account.

# Use a dedicated configuration directory within this project
export GH_CONFIG_DIR="$(pwd)/.gh"

# Update Git SSH Identity for this session (extra layer of safety)
export GIT_SSH_COMMAND="ssh -i '/Users/ltdevelopmentmac1/Desktop/Kimo's Garage/SSH keys Personal Account/kimoSafe' -o IdentitiesOnly=yes"

echo "🛡 GH CLI isolated to: $GH_CONFIG_DIR"
echo "👤 Identity: Harshan Aiyappa (Kimosabey)"
echo "🔑 Key: kimoSafe"
echo ""
echo "Please run 'gh auth login' once in this folder to authorize your personal account."
