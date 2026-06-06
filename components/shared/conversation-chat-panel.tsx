"use client"

import type { ReactNode } from "react"
import { Loader2, MessageCircle, Paperclip, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export type ConversationChatMessage = {
  messageId?: string | null
  senderType?: string | null
  senderDisplayName?: string | null
  message?: string | null
  internalNote?: boolean | null
  attachments?: unknown[] | null
  createdAt?: string | null
}

type ConversationChatPanelProps<TMessage extends ConversationChatMessage> = {
  title: string
  description?: string
  messages: TMessage[]
  className?: string
  unread?: boolean
  emptyTitle?: string
  emptyDescription?: string
  replyValue: string
  replyPlaceholder: string
  replyMaxLength?: number
  replyError?: string | null
  replyDisabled?: boolean
  replyDisabledMessage?: string
  isSendingReply?: boolean
  composerHelper?: string
  attachmentButtonLabel?: string
  onReplyChange: (value: string) => void
  onSendReply: () => void
  onAttachmentClick?: () => void
  isOwnMessage: (message: TMessage) => boolean
  senderFallback: (message: TMessage, isOwn: boolean) => string
  formatDateTime: (value?: string | null) => string
  renderAttachments?: (message: TMessage, isOwn: boolean) => ReactNode
}

export function ConversationChatPanel<TMessage extends ConversationChatMessage>({
  title,
  description,
  messages,
  className,
  unread,
  emptyTitle = "No messages yet",
  emptyDescription = "The conversation will appear here.",
  replyValue,
  replyPlaceholder,
  replyMaxLength = 5000,
  replyError,
  replyDisabled,
  replyDisabledMessage = "Replies are disabled for this conversation.",
  isSendingReply,
  composerHelper,
  attachmentButtonLabel = "Attach file",
  onReplyChange,
  onSendReply,
  onAttachmentClick,
  isOwnMessage,
  senderFallback,
  formatDateTime,
  renderAttachments,
}: ConversationChatPanelProps<TMessage>) {
  return (
    <section className={cn("flex min-h-[560px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="shrink-0 border-b bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-6">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {unread ? (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Unread
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <ChatBubble
                key={message.messageId || `${message.createdAt || "message"}-${index}`}
                message={message}
                isOwn={isOwnMessage(message)}
                senderName={senderFallback(message, isOwnMessage(message))}
                createdAt={formatDateTime(message.createdAt)}
                attachments={renderAttachments?.(message, isOwnMessage(message))}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="rounded-xl border bg-background px-6 py-8 text-center shadow-sm">
              <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">{emptyTitle}</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{emptyDescription}</p>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-card p-3">
        {replyDisabled ? (
          <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">{replyDisabledMessage}</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5 h-9 w-9 shrink-0 rounded-full text-muted-foreground"
                onClick={onAttachmentClick}
                disabled={!onAttachmentClick || isSendingReply}
                title={onAttachmentClick ? attachmentButtonLabel : "Attachments are not configured here yet."}
              >
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">{attachmentButtonLabel}</span>
              </Button>
              <Textarea
                value={replyValue}
                maxLength={replyMaxLength}
                onChange={(event) => onReplyChange(event.target.value)}
                placeholder={replyPlaceholder}
                className="max-h-32 min-h-10 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
                disabled={isSendingReply}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    onSendReply()
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="mb-0.5 h-9 w-9 shrink-0 rounded-full"
                onClick={onSendReply}
                disabled={isSendingReply || !replyValue.trim()}
                title="Send reply"
              >
                {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send reply</span>
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <span className={replyError ? "text-destructive" : ""}>
                {replyError || composerHelper || "Press Enter to send. Shift + Enter adds a new line."}
              </span>
              <span className="shrink-0">{replyValue.length}/{replyMaxLength}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ChatBubble<TMessage extends ConversationChatMessage>({
  message,
  isOwn,
  senderName,
  createdAt,
  attachments,
}: {
  message: TMessage
  isOwn: boolean
  senderName: string
  createdAt: string
  attachments?: ReactNode
}) {
  const isSystem = message.senderType === "SYSTEM" && !message.internalNote

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[92%] rounded-full border bg-background/80 px-4 py-2 text-center text-xs text-muted-foreground shadow-sm">
          <span>{message.message || "System update"}</span>
          <span className="ml-2">{createdAt}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] px-3.5 py-2.5 text-sm shadow-sm md:max-w-[76%]",
          isOwn
            ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
            : message.internalNote
              ? "rounded-2xl rounded-bl-md border border-amber-300 bg-amber-50 text-amber-950"
              : "rounded-2xl rounded-bl-md border bg-background text-foreground",
        )}
      >
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold">{senderName}</span>
          {message.internalNote ? (
            <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-950">
              Internal note
            </Badge>
          ) : null}
          <span className={cn(isOwn ? "text-primary-foreground/75" : "text-muted-foreground")}>{createdAt}</span>
        </div>
        <p className="whitespace-pre-wrap leading-6">{message.message || ""}</p>
        {attachments}
      </div>
    </div>
  )
}
