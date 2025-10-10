
'use server';
/**
 * @fileOverview Flow for fetching chess puzzles from Oracle Cloud.
 *
 * - getChessPuzzle - A function that retrieves a chess puzzle.
 * - ChessPuzzleOutput - The return type for the getChessPuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChessPuzzleOutputSchema = z.object({
  fen: z.string().describe('The Forsyth-Edwards Notation (FEN) of the chess puzzle starting position.'),
  solution: z.string().describe('A space-separated string of moves in UCI (Universal Chess Interface) format, representing the puzzle solution.'),
  orientation: z.enum(['white', 'black']).describe("The board orientation, typically the side to move or the player's perspective."),
});
export type ChessPuzzleOutput = z.infer<typeof ChessPuzzleOutputSchema>;

// Define the Oracle Cloud endpoint
const ORACLE_PUZZLE_URL = 'https://g2611a32d6a01f3-oraclelearning.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/v_puzzle_mate_random_row/';

const fetchChessPuzzleFromOracleTool = ai.defineTool(
  {
    name: 'fetchChessPuzzleFromOracle',
    description: 'Fetches a chess puzzle (FEN, solution, orientation) from Oracle Cloud REST API.',
    inputSchema: z.object({}), // No input parameters for fetching a random puzzle
    outputSchema: ChessPuzzleOutputSchema,
  },
  async () => {
    try {
      const response = await fetch(ORACLE_PUZZLE_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle Oracle REST API response format
      // The response has the format: {"items": [{"fen": "...", "moves": "...", ...}], ...}
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

      // Map Oracle API fields to our expected format
      // Oracle uses "moves" instead of "solution"
      const solution = puzzleData.moves || puzzleData.solution;
      const orientation = puzzleData.fen?.includes(' b ') ? 'black' : 'white';

      // Validate and return the data
      const parsedOutput = ChessPuzzleOutputSchema.parse({
        fen: puzzleData.fen,
        solution: solution,
        orientation: orientation,
      });
      
      return parsedOutput;

    } catch (error) {
      console.error('Error fetching puzzle from Oracle Cloud:', error);
      let detailedMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        detailedMessage = error.message;
      }

      throw new Error(`Failed to fetch puzzle from Oracle Cloud: ${detailedMessage}`);
    }
  }
);

const getChessPuzzleFlow = ai.defineFlow(
  {
    name: 'getChessPuzzleFlow',
    inputSchema: z.object({}), // No specific input needed for a random puzzle
    outputSchema: ChessPuzzleOutputSchema,
  },
  async () => {
    // A tool function defined with ai.defineTool, when called directly,
    // returns its output directly (matching its outputSchema).
    // The fetchChessPuzzleFromOracleTool is designed to throw an error
    // if Oracle Cloud doesn't return data or if parsing fails, so no explicit null check is needed here.
    const puzzleData = await fetchChessPuzzleFromOracleTool({});
    return puzzleData;
  }
);

export async function getChessPuzzle(): Promise<ChessPuzzleOutput> {
  return getChessPuzzleFlow({});
}
