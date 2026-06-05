import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Users } from 'lucide-react'

export default function AssignMembersPicker({ allMembers, selectedIds, onChange, label = 'Assign Members', placeholder = 'Search members by name, committee, or ID...' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allMembers.filter(member => {
      if (!q) return true
      return (
        member.name?.toLowerCase().includes(q) ||
        member.committee?.toLowerCase().includes(q) ||
        member.branch?.toLowerCase().includes(q) ||
        member.idNumber?.toLowerCase().includes(q)
      )
    })
  }, [allMembers, query])

  const selectedMembers = useMemo(() => allMembers.filter(member => selectedIds.includes(member.id)), [allMembers, selectedIds])

  useEffect(() => {
    const onClickOutside = e => {
      if (!panelRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [])

  const toggleMember = memberId => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter(id => id !== memberId))
    } else {
      onChange([...selectedIds, memberId])
    }
  }

  return (
    <div className="space-y-2" ref={panelRef}>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600" />
        <input
          name="memberSearch"
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500">Select members to assign</p>
            </div>
            <div className="divide-y">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${selectedIds.includes(member.id) ? 'bg-yellow-50 text-gray-900' : 'text-gray-800 hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{member.name}</div>
                      <div className="text-xs text-gray-500 truncate">{member.committee || member.branch || member.idNumber || ''}</div>
                    </div>
                    <div className="ml-3 text-xs text-gray-500">{selectedIds.includes(member.id) ? 'Selected' : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {selectedMembers.map(m => (
          <div key={m.id} className="calendar-done-chip flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <span className="min-w-0 truncate">{m.name}</span>
            <button type="button" onClick={() => toggleMember(m.id)} className="ml-auto text-xs text-red-600">Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
