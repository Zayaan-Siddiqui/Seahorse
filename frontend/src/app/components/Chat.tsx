import { motion } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant' | 'context';
  content: string;
  timestamp: Date;
  metadata?: {
    type: 'email' | 'calendar' | 'document';
    score: number;
    title?: string;
  };
}

const Chat = ({ messages }: { messages: Message[] }) => {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`flex ${
            message.role === 'user' 
                ? 'justify-end' 
                : message.role === 'context' 
                    ? 'justify-center' 
                    : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] p-4 rounded-lg ${
              message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'context'
                  ? 'bg-gray-200 text-gray-600 border border-gray-300'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.role === 'context' && message.metadata && (
              <div className="flex items-center gap-2 mb-2 text-sm border-b border-gray-300 pb-2">
                <span className="font-medium">
                  {message.metadata.type === 'email' ? '📧' :
                   message.metadata.type === 'calendar' ? '📅' : '📄'}
                  {message.metadata.title}
                </span>
                <span className="text-gray-500">
                  (Relevance: {(message.metadata.score * 100).toFixed(1)}%)
                </span>
              </div>
            )}
            <p className="text-sm">{message.content}</p>
            <span className="text-xs opacity-70 mt-2 block">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Chat;
