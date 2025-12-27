"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"

export function CopilotPopup() {
  const {
    isCopilotOpen,
    copilotMessages,
    isCopilotLoading,
    copilotError,
    toggleCopilot,
    sendCopilotMessage,
    clearCopilotChat,
  } = useAppStore()

  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [copilotMessages])

  // Focus input when chat opens
  useEffect(() => {
    if (isCopilotOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCopilotOpen])

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && 
        (e.target.closest('button') || e.target.closest('input'))) {
      return // Don't start drag if clicking buttons or input
    }
    
    e.preventDefault()
    setIsDragging(true)
    const rect = chatRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      
      requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleSendMessage = () => {
    if (message.trim() && !isCopilotLoading) {
      sendCopilotMessage(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const hasMessages = copilotMessages.length > 0
  const isExpanded = position.x !== 0 || position.y !== 0 || hasMessages

  return (
    <>
      {/* Chat Dialog */}
      {!isCopilotOpen ? (
        // Floating Action Button when closed
        <Button
          onClick={toggleCopilot}
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-40 h-16 w-16 rounded-3xl shadow-lg transition-all duration-300",
            "bg-accent hover:bg-accent/90 text-white",
            "hover:scale-110 active:scale-95"
          )}
          aria-label="Toggle AI Copilot"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            ref={chatRef}
            onMouseDown={handleMouseDown}
            className={cn(
              "pointer-events-auto flex flex-col bg-background shadow-2xl border border-border/50 overflow-hidden",
              isDragging ? "cursor-grabbing select-none" : "cursor-grab",
              !isExpanded ? "rounded-full w-16 h-16 transition-all duration-300 items-center justify-center" : "rounded-3xl w-full max-w-md h-[500px] max-h-[80vh]",
              !isExpanded && "animate-in slide-in-from-bottom-5 duration-300"
            )}
            style={{
              position: 'fixed',
              left: !isExpanded
                ? 'calc(100vw - 80px)'
                : `${position.x}px`,
              top: !isExpanded
                ? 'calc(100vh - 112px)'
                : `${position.y}px`,
              willChange: isDragging ? 'left, top' : 'auto',
            }}
          >
            {!isExpanded ? (
              // Small circular state - show icon
              <MessageCircle className="h-7 w-7 text-accent" />
            ) : (
              // Expanded state - show full chat
              <>
            {/* Chat Header */}
            <div className="flex items-center justify-end gap-1 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCopilotChat}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-2xl"
                aria-label="Clear chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 6h18"></path>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCopilot}
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-2xl"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-4">
                  {copilotMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">
                        Ask me anything about this article!
                      </p>
                    </div>
                  ) : (
                    copilotMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center",
                            msg.role === "user"
                              ? "bg-accent text-white"
                              : "bg-secondary/50"
                          )}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <Card
                          className={cn(
                            "px-4 py-3 shadow-sm rounded-2xl",
                            msg.role === "user"
                              ? "bg-accent/10 border-accent/20"
                              : "bg-secondary/30 border-secondary/50"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </Card>
                      </div>
                    ))
                  )}
                  {isCopilotLoading && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center bg-secondary/50">
                      </div>
                      <Card className="px-4 py-3 shadow-sm bg-secondary/30 border-secondary/50 rounded-2xl">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </Card>
                    </div>
                  )}
                  {copilotError && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="flex-shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center bg-destructive/10 text-destructive">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <Card className="px-4 py-3 shadow-sm bg-destructive/10 border-destructive/20 rounded-2xl">
                        <p className="text-sm text-destructive">{copilotError}</p>
                      </Card>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={isCopilotLoading}
                  className="flex-1 rounded-2xl"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isCopilotLoading}
                  size="icon"
                  className="h-9 w-9 rounded-full bg-accent hover:bg-accent/90 text-white flex-shrink-0"
                  aria-label="Send message"
                >
                  {isCopilotLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
