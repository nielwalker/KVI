import { useState } from 'react'

function ReminderSound() {
  const [enabled, setEnabled] = useState(true)

  // This component could be used to play sounds for reminders
  // For now, it's a placeholder that shows the notification state

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onClick={() => setEnabled(!enabled)}
        className={`px-4 py-2 rounded-lg shadow-lg transition-colors ${
          enabled 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-gray-400 text-white hover:bg-gray-500'
        }`}
      >
        {enabled ? '🔔 Sounds On' : '🔕 Sounds Off'}
      </button>
    </div>
  )
}

export default ReminderSound
