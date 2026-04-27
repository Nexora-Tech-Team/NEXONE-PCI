import { MessageSquare, Send } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="p-5 h-full flex flex-col">
      <h1 className="page-title mb-4">Messages</h1>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
          <MessageSquare size={28} className="text-blue-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 text-sm">Messaging coming soon</p>
          <p className="text-xs text-gray-400 mt-1">Real-time team chat will be available in a future update.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" disabled>
          <Send size={12} /> Start a conversation
        </button>
      </div>
    </div>
  )
}
