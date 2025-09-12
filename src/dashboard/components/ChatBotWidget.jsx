// components/ChatFloatingWidget.jsx
import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import ChatbotTool from "./ChatbotTool";

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <Fab
          color="primary"
          aria-label="open-chat"
          onClick={() => setIsOpen(true)}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: (theme) => theme.zIndex.modal + 1,
            width: { xs: 270, sm: 270 },
            height: { xs: 550, sm: 550 },
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Chatbot
            </Typography>
            <IconButton
              aria-label="close-chat"
              size="small"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ChatbotTool />
          </Box>
        </Paper>
      )}
    </>
  );
}