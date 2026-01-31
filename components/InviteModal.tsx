import React, { useEffect, useRef, useState } from 'react';
import { Championship } from '../types';
import { Button } from './Button';

interface InviteModalProps {
  championship: Championship;
  onClose: () => void;
}

const Icon = ({ name }: { name: string }) => (
  <span className="material-symbols-outlined">{name}</span>
);

export const InviteModal: React.FC<InviteModalProps> = ({ championship, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    generateImage();
  }, [championship]);

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Setup Canvas
    const width = 1080;
    const height = 1080; // Instagram square format
    canvas.width = width;
    canvas.height = height;

    // 2. Background (Dark Gradient)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#101922');
    bgGradient.addColorStop(1, '#0b1219');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 3. Decoration (Neon Glows)
    // Blue glow top-left
    const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 600);
    grad1.addColorStop(0, 'rgba(19, 127, 236, 0.2)');
    grad1.addColorStop(1, 'rgba(19, 127, 236, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    // Green glow bottom-right
    const grad2 = ctx.createRadialGradient(width, height, 0, width, height, 600);
    grad2.addColorStop(0, 'rgba(57, 255, 20, 0.1)');
    grad2.addColorStop(1, 'rgba(57, 255, 20, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, width, height);

    // 4. Content Drawing
    ctx.textAlign = 'center';

    // "TIPPBAJNOK" Label
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#137fec';
    ctx.fillText('TIPPBAJNOK', width / 2, 100);

    // "MEGHÍVÓ" Label
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#92adc9';
    ctx.letterSpacing = '10px';
    ctx.fillText('MEGHÍVÓ', width / 2, 160);

    // Championship Name
    ctx.font = '900 80px sans-serif';
    ctx.fillStyle = '#ffffff';
    // Text wrapping logic simplified
    const words = championship.name.split(' ');
    let line = '';
    let y = 400;
    // Simple wrap logic could be added here, but for now assuming it fits or we scale
    ctx.fillText(championship.name, width / 2, y);

    // "CSATLAKOZÁSI KÓD" Label
    y += 150;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#92adc9';
    ctx.fillText('CSATLAKOZÁSI KÓD:', width / 2, y);

    // The Code Box
    y += 40;
    const code = championship.joinCode;
    ctx.font = '900 120px monospace';
    
    // Draw box behind code
    const codeWidth = ctx.measureText(code).width + 100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#137fec';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect((width - codeWidth) / 2, y - 100, codeWidth, 140, 20);
    ctx.fill();
    ctx.stroke();

    // Draw Code Text
    ctx.fillStyle = '#39ff14'; // Neon Green
    ctx.fillText(code, width / 2, y + 10);

    // Footer
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#556980';
    ctx.fillText('tippbajnok.vercel.app', width / 2, height - 50);

    // 5. Save
    setImageUrl(canvas.toDataURL('image/png'));
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `tippbajnok-meghivo-${championship.joinCode}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleShare = async () => {
    if (imageUrl && navigator.share) {
        try {
            // Convert DataURL to Blob
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const file = new File([blob], 'invite.png', { type: 'image/png' });
            
            await navigator.share({
                title: `Gyere játszani: ${championship.name}`,
                text: `Csatlakozz a ${championship.name} bajnoksághoz a Tippbajnokon! Kód: ${championship.joinCode}`,
                files: [file]
            });
        } catch (err) {
            console.error(err);
        }
    } else {
        // Fallback: Copy text
        const text = `Gyertek játszani a ${championship.name} tippversenybe! \nKód: ${championship.joinCode}\nLink: https://tippbajnok.vercel.app`;
        navigator.clipboard.writeText(text);
        alert('A meghívó szövege a vágólapra másolva!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a2632] w-full max-w-lg rounded-2xl p-6 border border-[#233648] relative shadow-2xl flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#92adc9] hover:text-white transition-colors">
            <Icon name="close" />
        </button>

        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Icon name="qr_code_2" /> Meghívó Készítése
        </h3>

        {/* Canvas is hidden, used for generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Preview Image */}
        {imageUrl ? (
            <img 
                src={imageUrl} 
                alt="Meghívó kártya" 
                className="w-full rounded-xl shadow-lg shadow-black/50 border border-[#233648] mb-6"
            />
        ) : (
            <div className="w-full aspect-square bg-[#101922] rounded-xl flex items-center justify-center text-[#92adc9] mb-6 animate-pulse">
                Generálás...
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full">
            <Button onClick={handleDownload} variant="secondary" fullWidth>
                <div className="flex items-center justify-center gap-2">
                    <Icon name="download" /> Letöltés
                </div>
            </Button>
            <Button onClick={handleShare} fullWidth>
                <div className="flex items-center justify-center gap-2">
                    <Icon name="share" /> Megosztás
                </div>
            </Button>
        </div>
        <p className="text-xs text-[#92adc9] mt-4 text-center">
            A megosztás gomb mobilon megnyitja az alkalmazásválasztót, asztali gépen pedig a vágólapra másolja a szöveget.
        </p>
      </div>
    </div>
  );
};
