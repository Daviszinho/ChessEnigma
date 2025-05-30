
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
import { CheckCircle, XCircle, RefreshCcw, Brain, Loader2, Lightbulb } from 'lucide-react';


export default function Home() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [currentFen, setCurrentFen] = useState<string>("start");
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [chessInstance, setChessInstance] = useState<Chess | null>(null);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [isUserTurn, setIsUserTurn] = useState<boolean>(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [hintSquare, setHintSquare] = useState<Square | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    document.title = "ChessEnigma";
  }, []);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const initializeNewPuzzle = useCallback((newPuzzle: Puzzle) => {
    const chess = new Chess(newPuzzle.fen);
    setPuzzle(newPuzzle);
    setCurrentFen(chess.fen());
    setBoardOrientation(newPuzzle.orientation);
    setChessInstance(chess);
    setSolutionMoves(newPuzzle.solution.split(' '));
    setCurrentMoveIndex(0);
    setIsPuzzleSolved(false);
    setMoveHistory([]);
    setHintSquare(null);
    setIsLoading(false);

    const initialGameTurn = chess.turn(); 
    const userPlaysAs = newPuzzle.orientation.charAt(0);

    if (initialGameTurn === userPlaysAs) {
      setIsUserTurn(true);
    } else {
      setIsUserTurn(false); 
    }
  }, []);

  const fetchNewPuzzle = useCallback(async () => {
    setIsLoading(true);
    setHintSquare(null);
    try {
      const newPuzzleData = await getPuzzleAction();
      initializeNewPuzzle(newPuzzleData);
    } catch (error) {
      console.error("Original error fetching puzzle:", error);
      setIsLoading(false); 

      let toastTitle = "Error Fetching Puzzle";
      let toastDescription = "An unexpected error occurred while fetching a new puzzle. Please try again later.";

      if (error instanceof Error && error.message) {
        const lowerCaseErrorMessage = error.message.toLowerCase();
        if (lowerCaseErrorMessage !== 'failed to fetch' && lowerCaseErrorMessage !== 'typeerror: failed to fetch') {
          toastDescription = error.message; 
        }
      }
      
      try {
        toast({
          title: toastTitle,
          description: toastDescription,
          variant: "destructive",
        });
      } catch (toastError) {
        console.error("Error displaying toast notification:", toastError);
        alert("Failed to fetch puzzle. An additional error occurred while trying to display the error message.");
      }
    }
  }, [initializeNewPuzzle, toast]);

  useEffect(() => {
    fetchNewPuzzle();
  }, [fetchNewPuzzle]);

  const makeAppMove = useCallback(() => {
    if (!chessInstance || !solutionMoves.length || currentMoveIndex >= solutionMoves.length || isUserTurn || isPuzzleSolved || !puzzle) {
      return;
    }
    setHintSquare(null);

    const moveNotation = solutionMoves[currentMoveIndex];
    const moveResult = chessInstance.move(moveNotation, { sloppy: true });

    if (moveResult) {
      setCurrentFen(chessInstance.fen());
      const moveNumberDisplay = Math.floor(currentMoveIndex / 2) + 1;
      const playerTag = '(App)';
      const turnIndicator = moveResult.color === 'w' ? '.' : '...';
      const historyText = `${moveNumberDisplay}${turnIndicator} ${playerTag} ${moveResult.san}`;
      setMoveHistory(prev => [...prev, historyText]);
      
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
      console.error("Invalid app move in solution:", moveNotation, "FEN:", chessInstance.fen());
      toast({ title: "Puzzle Error", description: "The puzzle has an invalid move for the app.", variant: "destructive" });
    }
  }, [chessInstance, solutionMoves, currentMoveIndex, isUserTurn, isPuzzleSolved, toast, puzzle]);

  useEffect(() => {
    if (puzzle && chessInstance && !isLoading && !isPuzzleSolved && !isUserTurn && currentMoveIndex < solutionMoves.length) {
        const timer = setTimeout(() => {
          makeAppMove();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [puzzle, chessInstance, isLoading, isPuzzleSolved, isUserTurn, currentMoveIndex, solutionMoves, makeAppMove]);

  const handleUserMove = (sourceSquare: Square, targetSquare: Square, piece: Piece): boolean => {
    setHintSquare(null);
    if (!chessInstance || !isUserTurn || isPuzzleSolved || currentMoveIndex >= solutionMoves.length || !puzzle) {
      return false;
    }

    const userPlaysAsColor = puzzle.orientation.charAt(0);
    if (piece.charAt(0).toLowerCase() !== userPlaysAsColor) {
        toast({ 
          title: "Not Your Piece", 
          description: `You are playing as ${puzzle.orientation}. You can only move ${puzzle.orientation} pieces.`, 
          variant: "destructive"
        });
        return false;
    }

    if (chessInstance.turn() !== userPlaysAsColor) {
        toast({ 
          title: "Not Your Turn", 
          description: `It's ${chessInstance.turn() === 'w' ? 'White' : 'Black'}'s turn. You are playing as ${puzzle.orientation}.`, 
          variant: "destructive"
        });
        return false;
    }

    const attemptedMoveUci = `${sourceSquare}${targetSquare}`;
    let promotionChar = '';
    if ((piece === 'wP' && targetSquare.endsWith('8')) || (piece === 'bP' && targetSquare.endsWith('1'))) {
      promotionChar = 'q'; 
    }

    const expectedMoveUciWithOptionalPromotion = solutionMoves[currentMoveIndex];
    const moveResult = chessInstance.move({ from: sourceSquare, to: targetSquare, promotion: promotionChar || undefined });

    if (!moveResult) { 
      toast({ title: "Illegal Move", description: "That move is not allowed.", variant: "destructive", action: <XCircle className="text-red-500" /> });
      setCurrentFen(chessInstance.fen()); 
      return false;
    }

    const madeMoveUci = moveResult.from + moveResult.to + (moveResult.promotion || '');

    if (madeMoveUci.toLowerCase() === expectedMoveUciWithOptionalPromotion.toLowerCase()) {
      toast({ title: "Correct Move!", description: `You played ${moveResult.san}.`, action: <CheckCircle className="text-green-500" /> });
      setCurrentFen(chessInstance.fen());
      
      const moveNumberDisplay = Math.floor(currentMoveIndex / 2) + 1;
      const playerTag = '(You)';
      const turnIndicator = moveResult.color === 'w' ? '.' : '...';
      const historyText = `${moveNumberDisplay}${turnIndicator} ${playerTag} ${moveResult.san}`;
      setMoveHistory(prev => [...prev, historyText]);

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
        setIsUserTurn(false);
      }
      return true;
    } else {
      toast({ 
        title: "Incorrect Move", 
        description: `Expected the solution move, but you played ${moveResult.san}. Try again.`, 
        variant: "destructive", 
        action: <XCircle className="text-red-500" /> 
      });
      chessInstance.undo(); 
      setCurrentFen(chessInstance.fen()); 
      return false;
    }
  };

  const handleResetPuzzle = () => {
    if (puzzle) {
      const chess = new Chess(puzzle.fen);
      setCurrentFen(chess.fen());
      setBoardOrientation(puzzle.orientation);
      setChessInstance(chess);
      setCurrentMoveIndex(0);
      setIsPuzzleSolved(false);
      setMoveHistory([]);
      setHintSquare(null);
      setIsLoading(false); 
      toast({ title: "Puzzle Reset", description: "The current puzzle has been reset." });

      const initialGameTurn = chess.turn();
      const userPlaysAs = puzzle.orientation.charAt(0);
      if (initialGameTurn === userPlaysAs) {
        setIsUserTurn(true);
      } else {
        setIsUserTurn(false); 
      }
    }
  };

  const handleShowHint = () => {
    if (!puzzle || !chessInstance || !isUserTurn || isPuzzleSolved) {
      toast({ title: "Hint Unavailable", description: "Cannot show hint at this time.", variant: "default" });
      return;
    }
    if (currentMoveIndex >= solutionMoves.length || !solutionMoves[currentMoveIndex]) {
      toast({ title: "Hint Error", description: "No more moves in the solution for a hint.", variant: "destructive" });
      return;
    }

    const nextMoveUci = solutionMoves[currentMoveIndex];
    if (nextMoveUci.length < 2) { 
      toast({ title: "Hint Error", description: "Invalid solution move format for hint.", variant: "destructive" });
      return;
    }
    const sourceSq = nextMoveUci.substring(0, 2) as Square;
    setHintSquare(sourceSq);
    toast({ title: "Hint Activated", description: `The piece on ${sourceSq} is highlighted.`, duration: 3000 });
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
      <header className="my-6 text-center w-full flex justify-between items-center px-4">
        <div className="flex-1"></div> {}
        <div className="flex-1 text-center">
          <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
            <Brain className="w-12 h-12 mr-3 text-accent" />
            ChessEnigma
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Solve chess puzzles and sharpen your tactical mind.</p>
        </div>
        <div className="flex-1 flex justify-end">
          {/* LanguageSwitcher was here */}
        </div>
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
                boardOrientation={boardOrientation}
                arePiecesDraggable={isUserTurn && !isPuzzleSolved && !isLoading}
                customDarkSquareStyle={{ backgroundColor: 'hsl(var(--primary) / 0.8)'}}
                customLightSquareStyle={{ backgroundColor: 'hsl(var(--background))'}}
                hintSquare={hintSquare}
              />
            )}
          </CardContent>
        </Card>

        <div className="w-full lg:w-1/3 space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Controls & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={fetchNewPuzzle} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                New Puzzle
              </Button>
              <Button onClick={handleResetPuzzle} variant="outline" className="w-full" disabled={isLoading || !puzzle}>
                Reset Current Puzzle
              </Button>
              <Button onClick={handleShowHint} variant="outline" className="w-full" disabled={isLoading || !puzzle || !isUserTurn || isPuzzleSolved}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Show Hint
              </Button>
              <div className="p-3 bg-muted rounded-md text-center">
                {isPuzzleSolved ? (
                  <p className="font-semibold text-green-600">Puzzle Solved! Well done!</p>
                ) : isLoading ? (
                  <p className="font-semibold text-primary">Loading puzzle...</p>
                ) : puzzle && chessInstance && isUserTurn ? (
                  <p className="font-semibold text-accent-foreground animate-pulse">
                    {`Your turn (${puzzle.orientation}). Engine: ${chessInstance.turn() === 'w' ? 'White' : 'Black'} to move.`}
                  </p>
                ) : puzzle && chessInstance ? (
                  <p className="font-semibold text-primary">
                    {`App is thinking... (${chessInstance.turn() === 'w' ? 'White' : 'Black'} to move)`}
                  </p>
                ): (
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
                  <ol className="list-none list-inside space-y-1">
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
        <p>
          {currentYear !== null
            ? `© ${currentYear} ChessEnigma. All rights reserved.`
            : `© ChessEnigma. All rights reserved.`}
        </p>
        <p>Powered by Next.js, TailwindCSS, and a passion for chess.</p>
      </footer>
    </div>
  );
}
