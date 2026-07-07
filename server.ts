import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: "20mb" }));

// Persistent Local Database file for container active run
const DB_FILE = path.join(process.cwd(), "database.json");

// Ensure Database exists with seed data
function initDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (data.users && data.reports) {
        return data;
      }
    } catch (e) {
      console.error("Failed to parse database file, reinitializing...", e);
    }
  }

  const initialData = {
    users: [
      {
        id: 1,
        email: "citizen@civiclink.ai",
        fullName: "John Doe",
        phone: "+15551112222",
        role: "CITIZEN",
        isSuspended: false,
        points: 120,
        address: "123 Main St, Springfield",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
      },
      {
        id: 2,
        email: "worker@civiclink.ai",
        fullName: "Bob Builder",
        phone: "+15553334444",
        role: "SOCIAL_WORKER",
        isSuspended: false,
        department: "Sanitation & Roads",
        status: "AVAILABLE",
        rating: 4.8,
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"
      },
      {
        id: 3,
        email: "Abi.in",
        fullName: "Abi Manager",
        phone: "+15555551111",
        role: "MANAGER",
        isSuspended: false,
        department: "Public Works",
        assignedRegion: "Springfield East",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
      },
      {
        id: 4,
        email: "Ram.in",
        fullName: "Ram Manager",
        phone: "+15555552222",
        role: "MANAGER",
        isSuspended: false,
        department: "Environmental Safety",
        assignedRegion: "Springfield West",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
      },
      {
        id: 5,
        email: "vivek.in",
        fullName: "Vivek Manager",
        phone: "+15555553333",
        role: "MANAGER",
        isSuspended: false,
        department: "Municipal Development",
        assignedRegion: "Springfield Central",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
      },
      {
        id: 6,
        email: "vivekananda.in",
        fullName: "Vivekananda Super Admin",
        phone: "+15557778888",
        role: "SUPER_ADMIN",
        isSuspended: false,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
      }
    ],
    reports: [
      {
        id: 1,
        title: "Deep Pothole on Maple Avenue",
        description: "There is an extremely deep pothole near the intersection of Maple Ave and 4th St. It is a hazard to passing motorists and could easily damage tires or cause accidents.",
        category: "Potholes",
        priority: "HIGH",
        status: "SUBMITTED",
        latitude: 37.7749,
        longitude: -122.4194,
        address: "Maple Ave & 4th St, Springfield",
        citizenId: 1,
        assignedWorkerId: null,
        aiSeverity: "HIGH",
        aiDepartment: "Road Infrastructure",
        aiSummary: "Deep pothole reported at Maple Ave. Vehicle hazard.",
        aiSolution: "Fill with quick-setting cold-patch asphalt, compact thoroughly, and seal edges.",
        isDuplicate: false,
        images: ["https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800"],
        beforeImage: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
        afterImage: null,
        createdAt: "2026-07-05T10:30:00Z",
        resolvedAt: null
      },
      {
        id: 2,
        title: "Broken Streetlight near Park Entry",
        description: "The streetlight near the east entry of Springfield Public Park has been flickering and is now completely dark. This makes the footpath very dark at night.",
        category: "Streetlight",
        priority: "MEDIUM",
        status: "ASSIGNED",
        latitude: 37.7833,
        longitude: -122.4167,
        address: "East Entrance, Public Park",
        citizenId: 1,
        assignedWorkerId: 2,
        aiSeverity: "MEDIUM",
        aiDepartment: "Electrical Grid",
        aiSummary: "Broken streetlight causing poor lighting at park pathway.",
        aiSolution: "Replace the 150W HPS lamp with a modern, energy-efficient LED fixture and inspect wiring.",
        isDuplicate: false,
        images: ["https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=800"],
        beforeImage: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=800",
        afterImage: null,
        createdAt: "2026-07-04T18:15:00Z",
        resolvedAt: null
      },
      {
        id: 3,
        title: "Illegal Garbage Dumping",
        description: "Someone dumped a large pile of construction debris and household garbage on the side of the road.",
        category: "Garbage",
        priority: "MEDIUM",
        status: "RESOLVED",
        latitude: 37.7794,
        longitude: -122.4224,
        address: "282 Industrial Parkway, Springfield",
        citizenId: 1,
        assignedWorkerId: 2,
        aiSeverity: "MEDIUM",
        aiDepartment: "Sanitation Department",
        aiSummary: "Construction waste illegally dumped on roadway shoulder.",
        aiSolution: "Deploy loader and heavy haul truck to collect and safely dispose of construction waste.",
        isDuplicate: false,
        images: ["https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800"],
        beforeImage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
        afterImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800",
        createdAt: "2026-07-03T09:00:00Z",
        resolvedAt: "2026-07-04T14:30:00Z"
      }
    ],
    messages: [
      {
        id: 1,
        reportId: 2,
        senderId: 1,
        receiverId: 2,
        content: "Hello, when can we expect this streetlight to be repaired? It gets really dark around here.",
        createdAt: "2026-07-05T12:00:00Z"
      },
      {
        id: 2,
        reportId: 2,
        senderId: 2,
        receiverId: 1,
        content: "Hi John! I have received the task assignment and will be coming down with the replacement bulb and ladder truck tomorrow morning around 9 AM.",
        createdAt: "2026-07-05T14:30:00Z"
      }
    ],
    notifications: [
      {
        id: 1,
        userId: 2,
        title: "New Task Assigned",
        message: "You have been assigned to repair 'Broken Streetlight near Park Entry'.",
        isRead: false,
        createdAt: "2026-07-04T18:16:00Z"
      },
      {
        id: 2,
        userId: 1,
        title: "Report Resolved",
        message: "Your complaint 'Illegal Garbage Dumping' has been successfully resolved!",
        isRead: false,
        createdAt: "2026-07-04T14:31:00Z"
      }
    ],
    settings: {
      enableAiClustering: "true",
      autoRoutingEnabled: "true",
      severityThreshold: "HIGH",
      alertContacts: "sanitation@springfield.gov, safety@springfield.gov"
    }
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

const db = initDatabase();

// In-memory active OTP codes for verification
const activeOtps = new Map<string, string>();

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Instantiate Gemini client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Server initialized server-side Gemini client successfully.");
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI client:", e);
  }
} else {
  console.log("GEMINI_API_KEY not configured. Falling back to rule-based analysis.");
}

// API ROUTING

// 1. Auth Endpoints

// Request simulated OTP delivery
app.post("/api/auth/send-otp", (req, res) => {
  const { emailOrPhone, role, isLogin } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ message: "Email or Phone Number is required." });
  }

  const normalized = emailOrPhone.trim().toLowerCase();
  
  // If isLogin is true, check if the account already exists
  if (isLogin) {
    const userExists = db.users.find((u: any) => 
      u.email.toLowerCase() === normalized || 
      (u.phone && u.phone.trim() === emailOrPhone.trim())
    );
    
    // For specific default managers or admins, we always allow login
    const isSpecialAccount = ["abi.in", "ram.in", "vivek.in", "vivekananda.in"].includes(normalized);
    
    if (!userExists && !isSpecialAccount) {
      return res.status(404).json({ message: "No account found with this email/phone. Please Sign Up instead." });
    }
  } else {
    // If sign up, check if account already exists
    const userExists = db.users.find((u: any) => 
      u.email.toLowerCase() === normalized || 
      (u.phone && u.phone.trim() === emailOrPhone.trim())
    );
    if (userExists) {
      return res.status(400).json({ message: "An account already exists with this email/phone. Please Log In." });
    }
    
    // Managers and Super Admin are NOT allowed to register. They must use login only.
    const isSpecialAccount = ["abi.in", "ram.in", "vivek.in", "vivekananda.in"].includes(normalized);
    if (isSpecialAccount) {
      return res.status(400).json({ message: "Manager and Super Admin accounts cannot be registered. They should always use the 'Welcome Back' (Sign In) tab." });
    }
  }

  // Determine the OTP
  let otp = "111111"; // Default OTP for easy testing & demo accounts
  if (normalized === "vivekananda.in") {
    otp = "888888";
  } else if (normalized === "abi.in" || normalized === "ram.in" || normalized === "vivek.in") {
    otp = "111111";
  } else {
    // Generate a random 6-digit OTP for new users
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store active OTP
  activeOtps.set(normalized, otp);
  
  console.log(`[OTP Sent] Target: ${normalized} | Code: ${otp}`);
  
  return res.json({
    success: true,
    otp,
    message: `OTP sent successfully! Enter code ${otp} to authenticate.`
  });
});

// Verify OTP & complete Login/Signup
app.post("/api/auth/verify-otp", (req, res) => {
  const { emailOrPhone, otp, isLogin, fullName, role } = req.body;
  if (!emailOrPhone || !otp) {
    return res.status(400).json({ message: "Email/Phone and OTP are required." });
  }

  const normalized = emailOrPhone.trim().toLowerCase();
  
  // Verify standard or dynamic OTP
  let expectedOtp = "111111";
  if (normalized === "vivekananda.in") {
    expectedOtp = "888888";
  } else if (["abi.in", "ram.in", "vivek.in", "citizen@civiclink.ai", "worker@civiclink.ai"].includes(normalized)) {
    expectedOtp = "111111";
  } else {
    expectedOtp = activeOtps.get(normalized) || "111111";
  }

  if (otp.trim() !== expectedOtp) {
    return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
  }

  let user = db.users.find((u: any) => 
    u.email.toLowerCase() === normalized || 
    (u.phone && u.phone.trim() === emailOrPhone.trim())
  );

  if (isLogin) {
    // If not found, check if it's one of the static accounts and auto-create
    if (!user) {
      if (["abi.in", "ram.in", "vivek.in"].includes(normalized)) {
        const index = db.users.length + 1;
        const name = normalized.split(".")[0];
        user = {
          id: index,
          email: normalized,
          fullName: `${name.charAt(0).toUpperCase() + name.slice(1)} Manager`,
          phone: `+1555555000${index}`,
          role: "MANAGER",
          isSuspended: false,
          department: "Municipal Services",
          assignedRegion: "Springfield",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
        };
        db.users.push(user);
        saveDb();
      } else if (normalized === "vivekananda.in") {
        user = {
          id: db.users.length + 1,
          email: "vivekananda.in",
          fullName: "Vivekananda Super Admin",
          phone: "+15557778888",
          role: "SUPER_ADMIN",
          isSuspended: false,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
        };
        db.users.push(user);
        saveDb();
      } else {
        return res.status(404).json({ message: "No account found. Please sign up first." });
      }
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "This account has been suspended by the administrator." });
    }

    // Clear verification
    activeOtps.delete(normalized);

    return res.json({
      token: `mock-jwt-token-for-user-${user.id}`,
      user
    });
  } else {
    // Signup
    if (user) {
      return res.status(400).json({ message: "Account already exists with this email/phone. Please log in." });
    }

    if (["abi.in", "ram.in", "vivek.in", "vivekananda.in"].includes(normalized)) {
      return res.status(400).json({ message: "Manager and Super Admin accounts cannot be registered. They should always use the 'Welcome Back' (Sign In) tab." });
    }

    if (!fullName || !role) {
      return res.status(400).json({ message: "Full Name and Role are required for registration." });
    }

    const isEmail = normalized.includes("@") || normalized.endsWith(".in");
    const userEmail = isEmail ? normalized : `${normalized}@civiclink.ai`;
    const userPhone = isEmail ? "" : emailOrPhone.trim();

    const newUser = {
      id: db.users.length + 1,
      email: userEmail,
      fullName,
      phone: userPhone,
      role,
      isSuspended: false,
      points: role === "CITIZEN" ? 0 : undefined,
      department: role === "SOCIAL_WORKER" ? "Sanitation & Infrastructure" : undefined,
      status: role === "SOCIAL_WORKER" ? "AVAILABLE" : undefined,
      rating: role === "SOCIAL_WORKER" ? 5.0 : undefined,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120`
    };

    db.users.push(newUser);
    saveDb();

    // Clear verification
    activeOtps.delete(normalized);

    return res.json({
      token: `mock-jwt-token-for-user-${newUser.id}`,
      user: newUser
    });
  }
});

// Geocoding Proxy Endpoint
app.get("/api/geocode", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Missing address query parameter 'q'" });
  }

  // 1. Try Nominatim API first
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "MunicipalServiceApp/1.0"
        }
      }
    );
    if (response.ok) {
      const data = await response.json() as any;
      if (data && data.length > 0) {
        return res.json({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim search failed in backend proxy, falling back to Gemini:", err);
  }

  // 2. Fallback to Gemini API if Nominatim fails or returns no results
  if (ai) {
    try {
      const prompt = `You are an expert geocoder. Convert the following address query into precise latitude and longitude coordinates and provide a polished display name.
      Query: "${query}"
      
      Respond with a JSON object matching this schema:
      {
        "lat": number,
        "lng": number,
        "display_name": string
      }
      If the location is highly specific (e.g. "CenAPUB Colony, Gajuwaka"), do your best to estimate the correct coordinates within that city/region.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              display_name: { type: Type.STRING }
            },
            required: ["lat", "lng", "display_name"]
          }
        }
      });

      if (aiResponse && aiResponse.text) {
        const result = JSON.parse(aiResponse.text.trim());
        return res.json({
          lat: result.lat,
          lng: result.lng,
          display_name: result.display_name
        });
      }
    } catch (e) {
      console.error("Gemini geocoding failed as fallback:", e);
    }
  }

  // 3. Ultimate mock fallback
  // Deterministic Springfield coords if everything fails
  const clean = query.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 4000) - 0.0125;
  const lngOffset = ((Math.abs(hash >> 3) % 100) / 4000) - 0.0125;
  res.json({
    lat: 37.7749 + latOffset,
    lng: -122.4194 + lngOffset,
    display_name: `${query}, Springfield`
  });
});

// Reverse Geocoding Proxy Endpoint
app.get("/api/reverse-geocode", async (req, res) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing 'lat' or 'lng' parameter" });
  }

  // 1. Try Nominatim
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "MunicipalServiceApp/1.0"
        }
      }
    );
    if (response.ok) {
      const data = await response.json() as any;
      if (data && data.display_name) {
        return res.json({
          display_name: data.display_name
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed in backend, falling back to Gemini:", err);
  }

  // 2. Fallback to Gemini
  if (ai) {
    try {
      const prompt = `You are a reverse geocoding tool. Convert the GPS coordinates (Latitude: ${lat}, Longitude: ${lng}) into a human-readable street address or location name.
      Provide a JSON object matching this schema:
      {
        "display_name": string
      }`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              display_name: { type: Type.STRING }
            },
            required: ["display_name"]
          }
        }
      });

      if (aiResponse && aiResponse.text) {
        const result = JSON.parse(aiResponse.text.trim());
        return res.json({
          display_name: result.display_name
        });
      }
    } catch (e) {
      console.error("Gemini reverse geocode failed:", e);
    }
  }

  // 3. Basic fallback
  res.json({
    display_name: `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`
  });
});

// 2. Report Endpoints
app.get("/api/reports", (req, res) => {
  res.json(db.reports);
});

app.get("/api/reports/:id", (req, res) => {
  const report = db.reports.find((r: any) => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ message: "Report not found" });
  res.json(report);
});

// AI analysis & submission of complaint
app.post("/api/reports", async (req, res) => {
  const { title, description, category, latitude, longitude, address, images, citizenId } = req.body;

  let aiSeverity = "MEDIUM";
  let aiDepartment = "Public Works";
  let aiSummary = "Standard citizen service complaint submitted.";
  let aiSolution = "Requires field engineer review and standard structural patch.";
  let isDuplicate = false;

  // Let's run a real-time smart duplicate detection
  const duplicateMatch = db.reports.find((r: any) => {
    // Within 200m or similar lat-lon, and matching category
    const isClose = Math.abs(r.latitude - latitude) < 0.005 && Math.abs(r.longitude - longitude) < 0.005;
    const sameCategory = r.category.toLowerCase() === category.toLowerCase();
    const isNotResolved = r.status !== "RESOLVED";
    return isClose && sameCategory && isNotResolved;
  });

  if (duplicateMatch) {
    isDuplicate = true;
    aiSummary = `DUPLICATE DETECTED: Similar issue already reported (ID: ${duplicateMatch.id}).`;
  }

  // If Gemini is available, run advanced analysis
  if (ai && images && images.length > 0) {
    try {
      let imagePart: any = null;
      if (images[0].startsWith("data:image")) {
        const matches = images[0].match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      }

      const prompt = `You are "CivicLink AI", a smart city municipal assistant.
      An issue has been reported by a citizen:
      Title: "${title}"
      Description: "${description}"
      Category: "${category}"
      Location Address: "${address || "Coordinates: " + latitude + ", " + longitude}"
      
      Please perform a thorough analysis of this civic problem. Return a clean, standardized JSON response containing the following analysis properties:
      1. severity: One of "LOW", "MEDIUM", "HIGH", or "CRITICAL".
      2. department: The optimal department (e.g. "Sanitation Dept", "Roads & Bridges", "Electrical & Grid", "Water & Sewage", "Fire & Rescue Services", "Environmental Protection", "Animal Services", "Traffic Management").
      3. summary: A clean, objective, 2-3 sentence summary of the issue.
      4. suggestedSolution: A practical step-by-step guideline on how the social worker or field technicians should resolve this issue.
      
      Output ONLY valid, parseable JSON without any surrounding markdown codeblocks.`;

      const contents = imagePart 
        ? { parts: [imagePart, { text: prompt }] }
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING },
              department: { type: Type.STRING },
              summary: { type: Type.STRING },
              suggestedSolution: { type: Type.STRING }
            },
            required: ["severity", "department", "summary", "suggestedSolution"]
          }
        }
      });

      if (response && response.text) {
        const result = JSON.parse(response.text.trim());
        aiSeverity = result.severity || aiSeverity;
        aiDepartment = result.department || aiDepartment;
        aiSummary = result.summary || aiSummary;
        aiSolution = result.suggestedSolution || aiSolution;
      }
    } catch (e) {
      console.error("Gemini AI API failure, continuing with standard analyzer.", e);
    }
  } else {
    // Simple fallback heuristics
    if (category === "Fire" || category === "Flood") {
      aiSeverity = "CRITICAL";
      aiDepartment = "Fire & Emergency Services";
    } else if (category === "Potholes" || category === "Road damage") {
      aiSeverity = "HIGH";
      aiDepartment = "Roads & Engineering";
    } else if (category === "Streetlight") {
      aiSeverity = "MEDIUM";
      aiDepartment = "Electrical Grid Dept";
    }
  }

  const newReport = {
    id: db.reports.length + 1,
    title,
    description,
    category,
    priority: aiSeverity,
    status: isDuplicate ? "REVIEWED" : "SUBMITTED",
    latitude,
    longitude,
    address: address || "Springfield",
    citizenId: citizenId || 1,
    assignedWorkerId: null,
    aiSeverity,
    aiDepartment,
    aiSummary,
    aiSolution,
    isDuplicate,
    images: images || [],
    beforeImage: images && images[0] ? images[0] : "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    afterImage: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };

  db.reports.push(newReport);

  // Send a automatic notification to nearby managers
  const managers = db.users.filter((u: any) => u.role === "MANAGER");
  managers.forEach((m: any) => {
    db.notifications.push({
      id: db.notifications.length + 1,
      userId: m.id,
      title: "New Civic Problem Reported",
      message: `A new problem (${category}) has been submitted at ${newReport.address}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  });

  saveDb();
  res.json(newReport);
});

// Update Report Status & Workers (Assigning, resolving)
app.patch("/api/reports/:id", (req, res) => {
  const reportId = parseInt(req.params.id);
  const report = db.reports.find((r: any) => r.id === reportId);
  if (!report) return res.status(404).json({ message: "Report not found" });

  const { status, assignedWorkerId, afterImage, beforeImage } = req.body;

  if (status !== undefined) {
    report.status = status;
    if (status === "RESOLVED") {
      report.resolvedAt = new Date().toISOString();
      // Grant loyalty points to reporter
      const reporter = db.users.find((u: any) => u.id === report.citizenId);
      if (reporter) {
        reporter.points = (reporter.points || 0) + 50;
      }
      // Notify citizen
      db.notifications.push({
        id: db.notifications.length + 1,
        userId: report.citizenId,
        title: "Complaint Resolved!",
        message: `Your reported complaint "${report.title}" is marked as RESOLVED. Thank you for making Springfield cleaner!`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  if (assignedWorkerId !== undefined) {
    report.assignedWorkerId = assignedWorkerId;
    if (assignedWorkerId) {
      report.status = "ASSIGNED";
      // Notify worker
      db.notifications.push({
        id: db.notifications.length + 1,
        userId: assignedWorkerId,
        title: "New Job Assigned",
        message: `Manager assigned you: "${report.title}".`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  if (afterImage !== undefined) {
    report.afterImage = afterImage;
  }
  if (beforeImage !== undefined) {
    report.beforeImage = beforeImage;
  }
  if (req.body.workerStatement !== undefined) {
    report.workerStatement = req.body.workerStatement;
  }

  saveDb();
  res.json(report);
});

// Delete Report (Admin privilege)
app.delete("/api/reports/:id", (req, res) => {
  const reportId = parseInt(req.params.id);
  const index = db.reports.findIndex((r: any) => r.id === reportId);
  if (index === -1) return res.status(404).json({ message: "Report not found" });

  db.reports.splice(index, 1);
  saveDb();
  res.json({ message: "Report deleted successfully." });
});

// 3. User & Admin Management
app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.patch("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { isSuspended, fullName, phone, department, assignedRegion, email, avatar } = req.body;

  if (isSuspended !== undefined) user.isSuspended = isSuspended;
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department;
  if (assignedRegion !== undefined) user.assignedRegion = assignedRegion;
  if (email !== undefined) user.email = email;
  if (avatar !== undefined) user.avatar = avatar;

  saveDb();
  res.json(user);
});

// 4. Notifications API
app.get("/api/notifications/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);
  const notifs = db.notifications.filter((n: any) => n.userId === userId);
  res.json(notifs);
});

app.post("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  db.notifications.forEach((n: any) => {
    if (n.userId === parseInt(userId)) {
      n.isRead = true;
    }
  });
  saveDb();
  res.json({ status: "success" });
});

// 5. Chat Messaging API
app.get("/api/chat/:reportId", (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const chatMsgs = db.messages.filter((m: any) => m.reportId === reportId);
  res.json(chatMsgs);
});

app.post("/api/chat", (req, res) => {
  const { reportId, senderId, receiverId, content } = req.body;

  const newMsg = {
    id: db.messages.length + 1,
    reportId: parseInt(reportId),
    senderId: parseInt(senderId),
    receiverId: parseInt(receiverId),
    content,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMsg);
  saveDb();
  res.json(newMsg);
});

// 6. Weather Endpoints (Simulated based on loc)
app.get("/api/weather", (req, res) => {
  const { lat, lon } = req.query;
  // Dynamic mocked response
  res.json({
    temp: 24.2 + (Math.sin(parseFloat(lat as string) || 0) * 3),
    humidity: 62 + Math.floor(Math.random() * 10),
    rain: Math.random() > 0.7 ? 2.5 : 0.0,
    windSpeed: 11.4 + Math.floor(Math.random() * 5),
    condition: Math.random() > 0.7 ? "Light Rain" : "Sunny Springfield skies"
  });
});

// 7. System Settings
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json(db.settings);
});

// VITE MIDDLEWARE CONFIGURATION

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
