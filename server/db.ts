import {
  Shop,
  Product,
  InventoryTransaction,
  StockVerification,
  Invoice,
  Reservation,
  ReservationItem,
  Supplier,
  PurchaseOrder,
  RestockWaitlist,
  ChatMessage,
  Rating,
  PlatformFeedback,
  AuditLog,
  SellerUser,
  CustomerUser,
  BusinessProof,
  MsmeVerificationData,
} from "../src/types.js";

class InMemoryDatabase {
  shops: Shop[] = [];
  products: Product[] = [];
  transactions: InventoryTransaction[] = [];
  verifications: StockVerification[] = [];
  invoices: Invoice[] = [];
  reservations: Reservation[] = [];
  suppliers: Supplier[] = [];
  purchases: PurchaseOrder[] = [];
  waitlists: RestockWaitlist[] = [];
  messages: ChatMessage[] = [];
  ratings: Rating[] = [];
  platformFeedbacks: PlatformFeedback[] = [];
  auditLogs: AuditLog[] = [];
  sellers: (SellerUser & { passwordHash: string })[] = [];
  customers: CustomerUser[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const currentISO = now.toISOString();

    // 1. Shops
    this.shops = [
      {
        id: "shop-1",
        name: "Shri Krishna Kirana & General Store",
        ownerName: "Ram Lal Gupta",
        phone: "+91 98765 43210",
        address: "Shop #14, 12th Main Road, HAL 2nd Stage, Indiranagar",
        area: "Indiranagar",
        city: "Bengaluru",
        category: "Kirana & FMCG",
        openingHours: "07:00 AM",
        closingHours: "10:30 PM",
        image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60",
        gstNumber: "29AAAAA0000A1Z5",
        businessProofs: [
          {
            type: "GSTIN",
            label: "GST Identification Number",
            documentNumber: "29AAAAA0000A1Z5",
            documentName: "GSTIN_Certificate_Indiranagar.pdf",
            verified: true,
          },
          {
            type: "MSME",
            label: "MSME Udyam Registration",
            documentNumber: "UDYAM-KR-03-0044521",
            documentName: "Udyam_Registration_Certificate.pdf",
            verified: true,
          },
        ],
        upiId: "shrikrishna.kirana@okhdfcbank",
        deliveryAvailable: true,
        reservationAvailable: true,
        reservationExpiryMinutes: 30,
        rating: 4.8,
        totalRatings: 142,
        distanceKm: 0.4,
      },
      {
        id: "shop-2",
        name: "Radhe Shyam Daily Supermarket",
        ownerName: "Radhe Shyam Sharma",
        phone: "+91 98450 11223",
        address: "74, CMH Road, Near Metro Station, Indiranagar",
        area: "Indiranagar",
        city: "Bengaluru",
        category: "Supermarket & Provisions",
        openingHours: "08:00 AM",
        closingHours: "10:00 PM",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
        gstNumber: "29BBBBB1111B2Z6",
        upiId: "radheshyam.daily@icici",
        deliveryAvailable: true,
        reservationAvailable: true,
        reservationExpiryMinutes: 45,
        rating: 4.5,
        totalRatings: 98,
        distanceKm: 1.1,
      },
      {
        id: "shop-3",
        name: "Gupta Dairy & Daily Needs",
        ownerName: "Suresh Gupta",
        phone: "+91 98860 33445",
        address: "22, Old Airport Road, Domlur",
        area: "Domlur",
        city: "Bengaluru",
        category: "Dairy & Quick Essentials",
        openingHours: "06:30 AM",
        closingHours: "11:00 PM",
        image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&auto=format&fit=crop&q=60",
        gstNumber: "29CCCCC2222C3Z7",
        upiId: "guptadairy@ybl",
        deliveryAvailable: false,
        reservationAvailable: true,
        reservationExpiryMinutes: 30,
        rating: 4.6,
        totalRatings: 67,
        distanceKm: 2.2,
      },
    ];

    // Seed Registered Sellers & Customers
    this.sellers = [
      {
        id: "seller-1",
        shopId: "shop-1",
        ownerName: "Ram Lal Gupta",
        shopName: "Shri Krishna Kirana & General Store",
        phone: "+91 98765 43210",
        email: "ramlal.gupta@kirana.in",
        passwordHash: "Kirana@2026!",
        businessProofs: [
          {
            type: "GSTIN",
            label: "GST Identification Number",
            documentNumber: "29AAAAA0000A1Z5",
            documentName: "GSTIN_Certificate_Indiranagar.pdf",
            issuedDate: "2021-04-10",
            verified: true,
          },
          {
            type: "MSME",
            label: "MSME Udyam Registration",
            documentNumber: "UDYAM-KR-03-0044521",
            documentName: "Udyam_Registration_Certificate.pdf",
            issuedDate: "2022-08-15",
            verified: true,
          },
        ],
        dedicatedUpiId: "shrikrishna.kirana@okhdfcbank",
        address: "Shop #14, 12th Main Road, HAL 2nd Stage, Indiranagar",
        area: "Indiranagar",
        city: "Bengaluru",
        createdAt: currentISO,
      },
    ];

    this.customers = [
      {
        id: "cust-1",
        name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        phone: "+91 98450 67890",
        googleId: "google-1092837482910",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        isPhoneVerified: true,
        createdAt: currentISO,
      },
    ];

    // 2. Suppliers
    this.suppliers = [
      {
        id: "sup-1",
        shopId: "shop-1",
        name: "Metro FMCG Wholesalers Ltd",
        phone: "+91 98450 55667",
        email: "bangalore.sales@metrofmcg.com",
        address: "Yeshwanthpur Wholesale Hub, Bengaluru",
        productsSupplied: ["Parle-G", "Maggi", "Surf Excel", "Tata Salt", "Dettol"],
        gstNumber: "29METRO0000M1Z8",
      },
      {
        id: "sup-2",
        shopId: "shop-1",
        name: "Karnataka Dairy Co-operative (Amul/Nandini)",
        phone: "+91 98451 77889",
        email: "distribution@karnatakadairy.org",
        address: "Dairy Circle, Bengaluru",
        productsSupplied: ["Milk", "Curd", "Butter", "Paneer"],
        gstNumber: "29KDCMP1234D1Z2",
      },
      {
        id: "sup-3",
        shopId: "shop-1",
        name: "APMC Fresh Vegetable Mandi Commission Agent",
        phone: "+91 98452 99001",
        address: "APMC Yard Stall 42, Bengaluru",
        productsSupplied: ["Tomatoes", "Onions", "Potatoes", "Coriander"],
      },
      {
        id: "sup-4",
        shopId: "shop-1",
        name: "ITC & Britannia Direct Agency",
        phone: "+91 98453 11223",
        address: "Peenya Industrial Area, Bengaluru",
        productsSupplied: ["Aashirvaad Atta", "Good Day", "Sunfeast"],
      },
    ];

    // 3. Products
    this.products = [
      {
        id: "prod-1",
        shopId: "shop-1",
        name: "Parle-G Gluco Biscuits 250g",
        hindiName: "पारले-जी बिस्कुट २५० ग्राम",
        brand: "Parle",
        category: "Biscuits & Snacks",
        subcategory: "Biscuits",
        sku: "PAR-GLU-250",
        barcode: "8901719101012",
        hasBarcode: true,
        mrp: 30,
        sellingPrice: 28,
        purchasePrice: 22,
        gstPercent: 5,
        unit: "Packet",
        currentStock: 48,
        reservedStock: 2,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 15,
        maximumStock: 100,
        expiryDate: "2027-02-15",
        batchNumber: "B-2026-PG",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "India's favorite glucose biscuit with milk and wheat.",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: currentISO,
      },
      {
        id: "prod-2",
        shopId: "shop-1",
        name: "Amul Taaza Homogenised Toned Milk 500ml",
        hindiName: "अमूल ताज़ा दूध ५०० मिली",
        brand: "Amul",
        category: "Dairy & Breakfast",
        subcategory: "Milk",
        sku: "AMU-TAA-500",
        barcode: "8901262010051",
        hasBarcode: true,
        mrp: 27,
        sellingPrice: 27,
        purchasePrice: 24,
        gstPercent: 0,
        unit: "Packet",
        currentStock: 18,
        reservedStock: 2,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 10,
        maximumStock: 60,
        expiryDate: "2026-09-24",
        batchNumber: "AM-SEP-01",
        supplierId: "sup-2",
        supplierName: "Karnataka Dairy Co-operative (Amul/Nandini)",
        description: "Pasteurized, homogenized toned fresh milk.",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: currentISO,
      },
      {
        id: "prod-3",
        shopId: "shop-1",
        name: "Tata Salt Vacuum Evaporated Iodised 1kg",
        hindiName: "टाटा नमक १ किलो",
        brand: "Tata",
        category: "Staples & Spices",
        subcategory: "Salt & Sugar",
        sku: "TAT-SLT-1KG",
        barcode: "8904004400032",
        hasBarcode: true,
        mrp: 28,
        sellingPrice: 26,
        purchasePrice: 20,
        gstPercent: 5,
        unit: "Packet",
        currentStock: 25,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 10,
        expiryDate: "2027-08-01",
        batchNumber: "TS-2688",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Desh ka Namak with required iodine purity.",
        image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: twoDaysAgo,
        lastSoldAt: oneDayAgo,
        lastUpdatedAt: twoDaysAgo,
      },
      {
        id: "prod-4",
        shopId: "shop-1",
        name: "Maggi 2-Minute Masala Instant Noodles 70g",
        hindiName: "मैगी २-मिनट मसाला नूडल्स",
        brand: "Nestle",
        category: "Instant Food & Snacks",
        subcategory: "Noodles",
        sku: "MAG-MAS-70G",
        barcode: "8901058852441",
        hasBarcode: true,
        mrp: 14,
        sellingPrice: 14,
        purchasePrice: 11.5,
        gstPercent: 12,
        unit: "Packet",
        currentStock: 55,
        reservedStock: 3,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 20,
        expiryDate: "2027-01-10",
        batchNumber: "MG-2026-X",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Iconic taste of blend of 10 spices and herbs.",
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: oneDayAgo,
      },
      {
        id: "prod-5",
        shopId: "shop-1",
        name: "Aashirvaad Shudh Chakki Whole Wheat Atta 5kg",
        hindiName: "आशीर्वाद शुद्ध चक्की आटा ५ किलो",
        brand: "Aashirvaad",
        category: "Staples & Spices",
        subcategory: "Atta & Flour",
        sku: "AAS-ATT-5KG",
        barcode: "8901725181220",
        hasBarcode: true,
        mrp: 260,
        sellingPrice: 245,
        purchasePrice: 215,
        gstPercent: 0,
        unit: "Packet",
        currentStock: 14,
        reservedStock: 1,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 8,
        expiryDate: "2026-11-20",
        batchNumber: "AA-9901",
        supplierId: "sup-4",
        supplierName: "ITC & Britannia Direct Agency",
        description: "100% pure whole wheat grain flour.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: threeDaysAgo,
        lastSoldAt: oneDayAgo,
        lastUpdatedAt: threeDaysAgo,
      },
      {
        id: "prod-6",
        shopId: "shop-1",
        name: "Fortune Sunlite Refined Sunflower Oil 1L Pouch",
        hindiName: "फॉर्च्यून सनलाइट रिफाइंड तेल १ लीटर",
        brand: "Fortune",
        category: "Oils & Ghee",
        subcategory: "Edible Oil",
        sku: "FOR-SUN-1L",
        barcode: "8906007281014",
        hasBarcode: true,
        mrp: 165,
        sellingPrice: 155,
        purchasePrice: 135,
        gstPercent: 5,
        unit: "Packet",
        currentStock: 12,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 6,
        expiryDate: "2027-03-30",
        batchNumber: "FS-7711",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Enriched with Vitamin A and Vitamin D.",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: twoDaysAgo,
        lastSoldAt: twoDaysAgo,
        lastUpdatedAt: twoDaysAgo,
      },
      {
        id: "prod-7",
        shopId: "shop-1",
        name: "Dettol Original Bathing Soap 75g",
        hindiName: "डेटॉल ओरिजिनल साबुन ७५ ग्राम",
        brand: "Dettol",
        category: "Personal Care",
        subcategory: "Soaps",
        sku: "DET-SOP-75G",
        barcode: "8901396312014",
        hasBarcode: true,
        mrp: 42,
        sellingPrice: 40,
        purchasePrice: 32,
        gstPercent: 18,
        unit: "Piece",
        currentStock: 35,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 12,
        expiryDate: "2027-09-01",
        batchNumber: "DT-4422",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Antiseptic germ protection bar soap.",
        image: "https://images.unsplash.com/photo-1607006314352-78d363d3c8c7?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: oneDayAgo,
      },
      {
        id: "prod-8",
        shopId: "shop-1",
        name: "Colgate Strong Teeth Dental Cream 100g",
        hindiName: "कोलगेट स्ट्रॉन्ग टीथ १०० ग्राम",
        brand: "Colgate",
        category: "Personal Care",
        subcategory: "Oral Care",
        sku: "COL-STR-100G",
        barcode: "8901314010523",
        hasBarcode: true,
        mrp: 65,
        sellingPrice: 60,
        purchasePrice: 48,
        gstPercent: 12,
        unit: "Piece",
        currentStock: 22,
        reservedStock: 1,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 8,
        expiryDate: "2027-05-15",
        batchNumber: "CL-8833",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Calcium boost formula for 2x stronger teeth.",
        image: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: twoDaysAgo,
        lastSoldAt: oneDayAgo,
        lastUpdatedAt: twoDaysAgo,
      },
      {
        id: "prod-9",
        shopId: "shop-1",
        name: "Brooke Bond Red Label Tea 250g",
        hindiName: "रेड लेबल चाय २५० ग्राम",
        brand: "Brooke Bond",
        category: "Beverages",
        subcategory: "Tea",
        sku: "RED-TEA-250G",
        barcode: "8901491101834",
        hasBarcode: true,
        mrp: 140,
        sellingPrice: 132,
        purchasePrice: 110,
        gstPercent: 5,
        unit: "Packet",
        currentStock: 19,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 8,
        expiryDate: "2027-04-10",
        batchNumber: "RL-1029",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Tasty blend of CTC tea leaves.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: twoDaysAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: twoDaysAgo,
      },
      {
        id: "prod-10",
        shopId: "shop-1",
        name: "Britannia Good Day Butter Cookies 120g",
        hindiName: "गुड डे बटर कुकीज १२० ग्राम",
        brand: "Britannia",
        category: "Biscuits & Snacks",
        subcategory: "Cookies",
        sku: "BRT-GUD-120",
        barcode: "8901063012113",
        hasBarcode: true,
        mrp: 35,
        sellingPrice: 32,
        purchasePrice: 25,
        gstPercent: 12,
        unit: "Packet",
        currentStock: 28,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 10,
        expiryDate: "2027-03-01",
        batchNumber: "BG-9912",
        supplierId: "sup-4",
        supplierName: "ITC & Britannia Direct Agency",
        description: "Rich butter cookies with signature curved ridges.",
        image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: threeDaysAgo,
        lastSoldAt: twoDaysAgo,
        lastUpdatedAt: threeDaysAgo,
      },

      // NON-BARCODE LOOSE PRODUCTS (Mandatory as per section 8: Products without barcode)
      {
        id: "prod-loose-1",
        shopId: "shop-1",
        name: "Fresh Hybrid Tomatoes (Loose)",
        hindiName: "ताज़ा टमाटर (खुला)",
        brand: "Farm Fresh",
        category: "Fresh Vegetables",
        subcategory: "Vegetables",
        sku: "VEG-TOM-KG",
        barcode: "QR-LOC-TOMATO",
        hasBarcode: false, // Non-barcode manual product
        mrp: 40,
        sellingPrice: 35,
        purchasePrice: 22,
        gstPercent: 0,
        unit: "Kg",
        currentStock: 32, // 32 Kg in stock
        reservedStock: 0,
        damagedStock: 1,
        expiredStock: 0,
        minimumStock: 10,
        expiryDate: "2026-09-22",
        supplierId: "sup-3",
        supplierName: "APMC Fresh Vegetable Mandi Commission Agent",
        description: "Firm, ripe red tomatoes directly from Kolar/APMC.",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: currentISO,
        lastSoldAt: currentISO,
        lastUpdatedAt: currentISO,
      },
      {
        id: "prod-loose-2",
        shopId: "shop-1",
        name: "Nashik Red Onions (Loose)",
        hindiName: "ताज़ा प्याज़ (खुला)",
        brand: "Farm Fresh",
        category: "Fresh Vegetables",
        subcategory: "Vegetables",
        sku: "VEG-ONI-KG",
        barcode: "QR-LOC-ONION",
        hasBarcode: false,
        mrp: 48,
        sellingPrice: 42,
        purchasePrice: 30,
        gstPercent: 0,
        unit: "Kg",
        currentStock: 50,
        reservedStock: 2,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 15,
        expiryDate: "2026-10-15",
        supplierId: "sup-3",
        supplierName: "APMC Fresh Vegetable Mandi Commission Agent",
        description: "Dry, medium-large onions with pungent aroma.",
        image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: oneDayAgo,
      },
      {
        id: "prod-loose-3",
        shopId: "shop-1",
        name: "Mountain Potatoes / Aloo (Loose)",
        hindiName: "पहाड़ी आलू (खुला)",
        brand: "Farm Fresh",
        category: "Fresh Vegetables",
        subcategory: "Vegetables",
        sku: "VEG-POT-KG",
        barcode: "QR-LOC-POTATO",
        hasBarcode: false,
        mrp: 32,
        sellingPrice: 28,
        purchasePrice: 19,
        gstPercent: 0,
        unit: "Kg",
        currentStock: 45,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 15,
        expiryDate: "2026-10-30",
        supplierId: "sup-3",
        supplierName: "APMC Fresh Vegetable Mandi Commission Agent",
        description: "Clean, soil-free cooking potatoes.",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: oneDayAgo,
      },
      {
        id: "prod-loose-4",
        shopId: "shop-1",
        name: "Fresh Country Farm Eggs (12 pcs)",
        hindiName: "देसी ताज़ा अंडे (१ दर्जन)",
        brand: "Local Farm",
        category: "Dairy & Breakfast",
        subcategory: "Eggs",
        sku: "EGG-DOZ-12",
        barcode: "QR-LOC-EGGS",
        hasBarcode: false,
        mrp: 96,
        sellingPrice: 84,
        purchasePrice: 65,
        gstPercent: 0,
        unit: "Dozen",
        currentStock: 15,
        reservedStock: 1,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 5,
        expiryDate: "2026-09-28",
        supplierId: "sup-3",
        supplierName: "APMC Fresh Vegetable Mandi Commission Agent",
        description: "Fresh protein-rich white table eggs.",
        image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: oneDayAgo,
      },
      {
        id: "prod-loose-5",
        shopId: "shop-1",
        name: "Premium Royal Basmati Rice (Loose)",
        hindiName: "शाही बासमती चावल (खुला)",
        brand: "Royal",
        category: "Staples & Spices",
        subcategory: "Rice & Grains",
        sku: "RIC-BAS-KG",
        barcode: "QR-LOC-RICE",
        hasBarcode: false,
        mrp: 110,
        sellingPrice: 95,
        purchasePrice: 78,
        gstPercent: 0,
        unit: "Kg",
        currentStock: 75,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 25,
        expiryDate: "2027-12-01",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Long grain aromatic aged Biryani rice.",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: twoDaysAgo,
        lastSoldAt: currentISO,
        lastUpdatedAt: twoDaysAgo,
      },

      // A product that is OUT OF STOCK (to demonstrate restock waitlist & substitution)
      {
        id: "prod-out-1",
        shopId: "shop-1",
        name: "Kissan Fresh Tomato Ketchup 500g",
        hindiName: "किसान टोमैटो केचप ५०० ग्राम",
        brand: "Kissan",
        category: "Sauces & Spreads",
        subcategory: "Ketchup",
        sku: "KIS-KET-500",
        barcode: "8901030383826",
        hasBarcode: true,
        mrp: 130,
        sellingPrice: 120,
        purchasePrice: 98,
        gstPercent: 12,
        unit: "Bottle",
        currentStock: 0, // OUT OF STOCK
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 6,
        expiryDate: "2027-02-15",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "100% real ripe tomatoes.",
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: currentISO,
        lastSoldAt: twoDaysAgo,
        lastUpdatedAt: currentISO,
      },
      // Substitute for Kissan Ketchup:
      {
        id: "prod-sub-1",
        shopId: "shop-1",
        name: "Maggi Rich Tomato Sauce Pitcher 500g",
        hindiName: "मैगी रिच टोमैटो सॉस ५०० ग्राम",
        brand: "Nestle",
        category: "Sauces & Spreads",
        subcategory: "Ketchup",
        sku: "MAG-KET-500",
        barcode: "8901058863119",
        hasBarcode: true,
        mrp: 125,
        sellingPrice: 115,
        purchasePrice: 94,
        gstPercent: 12,
        unit: "Bottle",
        currentStock: 8,
        reservedStock: 0,
        damagedStock: 0,
        expiredStock: 0,
        minimumStock: 4,
        expiryDate: "2027-04-10",
        supplierId: "sup-1",
        supplierName: "Metro FMCG Wholesalers Ltd",
        description: "Perfect sweet & tangy tomato sauce alternative.",
        image: "https://images.unsplash.com/photo-1589135233689-d56d491f24d3?w=400&auto=format&fit=crop&q=60",
        status: "active",
        lastVerifiedAt: oneDayAgo,
        lastSoldAt: oneDayAgo,
        lastUpdatedAt: oneDayAgo,
      },
    ];

    // Mirror some products in Shop 2 and Shop 3 so multi-shop search & "Find Everything in One Shop" works realistically
    const shop2Prods: Product[] = [
      {
        ...this.products[0],
        id: "prod-s2-1",
        shopId: "shop-2",
        sellingPrice: 29,
        currentStock: 25,
        lastVerifiedAt: oneDayAgo,
      },
      {
        ...this.products[1],
        id: "prod-s2-2",
        shopId: "shop-2",
        sellingPrice: 27,
        currentStock: 40,
        lastVerifiedAt: currentISO,
      },
      {
        ...this.products[3],
        id: "prod-s2-4",
        shopId: "shop-2",
        sellingPrice: 14,
        currentStock: 30,
        lastVerifiedAt: currentISO,
      },
      {
        ...this.products[7],
        id: "prod-s2-8",
        shopId: "shop-2",
        sellingPrice: 62,
        currentStock: 15,
        lastVerifiedAt: twoDaysAgo,
      },
      {
        ...this.products[13], // Eggs
        id: "prod-s2-eggs",
        shopId: "shop-2",
        sellingPrice: 90,
        currentStock: 20,
        lastVerifiedAt: currentISO,
      },
    ];

    const shop3Prods: Product[] = [
      {
        ...this.products[1], // Milk
        id: "prod-s3-milk",
        shopId: "shop-3",
        sellingPrice: 27,
        currentStock: 50,
        lastVerifiedAt: currentISO,
      },
      {
        ...this.products[13], // Eggs
        id: "prod-s3-eggs",
        shopId: "shop-3",
        sellingPrice: 85,
        currentStock: 35,
        lastVerifiedAt: currentISO,
      },
      {
        ...this.products[3], // Maggi
        id: "prod-s3-maggi",
        shopId: "shop-3",
        sellingPrice: 14,
        currentStock: 12,
        lastVerifiedAt: threeDaysAgo,
      },
    ];

    this.products.push(...shop2Prods, ...shop3Prods);

    // 4. Initial Inventory Transactions Ledger
    this.transactions = [
      {
        id: "tx-init-1",
        shopId: "shop-1",
        productId: "prod-1",
        productName: "Parle-G Gluco Biscuits 250g",
        type: "Opening stock",
        quantityChange: 40,
        previousStock: 0,
        newStock: 40,
        performedBy: "Ram Lal (Owner)",
        timestamp: threeDaysAgo,
      },
      {
        id: "tx-init-2",
        shopId: "shop-1",
        productId: "prod-1",
        productName: "Parle-G Gluco Biscuits 250g",
        type: "Purchase",
        quantityChange: 10,
        previousStock: 40,
        newStock: 50,
        referenceId: "PO-2026-001",
        performedBy: "Ram Lal (Owner)",
        timestamp: twoDaysAgo,
      },
      {
        id: "tx-init-3",
        shopId: "shop-1",
        productId: "prod-1",
        productName: "Parle-G Gluco Biscuits 250g",
        type: "Sale",
        quantityChange: -2,
        previousStock: 50,
        newStock: 48,
        referenceId: "INV-2026-081",
        performedBy: "POS Terminal",
        timestamp: oneDayAgo,
      },
      {
        id: "tx-init-4",
        shopId: "shop-1",
        productId: "prod-2",
        productName: "Amul Taaza Homogenised Toned Milk 500ml",
        type: "Opening stock",
        quantityChange: 30,
        previousStock: 0,
        newStock: 30,
        performedBy: "Ram Lal (Owner)",
        timestamp: twoDaysAgo,
      },
      {
        id: "tx-init-5",
        shopId: "shop-1",
        productId: "prod-2",
        productName: "Amul Taaza Homogenised Toned Milk 500ml",
        type: "Sale",
        quantityChange: -12,
        previousStock: 30,
        newStock: 18,
        referenceId: "INV-2026-082",
        performedBy: "POS Terminal",
        timestamp: currentISO,
      },
      {
        id: "tx-init-6",
        shopId: "shop-1",
        productId: "prod-loose-1",
        productName: "Fresh Hybrid Tomatoes (Loose)",
        type: "Purchase",
        quantityChange: 40,
        previousStock: 0,
        newStock: 40,
        performedBy: "Ram Lal (Owner)",
        timestamp: oneDayAgo,
      },
      {
        id: "tx-init-7",
        shopId: "shop-1",
        productId: "prod-loose-1",
        productName: "Fresh Hybrid Tomatoes (Loose)",
        type: "Sale",
        quantityChange: -8,
        previousStock: 40,
        newStock: 32,
        referenceId: "INV-2026-082",
        performedBy: "POS Terminal",
        timestamp: currentISO,
      },
    ];

    // 5. Seed Invoices
    this.invoices = [
      {
        id: "inv-1",
        invoiceNumber: "INV-2026-081",
        shopId: "shop-1",
        customerId: "cust-1",
        customerName: "Priya Sharma",
        customerPhone: "+91 98450 67890",
        items: [
          {
            productId: "prod-1",
            productName: "Parle-G Gluco Biscuits 250g",
            barcode: "8901719101012",
            unit: "Packet",
            quantity: 2,
            mrp: 30,
            sellingPrice: 28,
            gstPercent: 5,
            discount: 0,
            total: 56,
          },
          {
            productId: "prod-4",
            productName: "Maggi 2-Minute Masala Instant Noodles 70g",
            barcode: "8901058852441",
            unit: "Packet",
            quantity: 4,
            mrp: 14,
            sellingPrice: 14,
            gstPercent: 12,
            discount: 0,
            total: 56,
          },
        ],
        subtotal: 112,
        discountTotal: 0,
        gstTotal: 7.8,
        cgst: 3.9,
        sgst: 3.9,
        totalAmount: 112,
        paymentMethod: "UPI",
        paymentStatus: "Completed",
        createdAt: oneDayAgo,
        cashierName: "Ram Lal Gupta",
        notes: "UPI payment received via PhonePe",
      },
      {
        id: "inv-2",
        invoiceNumber: "INV-2026-082",
        shopId: "shop-1",
        customerId: "cust-2",
        customerName: "Anand Verma",
        customerPhone: "+91 97312 44556",
        items: [
          {
            productId: "prod-2",
            productName: "Amul Taaza Homogenised Toned Milk 500ml",
            barcode: "8901262010051",
            unit: "Packet",
            quantity: 2,
            mrp: 27,
            sellingPrice: 27,
            gstPercent: 0,
            discount: 0,
            total: 54,
          },
          {
            productId: "prod-loose-1",
            productName: "Fresh Hybrid Tomatoes (Loose)",
            unit: "Kg",
            quantity: 2,
            mrp: 40,
            sellingPrice: 35,
            gstPercent: 0,
            discount: 0,
            total: 70,
            isManualEntry: true,
          },
          {
            productId: "prod-7",
            productName: "Dettol Original Bathing Soap 75g",
            barcode: "8901396312014",
            unit: "Piece",
            quantity: 1,
            mrp: 42,
            sellingPrice: 40,
            gstPercent: 18,
            discount: 0,
            total: 40,
          },
        ],
        subtotal: 164,
        discountTotal: 4,
        gstTotal: 6.1,
        cgst: 3.05,
        sgst: 3.05,
        totalAmount: 160,
        paymentMethod: "Cash",
        paymentStatus: "Completed",
        createdAt: currentISO,
        cashierName: "Ram Lal Gupta",
      },
    ];

    // 6. Seed Reservations
    this.reservations = [
      {
        id: "res-1",
        reservationCode: "RES-4091",
        shopId: "shop-1",
        shopName: "Shri Krishna Kirana & General Store",
        customerId: "cust-1",
        customerName: "Priya Sharma",
        customerPhone: "+91 98450 67890",
        items: [
          {
            productId: "prod-2",
            productName: "Amul Taaza Homogenised Toned Milk 500ml",
            quantity: 2,
            price: 27,
            unit: "Packet",
          },
          {
            productId: "prod-4",
            productName: "Maggi 2-Minute Masala Instant Noodles 70g",
            quantity: 3,
            price: 14,
            unit: "Packet",
          },
        ],
        totalAmount: 96,
        status: "Confirmed",
        requestedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        confirmedAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 20 * 60 * 1000).toISOString(), // 20 mins remaining
        isComingSoon: true,
        comingETA: "15 minutes",
      },
    ];

    // 7. Seed Stock Verifications (Stock Guardian)
    this.verifications = [
      {
        id: "ver-1",
        shopId: "shop-1",
        productId: "prod-1",
        productName: "Parle-G Gluco Biscuits 250g",
        expectedStock: 50,
        physicalCount: 48,
        discrepancy: -2,
        reason: "Unrecorded sale",
        notes: "Two packets sold during evening rush without scanning.",
        verifiedBy: "Ram Lal Gupta",
        timestamp: oneDayAgo,
      },
    ];

    // 8. Seed Audit Logs
    this.auditLogs = [
      {
        id: "audit-1",
        userId: "user-seller-1",
        userName: "Ram Lal Gupta",
        userRole: "seller",
        timestamp: threeDaysAgo,
        action: "Login",
        entity: "Session",
        entityId: "sess-001",
        newValue: "Successful authentication via OTP",
      },
      {
        id: "audit-2",
        userId: "user-seller-1",
        userName: "Ram Lal Gupta",
        userRole: "seller",
        timestamp: twoDaysAgo,
        action: "Stock addition",
        entity: "Product",
        entityId: "prod-1",
        previousValue: "40 units",
        newValue: "50 units (Received 10 units PO-2026-001)",
      },
      {
        id: "audit-3",
        userId: "user-seller-1",
        userName: "Ram Lal Gupta",
        userRole: "seller",
        timestamp: oneDayAgo,
        action: "Stock correction",
        entity: "Stock Guardian",
        entityId: "prod-1",
        previousValue: "50 units",
        newValue: "48 units (Reason: Unrecorded sale)",
      },
      {
        id: "audit-4",
        userId: "user-seller-1",
        userName: "Ram Lal Gupta",
        userRole: "seller",
        timestamp: currentISO,
        action: "Bill creation",
        entity: "Invoice",
        entityId: "inv-2",
        newValue: "₹160 (3 items, Cash)",
      },
    ];

    // 9. Seed Chat Messages
    this.messages = [
      {
        id: "msg-1",
        conversationId: "conv-cust1-shop1",
        shopId: "shop-1",
        senderId: "cust-1",
        senderName: "Priya Sharma",
        senderRole: "customer",
        text: "Namaste Ram Lal ji, do you have fresh cow milk packets available right now?",
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        relatedProductId: "prod-2",
      },
      {
        id: "msg-2",
        conversationId: "conv-cust1-shop1",
        shopId: "shop-1",
        senderId: "shop-1",
        senderName: "Ram Lal Gupta (Owner)",
        senderRole: "seller",
        text: "Namaste Priya ji! Yes, we received the fresh Amul delivery 1 hour ago. 18 packets available. You can reserve directly in the app.",
        timestamp: new Date(now.getTime() - 22 * 60 * 1000).toISOString(),
        relatedProductId: "prod-2",
      },
      {
        id: "msg-3",
        conversationId: "conv-cust1-shop1",
        shopId: "shop-1",
        senderId: "cust-1",
        senderName: "Priya Sharma",
        senderRole: "customer",
        text: "Thank you! I have placed reservation RES-4091 and I am on my way now.",
        timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
        relatedReservationId: "res-1",
      },
    ];

    // 10. Seed Ratings
    this.ratings = [
      {
        id: "rate-1",
        shopId: "shop-1",
        customerId: "cust-1",
        customerName: "Priya Sharma",
        sellerRating: 5,
        customerRating: 5,
        transactionId: "inv-1",
        comment: "Excellent quick service and always fresh items! Scanned bill instantly.",
        createdAt: oneDayAgo,
      },
      {
        id: "rate-2",
        shopId: "shop-1",
        customerId: "cust-2",
        customerName: "Anand Verma",
        sellerRating: 5,
        customerRating: 5,
        transactionId: "inv-2",
        comment: "Very honest shopkeeper. UPI payment worked seamlessly.",
        createdAt: currentISO,
      },
    ];

    // 11. Seed Platform Feedback
    this.platformFeedbacks = [
      {
        id: "fb-1",
        userId: "user-seller-1",
        userName: "Ram Lal Gupta",
        userRole: "seller",
        rating: 5,
        categories: ["Barcode scanner", "Billing", "Fast"],
        comment: "Continuous barcode scanning makes our 9 PM billing queue 3 times faster! Customers love receiving the digital bill.",
        createdAt: oneDayAgo,
      },
      {
        id: "fb-2",
        userId: "cust-1",
        userName: "Priya Sharma",
        userRole: "customer",
        rating: 5,
        categories: ["Customer marketplace", "Reservations"],
        comment: "Being able to see whether milk and eggs are actually in stock before walking to the store is a lifesaver.",
        createdAt: currentISO,
      },
    ];

    // 12. Seed Waitlist (Customer waiting for Kissan Ketchup)
    this.waitlists = [
      {
        id: "wait-1",
        shopId: "shop-1",
        productId: "prod-out-1",
        productName: "Kissan Fresh Tomato Ketchup 500g",
        customerId: "cust-1",
        customerName: "Priya Sharma",
        customerPhone: "+91 98450 67890",
        requestedAt: twoDaysAgo,
        status: "Pending",
      },
    ];

    // 13. Seed Registered Sellers (Existing Merchant Accounts)
    this.sellers = [
      {
        id: "seller-1",
        shopId: "shop-1",
        ownerName: "Ram Lal Gupta",
        shopName: "Shri Krishna Kirana & General Store",
        phone: "+91 98765 43210",
        email: "ramlal.gupta@shrikrishnakirana.in",
        passwordHash: "Kirana@2026!",
        businessProofs: this.shops[0]?.businessProofs || [
          {
            type: "GSTIN",
            label: "GST Identification Number",
            documentNumber: "29AAAAA0000A1Z5",
            documentName: "GSTIN_Certificate_Indiranagar.pdf",
            verified: true,
          },
          {
            type: "MSME",
            label: "MSME Udyam Registration",
            documentNumber: "UDYAM-KR-03-0044521",
            documentName: "Udyam_Registration_Certificate.pdf",
            verified: true,
          },
        ],
        dedicatedUpiId: "shrikrishna.kirana@okhdfcbank",
        address: "Shop #14, 12th Main Road, HAL 2nd Stage, Indiranagar",
        area: "Indiranagar",
        city: "Bengaluru",
        subscription: {
          plan: "free",
          isPremium: false,
          price: 0,
          startDate: threeDaysAgo,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["basic_pos", "standard_inventory", "counter_pickup"],
        },
        msmeVerification: {
          status: "verified",
          udyamNumber: "UDYAM-KR-03-0044521",
          enterpriseName: "Shri Krishna Kirana & General Store",
          enterpriseType: "Micro",
          businessCategory: "Kirana & FMCG",
          panNumber: "AAAAA0000A",
          state: "Karnataka",
          district: "Bengaluru Urban",
          submittedAt: threeDaysAgo,
          reviewedAt: twoDaysAgo,
          reviewedBy: "KiranaSetu Verification Team (Officer Vikram #104)",
          reviewerNotes: "Verified against Govt MSME Udyam portal. Micro Retail enterprise active.",
          b2bBadgeUnlocked: true,
        },
        createdAt: threeDaysAgo,
      },
      {
        id: "seller-2",
        shopId: "shop-2",
        ownerName: "Radhe Shyam Sharma",
        shopName: "Radhe Shyam Daily Supermarket",
        phone: "+91 98450 11223",
        email: "radheshyam@dailysupermarket.in",
        passwordHash: "Radhe@2026!",
        businessProofs: [
          {
            type: "GSTIN",
            label: "GST Identification Number",
            documentNumber: "29BBBBB1111B2Z6",
            documentName: "GSTIN_RadheShyam.pdf",
            verified: true,
          },
          {
            type: "FSSAI",
            label: "FSSAI Food License",
            documentNumber: "11223344556677",
            documentName: "FSSAI_Daily_License.pdf",
            verified: true,
          },
        ],
        dedicatedUpiId: "radheshyam.daily@icici",
        address: "74, CMH Road, Near Metro Station, Indiranagar",
        area: "Indiranagar",
        city: "Bengaluru",
        subscription: {
          plan: "free",
          isPremium: false,
          price: 0,
          startDate: twoDaysAgo,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["basic_pos", "standard_inventory", "counter_pickup"],
        },
        msmeVerification: {
          status: "pending_review",
          udyamNumber: "UDYAM-KR-03-0089124",
          enterpriseName: "Radhe Shyam Daily Supermarket & Wholesale",
          enterpriseType: "Small",
          businessCategory: "Wholesale Trader",
          panNumber: "BBBBB1111B",
          state: "Karnataka",
          district: "Bengaluru Urban",
          submittedAt: oneDayAgo,
          reviewerNotes: "Pending team manual inspection of Udyam certificate copy.",
          b2bBadgeUnlocked: false,
        },
        createdAt: twoDaysAgo,
      },
      {
        id: "seller-3",
        shopId: "shop-3",
        ownerName: "Suresh Gupta",
        shopName: "Gupta Dairy & Daily Needs",
        phone: "+91 98860 33445",
        email: "suresh@guptadairy.in",
        passwordHash: "Gupta@2026!",
        businessProofs: [
          {
            type: "SHOP_ESTABLISHMENT",
            label: "Shop & Establishment Act (Gumasta)",
            documentNumber: "SEA/BLR/2023/9812",
            documentName: "Shop_Establishment_GuptaDairy.pdf",
            verified: true,
          },
        ],
        dedicatedUpiId: "guptadairy@paytm",
        address: "22, Old Airport Road, Domlur",
        area: "Domlur",
        city: "Bengaluru",
        subscription: {
          plan: "free",
          isPremium: false,
          price: 0,
          startDate: oneDayAgo,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ["basic_pos", "standard_inventory", "counter_pickup"],
        },
        msmeVerification: {
          status: "unsubmitted",
          udyamNumber: "",
          enterpriseName: "Gupta Dairy & Daily Needs",
          enterpriseType: "Micro",
          businessCategory: "Retail Store",
          panNumber: "",
          state: "Karnataka",
          district: "Bengaluru Urban",
          b2bBadgeUnlocked: false,
        },
        createdAt: oneDayAgo,
      },
    ];

    // 14. Seed Existing Customers
    this.customers = [
      {
        id: "cust-1",
        name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        phone: "+91 98450 67890",
        googleId: "google-priya-01",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isPhoneVerified: true,
        createdAt: threeDaysAgo,
      },
      {
        id: "cust-2",
        name: "Anand Verma",
        email: "anand.verma@gmail.com",
        phone: "+91 98111 22334",
        googleId: "google-anand-02",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isPhoneVerified: true,
        createdAt: twoDaysAgo,
      },
      {
        id: "cust-3",
        name: "Utkarsh Yadav",
        email: "utkarshyadav752@gmail.com",
        phone: "+91 99887 76655",
        googleId: "google-utkarsh-03",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isPhoneVerified: true,
        createdAt: oneDayAgo,
      },
    ];
  }

  // --- METHODS & TRANSACTIONS ---

  logAudit(entry: Omit<AuditLog, "id" | "timestamp">) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // Atomic billing: decrements inventory, creates invoice, logs transaction ledger
  createBillTransaction(data: {
    shopId: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    items: {
      productId: string;
      quantity: number;
      sellingPrice?: number;
      discount?: number;
    }[];
    discountTotal?: number;
    paymentMethod: "Cash" | "UPI" | "Card" | "Other";
    cashierName: string;
    reservationId?: string;
  }): { success: boolean; invoice?: Invoice; error?: string } {
    const shop = this.shops.find((s) => s.id === data.shopId);
    if (!shop) return { success: false, error: "Shop not found" };

    const invoiceItems: Invoice["items"] = [];
    let subtotal = 0;
    let gstTotal = 0;

    // Validate and build items
    for (const item of data.items) {
      const product = this.products.find((p) => p.id === item.productId && p.shopId === data.shopId);
      if (!product) {
        return { success: false, error: `Product ID ${item.productId} not found in this shop.` };
      }

      if (product.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`,
        };
      }

      const price = item.sellingPrice ?? product.sellingPrice;
      const discount = item.discount ?? 0;
      const itemTotal = price * item.quantity - discount;
      const itemGst = (itemTotal * product.gstPercent) / 100;

      subtotal += itemTotal;
      gstTotal += itemGst;

      invoiceItems.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        unit: product.unit,
        quantity: item.quantity,
        mrp: product.mrp,
        sellingPrice: price,
        gstPercent: product.gstPercent,
        discount,
        total: itemTotal,
        isManualEntry: !product.hasBarcode,
      });
    }

    const discountTotal = data.discountTotal ?? 0;
    const finalTotal = Math.max(0, Math.round(subtotal - discountTotal));
    const cgst = Number((gstTotal / 2).toFixed(2));
    const sgst = Number((gstTotal / 2).toFixed(2));

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = `inv-${Date.now()}`;
    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      shopId: data.shopId,
      customerId: data.customerId,
      customerName: data.customerName || "Walk-in Customer",
      customerPhone: data.customerPhone,
      items: invoiceItems,
      subtotal,
      discountTotal,
      gstTotal: Number(gstTotal.toFixed(2)),
      cgst,
      sgst,
      totalAmount: finalTotal,
      paymentMethod: data.paymentMethod,
      paymentStatus: "Completed",
      createdAt: now,
      cashierName: data.cashierName,
    };

    // Apply inventory decrement & record ledger atomically
    for (const invItem of invoiceItems) {
      const product = this.products.find((p) => p.id === invItem.productId)!;
      const prevStock = product.currentStock;
      product.currentStock -= invItem.quantity;
      product.lastSoldAt = now;
      product.lastUpdatedAt = now;

      // If reservation was associated, release reservedStock
      if (data.reservationId && product.reservedStock >= invItem.quantity) {
        product.reservedStock -= invItem.quantity;
      }

      this.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        shopId: data.shopId,
        productId: product.id,
        productName: product.name,
        type: "Sale",
        quantityChange: -invItem.quantity,
        previousStock: prevStock,
        newStock: product.currentStock,
        referenceId: invoiceNumber,
        performedBy: data.cashierName,
        timestamp: now,
      });
    }

    // Mark reservation as Collected if this completed a reservation
    if (data.reservationId) {
      const reservation = this.reservations.find((r) => r.id === data.reservationId);
      if (reservation) {
        reservation.status = "Collected";
        reservation.collectedAt = now;
      }
    }

    this.invoices.unshift(invoice);

    this.logAudit({
      userId: "user-seller-1",
      userName: data.cashierName,
      userRole: "seller",
      action: "Bill creation",
      entity: "Invoice",
      entityId: invoice.id,
      newValue: `${invoice.invoiceNumber} - Total ₹${invoice.totalAmount} (${data.paymentMethod})`,
    });

    return { success: true, invoice };
  }

  // Stock addition (single or continuous mode)
  addStock(data: {
    shopId: string;
    productId: string;
    quantity: number;
    purchasePrice?: number;
    sellingPrice?: number;
    supplierId?: string;
    batchNumber?: string;
    expiryDate?: string;
    performedBy: string;
    source?: "Barcode Scan" | "Manual Entry" | "Purchase Order";
  }): { success: boolean; product?: Product; restockNotifiedCount?: number; error?: string } {
    const product = this.products.find((p) => p.id === data.productId && p.shopId === data.shopId);
    if (!product) return { success: false, error: "Product not found" };

    const prevStock = product.currentStock;
    product.currentStock += data.quantity;
    if (data.purchasePrice !== undefined) product.purchasePrice = data.purchasePrice;
    if (data.sellingPrice !== undefined) product.sellingPrice = data.sellingPrice;
    if (data.batchNumber) product.batchNumber = data.batchNumber;
    if (data.expiryDate) product.expiryDate = data.expiryDate;
    if (data.supplierId) {
      product.supplierId = data.supplierId;
      const s = this.suppliers.find((sup) => sup.id === data.supplierId);
      if (s) product.supplierName = s.name;
    }

    const now = new Date().toISOString();
    product.lastUpdatedAt = now;
    product.lastVerifiedAt = now;

    this.transactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      shopId: data.shopId,
      productId: product.id,
      productName: product.name,
      type: "Purchase",
      quantityChange: data.quantity,
      previousStock: prevStock,
      newStock: product.currentStock,
      reason: data.source || "Stock replenishment",
      performedBy: data.performedBy,
      timestamp: now,
    });

    // Notify any waiting customers if product was out of stock
    let notifiedCount = 0;
    if (prevStock === 0 && product.currentStock > 0) {
      const waiting = this.waitlists.filter(
        (w) => w.productId === product.id && w.status === "Pending"
      );
      for (const w of waiting) {
        w.status = "Notified";
        w.notifiedAt = now;
        notifiedCount++;
      }
    }

    this.logAudit({
      userId: "user-seller-1",
      userName: data.performedBy,
      userRole: "seller",
      action: "Stock addition",
      entity: "Product",
      entityId: product.id,
      previousValue: `${prevStock} units`,
      newValue: `${product.currentStock} units (+${data.quantity})`,
    });

    return { success: true, product, restockNotifiedCount: notifiedCount };
  }

  // Stock Guardian verification
  verifyStock(data: {
    shopId: string;
    productId: string;
    physicalCount: number;
    reason?: any;
    notes?: string;
    verifiedBy: string;
  }): { success: boolean; verification?: StockVerification; error?: string } {
    const product = this.products.find((p) => p.id === data.productId && p.shopId === data.shopId);
    if (!product) return { success: false, error: "Product not found" };

    const expectedStock = product.currentStock;
    const discrepancy = data.physicalCount - expectedStock;
    const now = new Date().toISOString();

    const verification: StockVerification = {
      id: `ver-${Date.now()}`,
      shopId: data.shopId,
      productId: product.id,
      productName: product.name,
      expectedStock,
      physicalCount: data.physicalCount,
      discrepancy,
      reason: data.reason,
      notes: data.notes,
      verifiedBy: data.verifiedBy,
      timestamp: now,
    };

    this.verifications.unshift(verification);

    // Apply adjustment if discrepancy exists
    if (discrepancy !== 0) {
      product.currentStock = data.physicalCount;
      if (data.reason === "Damaged product") {
        product.damagedStock += Math.abs(discrepancy);
      } else if (data.reason === "Expired product") {
        product.expiredStock += Math.abs(discrepancy);
      }

      this.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        shopId: data.shopId,
        productId: product.id,
        productName: product.name,
        type: "Stock correction",
        quantityChange: discrepancy,
        previousStock: expectedStock,
        newStock: data.physicalCount,
        reason: data.reason || "Physical count adjustment",
        performedBy: data.verifiedBy,
        timestamp: now,
      });
    }

    product.lastVerifiedAt = now;
    product.lastUpdatedAt = now;

    this.logAudit({
      userId: "user-seller-1",
      userName: data.verifiedBy,
      userRole: "seller",
      action: "Stock verification",
      entity: "Stock Guardian",
      entityId: product.id,
      previousValue: `Expected: ${expectedStock}`,
      newValue: `Counted: ${data.physicalCount} (Discrepancy: ${discrepancy}, Reason: ${data.reason || "Verified match"})`,
    });

    return { success: true, verification };
  }

  // Create or update reservation
  createReservation(data: {
    shopId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: { productId: string; quantity: number }[];
  }): { success: boolean; reservation?: Reservation; error?: string } {
    const shop = this.shops.find((s) => s.id === data.shopId);
    if (!shop) return { success: false, error: "Shop not found" };

    const reservationItems: ReservationItem[] = [];
    let totalAmount = 0;

    for (const itm of data.items) {
      const product = this.products.find((p) => p.id === itm.productId && p.shopId === data.shopId);
      if (!product) return { success: false, error: "Product not found" };

      const sellable = product.currentStock - product.reservedStock;
      if (sellable < itm.quantity) {
        return {
          success: false,
          error: `Only ${sellable} ${product.unit}(s) available for ${product.name} to reserve.`,
        };
      }

      product.reservedStock += itm.quantity;
      totalAmount += product.sellingPrice * itm.quantity;

      reservationItems.push({
        productId: product.id,
        productName: product.name,
        quantity: itm.quantity,
        price: product.sellingPrice,
        unit: product.unit,
      });
    }

    const now = new Date();
    const expiryMinutes = shop.reservationExpiryMinutes || 30;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString();
    const resCode = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      reservationCode: resCode,
      shopId: data.shopId,
      shopName: shop.name,
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      items: reservationItems,
      totalAmount,
      status: "Requested",
      requestedAt: now.toISOString(),
      expiresAt,
    };

    this.reservations.unshift(reservation);

    this.logAudit({
      userId: data.customerId,
      userName: data.customerName,
      userRole: "customer",
      action: "Reservation",
      entity: "Reservation",
      entityId: reservation.id,
      newValue: `Reserved ${reservationItems.length} items (Total ₹${totalAmount})`,
    });

    return { success: true, reservation };
  }

  // Update reservation status (Confirm, Ready, Collected, Cancel, No-Show)
  updateReservationStatus(
    reservationId: string,
    newStatus: Reservation["status"],
    actorName: string,
    reason?: string
  ): { success: boolean; reservation?: Reservation; error?: string } {
    const reservation = this.reservations.find((r) => r.id === reservationId);
    if (!reservation) return { success: false, error: "Reservation not found" };

    const oldStatus = reservation.status;
    reservation.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === "Confirmed") reservation.confirmedAt = now;
    if (newStatus === "Ready") reservation.readyAt = now;
    if (newStatus === "Collected") reservation.collectedAt = now;
    if (newStatus === "Cancelled" || newStatus === "Expired" || newStatus === "No-show") {
      reservation.cancellationReason = reason || newStatus;
      // Release reservedStock
      for (const itm of reservation.items) {
        const product = this.products.find((p) => p.id === itm.productId);
        if (product && product.reservedStock >= itm.quantity) {
          product.reservedStock -= itm.quantity;
        }
      }
    }

    this.logAudit({
      userId: "user-system",
      userName: actorName,
      userRole: "seller",
      action: "Reservation status update",
      entity: "Reservation",
      entityId: reservation.id,
      previousValue: oldStatus,
      newValue: `${newStatus} ${reason ? `(${reason})` : ""}`,
    });

    return { success: true, reservation };
  }

  // Customer triggers "I'm coming in 20 minutes"
  markComingSoon(reservationId: string, eta = "20 minutes") {
    const reservation = this.reservations.find((r) => r.id === reservationId);
    if (!reservation) return { success: false, error: "Reservation not found" };
    reservation.isComingSoon = true;
    reservation.comingETA = eta;

    // Send automated chat message to shopkeeper
    this.messages.push({
      id: `msg-${Date.now()}`,
      conversationId: `conv-${reservation.customerId}-${reservation.shopId}`,
      shopId: reservation.shopId,
      senderId: reservation.customerId,
      senderName: reservation.customerName,
      senderRole: "customer",
      text: `🔔 I am on my way to collect reservation ${reservation.reservationCode}! ETA: ${eta}. Please keep it ready.`,
      timestamp: new Date().toISOString(),
      relatedReservationId: reservation.id,
    });

    this.logAudit({
      userId: reservation.customerId,
      userName: reservation.customerName,
      userRole: "customer",
      action: "I'm coming mode",
      entity: "Reservation",
      entityId: reservation.id,
      newValue: `Customer marked on the way (ETA ${eta})`,
    });

    return { success: true, reservation };
  }

  // ==========================================
  // MSME / B2B VERIFICATION (CASHIFY SUPERSALE B2B MODEL)
  // ==========================================
  submitMsmeVerification(params: {
    sellerId: string;
    udyamNumber: string;
    enterpriseName: string;
    enterpriseType: "Micro" | "Small" | "Medium";
    businessCategory: "Retail Store" | "Wholesale Trader" | "Refurbished Electronics (B2B SuperSale)" | "Kirana & FMCG" | "General Merchant";
    panNumber: string;
    state: string;
    district: string;
    certificateUrl?: string;
  }) {
    const seller = this.sellers.find((s) => s.id === params.sellerId);
    if (!seller) return { success: false, error: "Seller not found" };

    const cleanUdyam = params.udyamNumber.trim().toUpperCase();
    if (!cleanUdyam) {
      return { success: false, error: "MSME / Udyam document registration number is required." };
    }

    const verificationRecord: MsmeVerificationData = {
      status: "pending_review",
      udyamNumber: cleanUdyam,
      enterpriseName: params.enterpriseName.trim() || seller.shopName,
      enterpriseType: params.enterpriseType || "Micro",
      businessCategory: params.businessCategory || "Kirana & FMCG",
      panNumber: (params.panNumber || "").trim().toUpperCase(),
      state: params.state.trim() || seller.city || "Delhi",
      district: params.district.trim() || seller.area || "Central",
      submittedAt: new Date().toISOString(),
      certificateUrl: params.certificateUrl || "https://udyamregistration.gov.in/sample_certificate.pdf",
      b2bBadgeUnlocked: false,
    };

    seller.msmeVerification = verificationRecord;

    // Also update shop's business proofs
    const existingMsmeProofIdx = seller.businessProofs.findIndex((p) => p.type === "MSME");
    const msmeProof = {
      type: "MSME" as const,
      label: "MSME Udyam Registration (Verification Pending)",
      documentNumber: cleanUdyam,
      documentName: `${cleanUdyam}_Certificate.pdf`,
      verified: false,
    };

    if (existingMsmeProofIdx >= 0) {
      seller.businessProofs[existingMsmeProofIdx] = msmeProof;
    } else {
      seller.businessProofs.push(msmeProof);
    }

    const shop = this.shops.find((s) => s.id === seller.shopId);
    if (shop) {
      shop.businessProofs = seller.businessProofs;
    }

    this.logAudit({
      userId: seller.id,
      userName: seller.ownerName,
      userRole: "seller",
      action: "MSME Document Submitted (Pending Team Review)",
      entity: "MSME Verification",
      entityId: cleanUdyam,
      newValue: `Submitted ${cleanUdyam} for ${seller.shopName} - Pending Team Review`,
    });

    const { passwordHash: _, ...safeSeller } = seller;
    return { success: true, seller: safeSeller, verification: verificationRecord };
  }

  // Verification Team Review Action (Approve / Reject / Request Changes)
  reviewMsmeVerification(params: {
    sellerId: string;
    decision: "verified" | "rejected";
    reviewedBy: string;
    rejectionReason?: string;
    reviewerNotes?: string;
  }) {
    const seller = this.sellers.find((s) => s.id === params.sellerId);
    if (!seller) return { success: false, error: "Seller not found" };
    if (!seller.msmeVerification) {
      return { success: false, error: "No MSME verification submission found for this seller." };
    }

    const isVerified = params.decision === "verified";
    const nowISO = new Date().toISOString();

    seller.msmeVerification.status = params.decision;
    seller.msmeVerification.reviewedAt = nowISO;
    seller.msmeVerification.reviewedBy = params.reviewedBy || "KiranaSetu Verification Team";
    seller.msmeVerification.rejectionReason = isVerified ? undefined : params.rejectionReason || "Details did not match Government database";
    seller.msmeVerification.reviewerNotes = params.reviewerNotes || (isVerified ? "Verified and approved on Government MSME portal" : "Rejected");
    seller.msmeVerification.b2bBadgeUnlocked = isVerified;

    // Update business proof status
    const msmeProof = seller.businessProofs.find((p) => p.type === "MSME");
    if (msmeProof) {
      msmeProof.verified = isVerified;
      msmeProof.label = isVerified
        ? "MSME Udyam Registration (Team Verified ✓)"
        : "MSME Udyam Registration (Verification Rejected)";
    }

    const shop = this.shops.find((s) => s.id === seller.shopId);
    if (shop) {
      shop.businessProofs = seller.businessProofs;
    }

    this.logAudit({
      userId: "team-compliance",
      userName: params.reviewedBy || "Compliance Team Officer",
      userRole: "admin",
      action: `MSME Verification ${isVerified ? "Approved" : "Rejected"}`,
      entity: "MSME Verification",
      entityId: seller.msmeVerification.udyamNumber,
      newValue: `Team decision: ${params.decision.toUpperCase()} for ${seller.shopName} by ${params.reviewedBy}`,
    });

    const { passwordHash: _, ...safeSeller } = seller;
    return { success: true, seller: safeSeller, verification: seller.msmeVerification };
  }

  getMsmeSubmissions() {
    return this.sellers
      .filter((s) => s.msmeVerification && s.msmeVerification.status !== "unsubmitted")
      .map((s) => ({
        sellerId: s.id,
        shopId: s.shopId,
        shopName: s.shopName,
        ownerName: s.ownerName,
        phone: s.phone,
        email: s.email,
        verification: s.msmeVerification!,
      }));
  }
}

export const db = new InMemoryDatabase();
