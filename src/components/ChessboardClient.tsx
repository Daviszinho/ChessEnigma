// @ts-nocheck
// TODO: Fix types
"use client";

import type { CSSProperties } from 'react';
import { Chessboard } from "react-chessboard";
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types'; // Ensure correct import path
import { useIsMobile } from '@/hooks/use-mobile';

interface ChessboardClientProps {
  fen: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square, piece: Piece) => boolean;
  boardWidth?: number;
  arePiecesDraggable: boolean;
  customBoardStyle?: CSSProperties;
  customDarkSquareStyle?: CSSProperties;
  customLightSquareStyle?: CSSProperties;
}

export default function ChessboardClient({
  fen,
  onPieceDrop,
  boardWidth,
  arePiecesDraggable,
  customBoardStyle = {},
  customDarkSquareStyle = { backgroundColor: "hsl(var(--primary) / 0.6)" },
  customLightSquareStyle = { backgroundColor: "hsl(var(--background))" },
}: ChessboardClientProps) {
  const isMobile = useIsMobile();
  const dynamicBoardWidth = boardWidth || (isMobile ? 300 : 400);

  return (
    <div style={{ width: dynamicBoardWidth, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 'var(--radius)' }}>
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardWidth={dynamicBoardWidth}
        arePiecesDraggable={arePiecesDraggable}
        customBoardStyle={{
          borderRadius: "var(--radius)",
          overflow: 'hidden', // Ensures inner border radius is visible if pieces are near edge
          ...customBoardStyle,
        }}
        customDarkSquareStyle={customDarkSquareStyle}
        customLightSquareStyle={customLightSquareStyle}
        customPieces={{}} // Can be used for custom piece sets if desired
        animationDuration={200}
        dropOffBoard="snapback" // Pieces snap back if dropped off board
      />
    </div>
  );
}
