import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Download, User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { chatAPI } from '../services/api';

const ChatMessage = ({ message, onDownload }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isImage = message.content_type === 'image';

  const handleCopy = async () => {
    if (isImage) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      if (isImage) {
        await chatAPI.downloadMessage(message.id, `image-${message.id}.png`);
      } else {
        await chatAPI.downloadMessage(message.id, `message-${message.id}.txt`);
      }
      onDownload(`File ${isImage ? 'gambar' : 'teks'} berhasil diunduh`);
    } catch (error) {
      console.error('Download error:', error);
      onDownload('Gagal mengunduh file', true);
    }
  };

  return (
    <div className={`flex gap-4 p-6 transition-all duration-300 hover:bg-slate-50/50 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className={`${isUser ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'}`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 space-y-3 ${isUser ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">{isUser ? 'Anda' : 'AI Assistant'}</span>
          <span>{new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <Card className={`p-4 max-w-3xl transition-all duration-200 hover:shadow-md ${
          isUser 
            ? 'bg-slate-900 text-white ml-auto' 
            : 'bg-white border-slate-200'
        }`}>
          {isImage ? (
            <div className="space-y-3">
              {message.prompt && (
                <p className="text-sm text-slate-600 italic">"{message.prompt}"</p>
              )}
              <div className="relative group">
                <img 
                  src={message.content} 
                  alt={message.prompt || "Generated image"}
                  className="w-full max-w-lg rounded-lg shadow-sm transition-transform duration-200 hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg" />
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </Card>
        
        <div className={`flex gap-2 ${isUser ? 'justify-end' : ''}`}>
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-slate-500 hover:text-slate-700 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1 text-xs">{copied ? 'Disalin' : 'Salin'}</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-3 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="ml-1 text-xs">Unduh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;