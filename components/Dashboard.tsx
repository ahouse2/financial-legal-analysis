import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { FileText, PlayCircle, Volume2, Image as ImageIcon, Download } from 'lucide-react';
import { AnalysisReport } from '../types';
import { generateVisualMetaphor, generateSpeech } from '../services/geminiService';

interface DashboardProps {
  report: AnalysisReport;
}

const COLORS = ['#0f172a', '#3b82f6', '#ef4444', '#10b981'];

const Dashboard: React.FC<DashboardProps> = ({ report }) => {
  const [metaphorImage, setMetaphorImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleGenerateImage = async () => {
    if (!report.lifestyleMetaphorPrompt) return;
    setIsGeneratingImage(true);
    const img = await generateVisualMetaphor(report.lifestyleMetaphorPrompt);
    setMetaphorImage(img);
    setIsGeneratingImage(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
        const buffer = await generateSpeech(report.summary);
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(buffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
        source.onended = () => setIsSpeaking(false);
    } catch (e) {
        console.error("TTS Error", e);
        setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 uppercase">Discrepancy Found</h3>
            <div className="mt-2 text-3xl font-bold text-red-600">
                ${report.chartData.reduce((acc, curr) => acc + Math.abs(curr.discrepancy), 0).toLocaleString()}
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 uppercase">Categories Analyzed</h3>
            <div className="mt-2 text-3xl font-bold text-slate-800">
                {report.chartData.length}
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 uppercase">Legal Citations</h3>
            <div className="mt-2 text-3xl font-bold text-blue-600">
                {report.californiaCodeReferences.length}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Spending Discrepancy by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar dataKey="partyAAmount" name="Party A" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="partyBAmount" name="Party B" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Executive Summary</h3>
                <button onClick={handleSpeak} disabled={isSpeaking} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                    <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>
            </div>
            <div className="prose prose-sm text-slate-600 overflow-y-auto flex-grow max-h-80 mb-4">
                <p>{report.summary}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">CA Family Code Alignment</h4>
                <ul className="list-disc pl-4 text-xs text-amber-700 space-y-1">
                    {report.californiaCodeReferences.map((ref, i) => (
                        <li key={i}>{ref}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

      {/* Visual Analysis & Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detailed Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Transaction Analysis</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Party A</th>
                            <th className="px-6 py-3 text-right">Party B</th>
                            <th className="px-6 py-3 text-right">Delta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {report.chartData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-900">{row.category}</td>
                                <td className="px-6 py-3 text-right">${row.partyAAmount.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right">${row.partyBAmount.toLocaleString()}</td>
                                <td className={`px-6 py-3 text-right font-bold ${row.discrepancy > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {row.discrepancy > 0 ? '+' : ''}{row.discrepancy.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Lifestyle Visualization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Lifestyle Gap Visualization</h3>
                <button 
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !!metaphorImage}
                    className="flex items-center gap-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors"
                >
                    <ImageIcon className="w-3 h-3" />
                    {isGeneratingImage ? 'Dreaming...' : 'Generate Visual'}
                </button>
            </div>
            <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                {metaphorImage ? (
                    <img src={metaphorImage} alt="Lifestyle visualization" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm mx-auto mb-3 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500">
                            AI can generate a visual metaphor describing the lifestyle disparity based on the data.
                        </p>
                    </div>
                )}
            </div>
            <p className="mt-4 text-sm text-slate-600 italic">
                "{report.lifestyleMetaphorPrompt}"
            </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;