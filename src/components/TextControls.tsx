import React from 'react';
import { Type, X, Palette } from 'lucide-react';
import { TextOverlay } from '../types';

interface TextControlsProps {
  textOverlay: TextOverlay;
  onTextChange: (textOverlay: TextOverlay) => void;
  onClearText: () => void;
  hasText: boolean;
}

// ZONE D'EXTENSION: Ajoutez ici de nouvelles polices
const fontOptions = [
  'Arial',
  'Georgia', 
  'Courier New',
  'Impact',
  'Verdana',
  'Tahoma',
  'Times New Roman',
  'Helvetica',
  'Comic Sans MS',
  'Trebuchet MS'
];

// ZONE D'EXTENSION: Ajoutez ici de nouvelles couleurs prédéfinies
const colorOptions = [
  { value: '#000000', name: 'Noir' },
  { value: '#FFFFFF', name: 'Blanc' },
  { value: '#FF0000', name: 'Rouge' },
  { value: '#00FF00', name: 'Vert' },
  { value: '#0000FF', name: 'Bleu' },
  { value: '#F59E0B', name: 'Orange' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#EF4444', name: 'Rouge vif' },
  { value: '#10B981', name: 'Vert émeraude' },
  { value: '#3B82F6', name: 'Bleu royal' },
  { value: '#F97316', name: 'Orange vif' },
  { value: '#EC4899', name: 'Rose' },
  { value: '#6366F1', name: 'Indigo' },
  { value: '#84CC16', name: 'Lime' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#8B5A2B', name: 'Marron' }
];

const TextControls: React.FC<TextControlsProps> = ({ 
  textOverlay, 
  onTextChange, 
  onClearText, 
  hasText 
}) => {
  const updateText = (updates: Partial<TextOverlay>) => {
    onTextChange({ ...textOverlay, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton de suppression */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ajouter du texte</h3>
        </div>
        {hasText && (
          <button
            onClick={onClearText}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="Supprimer le texte"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Champs de texte */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre principal
          </label>
          <input
            type="text"
            value={textOverlay.title}
            onChange={(e) => updateText({ title: e.target.value })}
            placeholder="Votre titre ici..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sous-titre
          </label>
          <input
            type="text"
            value={textOverlay.subtitle}
            onChange={(e) => updateText({ subtitle: e.target.value })}
            placeholder="Votre sous-titre..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Contrôles de style */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Police
          </label>
          <select
            value={textOverlay.font}
            onChange={(e) => updateText({ font: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="w-4 h-4 inline mr-1" />
            Couleur personnalisée
          </label>
          <input
            type="color"
            value={textOverlay.color}
            onChange={(e) => updateText({ color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Couleurs prédéfinies - Grille étendue */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Couleurs rapides
        </label>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => updateText({ color: color.value })}
              className={`
                w-full h-10 rounded-lg border-2 transition-all hover:scale-105 relative
                ${textOverlay.color === color.value 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${color.value === '#FFFFFF' ? 'shadow-inner' : ''}
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {textOverlay.color === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${color.value === '#FFFFFF' || color.value === '#F59E0B' ? 'bg-gray-800' : 'bg-white'}`} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tailles de police */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taille titre ({textOverlay.titleSize}px)
          </label>
          <input
            type="range"
            min="20"
            max="80"
            value={textOverlay.titleSize}
            onChange={(e) => updateText({ titleSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taille sous-titre ({textOverlay.subtitleSize}px)
          </label>
          <input
            type="range"
            min="16"
            max="60"
            value={textOverlay.subtitleSize}
            onChange={(e) => updateText({ subtitleSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Aperçu du texte */}
      {(textOverlay.title || textOverlay.subtitle) && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Type className="w-3 h-3" />
            Aperçu:
          </p>
          <div className="text-center">
            {textOverlay.title && (
              <div
                style={{
                  fontFamily: textOverlay.font,
                  fontSize: `${Math.min(textOverlay.titleSize / 2, 24)}px`,
                  color: textOverlay.color,
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                {textOverlay.title}
              </div>
            )}
            {textOverlay.subtitle && (
              <div
                style={{
                  fontFamily: textOverlay.font,
                  fontSize: `${Math.min(textOverlay.subtitleSize / 2, 18)}px`,
                  color: textOverlay.color,
                  fontStyle: 'italic'
                }}
              >
                {textOverlay.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions de déplacement */}
      {hasText && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800 font-medium mb-1">💡 Astuce :</p>
          <p className="text-xs text-green-700">
            Cliquez sur votre texte dans le canvas et glissez-le où vous voulez sur le t-shirt !
          </p>
        </div>
      )}
    </div>
  );
};

export default TextControls;