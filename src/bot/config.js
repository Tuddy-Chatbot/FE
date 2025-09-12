import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  initialMessages: [createChatBotMessage("안녕하세요! 무엇을 도와드릴까요?")],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#386596',
    },
    chatButton: {
      backgroundColor: '#5ccc9d',
    },
  },
};

export default config;