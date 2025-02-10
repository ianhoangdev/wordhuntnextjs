#!/bin/bash

# Print a message to know the script is running
echo "🔹 Installing EMSDK..."

# Clone the Emscripten SDK repository
git clone https://github.com/emscripten-core/emsdk.git

# Move into the emsdk directory
cd emsdk

# Install the latest version of Emscripten
./emsdk install latest

# Activate the installed version
./emsdk activate latest

# Set environment variables so our app can find emsdk
source ./emsdk_env.sh

# Print success message
echo "✅ EMSDK installed and ready!"
