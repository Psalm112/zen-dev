import { useState, KeyboardEvent } from "react";
import { BiSend, BiImage, BiSmile } from "react-icons/bi";
import { motion } from "framer-motion";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-[#292B30] p-3 bg-[#212428]">
      <div className="flex items-end">
        <div className="flex-1 bg-[#292B30] rounded-lg px-3 py-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-transparent text-white outline-none resize-none max-h-24"
            rows={1}
            style={{ height: "auto", minHeight: "24px" }}
            disabled={isLoading}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={`ml-2 p-3 rounded-full ${
            value.trim() && !isLoading
              ? "bg-Red text-white"
              : "bg-[#292B30] text-[#545456]"
          } flex items-center justify-center transition-colors`}
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <BiSend size={20} />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
