import React, { useState, useRef, useCallback } from 'react';
import { Upload, Plus, Minus, Move, Palette, ShoppingCart, Type, Sparkles, X } from 'lucide-react';

// Déclaration globale pour jsPDF
declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
  }
}

// Charger jsPDF depuis CDN
if (typeof window !== 'undefined' && !window.jspdf) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.async = true;
  document.head.appendChild(script);
}

// Types
interface Design {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
}

interface TShirtColors {
  [key: string]: string;
}

interface TextOverlay {
  title: string;
  subtitle: string;
  font: string;
  color: string;
  titleSize: number;
  subtitleSize: number;
}

// Composant ColorSelector compact
const ColorSelector: React.FC<{
  colors: TShirtColors;
  selectedColor: string;
  onColorChange: (color: string) => void;
}> = ({ colors, selectedColor, onColorChange }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(colors).map(([key, value]) => (
        <button
          key={key}
          onClick={() => onColorChange(key)}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
            selectedColor === key 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: value }}
          title={key}
        />
      ))}
    </div>
  );
};

// Composant FileUpload compact
const FileUpload: React.FC<{
  onFileUpload: (file: File) => void;
  hasDesign: boolean;
  onClearDesign: () => void;
}> = ({ onFileUpload, hasDesign, onClearDesign }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Design
        </button>
        {hasDesign && (
          <button
            onClick={onClearDesign}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-2 px-2 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Composant TextControls compact
const TextControls: React.FC<{
  textOverlay: TextOverlay;
  onTextChange: (text: TextOverlay) => void;
  onClearText: () => void;
  hasText: boolean;
}> = ({ textOverlay, onTextChange, onClearText, hasText }) => {
  const textColors = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#DC2626',
    blue: '#2563EB',
    green: '#16A34A',
    yellow: '#CA8A04',
    purple: '#9333EA',
    pink: '#DB2777'
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Titre"
          value={textOverlay.title}
          onChange={(e) => onTextChange({ ...textOverlay, title: e.target.value })}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
        />
        {hasText && (
          <button
            onClick={onClearText}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-1 px-2 rounded transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <input
        type="text"
        placeholder="Sous-titre"
        value={textOverlay.subtitle}
        onChange={(e) => onTextChange({ ...textOverlay, subtitle: e.target.value })}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
      />
      
      <div className="flex gap-2 items-center">
        <select
          value={textOverlay.font}
          onChange={(e) => onTextChange({ ...textOverlay, font: e.target.value })}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times">Times</option>
          <option value="Courier">Courier</option>
          <option value="Verdana">Verdana</option>
        </select>
        
        <div className="flex gap-1">
          {Object.entries(textColors).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onTextChange({ ...textOverlay, color: value })}
              className={`w-5 h-5 rounded-full border transition-all duration-200 hover:scale-110 ${
                textOverlay.color === value 
                  ? 'border-blue-500 ring-1 ring-blue-200' 
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: value }}
              title={key}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant DesignCanvas
const DesignCanvas = React.forwardRef<HTMLCanvasElement, {
  design: Design | null;
  tshirtColor: string;
  tshirtColors: TShirtColors;
  onDesignUpdate: (design: Design) => void;
  textOverlay: TextOverlay;
  onTextUpdate: (text: TextOverlay) => void;
}>(({ design, tshirtColor, tshirtColors, onDesignUpdate, textOverlay, onTextUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<'design' | 'text' | null>(null);
  const [tshirtImage, setTshirtImage] = useState<HTMLImageElement | null>(null);

  React.useImperativeHandle(ref, () => canvasRef.current!);

  // Charger l'image du t-shirt
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setTshirtImage(img);
    };
    img.src = `/tshirts/${tshirtColor}.png`;
  }, [tshirtColor]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw t-shirt image if loaded, otherwise fallback to colored rectangle
    if (tshirtImage) {
      // Haute qualité : dessiner l'image en 2x pour le canvas haute résolution
      ctx.drawImage(tshirtImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback: Draw t-shirt background as colored rectangle
      ctx.fillStyle = tshirtColors[tshirtColor];
      // Adapter les coordonnées pour la haute résolution (x2)
      ctx.fillRect(300, 200, 600, 800);
    }

    // Draw design
    if (design) {
      ctx.save();
      // Adapter les coordonnées pour la haute résolution (x2)
      ctx.translate((design.x * 2) + design.width, (design.y * 2) + design.height);
      ctx.rotate(design.rotation);
      // Dessiner avec une qualité élevée
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(design.image, -design.width, -design.height, design.width * 2, design.height * 2);
      
      // Draw selection border
      if (selectedElement === 'design') {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 4; // Plus épais pour la haute résolution
        ctx.setLineDash([10, 10]); // Plus grand pour la haute résolution
        ctx.strokeRect(-design.width, -design.height, design.width * 2, design.height * 2);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Draw text
    if (textOverlay.title || textOverlay.subtitle) {
      ctx.fillStyle = textOverlay.color;
      ctx.textAlign = 'center';
      // Améliorer le rendu du texte
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      if (textOverlay.title) {
        ctx.font = `${textOverlay.titleSize * 2}px ${textOverlay.font}`; // x2 pour haute résolution
        ctx.fillText(textOverlay.title, 600, 400); // Adapter coordonnées
      }
      
      if (textOverlay.subtitle) {
        ctx.font = `${textOverlay.subtitleSize * 2}px ${textOverlay.font}`; // x2 pour haute résolution
        ctx.fillText(textOverlay.subtitle, 600, 500); // Adapter coordonnées
      }

      // Draw text selection border
      if (selectedElement === 'text' && (textOverlay.title || textOverlay.subtitle)) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 4; // Plus épais pour la haute résolution
        ctx.setLineDash([10, 10]); // Plus grand pour la haute résolution
        ctx.strokeRect(400, 340, 400, 200); // Adapter coordonnées
        ctx.setLineDash([]);
      }
    }
  }, [design, tshirtColor, tshirtColors, textOverlay, selectedElement, tshirtImage]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Fonction générique pour gérer les coordonnées (souris ou tactile)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      // Événement tactile
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Événement souris
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * 2, // x2 car le canvas est 2x plus grand
      y: (clientY - rect.top) * 2
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);

    // Check if clicking on design (adapter les coordonnées)
    if (design &&
        x >= design.x * 2 && x <= (design.x + design.width) * 2 &&
        y >= design.y * 2 && y <= (design.y + design.height) * 2) {
      setSelectedElement('design');
      setIsDragging(true);
      setIsRotating('shiftKey' in e ? e.shiftKey : false);
      setDragStart({ x: x - design.x * 2, y: y - design.y * 2 });
    }
    // Check if clicking on text area (adapter les coordonnées)
    else if ((textOverlay.title || textOverlay.subtitle) &&
             x >= 400 && x <= 800 && y >= 340 && y <= 540) {
      setSelectedElement('text');
    }
    else {
      setSelectedElement(null);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !design) return;

    e.preventDefault(); // Empêcher le scroll sur mobile
    const { x, y } = getCoordinates(e);

    if (isRotating) {
      const centerX = (design.x + design.width / 2) * 2;
      const centerY = (design.y + design.height / 2) * 2;
      const angle = Math.atan2(y - centerY, x - centerX);
      onDesignUpdate({ ...design, rotation: angle });
    } else {
      onDesignUpdate({
        ...design,
        x: Math.max(150, Math.min(450 - design.width, (x - dragStart.x) / 2)),
        y: Math.max(100, Math.min(500 - design.height, (y - dragStart.y) / 2))
      });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsRotating(false);
  };

  // Gestionnaires pour souris
  const handleMouseDown = (e: React.MouseEvent) => handleStart(e);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e);
  const handleMouseUp = () => handleEnd();

  // Gestionnaires pour tactile
  const handleTouchStart = (e: React.TouchEvent) => handleStart(e);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e);
  const handleTouchEnd = () => handleEnd();

  return (
    <div className="flex justify-center p-4">
      <canvas
        ref={canvasRef}
        width={1200} // Haute résolution
        height={1200} // Haute résolution
        className="border border-gray-200 rounded-lg cursor-crosshair w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl aspect-square touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
});

// Composant principal
const TShirtDesigner: React.FC = () => {
  const [design, setDesign] = useState<Design | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('white');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [textOverlay, setTextOverlay] = useState<TextOverlay>({
    title: '',
    subtitle: '',
    font: 'Arial',
    color: '#000000',
    titleSize: 32,
    subtitleSize: 24
  });

  const tshirtColors: TShirtColors = {
    white: '#FFFFFF',
    black: '#1F2937',
    green: '#059669',
    navy: '#1E40AF',
    red: '#DC2626',
    purple: '#7C3AED',
    beige: '#F5F5DC',
    brown: '#8B4513'
  };

  const handleDesignUpload = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 150;
      const aspectRatio = img.width / img.height;
      let width = maxSize;
      let height = maxSize;

      if (aspectRatio > 1) {
        height = maxSize / aspectRatio;
      } else {
        width = maxSize * aspectRatio;
      }

      const newDesign: Design = {
        image: img,
        x: 300 - width / 2,
        y: 250 - height / 2,
        width,
        height,
        rotation: 0,
        originalWidth: width,
        originalHeight: height,
      };
      
      setDesign(newDesign);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const handleDesignUpdate = useCallback((updatedDesign: Design) => {
    setDesign(updatedDesign);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleTextChange = useCallback((newTextOverlay: TextOverlay) => {
    setTextOverlay(newTextOverlay);
  }, []);

  const handleTextUpdate = useCallback((updatedTextOverlay: TextOverlay) => {
    setTextOverlay(updatedTextOverlay);
  }, []);

  const handleClearDesign = useCallback(() => {
    setDesign(null);
  }, []);

  const handleClearText = useCallback(() => {
    setTextOverlay({
      title: '',
      subtitle: '',
      font: 'Arial',
      color: '#000000',
      titleSize: 32,
      subtitleSize: 24
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!design) return;
    const scale = 1.2;
    const newWidth = Math.min(design.width * scale, 300);
    const newHeight = Math.min(design.height * scale, 300);

    setDesign({
      ...design,
      width: newWidth,
      height: newHeight,
    });
  }, [design]);

  const handleZoomOut = useCallback(() => {
    if (!design) return;
    const scale = 0.8;
    const newWidth = Math.max(design.width * scale, 30);
    const newHeight = Math.max(design.height * scale, 30);

    setDesign({
      ...design,
      width: newWidth,
      height: newHeight,
    });
  }, [design]);

  const handleOrderTShirt = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      
      // Créer un PDF avec jsPDF (chargé depuis CDN)
      const { jsPDF } = window.jspdf;
      
      // Capturer le canvas en haute qualité
      const imageData = canvas.toDataURL('image/png', 1.0);

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculer les dimensions pour centrer l'image
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // Marges de 10mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yPosition = (pdfHeight - imgHeight) / 2;

      // Ajouter l'image haute qualité au PDF
      pdf.addImage(imageData, 'PNG', 10, yPosition, imgWidth, imgHeight, '', 'FAST');

      // Métadonnées
      pdf.setProperties({
        title: 'Maquette T-Shirt Personnalisé',
        subject: 'Design de t-shirt haute qualité',
        creator: 'Créateur de T-Shirt',
        keywords: 'tshirt, design, personnalisation, haute-qualité'
      });

      // Générer le nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `tshirt-design-${timestamp}.pdf`;

      // Télécharger le PDF
      pdf.save(filename);

      alert(`🎉 Votre maquette PDF haute qualité "${filename}" a été téléchargée avec succès !`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('❌ Erreur lors de la génération du PDF. Vérifiez que jsPDF est chargé correctement.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const hasContent = design || textOverlay.title || textOverlay.subtitle;
  const hasText = textOverlay.title || textOverlay.subtitle;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header responsive */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Créateur de T-Shirt
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Créez votre design personnalisé</p>
        </div>

        {/* Layout responsive : colonne sur mobile, ligne sur desktop */}
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-160px)]">
          
          {/* Panel de contrôles - au-dessus sur mobile, à gauche sur desktop */}
          <div className="w-full lg:w-80 order-1 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:space-y-0 lg:overflow-y-auto lg:max-h-full">
              
              {/* Couleurs */}
              <div className="bg-white rounded-lg border p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Couleur
                </h3>
                <ColorSelector
                  colors={tshirtColors}
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                />
              </div>

              {/* Texte */}
              <div className="bg-white rounded-lg border p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Texte
                </h3>
                <TextControls
                  textOverlay={textOverlay}
                  onTextChange={handleTextChange}
                  onClearText={handleClearText}
                  hasText={hasText}
                />
              </div>

              {/* Upload */}
              <div className="bg-white rounded-lg border p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Design
                </h3>
                <FileUpload
                  onFileUpload={handleDesignUpload}
                  hasDesign={!!design}
                  onClearDesign={handleClearDesign}
                />
              </div>

              {/* Contrôles design */}
              {design && (
                <div className="bg-white rounded-lg border p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    Ajuster
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleZoomOut}
                      className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-2 px-3 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 py-2 px-3 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Cliquez + glissez sur le t-shirt • Shift + glisser = rotation
                  </p>
                </div>
              )}

              {/* Bouton commander */}
              {hasContent && (
                <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-3 sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={handleOrderTShirt}
                    disabled={isProcessing}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Télécharger PDF
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Canvas - en-dessous sur mobile, à droite sur desktop */}
          <div className="flex-1 order-2 lg:order-2 bg-white rounded-lg sm:rounded-2xl shadow-lg border overflow-hidden">
            <DesignCanvas
              ref={canvasRef}
              design={design}
              tshirtColor={selectedColor}
              tshirtColors={tshirtColors}
              onDesignUpdate={handleDesignUpdate}
              textOverlay={textOverlay}
              onTextUpdate={handleTextUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TShirtDesigner;
