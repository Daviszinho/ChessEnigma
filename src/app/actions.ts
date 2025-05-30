
// @ts-nocheck
// TODO: Fix types
'use server';

import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';
import { getChessPuzzle } from '@/ai/flows/get-chess-puzzle-flow'; // Import the new Genkit flow

export interface Puzzle {
  id: string; // We'll use FEN as ID
  fen: string;
  solution: string; // Space-separated UCI moves, e.g., "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6"
  orientation: 'white' | 'black';
}

export async function getPuzzleAction(): Promise<Puzzle> {
  try {
    const puzzleData = await getChessPuzzle(); // Call the Genkit flow

    if (!puzzleData || !puzzleData.fen || !puzzleData.solution || !puzzleData.orientation) {
      throw new Error("Received incomplete puzzle data from Genkit flow.");
    }
    
    return {
      id: puzzleData.fen, 
      fen: puzzleData.fen,
      solution: puzzleData.solution,
      orientation: puzzleData.orientation,
    };
  } catch (error) {
    let message = "An unexpected error occurred while fetching the puzzle.";
    if (error instanceof Error) {
      message = error.message; 
    } else if (typeof error === 'string') {
      message = error;
    }
    // Construct a brand new, plain Error object to ensure serializability.
    throw new Error(message);
  }
}

