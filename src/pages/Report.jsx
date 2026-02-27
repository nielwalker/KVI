import { useMemo, useState } from 'react'
import dayjs from 'dayjs'

const getStoredReportEntries = () => {
  const stored = localStorage.getItem('kusgan_report_entries')
  return stored ? JSON.parse(stored) : []
}

const getStoredAnnouncements = () => {
  const stored = localStorage.getItem('kusgan_announcements')
  return stored ? JSON.parse(stored) : []
}

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
})

function Report() {
  const [period, setPeriod] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [selectedQuarter, setSelectedQuarter] = useState(String(Math.floor(dayjs().month() / 3) + 1))
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [entries] = useState(getStoredReportEntries)
  const [announcements] = useState(getStoredAnnouncements)

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!entry?.date || !dayjs(entry.date).isValid()) return false
      const entryDate = dayjs(entry.date)

      if (period === 'monthly') {
        return entryDate.format('YYYY-MM') === selectedMonth
      }

      if (period === 'quarterly') {
        const quarter = Math.floor(entryDate.month() / 3) + 1
        return quarter === Number(selectedQuarter) && entryDate.year() === Number(selectedYear)
      }

      return entryDate.year() === Number(selectedYear)
    })
  }, [entries, period, selectedMonth, selectedQuarter, selectedYear])

  const notesFromAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (!a?.date || !dayjs(a.date).isValid()) return false
      if (a.category !== 'notes') return false
      const date = dayjs(a.date)

      if (period === 'monthly') return date.format('YYYY-MM') === selectedMonth
      if (period === 'quarterly') {
        const quarter = Math.floor(date.month() / 3) + 1
        return quarter === Number(selectedQuarter) && date.year() === Number(selectedYear)
      }
      return date.year() === Number(selectedYear)
    }).length
  }, [announcements, period, selectedMonth, selectedQuarter, selectedYear])

  const totals = useMemo(() => {
    const byCategory = {
      environmental: {
        seedlings: 0,
        expenses: 0,
      },
      'relief operation': {
        foodPacks: 0,
        expenses: 0,
        familiesAccommodated: 0,
      },
      'fire response': {
        gallonsWater: 0,
        tankWater: 0,
        cubicWater: 0,
        responseFireAccident: 0,
        expenses: 0,
      },
      notes: {
        trainings: 0,
      },
      medical: {
        medicalEquipmentsUsed: 0,
        expenses: 0,
      },
    }

    filteredEntries.forEach((entry) => {
      const category = entry.category
      if (!byCategory[category]) return

      if (category === 'environmental') {
        byCategory.environmental.seedlings += Number(entry.seedlings || 0)
        byCategory.environmental.expenses += Number(entry.expenses || 0)
      }

      if (category === 'relief operation') {
        byCategory['relief operation'].foodPacks += Number(entry.foodPacks || 0)
        byCategory['relief operation'].expenses += Number(entry.expenses || 0)
        byCategory['relief operation'].familiesAccommodated += Number(entry.familiesAccommodated || 0)
      }

      if (category === 'fire response') {
        byCategory['fire response'].gallonsWater += Number(entry.gallonsWater || 0)
        byCategory['fire response'].tankWater += Number(entry.tankWater || 0)
        byCategory['fire response'].cubicWater += Number(entry.cubicWater || 0)
        byCategory['fire response'].responseFireAccident += Number(entry.responseFireAccident || 0)
        byCategory['fire response'].expenses += Number(entry.expenses || 0)
      }

      if (category === 'notes') {
        byCategory.notes.trainings += Number(entry.trainings || 0)
      }

      if (category === 'medical') {
        byCategory.medical.medicalEquipmentsUsed += Number(entry.medicalEquipmentsUsed || 0)
        byCategory.medical.expenses += Number(entry.expenses || 0)
      }
    })

    byCategory.notes.trainings += notesFromAnnouncements
    return byCategory
  }, [filteredEntries, notesFromAnnouncements])

  const reportCards = [
    {
      title: 'Environmental',
      items: [
        { label: 'Total seedlings', value: totals.environmental.seedlings },
        { label: 'Total expenses', value: CURRENCY.format(totals.environmental.expenses) },
      ],
    },
    {
      title: 'Relief Operation',
      items: [
        { label: 'Total food packs', value: totals['relief operation'].foodPacks },
        { label: 'Expenses', value: CURRENCY.format(totals['relief operation'].expenses) },
        { label: 'Total family accommodated', value: totals['relief operation'].familiesAccommodated },
      ],
    },
    {
      title: 'Fire Response',
      items: [
        {
          label: 'Gallons, tank, cubic water',
          value: `${totals['fire response'].gallonsWater} gal | ${totals['fire response'].tankWater} tank | ${totals['fire response'].cubicWater} m3`,
        },
        { label: 'Response fire accident', value: totals['fire response'].responseFireAccident },
        { label: 'Expenses', value: CURRENCY.format(totals['fire response'].expenses) },
      ],
    },
    {
      title: 'Notes',
      items: [
        { label: 'Trainings', value: totals.notes.trainings },
      ],
    },
    {
      title: 'Medical',
      items: [
        { label: 'Medical equipments used', value: totals.medical.medicalEquipmentsUsed },
        { label: 'Expenses', value: CURRENCY.format(totals.medical.expenses) },
      ],
    },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Report</h2>
          <p className="text-gray-500 mt-1">Overall report by period</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Filter</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          {period === 'monthly' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {period === 'quarterly' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quarter</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}

          {period === 'annual' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reportCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{card.title}</h3>
            <div className="space-y-2">
              {card.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Report
