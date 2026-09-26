export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export const SAMPLE_BARCODES = [
  {
    barcode: "8901719101012",
    name: "Parle-G Gluco Biscuits 250g",
    price: 28,
    type: "EAN-13",
    category: "Biscuits",
  },
  {
    barcode: "8901262010051",
    name: "Amul Taaza Milk 500ml",
    price: 27,
    type: "EAN-13",
    category: "Dairy",
  },
  {
    barcode: "8901058852441",
    name: "Maggi 2-Min Noodles 70g",
    price: 14,
    type: "EAN-13",
    category: "Instant Food",
  },
  {
    barcode: "8904004400032",
    name: "Tata Salt 1kg",
    price: 26,
    type: "EAN-13",
    category: "Staples",
  },
  {
    barcode: "8901725181220",
    name: "Aashirvaad Atta 5kg",
    price: 245,
    type: "EAN-13",
    category: "Atta & Flour",
  },
  {
    barcode: "8906007281014",
    name: "Fortune Sunflower Oil 1L",
    price: 155,
    type: "EAN-13",
    category: "Edible Oil",
  },
  {
    barcode: "8901396312014",
    name: "Dettol Soap 75g",
    price: 40,
    type: "EAN-13",
    category: "Personal Care",
  },
  {
    barcode: "8901314010523",
    name: "Colgate Strong Teeth 100g",
    price: 60,
    type: "EAN-13",
    category: "Personal Care",
  },
  {
    barcode: "8901491101834",
    name: "Red Label Tea 250g",
    price: 132,
    type: "EAN-13",
    category: "Beverages",
  },
  {
    barcode: "8901063012113",
    name: "Good Day Cookies 120g",
    price: 32,
    type: "EAN-13",
    category: "Cookies",
  },
  {
    barcode: "QR-LOC-TOMATO",
    name: "Fresh Hybrid Tomatoes (Loose)",
    price: 35,
    type: "Internal QR",
    category: "Vegetables",
  },
  {
    barcode: "QR-LOC-ONION",
    name: "Nashik Red Onions (Loose)",
    price: 42,
    type: "Internal QR",
    category: "Vegetables",
  },
  {
    barcode: "8909999000001",
    name: "Unknown / New Product Barcode",
    price: 0,
    type: "New Scan",
    category: "Unregistered",
  },
];
