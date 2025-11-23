"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { BotMessageSquareIcon, CopyIcon, Minimize2Icon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from "./ai-elements/prompt-input";
import { IconButton } from "@radix-ui/themes";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "./ai-elements/message";
import { ClientSideChatTransport } from "@/lib/client-side-chat-transport";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "./ai-elements/conversation";

export default function Chat() {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // https://github.com/jakobhoeg/built-in-ai/blob/main/examples/next-hybrid/app/(core)/page.tsx
  const { messages, sendMessage } = useChat({
    transport: new ClientSideChatTransport(),
  });

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  if (!open) {
    return (
      <div className="absolute bottom-4 right-4">
        <IconButton size="4" onClick={() => setOpen(true)}>
          <BotMessageSquareIcon className="size-8" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-sm min-h-120 max-w-full bg-white text-black rounded-lg flex flex-col">
      <header className="text-lg font-bold flex items-center justify-between px-4 pt-2">
        <span>Chat</span>
        <IconButton variant="ghost" onClick={() => setOpen(false)}>
          <Minimize2Icon className="size-4" />
        </IconButton>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Conversation>
          <ConversationContent className="gap-2">
            {messages.length === 0 && <ConversationEmptyState />}
            {messages.map((message, i) => (
              <Fragment key={message.id}>
                {message.parts.map((part, j) => {
                  const key = `${message.id}-${j}-${part.type}`;
                  const isLastMessage = i === messages.length - 1;
                  switch (part.type) {
                    case "text":
                      return (
                        <Fragment key={key}>
                          <Message from={message.role}>
                            <MessageContent>
                              <MessageResponse className="space-y-1">
                                {part.text}
                              </MessageResponse>
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" && isLastMessage && (
                            <MessageActions>
                              <MessageAction
                                tooltip="Copy"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    part.text.trim()
                                  );
                                }}
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Fragment>
                      );
                    default:
                      return null;
                  }
                })}
              </Fragment>
            ))}
          </ConversationContent>
        </Conversation>
      </div>
      <PromptInputProvider>
        <PromptInput onSubmit={handleSubmit} className="p-2">
          <PromptInputBody>
            <PromptInputTextarea
              ref={textareaRef}
              className="overflow-y-auto max-h-48"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <span className="text-gray-400">
              LLM may be wrong, please double-check.
            </span>
            <PromptInputSubmit status="ready" />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
