'use client';

import { Crown, Download, Check } from 'lucide-react';
import { useSubscription } from '@/lib/subscription/useSubscription';
import { useRef, useState } from 'react';
import { toPng, toSvg } from 'html-to-image';

export default function LogoPage() {
  const { isPro } = useSubscription();
  const logoRef = useRef<HTMLDivElement>(null);
  const [isTransparent, setIsTransparent] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format: 'png' | 'svg') => {
    if (!logoRef.current) return;
    setDownloading(true);

    try {
      const options = {
        quality: 1.0,
        pixelRatio: 4, // High quality 4x scale
        backgroundColor: isTransparent ? undefined : (document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff'),
      };

      let dataUrl;
      if (format === 'png') {
        dataUrl = await toPng(logoRef.current, options);
      } else {
        dataUrl = await toSvg(logoRef.current, options);
      }

      const link = document.createElement('a');
      link.download = `lexora-logo.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download logo', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-16">
      {/* Controls Container */}
      <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Logo Controls</h2>

        {/* Transparency Toggle */}
        <div
          onClick={() => setIsTransparent(!isTransparent)}
          className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
        >
          <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isTransparent
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-400 dark:border-gray-500'
            }`}>
            {isTransparent && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Transparent Background</span>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => handleDownload('png')}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Download className="w-5 h-5" />
            <span>PNG</span>
          </button>

          <button
            onClick={() => handleDownload('svg')}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Download className="w-5 h-5" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Logo Display Area */}
      <div className={`p-20 rounded-3xl transition-colors duration-300 ${!isTransparent ? 'bg-white dark:bg-gray-800 shadow-2xl' : ''
        }`}>
        <div ref={logoRef} className="p-16 flex items-center justify-center"> {/* Padding added to capture area so it's not cropped tightly */}
          <div className="flex items-center gap-8 text-[12rem] leading-none">
            {/* Added text-[12rem] base without scale to ensure it is very large naturally */}
            <h1 className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent pb-4">
              Lexora
            </h1>
            {isPro && (
              <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg self-center mt-2">
                <Crown className="w-12 h-12 text-white" />
                <span className="text-3xl font-bold text-white uppercase tracking-wide">
                  Pro
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
