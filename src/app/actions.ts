
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
  console.log("Fetching puzzle via Genkit flow...");
  try {
    const puzzleData = await getChessPuzzle(); // Call the Genkit flow
    console.log("Puzzle data from Genkit flow:", puzzleData);

    if (!puzzleData || !puzzleData.fen || !puzzleData.solution || !puzzleData.orientation) {
      throw new Error("Received invalid puzzle data from Genkit flow.");
    }
    
    // Use FEN as ID for simplicity, or generate a unique ID if needed
    return {
      id: puzzleData.fen, 
      fen: puzzleData.fen,
      solution: puzzleData.solution,
      orientation: puzzleData.orientation,
    };
  } catch (error) {
    console.error("Error in getPuzzleAction calling Genkit flow:", error);
    // Fallback to a default puzzle or rethrow, depending on desired behavior
    // For now, rethrowing to make the error visible
    throw error;
  }
}
