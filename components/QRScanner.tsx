import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ScanLine } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScanSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Success callback
            // Avoid stopping repeatedly
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop()
                .then(() => {
                    if (isMountedRef.current) {
                         onScanSuccess(decodedText);
                    }
                })
                .catch(err => console.error("Error stopping on success", err));
            }
          },
          (errorMessage) => {
            // Error callback (called frequently when no code is found, ignore usually)
          }
        );
      } catch (err) {
        if (isMountedRef.current) {
            setError("Could not access camera. Please ensure permissions are granted.");
            console.error(err);
        }
      }
    };

    startScanner();

    // Cleanup function: The bane of my existence.
    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
              scannerRef.current.stop()
                  .then(() => {
                      scannerRef.current?.clear();
                  })
                  .catch(err => {
                      console.error("Failed to stop scanner on unmount", err);
                      // Force clear if stop fails, though it might throw.
                      try { scannerRef.current?.clear(); } catch(e) {}
                  });
          } else {
              // Not scanning, just clear
              try { scannerRef.current.clear(); } catch(e) {}
          }
      }
    };
  }, [onScanSuccess]);

  const handleClose = async () => {
      // Manually stop before unmounting to prevent the "blank screen of death"
      if (scannerRef.current && scannerRef.current.isScanning) {
          try {
              await scannerRef.current.stop();
              scannerRef.current.clear();
          } catch (e) {
              console.error("Manual stop failed", e);
          }
      }
      onClose();
  };

  return (
    <div className="absolute inset-0 z-[80] bg-black flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 z-10">
             <button 
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
            >
                <X size={20} className="text-white" />
            </button>
            <span className="font-bold text-white text-lg">Scan PayMe ID</span>
            <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Scanner Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            <div id="reader" className="w-full h-full max-w-md object-cover absolute inset-0"></div>
            
            {/* Overlay UI */}
            {!error && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                        {/* Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF5722] rounded-tl-xl -mt-[2px] -ml-[2px]"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF5722] rounded-tr-xl -mt-[2px] -mr-[2px]"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF5722] rounded-bl-xl -mb-[2px] -ml-[2px]"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF5722] rounded-br-xl -mb-[2px] -mr-[2px]"></div>
                        
                        {/* Scanning Line Animation */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#FF5722]/50 shadow-[0_0_20px_#FF5722] animate-scan-line"></div>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <Camera size={32} className="text-red-500" />
                    </div>
                    <p className="text-white font-medium">{error}</p>
                    <button onClick={handleClose} className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold">
                        Close
                    </button>
                </div>
            )}
        </div>

        {/* Footer Hint */}
        <div className="p-8 pb-12 bg-black z-10 text-center">
            <p className="text-white/50 text-sm">
                Point your camera at a PayMe QR code to instantly fill details.
            </p>
        </div>

        <style>{`
            @keyframes scan-line {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .animate-scan-line {
                animation: scan-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            #reader video {
                object-fit: cover;
                width: 100% !important;
                height: 100% !important;
            }
        `}</style>
    </div>
  );
};

export default QRScanner;