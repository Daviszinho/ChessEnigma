
'use server';
/**
 * @fileOverview Flow for fetching chess puzzles from BigQuery.
 *
 * - getChessPuzzle - A function that retrieves a chess puzzle.
 * - ChessPuzzleOutput - The return type for the getChessPuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {BigQuery} from '@google-cloud/bigquery';

const ChessPuzzleOutputSchema = z.object({
  fen: z.string().describe('The Forsyth-Edwards Notation (FEN) of the chess puzzle starting position.'),
  solution: z.string().describe('A space-separated string of moves in UCI (Universal Chess Interface) format, representing the puzzle solution.'),
  orientation: z.enum(['white', 'black']).describe("The board orientation, typically the side to move or the player's perspective."),
});
export type ChessPuzzleOutput = z.infer<typeof ChessPuzzleOutputSchema>;

// Define the BigQuery details
const projectId = 'idyllic-parser-460423-r0'; // Your Google Cloud project ID
const datasetId = 'matechessproblems';      // Your BigQuery dataset ID
const routineId = 'getPuzzle';              // Your BigQuery stored procedure name

const fetchChessPuzzleFromBigQueryTool = ai.defineTool(
  {
    name: 'fetchChessPuzzleFromBigQuery',
    description: 'Fetches a chess puzzle (FEN, solution, orientation) from a BigQuery stored procedure.',
    inputSchema: z.object({}), // No input parameters for fetching a random puzzle
    outputSchema: ChessPuzzleOutputSchema,
  },
  async () => {
    const bigquery = new BigQuery({projectId});
    const query = `CALL \`${projectId}.${datasetId}.${routineId}\`();`;

    try {
      const [rows] = await bigquery.query(query);
      if (rows && rows.length > 0) {
        const puzzleData = rows[0]; // Assuming the procedure returns one row with the puzzle
        
        // Validate and return the data
        // The procedure must return columns named 'fen', 'solution', and 'orientation'
        // that match the ChessPuzzleOutputSchema.
        const parsedOutput = ChessPuzzleOutputSchema.parse({
          fen: puzzleData.fen,
          solution: puzzleData.solution,
          orientation: puzzleData.orientation?.toLowerCase() === 'black' ? 'black' : 'white',
        });
        return parsedOutput;

      } else {
        throw new Error('BigQuery stored procedure did not return any puzzle data.');
      }
    } catch (error) {
      console.error('Error fetching puzzle from BigQuery:', error);
      // For a real app, you might want more sophisticated error handling or fallback mechanisms.
      // For now, we'll re-throw to let the caller handle it.
      if (error instanceof Error) {
        throw new Error(`Failed to fetch puzzle from BigQuery: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching puzzle from BigQuery.');
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
    const {output} = await fetchChessPuzzleFromBigQueryTool({});
    if (!output) {
        throw new Error('Failed to get puzzle from the BigQuery tool.');
    }
    return output;
  }
);

export async function getChessPuzzle(): Promise<ChessPuzzleOutput> {
  return getChessPuzzleFlow({});
}
