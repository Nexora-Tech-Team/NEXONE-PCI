import { HelpCircle, Book, MessageSquare, ExternalLink } from 'lucide-react'

const FAQ = [
  { q: 'How do I clock in?', a: 'Go to Team → Time Cards and click the "Clock In" button at the top right of the page.' },
  { q: 'How do I apply for leave?', a: 'Go to Team → Leave and click "Apply leave". Fill in the form with your leave type, dates, and reason.' },
  { q: 'How do I assign a task to someone?', a: 'When creating or editing a task, use the "Assign To" dropdown to select a team member.' },
  { q: 'How do I create an invoice?', a: 'Go to Sales → Invoices and click "Add Invoice". Select the client, set dates and amounts.' },
  { q: 'How do I track project progress?', a: 'Open a project detail page and update the progress value. You can also add tasks to track completion.' },
  { q: 'How do I add a client?', a: 'Go to Clients page and click "Add client". Fill in the name, type, contact details, and currency.' },
  { q: 'Can I filter tasks by status?', a: 'Yes, on the Tasks page use the status filter dropdown to show only tasks with a specific status.' },
  { q: 'How do I use the Kanban board?', a: 'On Tasks or Leads pages, switch to the Kanban view using the view tabs. Drag and drop cards between columns to update status.' },
]

export default function HelpPage() {
  return (
    <div className="p-5 max-w-3xl">
      <h1 className="page-title mb-6">Help & Support</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Book, label: 'Documentation', desc: 'Read the full docs' },
          { icon: MessageSquare, label: 'Support Chat', desc: 'Chat with support' },
          { icon: ExternalLink, label: 'Release Notes', desc: 'What\'s new' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Icon size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-800">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-800 mb-1">{item.q}</p>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
