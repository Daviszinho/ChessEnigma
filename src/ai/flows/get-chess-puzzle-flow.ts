
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
      let detailedMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        detailedMessage = error.message;
      }

      // Provide a more specific message if it seems like an auth/permission issue.
      if (typeof detailedMessage === 'string' && (detailedMessage.toLowerCase().includes('access token') || detailedMessage.includes('status code 500') || detailedMessage.toLowerCase().includes('credential') || detailedMessage.toLowerCase().includes('permission denied'))) {
        throw new Error(`Failed to fetch puzzle from BigQuery due to an authentication or permission issue: ${detailedMessage}. Please check your Google Cloud project credentials (e.g., Application Default Credentials, GOOGLE_APPLICATION_CREDENTIALS environment variable) and ensure the necessary BigQuery IAM permissions are granted.`);
      } else if (error instanceof Error) {
        throw new Error(`Failed to fetch puzzle from BigQuery: ${detailedMessage}`);
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
    // A tool function defined with ai.defineTool, when called directly,
    // returns its output directly (matching its outputSchema).
    // The fetchChessPuzzleFromBigQueryTool is designed to throw an error
    // if BigQuery doesn't return data or if parsing fails, so no explicit null check is needed here.
    const puzzleData = await fetchChessPuzzleFromBigQueryTool({});
    return puzzleData;
  }
);

export async function getChessPuzzle(): Promise<ChessPuzzleOutput> {
  return getChessPuzzleFlow({});
}
