import React, { useState } from 'react';
import { LayoutDashboard, Upload, MessageSquare, Radio, Scale } from 'lucide-react';
import { Tab, AnalysisReport, AnalysisStatus } from './types';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import ChatAssistant from './components/ChatAssistant';
import LiveConsultant from './components/LiveConsultant';
import { analyzeFinancialDocuments } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.UPLOAD);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);

  const handleAnalyze = async (text: string, images: { mimeType: string; data: string }[]) => {
    setStatus(AnalysisStatus.PROCESSING);
    try {
        const result = await analyzeFinancialDocuments(text, images);
        setReport(result);
        setStatus(AnalysisStatus.COMPLETE);
        setActiveTab(Tab.DASHBOARD);
    } catch (error) {
        console.error(error);
        setStatus(AnalysisStatus.ERROR);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.UPLOAD:
        return <UploadSection onAnalyze={handleAnalyze} isProcessing={status === AnalysisStatus.PROCESSING} />;
      case Tab.DASHBOARD:
        return report ? <Dashboard report={report} /> : <div className="text-center mt-20 text-slate-400">No analysis generated yet.</div>;
      case Tab.CHAT:
        return <ChatAssistant />;
      case Tab.LIVE:
        return <LiveConsultant />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none">Equitable</h1>
                <p className="text-xs text-slate-500">Divorce Financial Intelligence</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            {[
              { id: Tab.UPLOAD, label: 'Case Files', icon: Upload },
              { id: Tab.DASHBOARD, label: 'Analysis', icon: LayoutDashboard, disabled: !report },
              { id: Tab.CHAT, label: 'Assistant', icon: MessageSquare },
              { id: Tab.LIVE, label: 'Live Consult', icon: Radio },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`
                  flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeTab === item.id 
                    ? 'bg-slate-100 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {renderContent()}
      </main>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
         {[
            { id: Tab.UPLOAD, icon: Upload },
            { id: Tab.DASHBOARD, icon: LayoutDashboard, disabled: !report },
            { id: Tab.CHAT, icon: MessageSquare },
            { id: Tab.LIVE, icon: Radio },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && setActiveTab(item.id)}
              disabled={item.disabled}
              className={`p-3 rounded-full ${activeTab === item.id ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
      </div>
    </div>
  );
};

export default App;