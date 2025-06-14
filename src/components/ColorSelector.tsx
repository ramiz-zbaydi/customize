import React from 'react';
import { TShirtColors } from '../types';

interface ColorSelectorProps {
  colors: TShirtColors;
  selectedColor: keyof TShirtColors;
  onColorChange: (color: keyof TShirtColors) => void;
}

const colorNames: Record<keyof TShirtColors, string> = {
  white: 'Blanc',
  black: 'Noir',
  green: 'Vert',
  navy: 'Marine',
  red: 'Rouge',
  purple: 'Violet'
};

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, selectedColor, onColorChange }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(colors).map(([colorKey, colorValue]) => {
        const key = colorKey as keyof TShirtColors;
        const isSelected = selectedColor === key;
        
        return (
          <button
            key={key}
            onClick={() => onColorChange(key)}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200 group
              ${isSelected 
                ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            <div
              className={`
                w-full h-12 rounded-lg mb-2 border transition-all
                ${key === 'white' ? 'border-gray-300' : 'border-transparent'}
                ${isSelected ? 'shadow-inner' : ''}
              `}
              style={{ backgroundColor: colorValue }}
            />
            <span className={`
              text-xs font-medium transition-colors
              ${isSelected ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-800'}
            `}>
              {colorNames[key]}
            </span>
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ColorSelector;