import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hello. I am your Forensic AI Assistant. Ask me about specific transactions, Family Code Section 4320 applications, or clarification on the financial analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
        // Map messages to history format expected by Gemini
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        
        const responseText = await generateChatResponse(history, userMsg);
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "I encountered an error analyzing your request. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden m-6">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-slate-800">Forensic Assistant</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-800 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about 'hidden transfers' or 'lifestyle costs'..."
                className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;