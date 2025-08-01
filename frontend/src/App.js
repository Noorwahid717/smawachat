import React, { useState, useEffect, useRef } from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SessionSidebar from './components/SessionSidebar';
import { chatAPI } from './services/api';
import { Bot, Menu, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

const ChatInterface = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const sessionsData = await chatAPI.getSessions();
      setSessions(sessionsData);
      
      // Set first session as active if none selected
      if (sessionsData.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsData[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Gagal memuat percakapan",
        description: "Terjadi kesalahan saat memuat daftar percakapan",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const messagesData = await chatAPI.getMessages(sessionId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Gagal memuat pesan",
        description: "Terjadi kesalahan saat memuat pesan percakapan",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (content, type) => {
    if (!activeSessionId) {
      await handleNewSession();
      return;
    }

    setIsLoading(true);
    
    try {
      // Send message and get AI response
      const aiResponse = await chatAPI.sendMessage(activeSessionId, content, type);
      
      // Reload messages to get the latest conversation
      await loadMessages(activeSessionId);
      
      // Reload sessions to update timestamps and titles
      await loadSessions();
      
      toast({
        title: type === 'image' ? "Gambar berhasil dibuat" : "Pesan terkirim",
        description: type === 'image' ? "AI telah membuat gambar sesuai permintaan Anda" : "AI telah merespons pesan Anda",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Gagal mengirim pesan",
        description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await chatAPI.createSession();
      
      // Reload sessions and set new session as active
      await loadSessions();
      setActiveSessionId(newSession.id);
      setMessages([]);
      setIsSidebarOpen(false);
      
      toast({
        title: "Percakapan baru dimulai",
        description: "Anda dapat mulai mengobrol dengan AI assistant",
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Gagal membuat percakapan",
        description: "Terjadi kesalahan saat membuat percakapan baru",
        variant: "destructive"
      });
    }
  };

  const handleSelectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId) => {
    if (sessions.length === 1) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Setidaknya satu percakapan harus tersisa",
        variant: "destructive"
      });
      return;
    }

    try {
      await chatAPI.deleteSession(sessionId);
      
      // Reload sessions
      await loadSessions();
      
      // If deleted session was active, select first remaining session
      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setActiveSessionId(remainingSessions[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      
      toast({
        title: "Percakapan dihapus",
        description: "Percakapan telah berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus percakapan",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (message, isError = false) => {
    toast({
      title: isError ? "Gagal mengunduh" : "Unduhan berhasil",
      description: message,
      variant: isError ? "destructive" : "default"
    });
  };

  if (isLoadingSessions) {
    return (
      <div className="flex h-screen bg-slate-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-slate-700 animate-pulse" />
          </div>
          <p className="text-slate-600">Memuat percakapan...</p>
        </div>
      </div>
    );
  }

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
          {messages.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
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
                      <span>sedang memproses...</span>
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