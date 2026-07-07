import React, { useState, useEffect } from "react";
import {
  User,
  Report,
  Notification,
  SystemSettings,
  UserRole
} from "./types";
import InteractiveMap from "./components/InteractiveMap";
import WeatherWidget from "./components/WeatherWidget";
import AIPanel from "./components/AIPanel";
import ChatWidget from "./components/ChatWidget";
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Layers,
  FileText,
  CheckCircle,
  Clock,
  PlusCircle,
  MapPin,
  Sparkles,
  Send,
  UserCheck,
  Building,
  BarChart3,
  LogOut,
  Bell,
  Sliders,
  Camera,
  Download,
  Search,
  Check,
  UserX,
  RefreshCw,
  Award,
  Trash2,
  Info,
  ChevronLeft,
  ChevronRight,
  Menu,
  Upload,
  Link
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

// List of standard categories requested by user
const CATEGORIES = [
  "Garbage",
  "Potholes",
  "Streetlight",
  "Water leakage",
  "Drainage",
  "Flood",
  "Fire",
  "Smoke",
  "Illegal dumping",
  "Road damage",
  "Tree fall",
  "Animal rescue",
  "Traffic",
  "Pollution",
  "Other"
];

// Preset simulated images for easy reporting selection (representing clean standard camera uploads)
const PRESET_CIVIC_IMAGES = [
  {
    name: "Deep Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    category: "Potholes"
  },
  {
    name: "Clogged Street Drain",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    category: "Drainage"
  },
  {
    name: "Flickering Streetlight",
    url: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=600",
    category: "Streetlight"
  },
  {
    name: "Water Main Leak",
    url: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=600",
    category: "Water leakage"
  }
];

// Preset simulated images representing resolved conditions for field work completed
const PRESET_RESOLVED_IMAGES = [
  {
    name: "Repaired Pavement",
    url: "https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&q=80&w=600",
    category: "Potholes"
  },
  {
    name: "Clean Streetway",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
    category: "Garbage"
  },
  {
    name: "Functional LED Lamp",
    url: "https://images.unsplash.com/photo-1518331647614-7a1f04db3407?auto=format&fit=crop&q=80&w=600",
    category: "Streetlight"
  },
  {
    name: "Cleared Drainage Pipe",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    category: "Drainage"
  }
];

// Geocoding helper to translate typed address to coordinates in Springfield bounds
const geocodeAddress = (addr: string) => {
  const clean = addr.toLowerCase().trim();
  if (!clean) return { lat: 37.7749, lng: -122.4194 };
  
  // Landmark lookups
  if (clean.includes("maple")) return { lat: 37.7749, lng: -122.4194 };
  if (clean.includes("park") || clean.includes("oak")) return { lat: 37.7833, lng: -122.4167 };
  if (clean.includes("industrial") || clean.includes("parkway")) return { lat: 37.7794, lng: -122.4224 };
  if (clean.includes("broadway")) return { lat: 37.7700, lng: -122.4300 };
  if (clean.includes("washington")) return { lat: 37.7600, lng: -122.4200 };
  if (clean.includes("pine")) return { lat: 37.7650, lng: -122.4100 };
  if (clean.includes("evergreen") || clean.includes("simpson")) return { lat: 37.7800, lng: -122.4250 };
  
  // Stable hash-based deterministic geocoding
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125; 
  const lngOffset = ((Math.abs(hash >> 3) % 100) / 4000) - 0.0125;
  return {
    lat: 37.7749 + latOffset,
    lng: -122.4194 + lngOffset
  };
};

export default function App() {
  // Current user / role states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("CITIZEN");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");

  // Core App states
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    enableAiClustering: "true",
    autoRoutingEnabled: "true",
    severityThreshold: "HIGH",
    alertContacts: "sanitation@springfield.gov, safety@springfield.gov"
  });

  // Active Views
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activityFilterMode, setActivityFilterMode] = useState<"all" | "mine">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [avatarDragActive, setAvatarDragActive] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [avatarUploadStatus, setAvatarUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  // New Report Form state
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState("Garbage");
  const [reportLatitude, setReportLatitude] = useState(37.7749);
  const [reportLongitude, setReportLongitude] = useState(-122.4194);
  const [reportAddress, setReportAddress] = useState("Springfield Metro Center");
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [aiAnalyzingBanner, setAiAnalyzingBanner] = useState(false);
  const [locatingMethod, setLocatingMethod] = useState<"write" | "pin">("pin");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isGeocoding, setIsGeocoding] = useState(false);

  const triggerGeocoding = async (addr: string) => {
    if (!addr.trim()) return;
    setIsGeocoding(true);

    // 1. Try direct client-side Nominatim first (very reliable from user browser IP)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
        {
          headers: {
            "Accept": "application/json"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setReportLatitude(lat);
          setReportLongitude(lng);
          setReportAddress(data[0].display_name);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Direct client-side Nominatim failed, trying backend proxy...", err);
    }

    // 2. Try server-side geocoding proxy (which will fallback to Gemini if Nominatim is rate-limited on server)
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.lat === "number" && typeof data.lng === "number") {
          setReportLatitude(data.lat);
          setReportLongitude(data.lng);
          setReportAddress(data.display_name);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.error("Geocoding proxy fetch failed, falling back to local hash", err);
    }

    // 3. Fallback to local hash geocoding if both internet approaches fail
    const coords = geocodeAddress(addr);
    setReportLatitude(coords.lat);
    setReportLongitude(coords.lng);
    setIsGeocoding(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Invalid file: Please upload a PNG, JPEG or SVG image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setReportImages([reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Worker Action states
  const [workerAfterImage, setWorkerAfterImage] = useState("");
  const [workerStatement, setWorkerStatement] = useState("");
  const [workerActionLoading, setWorkerActionLoading] = useState(false);

  // Manager Assign Action state
  const [selectedWorkerId, setSelectedWorkerId] = useState<number>(0);

  // Load Initial Core Application Data
  const loadAppData = async () => {
    try {
      // Load reports
      const reportsRes = await fetch("/api/reports");
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
      // Load users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
      // Load settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (e) {
      console.error("Failed to load core application resources:", e);
    }
  };

  useEffect(() => {
    loadAppData();
    const timer = setInterval(loadAppData, 6000);
    return () => clearInterval(timer);
  }, []);

  // Load user specific notifications
  useEffect(() => {
    if (currentUser) {
      const loadNotifications = async () => {
        try {
          const res = await fetch(`/api/notifications/${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setNotifications(data);
          }
        } catch (e) {
          console.error("Notifications fetch failed", e);
        }
      };
      loadNotifications();
    }
  }, [currentUser, reports]);

  // Request OTP Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmailOrPhone.trim()) {
      setAuthError("Email or Phone number is required.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: authEmailOrPhone,
          role: authRole,
          isLogin: !isRegistering
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSimulatedOtp(data.otp);
      } else {
        setAuthError(data.message || "Failed to send OTP.");
      }
    } catch (e) {
      setAuthError("Failed to reach auth server. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthError("OTP code is required.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: authEmailOrPhone,
          otp: otpCode,
          isLogin: !isRegistering,
          fullName: authFullName,
          role: authRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        // Clean auth states
        setAuthEmailOrPhone("");
        setAuthFullName("");
        setOtpSent(false);
        setOtpCode("");
        setSimulatedOtp("");
        setActiveTab("dashboard");
      } else {
        setAuthError(data.message || "Invalid OTP code.");
      }
    } catch (e) {
      setAuthError("Verification failed due to a network error.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Citizen Submit Complaint Handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDescription.trim()) return;

    setIsSubmittingReport(true);
    setAiAnalyzingBanner(true);

    const payload = {
      title: reportTitle,
      description: reportDescription,
      category: reportCategory,
      latitude: reportLatitude,
      longitude: reportLongitude,
      address: reportAddress,
      images: reportImages.length > 0 ? reportImages : ["https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800"],
      citizenId: currentUser?.id || 1
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdReport = await res.json();
        setReports((prev) => [createdReport, ...prev]);
        setSelectedReport(createdReport);
        // Reset form
        setReportTitle("");
        setReportDescription("");
        setReportImages([]);
        setReportAddress("Springfield Metro Center");
        setActiveTab("dashboard");
      }
    } catch (e) {
      console.error("Report creation failed", e);
    } finally {
      setIsSubmittingReport(false);
      setAiAnalyzingBanner(false);
    }
  };

  // Social Worker Accept Task
  const handleWorkerAccept = async (reportId: number) => {
    setWorkerActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkerActionLoading(false);
    }
  };

  // Social Worker Solve Task with After Photo
  const handleWorkerComplete = async (reportId: number) => {
    if (!workerAfterImage.trim()) return;
    setWorkerActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "RESOLVED",
          afterImage: workerAfterImage,
          workerStatement: workerStatement.trim() || "Resolved successfully by municipal field team."
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
        setWorkerAfterImage("");
        setWorkerStatement("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkerActionLoading(false);
    }
  };

  // Manager Assign Worker
  const handleAssignWorker = async (reportId: number) => {
    if (!selectedWorkerId) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignedWorkerId: selectedWorkerId,
          status: "ASSIGNED"
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((r) => r.id === reportId ? updated : r));
        setSelectedReport(updated);
        setSelectedWorkerId(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Suspend User
  const handleToggleSuspendUser = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !currentStatus })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsersList((prev) => prev.map((u) => u.id === userId ? updatedUser : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Delete Report
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint report? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Export Reports to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Category,Priority,Status,Address,Latitude,Longitude,Created At,Resolved At\n";
    
    filteredReports.forEach((r) => {
      const row = `${r.id},"${r.title.replace(/"/g, '""')}",${r.category},${r.priority},${r.status},"${r.address.replace(/"/g, '""')}",${r.latitude},${r.longitude},${r.createdAt},${r.resolvedAt || "N/A"}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `civiclife_reports_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search computation
  const filteredReports = reports.filter((r) => {
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesActivity = true;
    if (activityFilterMode === "mine" && currentUser) {
      if (currentUser.role === "CITIZEN") {
        matchesActivity = r.citizenId === currentUser.id;
      } else if (currentUser.role === "SOCIAL_WORKER") {
        matchesActivity = r.assignedWorkerId === currentUser.id;
      }
    }
    
    return matchesCategory && matchesStatus && matchesSearch && matchesActivity;
  });

  // Recharts Dashboard Data Prep
  const categoryData = CATEGORIES.map((cat) => {
    const count = reports.filter((r) => r.category === cat).length;
    return { name: cat, count };
  }).filter((c) => c.count > 0);

  const statusData = [
    { name: "Submitted", count: reports.filter((r) => r.status === "SUBMITTED").length, color: "#eab308" },
    { name: "Reviewed", count: reports.filter((r) => r.status === "REVIEWED").length, color: "#a855f7" },
    { name: "Assigned", count: reports.filter((r) => r.status === "ASSIGNED").length, color: "#3b82f6" },
    { name: "In Progress", count: reports.filter((r) => r.status === "IN_PROGRESS").length, color: "#ec4899" },
    { name: "Resolved", count: reports.filter((r) => r.status === "RESOLVED").length, color: "#10b981" }
  ];

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Render Login page if user not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 select-none">
        
        {/* Simulated Verification Banner when OTP is sent */}
        {otpSent && simulatedOtp && (
          <div className="max-w-md w-full mb-6 bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-2xl text-center shadow-xl animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Sparkles className="w-3 h-3" />
              Simulated Message Service
            </span>
            <p className="text-xs text-slate-300 font-mono">
              [Incoming SMS/Email to <span className="text-emerald-300 font-bold">{authEmailOrPhone}</span>]: <br />
              Your CIVICLife OTP secure verification code is <span className="text-emerald-400 font-black text-sm tracking-wider underline">{simulatedOtp}</span>
            </p>
          </div>
        )}

        {/* Main Auth Form Card */}
        <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-center">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-bold mb-4">
              <Layers className="w-4 h-4" />
              CIVICLife
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {isRegistering ? "Sign Up" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-xs text-slate-400 max-w-xs mx-auto">
              {isRegistering 
                ? "Create a Citizen or Social Worker account using email or phone number with secure OTP." 
                : "Authorized municipal personnel & citizens login using registered email or phone number."}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono text-center animate-pulse">
                {authError}
              </div>
            )}

            {!otpSent ? (
              /* STEP 1: Enter Email/Phone & Basic details */
              <form onSubmit={handleSendOtp} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="e.g., Jane Smith"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Email or Phone Number</label>
                  <input
                    type="text"
                    required
                    value={authEmailOrPhone}
                    onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="e.g., name@domain.com or +15551234567"
                  />
                </div>

                {isRegistering && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Select Your Role</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer font-mono"
                    >
                      <option value="CITIZEN">Citizen (Report Issues)</option>
                      <option value="SOCIAL_WORKER">Social Worker (Solve Field Tasks)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3.5 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20 font-mono"
                >
                  {isAuthLoading ? "Sending Code..." : "Send OTP secure code"}
                </button>
              </form>
            ) : (
              /* STEP 2: Enter 6-digit OTP code to verify */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[9px] text-indigo-400 hover:underline cursor-pointer font-mono"
                    >
                      Change Contact Info
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3.5 rounded-xl text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-3.5 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20 font-mono"
                >
                  {isAuthLoading ? "Verifying..." : isRegistering ? "Verify & Register" : "Verify & Sign In"}
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setOtpSent(false);
                setAuthError("");
                setSimulatedOtp("");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              {isRegistering ? "Already have an account? Sign In" : "Register a new Citizen or Social Worker account"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle custom profile picture file upload via base64
  const handleAvatarFileUpload = async (file: File) => {
    if (!currentUser) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    
    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.");
      return;
    }

    try {
      setAvatarUploadStatus("uploading");
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch(`/api/users/${currentUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: base64String })
          });
          
          if (res.ok) {
            const updatedUser = await res.json();
            setCurrentUser(updatedUser);
            setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
            setAvatarUploadStatus("success");
            setTimeout(() => setAvatarUploadStatus("idle"), 3000);
          } else {
            setAvatarUploadStatus("error");
          }
        } catch (e) {
          console.error(e);
          setAvatarUploadStatus("error");
        }
      };
      
      reader.onerror = () => {
        setAvatarUploadStatus("error");
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAvatarUploadStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none text-slate-200">
      
      {/* Main Top Header Navigation */}
      <header className="bg-slate-900/60 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-center mr-1"
            title={isSidebarOpen ? "Hide Navigation Sidebar" : "Show Navigation Sidebar"}
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white tracking-wide uppercase font-mono">CIVICLife</span>
              <span className="bg-slate-800 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700">v1.0.0</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">Way Of SmartCity</span>
          </div>
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                if (!showNotificationsDropdown) {
                  handleMarkNotificationsRead();
                }
              }}
              className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 hover:text-white relative cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Dropdown Container */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2.5 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-80 py-2.5 z-50">
                <div className="px-4 py-1.5 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Updates Notification Center</span>
                  <span className="text-[9px] text-indigo-400 font-mono font-medium">{unreadNotifsCount} new</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 scrollbar-none">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-500 font-mono">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3.5 hover:bg-slate-950 transition-colors">
                        <span className="text-xs font-semibold text-slate-200 block mb-0.5">{n.title}</span>
                        <p className="text-[11px] text-slate-400 leading-normal">{n.message}</p>
                        <span className="text-[8px] font-mono text-slate-600 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Quick Stats */}
          <div 
            onClick={() => {
              if (currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") {
                setActiveTab("profile");
                setSelectedReport(null);
              }
            }}
            className={`bg-slate-950 px-4 py-2 border border-slate-800 rounded-2xl flex items-center gap-3 ${
              (currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") ? "cursor-pointer hover:border-slate-700 transition-all" : ""
            }`}
            title={(currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") ? "View or Edit Profile" : ""}
          >
            <img src={currentUser.avatar} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-slate-700" />
            <div className="text-left leading-tight">
              <span className="text-xs font-bold text-slate-200 block">{currentUser.fullName}</span>
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
            {currentUser.role === "CITIZEN" && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-800 font-mono text-amber-400 font-bold text-xs" title="Loyalty Points Gained for Civic Activity">
                <Award className="w-3.5 h-3.5" />
                <span>{currentUser.points} Pts</span>
              </div>
            )}
          </div>

          {/* Log Out */}
          <button
            onClick={() => setCurrentUser(null)}
            className="p-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-950/50 rounded-xl cursor-pointer transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Sidebar Navigation */}
        <nav className={`${isSidebarOpen ? "w-64 p-5 border-r border-slate-800" : "w-0 p-0 border-r-0 overflow-hidden"} bg-slate-900 flex flex-col justify-between shrink-0 transition-all duration-300`}>
          <div className="space-y-6">
            
            {/* Nav Group: Actions */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-semibold block px-3 mb-2">Municipal Workspace</span>
              
              {currentUser.role === "SOCIAL_WORKER" ? (
                <>
                  <button
                    onClick={() => { setActiveTab("dashboard"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "dashboard" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>1st Tab: Overview</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_select"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_select" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>2nd Tab: Select Posted</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_solve"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_solve" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>3rd Tab: Solve Case</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("worker_history"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "worker_history" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>4th Tab: Resolved History Log</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("profile"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "profile" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setActiveTab("dashboard"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "dashboard" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Issue Dashboard</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab("map"); setSelectedReport(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      activeTab === "map" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Springfield Interactive Map</span>
                  </button>

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("report"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "report" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 animate-pulse" />
                      <span>Report New Complaint</span>
                    </button>
                  )}

                  {(currentUser.role === "SUPER_ADMIN" || currentUser.role === "MANAGER") && (
                    <button
                      onClick={() => { setActiveTab("users"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "users" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Users Directory</span>
                    </button>
                  )}

                  {currentUser.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => { setActiveTab("settings"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "settings" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>System Settings</span>
                    </button>
                  )}

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("citizen_history"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "citizen_history" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Resolved History Log</span>
                    </button>
                  )}

                  {currentUser.role === "CITIZEN" && (
                    <button
                      onClick={() => { setActiveTab("profile"); setSelectedReport(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === "profile" 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Quick Informational Box depending on selected persona */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-[11px] leading-relaxed text-slate-400 leading-normal">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1 font-mono uppercase tracking-wider text-[10px]">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Role Quick Tip</span>
              </div>
              {currentUser.role === "CITIZEN" && "Report a complaint and choose a preset image! The server-side Gemini AI model will automatically analyze it and assign severity + solution steps."}
              {currentUser.role === "SOCIAL_WORKER" && "Browse your assigned field tasks, mark progress, upload resolved after photos, and track your daily performance stats."}
              {currentUser.role === "MANAGER" && "Analyze all reports, dispatch available social workers, review and approve completed field work, and export reports directly as CSV files."}
              {currentUser.role === "SUPER_ADMIN" && "You hold system-wide master authority. Suspend users, modify core configurations, and track global analytics metrics."}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono tracking-tight text-center border-t border-slate-800 pt-4">
            Authorized Springfield System
          </div>
        </nav>

        {/* Core Right Main Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          
          {/* Active Banner for AI analyses */}
          {aiAnalyzingBanner && (
            <div className="mb-6 p-4 bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs rounded-2xl flex items-center gap-3 shadow-lg animate-pulse">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <span className="font-bold block text-indigo-300">Google Gemini AI Analysis Running...</span>
                <span>Reading uploaded images, categorizing, estimating severity, and generating solution procedures.</span>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && currentUser && (
            currentUser.role === "SOCIAL_WORKER" ? (
              <div className="space-y-8 animate-fade-in text-left">
                {/* Greeting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <Award className="text-indigo-400 w-5.5 h-5.5" />
                      <span>Welcome back, {currentUser.fullName}!</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Field Unit: {currentUser.department || "Municipal Field Unit"} • Region: Springfield Central
                    </p>
                  </div>
                  <div className="flex bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-mono items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Duty Status: ACTIVE</span>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">My Assigned Tasks</span>
                    <span className="text-2xl font-black text-indigo-400 block font-mono">
                      {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Unresolved tasks assigned to you</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">My Solved Complaints</span>
                    <span className="text-2xl font-black text-emerald-400 block font-mono">
                      {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status === "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Total cases closed by you</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Springfield Active Pool</span>
                    <span className="text-2xl font-black text-amber-400 block font-mono">
                      {reports.filter(r => r.status !== "RESOLVED").length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono font-sans">Total unresolved complaints city-wide</p>
                  </div>
                </div>

                {/* Main Queue and Instructions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Active Assigned Tasks */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Your Active Job Queue</span>
                      </h2>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                        In Progress / Assigned
                      </span>
                    </div>

                    {reports.filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED").length === 0 ? (
                      <div className="py-12 text-center text-xs space-y-3">
                        <CheckCircle className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="text-slate-400 font-medium">You have no active pending assignments!</p>
                        <p className="text-slate-600">Head over to the **2nd tab** to select a posted complaint to solve.</p>
                        <button
                          onClick={() => setActiveTab("worker_select")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[11px] mt-2 transition-all cursor-pointer"
                        >
                          Select Posted Complaint to Solve
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.assignedWorkerId === currentUser.id && r.status !== "RESOLVED")
                          .map((report) => (
                            <div key={report.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-slate-950 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
                                    {report.category}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">#{report.id}</span>
                                </div>
                                <h3 className="font-bold text-slate-200">{report.title}</h3>
                                <p className="text-[11px] text-slate-500 font-mono">{report.address}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActiveTab("worker_solve");
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[11px] cursor-pointer transition-all self-start sm:self-auto shadow-md"
                              >
                                Solve Selected Complaint →
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Work Guidelines */}
                  <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                    <h2 className="text-sm font-bold text-white">Daily Field Instructions</h2>
                    
                    <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">01</span>
                        <div>
                          <p className="font-semibold text-slate-300">Select posted complaints</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Go to the **2nd Tab** to review posted complaints. Click to assign it to your personnel queue.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">02</span>
                        <div>
                          <p className="font-semibold text-slate-300">Submit completed work</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Use the **3rd Tab** to submit proof of solution, upload matching resolved photos, and add engineering statements.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <span className="font-bold text-indigo-400 font-mono text-sm leading-none">03</span>
                        <div>
                          <p className="font-semibold text-slate-300">Track solved history</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">The **4th Tab** maintains a detailed ledger showing who solved the complaint and which citizen reported it.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 text-[11px] text-slate-500 italic">
                      "Clean water, smooth roads, and bright streets form the bedrock of a thriving Springfield. Your dedication is appreciated!"
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
              
              {/* Top Filters & Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Category Filter dropdown */}
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Filter Category</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter dropdown */}
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Filter Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Keywords</span>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search complaints..."
                        className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50 w-48 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Selective CSV Export Option */}
                {currentUser.role === "SUPER_ADMIN" && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer self-end md:self-auto transition-all shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Selective CSV (Filtered)</span>
                  </button>
                )}
              </div>

              {/* Bento Layout: Main complaint List and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Complaints Grid/List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Reported Complaint Logs ({filteredReports.length})</span>
                    </h2>
                    
                    {/* Activity Filter Mode Switcher */}
                    {(currentUser.role === "CITIZEN" || currentUser.role === "SOCIAL_WORKER") && (
                      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => setActivityFilterMode("all")}
                          className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                            activityFilterMode === "all"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          All Springfield Feed
                        </button>
                        <button
                          onClick={() => setActivityFilterMode("mine")}
                          className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                            activityFilterMode === "mine"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {currentUser.role === "CITIZEN" ? "My Activity Logs" : "My Assigned/Solved Tasks"}
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">No reported complaints match current filters.</p>
                      <p className="text-xs text-slate-600 mt-1">Try resetting the dropdown filters or keywords.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredReports.map((report) => {
                        const isSelected = selectedReport?.id === report.id;
                        return (
                          <div
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                              isSelected 
                                ? "bg-indigo-950/20 border-indigo-500/80 shadow-lg" 
                                : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80"
                            }`}
                          >
                            {/* Urgent priority dot indicator */}
                            {report.priority === "CRITICAL" && (
                              <span className="absolute top-4 right-4 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono block mb-1">
                              ID: #{report.id} • {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                            <h3 className="text-xs font-bold text-slate-100 mb-1.5 truncate pr-4">{report.title}</h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 leading-normal">
                              {report.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                              <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                                {report.category}
                              </span>
                              <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${
                                report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                              }`}>
                                {report.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: Detailed Single Report Inspector */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 animate-fade-in">
                  <div className="px-1 flex justify-between items-center">
                    <div>
                      <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-indigo-400" />
                        <span>Issue Inspector</span>
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono">Select a report card to evaluate parameters</p>
                    </div>
                    {selectedReport && (
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                        title="Deselect report"
                      >
                        ✕ Close
                      </button>
                    )}
                  </div>

                  {!selectedReport ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <Info className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 leading-normal">Click on any card to view GPS locations, coordinate tasks, send messages, and evaluate Gemini AI insights.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/95 border border-slate-700/60 rounded-2xl overflow-hidden p-6 space-y-6 shadow-2xl shadow-indigo-500/5 backdrop-blur-md">
                      
                      {/* Image comparison gallery */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono text-slate-300 font-semibold tracking-wider block">Case Photographic Evidence</span>
                          {selectedReport.status === "RESOLVED" && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                              Before & After
                            </span>
                          )}
                        </div>

                        {selectedReport.status === "RESOLVED" && selectedReport.afterImage ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                              <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Before" className="w-full h-28 object-cover rounded-lg" />
                              <span className="text-[9px] uppercase font-mono text-slate-500 text-center block mt-1.5 font-bold">Before Work</span>
                            </div>
                            <div className="bg-slate-950/80 p-2 rounded-xl border border-emerald-900/40">
                              <img src={selectedReport.afterImage} alt="After" className="w-full h-28 object-cover rounded-lg border border-emerald-900" />
                              <span className="text-[9px] uppercase font-mono text-emerald-400 text-center block mt-1.5 font-bold">After Resolved</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                            <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Complaint" className="w-full h-44 object-cover rounded-lg" />
                          </div>
                        )}
                      </div>

                      {/* Header details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-600/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-500/30 uppercase tracking-wider">
                            {selectedReport.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">Case ID: <strong>#{selectedReport.id}</strong></span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                              selectedReport.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              selectedReport.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-slate-800/50 text-slate-400 border-slate-800/80"
                            }`}>
                              {selectedReport.priority} Priority
                            </span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">{selectedReport.title}</h3>
                        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-left">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-1">Citizen Statement / Description</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                            {selectedReport.description}
                          </p>
                        </div>
                      </div>

                      {/* Case Ownership Metadata */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block tracking-wider">Reported By</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-indigo-950 text-indigo-400 border border-indigo-900/50 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                              C
                            </div>
                            <span className="text-slate-200 font-bold text-xs truncate">
                              {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen User"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-slate-800/80 pl-4">
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block tracking-wider">Assigned / Solver</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                              selectedReport.assignedWorkerId ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50" : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}>
                              W
                            </div>
                            <span className="text-slate-200 font-bold text-xs truncate">
                              {selectedReport.assignedWorkerId 
                                ? (usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Social Worker")
                                : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Social Worker Solution Comments block if resolved */}
                      {selectedReport.status === "RESOLVED" && (
                        <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-2 text-xs">
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block tracking-wider">Social Worker Resolution Statement</span>
                          <p className="text-slate-200 leading-relaxed font-sans italic font-medium">
                            "{selectedReport.workerStatement || "Resolved successfully by municipal field team."}"
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">
                            Verified by field operator {usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Field Staff"}
                          </span>
                        </div>
                      )}

                      {/* Coordinates, Address, and Weather */}
                      <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="font-mono truncate">{selectedReport.address}</span>
                        </div>
                        <div className="border-t border-slate-900 pt-2">
                          <WeatherWidget latitude={selectedReport.latitude} longitude={selectedReport.longitude} />
                        </div>
                      </div>

                      {/* Interactive Field Actions for each specific user role */}

                      {/* CITIZEN FLOW: Can chat if assigned, see progress */}
                      {currentUser.role === "CITIZEN" && (
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Citizen Operations</span>
                          {selectedReport.assignedWorkerId ? (
                            <ChatWidget
                              reportId={selectedReport.id}
                              currentUser={currentUser}
                              recipientUser={usersList.find(u => u.id === selectedReport.assignedWorkerId) || null}
                            />
                          ) : (
                            <div className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500 font-mono">
                              Waiting for district manager dispatch before direct worker communication.
                            </div>
                          )}
                        </div>
                      )}

                      {/* SOCIAL WORKER FLOW: Can accept, complete task */}
                      {currentUser.role === "SOCIAL_WORKER" && (
                        <div className="space-y-4 border-t border-slate-800 pt-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Social Worker Action Deck</span>
                          
                          {selectedReport.assignedWorkerId !== currentUser.id ? (
                            <div className="p-3 bg-slate-950 text-center text-xs text-slate-500 font-mono border border-slate-800 rounded-xl">
                              This task is not assigned to you.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedReport.status === "ASSIGNED" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleWorkerAccept(selectedReport.id)}
                                    disabled={workerActionLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                                  >
                                    Accept Assignment
                                  </button>
                                  <button
                                    onClick={() => handleWorkerComplete(selectedReport.id)} // or rejecting
                                    className="flex-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-950 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                                  >
                                    Decline Task
                                  </button>
                                </div>
                              )}

                              {selectedReport.status === "IN_PROGRESS" && (
                                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                                      Resolved Work Photo URL
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={workerAfterImage}
                                        onChange={(e) => setWorkerAfterImage(e.target.value)}
                                        placeholder="https://images.unsplash.com/... (After resolution photo)"
                                        className="flex-1 bg-slate-900 border border-slate-850 text-[11px] px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                                      />
                                      <button
                                        onClick={() => setWorkerAfterImage(PRESET_CIVIC_IMAGES[3].url)}
                                        className="bg-slate-800 p-2 rounded-xl text-xs font-semibold hover:bg-slate-700 text-slate-300 shrink-0"
                                        title="Load mock resolved photo"
                                      >
                                        <Camera className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                                      Resolution & Solution Statement
                                    </label>
                                    <textarea
                                      value={workerStatement}
                                      onChange={(e) => setWorkerStatement(e.target.value)}
                                      placeholder="Provide details about the engineering solution deployed (e.g., cleared debris, patched water main)..."
                                      rows={2}
                                      className="w-full bg-slate-900 border border-slate-850 text-[11px] p-3 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                                    />
                                  </div>

                                  <button
                                    onClick={() => handleWorkerComplete(selectedReport.id)}
                                    disabled={!workerAfterImage.trim() || workerActionLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                                  >
                                    Complete Assignment (Mark Solved)
                                  </button>
                                </div>
                              )}

                              {/* Chat with Citizen */}
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Citizen Liaison</span>
                                <ChatWidget
                                  reportId={selectedReport.id}
                                  currentUser={currentUser}
                                  recipientUser={usersList.find(u => u.id === selectedReport.citizenId) || null}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MANAGER FLOW: Assign field staff, dispatch */}
                      {currentUser.role === "MANAGER" && (
                        <div className="space-y-4 border-t border-slate-800/80 pt-4">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Manager Dispatch Center</span>
                          
                          {selectedReport.status === "SUBMITTED" || selectedReport.status === "REVIEWED" ? (
                            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                              <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold">
                                Dispatch Available Worker
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={selectedWorkerId}
                                  onChange={(e) => setSelectedWorkerId(parseInt(e.target.value))}
                                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-2.5 rounded-xl focus:outline-none cursor-pointer"
                                >
                                  <option value={0}>Select Worker...</option>
                                  {usersList.filter(u => u.role === "SOCIAL_WORKER").map(w => (
                                    <option key={w.id} value={w.id}>
                                      {w.fullName} ({w.department || "Field Staff"})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssignWorker(selectedReport.id)}
                                  disabled={!selectedWorkerId}
                                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-4 rounded-xl cursor-pointer transition-colors"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-center text-xs text-slate-500 font-mono">
                              Assigned to: {usersList.find(u => u.id === selectedReport.assignedWorkerId)?.fullName || "Field Staff"} ({selectedReport.status})
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUPER ADMIN PRIVILEGES */}
                      {currentUser.role === "SUPER_ADMIN" && (
                        <div className="space-y-4 border-t border-slate-800 pt-4">
                          <span className="text-[10px] uppercase font-mono text-red-400 font-semibold block">Super Admin Overrides</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteReport(selectedReport.id)}
                              className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900 text-red-400 font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Permanently Purge Report</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Unified Gemini AI Panel */}
                      <AIPanel report={selectedReport} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) )}

          {/* SOCIAL WORKER SPECIALIZED WORKFLOWS */}

          {/* TAB 2: SELECT POSTED COMPLAINT */}
          {activeTab === "worker_select" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Posted Complaints Board</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Browse active complaints reported by citizens of Springfield. Select any case to accept it and deploy a solution.
                </p>
              </div>

              {/* List of active complaints */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  {/* Simple inline filter */}
                  <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                      Available Issues ({reports.filter(r => r.status !== "RESOLVED").length})
                    </span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-mono">
                      Unsolved Springfield Feed
                    </span>
                  </div>

                  {reports.filter(r => r.status !== "RESOLVED").length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">All Springfield complaints have been solved!</p>
                      <p className="text-xs text-slate-600 mt-1">Check back later for new citizen reports.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports
                        .filter(r => r.status !== "RESOLVED")
                        .map((report) => {
                          const isSelected = selectedReport?.id === report.id;
                          const creator = usersList.find(u => u.id === report.citizenId);
                          return (
                            <div
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                                isSelected 
                                  ? "bg-indigo-950/20 border-indigo-500/80 shadow-lg" 
                                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-mono block mb-1">
                                    ID: #{report.id} • Reported by {creator?.fullName || "Citizen"}
                                  </span>
                                  <h3 className="text-xs font-bold text-slate-100 mb-1">{report.title}</h3>
                                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                                    {report.description}
                                  </p>
                                </div>
                                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                  report.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  report.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  "bg-slate-800 text-slate-400"
                                }`}>
                                  {report.priority}
                                </span>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="truncate max-w-xs">{report.address}</span>
                                </div>
                                <span className="text-[10px] font-mono text-indigo-400">
                                  {report.category}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Selector side panel */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h2 className="text-sm font-bold text-white">Target Case Details</h2>
                    {!selectedReport ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Select a complaint from the list to assign to yourself or solve.
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        <div className="space-y-2">
                          <img 
                            src={selectedReport.beforeImage || selectedReport.images[0]} 
                            alt="Incident site" 
                            className="w-full h-40 object-cover rounded-xl border border-slate-800" 
                          />
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>Category: {selectedReport.category}</span>
                            <span>Priority: {selectedReport.priority}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Title</span>
                          <span className="text-slate-200 font-bold text-xs">{selectedReport.title}</span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Description</span>
                          <p className="text-slate-400 bg-slate-950/40 p-3 rounded-lg leading-relaxed">{selectedReport.description}</p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Reporter Identity</span>
                          <div className="flex items-center gap-2 mt-1">
                            <img 
                              src={usersList.find(u => u.id === selectedReport.citizenId)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                              alt="Citizen" 
                              className="w-6 h-6 rounded-full object-cover" 
                            />
                            <div>
                              <span className="text-slate-300 font-semibold block leading-tight">
                                {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono block">
                                {usersList.find(u => u.id === selectedReport.citizenId)?.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedReport.assignedWorkerId === currentUser.id ? (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-center font-semibold">
                            ✓ This task is already assigned to you!
                            <button
                              onClick={() => setActiveTab("worker_solve")}
                              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              Go to Solve Tab
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              // Accept and assign task
                              setWorkerActionLoading(true);
                              try {
                                const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ 
                                    assignedWorkerId: currentUser.id,
                                    status: "IN_PROGRESS"
                                  })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                  setSelectedReport(updated);
                                  // Redirect to solve tab
                                  setActiveTab("worker_solve");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setWorkerActionLoading(false);
                              }
                            }}
                            disabled={workerActionLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg"
                          >
                            {workerActionLoading ? "Assigning..." : "Assign & Solve this Complaint"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOLVE COMPLAINT PANEL */}
          {activeTab === "worker_solve" && currentUser && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  <span>Solve Selected Complaint</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Submit high-quality field verification evidence (resolved photo and completion statement) to mark cases as successfully RESOLVED.
                </p>
              </div>

              {!selectedReport ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl space-y-4">
                  <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-slate-300 font-bold">No Active Case Selected</h3>
                  <p className="text-xs text-slate-500">
                    You must select a complaint from the list or assign one to yourself first.
                  </p>
                  <button
                    onClick={() => setActiveTab("worker_select")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Browse Posted Complaints Board
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                  {/* Selected Complaint Header Info */}
                  <div className="border-b border-slate-800 pb-5">
                    <span className="text-[10px] bg-slate-950 text-indigo-400 font-mono px-2.5 py-1 rounded-lg border border-slate-850">
                      {selectedReport.category} Case #{selectedReport.id}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-3">{selectedReport.title}</h2>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 bg-slate-950/30 p-4 rounded-xl border border-slate-850/50">
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Reporter info */}
                  <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-3">
                      <img 
                        src={usersList.find(u => u.id === selectedReport.citizenId)?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-800" 
                      />
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Complaint Created By</span>
                        <span className="text-xs font-bold text-slate-300">
                          {usersList.find(u => u.id === selectedReport.citizenId)?.fullName || "Citizen"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Assigned Solver</span>
                      <span className="text-xs text-indigo-400 font-semibold font-mono">
                        {selectedReport.assignedWorkerId === currentUser.id ? "You (Field Agent)" : "Other Personnel"}
                      </span>
                    </div>
                  </div>

                  {/* If the complaint is already resolved, show details and don't allow re-submitting */}
                  {selectedReport.status === "RESOLVED" ? (
                    <div className="bg-emerald-950/20 border border-emerald-900 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Check className="w-6 h-6 shrink-0" />
                        <div className="text-left">
                          <h4 className="font-bold text-sm">Complaint Solved Successfully!</h4>
                          <p className="text-xs text-slate-400">This case was closed on {new Date(selectedReport.resolvedAt || "").toLocaleDateString()}.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-500 block">Before Work</span>
                          <img src={selectedReport.beforeImage || selectedReport.images[0]} alt="Before" className="w-full h-32 object-cover rounded-xl mt-1" />
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-mono text-emerald-500 block">After Work Resolved</span>
                          <img src={selectedReport.afterImage || ""} alt="After" className="w-full h-32 object-cover rounded-xl mt-1 border border-emerald-800" />
                        </div>
                      </div>
                      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-xs">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Worker Statement</span>
                        <p className="text-slate-300 leading-relaxed italic">"{selectedReport.workerStatement || "No statement provided."}"</p>
                      </div>
                    </div>
                  ) : (
                    /* Submission Form for active/assigned complaints */
                    <div className="space-y-6">
                      {selectedReport.status !== "IN_PROGRESS" && (
                        <div className="p-4 bg-yellow-950/20 border border-yellow-900/40 text-yellow-300 text-xs rounded-xl flex items-center justify-between">
                          <span>Task status is currently <strong>{selectedReport.status}</strong>. Mark it "In Progress" to begin!</span>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "IN_PROGRESS" })
                                });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                  setSelectedReport(updated);
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-mono font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Set In Progress
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Photo Upload Section */}
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">
                            1. Resolved Work Photo (After Resolution Image URL)
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              required
                              value={workerAfterImage}
                              onChange={(e) => setWorkerAfterImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... (After resolution photo)"
                              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                // Find matching resolved preset image, or fallback to index 3
                                const match = PRESET_RESOLVED_IMAGES.find(img => img.category.toLowerCase() === selectedReport.category.toLowerCase()) || PRESET_RESOLVED_IMAGES[1];
                                setWorkerAfterImage(match.url);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                              title="Load mock resolved photo"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Preset Fixed Photo</span>
                            </button>
                          </div>
                          {workerAfterImage && (
                            <div className="mt-3 bg-slate-950/40 p-2 rounded-xl border border-slate-850 inline-block">
                              <img src={workerAfterImage} alt="Preview of solved work" className="h-24 w-40 object-cover rounded-lg border border-slate-800" />
                            </div>
                          )}
                        </div>

                        {/* Statement Area */}
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">
                            2. Resolution & Solution Statement
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={workerStatement}
                            onChange={(e) => setWorkerStatement(e.target.value)}
                            placeholder="Provide precise details about the solution deployed (e.g., patched water pipe and closed leakage, cleared debris and garbage)..."
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 leading-relaxed font-sans resize-none"
                          />
                        </div>

                        <button
                          onClick={async () => {
                            if (!workerAfterImage.trim()) {
                              alert("Please provide an after-resolution photo URL!");
                              return;
                            }
                            if (!workerStatement.trim()) {
                              alert("Please write a resolution statement describing your solution!");
                              return;
                            }

                            setWorkerActionLoading(true);
                            try {
                              const res = await fetch(`/api/reports/${selectedReport.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  status: "RESOLVED",
                                  afterImage: workerAfterImage,
                                  workerStatement: workerStatement.trim()
                                })
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                                setSelectedReport(updated);
                                setWorkerAfterImage("");
                                setWorkerStatement("");
                                setActiveTab("worker_history");
                              }
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setWorkerActionLoading(false);
                            }
                          }}
                          disabled={workerActionLoading || !workerAfterImage.trim() || !workerStatement.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {workerActionLoading ? "Submitting Solution..." : "✓ Submit Solved Complaint (Mark Resolved)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY OF RESOLVED COMPLAINTS */}
          {activeTab === "worker_history" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>My Selected Cases & Solution History</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Review your assigned municipal complaints, active field operations status, and completed resolution statements.
                </p>
              </div>

              {reports.filter(r => r.assignedWorkerId === currentUser.id).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                  <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">You have no selected cases or solution history yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Go to the **2nd Tab: Select Posted** to assign complaints to your duty queue!</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          <th className="p-4 pl-6">Case Summary</th>
                          <th className="p-4">Visual Comparison</th>
                          <th className="p-4">Who Compliant Created</th>
                          <th className="p-4">Resolution Status</th>
                          <th className="p-4">Solution / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.assignedWorkerId === currentUser.id)
                          .map((report) => {
                            const citizen = usersList.find(u => u.id === report.citizenId);
                            return (
                              <tr key={report.id} className="hover:bg-slate-900/35 transition-colors">
                                {/* Case summary */}
                                <td className="p-4 pl-6 align-top max-w-xs">
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    #{report.id} • {report.category}
                                  </span>
                                  <span className="font-bold text-slate-200 block mt-0.5">{report.title}</span>
                                  <span className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                                    {report.description}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                    📍 {report.address}
                                  </span>
                                </td>

                                {/* Visual Comparison */}
                                <td className="p-4 align-top">
                                  <div className="flex gap-2">
                                    <div className="text-center shrink-0">
                                      <img src={report.beforeImage || report.images[0]} alt="Before" className="w-14 h-10 object-cover rounded border border-slate-800" />
                                      <span className="text-[8px] font-mono text-slate-500 block mt-0.5">Before</span>
                                    </div>
                                    {report.status === "RESOLVED" && report.afterImage && (
                                      <div className="text-center shrink-0">
                                        <img src={report.afterImage} alt="After" className="w-14 h-10 object-cover rounded border border-emerald-900" />
                                        <span className="text-[8px] font-mono text-emerald-500 block mt-0.5">After</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Who Compliant Created (Citizen) */}
                                <td className="p-4 align-top">
                                  <div className="flex items-center gap-2">
                                    <img src={citizen?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} alt="Citizen" className="w-7 h-7 rounded-full object-cover border border-slate-800" />
                                    <div className="leading-tight">
                                      <span className="font-bold text-slate-200 block text-[11px]">{citizen?.fullName || "Springfield Citizen"}</span>
                                      <span className="text-[9px] text-slate-500 font-mono block">{citizen?.email || "citizen@springfield.org"}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Resolution Status */}
                                <td className="p-4 align-top">
                                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border block w-max ${
                                    report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                    report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                    report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                    "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                                  }`}>
                                    {report.status.replace("_", " ")}
                                  </span>
                                </td>

                                {/* Solution / Details */}
                                <td className="p-4 align-top max-w-xs">
                                  {report.status === "RESOLVED" ? (
                                    <>
                                      <p className="text-slate-300 font-sans italic text-[11px] leading-relaxed">
                                        "{report.workerStatement || "Resolved successfully."}"
                                      </p>
                                      {report.resolvedAt && (
                                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                          Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">
                                      Active task assigned to you. Head to **3rd Tab: Solve Case** to submit your solution.
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE MAP VIEW */}
          {activeTab === "map" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>Springfield Civic Map Integration</span>
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">Satellite telemetry with live cluster points and coordinate triggers</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ArcGIS World Imagery Activated</span>
                </div>
              </div>

              {/* Advanced Filtering Options */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-semibold font-mono uppercase">Category Layer Filter:</span>
                <button
                  onClick={() => setCategoryFilter("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                    categoryFilter === "All" 
                      ? "bg-indigo-600 text-white border-indigo-500 shadow" 
                      : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-800"
                  }`}
                >
                  All Active Reports
                </button>
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      categoryFilter === cat 
                        ? "bg-indigo-600 text-white border-indigo-500 shadow" 
                        : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dynamic Interactive SVG Mapping widget */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <InteractiveMap
                    reports={reports}
                    onSelectReport={(r) => setSelectedReport(r)}
                    selectedReport={selectedReport}
                    activeCategoryFilter={categoryFilter}
                  />
                </div>
                
                {/* Side Inspector within Map layout */}
                <div className="lg:col-span-4">
                  {!selectedReport ? (
                    <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl">
                      <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 leading-relaxed">Click on any visual marker on the map telemetry to examine details, review severity reports, and verify department assignment.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/95 border border-slate-700/60 p-6 rounded-2xl space-y-4 text-left shadow-2xl shadow-indigo-500/5 backdrop-blur-md">
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block tracking-wider">Selected Telemetry Node</span>
                        <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                          selectedReport.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          selectedReport.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-800/50 text-slate-400 border-slate-800"
                        }`}>
                          #{selectedReport.id}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 leading-snug">{selectedReport.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{selectedReport.description}</p>
                      
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Latitude:</span>
                          <span className="text-slate-200 font-semibold">{selectedReport.latitude}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Longitude:</span>
                          <span className="text-slate-200 font-semibold">{selectedReport.longitude}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("dashboard")}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Inspect in Core Dashboard</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPORT NEW COMPLAINT */}
          {activeTab === "report" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Report a Municipal Complaint</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Submit high-contrast photos, specify locations via manual typing or map pins, and trigger automated AI analysis</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Form Elements */}
                <form className="md:col-span-7 space-y-5" onSubmit={handleReportSubmit}>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Title of Complaint</label>
                    <input
                      type="text"
                      required
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g., Damaged sewer pipe leak"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Complaint Statement (Detailed Description)</label>
                    <textarea
                      required
                      rows={4}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please describe the extent of damage, hazard safety levels, and any specific notes for maintenance workers..."
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Problem Category</label>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Locating Selector Option */}
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Locating Option</label>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-850 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLocatingMethod("pin")}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            locatingMethod === "pin"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Pin Map
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocatingMethod("write")}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            locatingMethod === "write"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Write Address
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manual Address Typing or Locked Pin Address */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                      {locatingMethod === "write" ? "Write Complaint Address Location" : "Pinned Address (Click Map on Right)"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={reportAddress}
                        disabled={locatingMethod === "pin" || isGeocoding}
                        onChange={(e) => {
                          setReportAddress(e.target.value);
                        }}
                        onBlur={async () => {
                          if (locatingMethod === "write") {
                            await triggerGeocoding(reportAddress);
                          }
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            await triggerGeocoding(reportAddress);
                          }
                        }}
                        placeholder={locatingMethod === "write" ? "e.g., CenAPUB Colony, Gajuwaka, Visakhapatnam" : "Click anywhere on the map grid to lock location coordinates..."}
                        className={`flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none transition-all ${
                          locatingMethod === "pin" ? "opacity-75 cursor-not-allowed text-slate-400" : "focus:border-indigo-500/50 border-indigo-500/20"
                        }`}
                      />
                      {locatingMethod === "write" && (
                        <button
                          type="button"
                          disabled={isGeocoding}
                          onClick={() => triggerGeocoding(reportAddress)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-lg shadow-indigo-500/10"
                          title="Locate typed address on the Springfield map"
                        >
                          {isGeocoding ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>{isGeocoding ? "Locating..." : "Locate"}</span>
                        </button>
                      )}
                    </div>
                    {locatingMethod === "write" && (
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5 block">
                        💡 Press <strong className="text-slate-400">Enter</strong> or click <strong className="text-indigo-400">Locate</strong> to focus the telemetry map on this address area!
                      </span>
                    )}
                  </div>

                  {/* Upload Picture File Drag and Drop section */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">Upload Picture of Issue</label>
                    
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                        isDraggingFile 
                          ? "border-indigo-500 bg-indigo-950/20" 
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <input
                        id="citizen-pic-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      
                      {reportImages.length > 0 ? (
                        <div className="space-y-3">
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-800">
                            <img src={reportImages[0]} alt="Uploaded preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReportImages([])}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Remove photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">Custom Evidence Photo Loaded</span>
                        </div>
                      ) : (
                        <label htmlFor="citizen-pic-upload" className="cursor-pointer block space-y-2">
                          <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                          <div className="text-xs text-slate-300 font-semibold">
                            Drag & drop your picture here or <span className="text-indigo-400 underline">browse</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Supports JPEG, PNG or SVG formats</p>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Preset Quick Select Options */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-2">Or Quick Select Preset Camera Mockup</label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_CIVIC_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => {
                            setReportImages([img.url]);
                            setReportCategory(img.category);
                            setReportTitle(img.name + " at Maple");
                          }}
                          className={`border rounded-xl p-1 overflow-hidden transition-all text-center relative cursor-pointer ${
                            reportImages[0] === img.url 
                              ? "border-indigo-500 bg-indigo-950/20" 
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <img src={img.url} alt="Preset preview" className="w-full h-12 object-cover rounded-lg" />
                          <span className="text-[8px] font-mono text-slate-400 block mt-1 truncate">{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-500/10"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span>Submit Complaint</span>
                  </button>
                </form>

                {/* Left Side: Map positioning selector */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Locating Visual Map Telemetry</span>
                  <InteractiveMap
                    reports={[]}
                    isReportingMode={true}
                    reportLatitude={reportLatitude}
                    reportLongitude={reportLongitude}
                    onMapClick={(lat, lng, addr) => {
                      if (locatingMethod === "pin") {
                        setReportLatitude(lat);
                        setReportLongitude(lng);
                        setReportAddress(addr);
                      }
                    }}
                  />
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-[10px] text-slate-500 space-y-1">
                    <span className="font-semibold block text-slate-400">Current GPS Latitude: {reportLatitude.toFixed(5)}</span>
                    <span className="font-semibold block text-slate-400">Current GPS Longitude: {reportLongitude.toFixed(5)}</span>
                    <span className="block mt-1">Matched Location: {reportAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CITIZEN RESOLVED HISTORY LOG */}
          {activeTab === "citizen_history" && currentUser && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>My Reported Complaints & Resolved History</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Track the progress, assigned personnel, and engineering solutions of your submitted municipal reports.
                </p>
              </div>

              {reports.filter(r => r.citizenId === currentUser.id).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">You have not submitted any complaints yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Submit your first complaint in the **Report New Complaint** tab!</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          <th className="p-4 pl-6">Complaint Details</th>
                          <th className="p-4">Visual Evidence</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Who Solved It</th>
                          <th className="p-4">Resolution Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {reports
                          .filter(r => r.citizenId === currentUser.id)
                          .map((report) => {
                            const solver = report.assignedWorkerId 
                              ? usersList.find(u => u.id === report.assignedWorkerId) 
                              : null;
                            return (
                              <tr key={report.id} className="hover:bg-slate-900/35 transition-colors">
                                {/* Details */}
                                <td className="p-4 pl-6 align-top max-w-xs">
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    #{report.id} • {report.category} • {new Date(report.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="font-bold text-slate-200 block mt-1">{report.title}</span>
                                  <span className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                                    {report.description}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                                    📍 Address: {report.address}
                                  </span>
                                </td>

                                {/* Images */}
                                <td className="p-4 align-top">
                                  <div className="flex gap-2">
                                    <div className="text-center shrink-0">
                                      <img src={report.beforeImage || report.images[0]} alt="Original" className="w-14 h-10 object-cover rounded border border-slate-800" />
                                      <span className="text-[8px] font-mono text-slate-500 block mt-0.5">Before</span>
                                    </div>
                                    {report.status === "RESOLVED" && report.afterImage && (
                                      <div className="text-center shrink-0">
                                        <img src={report.afterImage} alt="Resolved" className="w-14 h-10 object-cover rounded border border-emerald-900" />
                                        <span className="text-[8px] font-mono text-emerald-500 block mt-0.5">After</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-4 align-top">
                                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded border block w-max ${
                                    report.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                    report.status === "ASSIGNED" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                    report.status === "IN_PROGRESS" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" :
                                    "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                                  }`}>
                                    {report.status.replace("_", " ")}
                                  </span>
                                </td>

                                {/* Resolver */}
                                <td className="p-4 align-top">
                                  {report.status === "RESOLVED" && solver ? (
                                    <div className="flex items-center gap-2">
                                      <img src={solver.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} alt="Solver" className="w-7 h-7 rounded-full object-cover border border-slate-800" />
                                      <div className="leading-tight">
                                        <span className="font-bold text-slate-200 block text-[11px]">{solver.fullName}</span>
                                        <span className="text-[9px] text-indigo-400 font-mono block">{solver.department || "Field Department"}</span>
                                      </div>
                                    </div>
                                  ) : report.assignedWorkerId && solver ? (
                                    <div className="flex items-center gap-2">
                                      <img src={solver.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} alt="Assigned" className="w-7 h-7 rounded-full object-cover border border-slate-800 opacity-60" />
                                      <div className="leading-tight opacity-75">
                                        <span className="font-bold text-slate-300 block text-[11px]">{solver.fullName}</span>
                                        <span className="text-[9px] text-slate-500 font-mono block">In Progress</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">Awaiting Field Dispatch</span>
                                  )}
                                </td>

                                {/* Solution comments */}
                                <td className="p-4 align-top max-w-xs">
                                  {report.status === "RESOLVED" ? (
                                    <>
                                      <p className="text-slate-300 font-sans italic text-[11px] leading-relaxed">
                                        "{report.workerStatement || "Resolved successfully by our field operations unit."}"
                                      </p>
                                      {report.resolvedAt && (
                                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                          Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono italic">
                                      Our Municipal units are preparing to resolve this issue. Check back soon!
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS DIRECTORY (Admin/Manager check) */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Authorized Personnel & Users Directory</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Suspend profiles, verify departments, and coordinate field workers</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider font-mono text-slate-400">
                      <th className="p-4 pl-6">Full Name & Contact</th>
                      <th className="p-4">User Role</th>
                      <th className="p-4">Department / Region</th>
                      <th className="p-4">Suspension Status</th>
                      <th className="p-4 text-right pr-6">Override Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <img src={usr.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-800" />
                          <div>
                            <span className="font-bold text-slate-100 block">{usr.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{usr.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                            usr.role === "SUPER_ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            usr.role === "MANAGER" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            usr.role === "SOCIAL_WORKER" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {usr.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {usr.role === "SOCIAL_WORKER" ? usr.department : usr.role === "MANAGER" ? `${usr.department} • ${usr.assignedRegion}` : "N/A"}
                        </td>
                        <td className="p-4">
                          {usr.isSuspended ? (
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                              Suspended
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6">
                          {usr.id === currentUser.id ? (
                            <span className="text-[10px] text-slate-600 font-mono">Current User</span>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspendUser(usr.id, usr.isSuspended)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                usr.isSuspended 
                                  ? "bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900" 
                                  : "bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900"
                              }`}
                            >
                              {usr.isSuspended ? "Unsuspend User" : "Suspend User"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM SETTINGS (Super Admin check) */}
          {activeTab === "settings" && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>Global System Settings</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Configure threshold variables, auto routing and alerting coordinates</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="space-y-4">
                  
                  {/* Option 1 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">Enable AI Duplicate Clustering</span>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Automatically identify incoming duplicate complaints in the same 200m district coordinates.</p>
                    </div>
                    <select
                      value={settings.enableAiClustering}
                      onChange={(e) => setSettings({ ...settings, enableAiClustering: e.target.value })}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  {/* Option 2 */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="font-bold text-slate-200 block text-xs">Smart Auto-Routing</span>
                      <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Dispatches reports directly to matching departments using Gemini-generated recommendations.</p>
                    </div>
                    <select
                      value={settings.autoRoutingEnabled}
                      onChange={(e) => setSettings({ ...settings, autoRoutingEnabled: e.target.value })}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>

                  {/* Option 3 */}
                  <div>
                    <span className="font-bold text-slate-200 block text-xs mb-1">Alert Escalation Contacts</span>
                    <p className="text-[10px] text-slate-500 mb-2">Configure comma-separated municipal safety contact points for urgent CRITICAL alerts.</p>
                    <input
                      type="text"
                      value={settings.alertContacts}
                      onChange={(e) => setSettings({ ...settings, alertContacts: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(settings)
                      });
                      if (res.ok) {
                        alert("Settings applied and propagated globally!");
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow"
                >
                  Save and Sync Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: MY PROFILE VIEW (Citizen & Social Worker) */}
          {activeTab === "profile" && currentUser && (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-left">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>My Profile Identity Management</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">Manage your public contact information, select avatars, and view your civic activities history</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
                
                {/* Avatar select section */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Select Profile Avatar</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                    <img src={currentUser.avatar} alt="Current" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 font-mono block mb-2">Preset Municipal Avatars:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
                        ].map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${currentUser.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ avatar: url })
                                });
                                if (res.ok) {
                                  const updatedUser = await res.json();
                                  setCurrentUser(updatedUser);
                                  setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className={`w-9 h-9 rounded-full overflow-hidden border cursor-pointer transition-all ${
                              currentUser.avatar === url ? "border-indigo-400 ring-2 ring-indigo-500/20" : "border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Avatar Upload Area & Direct Link Input */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/65 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">Option A: Drag & Drop Custom Photo</span>
                    <p className="text-[10px] text-slate-500 mb-3">Upload your custom profile picture directly. Supports drag & drop or click to choose.</p>
                    
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAvatarDragActive(false);
                        const files = e.dataTransfer.files;
                        if (files && files[0]) {
                          await handleAvatarFileUpload(files[0]);
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById("avatar-file-input");
                        if (fileInput) fileInput.click();
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        avatarDragActive 
                          ? "border-indigo-500 bg-indigo-500/5 text-indigo-300" 
                          : "border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="file"
                        id="avatar-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            await handleAvatarFileUpload(files[0]);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-xs font-bold">
                        {avatarUploadStatus === "uploading" ? "Uploading photo..." : "Drop photo here or Click to select"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">PNG, JPG or WEBP up to 5MB</span>
                      {avatarUploadStatus === "success" && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold mt-1">✓ Photo updated successfully!</span>
                      )}
                      {avatarUploadStatus === "error" && (
                        <span className="text-[10px] text-red-400 font-mono font-bold mt-1">⚠ Upload failed. Try another file.</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">Option B: Use Custom Image URL</span>
                    <p className="text-[10px] text-slate-500 mb-2.5">Paste an external web link directly to set as your profile avatar.</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="https://example.com/my-photo.jpg"
                          value={avatarUrlInput}
                          onChange={(e) => setAvatarUrlInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8.5 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!avatarUrlInput.trim()) return;
                          try {
                            setAvatarUploadStatus("uploading");
                            const res = await fetch(`/api/users/${currentUser.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ avatar: avatarUrlInput.trim() })
                            });
                            if (res.ok) {
                              const updatedUser = await res.json();
                              setCurrentUser(updatedUser);
                              setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                              setAvatarUrlInput("");
                              setAvatarUploadStatus("success");
                              setTimeout(() => setAvatarUploadStatus("idle"), 3000);
                            } else {
                              setAvatarUploadStatus("error");
                            }
                          } catch (e) {
                            console.error(e);
                            setAvatarUploadStatus("error");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile update form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = {
                      fullName: (form.elements.namedItem("fullName") as HTMLInputElement).value,
                      email: (form.elements.namedItem("email") as HTMLInputElement).value,
                      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
                    };
                    try {
                      const res = await fetch(`/api/users/${currentUser.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const updatedUser = await res.json();
                        setCurrentUser(updatedUser);
                        setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                        alert("Profile successfully saved and synchronized!");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Full Identity Name</label>
                    <input
                      type="text"
                      name="fullName"
                      defaultValue={currentUser.fullName}
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Verified Email Address</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={currentUser.email || ""}
                      placeholder="e.g. abraham@springfield.org"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Contact Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={currentUser.phone || ""}
                      placeholder="e.g. +1 (555) 019-2834"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  {currentUser.role === "SOCIAL_WORKER" && (
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Assigned Department (Read Only)</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.department || "Municipal Field Unit"}
                        className="w-full bg-slate-950/60 border border-slate-850 text-xs text-slate-500 px-4 py-3 rounded-xl font-mono cursor-not-allowed"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow mt-2"
                  >
                    Save Changes & Update Profile
                  </button>
                </form>

                {/* Account details and activities stats */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block border-b border-slate-850 pb-2">
                    Account Metadata Dashboard
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Unique System ID</span>
                      <span className="text-slate-300">#US-{currentUser.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Current Role</span>
                      <span className="text-indigo-400 uppercase font-bold">{currentUser.role.replace("_", " ")}</span>
                    </div>
                    {currentUser.role === "CITIZEN" && (
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Points Collected</span>
                        <span className="text-amber-400 font-bold">{currentUser.points} Pts</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Total Actions Logged</span>
                      <span className="text-slate-300">
                        {currentUser.role === "CITIZEN" 
                          ? reports.filter(r => r.citizenId === currentUser.id).length 
                          : reports.filter(r => r.assignedWorkerId === currentUser.id).length} Active cases
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
