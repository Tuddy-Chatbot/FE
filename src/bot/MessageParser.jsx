import React from 'react';
import api from '../lib/api';

const MessageParser = ({ children, actions }) => {
  const parse = async (message) => {
    // 메시지가 비어있으면 요청 보내지 않음
    if (!message || !message.trim()) return;

    try {
      // [수정] 백엔드 스펙에 맞춰 필드명 변경 (answer -> query)
      const res = await api.post('/chat',
        { 
          sessionId: 0, 
          query: message, // 백엔드가 'query' 필드를 필수(@NotBlank)로 요구함
          fileId: 0       // 파일이 없는 경우 기본값 0 전송 (필요 시)
        },
        // api/chat.js 프록시가 자동으로 처리하므로 Content-Type 헤더는 생략하거나 그대로 둬도 됨
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('응답:', res.data);
      // 백엔드 응답 구조에 따라 actions.reply 호출
      // 보통 res.data.response 혹은 res.data.answer 등일 수 있음
      actions.reply(res.data?.response || res.data?.answer || "응답이 없습니다.");
    } catch (err) {
      console.error('에러:', err?.response?.status, err?.response?.data || err.message);
      actions.reply("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          parse: parse,
          actions,
        });
      })}
    </div>
  );
};

export default MessageParser;