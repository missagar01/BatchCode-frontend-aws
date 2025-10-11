"use client"

import { useState, useEffect } from "react"
import { Search, Filter } from 'lucide-react'
import AdminLayout from "../../components/layout/AdminLayout.jsx"

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState([])
  const [allData, setAllData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Configuration for your 5 sheets
  const sheetConfigs = [
    {
      id: 'sheet1',
      name: 'Sheet 1',
      spreadsheetId: '1lUIlWX_-RpSTcDm8I03AIdPipnHhjCmNXydL7PMVJ-4',
      sheetName: 'Form Responses 1',
      color: '#dc2626' // red-600
    },
    {
      id: 'sheet2',
      name: 'Sheet 2',
      spreadsheetId: '1YhPe8iE_t_1rTjQqsFZaochQ3Z6KEEmbgb1FnhazwiI',
      sheetName: 'Form Responses 1',
      color: '#b91c1c' // red-700
    },
    {
      id: 'sheet3',
      name: 'Sheet 3',
      spreadsheetId: '1UuaDD-FvtfXXELZtgkYGOI-C4U2rJdeIBTTd_GfIlvE',
      sheetName: 'Form Responses 1',
      color: '#991b1b' // red-800
    },
    {
      id: 'sheet4',
      name: 'Sheet 4',
      spreadsheetId: '19R6PqDCWv4TsIJ6kWArnm7mYlDUpbMG33O5k6MTmxoY',
      sheetName: 'Form Responses 1',
      color: '#7f1d1d' // red-900
    },
    {
      id: 'sheet5',
      name: 'Sheet 5',
      spreadsheetId: '15sokn5wLxx6wbO4ePg5F1J9ZfoTHwH4j8R-J1cVO6-s',
      sheetName: 'Form Responses 1',
      color: '#450a0a' // red-950
    }
  ]

  // Fetch data from all sheets
  const fetchAllSheetsData = async () => {
    setIsLoading(true)
    try {
      const allDataPromises = sheetConfigs.map(async (config) => {
        try {
          // Using Google Sheets API v4
          const apiKey = 'YOUR_GOOGLE_API_KEY'
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}?key=${apiKey}`

          const response = await fetch(url)
          if (!response.ok) throw new Error(`Failed to fetch ${config.name}`)

          const data = await response.json()

          // Convert rows to objects (assuming first row is headers)
          if (data.values && data.values.length > 1) {
            const headers = data.values[0]
            const rows = data.values.slice(1).map((row, index) => {
              const obj = { sheetId: config.id, sheetName: config.name, sheetColor: config.color, rowIndex: index }
              headers.forEach((header, colIndex) => {
                obj[header] = row[colIndex] || ''
              })
              return obj
            })
            return rows
          }
          return []
        } catch (error) {
          console.error(`Error fetching ${config.name}:`, error)
          return []
        }
      })

      const allResults = await Promise.all(allDataPromises)
      const flattenedData = allResults.flat()
      setAllData(flattenedData)
      setFilteredData(flattenedData)

    } catch (error) {
      console.error('Error fetching sheets data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Alternative method using CSV export (no API key required)
  const fetchAllSheetsDataCSV = async () => {
    setIsLoading(true)
    try {
      const allDataPromises = sheetConfigs.map(async (config) => {
        try {
          // CSV export method - make sure your sheets are published to web
          const csvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${config.sheetName}`

          const response = await fetch(csvUrl)
          if (!response.ok) throw new Error(`Failed to fetch ${config.name}`)

          const csvText = await response.text()
          const rows = parseCSV(csvText)

          // Add sheet metadata to each row
          return rows.map((row, index) => ({
            ...row,
            sheetId: config.id,
            sheetName: config.name,
            sheetColor: config.color,
            rowIndex: index
          }))
        } catch (error) {
          console.error(`Error fetching ${config.name}:`, error)
          return []
        }
      })

      const allResults = await Promise.all(allDataPromises)
      const flattenedData = allResults.flat()
      setAllData(flattenedData)
      setFilteredData(flattenedData)

    } catch (error) {
      console.error('Error fetching sheets data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // CSV parser function
  const parseCSV = (csvText) => {
    const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '')
    if (rows.length === 0) return []

    const headers = rows[0].split(',').map(header => header.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i].split(',').map(cell => cell.trim().replace(/"/g, ''))
      const rowObject = {}

      headers.forEach((header, index) => {
        rowObject[header] = rowData[index] || ''
      })

      data.push(rowObject)
    }

    return data
  }

  // Search functionality - searches across all sheets by unique code
  const handleSearch = (query) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredData(allData)
      return
    }

    const filtered = allData.filter(item => {
      // Search in Unique Code field and other relevant fields
      const searchableFields = ['Unique Code', 'unique_code', 'Code', 'ID', 'Id']

      return searchableFields.some(field => {
        const value = item[field]
        return value && value.toString().toLowerCase().includes(query.toLowerCase())
      })
    })

    setFilteredData(filtered)
  }

  // Group data by sheet for display
  const groupDataBySheet = (data) => {
    const grouped = {}
    data.forEach(item => {
      if (!grouped[item.sheetId]) {
        grouped[item.sheetId] = {
          sheetName: item.sheetName,
          sheetColor: item.sheetColor,
          data: []
        }
      }
      grouped[item.sheetId].data.push(item)
    })
    return grouped
  }

  useEffect(() => {
    // Use either fetch method:
    fetchAllSheetsDataCSV() // Using CSV method (no API key required)
    // fetchAllSheetsData() // Using Sheets API v4 (requires API key)
  }, [])

  const groupedData = groupDataBySheet(filteredData)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-700">
            Multi-Sheet Dashboard
          </h1>
          <div className="text-sm text-red-600">
            {allData.length} total records across {sheetConfigs.length} sheets
          </div>
        </div>

        {/* Search Section */}
        <div className="rounded-lg border border-red-200 shadow-md bg-white">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 p-4">
            <h3 className="text-gray-700 font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Across All Sheets
            </h3>
            <p className="text-gray-600 text-sm">
              Search by Unique Code to find related data across all sheets
            </p>
          </div>
          <div className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Unique Code to search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-md border border-red-100 p-3 focus:border-red-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Filter className="h-4 w-4" />
                {filteredData.length} records found
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-red-600">Loading data from all sheets...</p>
          </div>
        )}

        {/* Results by Sheet */}
        <div className="space-y-6">
          {Object.entries(groupedData).map(([sheetId, sheetInfo]) => (
            <div key={sheetId} className="rounded-lg border border-red-200 shadow-md bg-white">
              {/* Sheet Header */}
              <div
                className="border-b border-red-200 p-4 text-white"
                style={{ backgroundColor: sheetInfo.sheetColor }}
              >
                <h3 className="font-medium flex items-center justify-between">
                  <span>{sheetInfo.sheetName}</span>
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                    {sheetInfo.data.length} records
                  </span>
                </h3>
              </div>

              {/* Sheet Data */}
              <div className="p-4">
                {sheetInfo.data.length === 0 ? (
                  <p className="text-center text-red-600 py-4">
                    No matching records found in this sheet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <table className="min-w-full divide-y divide-red-100">
                        <thead className="bg-red-50">
                          <tr>
                            {Object.keys(sheetInfo.data[0]).map(key => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-red-100">
                          {sheetInfo.data.map((row, index) => (
                            <tr key={index} className="hover:bg-red-50">
                              {Object.entries(row).map(([key, value]) => (
                                <td
                                  key={key}
                                  className="px-4 py-3 text-sm text-red-900 whitespace-nowrap"
                                >
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {sheetInfo.data.map((row, index) => (
                        <div
                          key={index}
                          className="border border-red-200 rounded-lg p-4 bg-white"
                        >
                          {Object.entries(row).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-red-100 last:border-b-0">
                              <span className="text-sm font-medium text-red-700">{key}:</span>
                              <span className="text-sm text-red-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results State */}
        {!isLoading && filteredData.length === 0 && allData.length > 0 && (
          <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700">No records found matching your search criteria.</p>
            <p className="text-red-600 text-sm mt-1">
              Try searching with a different Unique Code
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}