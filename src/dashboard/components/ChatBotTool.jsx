import React, { useRef, useState } from "react";
import Chatbot from "react-chatbot-kit";
import axios from "axios"; // S3 업로드용 (raw axios)

// [핵심 수정] 직접 생성하던 api 코드를 삭제하고, lib/api에서 가져옵니다.
// 이 api 인스턴스는 토큰을 자동으로 헤더에 넣어줍니다.
import api from "../../lib/api"; 

import config from "../../bot/config";
import MessageParser from "../../bot/MessageParser";
import ActionProvider from "../../bot/ActionProvider";
import "react-chatbot-kit/build/main.css";
import "../../chatbot.css";

export default function ChatBotTool() {
  const botRef = useRef(null);

  // 고정 버튼 업로드 상태 UI용
  const [uploading, setUploading] = useState(false);
  const [progressByName, setProgressByName] = useState({});
  const [error, setError] = useState("");

  const emitBotMessage = (text) => {
    // ActionProvider에서 이 이벤트를 받아 챗봇 메시지로 추가
    window.dispatchEvent(new CustomEvent("chatbot:botMessage", { detail: { text } }));
  };

  const requestPresignedUrl = async (file) => {
    const body = {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
    };
    
    // api 인스턴스를 사용하므로 'Authorization: Bearer 토큰'이 자동으로 포함됨
    // /s3/put -> api/proxy.js -> 백엔드
    const { data } = await api.post("/s3/put", body);
    // 예상: { url: "...", fileId: 10 }
    return data;
  };

  const uploadToS3 = async (url, file) => {
    // [주의] S3로 직접 업로드할 때는 토큰이 들어간 'api'가 아니라 쌩 'axios'를 써야 함
    // (AWS는 우리의 Bearer 토큰을 모름)
    await axios.put(url, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        setProgressByName((prev) => ({ ...prev, [file.name]: pct }));
      },
    });
  };

  const notifyProcess = async (fileId) => {
    // 이것도 백엔드 요청이므로 'api' 사용
    await api.post(`/files/${fileId}/process`);
  };

  const handleFilesPickedAndUpload = async (files) => {
    setError("");
    if (!files.length) return;

    setUploading(true);
    setProgressByName(Object.fromEntries(files.map((f) => [f.name, 0])));

    try {
      emitBotMessage(`파일 ${files.length}개 업로드를 시작할게요 📎`);

      for (const file of files) {
        const { url, fileId } = await requestPresignedUrl(file);
        
        // S3 업로드
        await uploadToS3(url, file);

        if (fileId != null) {
          // 처리 요청
          await notifyProcess(fileId);
        }

        setProgressByName((prev) => ({ ...prev, [file.name]: 100 }));
      }

      emitBotMessage("업로드가 완료됐어요");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e?.message || "업로드 중 오류가 발생했습니다.";
      setError(msg);
      emitBotMessage(`업로드 실패 ❌ (${msg})`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="chatbot-wrapper" ref={botRef}>
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />

      {/* 전송 버튼 위에 고정되는 업로드 버튼 + (옵션) 진행률 패널 */}
      <FixedUploadOverlay
        uploading={uploading}
        progressByName={progressByName}
        error={error}
        onPickAndUpload={handleFilesPickedAndUpload}
      />
    </div>
  );
}

function FixedUploadOverlay({ uploading, progressByName, error, onPickAndUpload }) {
  const fileInputRef = useRef(null);

  const openPicker = () => fileInputRef.current?.click();

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // 같은 파일 다시 선택 가능하게
    await onPickAndUpload(files);
  };

  const fileNames = Object.keys(progressByName || {});
  const showPanel = uploading || (!!error && fileNames.length > 0) || fileNames.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onPick}
        style={{ display: "none" }}
      />

      {/* 고정 버튼 */}
      <button
        type="button"
        className="chatbot-fixed-upload"
        onClick={openPicker}
        disabled={uploading}
        title={uploading ? "업로드 중..." : "파일 업로드"}
      >
        파일 업로드
      </button>

      {/* 진행률 패널(전송 버튼 위) */}
      {showPanel && (
        <div className="chatbot-upload-panel">
          <div className="chatbot-upload-panel-title">
            {uploading ? "업로드 중..." : "업로드"}
          </div>

          {error && <div className="chatbot-upload-error">{error}</div>}

          <div className="chatbot-upload-list">
            {fileNames.map((name) => {
              const pct = progressByName[name] ?? 0;
              return (
                <div key={name} className="chatbot-upload-item">
                  <div className="chatbot-upload-item-row">
                    <span className="chatbot-upload-filename" title={name}>
                      {name}
                    </span>
                    <span className="chatbot-upload-pct">{pct}%</span>
                  </div>
                  <div className="chatbot-upload-bar">
                    <div
                      className="chatbot-upload-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}