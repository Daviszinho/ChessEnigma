
// @ts-nocheck
// TODO: Fix types
'use server';

import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';


export interface Puzzle {
  id: string; // We'll use FEN as ID
  fen: string;
  solution: string; // Space-separated UCI moves, e.g., "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6"
  orientation: 'white' | 'black';
}

export async function getPuzzleAction(): Promise<Puzzle> {
  const ORACLE_PUZZLE_URL = 'https://g2611a32d6a01f3-oraclelearning.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/v_puzzle_mate_random_row/';
  
  try {
    const response = await fetch(ORACLE_PUZZLE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Cache heavily or dynamically depending on needs, we use 'no-store' to get a random puzzle each time
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    let puzzleData;
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      puzzleData = data.items[0];
    } else if (Array.isArray(data) && data.length > 0) {
      puzzleData = data[0];
    } else if (data.fen) {
      puzzleData = data;
    } else {
      throw new Error('Oracle API did not return puzzle data in expected format.');
    }

    const solution = puzzleData.moves || puzzleData.solution;
    const orientation = puzzleData.fen?.includes(' b ') ? 'black' : 'white';

    if (!puzzleData.fen || !solution || !orientation) {
      throw new Error("Received incomplete puzzle data from API.");
    }
    
    return {
      id: puzzleData.fen, 
      fen: puzzleData.fen,
      solution: solution,
      orientation: orientation,
    };
  } catch (error) {
    let message = "An unexpected error occurred while fetching the puzzle.";
    if (error instanceof Error) {
      message = error.message; 
    } else if (typeof error === 'string') {
      message = error;
    }
    throw new Error(message);
  }
}

