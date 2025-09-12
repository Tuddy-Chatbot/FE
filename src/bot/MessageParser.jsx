import React from 'react';
import api from '../lib/api';

const MessageParser = ({ children, actions }) => {
  const parse = async (message) => {
    // if (message.includes('hello')) {
    //   actions.handleHello();
    // }

    //api test
    try {
    const res = await api.post('/api/normal-chat',
      { userId: "pyohm", query: message },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('응답:', res.data);
    actions.reply(res.data?.response);
  } catch (err) {
    // 서버가 왜 거절했는지 메시지 확인
    console.error('에러:', err?.response?.status, err?.response?.data || err.message);
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