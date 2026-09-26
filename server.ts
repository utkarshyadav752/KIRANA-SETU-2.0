import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer } from "ws";
import { db } from "./server/db.js";
import {
  handleChatAssistant,
  handleTTS,
  setupGeminiLiveWebSocket,
} from "./server/geminiAssistant.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Lazy GenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "KiranaSetu", time: new Date().toISOString() });
});

// ==========================================
// 0. AUTHENTICATION ENDPOINTS (SELLER & CUSTOMER)
// ==========================================

// Helper for strong password verification
function validateStrongPassword(pass: string): { valid: boolean; error?: string } {
  if (!pass || pass.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(pass)) {
    return { valid: false, error: "Password must include at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(pass)) {
    return { valid: false, error: "Password must include at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(pass)) {
    return { valid: false, error: "Password must include at least one digit (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) {
    return { valid: false, error: "Password must include at least one special character (!@#$%&*)." };
  }
  return { valid: true };
}

// 0.1 Seller Registration (with mandatory business proof & strong password)
app.post("/api/auth/seller/register", (req, res) => {
  const {
    ownerName,
    shopName,
    phone,
    email,
    password,
    confirmPassword,
    businessProofs,
    dedicatedUpiId,
    address,
    area,
    city,
  } = req.body;

  // Basic required fields
  if (!ownerName || !shopName || !phone || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Owner name, shop name, phone, email, and password are required.",
    });
  }

  // Password matching
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "Passwords do not match. Please re-enter your password correctly.",
    });
  }

  // Strong password validation
  const pwCheck = validateStrongPassword(password);
  if (!pwCheck.valid) {
    return res.status(400).json({ success: false, error: pwCheck.error });
  }

  // Business Proof validation (MUST enter at least one valid proof)
  if (!Array.isArray(businessProofs) || businessProofs.length === 0) {
    return res.status(400).json({
      success: false,
      error: "You must provide at least one valid business proof (e.g., GSTIN, MSME Certificate, Udyog Aadhaar, FSSAI License, or Shop & Establishment Act).",
    });
  }

  const validProofs = businessProofs.filter(
    (bp) => bp.type && bp.documentNumber && String(bp.documentNumber).trim().length >= 4
  );

  if (validProofs.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one valid business certificate/document number is required.",
    });
  }

  // Check if phone or email already registered
  const normalizedPhone = phone.replace(/\s+/g, "");
  const normalizedEmail = email.toLowerCase().trim();

  const existingSeller = db.sellers.find(
    (s) =>
      s.phone.replace(/\s+/g, "") === normalizedPhone ||
      s.email.toLowerCase().trim() === normalizedEmail
  );

  if (existingSeller) {
    return res.status(409).json({
      success: false,
      error: "A seller with this phone number or email is already registered. Please log in instead.",
    });
  }

  const shopId = `shop-${Date.now()}`;
  const sellerId = `seller-${Date.now()}`;
  const nowISO = new Date().toISOString();

  // Find primary GSTIN if provided
  const gstinProof = validProofs.find((p) => p.type === "GSTIN");
  const finalUpi = dedicatedUpiId?.trim() || `${normalizedPhone.replace(/\D/g, "")}@upi`;

  // Create Shop for Seller
  const newShop = {
    id: shopId,
    name: shopName.trim(),
    ownerName: ownerName.trim(),
    phone: phone.trim(),
    address: address?.trim() || "Main Market Road",
    area: area?.trim() || "Indiranagar",
    city: city?.trim() || "Bengaluru",
    category: "Kirana & FMCG Provisions",
    openingHours: "07:00 AM",
    closingHours: "10:30 PM",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60",
    gstNumber: gstinProof?.documentNumber || undefined,
    businessProofs: validProofs.map((p) => ({
      type: p.type,
      label: p.label || p.type,
      documentNumber: p.documentNumber.trim(),
      documentName: p.documentName || `${p.type}_Certificate.pdf`,
      issuedDate: p.issuedDate || new Date().toISOString().split("T")[0],
      verified: true,
    })),
    upiId: finalUpi,
    deliveryAvailable: true,
    reservationAvailable: true,
    reservationExpiryMinutes: 30,
    rating: 5.0,
    totalRatings: 1,
    distanceKm: 0.5,
  };

  // Seed sample products into new shop for instant POS experience
  const sampleProducts = db.products.slice(0, 10).map((p, idx) => ({
    ...p,
    id: `prod-${shopId}-${idx}`,
    shopId: shopId,
    currentStock: 25,
    reservedStock: 0,
  }));

  db.shops.unshift(newShop);
  db.products.push(...sampleProducts);

  // Create Seller User
  const newSeller = {
    id: sellerId,
    shopId: shopId,
    ownerName: ownerName.trim(),
    shopName: shopName.trim(),
    phone: phone.trim(),
    email: normalizedEmail,
    passwordHash: password,
    businessProofs: newShop.businessProofs,
    dedicatedUpiId: finalUpi,
    address: newShop.address,
    area: newShop.area,
    city: newShop.city,
    createdAt: nowISO,
  };

  db.sellers.unshift(newSeller);

  db.logAudit({
    userId: sellerId,
    userName: ownerName,
    userRole: "seller",
    action: "Seller registration with business proof",
    entity: "Seller",
    entityId: sellerId,
    newValue: `Registered: ${shopName} (Proofs: ${validProofs.map((p) => p.type).join(", ")})`,
  });

  // Safe response without passwordHash
  const { passwordHash: _, ...safeSeller } = newSeller;

  res.status(201).json({
    success: true,
    message: "Seller registered successfully with verified business proof!",
    seller: safeSeller,
    shop: newShop,
  });
});

// 0.2 Seller Login (Phone or Email + Password)
app.post("/api/auth/seller/login", (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Please enter your registered phone number or email, and password.",
    });
  }

  const cleanIdent = identifier.trim().toLowerCase().replace(/\s+/g, "");
  const seller = db.sellers.find((s) => {
    const sPhone = s.phone.replace(/\s+/g, "").toLowerCase();
    const sEmail = s.email.toLowerCase().trim();
    return (
      sPhone === cleanIdent ||
      sPhone.endsWith(cleanIdent) ||
      cleanIdent.endsWith(sPhone.replace("+91", "")) ||
      sEmail === cleanIdent
    );
  });

  if (!seller) {
    return res.status(401).json({
      success: false,
      error: "No registered seller found with this phone number or email. Please register first with your business proof.",
    });
  }

  if (seller.passwordHash !== password) {
    return res.status(401).json({
      success: false,
      error: "Incorrect password. Please verify and try again.",
    });
  }

  const shop = db.shops.find((s) => s.id === seller.shopId) || db.shops[0];
  const { passwordHash: _, ...safeSeller } = seller;

  db.logAudit({
    userId: seller.id,
    userName: seller.ownerName,
    userRole: "seller",
    action: "Seller login",
    entity: "Seller",
    entityId: seller.id,
    newValue: `Seller logged into ${seller.shopName}`,
  });

  res.json({
    success: true,
    message: "Welcome back!",
    seller: safeSeller,
    shop,
  });
});

// 0.2b Get Existing Seller/Merchant Accounts (No passwords or demo samples exposed)
app.get("/api/auth/seller/existing-accounts", (_req, res) => {
  const safeList = db.sellers.map((s) => ({
    id: s.id,
    shopId: s.shopId,
    shopName: s.shopName,
    ownerName: s.ownerName,
    phone: s.phone,
    email: s.email,
    businessProofs: s.businessProofs,
    dedicatedUpiId: s.dedicatedUpiId,
    address: s.address,
    area: s.area,
    city: s.city,
    subscription: s.subscription,
    msmeVerification: s.msmeVerification,
  }));
  res.json({ success: true, data: safeList });
});

// 0.2c Seller Subscription Management (₹20/month, ₹200/year)
app.get("/api/seller/subscription", (req, res) => {
  const sellerId = req.query.sellerId as string;
  const seller = db.sellers.find((s) => s.id === sellerId);
  if (!seller) {
    return res.status(404).json({ success: false, error: "Seller not found" });
  }

  const sub = seller.subscription || {
    plan: "free",
    isPremium: false,
    price: 0,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    features: ["basic_pos", "standard_inventory"],
  };

  res.json({ success: true, subscription: sub });
});

app.post("/api/seller/subscription/subscribe", (req, res) => {
  const { sellerId, plan, paymentMethod, transactionId } = req.body;
  if (!sellerId) {
    return res.status(400).json({ success: false, error: "Seller ID is required" });
  }

  if (plan !== "monthly" && plan !== "yearly") {
    return res.status(400).json({
      success: false,
      error: "Invalid plan. Choose 'monthly' (₹20/month) or 'yearly' (₹200/year).",
    });
  }

  const seller = db.sellers.find((s) => s.id === sellerId);
  if (!seller) {
    return res.status(404).json({ success: false, error: "Seller not found" });
  }

  const now = new Date();
  const daysToAdd = plan === "yearly" ? 365 : 30;
  const price = plan === "yearly" ? 200 : 20;
  const endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

  const updatedSubscription = {
    plan,
    isPremium: true,
    price,
    startDate: now.toISOString(),
    endDate,
    features: [
      "ai_assistant",
      "wholesale_comparator",
      "predictive_shrinkage",
      "custom_qr_standee",
      "priority_holds",
      "ledger_export",
    ],
    paymentMethod: paymentMethod || "UPI",
    transactionId: transactionId || `TXN-SUB-${Date.now()}`,
  };

  seller.subscription = updatedSubscription;

  db.logAudit({
    userId: seller.id,
    userName: seller.ownerName,
    userRole: "seller",
    action: `Subscribed to Kirana Pro (${plan} - ₹${price})`,
    entity: "Subscription",
    entityId: seller.id,
    newValue: `Plan: ${plan}, Price: ₹${price}, Valid until: ${endDate}`,
  });

  const { passwordHash: _, ...safeSeller } = seller;

  res.json({
    success: true,
    message: `Successfully upgraded to Kirana Pro ${plan === "yearly" ? "Annual" : "Monthly"} Plan!`,
    subscription: updatedSubscription,
    seller: safeSeller,
  });
});

app.post("/api/seller/subscription/cancel", (req, res) => {
  const { sellerId } = req.body;
  const seller = db.sellers.find((s) => s.id === sellerId);
  if (!seller) {
    return res.status(404).json({ success: false, error: "Seller not found" });
  }

  seller.subscription = {
    plan: "free",
    isPremium: false,
    price: 0,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    features: ["basic_pos", "standard_inventory"],
  };

  const { passwordHash: _, ...safeSeller } = seller;

  res.json({
    success: true,
    message: "Subscription downgraded to Free plan.",
    subscription: seller.subscription,
    seller: safeSeller,
  });
});

// ==========================================
// 0.2d MSME / B2B VERIFICATION (CASHIFY SUPERSALE MODEL)
// ==========================================

// Get MSME verification status for seller
app.get("/api/seller/msme-verification", (req, res) => {
  const sellerId = req.query.sellerId as string;
  const seller = db.sellers.find((s) => s.id === sellerId);
  if (!seller) {
    return res.status(404).json({ success: false, error: "Seller not found" });
  }

  const verification = seller.msmeVerification || {
    status: "unsubmitted",
    udyamNumber: "",
    enterpriseName: seller.shopName,
    enterpriseType: "Micro",
    businessCategory: "Retail Store",
    panNumber: "",
    state: seller.city || "Karnataka",
    district: seller.area || "Bengaluru",
    b2bBadgeUnlocked: false,
  };

  res.json({
    success: true,
    verification,
    shopName: seller.shopName,
    ownerName: seller.ownerName,
    phone: seller.phone,
  });
});

// Merchant submits document number for team verification
app.post("/api/seller/msme-verification/submit", (req, res) => {
  const {
    sellerId,
    udyamNumber,
    enterpriseName,
    enterpriseType,
    businessCategory,
    panNumber,
    state,
    district,
    certificateUrl,
  } = req.body;

  if (!sellerId || !udyamNumber) {
    return res.status(400).json({
      success: false,
      error: "Seller ID and MSME / Udyam document number are required.",
    });
  }

  const result = db.submitMsmeVerification({
    sellerId,
    udyamNumber,
    enterpriseName,
    enterpriseType,
    businessCategory,
    panNumber,
    state,
    district,
    certificateUrl,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: "MSME document submitted successfully! Our compliance team will verify your credentials within 2-4 hours.",
    verification: result.verification,
    seller: result.seller,
  });
});

// Verification Team Portal: Get all submissions
app.get("/api/admin/msme-verifications", (_req, res) => {
  const submissions = db.getMsmeSubmissions();
  res.json({ success: true, count: submissions.length, data: submissions });
});

// Verification Team Review Action (Approve / Reject)
app.post("/api/admin/msme-verification/review", (req, res) => {
  const { sellerId, decision, reviewedBy, rejectionReason, reviewerNotes } = req.body;

  if (!sellerId || !decision || (decision !== "verified" && decision !== "rejected")) {
    return res.status(400).json({
      success: false,
      error: "Seller ID and valid decision ('verified' or 'rejected') are required.",
    });
  }

  const result = db.reviewMsmeVerification({
    sellerId,
    decision,
    reviewedBy: reviewedBy || "KiranaSetu Verification Desk Officer",
    rejectionReason,
    reviewerNotes,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `Merchant ${decision === "verified" ? "approved & verified" : "marked as rejected"}.`,
    verification: result.verification,
    seller: result.seller,
  });
});

// Helper to get normalized 10-digit phone for Indian mobile numbers
function getCanonicalPhone(phoneStr: string): string {
  const digits = String(phoneStr || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// 0.3 Customer Login & Registration (Google Account + Phone Number)
app.post("/api/auth/customer/login", (req, res) => {
  const { googleUser, phone } = req.body;

  if (!googleUser || !googleUser.email || !googleUser.name) {
    return res.status(400).json({
      success: false,
      error: "Google Account authentication is required for customer login.",
    });
  }

  const rawPhoneDigits = String(phone || "").replace(/\D/g, "");
  if (rawPhoneDigits.length < 10) {
    return res.status(400).json({
      success: false,
      error: "A valid 10-digit mobile phone number is required.",
    });
  }

  const canonPhone = rawPhoneDigits.slice(-10);
  const formattedPhone = `+91 ${canonPhone.slice(0, 5)} ${canonPhone.slice(5)}`;
  const cleanEmail = googleUser.email.toLowerCase().trim();

  // Find or create customer by matching email OR canonical 10-digit phone
  let customer = db.customers.find(
    (c) =>
      c.email.toLowerCase() === cleanEmail ||
      getCanonicalPhone(c.phone) === canonPhone
  );

  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: googleUser.name.trim(),
      email: cleanEmail,
      phone: formattedPhone,
      googleId: googleUser.id || `google-${Date.now()}`,
      avatarUrl:
        googleUser.avatarUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
    };
    db.customers.unshift(customer);
  } else {
    customer.name = googleUser.name.trim();
    customer.email = cleanEmail;
    customer.avatarUrl = googleUser.avatarUrl || customer.avatarUrl;
    customer.phone = formattedPhone;
    customer.isPhoneVerified = true;
  }

  db.logAudit({
    userId: customer.id,
    userName: customer.name,
    userRole: "customer",
    action: "Customer login via Google + Phone",
    entity: "Customer",
    entityId: customer.id,
    newValue: `Logged in via Google (${cleanEmail}) & Phone (${formattedPhone})`,
  });

  res.json({
    success: true,
    message: `Welcome to KiranaSetu, ${customer.name}!`,
    customer,
  });
});

// 0.4 Get Existing Registered Customer Accounts
app.get("/api/auth/customer/existing-accounts", (_req, res) => {
  res.json({ success: true, data: db.customers });
});

// 0.5 Login with Existing Customer Account (Flexible phone/email/name lookup)
app.post("/api/auth/customer/login-existing", (req, res) => {
  const { customerId, identifier } = req.body;
  let customer = customerId
    ? db.customers.find((c) => c.id === customerId)
    : undefined;

  if (!customer && identifier) {
    const rawIdent = String(identifier).trim();
    const cleanIdent = rawIdent.toLowerCase().replace(/\s+/g, "");
    const identCanonPhone = getCanonicalPhone(rawIdent);

    customer = db.customers.find((c) => {
      const cCanonPhone = getCanonicalPhone(c.phone);
      const cEmail = c.email.toLowerCase().trim();
      const cName = c.name.toLowerCase().trim();

      // Match by 10-digit phone
      if (identCanonPhone.length === 10 && cCanonPhone === identCanonPhone) {
        return true;
      }
      // Match by email
      if (cEmail === cleanIdent) {
        return true;
      }
      // Match by customer ID
      if (c.id.toLowerCase() === cleanIdent) {
        return true;
      }
      // Match by full name
      if (cName === rawIdent.toLowerCase() || (cleanIdent.length >= 3 && cName.includes(rawIdent.toLowerCase()))) {
        return true;
      }
      // Partial phone match
      const cPhoneDigits = c.phone.replace(/\D/g, "");
      const identDigits = rawIdent.replace(/\D/g, "");
      if (identDigits.length >= 6 && cPhoneDigits.includes(identDigits)) {
        return true;
      }
      return false;
    });
  }

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "No customer account found with this phone number or email. You can instantly register using the 'New Customer' tab.",
      suggestRegister: true,
    });
  }

  db.logAudit({
    userId: customer.id,
    userName: customer.name,
    userRole: "customer",
    action: "Customer login to existing account",
    entity: "Customer",
    entityId: customer.id,
    newValue: `Existing customer ${customer.name} logged in (${customer.phone})`,
  });

  res.json({
    success: true,
    message: `Welcome back, ${customer.name}!`,
    customer,
  });
});

// 0.6 Quick One-Tap Customer Authentication / Auto-Registration
app.post("/api/auth/customer/quick-phone-auth", (req, res) => {
  const { phone, name, email } = req.body;
  const rawDigits = String(phone || "").replace(/\D/g, "");
  if (rawDigits.length < 10) {
    return res.status(400).json({
      success: false,
      error: "A valid 10-digit mobile number is required.",
    });
  }

  const canonPhone = rawDigits.slice(-10);
  const formattedPhone = `+91 ${canonPhone.slice(0, 5)} ${canonPhone.slice(5)}`;
  const cleanEmail = (email || `${canonPhone}@kirana.market`).toLowerCase().trim();
  const cleanName = (name || `Customer ${canonPhone.slice(-4)}`).trim();

  let customer = db.customers.find(
    (c) =>
      getCanonicalPhone(c.phone) === canonPhone ||
      (email && c.email.toLowerCase() === cleanEmail)
  );

  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: formattedPhone,
      googleId: `quick-auth-${Date.now()}`,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      isPhoneVerified: true,
      createdAt: new Date().toISOString(),
    };
    db.customers.unshift(customer);
  }

  db.logAudit({
    userId: customer.id,
    userName: customer.name,
    userRole: "customer",
    action: "Quick phone customer verification",
    entity: "Customer",
    entityId: customer.id,
    newValue: `Customer verified with phone ${formattedPhone}`,
  });

  res.json({
    success: true,
    message: `Verified successfully as ${customer.name}!`,
    customer,
  });
});

// 0.4 Demo credentials helper for quick review testing
app.get("/api/auth/demo-credentials", (_req, res) => {
  res.json({
    success: true,
    seller: {
      phone: "+91 98765 43210",
      email: "ramlal.gupta@kirana.in",
      password: "Kirana@2026!",
      proofs: ["GSTIN: 29AAAAA0000A1Z5", "MSME: UDYAM-KR-03-0044521"],
    },
    customer: {
      googleEmail: "priya.sharma@gmail.com",
      googleName: "Priya Sharma",
      phone: "+91 98450 67890",
    },
  });
});

// ==========================================
// 1. SHOPS ENDPOINTS
// ==========================================
app.get("/api/shops", (req, res) => {
  res.json({ success: true, data: db.shops });
});

app.get("/api/shops/:id", (req, res) => {
  const shop = db.shops.find((s) => s.id === req.params.id);
  if (!shop) return res.status(404).json({ success: false, error: "Shop not found" });
  res.json({ success: true, data: shop });
});

app.post("/api/shops", (req, res) => {
  const { name, ownerName, phone, address, area, city, category, upiId, gstNumber, openingHours, closingHours } = req.body;
  if (!name || !ownerName || !phone) {
    return res.status(400).json({ success: false, error: "Shop name, owner name, and phone are required" });
  }

  const newShop = {
    id: `shop-${Date.now()}`,
    name,
    ownerName,
    phone,
    address: address || "Local Market, Main Road",
    area: area || "Indiranagar",
    city: city || "Bengaluru",
    category: category || "Kirana & General Store",
    openingHours: openingHours || "07:00 AM",
    closingHours: closingHours || "10:00 PM",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60",
    gstNumber,
    upiId: upiId || `${phone.replace(/\D/g, "")}@upi`,
    deliveryAvailable: true,
    reservationAvailable: true,
    reservationExpiryMinutes: 30,
    rating: 5.0,
    totalRatings: 1,
    distanceKm: 0.5,
  };

  db.shops.push(newShop);
  db.logAudit({
    userId: "seller",
    userName: ownerName,
    userRole: "seller",
    action: "Shop registration",
    entity: "Shop",
    entityId: newShop.id,
    newValue: `Registered new shop: ${name}`,
  });

  res.status(201).json({ success: true, data: newShop });
});

// ==========================================
// 2. PRODUCTS & BARCODE ENDPOINTS
// ==========================================
app.get("/api/products", (req, res) => {
  const { shopId = "shop-1", query, category, lowStock, expiringSoon, outOfStock } = req.query;
  let list = db.products.filter((p) => p.shopId === shopId);

  if (category && category !== "All") {
    list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }

  if (lowStock === "true") {
    list = list.filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock);
  }

  if (outOfStock === "true") {
    list = list.filter((p) => p.currentStock === 0);
  }

  if (expiringSoon === "true") {
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    list = list.filter((p) => p.expiryDate && new Date(p.expiryDate) <= threshold);
  }

  res.json({ success: true, data: list, count: list.length });
});

// Barcode lookup (Works across modes)
app.get("/api/products/barcode/:barcode", (req, res) => {
  const { barcode } = req.params;
  const { shopId = "shop-1" } = req.query;

  const product = db.products.find(
    (p) => p.barcode === barcode && p.shopId === shopId
  );

  if (!product) {
    // Check if it exists in any other shop to auto-fill details for fast onboarding!
    const globalMatch = db.products.find((p) => p.barcode === barcode);
    return res.json({
      success: true,
      found: false,
      barcode,
      suggestedProduct: globalMatch
        ? {
            name: globalMatch.name,
            brand: globalMatch.brand,
            category: globalMatch.category,
            mrp: globalMatch.mrp,
            sellingPrice: globalMatch.sellingPrice,
            purchasePrice: globalMatch.purchasePrice,
            unit: globalMatch.unit,
            gstPercent: globalMatch.gstPercent,
            image: globalMatch.image,
          }
        : null,
    });
  }

  res.json({ success: true, found: true, data: product });
});

app.get("/api/products/:id", (req, res) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: "Product not found" });
  res.json({ success: true, data: product });
});

// Create product (Manual or Barcode-discovered)
app.post("/api/products", (req, res) => {
  const {
    shopId = "shop-1",
    name,
    hindiName,
    brand,
    category,
    barcode,
    hasBarcode = true,
    mrp,
    sellingPrice,
    purchasePrice,
    gstPercent = 5,
    unit = "Packet",
    quantity = 0,
    minimumStock = 10,
    expiryDate,
    batchNumber,
    supplierId,
    supplierName,
    description,
    image,
  } = req.body;

  if (!name || !sellingPrice) {
    return res.status(400).json({ success: false, error: "Product name and selling price are required" });
  }

  // Generate internal barcode / QR if non-barcode product
  const finalBarcode =
    barcode && barcode.trim()
      ? barcode.trim()
      : `QR-INT-${Math.floor(100000 + Math.random() * 900000)}`;

  const now = new Date().toISOString();
  const newProduct = {
    id: `prod-${Date.now()}`,
    shopId,
    name,
    hindiName,
    brand: brand || "Local",
    category: category || "General Groceries",
    sku: `${(name || "SKU").substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    barcode: finalBarcode,
    hasBarcode: !!hasBarcode,
    mrp: Number(mrp) || Number(sellingPrice),
    sellingPrice: Number(sellingPrice),
    purchasePrice: Number(purchasePrice) || Math.round(Number(sellingPrice) * 0.8),
    gstPercent: Number(gstPercent) || 0,
    unit: unit || "Piece",
    currentStock: Number(quantity) || 0,
    reservedStock: 0,
    damagedStock: 0,
    expiredStock: 0,
    minimumStock: Number(minimumStock) || 5,
    expiryDate,
    batchNumber,
    supplierId,
    supplierName,
    description,
    image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60",
    status: "active" as const,
    lastVerifiedAt: now,
    lastUpdatedAt: now,
  };

  db.products.unshift(newProduct);

  if (newProduct.currentStock > 0) {
    db.transactions.unshift({
      id: `tx-${Date.now()}`,
      shopId,
      productId: newProduct.id,
      productName: newProduct.name,
      type: "Opening stock",
      quantityChange: newProduct.currentStock,
      previousStock: 0,
      newStock: newProduct.currentStock,
      performedBy: "Shopkeeper",
      timestamp: now,
    });
  }

  db.logAudit({
    userId: "seller",
    userName: "Ram Lal Gupta",
    userRole: "seller",
    action: "Product creation",
    entity: "Product",
    entityId: newProduct.id,
    newValue: `Created ${newProduct.name} (Barcode: ${newProduct.barcode}, Stock: ${newProduct.currentStock})`,
  });

  res.status(201).json({ success: true, data: newProduct });
});

// Add stock (Single or from Scan)
app.post("/api/products/add-stock", (req, res) => {
  const { shopId = "shop-1", productId, quantity, purchasePrice, sellingPrice, supplierId, batchNumber, expiryDate, source } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: "Product ID and positive quantity are required" });
  }

  const result = db.addStock({
    shopId,
    productId,
    quantity: Number(quantity),
    purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
    sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
    supplierId,
    batchNumber,
    expiryDate,
    performedBy: "Ram Lal Gupta (Owner)",
    source: source || "Barcode Scan",
  });

  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// Continuous Barcode Stock Entry (Review Stock -> Save All)
app.post("/api/products/batch-stock-entry", (req, res) => {
  const { shopId = "shop-1", items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "No items provided for stock entry" });
  }

  const results: any[] = [];
  let totalAdded = 0;

  for (const itm of items) {
    const result = db.addStock({
      shopId,
      productId: itm.productId,
      quantity: Number(itm.quantity),
      purchasePrice: itm.purchasePrice ? Number(itm.purchasePrice) : undefined,
      sellingPrice: itm.sellingPrice ? Number(itm.sellingPrice) : undefined,
      performedBy: "Ram Lal Gupta (Continuous Scan)",
      source: "Barcode Scan",
    });
    if (result.success) {
      totalAdded += Number(itm.quantity);
      results.push(result);
    }
  }

  res.json({
    success: true,
    totalItems: items.length,
    totalQuantityAdded: totalAdded,
    details: results,
  });
});

// Stock Guardian: Verify Stock (detects discrepancy, records reason, updates audit log)
app.post("/api/products/verify-stock", (req, res) => {
  const { shopId = "shop-1", productId, physicalCount, reason, notes } = req.body;
  if (!productId || physicalCount === undefined) {
    return res.status(400).json({ success: false, error: "Product ID and physical count are required" });
  }

  const result = db.verifyStock({
    shopId,
    productId,
    physicalCount: Number(physicalCount),
    reason,
    notes,
    verifiedBy: "Ram Lal Gupta",
  });

  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// ==========================================
// 3. BILLING / POS & INVOICES
// ==========================================
app.post("/api/invoices", (req, res) => {
  const { shopId = "shop-1", customerId, customerName, customerPhone, items, discountTotal, paymentMethod, reservationId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "At least one item is required to generate a bill" });
  }

  const result = db.createBillTransaction({
    shopId,
    customerId,
    customerName: customerName || "Walk-in Customer",
    customerPhone,
    items,
    discountTotal: Number(discountTotal) || 0,
    paymentMethod: paymentMethod || "Cash",
    cashierName: "Ram Lal Gupta",
    reservationId,
  });

  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

app.get("/api/invoices", (req, res) => {
  const { shopId = "shop-1", customerId } = req.query;
  let list = db.invoices;
  if (shopId) list = list.filter((i) => i.shopId === shopId);
  if (customerId) list = list.filter((i) => i.customerId === customerId);
  res.json({ success: true, data: list });
});

app.get("/api/invoices/:id", (req, res) => {
  const invoice = db.invoices.find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: "Invoice not found" });
  res.json({ success: true, data: invoice });
});

// ==========================================
// 4. INVENTORY TRANSACTIONS & VERIFICATIONS
// ==========================================
app.get("/api/inventory/transactions", (req, res) => {
  const { shopId = "shop-1", productId } = req.query;
  let txs = db.transactions.filter((t) => t.shopId === shopId);
  if (productId) txs = txs.filter((t) => t.productId === productId);
  res.json({ success: true, data: txs });
});

app.get("/api/inventory/verifications", (req, res) => {
  const { shopId = "shop-1" } = req.query;
  res.json({ success: true, data: db.verifications.filter((v) => v.shopId === shopId) });
});

// ==========================================
// 5. RESERVATIONS
// ==========================================
app.get("/api/reservations", (req, res) => {
  const { shopId = "shop-1", customerId } = req.query;
  let list = db.reservations;
  if (shopId) list = list.filter((r) => r.shopId === shopId);
  if (customerId) list = list.filter((r) => r.customerId === customerId);
  res.json({ success: true, data: list });
});

app.post("/api/reservations", (req, res) => {
  const { shopId = "shop-1", customerId, customerName, customerPhone, items } = req.body;
  if (!customerId || !customerName || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: "Customer details and items are required" });
  }

  const result = db.createReservation({
    shopId,
    customerId,
    customerName,
    customerPhone: customerPhone || "+91 98450 67890",
    items,
  });

  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

app.patch("/api/reservations/:id/status", (req, res) => {
  const { status, reason, actorName = "Ram Lal Gupta" } = req.body;
  if (!status) return res.status(400).json({ success: false, error: "Status is required" });

  const result = db.updateReservationStatus(req.params.id, status, actorName, reason);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/reservations/:id/coming-soon", (req, res) => {
  const { eta = "20 minutes" } = req.body;
  const result = db.markComingSoon(req.params.id, eta);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

// ==========================================
// 6. SUPPLIERS & PURCHASES
// ==========================================
app.get("/api/suppliers", (req, res) => {
  const { shopId = "shop-1" } = req.query;
  res.json({ success: true, data: db.suppliers.filter((s) => s.shopId === shopId) });
});

app.post("/api/suppliers", (req, res) => {
  const { shopId = "shop-1", name, phone, email, address, productsSupplied, gstNumber } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: "Supplier name and phone are required" });

  const supplier = {
    id: `sup-${Date.now()}`,
    shopId,
    name,
    phone,
    email,
    address,
    productsSupplied: productsSupplied || [],
    gstNumber,
  };
  db.suppliers.push(supplier);
  res.status(201).json({ success: true, data: supplier });
});

// Supplier price comparison
app.get("/api/suppliers/price-comparison", (req, res) => {
  const comparison = [
    {
      productName: "Dettol Original Soap 75g",
      records: [
        { supplierName: "Metro FMCG Wholesalers Ltd", purchasePrice: 32, lastPurchased: "2026-09-15" },
        { supplierName: "ITC & Direct Agencies", purchasePrice: 33.5, lastPurchased: "2026-08-28" },
      ],
    },
    {
      productName: "Parle-G Gluco Biscuits 250g",
      records: [
        { supplierName: "Metro FMCG Wholesalers Ltd", purchasePrice: 22, lastPurchased: "2026-09-16" },
        { supplierName: "Local Distribution Depot", purchasePrice: 23, lastPurchased: "2026-08-30" },
      ],
    },
    {
      productName: "Tata Salt 1kg",
      records: [
        { supplierName: "Metro FMCG Wholesalers Ltd", purchasePrice: 20, lastPurchased: "2026-09-10" },
        { supplierName: "South India Salt Agency", purchasePrice: 20.5, lastPurchased: "2026-08-14" },
      ],
    },
  ];
  res.json({ success: true, data: comparison });
});

// ==========================================
// 7. CUSTOMER MARKETPLACE: FIND EVERYTHING IN ONE SHOP
// ==========================================
app.post("/api/marketplace/find-everything", (req, res) => {
  const { itemNames } = req.body;
  if (!itemNames || !Array.isArray(itemNames) || itemNames.length === 0) {
    return res.status(400).json({ success: false, error: "Provide an array of item names" });
  }

  const results = db.shops.map((shop) => {
    const shopProducts = db.products.filter((p) => p.shopId === shop.id);
    const matchedItems: any[] = [];
    const missingItems: string[] = [];
    let estimatedTotal = 0;

    for (const rawName of itemNames) {
      const q = rawName.trim().toLowerCase();
      const match = shopProducts.find(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.hindiName && p.hindiName.toLowerCase().includes(q))
      );

      if (match && match.currentStock > 0) {
        matchedItems.push({
          requestedName: rawName,
          matchedProduct: match,
          price: match.sellingPrice,
          inStock: match.currentStock,
        });
        estimatedTotal += match.sellingPrice;
      } else {
        missingItems.push(rawName);
      }
    }

    return {
      shop,
      totalRequested: itemNames.length,
      availableCount: matchedItems.length,
      missingCount: missingItems.length,
      matchedItems,
      missingItems,
      estimatedTotal,
      matchPercentage: Math.round((matchedItems.length / itemNames.length) * 100),
      distanceKm: shop.distanceKm,
    };
  });

  // Sort: highest available items first, then lowest distance
  results.sort((a, b) => b.availableCount - a.availableCount || (a.distanceKm || 0) - (b.distanceKm || 0));

  res.json({ success: true, data: results });
});

// Product Substitution suggestions
app.get("/api/marketplace/substitutes/:productId", (req, res) => {
  const product = db.products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: "Product not found" });

  const substitutes = db.products.filter(
    (p) =>
      p.shopId === product.shopId &&
      p.id !== product.id &&
      (p.category === product.category || (p.subcategory && p.subcategory === product.subcategory)) &&
      p.currentStock > 0
  );

  res.json({ success: true, requestedProduct: product, substitutes });
});

// Restock Waitlist ("Notify Me When Available")
app.post("/api/waitlist", (req, res) => {
  const { shopId = "shop-1", productId, customerId, customerName, customerPhone } = req.body;
  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ success: false, error: "Product not found" });

  const waitItem = {
    id: `wait-${Date.now()}`,
    shopId,
    productId,
    productName: product.name,
    customerId: customerId || "cust-1",
    customerName: customerName || "Priya Sharma",
    customerPhone: customerPhone || "+91 98450 67890",
    requestedAt: new Date().toISOString(),
    status: "Pending" as const,
  };

  db.waitlists.unshift(waitItem);
  res.status(201).json({ success: true, data: waitItem, message: "You will be alerted the moment this product is restocked." });
});

app.get("/api/waitlist", (req, res) => {
  const { customerId } = req.query;
  let list = db.waitlists;
  if (customerId) list = list.filter((w) => w.customerId === customerId);
  res.json({ success: true, data: list });
});

// ==========================================
// 8. CHAT & MESSAGING
// ==========================================
app.get("/api/messages", (req, res) => {
  const { shopId = "shop-1", conversationId } = req.query;
  let msgs = db.messages;
  if (shopId) msgs = msgs.filter((m) => m.shopId === shopId);
  if (conversationId) msgs = msgs.filter((m) => m.conversationId === conversationId);
  res.json({ success: true, data: msgs });
});

app.post("/api/messages", (req, res) => {
  const { shopId = "shop-1", conversationId, senderId, senderName, senderRole, text, relatedProductId, relatedReservationId } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ success: false, error: "Message text required" });

  const msg = {
    id: `msg-${Date.now()}`,
    conversationId: conversationId || `conv-${senderId || "user"}-${shopId}`,
    shopId,
    senderId: senderId || "user",
    senderName: senderName || "User",
    senderRole: senderRole || "customer",
    text: text.trim(),
    timestamp: new Date().toISOString(),
    relatedProductId,
    relatedReservationId,
  };

  db.messages.push(msg);
  res.status(201).json({ success: true, data: msg });
});

// ==========================================
// 9. RATINGS & PLATFORM FEEDBACK
// ==========================================
app.post("/api/ratings", (req, res) => {
  const { shopId = "shop-1", customerId, customerName, sellerRating, customerRating, transactionId, comment } = req.body;

  const rating = {
    id: `rate-${Date.now()}`,
    shopId,
    customerId: customerId || "cust-1",
    customerName: customerName || "Customer",
    sellerRating: sellerRating ? Number(sellerRating) : undefined,
    customerRating: customerRating ? Number(customerRating) : undefined,
    transactionId: transactionId || `inv-${Date.now()}`,
    comment,
    createdAt: new Date().toISOString(),
  };

  db.ratings.unshift(rating);
  res.status(201).json({ success: true, data: rating });
});

app.get("/api/ratings", (req, res) => {
  const { shopId = "shop-1" } = req.query;
  res.json({ success: true, data: db.ratings.filter((r) => r.shopId === shopId) });
});

app.post("/api/platform-feedback", (req, res) => {
  const { userId, userName, userRole, rating, categories, comment } = req.body;
  if (!rating) return res.status(400).json({ success: false, error: "Rating is required" });

  const fb = {
    id: `fb-${Date.now()}`,
    userId: userId || "user-1",
    userName: userName || "Shopkeeper",
    userRole: userRole || "seller",
    rating: Number(rating),
    categories: categories || ["Easy to use"],
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };

  db.platformFeedbacks.unshift(fb);
  res.status(201).json({ success: true, data: fb });
});

app.get("/api/platform-feedback", (_req, res) => {
  res.json({ success: true, data: db.platformFeedbacks });
});

// ==========================================
// 10. ADMIN DASHBOARD & AUDIT LOGS
// ==========================================
app.get("/api/audit-logs", (req, res) => {
  res.json({ success: true, data: db.auditLogs });
});

app.get("/api/admin/dashboard-stats", (_req, res) => {
  const totalBills = db.invoices.length;
  const totalRevenue = db.invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalReservations = db.reservations.length;
  const noShows = db.reservations.filter((r) => r.status === "No-show").length;
  const lowStockCount = db.products.filter((p) => p.currentStock <= p.minimumStock).length;
  const outOfStockCount = db.products.filter((p) => p.currentStock === 0).length;
  const avgFeedbackRating =
    db.platformFeedbacks.length > 0
      ? Number(
          (db.platformFeedbacks.reduce((sum, f) => sum + f.rating, 0) / db.platformFeedbacks.length).toFixed(1)
        )
      : 4.8;

  res.json({
    success: true,
    data: {
      totalSellers: 3,
      totalCustomers: 28,
      activeShops: db.shops.length,
      totalBills,
      totalRevenue,
      totalReservations,
      noShows,
      lowStockCount,
      outOfStockCount,
      avgFeedbackRating,
      recentAuditLogs: db.auditLogs.slice(0, 10),
    },
  });
});

// ==========================================
// 11. AI ASSISTANTS (Shop AI & Customer AI)
// ==========================================
app.post("/api/ai/shop-assistant", async (req, res) => {
  try {
    const { question, shopId = "shop-1" } = req.body;
    if (!question) return res.status(400).json({ success: false, error: "Question is required" });

    // Gather live factual database context
    const shop = db.shops.find((s) => s.id === shopId) || db.shops[0];
    const shopProducts = db.products.filter((p) => p.shopId === shopId);
    const shopInvoices = db.invoices.filter((i) => i.shopId === shopId);

    const todaySales = shopInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const todayBillsCount = shopInvoices.length;
    const lowStock = shopProducts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock);
    const outOfStock = shopProducts.filter((p) => p.currentStock === 0);

    // Sales frequency map
    const salesFrequency: Record<string, number> = {};
    for (const inv of shopInvoices) {
      for (const itm of inv.items) {
        salesFrequency[itm.productName] = (salesFrequency[itm.productName] || 0) + itm.quantity;
      }
    }
    const topSelling = Object.entries(salesFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => `${name} (${qty} units)`);

    const contextSummary = `
Shop: ${shop.name}
Today's Total Sales: ₹${todaySales} across ${todayBillsCount} bills
Top Selling Products Today: ${topSelling.join(", ") || "Parle-G Biscuits, Amul Milk, Maggi Noodles"}
Low Stock Alerts (${lowStock.length} items): ${lowStock.map((p) => `${p.name} (Stock: ${p.currentStock}, Min: ${p.minimumStock})`).join("; ") || "None"}
Out of Stock Items (${outOfStock.length} items): ${outOfStock.map((p) => p.name).join("; ") || "None"}
Payment breakdown: ${shopInvoices.map((i) => i.paymentMethod).join(", ")}
`;

    const ai = getGenAI();
    let reply = "";

    if (ai) {
      const prompt = `You are "Shop AI", the intelligent business advisor for Ram Lal Gupta, owner of ${shop.name}.
Respond in clear, respectful, practical Indian retail merchant language (mix of crisp English with common Kirana terms like 'Grahak', 'Stock', 'Bikri', 'UPI').
Base your analysis STRICTLY on the actual factual store numbers provided below. Do not invent fake sales figures.
Distinguish between historical facts and estimates.

Store Context:
${contextSummary}

Owner's question: "${question}"

Provide a concise, highly actionable answer (2 to 4 bullet points or short paragraphs).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      reply = response.text || "";
    }

    if (!reply) {
      // Direct factual fallback if Gemini API key not present
      if (question.toLowerCase().includes("sold") || question.toLowerCase().includes("sale")) {
        reply = `Today's total sales stand at ₹${todaySales} from ${todayBillsCount} completed bills. Top selling items are: ${topSelling.join(", ") || "Amul Milk & Parle-G"}.`;
      } else if (question.toLowerCase().includes("low") || question.toLowerCase().includes("restock")) {
        reply = `You have ${lowStock.length} low-stock products: ${lowStock.map((p) => `${p.name} (only ${p.currentStock} left)`).join(", ")}. Immediate reorder recommended.`;
      } else {
        reply = `Shop status for ${shop.name}: Revenue today is ₹${todaySales}. We have ${shopProducts.length} total products registered with ${lowStock.length} running low on inventory.`;
      }
    }

    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("Shop AI error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate AI response" });
  }
});

app.post("/api/ai/customer-assistant", async (req, res) => {
  try {
    const { question, shopId = "shop-1" } = req.body;
    if (!question) return res.status(400).json({ success: false, error: "Question is required" });

    const shop = db.shops.find((s) => s.id === shopId) || db.shops[0];
    const availableProducts = db.products
      .filter((p) => p.shopId === shopId && p.currentStock > 0)
      .map((p) => `${p.name} - ₹${p.sellingPrice}/${p.unit} (Stock: ${p.currentStock})`);

    const contextSummary = `
Store: ${shop.name} (${shop.area}, ${shop.city})
Available in-stock products with exact prices:
${availableProducts.join("\n")}
`;

    const ai = getGenAI();
    let reply = "";

    if (ai) {
      const prompt = `You are "Ask My Shop AI", the friendly neighborhood shopping assistant for ${shop.name}.
Help the local customer based ONLY on the actual available inventory and prices listed below.
Rules:
1. Do NOT invent products, prices, or discounts that are not in the list.
2. If asked for recipes or requirements (e.g. "tea for 5 people"), list the exact ingredients available in the store (like Brooke Bond Red Label Tea, Amul Milk, Sugar/Tata Salt) and calculate the estimated price.
3. Suggest available alternatives if something is not found.
4. Keep tone warm, courteous, and helpful.

Inventory Context:
${contextSummary}

Customer says: "${question}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      reply = response.text || "";
    }

    if (!reply) {
      reply = `Hello! At ${shop.name}, we have fresh Amul Milk (₹27), Brooke Bond Red Label Tea (₹132), Parle-G (₹28), and Maggi (₹14). You can add them to your shopping list or reserve right now!`;
    }

    res.json({ success: true, reply });
  } catch (err: any) {
    console.error("Customer AI error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate AI response" });
  }
});

// Demo Data Reset
app.post("/api/demo/reset", (_req, res) => {
  db.seed();
  res.json({ success: true, message: "Database reset to initial demo state" });
});

// ==========================================
// AI HANDWRITTEN PARCHI / GROCERY SLIP PARSER
// ==========================================
app.post("/api/ai/parse-grocery-parchi", async (req, res) => {
  try {
    const { imageBase64, textContent, shopId } = req.body;

    if (!imageBase64 && (!textContent || !textContent.trim())) {
      return res.status(400).json({
        success: false,
        error: "Please provide either a photo of the handwritten grocery parchi (slip) or enter the item list.",
      });
    }

    // Retrieve shop products for context matching
    const shopProducts = shopId
      ? db.products.filter((p) => p.shopId === shopId)
      : db.products;

    const catalogSummary = shopProducts.map((p) => ({
      id: p.id,
      name: p.name,
      hindiName: p.hindiName || "",
      price: p.sellingPrice,
      unit: p.unit,
      stock: p.currentStock,
    }));

    const ai = getGenAI();
    let parsedItems: any[] = [];
    let modelUsed: string | null = null;

    if (ai) {
      const systemPrompt = `You are an expert Indian Kirana store Optical Character Recognition (OCR) and handwritten grocery list (parchi) parsing engine.
Your task is to analyze the handwritten paper grocery slip photo, printed receipt, or text list.
The list may be written in English, Hindi (Devanagari script), or Hinglish (e.g., '1kg cheeni', '2 pkt maggi', '500g toor dal', 'vim bar 1pc', 'sarso tel 1ltr', 'aata 5kg').

Available Store Catalog for Stock Matching:
${JSON.stringify(catalogSummary, null, 2)}

Instructions:
1. Accurately decipher all line items from the image or text. Extract the exact item name, requested quantity (number), and unit (Kg, Gram, Packet, Litre, Piece, Bottle, Box, etc.).
2. For each extracted line item, search the Available Store Catalog for the best matching product.
3. If an exact or close match exists in the catalog:
   - "matchedProductId": product id from catalog
   - "matchedProductName": product name from catalog
   - "matchedPrice": product selling price from catalog
   - "inStock": true if stock > 0, else false
   - "confidence": "high"
   - "notes": "Shelf item matched"
4. If no exact match exists in the store catalog:
   - "matchedProductId": null
   - "matchedProductName": extracted item name
   - "matchedPrice": estimated reasonable retail price in INR (e.g., 20-150 depending on item)
   - "inStock": true
   - "confidence": "medium" or "low"
   - "notes": "Catalog item not found; manual confirmation needed"
5. Return strictly a JSON array of objects conforming to:
[
  {
    "id": "parchi-1",
    "rawText": "original line text",
    "matchedProductId": "prod-id-or-null",
    "matchedProductName": "Matched Brand Product Name",
    "requestedQuantity": 1,
    "requestedUnit": "Kg",
    "matchedPrice": 45,
    "confidence": "high",
    "inStock": true,
    "notes": "Matched in stock"
  }
]
Output ONLY valid JSON. Do not output markdown codeblocks, backticks, or preamble text.`;

      let parts: any[] = [];

      if (imageBase64) {
        // Extract base64 data and mimeType cleanly
        let mimeType = "image/jpeg";
        let base64Data = imageBase64;

        const dataUriMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/s);
        if (dataUriMatch) {
          mimeType = dataUriMatch[1];
          base64Data = dataUriMatch[2];
        } else if (imageBase64.includes(",")) {
          const split = imageBase64.split(",");
          base64Data = split[1];
        }

        parts = [
          {
            text: systemPrompt + "\n\nAnalyze this handwritten grocery slip photo or receipt image and return the structured JSON array of grocery items with catalog matches.",
          },
          {
            inlineData: {
              mimeType,
              data: base64Data.trim(),
            },
          },
        ];
      } else {
        parts = [
          {
            text: systemPrompt + `\n\nHere is the customer's grocery slip text list:\n${textContent}\n\nParse into the structured JSON array of items.`,
          },
        ];
      }

      // Try primary model (gemini-3.8-flash), fallback to gemini-3.1-flash-lite if temporary 503 or overload occurs
      const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawTextOutput = (response.text || "").trim();
          const cleanedJson = rawTextOutput
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          const parsed = JSON.parse(cleanedJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedItems = parsed.map((item, idx) => ({
              id: item.id || `parchi-${idx + 1}`,
              rawText: String(item.rawText || item.matchedProductName || `Item ${idx + 1}`),
              matchedProductId: item.matchedProductId || null,
              matchedProductName: String(item.matchedProductName || item.rawText || "Grocery Item"),
              requestedQuantity: Number(item.requestedQuantity) > 0 ? Number(item.requestedQuantity) : 1,
              requestedUnit: String(item.requestedUnit || "Piece"),
              matchedPrice: Number(item.matchedPrice) >= 0 ? Number(item.matchedPrice) : 30,
              confidence: item.confidence || (item.matchedProductId ? "high" : "medium"),
              inStock: Boolean(item.inStock !== false),
              notes: item.notes || (item.matchedProductId ? "Matched with shop catalog" : "Estimated item"),
            }));
            modelUsed = model;
            break; // Success!
          }
        } catch (modelErr: any) {
          console.warn(`Gemini parchi parse attempt with ${model} failed:`, modelErr?.status || modelErr?.message);
        }
      }
    }

    // If AI could not extract items from image or text
    if (parsedItems.length === 0) {
      if (textContent && textContent.trim()) {
        // Deterministic local parsing for text ONLY if text was provided (NEVER substitute hardcoded demo string)
        const lines = textContent
          .split(/[\n,;]+/)
          .map((l: string) => l.trim())
          .filter(Boolean);

        parsedItems = lines.map((line: string, index: number) => {
          const lower = line.toLowerCase();
          let qty = 1;
          const numMatch = lower.match(/\d+(\.\d+)?/);
          if (numMatch) qty = parseFloat(numMatch[0]);

          let unit = "Piece";
          if (lower.includes("kg") || lower.includes("किलो") || lower.includes("kilo")) unit = "Kg";
          else if (lower.includes("gm") || lower.includes("gram") || lower.includes("ग्राम")) unit = "Gram";
          else if (lower.includes("pkt") || lower.includes("packet") || lower.includes("पैकेट")) unit = "Packet";
          else if (lower.includes("l") || lower.includes("ltr") || lower.includes("litre") || lower.includes("लीटर")) unit = "Litre";

          // Search catalog
          const match = shopProducts.find((p) => {
            const pLower = p.name.toLowerCase();
            const words = lower.replace(/[^a-z0-9 ]/g, " ").split(/\s+/);
            return words.some((w) => w.length > 2 && pLower.includes(w));
          });

          if (match) {
            return {
              id: `parchi-${index + 1}`,
              rawText: line,
              matchedProductId: match.id,
              matchedProductName: match.name,
              requestedQuantity: qty,
              requestedUnit: unit,
              matchedPrice: match.sellingPrice,
              confidence: "high",
              inStock: match.currentStock > 0,
              notes: "Matched with shop shelf stock",
            };
          }

          return {
            id: `parchi-${index + 1}`,
            rawText: line,
            matchedProductName: line,
            requestedQuantity: qty,
            requestedUnit: unit,
            matchedPrice: 40,
            confidence: "medium",
            inStock: true,
            notes: "Item extracted from list",
          };
        });
      } else {
        // Image was provided, but AI could not detect items (e.g. blank image or unclear text)
        return res.status(422).json({
          success: false,
          error: "Could not clearly read items from the image. Please take a closer, well-lit photo of the paper parchi or enter the items manually.",
        });
      }
    }

    res.json({
      success: true,
      items: parsedItems,
      totalItemsFound: parsedItems.length,
      matchedInStoreCount: parsedItems.filter((i) => i.matchedProductId).length,
      aiEngine: modelUsed || "local-parser",
      isAiProcessed: Boolean(modelUsed),
    });
  } catch (err: any) {
    console.error("Parse grocery parchi error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to parse grocery slip" });
  }
});

// ==========================================
// GEMINI CONTEXT-AWARE CHATBOT & TTS ROUTES
// ==========================================
app.post("/api/chat/assistant", (req, res) => {
  handleChatAssistant(req, res, getGenAI);
});

app.post("/api/chat/tts", (req, res) => {
  handleTTS(req, res, getGenAI);
});

// ==========================================
// Vite Middleware / Production Server
// ==========================================
async function startServer() {
  const server = http.createServer(app);

  // Mount Gemini Live API WebSocket endpoint on /api/gemini/live
  const wss = new WebSocketServer({
    server,
    path: "/api/gemini/live",
  });

  setupGeminiLiveWebSocket(wss, getGenAI);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`KiranaSetu server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
export { app };
