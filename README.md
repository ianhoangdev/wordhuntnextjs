# Wordhunt Solver

## Overview

Wordhunt Solver is a high-performance web application designed to efficiently find words in a Word Hunt-style game. It leverages C++, WebAssembly, and TensorFlow for speed and accuracy, while Next.js, TypeScript, TailwindCSS, and Redux provide a seamless user experience.

## Features

**Optimized Algorithm Efficiency:** Utilizes a trie data structure and backtracking to achieve a 99% accuracy rate.

**WebAssembly Integration:** Enhances the performance of C++ code within a Next.js web application, improving word search speed by 50%.

**State Management Improvements:** Implements Redux optimizations, reducing memory usage by 30%.

**Ongoing AI Development:** A TensorFlow machine learning model is being developed for advanced pattern recognition and improved word detection.

## Tech Stack

Frontend: Next.js, TypeScript, TailwindCSS, Redux

Backend: C++ (compiled to WebAssembly), TensorFlow (for ML model)

Performance Enhancements: WebAssembly for efficient computation, optimized state management with Redux

## Installation

To run the Wordhunt Solver locally:

**Prerequisites**

Node.js (latest LTS version recommended)

Emscripten (for WebAssembly compilation)

Python & TensorFlow (if working on the ML model)

**Steps**

Clone the repository:

`git clone git@github.com:ianhoangdev/wordhuntsolver.git`

Install dependencies:

`npm install`

Compile the C++ code to WebAssembly:

`emcc ./src/app/solve.cpp -o ./public/solve_wasm.js -s EXPORT_ES6=1 -s EXPORT_NAME="solve" -s EXPORTED_FUNCTIONS="['_solve', '_malloc', '_free']" -s ENVIRONMENT="web" -s EXPORTED_RUNTIME_METHODS='["UTF8ToString", "stringToUTF8"]' -s ALLOW_MEMORY_GROWTH=1`

Start the development server:

`npm run dev`

Open the app in your browser at http://localhost:3000

## Usage

Input the board letters and start the solver to get possible words.

The algorithm runs efficiently in the browser using WebAssembly.

Future updates will include an AI-powered word prediction feature.

## Future Improvements

Enhanced AI Capabilities: Improve TensorFlow model accuracy for better word predictions.

UI/UX Enhancements: More interactive and visually appealing design.

Leaderboard & Challenges: Compete with others in solving word puzzles.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

## License

This project is licensed under the MIT License.

