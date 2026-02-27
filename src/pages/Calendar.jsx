import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, Clock, User, Bell, Plus } from 'lucide-react'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext'

// Local storage helper for events
const getStoredEvents = () => {
  const stored = localStorage.getItem('kusgan_events')
  return stored ? JSON.parse(stored) : []
}

// Local storage helper for announcements
const getStoredAnnouncements = () => {
  const stored = localStorage.getItem('kusgan_announcements')
  return stored ? JSON.parse(stored) : []
}

function Calendar() {
  const { user } = useAuth()
  const [events] = useState(getStoredEvents)
  const [announcements] = useState(getStoredAnnouncements)
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)
  const [expandedItemId, setExpandedItemId] = useState(null)

  const visibleAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      return a.visibility === 'public' || a.authorId === user?.id || user?.role === 'admin'
    })
  }, [announcements, user])

  const monthGroups = useMemo(() => {
    const allItems = [
      ...events.map(event => ({
        id: `plan-${event.id}`,
        type: 'plan',
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        createdBy: event.createdBy,
      })),
      ...visibleAnnouncements.map(announcement => ({
        id: `announcement-${announcement.id}`,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        priority: announcement.priority,
        category: announcement.category,
        author: announcement.author,
      })),
    ].filter(item => dayjs(item.date).isValid())

    const grouped = allItems.reduce((acc, item) => {
      const monthKey = dayjs(item.date).format('YYYY-MM')
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          monthLabel: dayjs(item.date).format('MMMM YYYY'),
          items: [],
        }
      }
      acc[monthKey].items.push(item)
      return acc
    }, {})

    return Object.values(grouped)
      .map(group => ({
        ...group,
        items: [...group.items].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
      }))
      .sort((a, b) => dayjs(b.monthKey).valueOf() - dayjs(a.monthKey).valueOf())
  }, [events, visibleAnnouncements])

  const selectedMonth = monthGroups.find(group => group.monthKey === selectedMonthKey)

  const toggleExpand = (itemId) => {
    setExpandedItemId(prev => (prev === itemId ? null : itemId))
  }

  const getItemTimeLabel = (item) => {
    if (item.type === 'plan') {
      if (item.startTime || item.endTime) {
        return `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`
      }
      return 'No time set'
    }
    return 'No time set'
  }

  const getItemCategoryLabel = (item) => {
    if (item.type === 'announcement') {
      return item.category || 'announcement'
    }
    return 'plan'
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
          <p className="text-sm text-gray-500">
            {selectedMonth ? `Events in ${selectedMonth.monthLabel}` : 'Select a month that has events'}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {!selectedMonth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthGroups.map(group => (
            <button
              key={group.monthKey}
              onClick={() => {
                setSelectedMonthKey(group.monthKey)
                setExpandedItemId(null)
              }}
              className="text-left bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <CalendarIcon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{group.monthLabel}</p>
                    <p className="text-xs text-gray-500">Click to view events</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {group.items.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {group.items.slice(0, 3).map(item => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {dayjs(item.date).format('MMM D, YYYY')} | {getItemTimeLabel(item)}
                    </p>
                    <p className="text-xs text-red-600 mt-1 capitalize">{getItemCategoryLabel(item)}</p>
                  </div>
                ))}
                {group.items.length > 3 && (
                  <p className="text-xs text-gray-500">+{group.items.length - 3} more</p>
                )}
              </div>
            </button>
          ))}

          {monthGroups.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
              No months with events yet.
            </div>
          )}
        </div>
      )}

      {selectedMonth && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-black p-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedMonth.monthLabel}</h3>
              <p className="text-sm text-gray-400">{selectedMonth.items.length} event(s)</p>
            </div>
            <button
              onClick={() => {
                setSelectedMonthKey(null)
                setExpandedItemId(null)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          </div>

          <div className="p-5 space-y-3">
            {selectedMonth.items.map(item => {
              const isExpanded = expandedItemId === item.id

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all ${
                    item.type === 'announcement' ? 'border-yellow-200 bg-yellow-50/40' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'announcement' ? (
                            <Bell size={16} className="text-yellow-600" />
                          ) : (
                            <CalendarIcon size={16} className="text-red-600" />
                          )}
                          <span className="text-xs uppercase tracking-wide text-gray-500">
                            {item.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{dayjs(item.date).format('MMMM D, YYYY')}</p>
                      </div>
                      <span className="text-xs text-gray-500">{isExpanded ? 'Hide' : 'Expand'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-3 text-sm text-gray-700 space-y-3">
                      {item.type === 'plan' && (
                        <>
                          <p>{item.description || 'No description provided.'}</p>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} />
                            <span>{item.startTime || '--:--'} - {item.endTime || '--:--'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={14} />
                            <span>{item.createdBy || 'Unknown creator'}</span>
                          </div>
                        </>
                      )}

                      {item.type === 'announcement' && (
                        <>
                          <p>{item.content || 'No content provided.'}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.priority && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                {item.priority}
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={14} />
                            <span>{item.author || 'Unknown author'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {selectedMonth.items.length === 0 && (
              <p className="text-gray-500 text-center py-4">No events in this Month.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
