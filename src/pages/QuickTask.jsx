"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft, Edit, Save, Camera, Plus } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout";

// Configuration object - Move all configurations here
const CONFIG = {
    // Google Apps Script URL
    APPS_SCRIPT_URL:
        "https://script.google.com/macros/s/AKfycbziAUgwf-sGSqyp5WnMOBFkzR2XLwxbSrukso1J6f06RCnQAo86L9urdW5QV66MddEk/exec",

    // Google Drive folder ID for file uploads
    DRIVE_FOLDER_ID: "",

    // Sheet names
    SOURCE_SHEET_NAME: "Form responses 1",
    TARGET_SHEET_NAME: "DELEGATION DONE",

    // Page configuration
    PAGE_CONFIG: {
        title: "SMS Register",
        // historyTitle: "DELEGATION Task History",
        description: "Showing all SMS Register",
        historyDescription: "Read-only view of completed tasks with submission history",
    },
}

// Debounce hook for search optimization
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

function DelegationDataPage() {
    const [accountData, setAccountData] = useState([])
    const [selectedItems, setSelectedItems] = useState(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [additionalData, setAdditionalData] = useState({})
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [remarksData, setRemarksData] = useState({})
    const [historyData, setHistoryData] = useState([])
    const [showHistory, setShowHistory] = useState(false)
    const [statusData, setStatusData] = useState({})
    const [nextTargetDate, setNextTargetDate] = useState({})
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    
    // NEW: State for process form
    const [showProcessForm, setShowProcessForm] = useState(false)
    const [processFormData, setProcessFormData] = useState({
        sequenceNumber: "",
        laddleNumber: "",
        laddleNumberSelect: "",
        smsHead: "",
        furnaceNumber: "",
        remark: "",
        picture: null,
        shiftIncharge: "",
        temperature: ""
    })

    // Debounced search term for better performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    const formatDateToDDMMYYYY = useCallback((date) => {
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }, [])

    
    const parseGoogleSheetsDate = useCallback(
        (dateStr) => {
            if (!dateStr) return ""

            // If it's already in DD/MM/YYYY format, return as is
            if (typeof dateStr === "string" && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                // Ensure proper padding for DD/MM/YYYY format
                const parts = dateStr.split("/")
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, "0")
                    const month = parts[1].padStart(2, "0")
                    const year = parts[2]
                    return `${day}/${month}/${year}`
                }
                return dateStr
            }

            // Handle Google Sheets Date() format
            if (typeof dateStr === "string" && dateStr.startsWith("Date(")) {
                const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateStr)
                if (match) {
                    const year = Number.parseInt(match[1], 10)
                    const month = Number.parseInt(match[2], 10)
                    const day = Number.parseInt(match[3], 10)
                    return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
                }
            }

            // Handle other date formats
            try {
                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                    return formatDateToDDMMYYYY(date)
                }
            } catch (error) {
                console.error("Error parsing date:", error)
            }

            // If all else fails, return the original string
            return dateStr
        },
        [formatDateToDDMMYYYY],
    )



    // Function to create a proper date object for Google Sheets
    const createGoogleSheetsDate = useCallback((date) => {
        // Return a Date object that Google Sheets can properly interpret
        return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    }, [])

    // Function to format date for Google Sheets submission
    const formatDateForGoogleSheets = useCallback((date) => {
        // Create a properly formatted date string that Google Sheets will recognize as a date
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()

        // Return in format that Google Sheets recognizes as date: DD/MM/YYYY
        // But we'll also include the raw date object for better compatibility
        return {
            formatted: `${day}/${month}/${year}`,
            dateObject: new Date(year, date.getMonth(), date.getDate()),
            // ISO format as fallback
            iso: date.toISOString().split('T')[0],
            // Special format for Google Sheets API
            googleSheetsValue: `=DATE(${year},${month},${day})`
        }
    }, [])

    // Function to convert DD/MM/YYYY string to Google Sheets date format
    const convertToGoogleSheetsDate = useCallback((dateString) => {
        if (!dateString || typeof dateString !== "string") return ""

        // If already in DD/MM/YYYY format
        if (dateString.includes("/")) {
            const [day, month, year] = dateString.split("/")
            const date = new Date(year, month - 1, day)
            if (!isNaN(date.getTime())) {
                return formatDateForGoogleSheets(date)
            }
        }

        // If in YYYY-MM-DD format (from HTML date input)
        if (dateString.includes("-")) {
            const [year, month, day] = dateString.split("-")
            const date = new Date(year, month - 1, day)
            if (!isNaN(date.getTime())) {
                return formatDateForGoogleSheets(date)
            }
        }

        return { formatted: dateString, dateObject: null, iso: "", googleSheetsValue: dateString }
    }, [formatDateForGoogleSheets])

    const isEmpty = useCallback((value) => {
        return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
    }, [])

    useEffect(() => {
        const role = sessionStorage.getItem("role")
        const user = sessionStorage.getItem("username")
        setUserRole(role || "")
        setUsername(user || "")
    }, [])


    const formatDateForDisplay = useCallback(
        (dateStr) => {
            if (!dateStr) return "—"

            // If it's already in proper DD/MM/YYYY format, return as is
            if (typeof dateStr === "string" && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                return dateStr
            }

            // Try to parse and reformat
            return parseGoogleSheetsDate(dateStr) || "—"
        },
        [parseGoogleSheetsDate],
    )

    const parseDateFromDDMMYYYY = useCallback((dateStr) => {
        if (!dateStr || typeof dateStr !== "string") return null
        const parts = dateStr.split("/")
        if (parts.length !== 3) return null
        return new Date(parts[2], parts[1] - 1, parts[0])
    }, [])

    const sortDateWise = useCallback(
        (a, b) => {
            const dateStrA = a["col6"] || ""
            const dateStrB = b["col6"] || ""
            const dateA = parseDateFromDDMMYYYY(dateStrA)
            const dateB = parseDateFromDDMMYYYY(dateStrB)
            if (!dateA) return 1
            if (!dateB) return -1
            return dateA.getTime() - dateB.getTime()
        },
        [parseDateFromDDMMYYYY],
    )

    const resetFilters = useCallback(() => {
        setSearchTerm("")
        setStartDate("")
        setEndDate("")
    }, [])

    // Get color based on data from column R
    const getRowColor = useCallback((colorCode) => {
        if (!colorCode) return "bg-white"

        const code = colorCode.toString().toLowerCase()
        switch (code) {
            case "red":
                return "bg-red-50 border-l-4 border-red-400"
            case "yellow":
                return "bg-yellow-50 border-l-4 border-yellow-400"
            case "green":
                return "bg-green-50 border-l-4 border-green-400"
            case "blue":
                return "bg-blue-50 border-l-4 border-blue-400"
            default:
                return "bg-white"
        }
    }, [])

    
   const fetchSheetData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Parallel fetch both sheets for better performance
            const [mainResponse, historyResponse] = await Promise.all([
                fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.SOURCE_SHEET_NAME}&action=fetch`),
                fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.TARGET_SHEET_NAME}&action=fetch`).catch(() => null),
            ])

            if (!mainResponse.ok) {
                throw new Error(`Failed to fetch data: ${mainResponse.status}`)
            }

            // Process main data
            const mainText = await mainResponse.text()
            let data
            try {
                data = JSON.parse(mainText)
            } catch (parseError) {
                const jsonStart = mainText.indexOf("{")
                const jsonEnd = mainText.lastIndexOf("}")
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonString = mainText.substring(jsonStart, jsonEnd + 1)
                    data = JSON.parse(jsonString)
                } else {
                    throw new Error("Invalid JSON response from server")
                }
            }

            const pendingAccounts = []

            let rows = []
            if (data.table && data.table.rows) {
                rows = data.table.rows
            } else if (Array.isArray(data)) {
                rows = data
            } else if (data.values) {
                rows = data.values.map((row) => ({ c: row.map((val) => ({ v: val })) }))
            }

            rows.forEach((row, rowIndex) => {
                if (rowIndex === 0) return // Skip header row

                let rowValues = []
                if (row.c) {
                    rowValues = row.c.map((cell) => (cell && cell.v !== undefined ? cell.v : ""))
                } else if (Array.isArray(row)) {
                    rowValues = row
                } else {
                    return
                }

                // ✅ REMOVED USERNAME VALIDATION - ALL USERS SEE ALL DATA
                const googleSheetsRowIndex = rowIndex + 1
                const taskId = rowValues[1] || ""
                const stableId = taskId
                    ? `task_${taskId}_${googleSheetsRowIndex}`
                    : `row_${googleSheetsRowIndex}_${Math.random().toString(36).substring(2, 15)}`

                const rowData = {
                    _id: stableId,
                    _rowIndex: googleSheetsRowIndex,
                    _taskId: taskId,
                }

                // Map all columns
                for (let i = 0; i < 18; i++) {
                    if (i === 0) {
                        rowData[`col${i}`] = rowValues[i] ? parseGoogleSheetsDate(String(rowValues[i])) : ""
                    } else {
                        rowData[`col${i}`] = rowValues[i] || ""
                    }
                }

                pendingAccounts.push(rowData)
            })

            setAccountData(pendingAccounts)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching sheet data:", error)
            setError("Failed to load account data: " + error.message)
            setLoading(false)
        }
    }, [formatDateToDDMMYYYY, parseGoogleSheetsDate, parseDateFromDDMMYYYY, isEmpty])



    // NEW: Handle Add SMS Report button click
    const handleAddSMSReport = useCallback(() => {
        // Reset form data for new entry
        setProcessFormData({
            sequenceNumber: "",
            laddleNumber: "",
            laddleNumberSelect: "",
            smsHead: "",
            furnaceNumber: "",
            remark: "",
            picture: null,
            shiftIncharge: username || "", // Pre-fill with current username
            temperature: ""
        })
        setShowProcessForm(true)
    }, [username])

    // NEW: Handle process form input changes
    const handleProcessFormChange = useCallback((field, value) => {
        setProcessFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }, [])

    // NEW: Handle picture upload
    const handlePictureUpload = useCallback((e) => {
        const file = e.target.files[0]
        if (file) {
            setProcessFormData(prev => ({
                ...prev,
                picture: file
            }))
        }
    }, [])

    // NEW: Handle process form submission for new SMS Report
    const handleProcessSubmit = useCallback(async () => {
        setIsSubmitting(true)
        try {
            // Prepare data for submission to Google Sheets
            const today = new Date()
            const formattedDate = formatDateForGoogleSheets(today)

            const formData = new FormData()
            formData.append("action", "insert")
            formData.append("sheetName", CONFIG.SOURCE_SHEET_NAME)
            
            // Create row data for new SMS Report
            const rowData = [
                formattedDate.formatted, // Date
                processFormData.sequenceNumber, // Sequence Number
                processFormData.laddleNumber || processFormData.laddleNumberSelect, // Laddle Number
                processFormData.smsHead, // SMS Head
                processFormData.furnaceNumber, // Furnace Number
                processFormData.remark, // Remarks
                "", // Picture URL (will be updated after upload)
                processFormData.shiftIncharge, // Shift Incharge
                processFormData.temperature, // Temperature
                "", // Unique Code (can be auto-generated if needed)
            ]

            formData.append("rowData", JSON.stringify(rowData))

            // If picture is uploaded, handle file upload first
            if (processFormData.picture) {
                const reader = new FileReader()
                reader.onload = async () => {
                    const base64Data = reader.result
                    const uploadFormData = new FormData()
                    uploadFormData.append("action", "uploadFile")
                    uploadFormData.append("base64Data", base64Data)
                    uploadFormData.append("fileName", `sms_report_${Date.now()}.jpg`)
                    uploadFormData.append("mimeType", processFormData.picture.type)
                    uploadFormData.append("folderId", CONFIG.DRIVE_FOLDER_ID)

                    const uploadResponse = await fetch(CONFIG.APPS_SCRIPT_URL, {
                        method: "POST",
                        body: uploadFormData,
                    })

                    const uploadResult = await uploadResponse.json()
                    if (uploadResult.success) {
                        // Update row data with picture URL
                        rowData[6] = uploadResult.fileUrl
                        formData.set("rowData", JSON.stringify(rowData))
                    }

                    // Submit the form data
                    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                        method: "POST",
                        body: formData
                    })
                    
                    if (response.ok) {
                        setSuccessMessage("SMS Report added successfully!")
                        setShowProcessForm(false)
                        fetchSheetData() // Refresh data
                    } else {
                        throw new Error("Failed to add SMS Report")
                    }
                }
                reader.readAsDataURL(processFormData.picture)
            } else {
                // Submit without picture
                const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                    method: "POST",
                    body: formData
                })
                
                if (response.ok) {
                    setSuccessMessage("SMS Report added successfully!")
                    setShowProcessForm(false)
                    fetchSheetData() // Refresh data
                } else {
                    throw new Error("Failed to add SMS Report")
                }
            }
        } catch (error) {
            console.error("Error adding SMS Report:", error)
            setError("Failed to add SMS Report: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }, [processFormData, formatDateForGoogleSheets, fetchSheetData])

    // NEW: Close process form
    const handleCloseProcessForm = useCallback(() => {
        setShowProcessForm(false)
        setProcessFormData({
            sequenceNumber: "",
            laddleNumber: "",
            laddleNumberSelect: "",
            smsHead: "",
            furnaceNumber: "",
            remark: "",
            picture: null,
            shiftIncharge: "",
            temperature: ""
        })
    }, [])

    // Optimized filtered data with debounced search
    const filteredAccountData = useMemo(() => {
        const filtered = debouncedSearchTerm
            ? accountData.filter((account) =>
                Object.values(account).some(
                    (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
                ),
            )
            : accountData

        return filtered.sort(sortDateWise)
    }, [accountData, debouncedSearchTerm, sortDateWise])

 

    useEffect(() => {
        fetchSheetData()
    }, [fetchSheetData])

    const selectedItemsCount = selectedItems.size

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-red-500">
                        {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
                    </h1>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={showHistory ? "Search by Task ID..." : "Search tasks..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                    </div>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            {successMessage}
                        </div>
                        <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

               {/* Process Form Modal */}
{showProcessForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-red-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New SMS Report</h3>
                <button onClick={handleCloseProcessForm} className="text-white hover:text-gray-200">
                    <X className="h-5 w-5" />
                </button>
            </div>
            
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sequence Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sequence Number *
                        </label>
                        <select
                            value={processFormData.sequenceNumber}
                            onChange={(e) => handleProcessFormChange("sequenceNumber", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select Sequence Number</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                            <option value="H">H</option>
                        </select>
                    </div>

                    {/* Laddle Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Laddle Number *
                        </label>
                        <select
                            value={processFormData.laddleNumber}
                            onChange={(e) => handleProcessFormChange("laddleNumber", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select Laddle Number</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                            <option value="13">13</option>
                            <option value="14">14</option>
                            <option value="15">15</option>
                        </select>
                    </div>

                    {/* Furnace Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Furnace Number *
                        </label>
                        <select
                            value={processFormData.furnaceNumber}
                            onChange={(e) => handleProcessFormChange("furnaceNumber", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select Furnace Number</option>
                            <option value="Furnace1">Furnace1</option>
                            <option value="Furnace2">Furnace2</option>
                            <option value="Furnace3">Furnace3</option>
                            <option value="Furnace4">Furnace4</option>
                            <option value="Furnace5">Furnace5</option>
                            <option value="Furnace6">Furnace6</option>
                            <option value="Furnace7">Furnace7</option>
                        </select>
                    </div>

                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature *
                        </label>
                        <input
                            type="text"
                            value={processFormData.temperature}
                            onChange={(e) => handleProcessFormChange("temperature", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        />
                    </div>

                    {/* Shift Incharge */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shift Incharge *
                        </label>
                        <select
                            value={processFormData.shiftIncharge}
                            onChange={(e) => handleProcessFormChange("shiftIncharge", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select Shift Incharge</option>
                            <option value="Akhilesh">Akhilesh</option>
                            <option value="Prakash Kumar">Prakash Kumar</option>
                            <option value="Hardhan Mandal">Hardhan Mandal</option>
                            <option value="Sukhan Vishwakarma">Sukhan Vishwakarma</option>
                            <option value="Ashwani Verma">Ashwani Verma</option>
                            <option value="Deepak Gupta">Deepak Gupta</option>
                            <option value="Pramod Thakur">Pramod Thakur</option>
                            <option value="Parsuram Jain">Parsuram Jain</option>
                            <option value="Jaspal Kurrey">Jaspal Kurrey</option>
                        </select>
                    </div>

                    {/* SMS Head */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMS Head *
                        </label>
                        <select
                            value={processFormData.smsHead}
                            onChange={(e) => handleProcessFormChange("smsHead", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        >
                            <option value="">Select SMS Head</option>
                            <option value="Suman Jha">Suman Jha</option>
                            <option value="Baldev Singh Saini">Baldev Singh Saini</option>
                        </select>
                    </div>

                    {/* Picture Upload */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Picture
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePictureUpload}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            {processFormData.picture && (
                                <Camera className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remarks
                        </label>
                        <textarea
                            value={processFormData.remarks}
                            onChange={(e) => handleProcessFormChange("remarks", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
                <button
                    onClick={handleCloseProcessForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    onClick={handleProcessSubmit}
                    disabled={isSubmitting || !processFormData.sequenceNumber || !processFormData.laddleNumber || !processFormData.furnaceNumber || !processFormData.temperature || !processFormData.shiftIncharge || !processFormData.smsHead}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Adding..." : "Add SMS Report"}
                </button>
            </div>
        </div>
    </div>
)}
                <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
                    {/* UPDATED: Header with Add SMS Report Button */}
                    <div className="bg-gradient-to-r from-red-500 to-red-400 border-b border-red-200 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <p className="text-white text-m">
                                    {showHistory
                                        ? `${CONFIG.PAGE_CONFIG.historyDescription} for ${userRole === "admin" ? "all" : "your"} tasks`
                                        : CONFIG.PAGE_CONFIG.description}
                                </p>
                                {!showHistory && (
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white text-black-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
                                            {filteredAccountData.length}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* NEW: Add SMS Report Button */}
                            {!showHistory && (
                                <button
                                    onClick={handleAddSMSReport}
                                    className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add SMS Report
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
                            <p className="text-red-600">Loading data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
                            {error}{" "}
                            <button className="underline ml-2" onClick={() => window.location.reload()}>
                                Try again
                            </button>
                        </div>
                    ) : showHistory ? (
                        <>
                            {/* Simplified History Filters - Only Date Range */}
                            <div className="p-4 border-b border-purple-100 bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
                                    <div className="flex flex-col">
                                        <div className="mb-2 flex items-center">
                                            <span className="text-sm font-medium text-purple-700">Filter by Date Range:</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                                            <div className="flex items-center">
                                                <label htmlFor="start-date" className="text-sm text-gray-700 mr-1">
                                                    From
                                                </label>
                                                <input
                                                    id="start-date"
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="text-sm border border-gray-200 rounded-md p-1 w-full sm:w-auto"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <label htmlFor="end-date" className="text-sm text-gray-700 mr-1">
                                                    To
                                                </label>
                                                <input
                                                    id="end-date"
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="text-sm border border-gray-200 rounded-md p-1 w-full sm:w-auto"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {(startDate || endDate || searchTerm) && (
                                        <button
                                            onClick={resetFilters}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm w-full sm:w-auto"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (

                        < div className="overflow-x-auto horizontal-scroll-container">
                            {/* Desktop Table */}
                            <div className="overflow-x-auto">
                                {/* Desktop Table */}
                                <div className="hidden md:block relative">
                                    <div className="overflow-y-auto max-h-96">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {/* REMOVED: Action Column */}
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Date
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Sequence Number
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Laddel Number
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        SMS Head
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Furnace Number
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Remarks
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Picture
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Shift Incharge
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Temperature
                                                    </th>
                                                    <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Unique Code
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredAccountData.length > 0 ? (
                                                    filteredAccountData.map((account) => {
                                                        const isSelected = selectedItems.has(account._id)
                                                        const rowColorClass = getRowColor(account["col17"])
                                                        return (
                                                            <tr
                                                                key={account._id}
                                                                className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50 ${rowColorClass}`}
                                                            >
                                                                {/* REMOVED: Action Column with Process Button */}
                                                                <td className={`px-6 py-4 whitespace-nowrap ${account["col17"] ? "bg-yellow-50" : ""}`}>
                                                                    <div className="text-sm text-gray-900">{formatDateForDisplay(account["col0"])}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col1"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col2"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col3"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col4"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col5"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {account["col6"] ? (
                                                                        <a
                                                                            href={account["col6"]}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                                                        >
                                                                            <img
                                                                                src={account["col6"] || "/api/placeholder/32/32"}
                                                                                alt=""
                                                                                className=""
                                                                            />
                                                                            View
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-400">No attachment</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col7"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col8"] || "—"}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{account["col10"] || "—"}</div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                                                            {searchTerm ? "No tasks matching your search" : "No pending tasks found"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Table View */}
                                <div className="md:hidden relative">
                                    <div className="overflow-y-auto max-h-96">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {/* REMOVED: Action Column */}
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Date
                                                    </th>
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Seq No
                                                    </th>
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Laddel No
                                                    </th>
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        SMS Head
                                                    </th>
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Furnace No
                                                    </th>
                                                    <th className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10">
                                                        Remarks
                                                    </th>
                                                    <th className={`sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10 ${!accountData["col17"] ? "bg-yellow-50" : "bg-gray-50"}`}>
                                                        Picture
                                                    </th>
                                                    <th className={`sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10 ${!accountData["col17"] ? "bg-green-50" : "bg-gray-50"}`}>
                                                        Shift Incharge
                                                    </th>
                                                    <th className={`sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10 ${!accountData["col17"] ? "bg-blue-50" : "bg-gray-50"}`}>
                                                        Temp
                                                    </th>
                                                    <th className={`sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10 ${!accountData["col17"] ? "bg-purple-50" : "bg-gray-50"}`}>
                                                        Unique Code
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredAccountData.length > 0 ? (
                                                    filteredAccountData.map((account) => {
                                                        const isSelected = selectedItems.has(account._id);
                                                        const rowColorClass = getRowColor(account["col17"]);
                                                        return (
                                                            <tr key={account._id} className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50 ${rowColorClass}`}>
                                                                {/* REMOVED: Action Column with Process Button */}
                                                                <td className={`px-4 py-4 whitespace-nowrap ${account["col17"] ? "bg-yellow-50" : ""}`}>
                                                                    <div className="text-sm text-gray-900">{formatDateForDisplay(account["col0"])}</div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col1"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col2"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col3"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col4"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col5"] || "—"}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {account["col6"] ? (
                                                                        <a
                                                                            href={account["col6"]}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-600 hover:text-blue-800 flex items-center"
                                                                        >
                                                                            <img
                                                                                src={account["col6"] || "/api/placeholder/32/32"}
                                                                                alt=""
                                                                                className=""
                                                                            />
                                                                            View
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-400">No attachment</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col7"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col8"] || "—"}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {account["col10"] || "—"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                                                            {searchTerm ? "No tasks matching your search" : "No pending tasks found"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    )
}

export default DelegationDataPage