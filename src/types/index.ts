export interface Design {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
}

export interface TextOverlay {
  title: string;
  subtitle: string;
  font: string;
  color: string;
  titleSize: number;
  subtitleSize: number;
  x?: number; // Position X du texte (optionnelle, centrée par défaut)
  y?: number; // Position Y du texte (optionnelle, centrée par défaut)
}

export interface TShirtColors {
  white: string;
  black: string;
  green: string;
  navy: string;
  red: string;
  purple: string;
}