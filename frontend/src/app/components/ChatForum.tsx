import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { chatApi, ChatMessage } from '@/lib/api';

interface ChatForumProps {
  userName: string;
}

export default function ChatForum({ userName }: ChatForumProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    chatApi.list().then((msgs) => {
      setMessages(msgs);
    }).catch(() => {});
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll only the chat container to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage('');
    try {
      await chatApi.send(text);
      loadMessages();
    } catch {
      setMessage(text);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-500 text-white rounded-lg p-2">
          <MessageCircle size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Team Chat Forum</h2>
          <p className="text-sm text-gray-500">Discuss with your colleagues</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users size={16} />
          <span>Online</span>
        </div>
      </div>

      <div ref={chatContainerRef} className="bg-blue-50 rounded-lg p-4 mb-4 h-80 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No messages yet. Be the first!</p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.user === userName;
            const msgDate = new Date(msg.created_at.includes('T') ? msg.created_at : msg.created_at.replace(' ', 'T'));
            const now = new Date();
            const diffMs = now.getTime() - msgDate.getTime();
            const timeOnly = msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const sameYear = msgDate.getFullYear() === now.getFullYear();
            const time = diffMs < 24 * 60 * 60 * 1000
              ? timeOnly
              : `${msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear ? { year: 'numeric' } : {}) })}, ${timeOnly}`;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
                    isOwn
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">{msg.user}</p>
                  )}
                  <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 text-right ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>{time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
        >
          <Send size={20} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
