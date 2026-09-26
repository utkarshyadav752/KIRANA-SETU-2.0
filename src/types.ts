export type UserRole = "seller" | "customer" | "admin";
export type AppView = "frontpage" | "seller" | "customer";

export type UnitType =
  | "Piece"
  | "Packet"
  | "Box"
  | "Bottle"
  | "Kg"
  | "Gram"
  | "Litre"
  | "Ml"
  | "Dozen"
  | "Custom";

export type PaymentMethod =
  | "Dedicated Business UPI QR"
  | "Cash"
  | "Card POS Terminal"
  | "Store Credit (Khata)"
  | "UPI"
  | "Card"
  | "Other";

export type BusinessProofType =
  | "GSTIN"
  | "MSME"
  | "UDYOG_AADHAAR"
  | "FSSAI"
  | "SHOP_ESTABLISHMENT"
  | "TRADE_LICENSE";

export interface BusinessProof {
  type: BusinessProofType;
  label: string;
  documentNumber: string;
  documentName?: string;
  issuedDate?: string;
  verified: boolean;
}

export type SubscriptionPlan = "free" | "monthly" | "yearly";

export type MsmeVerificationStatus = "unsubmitted" | "pending_review" | "verified" | "rejected";

export interface MsmeVerificationData {
  status: MsmeVerificationStatus;
  udyamNumber: string; // e.g. UDYAM-DL-05-0012345
  enterpriseName: string;
  enterpriseType: "Micro" | "Small" | "Medium";
  businessCategory: "Retail Store" | "Wholesale Trader" | "Refurbished Electronics (B2B SuperSale)" | "Kirana & FMCG" | "General Merchant";
  panNumber: string;
  state: string;
  district: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  reviewerNotes?: string;
  certificateUrl?: string;
  b2bBadgeUnlocked: boolean;
}

export interface SellerSubscription {
  plan: SubscriptionPlan;
  isPremium: boolean;
  price: number; // 0, 20, 200
  startDate: string;
  endDate: string;
  features: string[];
  paymentMethod?: string;
  transactionId?: string;
}

export interface SellerUser {
  id: string;
  shopId: string;
  ownerName: string;
  shopName: string;
  phone: string;
  email: string;
  businessProofs: BusinessProof[];
  dedicatedUpiId: string;
  address?: string;
  area?: string;
  city?: string;
  subscription?: SellerSubscription;
  msmeVerification?: MsmeVerificationData;
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  googleId?: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

export type ReservationStatus =
  | "Requested"
  | "Confirmed"
  | "Ready"
  | "Collected"
  | "Cancelled"
  | "Expired"
  | "No-show"
  | "pending"
  | "confirmed"
  | "ready"
  | "collected"
  | "cancelled"
  | "expired";

export type InventoryConfidence = "Recently verified" | "May have changed" | "Needs confirmation";

export type TransactionType =
  | "Opening stock"
  | "Purchase"
  | "Sale"
  | "Customer return"
  | "Supplier return"
  | "Reservation"
  | "Reservation cancellation"
  | "Damaged stock"
  | "Expired stock"
  | "Manual adjustment"
  | "Stock correction";

export type AdjustmentReason =
  | "Unrecorded sale"
  | "Damaged product"
  | "Expired product"
  | "Wrong quantity entered"
  | "Wrong product scanned"
  | "Counting error"
  | "Customer return"
  | "Supplier return"
  | "Other";

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  category: string;
  openingHours: string;
  closingHours: string;
  image: string;
  gstNumber?: string;
  businessProofs?: BusinessProof[];
  upiId: string;
  dedicatedUpiId?: string;
  deliveryAvailable: boolean;
  reservationAvailable: boolean;
  reservationExpiryMinutes: number; // default 30
  rating: number;
  totalRatings: number;
  distanceKm?: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  hindiName?: string;
  brand: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode: string; // EAN-13, UPC, Code 128, or internal QR
  hasBarcode: boolean;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  gstPercent: number; // 0, 5, 12, 18, 28
  unit: UnitType;
  currentStock: number; // Physical available
  reservedStock: number;
  damagedStock: number;
  expiredStock: number;
  minimumStock: number;
  maximumStock?: number;
  expiryDate?: string;
  batchNumber?: string;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  image: string;
  status: "active" | "inactive" | "discontinued";
  lastVerifiedAt: string;
  lastSoldAt?: string;
  lastUpdatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceId?: string; // invoiceId, reservationId, purchaseId
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface StockVerification {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  expectedStock: number;
  physicalCount: number;
  discrepancy: number;
  reason?: AdjustmentReason;
  notes?: string;
  verifiedBy: string;
  timestamp: string;
  verifiedAt?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  barcode?: string;
  unit: UnitType;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  gstPercent: number;
  discount: number; // per item discount
  total: number;
  isManualEntry?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  shopId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "Completed" | "Pending" | "Failed";
  createdAt: string;
  cashierName: string;
  notes?: string;
}

export interface ReservationItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellingPrice?: number;
  unit: UnitType;
}

export interface Reservation {
  id: string;
  reservationCode: string;
  reservationNumber?: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: ReservationItem[];
  totalAmount: number;
  estimatedTotal?: number;
  status: ReservationStatus;
  requestedAt: string;
  createdAt?: string;
  confirmedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  expiresAt: string;
  isComingSoon?: boolean; // "I'm coming in 20 minutes" triggered
  comingSoonAlert?: boolean;
  comingETA?: string;
  comingSoonEta?: string;
  cancellationReason?: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  productsSupplied: string[]; // product names
  gstNumber?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  shopId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: "Draft" | "Ordered" | "Received" | "Cancelled";
  orderDate: string;
  receivedDate?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  matchedProductId?: string;
  estimatedPrice?: number;
  availableShopsCount?: number;
  isBought?: boolean;
}

export interface RestockWaitlist {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  requestedAt: string;
  notifiedAt?: string;
  status: "Pending" | "Notified";
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  shopId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  relatedProductId?: string;
  relatedReservationId?: string;
}

export interface Rating {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  sellerRating?: number; // Customer rates seller 1-5
  customerRating?: number; // Seller rates customer 1-5
  transactionId: string;
  comment?: string;
  createdAt: string;
}

export interface PlatformFeedback {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  rating: number; // 1-5
  categories: string[]; // Easy to use, Fast, Barcode scanner, Billing, Inventory, AI, Reservations, Customer marketplace, Other
  comment: string;
  createdAt: string;
  timestamp?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  details?: string;
  performedBy?: string;
}

// -------------------------------------------------------------
// NEW ADVANCED FEATURES (Soundbox, Parchi, Weight, Loyalty, Morning)
// -------------------------------------------------------------

export interface SoundboxSettings {
  enabled: boolean;
  language: "hi" | "en";
  volume: number;
  autoAnnounceOnPOS: boolean;
  autoAnnounceOnPickup: boolean;
  chimeStyle: "paytm" | "phonepe" | "simple";
}

export interface LooseCommodity {
  id: string;
  name: string;
  hindiName: string;
  category: string;
  pricePerKg: number;
  defaultGrams: number;
  quickPresets?: number[]; // [100, 250, 500, 1000]
}

export interface ParchiParsedItem {
  id: string;
  rawText: string;
  matchedProductId?: string;
  matchedProductName?: string;
  matchedBrand?: string;
  requestedQuantity: number;
  requestedUnit: UnitType;
  matchedPrice: number;
  confidence: "high" | "medium" | "low" | "unmatched";
  inStock: boolean;
  notes?: string;
}

export interface MorningSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shopId: string;
  shopName: string;
  stapleType: "milk" | "bread" | "eggs" | "curd" | "paneer" | "newspaper" | "custom";
  itemName: string;
  brand: string;
  quantity: number;
  unit: UnitType;
  dailyPrice: number;
  frequency: "daily" | "weekdays" | "weekends";
  pickupSlot: "6:00 AM - 7:00 AM" | "7:00 AM - 8:00 AM" | "8:00 AM - 9:00 AM";
  status: "active" | "paused";
  deliveryType: "counter_pickup" | "doorstep_runner";
  startDate: string;
  nextScheduledDate: string;
}

export interface LoyaltyProfile {
  customerId: string;
  shopId: string;
  stampsCount: number; // 0 to 5
  targetStamps: number; // usually 5
  rewardAmount: number; // ₹50 off
  lifetimePoints: number;
  couponsAvailable: {
    code: string;
    amount: number;
    description: string;
    expiresAt: string;
    isUsed: boolean;
  }[];
  recentActivity: {
    id: string;
    date: string;
    event: string;
    stampsEarned: number;
  }[];
}

export interface UdharCustomerRecord {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalCreditPending: number;
  lastPurchaseDate: string;
  lastReminderSentAt?: string;
  reminderCount: number;
  trustScore: "A+" | "A" | "B" | "Overdue";
}

