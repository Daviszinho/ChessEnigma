
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

    // The getChessPuzzle flow itself should throw if data is invalid or missing.
    // This explicit check here is a safeguard but might be redundant if the flow is robust.
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
    console.error("Error in getPuzzleAction calling Genkit flow:", error);
    let message = "An unexpected error occurred while fetching the puzzle.";
    if (error instanceof Error) {
      message = error.message; // Use the message from the original error.
    } else if (typeof error === 'string') {
      message = error;
    }
    // Construct a brand new, plain Error object to ensure serializability.
    throw new Error(message);
  }
}

