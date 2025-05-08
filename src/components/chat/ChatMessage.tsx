import { memo } from "react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  content: string;
  time: string;
  isOwn: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(
  ({ content, time, isOwn }) => {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`max-w-[80%] md:max-w-[70%] rounded-lg ${
            isOwn
              ? "bg-Red text-white rounded-tr-none"
              : "bg-[#292B30] text-white rounded-tl-none"
          } px-4 py-3`}
        >
          <p className="mb-1 break-words">{content}</p>
          <p
            className={`text-xs ${
              isOwn ? "text-white text-opacity-70" : "text-[#AEAEB2]"
            } text-right`}
          >
            {time}
          </p>
        </motion.div>
      </div>
    );
  }
);

export default ChatMessage;
