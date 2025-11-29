import { createChatBotMessage } from 'react-chatbot-kit';
import { Icon } from '@iconify/react';

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
  // 헤더 없애고 싶으면 함께 사용
  customComponents: {
    header: () => null,

    // Iconify로 봇 아바타 교체
    botAvatar: () => (
      <div className="iconify-avatar">
        <Icon icon="bxs:bot" width="28" height="28" />
      </div>
    ),

    // (선택) 사용자 아바타도 바꾸고 싶으면 추가
    userAvatar: () => (
      <div className="iconify-avatar">
        <Icon icon="icon-park-solid:people" width="28" height="28" />
      </div>
    ),
  },
};

export default config;