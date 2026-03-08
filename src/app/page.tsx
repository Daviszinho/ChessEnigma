
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  return fenTurn;
};

interface MovePair {
  moveNumber: number;
  whiteMove: string | null;
  blackMove: string | null;
}

const getMoveDisplayPosition = (
  moveIndex: number,
  initialTurn: 'w' | 'b'
): { rowNumber: number; column: 'white' | 'black' } => {
  if (initialTurn === 'w') {
    return {
      rowNumber: Math.floor(moveIndex / 2) + 1,
      column: moveIndex % 2 === 0 ? 'white' : 'black',
    };
  }

  return {
    rowNumber: Math.floor((moveIndex + 1) / 2) + 1,
    column: moveIndex % 2 === 0 ? 'black' : 'white',
  };
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
  const [moveHistory, setMoveHistory] = useState<MovePair[]>([]);
  const [hintSquare, setHintSquare] = useState<Square | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [initialTurn, setInitialTurn] = useState<'w' | 'b'>('w');
  const audioContextRef = useRef<any>(null);
  const pendingMoveSoundRef = useRef(false);

  const { toast } = useToast();

  const emitBoardClickSound = useCallback((ctx: any) => {
    const now = ctx.currentTime;
    // Low transient to simulate piece impact.
    const impactOsc = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(260, now);
    impactOsc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
    impactGain.gain.setValueAtTime(0.0001, now);
    impactGain.gain.exponentialRampToValueAtTime(0.12, now + 0.003);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    impactOsc.connect(impactGain);
    impactGain.connect(ctx.destination);
    impactOsc.start(now);
    impactOsc.stop(now + 0.05);

    // Short filtered noise for the "wood clack" texture.
    const noiseDuration = 0.035;
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDuration), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1500, now);
    bandpass.Q.setValueAtTime(1.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.09, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + noiseDuration);
  }, []);

  const playMoveSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'running') {
      emitBoardClickSound(ctx);
      pendingMoveSoundRef.current = false;
      return;
    }

    if (ctx.state === 'suspended') {
      pendingMoveSoundRef.current = true;
      ctx.resume().then(() => {
        emitBoardClickSound(ctx);
        pendingMoveSoundRef.current = false;
      }).catch(() => {
        pendingMoveSoundRef.current = true;
      });
      return;
    }

    pendingMoveSoundRef.current = true;
  }, [emitBoardClickSound]);

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
    console.log("Puzzle ID:", newPuzzle.id);

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
    setInitialTurn(initialGameTurn);

    const userPlaysAs = effectiveOrientation.charAt(0);
    const newIsUserTurn = initialGameTurn === userPlaysAs;
    setIsUserTurn(newIsUserTurn);

    console.log(`User effectively plays as: ${userPlaysAs === 'w' ? 'White' : 'Black'}`);
    console.log(`Initial isUserTurn set to: ${newIsUserTurn}`);
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

      if (error instanceof Error && error.message.toLowerCase().includes("failed to fetch")) {
          toastDescription = t('toastErrorNetwork') || "Network error. Please check your connection.";
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });
    }
  }, [initializeNewPuzzle, toast, t]);

  const handleResetPuzzle = useCallback(() => {
    if (puzzle) {
      console.log("--- Puzzle Reset ---");
      initializeNewPuzzle(puzzle);
      toast({ title: t('toastPuzzleResetTitle'), description: t('toastPuzzleResetDescription') });
    }
  }, [puzzle, initializeNewPuzzle, toast, t]);

  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchNewPuzzle();
    }
  }, [fetchNewPuzzle]);

  useEffect(() => {
    const unlockAudio = () => {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass || !audioContextRef) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const makeAppMove = useCallback(() => {
    if (!chessInstance || isUserTurn || isPuzzleSolved || !puzzle || currentMoveIndex >= solutionMoves.length) {
      return;
    }

    setHintSquare(null);
    const moveNotation = solutionMoves[currentMoveIndex];
    const game = new Chess(chessInstance.fen());

    try {
      const moveResult = game.move(moveNotation, { sloppy: true });
      if (!moveResult) throw new Error("Invalid move in solution");

      setChessInstance(game);
      setCurrentFen(game.fen());
      playMoveSound();

      const { rowNumber, column } = getMoveDisplayPosition(currentMoveIndex, initialTurn);
      setMoveHistory(prev => {
        const newHistory = [...prev];
        let pair = newHistory.find(p => p.moveNumber === rowNumber);
        if (!pair) {
          pair = { moveNumber: rowNumber, whiteMove: null, blackMove: null };
          newHistory.push(pair);
        }
        if (column === 'white') pair.whiteMove = moveResult.san;
        else pair.blackMove = moveResult.san;
        return newHistory.sort((a, b) => a.moveNumber - b.moveNumber);
      });

      const newMoveIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newMoveIndex);

      if (newMoveIndex >= solutionMoves.length) {
        setIsPuzzleSolved(true);
        toast({ title: t('toastPuzzleSolvedTitle'), description: t('toastPuzzleSolvedDescription'), action: <CheckCircle className="text-green-500" /> });
      } else {
        setIsUserTurn(true);
      }
    } catch (e) {
      console.error("Critical Error: Invalid app move in solution.", { move: moveNotation, fen: chessInstance.fen(), error: e.message });
      toast({ title: t('toastPuzzleErrorTitle'), description: t('toastPuzzleErrorDescription'), variant: "destructive" });
      handleResetPuzzle();
    }
  }, [chessInstance, solutionMoves, currentMoveIndex, isUserTurn, isPuzzleSolved, puzzle, initialTurn, playMoveSound, t, toast, handleResetPuzzle]);

  useEffect(() => {
    if (!isUserTurn && !isLoading && !isPuzzleSolved) {
      const timer = setTimeout(makeAppMove, 500);
      return () => clearTimeout(timer);
    }
  }, [isUserTurn, isLoading, isPuzzleSolved, makeAppMove]);

  const handleUserMove = useCallback((sourceSquare: Square, targetSquare: Square, piece: Piece): boolean => {
    if (!chessInstance || !isUserTurn || isPuzzleSolved || !puzzle || currentMoveIndex >= solutionMoves.length) {
      return false;
    }

    const game = new Chess(chessInstance.fen());
    const pieceOnSource = game.get(sourceSquare);

    if (!pieceOnSource) {
      toast({ title: 'Error', description: 'An internal error occurred. Please reset the puzzle.', variant: "destructive" });
      return false;
    }

    const expectedMove = solutionMoves[currentMoveIndex];
    const isPromotion = (pieceOnSource.type === 'p' && ((pieceOnSource.color === 'w' && sourceSquare[1] === '7' && targetSquare[1] === '8') || (pieceOnSource.color === 'b' && sourceSquare[1] === '2' && targetSquare[1] === '1')));
    const promotionChar = isPromotion ? (expectedMove.length === 5 ? expectedMove[4] : 'q') : undefined;

    try {
      const moveResult = game.move({ from: sourceSquare, to: targetSquare, promotion: promotionChar });
      const madeMoveUci = moveResult.from + moveResult.to + (moveResult.promotion || '');

      if (madeMoveUci.toLowerCase() === expectedMove.toLowerCase()) {
        setChessInstance(game);
        setCurrentFen(game.fen());
        playMoveSound();
        toast({ title: t('toastCorrectMoveTitle'), description: t('toastCorrectMoveDescription', { san: moveResult.san }), action: <CheckCircle className="text-green-500" /> });

        const { rowNumber, column } = getMoveDisplayPosition(currentMoveIndex, initialTurn);
        setMoveHistory(prev => {
          const newHistory = [...prev];
          let pair = newHistory.find(p => p.moveNumber === rowNumber);
          if (!pair) {
            pair = { moveNumber: rowNumber, whiteMove: null, blackMove: null };
            newHistory.push(pair);
          }
          if (column === 'white') pair.whiteMove = moveResult.san;
          else pair.blackMove = moveResult.san;
          return newHistory.sort((a, b) => a.moveNumber - b.moveNumber);
        });

        const newMoveIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(newMoveIndex);

        if (newMoveIndex >= solutionMoves.length) {
          setIsPuzzleSolved(true);
          toast({ title: t('toastPuzzleSolvedTitle'), description: t('toastPuzzleSolvedDescription'), action: <CheckCircle className="text-green-500" /> });
        } else {
          setIsUserTurn(false);
        }
        return true;
      } else {
        toast({ title: t('toastIncorrectMoveTitle'), description: t('toastIncorrectMoveDescription'), variant: "destructive", action: <XCircle className="text-red-500" /> });
        return false;
      }
    } catch (e) {
      toast({ title: t('toastIllegalMoveTitle'), description: t('toastIllegalMoveDescription'), variant: "destructive", action: <XCircle className="text-red-500" /> });
      return false;
    }
  }, [chessInstance, isUserTurn, isPuzzleSolved, puzzle, solutionMoves, currentMoveIndex, initialTurn, playMoveSound, t, toast]);

  const handleShowHint = () => {
    if (!isUserTurn || isPuzzleSolved || currentMoveIndex >= solutionMoves.length) return;
    const nextMoveUci = solutionMoves[currentMoveIndex];
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
        <div className="flex-1"></div>
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
                  {t('installButton')}
                </Button>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {t('installDescription')}
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">#</TableHead>
                        <TableHead>{t('whiteMoves')}</TableHead>
                        <TableHead>{t('blackMoves')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moveHistory.map((pair) => (
                        <TableRow key={pair.moveNumber}>
                          <TableCell className="font-medium text-center">{pair.moveNumber}</TableCell>
                          <TableCell>{pair.whiteMove || '-'}</TableCell>
                          <TableCell>{pair.blackMove || (pair.whiteMove ? '' : '-')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-auto pt-10 pb-8 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground px-4">
        <div className="text-center md:text-left">
          <p>
            {currentYear !== null
              ? t('footerCopyright', { year: currentYear })
              : t('footerCopyrightNoYear')}
          </p>
          <p>{t('footerPoweredBy')}</p>
        </div>
        <div className="flex items-center bg-muted/30 p-2 rounded-lg border border-border/50">
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  );
}
