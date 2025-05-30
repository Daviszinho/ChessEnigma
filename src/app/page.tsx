
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
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';


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
  const { t, currentLocale } = useTranslation();

  useEffect(() => {
    document.title = t('appName');
  }, [t, currentLocale]);

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
      console.error("Failed to fetch puzzle:", error);
      let toastDescription = t('toastErrorFetchingPuzzleDescription');
      if (error instanceof Error && error.message) {
        toastDescription = error.message;
      }
      toast({
        title: t('toastErrorFetchingPuzzleTitle'),
        description: toastDescription,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [initializeNewPuzzle, toast, t]);

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
      const playerTag = "(App)";
      const historyText = `${moveNumberDisplay}${moveResult.color === 'b' && currentMoveIndex > 0 ? '...' : '.'} ${playerTag} ${moveResult.san}`;
      setMoveHistory(prev => [...prev, historyText]);
      
      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (newMoveIndex >= solutionMoves.length) {
        setIsPuzzleSolved(true);
        toast({
          title: t('toastPuzzleSolvedTitle'),
          description: t('toastPuzzleSolvedDescription'),
          action: <CheckCircle className="text-green-500" />,
        });
      } else {
        setIsUserTurn(true);
      }
    } else {
      console.error("Invalid app move in solution:", moveNotation, "FEN:", chessInstance.fen());
      toast({ title: t('toastPuzzleErrorTitle'), description: t('toastPuzzleErrorDescription'), variant: "destructive" });
    }
  }, [chessInstance, solutionMoves, currentMoveIndex, isUserTurn, isPuzzleSolved, toast, puzzle, t]);

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
          title: t('toastNotYourPieceTitle'), 
          description: t('toastNotYourPieceDescription', { orientation: puzzle.orientation }), 
          variant: "destructive"
        });
        return false;
    }

    if (chessInstance.turn() !== userPlaysAsColor) {
        toast({ 
          title: t('toastNotYourTurnTitle'), 
          description: t('toastNotYourTurnDescription', { 
            turn: chessInstance.turn() === 'w' ? t('playerTurnWhite') : t('playerTurnBlack'), 
            orientation: puzzle.orientation 
          }), 
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
      toast({ title: t('toastIllegalMoveTitle'), description: t('toastIllegalMoveDescription'), variant: "destructive", action: <XCircle className="text-red-500" /> });
      setCurrentFen(chessInstance.fen()); 
      return false;
    }

    const madeMoveUci = moveResult.from + moveResult.to + (moveResult.promotion || '');

    if (madeMoveUci.toLowerCase() === expectedMoveUciWithOptionalPromotion.toLowerCase()) {
      toast({ title: t('toastCorrectMoveTitle'), description: t('toastCorrectMoveDescription', { san: moveResult.san }), action: <CheckCircle className="text-green-500" /> });
      setCurrentFen(chessInstance.fen());
      
      const moveNumberDisplay = Math.floor(currentMoveIndex / 2) + 1;
      const playerTag = `(${t('playerTagYou') || 'You'})`;
      const historyText = `${moveNumberDisplay}${moveResult.color === 'b' && currentMoveIndex > 0 ? '...' : '.'} ${playerTag} ${moveResult.san}`;
      setMoveHistory(prev => [...prev, historyText]);

      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (newMoveIndex >= solutionMoves.length) {
        setIsPuzzleSolved(true);
        toast({
          title: t('toastPuzzleSolvedTitle'),
          description: t('toastPuzzleSolvedDescription'),
          action: <CheckCircle className="text-green-500" />,
        });
      } else {
        setIsUserTurn(false);
      }
      return true;
    } else {
      toast({ 
        title: t('toastIncorrectMoveTitle'), 
        description: t('toastIncorrectMoveDescription', { san: moveResult.san }), 
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
      toast({ title: t('toastPuzzleResetTitle'), description: t('toastPuzzleResetDescription') });

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
      toast({ title: t('toastHintUnavailableTitle'), description: t('toastHintUnavailableDescription'), variant: "default" });
      return;
    }
    if (currentMoveIndex >= solutionMoves.length || !solutionMoves[currentMoveIndex]) {
      toast({ title: t('toastHintErrorTitle'), description: t('toastHintErrorNoMoves'), variant: "destructive" });
      return;
    }

    const nextMoveUci = solutionMoves[currentMoveIndex];
    if (nextMoveUci.length < 2) { 
      toast({ title: t('toastHintErrorTitle'), description: t('toastHintErrorInvalidFormat'), variant: "destructive" });
      return;
    }
    const sourceSq = nextMoveUci.substring(0, 2) as Square;
    setHintSquare(sourceSq);
    toast({ title: t('toastHintActivatedTitle'), description: t('toastHintActivatedDescription', { square: sourceSq }), duration: 3000 });
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
        <div className="flex-1"></div> {/* Spacer */}
        <div className="flex-1 text-center">
          <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
            <Brain className="w-12 h-12 mr-3 text-accent" />
            {t('appName')}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">{t('appSubtitle')}</p>
        </div>
        <div className="flex-1 flex justify-end">
          <LanguageSwitcher />
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
              <CardTitle className="text-2xl text-primary">{t('controlsAndStatusTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={fetchNewPuzzle} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                {t('newPuzzleButton')}
              </Button>
              <Button onClick={handleResetPuzzle} variant="outline" className="w-full" disabled={isLoading || !puzzle}>
                {t('resetPuzzleButton')}
              </Button>
              <Button onClick={handleShowHint} variant="outline" className="w-full" disabled={isLoading || !puzzle || !isUserTurn || isPuzzleSolved}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {t('showHintButton')}
              </Button>
              <div className="p-3 bg-muted rounded-md text-center">
                {isPuzzleSolved ? (
                  <p className="font-semibold text-green-600">{t('statusPuzzleSolved')}</p>
                ) : isLoading ? (
                  <p className="font-semibold text-primary">{t('statusLoadingPuzzle')}</p>
                ) : puzzle && chessInstance && isUserTurn ? (
                  <p className="font-semibold text-accent-foreground animate-pulse">
                    {t('statusYourTurn', { 
                      orientation: puzzle.orientation, 
                      engineTurn: chessInstance.turn() === 'w' ? t('playerTurnWhite') : t('playerTurnBlack')
                    })}
                  </p>
                ) : puzzle && chessInstance ? (
                  <p className="font-semibold text-primary">
                    {t('statusAppThinking', { 
                      engineTurn: chessInstance.turn() === 'w' ? t('playerTurnWhite') : t('playerTurnBlack')
                    })}
                  </p>
                ): (
                   <p className="font-semibold text-primary">{t('statusAppThinkingFallback')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{t('moveHistoryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/30">
                {moveHistory.length === 0 ? (
                  <p className="text-muted-foreground italic">{t('moveHistoryEmpty')}</p>
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
            ? t('footerCopyright', { year: currentYear })
            : t('footerCopyrightLoading')}
        </p>
        <p>{t('footerPoweredBy')}</p>
      </footer>
    </div>
  );
}

