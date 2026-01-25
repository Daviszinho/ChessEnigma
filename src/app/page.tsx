
// @ts-nocheck
// TODO: Fix types
"use client";

import type { CSSProperties } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';

import ChessboardClient from '@/components/ChessboardClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPuzzleAction, type Puzzle } from './actions';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, RefreshCcw, Brain, Loader2, Lightbulb, Download } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePWAInstall } from '@/hooks/usePWAInstall';


const getEffectiveOrientation = (
  fenTurn: 'w' | 'b',
  solutionLength: number,
  providedOrientation: 'white' | 'black'
): 'white' | 'black' => {
  const isSolutionEven = solutionLength > 0 && solutionLength % 2 === 0;
  if (isSolutionEven) {
    return fenTurn === 'w' ? 'black' : 'white';
  }
  // If solution length is odd, the FEN turn player is the one making the last move of the solution.
  // If FEN is 'w' and solution is odd, White makes the last move. User should play as White.
  // If FEN is 'b' and solution is odd, Black makes the last move. User should play as Black.
  return fenTurn; // Default to FEN turn if odd, or use providedOrientation if it has a specific meaning.
  // For this heuristic, we primarily care about making the user the player who *starts* the puzzle's significant sequence if the solution is short and they are the one to make the *first* key move.
  // If the puzzle data's `providedOrientation` is consistently set to the *solver's* side, we can use that.
  // The current heuristic is: if solution is even, flip the FEN turn. Otherwise, use FEN turn.
  // This is a simplification. A more robust approach might involve better `orientation` data from the source.
  // Let's refine to: if even, flip FEN. If odd, use the *FEN's turn directly* as the player perspective.
  // return fenTurn === 'w' ? 'white' : 'black'; // simpler: if solution is odd, user plays as the FEN turn player.
};


export default function Home() {
  const { t, locale } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
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
    if (t && t('pageTitle')) { // Check if t and specific key exists
      document.title = t('pageTitle');
    }
  }, [t, locale]);


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const initializeNewPuzzle = useCallback((newPuzzle: Puzzle) => {
    console.log("--- Initializing New Puzzle ---");
    console.log("Received Puzzle Data from source:", JSON.stringify(newPuzzle));

    const chess = new Chess(newPuzzle.fen);
    const initialGameTurn = chess.turn();
    const parsedSolutionMoves = newPuzzle.solution.trim() ? newPuzzle.solution.split(' ') : [];
    const numSolutionMoves = parsedSolutionMoves.length;

    const effectiveOrientation = getEffectiveOrientation(initialGameTurn, numSolutionMoves, newPuzzle.orientation);

    setPuzzle(newPuzzle);
    setCurrentFen(chess.fen());
    setBoardOrientation(effectiveOrientation);
    setChessInstance(chess);
    setSolutionMoves(parsedSolutionMoves);
    setCurrentMoveIndex(0);
    setIsPuzzleSolved(false);
    setMoveHistory([]);
    setHintSquare(null);
    setIsLoading(false);

    const userPlaysAs = effectiveOrientation.charAt(0);

    console.log("FEN indicates turn for:", initialGameTurn === 'w' ? 'White' : 'Black');
    console.log("Data source orientation:", newPuzzle.orientation);
    console.log("Solution length:", numSolutionMoves);
    console.log("Calculated effective user orientation:", effectiveOrientation);
    console.log("User effectively plays as:", userPlaysAs === 'w' ? 'White' : 'Black');

    let newIsUserTurn;
    if (initialGameTurn === userPlaysAs) {
      newIsUserTurn = true;
    } else {
      newIsUserTurn = false;
    }
    setIsUserTurn(newIsUserTurn);
    console.log("Initial isUserTurn set to:", newIsUserTurn);
    console.log("--- End Puzzle Initialization Log ---");

  }, []);

  const fetchNewPuzzle = useCallback(async () => {
    setIsLoading(true);
    setHintSquare(null);
    try {
      const newPuzzleData = await getPuzzleAction();
      initializeNewPuzzle(newPuzzleData);
    } catch (error) {
      setIsLoading(false);

      let toastTitle = t('toastErrorFetchingPuzzleTitle') || "Error Fetching Puzzle";
      let toastDescription = t('toastErrorFetchingPuzzleDescription') || "An unexpected error occurred.";

      if (error instanceof Error && error.message) {
        const lowerCaseErrorMessage = error.message.toLowerCase();
        if (lowerCaseErrorMessage.includes("typeerror: failed to fetch") || lowerCaseErrorMessage.includes("failed to fetch")) {
          toastDescription = t('toastErrorNetwork') || "Network error. Please check your connection.";
        } else {
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
  }, [initializeNewPuzzle, toast, t]);

  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    if (!hasFetchedInitial.current) {
      fetchNewPuzzle();
      hasFetchedInitial.current = true;
    }
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
      const moveNumber = Math.floor(currentMoveIndex / 2) + 1;
      const playerTag = t('playerTagApp');
      const turnIndicator = moveResult.color === 'w' ? '.' : '...';
      const historyText = (moveResult.color === 'w' || moveHistory.length === 0)
        ? `${moveNumber}${turnIndicator} ${playerTag} ${moveResult.san}`
        : `${playerTag} ${moveResult.san}`;
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
      console.error("Invalid app move in solution:", moveNotation, "FEN:", chessInstance.fen(), "Current turn by FEN:", chessInstance.turn());
      toast({
        title: t('toastPuzzleErrorTitle'),
        description: t('toastPuzzleErrorDescription'),
        variant: "destructive"
      });
      setIsUserTurn(true);
      setIsLoading(false);
    }
  }, [chessInstance, solutionMoves, currentMoveIndex, isUserTurn, isPuzzleSolved, toast, puzzle, moveHistory, t]);

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

    const userPlaysAsColor = boardOrientation.charAt(0);
    if (piece.charAt(0).toLowerCase() !== userPlaysAsColor) {
      toast({
        title: t('toastNotYourPieceTitle'),
        description: t('toastNotYourPieceDescription', { orientation: t(boardOrientation === 'white' ? 'orientationWhite' : 'orientationBlack') }),
        variant: "destructive"
      });
      return false;
    }

    if (chessInstance.turn() !== userPlaysAsColor) {
      toast({
        title: t('toastNotYourTurnTitle'),
        description: t('toastNotYourTurnDescription', {
          turn: t(chessInstance.turn() === 'w' ? 'orientationWhite' : 'orientationBlack'),
          orientation: t(boardOrientation === 'white' ? 'orientationWhite' : 'orientationBlack')
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

      const moveNumber = Math.floor(currentMoveIndex / 2) + 1;
      const playerTag = t('playerTagUser');
      const turnIndicator = moveResult.color === 'w' ? '.' : '...';
      const historyText = (moveResult.color === 'w' || moveHistory.length === 0)
        ? `${moveNumber}${turnIndicator} ${playerTag} ${moveResult.san}`
        : `${playerTag} ${moveResult.san}`;
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
      const initialGameTurn = chess.turn();
      const parsedSolutionMoves = puzzle.solution.trim() ? puzzle.solution.split(' ') : [];
      const numSolutionMoves = parsedSolutionMoves.length;
      const effectiveOrientation = getEffectiveOrientation(initialGameTurn, numSolutionMoves, puzzle.orientation);

      setCurrentFen(chess.fen());
      setBoardOrientation(effectiveOrientation);
      setChessInstance(chess);
      setSolutionMoves(parsedSolutionMoves);
      setCurrentMoveIndex(0);
      setIsPuzzleSolved(false);
      setMoveHistory([]);
      setHintSquare(null);
      setIsLoading(false);
      toast({ title: t('toastPuzzleResetTitle'), description: t('toastPuzzleResetDescription') });

      const userPlaysAs = effectiveOrientation.charAt(0);
      let newIsUserTurn;
      if (initialGameTurn === userPlaysAs) {
        newIsUserTurn = true;
      } else {
        newIsUserTurn = false;
      }
      setIsUserTurn(newIsUserTurn);

      console.log("--- Puzzle Reset ---");
      console.log("Original Puzzle Data:", JSON.stringify(puzzle));
      console.log("FEN indicates turn for:", initialGameTurn === 'w' ? 'White' : 'Black');
      console.log("Data source orientation:", puzzle.orientation);
      console.log("Solution length:", numSolutionMoves);
      console.log("Calculated effective user orientation:", effectiveOrientation);
      console.log("User effectively plays as:", userPlaysAs === 'w' ? 'White' : 'Black');
      console.log("isUserTurn set to:", newIsUserTurn);
      console.log("--- End Reset Log ---");
    }
  };

  const handleShowHint = () => {
    if (!puzzle || !chessInstance || !isUserTurn || isPuzzleSolved) {
      toast({ title: t('toastHintUnavailableTitle'), description: t('toastHintUnavailableDescription'), variant: "default" });
      return;
    }
    if (currentMoveIndex >= solutionMoves.length || !solutionMoves[currentMoveIndex]) {
      toast({ title: t('toastHintErrorTitle'), description: t('toastHintErrorNoMoreMoves'), variant: "destructive" });
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

  const handleInstallApp = async () => {
    const installed = await installApp();
    if (installed) {
      toast({
        title: "Installation Successful",
        description: "ChessEnigma has been installed on your device!",
        action: <CheckCircle className="text-green-500" />,
      });
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
      <header className="my-6 text-center w-full flex justify-between items-center px-4">
        <div className="flex-1"></div>
        <div className="flex-1 text-center">
          <h1 className="text-5xl font-bold text-primary flex items-center justify-center">
            <Brain className="w-12 h-12 mr-3 text-accent" />
            {t('headerTitle')}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">{t('headerSubtitle')}</p>
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
                customDarkSquareStyle={{ backgroundColor: 'hsl(var(--primary) / 0.8)' }}
                customLightSquareStyle={{ backgroundColor: 'hsl(var(--background))' }}
                hintSquare={hintSquare}
              />
            )}
          </CardContent>
        </Card>

        <div className="w-full lg:w-1/3 space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{t('controlsTitle')}</CardTitle>
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
                  <p className="font-semibold text-green-600">{t('statusSolved')}</p>
                ) : isLoading ? (
                  <p className="font-semibold text-primary">{t('statusLoading')}</p>
                ) : puzzle && chessInstance && isUserTurn ? (
                  <p className="font-semibold text-accent-foreground animate-pulse">
                    {t('statusYourTurn', { orientation: t(boardOrientation === 'white' ? 'orientationWhite' : 'orientationBlack') })}
                  </p>
                ) : puzzle && chessInstance ? (
                  <p className="font-semibold text-primary">
                    {t('statusAppThinking')}
                  </p>
                ) : (
                  <p className="font-semibold text-primary">{t('statusAppThinking')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {isInstallable && (
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <Button 
                  onClick={handleInstallApp} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Install ChessEnigma
                </Button>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Install the app for offline access and a better experience
                </p>
              </CardContent>
            </Card>
          )}

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
                      <li key={index} className="text-sm">
                        {move}
                      </li>
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
            : t('footerCopyrightNoYear')}
        </p>
        <p>{t('footerPoweredBy')}</p>
      </footer>
    </div>
  );
}
