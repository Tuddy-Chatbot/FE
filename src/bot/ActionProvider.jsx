import React, { useEffect } from "react";

const ActionProvider = ({ createChatBotMessage, setState, children }) => {
  const handleHello = () => {
    const botMessage = createChatBotMessage("Hello. Nice to meet you.");

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const reply = (text) => {
    const botMessage = createChatBotMessage(text);
    setState((prev) => ({ ...prev, messages: [...prev.messages, botMessage] }));
  };

  // 업로드 버튼에서 보내는 메시지를 챗봇에 출력
  useEffect(() => {
    const onBotMessage = (e) => {
      const text = e?.detail?.text;
      if (!text) return;

      const botMessage = createChatBotMessage(text);
      setState((prev) => ({ ...prev, messages: [...prev.messages, botMessage] }));
    };

    window.addEventListener("chatbot:botMessage", onBotMessage);
    return () => window.removeEventListener("chatbot:botMessage", onBotMessage);
  }, [createChatBotMessage, setState]);

  return (
    <div>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          actions: { handleHello, reply },
        })
      )}
    </div>
  );
};

export default ActionProvider;
