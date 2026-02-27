#!/bin/bash

# Intent-to-Software Platform - Linux/macOS Prerequisites Installer
# This script installs all required software for running the platform

set -e

echo "========================================"
echo "Intent-to-Software Platform"
echo "Prerequisites Installer for Linux/macOS"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
fi

echo -e "${CYAN}Detected OS: $OS${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Install Node.js
echo -e "${CYAN}1. Checking Node.js...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js already installed: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}Installing Node.js...${NC}"

    if [ "$OS" == "macos" ]; then
        # Install Homebrew if not present
        if ! command_exists brew; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node@20
    elif [ "$DISTRO" == "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$DISTRO" == "redhat" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi

    echo -e "${GREEN}✓ Node.js installed${NC}"
fi

# 2. Install Docker
echo ""
echo -e "${CYAN}2. Checking Docker...${NC}"
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker already installed: $DOCKER_VERSION${NC}"
else
    echo -e "${YELLOW}Installing Docker...${NC}"

    if [ "$OS" == "macos" ]; then
        echo -e "${YELLOW}Please install Docker Desktop for Mac manually:${NC}"
        echo "1. Visit: https://www.docker.com/products/docker-desktop/"
        echo "2. Download Docker Desktop for Mac"
        echo "3. Install and start Docker Desktop"
    elif [ "$DISTRO" == "debian" ]; then
        # Install Docker on Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg

        echo \
          "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        # Add user to docker group
        sudo usermod -aG docker $USER

        echo -e "${GREEN}✓ Docker installed${NC}"
        echo -e "${YELLOW}⚠ You may need to log out and back in for docker group to take effect${NC}"
    elif [ "$DISTRO" == "redhat" ]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER

        echo -e "${GREEN}✓ Docker installed${NC}"
        echo -e "${YELLOW}⚠ You may need to log out and back in for docker group to take effect${NC}"
    fi
fi

# 3. Install Git
echo ""
echo -e "${CYAN}3. Checking Git...${NC}"
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ Git already installed: $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}Installing Git...${NC}"

    if [ "$OS" == "macos" ]; then
        brew install git
    elif [ "$DISTRO" == "debian" ]; then
        sudo apt-get install -y git
    elif [ "$DISTRO" == "redhat" ]; then
        sudo yum install -y git
    fi

    echo -e "${GREEN}✓ Git installed${NC}"
fi

# Summary
echo ""
echo "========================================"
echo "Installation Summary"
echo "========================================"
echo ""

ALL_INSTALLED=true

echo -e "${CYAN}Component Status:${NC}"
if command_exists node; then
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}✗ Node.js: Not installed${NC}"
    ALL_INSTALLED=false
fi

if command_exists docker; then
    echo -e "${GREEN}✓ Docker: $(docker --version)${NC}"
else
    echo -e "${RED}✗ Docker: Not installed${NC}"
    ALL_INSTALLED=false
fi

if command_exists git; then
    echo -e "${GREEN}✓ Git: $(git --version)${NC}"
else
    echo -e "${YELLOW}⚠ Git: Not installed (optional)${NC}"
fi

echo ""
if [ "$ALL_INSTALLED" = true ]; then
    echo -e "${GREEN}✓ All prerequisites installed successfully!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Make sure Docker is running"
    echo "2. Navigate to the platform directory:"
    echo -e "   ${YELLOW}cd intent-to-software-platform${NC}"
    echo "3. Start the platform:"
    echo -e "   ${YELLOW}docker compose up --build${NC}"
else
    echo -e "${YELLOW}⚠ Some prerequisites need attention${NC}"
    echo ""
    echo "Please address the missing components above"
fi

echo ""
