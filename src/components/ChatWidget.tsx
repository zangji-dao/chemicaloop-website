'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MoreVertical, User, Clock, CheckCheck, MessageSquare, Plus, Minimize2, Maximize2, Minus } from 'lucide-react';
import { getUser } from '@/services/authService';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
  online?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

// 预置的代理联系人
const AGENT_CONTACTS: Contact[] = [
  { id: 'agent-001', name: 'Sales Agent', online: true },
  { id: 'agent-002', name: 'Support Team', online: true },
  { id: 'agent-003', name: 'Platform Manager', online: true },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // 窗口状态
  const [windowState, setWindowState] = useState({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    isDragging: false,
    isResizing: false,
    resizeDirection: '',
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getUserId = () => {
    const user = getUser();
    return user?.id || null;
  };

  // 初始化窗口位置
  useEffect(() => {
    const initPosition = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const width = 800;
      const height = 600;

      setWindowState(prev => ({
        ...prev,
        x: screenWidth - width - 80,
        y: screenHeight - height - 80,
        width,
        height,
      }));
    };

    initPosition();
    window.addEventListener('resize', initPosition);
    return () => window.removeEventListener('resize', initPosition);
  }, []);

  // 加载联系人列表
  useEffect(() => {
    loadContacts();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
      if (selectedContact) {
        loadMessages(selectedContact.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在点击窗口背景时触发拖拽，不在 .no-drag 元素上
    const target = e.target as HTMLElement;
    if (!target.closest('.no-drag') && !target.closest('.resize-handle')) {
      setWindowState(prev => ({ ...prev, isDragging: true }));
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      e.preventDefault();
    }
  };

  // 调整大小开始
  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWindowState(prev => ({ ...prev, isResizing: true, resizeDirection: direction }));
  };

  // 使用 ref 存储当前状态，避免闭包问题
  const windowStateRef = useRef(windowState);

  useEffect(() => {
    windowStateRef.current = windowState;
  }, [windowState]);

  const dragOffsetRef = useRef(dragOffset);

  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  // 鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    const state = windowStateRef.current;
    const offset = dragOffsetRef.current;
    const { isDragging, isResizing, resizeDirection, x, y, width, height } = state;

    if (isDragging) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;

      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      setWindowState(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      }));
    } else if (isResizing) {
      let newX = x;
      let newY = y;
      let newWidth = width;
      let newHeight = height;

      const minWidth = 600;
      const minHeight = 400;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, e.clientX - x);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, e.clientY - y);
      }
      if (resizeDirection.includes('w')) {
        const delta = x - e.clientX;
        newWidth = Math.max(minWidth, width + delta);
        newX = width + delta < minWidth ? x : e.clientX;
      }
      if (resizeDirection.includes('n')) {
        const delta = y - e.clientY;
        newHeight = Math.max(minHeight, height + delta);
        newY = height + delta < minHeight ? y : e.clientY;
      }

      setWindowState(prev => ({
        ...prev,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      }));
    }
  };

  // 鼠标释放
  const handleMouseUp = () => {
    setWindowState(prev => ({
      ...prev,
      isDragging: false,
      isResizing: false,
      resizeDirection: '',
    }));
  };

  // 监听鼠标事件（只在拖拽或调整大小时）
  useEffect(() => {
    if (windowState.isDragging || windowState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [windowState.isDragging, windowState.isResizing]);

  const loadContacts = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`/api/messages?userId=${userId}&type=inbox`);
      if (response.ok) {
        const data = await response.json();
        const messagesList = data.data || [];

        const contactsMap = new Map<string, Contact>();
        messagesList.forEach((msg: any) => {
          const contactId = msg.fromUserId;
          if (!contactsMap.has(contactId)) {
            contactsMap.set(contactId, {
              id: contactId,
              name: msg.fromUserId === userId ? 'You' : (contactId || 'Unknown'),
              avatar: undefined,
              lastMessage: msg.content?.substring(0, 50),
              unreadCount: !msg.isRead ? 1 : 0,
              online: true,
            });
          } else {
            const contact = contactsMap.get(contactId)!;
            if (!msg.isRead) {
              contact.unreadCount = (contact.unreadCount || 0) + 1;
            }
          }
        });

        setContacts(Array.from(contactsMap.values()));
        setUnreadCount(messagesList.filter((m: any) => !m.isRead).length);

        if (contactsMap.size > 0 && !selectedContact) {
          const firstContact = Array.from(contactsMap.values())[0];
          setSelectedContact(firstContact);
          loadMessages(firstContact.id);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadUnreadCount = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`/api/messages?userId=${userId}&type=inbox`);
      if (response.ok) {
        const data = await response.json();
        const unreadMessages = (data.data || []).filter((m: any) => !m.isRead);
        setUnreadCount(unreadMessages.length);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadMessages = async (contactId: string) => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messages?userId=${userId}&contactId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages((data.data || []).map((msg: any) => ({
          ...msg,
          senderId: msg.fromUserId,
          senderName: msg.fromUserId === userId ? 'You' : (msg.fromUserId || 'Unknown'),
          timestamp: new Date(msg.createdAt || msg.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContact) return;

    const userId = getUserId();
    if (!userId) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: userId,
      senderName: 'You',
      content: inputText.trim(),
      timestamp: new Date(),
      isRead: false,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          senderName: 'You',
          receiverId: selectedContact.id,
          receiverName: selectedContact.name,
          subject: 'Chat Message',
          content: inputText.trim(),
          isRead: false,
        }),
      });

      if (response.ok) {
        setTimeout(() => loadMessages(selectedContact.id), 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartNewChat = (contact: Contact) => {
    setSelectedContact(contact);
    setShowNewChat(false);
    loadMessages(contact.id);
  };

  const formatTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-80 z-[99998] w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 border-2 border-white flex items-center justify-center group"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // 最小化状态
  if (isMinimized) {
    return (
      <div
        className="fixed z-[99998] bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl shadow-2xl overflow-hidden border border-gray-200"
        style={{
          left: `${windowState.x}px`,
          top: `${windowState.y}px`,
          width: `${windowState.width}px`,
          height: '48px',
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full px-4 flex items-center justify-between cursor-move">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Messages</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 no-drag">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Restore"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 全屏状态
  if (isFullscreen) {
    return (
      <div
        className="fixed z-[99998] w-[100vw] h-[100vh] bg-white shadow-2xl flex overflow-hidden border-0 rounded-none"
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between px-4 z-10 no-drag">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-bold text-lg">Messages</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 聊天内容 */}
        <div className="pt-14 w-full h-full flex">
          {/* 左侧联系人列表 */}
          <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50 no-drag">
            <div className="p-4">
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>

            {showNewChat && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="text-sm font-semibold text-blue-800 mb-3">Start a new conversation</div>
                <div className="space-y-2">
                  {AGENT_CONTACTS.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleStartNewChat(contact)}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200 no-drag"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Online
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 no-drag"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-drag">
              {contacts.length === 0 && !showNewChat ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-3">No messages yet</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium no-drag"
                  >
                    Start a new conversation
                  </button>
                </div>
              ) : (
                contacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      loadMessages(contact.id);
                    }}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors no-drag ${
                      selectedContact?.id === contact.id
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                        {contact.unreadCount && contact.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右侧聊天区域 */}
          <div className="flex-1 flex flex-col no-drag">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              {selectedContact ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    {selectedContact.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Online
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Select a contact</h3>
                    <p className="text-xs text-gray-500">Start a conversation</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors no-drag">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map(message => {
                  const isOwn = message.senderId === getUserId();
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {isOwn && (
                            <CheckCheck className={`h-3 w-3 ${message.isRead ? 'text-blue-500' : ''}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-3 no-drag">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={!selectedContact}
                  rows={2}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm"
                  style={{ minHeight: '80px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || !selectedContact}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() && selectedContact
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 正常窗口状态
  return (
    <div
      className="fixed z-[99998] bg-white rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200"
      style={{
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
      }}
    >
      {/* 调整大小的手柄 */}
      <div
        className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('nw', e)}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2 cursor-n-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('n', e)}
      />
      <div
        className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('ne', e)}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-4 cursor-w-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('w', e)}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-4 cursor-e-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('e', e)}
      />
      <div
        className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('sw', e)}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 cursor-s-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('s', e)}
      />
      <div
        className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize hover:bg-blue-400 transition-colors z-20 resize-handle"
        onMouseDown={(e) => handleResizeStart('se', e)}
      />

      {/* 左侧联系人列表 */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Header - 可拖拽区域 */}
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-move select-none"
          onMouseDown={handleMouseDown}
          style={{ cursor: windowState.isDragging ? 'grabbing' : 'move' }}
        >
          <div className="flex items-center justify-between no-drag">
            <h2 className="font-bold text-lg">Messages</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full no-drag"
                title="New Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 新建对话区域 */}
        {showNewChat && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 no-drag">
            <div className="text-sm font-semibold text-blue-800 mb-3">Start a new conversation</div>
            <div className="space-y-2">
              {AGENT_CONTACTS.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => handleStartNewChat(contact)}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200 no-drag"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Online
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNewChat(false)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 no-drag"
            >
              Cancel
            </button>
          </div>
        )}

        {/* 联系人列表 */}
        <div className="flex-1 overflow-y-auto no-drag">
          {contacts.length === 0 && !showNewChat ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="mb-3">No messages yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="text-blue-600 hover:text-blue-800 font-medium no-drag"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  loadMessages(contact.id);
                }}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors no-drag ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100 border-l-4 border-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col no-drag">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          {selectedContact ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                {selectedContact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Online
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Select a contact</h3>
                <p className="text-xs text-gray-500">Start a conversation</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors no-drag"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors no-drag"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors no-drag"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map(message => {
              const isOwn = message.senderId === getUserId();
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {isOwn && (
                        <CheckCheck className={`h-3 w-3 ${message.isRead ? 'text-blue-500' : ''}`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-3 no-drag">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={!selectedContact}
              rows={2}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm"
              style={{ minHeight: '80px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !selectedContact}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                inputText.trim() && selectedContact
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
