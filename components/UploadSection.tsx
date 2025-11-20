import React, { useState } from 'react';
import { FileUp, FileText, Coins, AlertCircle } from 'lucide-react';

interface UploadSectionProps {
  onAnalyze: (text: string, images: { mimeType: string; data: string }[]) => void;
  isProcessing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onAnalyze, isProcessing }) => {
  const [rawText, setRawText] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [images, setImages] = useState<{ mimeType: string; data: string; name: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setImages(prev => [...prev, {
                mimeType: file.type,
                data: base64String,
                name: file.name
            }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = () => {
    const combinedText = `
      Raw CSV/Text Data: ${rawText}
      Crypto Wallet to Audit: ${cryptoAddress}
    `;
    onAnalyze(combinedText, images.map(({ mimeType, data }) => ({ mimeType, data })));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileUp className="w-6 h-6 text-blue-600" />
          Evidence Ingestion
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bank Statements / Images */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Bank Statements (PDF/Images)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
              <input 
                type="file" 
                multiple 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Drag & drop or click to upload statements</p>
            </div>
            {images.length > 0 && (
                <div className="space-y-2">
                    {images.map((img, idx) => (
                        <div key={idx} className="text-xs bg-slate-100 p-2 rounded flex justify-between">
                            <span className="truncate">{img.name}</span>
                            <span className="text-green-600 font-medium">Ready</span>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Spreadsheet / Text Data */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Spreadsheet Data (CSV Paste)</label>
            <textarea
              className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              placeholder="Paste CSV content or raw transaction lists here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
        </div>

        {/* Crypto */}
        <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-amber-500" />
                <label className="text-sm font-medium text-slate-700">Cryptocurrency Audit</label>
            </div>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter Wallet Address (ETH, BTC, SOL)..."
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                AI will analyze transaction volume and counter-parties for hidden assets.
            </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all ${
              isProcessing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isProcessing ? 'Analyzing Evidence...' : 'Start Forensic Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;