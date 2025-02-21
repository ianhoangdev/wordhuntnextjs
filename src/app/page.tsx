"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaBeer } from 'react-icons/fa';

const WebAssembly = {
  wrapper: null as any,
  binary: null as any,
  instance: null as any,
};

export default function Home() {

  const getWordMeaning = async (word: string) => {
    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const meanings = response.data[0].meanings;
      
      // Extract and set the first definition
      if (meanings && meanings.length > 0) {
        const firstMeaning = meanings[0].definitions[0].definition;
        setWordDefinition(firstMeaning);
        setWord(word);
        setShowDefinition(true);
      }
    } catch (error) {
      console.error('Error fetching word meaning:', error);
      setWordDefinition('Definition not available');
      setWord(word);
      setShowDefinition(true);
    }
  };

  const [board, setBoard] = useState<string[][]> (Array(4).fill('').map(() => Array(4).fill('')));
  // "cats" : [[0, 0], [0, 1], [1, 1], [2, 2]]
  // "dogs" : [[0, 0], [0, 1], [1, 1], [2, 2]]
  const [solutions, setSolutions] = useState<Record<string, [number, number][]>>(
    {"" : []}
  );

  const [newSolutions, setNewSolutions] = useState<Record<string, string[]>>({
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": [],
    "8": [],
  });

  const [hoveredPath, setHoveredPath] = useState<[number, number][] | null>(null);

  const [wordDefinition, setWordDefinition] = useState<string | null>(null);

  const [word, setWord] = useState<string>("");

  const [showDefinition, setShowDefinition] = useState<boolean>(false);

  const [enteredBoard, setEnteredBoard] = useState<boolean>(false);

  const wordToPoint : (Record<string, number>) = {
    "8": 2200,
    "7": 1800,
    "6": 1400,
    "5": 800,
    "4": 400,
    "3": 100,
  };

  useEffect(() => {
    async function loadWasm() {
      try {
        WebAssembly.wrapper = await import("../../public/solve_wasm.js");
        WebAssembly.binary = await fetch("/solve_wasm.wasm");
        WebAssembly.instance = await WebAssembly.wrapper.default({
          locateFile: () => "/solve_wasm.wasm",
        });
        console.log("WebAssembly instance loaded:", WebAssembly.instance);
      } catch (error) {
        console.error("Failed to load WebAssembly:", error);
      }
    }
    loadWasm();
  }, []);

  const handleCellChange = (row: number, col: number, value: string) => {
    if (value.length > 1) return;
    const newBoard = board.map((r, rowIndex) => 
      r.map((c, colIndex) => (rowIndex === row && colIndex === col ? value.toLowerCase() : c)));
    setBoard(newBoard);
    if (value) {
      const nextCol = (col + 1) % 4;
      const nextRow = col + 1 >= 4 ? row + 1 : row;
  
      if (nextRow < 4) {
        const nextInput = document.getElementById(`cell-${nextRow}-${nextCol}`);
        nextInput?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const allFilled = board.every((row) => row.every((cell) => cell !== ""));
    if (!allFilled) {
      alert("Please complete the entire grid before submitting!");
      return;
    }

    const allValid = board.every((row) =>
      row.every((cell) => /^[a-zA-Z]$/.test(cell))
    );
    if (!allValid) {
      alert("Please fill the grid with valid single letters only!");
      return;
    }

    setEnteredBoard(true);

    const boardString = board.flat().join("");
    console.log("Board string:", boardString);
    
    const dictResponse = await fetch("/dict.txt");
    const dictText = await dictResponse.text();
  
    if (WebAssembly.instance) {
      try {
        const ptr = WebAssembly.instance._malloc(boardString.length + 1);
        WebAssembly.instance.stringToUTF8(boardString, ptr, boardString.length + 1);
  
        const dictPtr = WebAssembly.instance._malloc(dictText.length + 1);
        WebAssembly.instance.stringToUTF8(dictText, dictPtr, dictText.length + 1);
  
        const resPtr = WebAssembly.instance._solve(ptr, dictPtr);
        const res = WebAssembly.instance.UTF8ToString(resPtr);

        const solutionsDict = res.split("\n").reduce((acc: Record<string, [number, number][]> , line: string) => {
          if (!line.includes("|")) {
            return acc;
          }
          console.log("Line:", line);
          const [word, path] = line.split("|");
          const pathCoords = path.split("-").reduce((coords: [number, number][], coord: string) => {
            const [x, y] = coord.split(",").map(Number);
            if (isNaN(x) || isNaN(y)) {
              return coords;
            }
            coords.push([x, y]);
            return coords;
          }, []);

          acc[word] = pathCoords;
          return acc;
        }, {});

        setSolutions(solutionsDict);

        const groupedSolutions: Record<string, string[]> = {
          "3": [],
          "4": [],
          "5": [],
          "6": [],
          "7": [],
          "8": [],
        };

        Object.entries(solutionsDict).forEach(([word, path]) => {
          groupedSolutions[word.length].push(word);
        });

        Object.keys(groupedSolutions).forEach((key) => {
          groupedSolutions[key] = groupedSolutions[key].sort((a, b) => a.localeCompare(b));
        });
        
        setNewSolutions(groupedSolutions);

        WebAssembly.instance._free(ptr);
        WebAssembly.instance._free(dictPtr);
      } catch (error) {
        console.error("Error calling WebAssembly solve function:", error);
      }
    }
  };

  const handleDelete = () => {
    setEnteredBoard(false);
    setBoard(Array(4).fill('').map(() => Array(4).fill('')));
    setSolutions({"" : []});
    setNewSolutions({
      "3": [],
      "4": [],
      "5": [],
      "6": [],
      "7": [],
      "8": [],
    });
  }
  
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/background.png')] bg-cover bg-center bg-fixed p-6">
      <div className="bg-[url('/wood.png')] p-4 shadow-xl rounded-md mb-8">
        <h1 className="text-4xl font-bold text-black tracking-wide uppercase drop-shadow-[0_0_15px_rgba(255,255,255,1)]">
          Word Hunt Solver
        </h1>
      </div>

      <div className="flex justify-around w-full items-start">
        <div className="bg-[#3c5337] p-5 rounded-lg shadow-lg w-[350px] max-h-[550px]">
          <h2 className="text-2xl text-white font-semibold mb-4 text-center">
            Enter 4x4 Grid
          </h2>

          {/* Grid Layout */}

          <div className = "relative">
            <div className="grid grid-cols-4 gap-3 mb-6 relative z-10 justify-items-center p-3 border border-[#8ee789] border-4 rounded-lg">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`aspect-square bg-[url('/wood.png')] bg-cover bg-center rounded-lg shadow flex items-center justify-center border border-gray-300 rounded-lg
                      ${hoveredPath?.some(([r, c]) => r === rowIndex && c === colIndex) ? "brightness-110" : "brightness-95"}
                      ${hoveredPath?.[0] && hoveredPath[0][0] === rowIndex && hoveredPath[0][1] === colIndex ? 'text-red' : ''}
                    `}
                      
                    style={{
                      boxShadow: hoveredPath?.some(([r, c]) => r === rowIndex && c === colIndex)
                        ? `0 0 0 2px rgba(142, 231, 137, 0.8), 0 0 0 3px rgba(76, 156, 85, 0.5)`
                        : "none",
                    }}
                  >
                    <input
                      id={`cell-${rowIndex}-${colIndex}`}
                      type="text"
                      maxLength={1}
                      value={board[rowIndex][colIndex]}
                      onChange={(e) =>
                        handleCellChange(rowIndex, colIndex, e.target.value)
                      }
                      onInput={(e) => {
                        const input = e.target as HTMLInputElement;
                        input.value = input.value.replace(/[^a-zA-Z]/g, "");
                      }}
                      className="w-full h-full text-center text-black text-5xl font-bold uppercase bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded-lg"
                    />
                  </div>
                ))
              )}
            </div>

            {/* SVG Overlay */}
            <svg
              className="absolute top-0 left-0 z-0"
              width="100%"
              height="100%"
              viewBox="0 0 310 310"
              xmlns="http://www.w3.org/2000/svg"
            >

              {hoveredPath?.map((point, index, path) => {
                if (index === 0) return null;
                const [y1, x1] = path[index - 1];
                const [y2, x2] = point;


                const cellSize = 60.5;
                const margin = 12;
                const offset = 16;
                const x1_coord = offset + x1 * (cellSize + margin) + cellSize / 2;
                const y1_coord = offset + y1 * (cellSize + margin) + cellSize / 2;
                const x2_coord = offset + x2 * (cellSize + margin) + cellSize / 2;
                const y2_coord = offset + y2 * (cellSize + margin) + cellSize / 2;
                return (
                  <line
                    key={index}
                    x1={x1_coord}
                    y1={y1_coord}
                    x2={x2_coord}
                    y2={y2_coord}
                    stroke={index === 1 ? "orange" : "white"}
                    strokeWidth="8"
                    strokeLinecap="square"
                  />
                );
              })}
            </svg>
            
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-white text-black py-2 rounded-lg text-lg font-bold hover:bg-[#fbe55b] transition duration-200"
          >
            VIEW ALL WORDS &gt;
          </button>
          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-full bg-[#ee3233] text-white py-2 rounded-lg text-lg font-bold hover:bg-[#b51a1a] hover:text-gray transition duration-200 mt-2 flex items-center justify-center gap-2">
            RESET BOARD
            <FaTrash />
          </button>
        </div>

        {/* Solutions */}
        {enteredBoard && (
          <div className="bg-[#3c5337] p-6 rounded-lg shadow-lg w-[350px] font-bold text-xl max-h-[600px] overflow-y-auto">
            {Object.keys(newSolutions)
              .sort((a, b) => Number(b) - Number(a))
              .map((key) => (
                newSolutions[key].map((solution, index) => (
                  <div key={`${key}-${index}`}
                    className="flex justify-between w-full py-1"
                  >
                    <div className="text-left bg-[url('/wood.png')] bg-cover bg-center text-black rounded-md px-2 py-0.5 hover:brightness-110 flex"
                    onMouseEnter={() => setHoveredPath(solutions[solution])}
                    onMouseLeave={() => setHoveredPath(null)}
                    >
                      <div>
                        {solution.toUpperCase()}
                      </div>
                      <button className='text-xs' onClick={() => {
                        if (showDefinition) {
                          setShowDefinition(false);
                          return;
                        }
                        getWordMeaning(solution)
                        setShowDefinition(true);
                      }}>
                      ⓘ
                      </button>
                    </div>
                    <div className="text-right text-white">{wordToPoint[key]}</div>
                  </div>
                ))
              ))
            }
          </div>
        )}
      </div>
      {showDefinition && (
        <div className="bg-[#3c5337] p-6 rounded-lg shadow-sm w-[350px] max-h-[550px] hover:shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-3">
            {word.charAt(0).toUpperCase() + word.slice(1)}
          </h2>
          {wordDefinition && (
            <div className="mt-4 p-4 bg-white rounded-md shadow-md hover:shadow-xl transition-shadow">
              <p className="text-black text-md font-medium leading-relaxed">{wordDefinition}</p>
            </div>
          )}
        </div>
      )}

      <footer className="w-full bg-[#2b3a22] text-white text-center p-4 mt-8">
        <p className="text-sm">© 2025 Word Hunt Solver. Developed by {" "}
          <a 
            href="https://github.com/ianhoangdev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600"
          >
            Ian Hoang
          </a>. All rights reserved.</p>
        <p className="text-xs mt-2">
          This app is a personal project for educational purposes. The content and the data provided are 
          sourced from publicly available dictionary APIs. 
        </p>
      </footer>
    </div>
  );
}
