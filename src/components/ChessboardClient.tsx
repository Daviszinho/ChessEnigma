
// @ts-nocheck
// TODO: Fix types
"use client";

import type { CSSProperties } from 'react';
import { Chessboard } from "react-chessboard";
import type { Piece, Square, BoardOrientation } from 'react-chessboard/dist/chessboard/types'; // Ensure correct import path
import { useIsMobile } from '@/hooks/use-mobile';

interface ChessboardClientProps {
  fen: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square, piece: Piece) => boolean;
  boardOrientation?: BoardOrientation; // 'white' | 'black'
  boardWidth?: number;
  arePiecesDraggable: boolean;
  customBoardStyle?: CSSProperties;
  customDarkSquareStyle?: CSSProperties;
  customLightSquareStyle?: CSSProperties;
  hintSquare?: Square | null;
}

export default function ChessboardClient({
  fen,
  onPieceDrop,
  boardOrientation = 'white',
  boardWidth,
  arePiecesDraggable,
  customBoardStyle = {},
  customDarkSquareStyle = { backgroundColor: "hsl(var(--primary) / 0.6)" },
  customLightSquareStyle = { backgroundColor: "hsl(var(--background))" },
  hintSquare = null,
}: ChessboardClientProps) {
  const isMobile = useIsMobile();
  const dynamicBoardWidth = boardWidth || (isMobile ? 300 : 400);

  const getCustomSquareStyles = () => {
    const styles: { [square: string]: CSSProperties } = {};
    if (hintSquare) {
      // Using HSL variables from globals.css for consistency
      // The accent color is orange by default. We add transparency.
      styles[hintSquare] = {
        backgroundColor: 'hsla(var(--accent), 0.5)', // 50% opacity for accent color
      };
    }
    return styles;
  };

  return (
    <div style={{ width: dynamicBoardWidth, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 'var(--radius)' }}>
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardOrientation={boardOrientation}
        boardWidth={dynamicBoardWidth}
        arePiecesDraggable={arePiecesDraggable}
        customBoardStyle={{
          borderRadius: "var(--radius)",
          overflow: 'hidden', 
          ...customBoardStyle,
        }}
        customDarkSquareStyle={customDarkSquareStyle}
        customLightSquareStyle={customLightSquareStyle}
        customSquareStyles={getCustomSquareStyles()}
        customPieces={{}} 
        animationDuration={200}
        dropOffBoard="snapback" 
      />
    </div>
  );
}
