import React, { useState, useEffect, useRef } from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SessionSidebar from './components/SessionSidebar';
import { mockSessions, generateMockResponse } from './components/mock';
import { Bot, Menu, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

const ChatInterface = () => {
  const [sessions, setSessions] = useState(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState(mockSessions[0]?.id || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSendMessage = async (content, type) => {
    if (!activeSessionId) {
      handleNewSession();
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Add user message
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ));

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      let assistantMessage;
      
      if (type === 'image') {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          contentType: 'image',
          content: generateMockResponse(content, 'image'),
          prompt: content,
          timestamp: new Date().toISOString()
        };
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateMockResponse(content, 'text') + ' ' + content,
          timestamp: new Date().toISOString()
        };
      }

      setSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, messages: [...session.messages, assistantMessage] }
          : session
      ));

      setIsLoading(false);
      
      toast({
        title: type === 'image' ? "Gambar berhasil dibuat" : "Pesan terkirim",
        description: type === 'image' ? "AI telah membuat gambar sesuai permintaan Anda" : "AI telah merespons pesan Anda",
      });
    }, 2000);
  };

  const handleNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'Percakapan Baru',
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
    
    toast({
      title: "Percakapan baru dimulai",
      description: "Anda dapat mulai mengobrol dengan AI assistant",
    });
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (sessionId) => {
    if (sessions.length === 1) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Setidaknya satu percakapan harus tersisa",
        variant: "destructive"
      });
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions[0]?.id || null);
    }
    
    toast({
      title: "Percakapan dihapus",
      description: "Percakapan telah berhasil dihapus",
    });
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Unduhan dimulai",
      description: `File ${filename} sedang diunduh`,
    });
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 w-80 h-full z-50 transition-transform duration-300 ease-in-out`}>
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Card className="p-4 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full">
                  <Bot className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">AI Chatbot</h1>
                  <p className="text-sm text-slate-500">
                    {activeSession?.title || 'Pilih percakapan untuk memulai'}
                  </p>
                </div>
              </div>
            </div>
            
            {isSidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </Card>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {activeSession?.messages.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              {activeSession.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onDownload={handleDownload}
                />
              ))}
              {isLoading && (
                <div className="flex gap-4 p-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-slate-700 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <span className="font-medium">AI Assistant</span>
                      <span>sedang mengetik...</span>
                    </div>
                    <Card className="p-4 max-w-3xl bg-white border-slate-200">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-slate-700" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Selamat datang di AI Chatbot
                </h2>
                <p className="text-slate-600 mb-6">
                  Mulai percakapan dengan mengetik pesan atau meminta AI untuk membuat gambar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;