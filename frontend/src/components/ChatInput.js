import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Send, Image, MessageSquare, Loader2 } from 'lucide-react';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [textMessage, setTextMessage] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === 'text' && textMessage.trim()) {
      onSendMessage(textMessage.trim(), 'text');
      setTextMessage('');
    } else if (activeTab === 'image' && imagePrompt.trim()) {
      onSendMessage(imagePrompt.trim(), 'image');
      setImagePrompt('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="p-4 bg-white border-slate-200 shadow-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Teks
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Gambar
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <TabsContent value="text" className="mt-0">
            <Textarea
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pertanyaan atau pesan Anda..."
              className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400 transition-colors"
              disabled={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <Textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deskripsikan gambar yang ingin Anda buat..."
              className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400 transition-colors"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Contoh: "Pemandangan gunung dengan matahari terbenam, gaya realistis"
            </p>
          </TabsContent>
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              {activeTab === 'text' ? 'Tekan Enter untuk kirim, Shift+Enter untuk baris baru' : 'Gambar akan dibuat menggunakan AI'}
            </p>
            
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                (activeTab === 'text' && !textMessage.trim()) || 
                (activeTab === 'image' && !imagePrompt.trim())
              }
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </Card>
  );
};

export default ChatInput;