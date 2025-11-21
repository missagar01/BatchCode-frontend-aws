"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X, Search, History, ArrowLeft, Edit, Save, Camera, AlertCircle } from "lucide-react"
import AdminLayout from "../components/layout/AdminLayout";
import { hotCoilAPI } from "../Api/hotCoilAPI";
import { smsAPI } from "../Api/smsAPI";

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

function HotCoilPage() {
  const [pendingSMSData, setPendingSMSData] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState("")
  const [showPopup, setShowPopup] = useState(false)

  // State for process form
  const [showProcessForm, setShowProcessForm] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [processFormData, setProcessFormData] = useState({
    submission_type: "Hot Coil",
    sms_short_code: "",
    size: "",
    mill_incharge: "",
    quality_supervisor: "",
    quality_supervisor_other: "",
    electrical_dc_operator: "",
    strand1_temperature: "",
    strand2_temperature: "",
    shift_supervisor: "",
    remarks: ""
  })

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Auto-hide popup after 2 seconds
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false)
        setPopupMessage("")
        setPopupType("")
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [showPopup])

  const showPopupMessage = (message, type) => {
    setPopupMessage(message)
    setPopupType(type)
    setShowPopup(true)
  }

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // Fetch pending SMS data (SMS Register records that don't have Hot Coil entries)
  const fetchPendingSMSData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // console.log('🔄 Fetching pending SMS data for Hot Coil...')

      // Fetch SMS Register data
      const smsResponse = await smsAPI.getSMSHistory()
      let smsData = [];

      // Handle different response structures
      if (Array.isArray(smsResponse.data)) {
        smsData = smsResponse.data;
      } else if (smsResponse.data && Array.isArray(smsResponse.data.data)) {
        smsData = smsResponse.data.data;
      } else if (smsResponse.data && smsResponse.data.success && Array.isArray(smsResponse.data.data)) {
        smsData = smsResponse.data.data;
      } else {
        smsData = [];
      }

      // console.log('✅ SMS Data fetched:', smsData.length, 'records')

      // Fetch existing Hot Coil entries to filter out already processed SMS records
      const hotCoilResponse = await hotCoilAPI.getHotCoilHistory()
      let existingEntries = [];

      // Handle different response structures for Hot Coil data
      if (Array.isArray(hotCoilResponse.data)) {
        existingEntries = hotCoilResponse.data;
      } else if (hotCoilResponse.data && Array.isArray(hotCoilResponse.data.data)) {
        existingEntries = hotCoilResponse.data.data;
      } else if (hotCoilResponse.data && hotCoilResponse.data.success && Array.isArray(hotCoilResponse.data.data)) {
        existingEntries = hotCoilResponse.data.data;
      }

      // console.log('Hot Coil Entries fetched:', existingEntries.length, 'records')

      // Get all SMS short codes that already have Hot Coil entries
      const processedShortCodes = new Set(
        existingEntries
          .map(hotCoilEntry => hotCoilEntry.sms_short_code)
          .filter(code => code) // Remove null/undefined
      )

      // console.log('✅ Processed SMS Short Codes:', Array.from(processedShortCodes))

      // Filter SMS data to only show records that don't have Hot Coil entries
      const pendingData = smsData.filter(smsRecord => {
        // Generate short code for SMS record
        const smsShortCode = smsRecord.unique_code || generateShortCode(smsRecord)

        // Check if this SMS short code exists in Hot Coil entries
        const isProcessed = processedShortCodes.has(smsShortCode)

        // console.log(`📋 SMS Record: ${smsShortCode} - Processed: ${isProcessed}`)

        return !isProcessed
      })

      // console.log('✅ Final pending data:', pendingData.length, 'records')
      setPendingSMSData(pendingData)
      setLoading(false)

    } catch (error) {
      console.error("❌ Error fetching pending SMS data:", error)
      showPopupMessage("Error fetching pending SMS data! / लंबित एसएमएस डेटा प्राप्त करने में त्रुटि!", "warning")
      setPendingSMSData([])
      setLoading(false)
    }
  }, [])

  // Fetch Hot Coil history data
  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true)
      // console.log('🔄 Fetching Hot Coil history data...')

      const response = await hotCoilAPI.getHotCoilHistory()
      // console.log('📦 Raw Hot Coil API response:', response)
      // console.log('📊 Response data:', response.data)

      let data = [];

      // Handle different response structures
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's a single object, wrap it in array
        data = [response.data];
      } else {
        data = [];
      }

      // console.log('✅ Processed Hot Coil history data:', data)
      setHistoryData(data)
      setLoading(false)
    } catch (error) {
      console.error("❌ Error fetching Hot Coil history:", error)
      console.error("🔧 Error details:", error.response?.data)
      showPopupMessage("Error fetching Hot Coil history! / हॉट कॉइल इतिहास प्राप्त करने में त्रुटि!", "warning")
      setHistoryData([]) // Set empty array on error
      setLoading(false)
    }
  }, [])

  // Handle process button click for pending SMS records
  const handleProcessClick = useCallback((smsRecord) => {
    setSelectedRow(smsRecord)

    // Generate short code for SMS record
    const shortCode = smsRecord.unique_code || generateShortCode(smsRecord)

    // Pre-fill form with SMS data
    setProcessFormData({
      submission_type: "Hot Coil",
      sms_short_code: shortCode,
      size: "",
      mill_incharge: "",
      quality_supervisor: "",
      quality_supervisor_other: "",
      electrical_dc_operator: "",
      strand1_temperature: "",
      strand2_temperature: "",
      shift_supervisor: username || "",
      remarks: ""
    })
    setShowProcessForm(true)
  }, [username])

  // Handle process form input changes
  const handleProcessFormChange = useCallback((field, value) => {
    setProcessFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Form validation
  const validateForm = () => {
    const requiredFields = [
      'sms_short_code', 'size', 'mill_incharge', 'quality_supervisor',
      'electrical_dc_operator', 'strand1_temperature', 'strand2_temperature', 'shift_supervisor'
    ]

    for (let field of requiredFields) {
      if (!processFormData[field]) {
        showPopupMessage(`Please fill all required fields! / कृपया सभी आवश्यक फ़ील्ड्स भरें!`, "warning")
        return false
      }
    }

    // Handle "Other" quality supervisor
    if (processFormData.quality_supervisor === "Other" && !processFormData.quality_supervisor_other) {
      showPopupMessage("Please specify the quality supervisor name! / कृपया गुणवत्ता पर्यवेक्षक का नाम निर्दिष्ट करें!", "warning")
      return false
    }

    return true
  }

  const handleProcessSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare submission data according to your Postman API structure
      const submissionData = {
        submission_type: "Hot Coil",
        sms_short_code: processFormData.sms_short_code,
        size: processFormData.size,
        mill_incharge: processFormData.mill_incharge,
        quality_supervisor: processFormData.quality_supervisor === "Other"
          ? processFormData.quality_supervisor_other
          : processFormData.quality_supervisor,
        electrical_dc_operator: processFormData.electrical_dc_operator,
        strand1_temperature: processFormData.strand1_temperature,
        strand2_temperature: processFormData.strand2_temperature,
        shift_supervisor: processFormData.shift_supervisor,
        remarks: processFormData.remarks || ""
      }

      // console.log('🔍 Submission data:', submissionData)

      const response = await hotCoilAPI.submitHotCoil(submissionData)

      if (response.data.success) {
        showPopupMessage("Hot Coil data submitted successfully! / हॉट कॉइल डेटा सफलतापूर्वक जमा किया गया!", "success")
        setShowProcessForm(false)

        // Refresh BOTH tabs data to ensure consistency
        await Promise.all([
          fetchHistoryData(),
          fetchPendingSMSData()
        ])

        // console.log('✅ Both tabs refreshed after submission')
      }
    } catch (error) {
      console.error("Submission error details:", error.response?.data)
      showPopupMessage(
        error.response?.data?.message || "Submission failed. Check console for details. / सबमिशन विफल। विवरण के लिए कंसोल जांचें।",
        "warning"
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [processFormData, fetchHistoryData, fetchPendingSMSData])

  // Close process form
  const handleCloseProcessForm = useCallback(() => {
    setShowProcessForm(false)
    setSelectedRow(null)
    setProcessFormData({
      submission_type: "Hot Coil",
      sms_short_code: "",
      size: "",
      mill_incharge: "",
      quality_supervisor: "",
      quality_supervisor_other: "",
      electrical_dc_operator: "",
      strand1_temperature: "",
      strand2_temperature: "",
      shift_supervisor: "",
      remarks: ""
    })
  }, [])

  // Toggle between pending and history views
  const toggleView = useCallback(() => {
    setShowHistory(prev => !prev)
    setSearchTerm("") // Clear search when switching views
  }, [])

  // Fetch appropriate data when view changes
  useEffect(() => {
    if (showHistory) {
      fetchHistoryData()
    } else {
      fetchPendingSMSData()
    }
  }, [showHistory, fetchHistoryData, fetchPendingSMSData])

  const formatIndianDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // Format to DD-MM-YYYY HH:MM:SS with proper padding
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const second = date.getSeconds().toString().padStart(2, '0');

      return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  }

  // Function to generate short code if not present
  const generateShortCode = (recordData) => {
    if (recordData.unique_code) return recordData.unique_code;

    const date = recordData.createdAt ? recordData.createdAt.replace(/-/g, '').slice(0, 8) : '';
    const sequence = recordData.sequence_number || 'X';
    const laddleNum = recordData.laddle_number || '0';
    return `SMS${date}${sequence}${laddleNum}`;
  }

  // Filter data based on search term
  const filteredPendingData = useMemo(() => {
    if (!debouncedSearchTerm) return pendingSMSData;

    return pendingSMSData.filter(record => {
      const searchLower = debouncedSearchTerm.toLowerCase()
      return (
        String(record.unique_code || generateShortCode(record)).toLowerCase().includes(searchLower) ||
        formatIndianDateTime(record.createdAt).toLowerCase().includes(searchLower) ||
        String(record.sequence_number || '').toLowerCase().includes(searchLower) ||
        String(record.laddle_number || '').toLowerCase().includes(searchLower) ||
        String(record.furnace_number || '').toLowerCase().includes(searchLower) ||
        String(record.temperature || '').toLowerCase().includes(searchLower)
      )
    })
  }, [pendingSMSData, debouncedSearchTerm])

  const filteredHistoryData = useMemo(() => {
    if (!debouncedSearchTerm) return historyData;

    return historyData.filter(record => {
      const searchLower = debouncedSearchTerm.toLowerCase()
      return (
        String(record.sms_short_code || '').toLowerCase().includes(searchLower) ||
        String(record.size || '').toLowerCase().includes(searchLower) ||
        String(record.mill_incharge || '').toLowerCase().includes(searchLower) ||
        String(record.quality_supervisor || '').toLowerCase().includes(searchLower) ||
        String(record.electrical_dc_operator || '').toLowerCase().includes(searchLower) ||
        String(record.strand1_temperature || '').toLowerCase().includes(searchLower) ||
        String(record.strand2_temperature || '').toLowerCase().includes(searchLower) ||
        String(record.shift_supervisor || '').toLowerCase().includes(searchLower) ||
        String(record.remarks || '').toLowerCase().includes(searchLower)
      )
    })
  }, [historyData, debouncedSearchTerm])

  // Options for dropdowns
  const millInchargeOptions = [
    { value: "", label: "Select Mill Incharge", hindiLabel: "मिल इंचार्ज चुनें" },
    { value: "Lal Babu", label: "Lal Babu", hindiLabel: "लाल बाबू" },
    { value: "Bhola", label: "Bhola", hindiLabel: "भोला" },
    { value: "Paras Mani", label: "Paras Mani", hindiLabel: "पारस मणि" }
  ]

  const qualitySupervisorOptions = [
    { value: "", label: "Select Quality Supervisor", hindiLabel: "गुणवत्ता पर्यवेक्षक चुनें" },
    { value: "Durgesh Sahu", label: "Durgesh Sahu", hindiLabel: "दुर्गेश साहू" },
    { value: "Yashwant Sahu", label: "Yashwant Sahu", hindiLabel: "यशवंत साहू" },
    { value: "Toman Lal Sahu", label: "Toman Lal Sahu", hindiLabel: "तोमन लाल साहू" },
    { value: "Other", label: "Other", hindiLabel: "अन्य" }
  ]

  const electricalDCOperatorOptions = [
    { value: "", label: "Select Electrical DC Operator", hindiLabel: "इलेक्ट्रिकल डीसी ऑपरेटर चुनें" },
    { value: "Hari Tiwari", label: "Hari Tiwari", hindiLabel: "हरि तिवारी" },
    { value: "Dhirendra Tripathy", label: "Dhirendra Tripathy", hindiLabel: "धीरेंद्र त्रिपाठी" },
    { value: "Dhimendra Rahandale", label: "Dhimendra Rahandale", hindiLabel: "धीमेंद्र रहंडाले" },
    { value: "Akhilesh Choudhary", label: "Akhilesh Choudhary", hindiLabel: "अखिलेश चौधरी" },
    { value: "Kanhai Kumar Thakur", label: "Kanhai Kumar Thakur", hindiLabel: "कन्हाई कुमार ठाकुर" },
    { value: "Shiv Vishwakarma", label: "Shiv Vishwakarma", hindiLabel: "शिव विश्वकर्मा" }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Popup Modal */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className={`relative mx-4 p-6 rounded-lg shadow-2xl max-w-sm w-full transform transition-all duration-300 ${popupType === "success"
              ? 'bg-green-50 border-2 border-green-400'
              : 'bg-yellow-50 border-2 border-yellow-400'
              }`}>
              <div className="flex items-center justify-center mb-4">
                {popupType === "success" ? (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-yellow-500" />
                )}
              </div>
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${popupType === "success" ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                  {popupType === "success" ? "Success!" : "Warning!"}
                </h3>
                <p className={popupType === "success" ? 'text-green-700' : 'text-yellow-700'}>
                  {popupMessage}
                </p>
              </div>
              {/* Progress bar for auto-dismiss */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${popupType === "success" ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  style={{
                    animation: 'shrink 2s linear forwards'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-red-500 truncate">
                {showHistory ? "Hot Coil History" : "Hot Coil Processing"}
              </h1>
            </div>
          </div>

          <div className="flex flex-col-2 sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={toggleView}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors w-full sm:w-auto"
            >
              {showHistory ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Pending
                </>
              ) : (
                <>
                  <History className="h-4 w-4" />
                  View History
                </>
              )}
            </button>
          </div>
        </div>

        {/* Process Form Modal */}
        {showProcessForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="bg-red-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="text-lg font-semibold">Submit Hot Coil Data</h3>
                <button onClick={handleCloseProcessForm} className="text-white hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMS Short Code (Auto-filled from SMS Register) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMS Short Code / एसएमएस शॉर्ट कोड <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={processFormData.sms_short_code}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from SMS Register</p>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size / आकार <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={processFormData.size}
                      onChange={(e) => handleProcessFormChange("size", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., 146x148x2.90"
                      required
                    />
                  </div>

                  {/* Mill Incharge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mill Incharge / मिल इंचार्ज <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={processFormData.mill_incharge}
                      onChange={(e) => handleProcessFormChange("mill_incharge", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {millInchargeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quality Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Supervisor / गुणवत्ता पर्यवेक्षक <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={processFormData.quality_supervisor}
                      onChange={(e) => handleProcessFormChange("quality_supervisor", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {qualitySupervisorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quality Supervisor Other */}
                  {processFormData.quality_supervisor === "Other" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specify Quality Supervisor / गुणवत्ता पर्यवेक्षक निर्दिष्ट करें <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={processFormData.quality_supervisor_other}
                        onChange={(e) => handleProcessFormChange("quality_supervisor_other", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter quality supervisor name"
                        required
                      />
                    </div>
                  )}

                  {/* Electrical DC Operator */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Electrical DC Operator / इलेक्ट्रिकल डीसी ऑपरेटर <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={processFormData.electrical_dc_operator}
                      onChange={(e) => handleProcessFormChange("electrical_dc_operator", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      {electricalDCOperatorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Strand1 Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strand1 Temperature / स्ट्रैंड1 तापमान <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={processFormData.strand1_temperature}
                      onChange={(e) => handleProcessFormChange("strand1_temperature", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., 960"
                      required
                    />
                  </div>

                  {/* Strand2 Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strand2 Temperature / स्ट्रैंड2 तापमान <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={processFormData.strand2_temperature}
                      onChange={(e) => handleProcessFormChange("strand2_temperature", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., Colge"
                      required
                    />
                  </div>

                  {/* Shift Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shift Supervisor / शिफ्ट पर्यवेक्षक <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={processFormData.shift_supervisor}
                      onChange={(e) => handleProcessFormChange("shift_supervisor", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter shift supervisor name"
                      required
                    />
                  </div>

                  {/* Remarks */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks / टिप्पणियाँ
                    </label>
                    <textarea
                      value={processFormData.remarks}
                      onChange={(e) => handleProcessFormChange("remarks", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter any remarks / कोई टिप्पणी दर्ज करें"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
                <button
                  onClick={handleCloseProcessForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel / रद्द करें
                </button>
                <button
                  onClick={handleProcessSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Submitting... / जमा किया जा रहा है..." : "Submit Data / डेटा जमा करें"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-400 border-b border-red-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-white text-lg font-semibold">
                  {showHistory ? "Hot Coil Records" : "Pending Hot Coil"}
                </h2>
                <div className="relative flex items-center justify-center w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-white/20 p-0.5">
                    <div className="w-full h-full rounded-full bg-transparent flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {showHistory ? filteredHistoryData.length : filteredPendingData.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
              <p className="text-red-600">Loading data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {showHistory ? (
                /* HISTORY VIEW - Hot Coil Records */
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date / तारीख
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SMS Code /  कोड
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hot Coil /  कोड
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size / आकार
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mill Incharge / मिल इंचार्ज
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quality Supervisor / गुणवत्ता पर्यवेक्षक
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Electrical DC Operator / इलेक्ट्रिकल ऑपरेटर
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strand1 Temp / स्ट्रैंड1 ताप
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strand2 Temp / स्ट्रैंड2 ताप
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shift Supervisor / शिफ्ट पर्यवेक्षक
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks / टिप्पणियाँ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((record, index) => (
                        <tr key={record.id || record._id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatIndianDateTime(record.sample_timestamp) || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sms_short_code || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.unique_code || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.size || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.mill_incharge || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.quality_supervisor || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.electrical_dc_operator || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.strand1_temperature || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.strand2_temperature || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.shift_supervisor || 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {record.remarks || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium mb-2">
                              {searchTerm ? "No matching Hot Coil records found" : "No Hot Coil records found"}
                            </p>
                            <p className="text-sm mb-4">
                              {searchTerm ? "Try adjusting your search terms" : "Submit a Hot Coil entry first to see records here"}
                            </p>
                            <div className="flex gap-2">
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm("")}
                                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Clear Search
                                </button>
                              )}
                              <button
                                onClick={fetchHistoryData}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                              >
                                Refresh Data
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* PENDING VIEW - SMS Register Records */
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action / कार्रवाई
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SMS Batch Code / एसएमएस बैच कोड
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date / तारीख
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sequence / अनुक्रम
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Laddle No. / लेडल नंबर
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Furnace / भट्ठी
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature / तापमान
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPendingData.length > 0 ? (
                      filteredPendingData.map((record, index) => (
                        <tr key={record.id || record._id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleProcessClick(record)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                              Process
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.unique_code || generateShortCode(record) || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatIndianDateTime(record.sample_timestamp) || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sequence_number || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.laddle_number || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.furnace_number || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.temperature ? `${record.temperature}°C` : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-300 mb-4" />
                            <p className="text-lg font-medium mb-2">
                              {searchTerm ? "No matching pending SMS records found" : "No pending SMS records for Hot Coil processing"}
                            </p>
                            <p className="text-sm mb-4">
                              {searchTerm ? "Try adjusting your search terms" : "All SMS records have been processed for Hot Coil"}
                            </p>
                            <div className="flex gap-2">
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm("")}
                                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                >
                                  Clear Search
                                </button>
                              )}
                              <button
                                onClick={fetchPendingSMSData}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                              >
                                Refresh Data
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for progress bar animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </AdminLayout>
  )
}

export default HotCoilPage
