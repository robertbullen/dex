#!/usr/bin/env zsh

# Install system dependencies via Homebrew, installing Homebrew first if necessary, and silencing
# "already installed" package warnings.
brew -v > /dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install --quiet git graphviz node yarn

# Download the project from Github, install project dependencies, and perform an initial build.
git clone https://github.com/robertbullen/dex.git

pushd dex
yarn install
yarn build
popd
