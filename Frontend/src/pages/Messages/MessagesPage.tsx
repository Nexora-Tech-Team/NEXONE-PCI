import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from 'lucide-react'
import { messageService } from '@/services/api'
import { RootState } from '@/store'
import { EmptyState, Loading } from '@/components/common'
import pciLogoUrl from '../../../logo/Logo_PCI_Quality.svg'

type User = {
  id: number
  name: string
  email: string
  job_title?: string
  phone?: string
  avatar?: string
}

type Conversation = {
  id: number
  participants: User[]
  last_message?: ChatMessage
  updated_at: string
}

type ChatMessage = {
  id: number
  conversation_id: number
  sender_id: number
  sender?: User
  body: string
  created_at: string
}

const timeLabel = (value?: string) => value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''

function UserAvatar({ user, size = 'md' }: { user?: User | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8'
  const imageClass = size === 'lg' ? 'h-12' : size === 'md' ? 'h-8' : 'h-6'
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-white ring-1 ring-gray-100 flex items-center justify-center shrink-0`}>
      <img src={pciLogoUrl} alt={user?.name || 'User'} className={`${imageClass} w-auto object-contain`} />
    </div>
  )
}

export default function MessagesPage() {
  const currentUser = useSelector((s: RootState) => s.auth.user)
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const currentUserID = currentUser?.id
  const activePeer = useMemo(() => {
    if (!activeConversation) return null
    return activeConversation.participants.find(user => user.id !== currentUserID) || activeConversation.participants[0]
  }, [activeConversation, currentUserID])

  const filteredUsers = users.filter(user => {
    const q = search.toLowerCase()
    return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || (user.job_title || '').toLowerCase().includes(q)
  })

  const loadShell = async () => {
    setLoading(true)
    try {
      const [userRes, conversationRes] = await Promise.all([
        messageService.listUsers(),
        messageService.listConversations(),
      ])
      const nextUsers = userRes.data.data || []
      const nextConversations = conversationRes.data.data || []
      setUsers(nextUsers)
      setConversations(nextConversations)
      if (!activeConversation && nextConversations.length > 0) {
        setActiveConversation(nextConversations[0])
      }
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationID: number, quiet = false) => {
    if (!quiet) setLoadingMessages(true)
    try {
      const res = await messageService.listMessages(conversationID, { page: 1, limit: 100 })
      setMessages(res.data.data || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth' }), 20)
    } catch {
      if (!quiet) toast.error('Failed to load conversation')
    } finally {
      if (!quiet) setLoadingMessages(false)
    }
  }

  useEffect(() => { loadShell() }, [])

  useEffect(() => {
    if (activeConversation?.id) loadMessages(activeConversation.id)
  }, [activeConversation?.id])

  useEffect(() => {
    if (!activeConversation?.id) return
    const timer = window.setInterval(() => {
      loadMessages(activeConversation.id, true)
      messageService.listConversations().then(res => setConversations(res.data.data || [])).catch(() => {})
    }, 6000)
    return () => window.clearInterval(timer)
  }, [activeConversation?.id])

  const startConversation = async (user: User) => {
    try {
      const res = await messageService.createConversation(user.id)
      const conversation = res.data
      setActiveConversation(conversation)
      await loadShell()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to start conversation')
    }
  }

  const sendMessage = async () => {
    const text = body.trim()
    if (!activeConversation || !text) return
    setBody('')
    try {
      const res = await messageService.sendMessage(activeConversation.id, text)
      setMessages(prev => [...prev, res.data])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 20)
      messageService.listConversations().then(r => setConversations(r.data.data || [])).catch(() => {})
    } catch (e: any) {
      setBody(text)
      toast.error(e?.response?.data?.error || 'Failed to send message')
    }
  }

  if (loading) return <div className="p-5"><Loading /></div>

  return (
    <div className="p-5 h-[calc(100vh-96px)] min-h-[680px]">
      <div className="h-full grid grid-cols-[320px_1fr] gap-4">
        <aside className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
                <p className="text-xs text-gray-400">Team conversations</p>
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9 h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
              />
            </div>
          </div>

          <div className="p-3 border-b border-gray-100">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Conversations</p>
            <div className="space-y-1 max-h-64 overflow-auto">
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-4">No conversations yet.</p>
              ) : conversations.map(conversation => {
                const peer = conversation.participants.find(user => user.id !== currentUserID) || conversation.participants[0]
                const active = activeConversation?.id === conversation.id
                return (
                  <button
                    key={conversation.id}
                    className={`w-full text-left p-2 rounded-md flex gap-2 transition ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <UserAvatar user={peer} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{peer?.name || 'Conversation'}</p>
                      <p className="text-xs text-gray-400 truncate">{conversation.last_message?.body || peer?.email || 'Start chatting'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-3 flex-1 min-h-0">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Team users</p>
            <div className="space-y-1 h-full overflow-auto">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  className="w-full text-left p-2 rounded-md flex gap-2 hover:bg-gray-50 transition"
                  onClick={() => startConversation(user)}
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.job_title || user.email}</p>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && <p className="text-xs text-gray-400 px-2 py-4">No users found.</p>}
            </div>
          </div>
        </aside>

        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {activeConversation ? (
            <>
              <div className="h-16 border-b border-gray-100 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={activePeer} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{activePeer?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{activePeer?.job_title || activePeer?.email}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles size={13} /> Active thread
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 bg-gradient-to-b from-slate-50 to-white">
                {loadingMessages ? <Loading /> : messages.length === 0 ? (
                  <EmptyState message="No messages yet. Say hello to start the conversation." />
                ) : (
                  <div className="space-y-3">
                    {messages.map(message => {
                      const mine = message.sender_id === currentUserID
                      return (
                        <div key={message.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                          {!mine && <UserAvatar user={message.sender} size="sm" />}
                          <div className={`max-w-[68%] rounded-2xl px-4 py-2 shadow-sm ${mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>{timeLabel(message.created_at)}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    className="input min-h-[46px] max-h-32 resize-none py-3"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={`Message ${activePeer?.name || 'your teammate'}...`}
                  />
                  <button className="btn btn-primary h-[46px] px-4" onClick={sendMessage} disabled={!body.trim()}>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center px-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-blue-500" />
                </div>
                <h2 className="font-semibold text-gray-900">Choose a teammate</h2>
                <p className="text-sm text-gray-400 mt-1">Start a private conversation from the user list on the left.</p>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
