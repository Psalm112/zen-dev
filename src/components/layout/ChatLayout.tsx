import React from "react";

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row w-full h-[80vh] md:h-[70vh]">
      {children}
    </div>
  );
};

export default ChatLayout;
