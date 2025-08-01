import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Plus, MessageSquare, Trash2, Calendar } from 'lucide-react';

const SessionSidebar = ({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession }) => {
  return (
    <Card className="h-full bg-slate-50 border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <Button 
          onClick={onNewSession}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Percakapan Baru
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="group relative">
              <Button
                variant={activeSessionId === session.id ? "default" : "ghost"}
                className={`w-full justify-start text-left p-3 h-auto transition-all duration-200 ${
                  activeSessionId === session.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{session.title}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.createdAt).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Belum ada percakapan</p>
              <p className="text-xs mt-1">Mulai percakapan baru dengan menekan tombol di atas</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default SessionSidebar;