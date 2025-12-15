import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Paperclip,
  X,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

/**
 * MessagingInterface - P2P Encrypted Messaging
 * 
 * Features:
 * - Send/receive encrypted messages
 * - Message history with timestamps
 * - Encryption indicator (E2E)
 * - Read receipts (sent/delivered/read)
 * - Typing indicator
 * - File attachment preview
 * - Message status (pending/sent/failed)
 * - Auto-scroll to new messages
 * - Character limit
 * 
 * Constitutional Note: All messages are end-to-end encrypted.
 * No third party can read your conversations.
 */

type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  encrypted: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  filename: string;
  filesize: number;
  type: string;
}

interface MessagingInterfaceProps {
  peerId: string;
  peerName: string;
  peerOnline: boolean;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onMarkRead?: (messageId: string) => void;
  isTyping?: boolean;
  encryptionEnabled?: boolean;
}

const statusIcons: Record<MessageStatus, typeof Clock> = {
  pending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: X
};

const statusColors: Record<MessageStatus, string> = {
  pending: 'text-gray-400',
  sent: 'text-gray-500',
  delivered: 'text-blue-500',
  read: 'text-green-500',
  failed: 'text-red-500'
};

export function MessagingInterface({
  peerId,
  peerName,
  peerOnline,
  messages,
  currentUserId,
  onSendMessage,
  onMarkRead,
  isTyping = false,
  encryptionEnabled = true
}: MessagingInterfaceProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxMessageLength = 2000;
  const remainingChars = maxMessageLength - messageText.length;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!onMarkRead) return;
    
    const unreadMessages = messages.filter(
      m => m.senderId !== currentUserId && m.status !== 'read'
    );
    
    unreadMessages.forEach(msg => {
      onMarkRead(msg.id);
    });
  }, [messages, currentUserId, onMarkRead]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
    return messages.reduce((groups, message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
      return groups;
    }, {} as Record<string, Message[]>);
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="border-b rounded-b-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                {peerName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={peerOnline ? 'bg-green-100 text-green-700 border-green-300 border' : 'bg-gray-100 text-gray-700 border-gray-300 border'}>
                  {peerOnline ? 'Online' : 'Offline'}
                </Badge>
                {encryptionEnabled && (
                  <button
                    onClick={() => setShowEncryptionInfo(!showEncryptionInfo)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                  >
                    <Lock className="h-3 w-3" />
                    End-to-end encrypted
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Encryption Info */}
          {showEncryptionInfo && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">End-to-End Encryption Active</p>
                  <p className="text-xs text-green-700">
                    All messages are encrypted on your device before being sent. Only you and {peerName} can read them.
                    Not even Mirror servers (which don't exist!) can see your messages.
                  </p>
                </div>
                <button
                  onClick={() => setShowEncryptionInfo(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map(message => {
                  const isOwnMessage = message.senderId === currentUserId;
                  const StatusIcon = statusIcons[message.status];
                  const statusColor = statusColors[message.status];

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Sender Name (for received messages) */}
                        {!isOwnMessage && (
                          <p className="text-xs text-gray-500 mb-1 px-3">{message.senderName}</p>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map(attachment => (
                                <div
                                  key={attachment.id}
                                  className={`flex items-center gap-2 p-2 rounded ${
                                    isOwnMessage ? 'bg-blue-700' : 'bg-gray-50'
                                  }`}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">{attachment.filename}</p>
                                    <p className="text-xs opacity-75">{formatFileSize(attachment.filesize)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Timestamp and Status */}
                        <div className="flex items-center gap-2 mt-1 px-3">
                          <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                          {isOwnMessage && (
                            <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                          )}
                          {message.encrypted && (
                            <Lock className="h-3 w-3 text-gray-400" title="Encrypted" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="border-t rounded-t-none">
        <CardContent className="pt-4">
          {/* Offline Warning */}
          {!peerOnline && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-center gap-2">
              <EyeOff className="h-3 w-3" />
              <span>{peerName} is offline. Message will be delivered when they come online.</span>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessageText(e.target.value.slice(0, maxMessageLength))}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${peerName}...`}
              rows={2}
              disabled={isSending}
              className="resize-none flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              className="px-4"
            >
              {isSending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {encryptionEnabled && (
                <>
                  <Lock className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Encrypted</span>
                </>
              )}
            </div>
            <span className={`text-xs ${remainingChars < 100 ? 'text-red-600' : 'text-gray-500'}`}>
              {remainingChars} characters remaining
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <MessagingInterface
 *   peerId="inst_alice"
 *   peerName="alice.mirror"
 *   peerOnline={true}
 *   currentUserId="inst_me"
 *   messages={[
 *     {
 *       id: 'msg_1',
 *       senderId: 'inst_alice',
 *       senderName: 'alice.mirror',
 *       content: 'Hey! How are you doing?',
 *       timestamp: '2024-01-15T10:00:00Z',
 *       status: 'read',
 *       encrypted: true
 *     },
 *     {
 *       id: 'msg_2',
 *       senderId: 'inst_me',
 *       senderName: 'me.mirror',
 *       content: 'Doing great! Just working on some reflections.',
 *       timestamp: '2024-01-15T10:05:00Z',
 *       status: 'read',
 *       encrypted: true
 *     },
 *     {
 *       id: 'msg_3',
 *       senderId: 'inst_alice',
 *       senderName: 'alice.mirror',
 *       content: 'Nice! I found an interesting tension in my identity graph today.',
 *       timestamp: '2024-01-15T10:10:00Z',
 *       status: 'delivered',
 *       encrypted: true,
 *       attachments: [
 *         {
 *           id: 'att_1',
 *           filename: 'tension_screenshot.png',
 *           filesize: 245760,
 *           type: 'image/png'
 *         }
 *       ]
 *     }
 *   ]}
 *   onSendMessage={async (content, attachments) => {
 *     console.log('Sending message:', content);
 *     await api.sendMessage(peerId, content, attachments);
 *   }}
 *   onMarkRead={(messageId) => {
 *     console.log('Marking as read:', messageId);
 *     api.markMessageRead(messageId);
 *   }}
 *   isTyping={false}
 *   encryptionEnabled={true}
 * />
 */

