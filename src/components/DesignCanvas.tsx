import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { Design, TShirtColors, TextOverlay } from '../types';

interface DesignCanvasProps {
  design: Design | null;
  tshirtColor: keyof TShirtColors;
  tshirtColors: TShirtColors;
  onDesignUpdate: (design: Design) => void;
  textOverlay: TextOverlay;
  onTextUpdate: (textOverlay: TextOverlay) => void;
}

// ZONE D'EXTENSION: Modifiez ici la logique de placement du texte
const drawTextOverlay = (ctx: CanvasRenderingContext2D, text: TextOverlay, designZone: any) => {
  if (!text.title && !text.subtitle) return;

  ctx.save();
  ctx.fillStyle = text.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position du texte (maintenant déplaçable)
  const textX = text.x || (designZone.x + designZone.width / 2);
  const textY = text.y || (designZone.y + designZone.height / 2);

  let currentY = textY;

  // Ajustement de position si titre et sous-titre
  if (text.title && text.subtitle) {
    currentY -= 20; // Décaler vers le haut pour faire de la place
  }

  // Dessiner le titre
  if (text.title) {
    ctx.font = `bold ${text.titleSize}px ${text.font}`;
    
    // Effet d'ombre pour meilleure lisibilité
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(text.title, textX, currentY);
    currentY += text.titleSize + 20; // Espacement entre titre et sous-titre
  }

  // Dessiner le sous-titre
  if (text.subtitle) {
    ctx.font = `italic ${text.subtitleSize}px ${text.font}`;
    ctx.fillText(text.subtitle, textX, currentY);
  }

  ctx.restore();
};

// ZONE D'EXTENSION: Fonction pour dessiner la zone de sélection du texte
const drawTextSelection = (ctx: CanvasRenderingContext2D, text: TextOverlay, designZone: any) => {
  if (!text.title && !text.subtitle) return;

  const textX = text.x || (designZone.x + designZone.width / 2);
  const textY = text.y || (designZone.y + designZone.height / 2);

  // Calculer les dimensions approximatives du texte
  ctx.save();
  ctx.font = `bold ${text.titleSize}px ${text.font}`;
  const titleWidth = text.title ? ctx.measureText(text.title).width : 0;
  
  ctx.font = `italic ${text.subtitleSize}px ${text.font}`;
  const subtitleWidth = text.subtitle ? ctx.measureText(text.subtitle).width : 0;
  
  const maxWidth = Math.max(titleWidth, subtitleWidth);
  const totalHeight = (text.title ? text.titleSize : 0) + (text.subtitle ? text.subtitleSize + 20 : 0);

  // Dessiner la zone de sélection
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(
    textX - maxWidth / 2 - 10,
    textY - totalHeight / 2 - 10,
    maxWidth + 20,
    totalHeight + 20
  );
  ctx.setLineDash([]);

  // Points de contrôle
  const corners = [
    { x: textX - maxWidth / 2 - 10, y: textY - totalHeight / 2 - 10 },
    { x: textX + maxWidth / 2 + 10, y: textY - totalHeight / 2 - 10 },
    { x: textX + maxWidth / 2 + 10, y: textY + totalHeight / 2 + 10 },
    { x: textX - maxWidth / 2 - 10, y: textY + totalHeight / 2 + 10 }
  ];

  ctx.fillStyle = '#10B981';
  corners.forEach(corner => {
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, 6, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.restore();
};

const DesignCanvas = forwardRef<HTMLCanvasElement, DesignCanvasProps>(({
  design,
  tshirtColor,
  tshirtColors,
  onDesignUpdate,
  textOverlay,
  onTextUpdate
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isTextDragging, setIsTextDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designStart, setDesignStart] = useState({ x: 0, y: 0, rotation: 0 });
  const [textStart, setTextStart] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<'design' | 'text' | null>(null);

  // Canvas dimensions - optimisées pour l'export PDF
  const canvasWidth = 1024;
  const canvasHeight = 1024;

  // ZONE D'EXTENSION: Modifiez ici la zone de design
  const designZone = {
    x: 212,
    y: 212,
    width: 600,
    height: 600
  };

  const drawTShirtBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const backgroundImage = new Image();
    backgroundImage.onload = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

      // Redraw design and text after background is drawn
      if (design) {
        drawDesign(ctx, design);
      }

      drawTextOverlay(ctx, textOverlay, designZone);

      if (!design && !textOverlay.title && !textOverlay.subtitle) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(designZone.x, designZone.y, designZone.width, designZone.height);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Zone de personnalisation', designZone.x + designZone.width / 2, designZone.y + designZone.height / 2);
      }

      if (selectedElement === 'text' && (textOverlay.title || textOverlay.subtitle)) {
        drawTextSelection(ctx, textOverlay, designZone);
      }
    };

    backgroundImage.src = `/tshirts/${tshirtColor}.png`;
  }, [tshirtColor, design, textOverlay, selectedElement]);

  const drawDesign = useCallback((ctx: CanvasRenderingContext2D, designToDraw: Design) => {
    if (!designToDraw.image) return;

    ctx.save();
    const centerX = designToDraw.x + designToDraw.width / 2;
    const centerY = designToDraw.y + designToDraw.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate(designToDraw.rotation);
    
    // Effet de mélange pour intégration naturelle sur le tissu
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over'; // le mode normal
    
    // Ombre portée
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.drawImage(
      designToDraw.image,
      -designToDraw.width / 2,
      -designToDraw.height / 2,
      designToDraw.width,
      designToDraw.height
    );

    ctx.restore();

    // Bordure de sélection (uniquement si sélectionné)
    if (selectedElement === 'design') {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(designToDraw.rotation);
      ctx.strokeRect(
        -designToDraw.width / 2 - 8,
        -designToDraw.height / 2 - 8,
        designToDraw.width + 16,
        designToDraw.height + 16
      );
      ctx.restore();
      ctx.setLineDash([]);

      // Points de contrôle
      const corners = [
        { x: centerX - designToDraw.width / 2, y: centerY - designToDraw.height / 2 },
        { x: centerX + designToDraw.width / 2, y: centerY - designToDraw.height / 2 },
        { x: centerX + designToDraw.width / 2, y: centerY + designToDraw.height / 2 },
        { x: centerX - designToDraw.width / 2, y: centerY + designToDraw.height / 2 }
      ];

      ctx.fillStyle = '#3B82F6';
      corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [selectedElement]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawTShirtBackground(ctx);
  }, [drawTShirtBackground]);

  // Gestion des interactions souris/tactile
  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const isPointInDesign = useCallback((x: number, y: number, d: Design) => {
    const cx = d.x + d.width / 2;
    const cy = d.y + d.height / 2;
    const cos = Math.cos(-d.rotation);
    const sin = Math.sin(-d.rotation);
    const dx = x - cx;
    const dy = y - cy;
    const lx = dx * cos - dy * sin + cx;
    const ly = dx * sin + dy * cos + cy;
    return lx >= d.x && lx <= d.x + d.width && ly >= d.y && ly <= d.y + d.height;
  }, []);

  // ZONE D'EXTENSION: Fonction pour détecter si on clique sur le texte
  const isPointInText = useCallback((x: number, y: number, text: TextOverlay) => {
    if (!text.title && !text.subtitle) return false;
    
    const textX = text.x || (designZone.x + designZone.width / 2);
    const textY = text.y || (designZone.y + designZone.height / 2);
    
    // Zone approximative du texte (on peut l'améliorer)
    const textWidth = Math.max(
      text.title ? text.title.length * text.titleSize * 0.6 : 0,
      text.subtitle ? text.subtitle.length * text.subtitleSize * 0.6 : 0
    );
    const textHeight = (text.title ? text.titleSize : 0) + (text.subtitle ? text.subtitleSize + 20 : 0);
    
    return x >= textX - textWidth / 2 - 10 &&
           x <= textX + textWidth / 2 + 10 &&
           y >= textY - textHeight / 2 - 10 &&
           y <= textY + textHeight / 2 + 10;
  }, []);

  const constrainToDesignZone = useCallback((x: number, y: number, width?: number, height?: number) => {
    if (width && height) {
      return {
        x: Math.max(designZone.x, Math.min(designZone.x + designZone.width - width, x)),
        y: Math.max(designZone.y, Math.min(designZone.y + designZone.height - height, y)),
      };
    } else {
      return {
        x: Math.max(designZone.x, Math.min(designZone.x + designZone.width, x)),
        y: Math.max(designZone.y, Math.min(designZone.y + designZone.height, y)),
      };
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    
    // Vérifier d'abord le texte
    if (textOverlay.title || textOverlay.subtitle) {
      if (isPointInText(pos.x, pos.y, textOverlay)) {
        setSelectedElement('text');
        setIsTextDragging(true);
        setDragStart(pos);
        setTextStart({
          x: textOverlay.x || (designZone.x + designZone.width / 2),
          y: textOverlay.y || (designZone.y + designZone.height / 2)
        });
        e.preventDefault();
        return;
      }
    }
    
    // Ensuite vérifier le design
    if (design && isPointInDesign(pos.x, pos.y, design)) {
      setSelectedElement('design');
      const shift = 'shiftKey' in e && e.shiftKey;
      shift ? setIsRotating(true) : setIsDragging(true);
      setDragStart(pos);
      setDesignStart({ x: design.x, y: design.y, rotation: design.rotation });
      e.preventDefault();
      return;
    }
    
    // Sinon, désélectionner
    setSelectedElement(null);
  }, [design, textOverlay, getMousePos, isPointInDesign, isPointInText]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (isTextDragging && (textOverlay.title || textOverlay.subtitle)) {
      const newX = textStart.x + dx;
      const newY = textStart.y + dy;
      const constrained = constrainToDesignZone(newX, newY);
      onTextUpdate({ ...textOverlay, x: constrained.x, y: constrained.y });
    } else if (design && isRotating) {
      const cx = design.x + design.width / 2;
      const cy = design.y + design.height / 2;
      const angle = Math.atan2(pos.y - cy, pos.x - cx);
      const start = Math.atan2(dragStart.y - cy, dragStart.x - cx);
      const rotation = designStart.rotation + (angle - start);
      onDesignUpdate({ ...design, rotation });
    } else if (design && isDragging) {
      const newX = designStart.x + dx;
      const newY = designStart.y + dy;
      const constrained = constrainToDesignZone(newX, newY, design.width, design.height);
      onDesignUpdate({ ...design, x: constrained.x, y: constrained.y });
    }
  }, [design, textOverlay, isDragging, isRotating, isTextDragging, dragStart, designStart, textStart, getMousePos, onDesignUpdate, onTextUpdate, constrainToDesignZone]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsRotating(false);
    setIsTextDragging(false);
  }, []);

  // Effects
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mm = (e: MouseEvent) => handleMouseMove(e as any);
    const mu = () => handleMouseUp();

    if (isDragging || isRotating || isTextDragging) {
      document.addEventListener('mousemove', mm);
      document.addEventListener('mouseup', mu);
      document.addEventListener('touchmove', mm as any);
      document.addEventListener('touchend', mu);
    }

    return () => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup', mu);
      document.removeEventListener('touchmove', mm as any);
      document.removeEventListener('touchend', mu);
    };
  }, [isDragging, isRotating, isTextDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative w-full flex justify-center p-6">
      <div className="relative">
        <canvas
          ref={(node) => {
            canvasRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          width={canvasWidth}
          height={canvasHeight}
          className={`
            max-w-full h-auto border-2 border-gray-200 rounded-2xl shadow-xl bg-white
            ${selectedElement === 'design' && (isDragging || isRotating) ? 'cursor-grabbing' : ''}
            ${selectedElement === 'design' && !isDragging && !isRotating ? 'cursor-grab' : ''}
            ${selectedElement === 'text' && isTextDragging ? 'cursor-grabbing' : ''}
            ${selectedElement === 'text' && !isTextDragging ? 'cursor-grab' : ''}
          `}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ touchAction: 'none' }}
        />
        
        {/* Instructions flottantes */}
        {(selectedElement || design || textOverlay.title || textOverlay.subtitle) && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200">
            <p className="text-sm text-gray-700 text-center font-medium">
              {isTextDragging ? '📝 Déplacement du texte...' :
               isRotating ? '🔄 Rotation en cours...' :
               isDragging ? '👆 Déplacement...' :
               selectedElement === 'text' ? '📝 Texte sélectionné • Glisser pour déplacer' :
               selectedElement === 'design' ? '🎨 Design sélectionné • Glisser • ⇧ Shift + glisser pour pivoter' :
               '👆 Cliquez sur un élément pour le sélectionner et le déplacer'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';

export default DesignCanvas;
