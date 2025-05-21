// @ts-nocheck
// TODO: Fix types
"use client";

import type { CSSProperties } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';

import ChessboardClient from '@/components/ChessboardClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPuzzleAction, type Puzzle } from './actions';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, RefreshCcw, Brain, Loader2 } from 'lucide-react';

export default function Home() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [currentFen, setCurrentFen] = useState<string>("start");
  const [chessInstance, setChessInstance] = useState<Chess | null>(null);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isUserTurn, setIsUserTurn] = useState<boolean>(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const { toast } = useToast();

  const initializeNewPuzzle = useCallback((newPuzzle: Puzzle) => {
    const chess = new Chess(newPuzzle.fen);
    setPuzzle(newPuzzle);
    setCurrentFen(chess.fen());
    setChessInstance(chess);
    setSolutionMoves(newPuzzle.solution.split(' '));
    setCurrentMoveIndex(0);
    setIsUserTurn(false); // App makes the first move
    setIsPuzzleSolved(false);
    setMoveHistory([]);
    setIsLoading(false);
  }, []);

  const fetchNewPuzzle = useCallback(async () => {
    setIsLoading(true);
    try {
      const newPuzzleData = await getPuzzleAction();
      initializeNewPuzzle(newPuzzleData);
    } catch (error) {
      console.error("Failed to fetch puzzle:", error);
      toast({
        title: "Error",
        description: "Could not fetch a new puzzle. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [initializeNewPuzzle, toast]);

  useEffect(() => {
    fetchNewPuzzle();
  }, [fetchNewPuzzle]);

  const makeAppMove = useCallback(() => {
    if (!chessInstance || !solutionMoves.length || currentMoveIndex >= solutionMoves.length || isUserTurn || isPuzzleSolved) {
      return;
    }

    const moveNotation = solutionMoves[currentMoveIndex];
    const moveResult = chessInstance.move(moveNotation);

    if (moveResult) {
      setCurrentFen(chessInstance.fen());
      setMoveHistory(prev => [...prev, `${Math.floor(currentMoveIndex / 2) + 1}. (App) ${moveResult.san}`]);
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (newMoveIndex >= solutionMoves.length) {
        setIsPuzzleSolved(true);
        toast({
          title: "Puzzle Solved!",
          description: "Congratulations, you've solved the puzzle!",
          action: <CheckCircle className="text-green-500" />,
        });
      } else {
        setIsUserTurn(true);
      }
    } else {
      // This case should ideally not happen if solutions are valid
      console.error("Invalid app move in solution:", moveNotation);
      toast({ title: "Puzzle Error", description: "The puzzle has an invalid move for the app.", variant: "destructive" });
    }
  }, [chessInstance, solutionMoves, currentMoveIndex, isUserTurn, isPuzzleSolved, toast]);

  useEffect(() => {
    if (!isUserTurn && !isPuzzleSolved && puzzle && !isLoading) {
      // Add a slight delay for app moves to feel more natural
      const timer = setTimeout(() => {
        makeAppMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isUserTurn, isPuzzleSolved, puzzle, isLoading, makeAppMove]);


  const handleUserMove = (sourceSquare: Square, targetSquare: Square, piece: Piece): boolean => {
    if (!chessInstance || !isUserTurn || isPuzzleSolved || currentMoveIndex >= solutionMoves.length) {
      return false;
    }

    const attemptedMoveUci = `${sourceSquare}${targetSquare}`;
    // Check for promotion, assume queen for simplicity if it's a pawn reaching the 8th/1st rank
    let promotionChar = '';
    if ((piece === 'wP' && targetSquare.endsWith('8')) || (piece === 'bP' && targetSquare.endsWith('1'))) {
      promotionChar = 'q';
    }
    const expectedMoveUciWithOptionalPromotion = solutionMoves[currentMoveIndex];
    // Simple check: if expected move has promotion, user's move must also imply promotion.
    // Solution format: "e7e8q". Our move: "e7e8" + promotionChar 'q'.
    const isPromotionMove = promotionChar !== '';
    const userMoveForComparison = attemptedMoveUci + (isPromotionMove ? promotionChar : '');


    // Try making the move in chess.js to get SAN and validate legality
    const moveResult = chessInstance.move({ from: sourceSquare, to: targetSquare, promotion: promotionChar || undefined });

    if (!moveResult) { // Illegal move by chess.js rules
      toast({ title: "Illegal Move", description: "That move is not allowed.", variant: "destructive", action: <XCircle className="text-red-500" /> });
      return false; // chess.js rejected, react-chessboard will snap back
    }

    // Compare user's move (e.g. "e2e4") with solution's move (e.g. "e2e4" or "g1f3" or "e7e8q")
    // chess.js `moveResult.lan` (Long Algebraic Notation) is like "e2-e4". Solution is UCI.
    // The move from chess.js is `moveResult.from` + `moveResult.to` + (optional `moveResult.promotion`)
    const madeMoveUci = moveResult.from + moveResult.to + (moveResult.promotion || '');

    if (madeMoveUci.toLowerCase() === expectedMoveUciWithOptionalPromotion.toLowerCase()) {
      toast({ title: "Correct Move!", description: `You played ${moveResult.san}.`, action: <CheckCircle className="text-green-500" /> });
      setCurrentFen(chessInstance.fen());
      setMoveHistory(prev => [...prev, `${Math.floor(currentMoveIndex / 2) + 1}. (You) ${moveResult.san}`]);
      
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (newMoveIndex >= solutionMoves.length) {
        setIsPuzzleSolved(true);
        toast({
          title: "Puzzle Solved!",
          description: "Congratulations, you've solved the puzzle!",
          action: <CheckCircle className="text-green-500" />,
        });
      } else {
        setIsUserTurn(false); // Triggers app's move via useEffect
      }
      return true; // Move was correct and made
    } else {
      toast({ title: "Incorrect Move", description: `Expected ${expectedMoveUciWithOptionalPromotion}, but you played ${madeMoveUci}. Try again.`, variant: "destructive", action: <XCircle className="text-red-500" /> });
      chessInstance.undo(); // Undo the move in the logic
      // No need to setCurrentFen as the board's position prop will not change, and react-chessboard should snap back.
      return false; // Move was legal but not the correct solution move
    }
  };

  const handleResetPuzzle = () => {
    if (puzzle) {
      initializeNewPuzzle(puzzle);
       toast({ title: "Puzzle Reset", description: "The current puzzle has been reset." });
    }
  };
  
  const boardWrapperStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '1rem 0',
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 font-sans">
      <header className="my-6 text-center">
        <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
          <Brain className="w-12 h-12 mr-3 text-accent" />
          ChessEnigma
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">Solve chess puzzles and sharpen your tactical mind.</p>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-6xl">
        <Card className="lg:flex-1 w-full shadow-xl">
          <CardContent className="p-2 sm:p-4 flex justify-center">
            {isLoading || !chessInstance ? (
              <div className="w-full h-[300px] sm:h-[400px] flex items-center justify-center bg-muted/50 rounded-md">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <ChessboardClient
                fen={currentFen}
                onPieceDrop={handleUserMove}
                arePiecesDraggable={isUserTurn && !isPuzzleSolved && !isLoading}
                customDarkSquareStyle={{ backgroundColor: 'hsl(var(--primary) / 0.8)'}}
                customLightSquareStyle={{ backgroundColor: 'hsl(var(--background))'}}
              />
            )}
          </CardContent>
        </Card>

        <div className="w-full lg:w-1/3 space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Controls & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={fetchNewPuzzle} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                New Puzzle
              </Button>
              <Button onClick={handleResetPuzzle} variant="outline" className="w-full" disabled={isLoading || !puzzle}>
                Reset Current Puzzle
              </Button>
              <div className="p-3 bg-muted rounded-md text-center">
                {isPuzzleSolved ? (
                  <p className="font-semibold text-green-600">Puzzle Solved! Well done!</p>
                ) : isLoading ? (
                  <p className="font-semibold text-primary">Loading puzzle...</p>
                ) : isUserTurn ? (
                  <p className="font-semibold text-accent-foreground animate-pulse">Your turn to move.</p>
                ) : (
                  <p className="font-semibold text-primary">App is thinking...</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Move History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/30">
                {moveHistory.length === 0 ? (
                  <p className="text-muted-foreground italic">No moves yet.</p>
                ) : (
                  <ol className="list-decimal list-inside space-y-1">
                    {moveHistory.map((move, index) => (
                      <li key={index} className="text-sm">{move}</li>
                    ))}
                  </ol>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-auto pt-10 pb-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ChessEnigma. All rights reserved.</p>
        <p>Powered by Next.js, TailwindCSS, and a passion for chess.</p>
      </footer>
    </div>
  );
}
