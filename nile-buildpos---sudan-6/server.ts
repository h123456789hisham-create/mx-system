import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  initMySQL, 
  isMySQLEnabled, 
  loadGlobalFromDB, 
  saveGlobalToDB, 
  loadAllTenantsFromDB, 
  saveTenantToDB 
} from "./mysql-db.js";

const app = express();
const PORT = 3000;
const DB_DIR = path.resolve("./data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data folder and db.json exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DBState {
  inventory: any[] | null;
  sales: any[] | null;
  settings: any | null;
  expenses: any[] | null;
  chinaTransfers: any[] | null;
  audits: any[] | null;
  customers: any[] | null;
  warehouses: any[] | null;
  stockTransfers: any[] | null;
  priceLists: any[] | null;
  suppliers: any[] | null;
  purchaseRequests: any[] | null;
  rfqs: any[] | null;
  purchaseOrders: any[] | null;
  purchaseInvoices: any[] | null;
  purchaseReturns: any[] | null;
  debitNotes: any[] | null;
  supplierPayments: any[] | null;
  purchaseSettings: any | null;
  safes: any[] | null;
  bankAccounts: any[] | null;
  financeTransactions: any[] | null;
  financeSettings: any | null;
  branches: any[] | null;
  invoiceTemplateSettings: any | null;
  customDocuments: any[] | null;
  systemUsers: any[] | null;
  saasSettings: any | null;
  posTerminals?: any[] | null;
  posSessions?: any[] | null;
}

let dbCache: DBState = {
  inventory: null,
  sales: null,
  settings: null,
  expenses: null,
  chinaTransfers: null,
  audits: null,
  customers: null,
  warehouses: null,
  stockTransfers: null,
  priceLists: null,
  suppliers: null,
  purchaseRequests: null,
  rfqs: null,
  purchaseOrders: null,
  purchaseInvoices: null,
  purchaseReturns: null,
  debitNotes: null,
  supplierPayments: null,
  purchaseSettings: null,
  safes: null,
  bankAccounts: null,
  financeTransactions: null,
  financeSettings: null,
  branches: null,
  invoiceTemplateSettings: null,
  customDocuments: null,
  systemUsers: null,
  saasSettings: null
};

// Initial load from disk
try {
  if (fs.existsSync(DB_FILE)) {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    if (content.trim()) {
      const parsed = JSON.parse(content);
      dbCache = {
        inventory: parsed.inventory || null,
        sales: parsed.sales || null,
        settings: parsed.settings || null,
        expenses: parsed.expenses || null,
        chinaTransfers: parsed.chinaTransfers || null,
        audits: parsed.audits || null,
        customers: parsed.customers || null,
        warehouses: parsed.warehouses || null,
        stockTransfers: parsed.stockTransfers || null,
        priceLists: parsed.priceLists || null,
        suppliers: parsed.suppliers || null,
        purchaseRequests: parsed.purchaseRequests || null,
        rfqs: parsed.rfqs || null,
        purchaseOrders: parsed.purchaseOrders || null,
        purchaseInvoices: parsed.purchaseInvoices || null,
        purchaseReturns: parsed.purchaseReturns || null,
        debitNotes: parsed.debitNotes || null,
        supplierPayments: parsed.supplierPayments || null,
        purchaseSettings: parsed.purchaseSettings || null,
        safes: parsed.safes || null,
        bankAccounts: parsed.bankAccounts || null,
        financeTransactions: parsed.financeTransactions || null,
        financeSettings: parsed.financeSettings || null,
        branches: parsed.branches || null,
        invoiceTemplateSettings: parsed.invoiceTemplateSettings || null,
        customDocuments: parsed.customDocuments || null,
        systemUsers: parsed.systemUsers || null,
        saasSettings: parsed.saasSettings || null
      };
    }
  }
} catch (error) {
  console.error("Error reading db.json at startup:", error);
}

// Set up default SaaS settings if null
if (!dbCache.saasSettings) {
  dbCache.saasSettings = {
    monthlyPrice: 15000,
    annualPrice: 120000,
    currency: "SDG",
    whatsAppNumber: "+249997444409",
    featuresList: [
      "إصدار عدد غير محدود من فواتير المبيعات ونقاط البيع",
      "إدارة المخزون وتفاصيل العجز والعهد والتحويلات",
      "التحويلات والحسابات وحركية الصين المتكاملة والأرباح والديون",
      "الإدارة المالية وحركة الخزائن وصناديق الحساب والعملاء الموردين",
      "التقارير السحابية الفورية ومراقبة تسويات الورديات والمحاسبة"
    ]
  };
}

// Set up default users if systemUsers list is empty or null
if (!dbCache.systemUsers || dbCache.systemUsers.length === 0) {
  dbCache.systemUsers = [
    {
      id: "usr-admin-1",
      name: "هشام مصطفى (الإدارة)",
      email: "hisham.yo005@gmail.com",
      role: "admin",
      password: "123",
      isLocked: false
    },
    {
      id: "usr-cashier-1",
      name: "موظف الكاشير 1",
      email: "cashier1@nobles.com",
      role: "cashier",
      password: "123",
      isLocked: false
    }
  ];
  // Write the defaults immediately
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing default users:", err);
  }
}

function readDB(): DBState {
  return dbCache;
}

function writeDB(data: Partial<DBState>) {
  try {
    dbCache = { ...dbCache, ...data };
    const tempFile = DB_FILE + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);

    // Save to MySQL in background if enabled
    if (isMySQLEnabled()) {
      for (const key of Object.keys(data)) {
        saveGlobalToDB(key, (data as any)[key]).catch(err => {
          console.error(`Error saving global key ${key} to MySQL:`, err);
        });
      }
    }
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
}

// Multi-Tenant Path Resolution & Cache
const TENANT_DB_DIR = path.resolve("./data");

function getTenantDBPath(tenantId: string): string {
  const cleanId = (tenantId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(TENANT_DB_DIR, `db_tenant_${cleanId}.json`);
}

const tenantCache: Record<string, DBState> = {};

function readTenantDB(tenantId: string): DBState {
  const tid = tenantId || "default";

  if (tenantCache[tid]) {
    return tenantCache[tid];
  }

  const filePath = getTenantDBPath(tid);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        tenantCache[tid] = parsed;
        return parsed;
      }
    } catch (error) {
      console.error(`Error reading tenant DB for ${tid}:`, error);
    }
  }

  // Create default skeleton
  const skeleton: DBState = {
    inventory: [],
    sales: [],
    settings: {
      storeName: "",
      storeTagline: "",
      currency: "SDG",
      taxRate: 15,
      isTaxEnabled: false,
      lowStockThreshold: 10
    },
    expenses: [],
    chinaTransfers: [],
    audits: [],
    customers: [],
    warehouses: [],
    stockTransfers: [],
    priceLists: [],
    suppliers: [],
    purchaseRequests: [],
    rfqs: [],
    purchaseOrders: [],
    purchaseInvoices: [],
    purchaseReturns: [],
    debitNotes: [],
    supplierPayments: [],
    purchaseSettings: {},
    safes: [],
    bankAccounts: [],
    financeTransactions: [],
    financeSettings: {},
    branches: [],
    invoiceTemplateSettings: {},
    customDocuments: [],
    systemUsers: null,
    saasSettings: null
  };

  tenantCache[tid] = skeleton;
  return skeleton;
}

function writeTenantDB(tenantId: string, data: Partial<DBState>) {
  const tid = tenantId || "default";

  const current = readTenantDB(tid);
  const updated = { ...current, ...data };
  tenantCache[tid] = updated;

  const filePath = getTenantDBPath(tid);
  try {
    const tempFile = filePath + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);

    // Save to MySQL in background if enabled
    if (isMySQLEnabled()) {
      for (const key of Object.keys(data)) {
        saveTenantToDB(tid, key, (data as any)[key]).catch(err => {
          console.error(`Error saving tenant data ${tid} [${key}] to MySQL:`, err);
        });
      }
    }
  } catch (error) {
    console.error(`Error writing tenant DB for ${tid}:`, error);
  }
}

// Enable standard CORS manual headers for seamless iframe sandbox integration
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: "50mb" }));

// Handle JSON malformed parsing syntax errors gracefully
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    console.error("Malformed JSON payload received:", err.message);
    return res.status(400).json({ success: false, error: "Malformed JSON payload" });
  }
  next(err);
});

// API: Get entire local database state (Merged global and tenant)
app.get("/api/data", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const globalDB = readDB();
  const tenantDB = readTenantDB(tenantId);

  const merged = {
    ...tenantDB,
    systemUsers: globalDB.systemUsers,
    saasSettings: globalDB.saasSettings
  };

  res.json(merged);
});

// API: Save operational data per tenant
app.post("/api/data/inventory", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { inventory } = req.body || {};
  writeTenantDB(tenantId, { inventory });
  res.json({ success: true });
});

app.post("/api/data/sales", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { sales } = req.body || {};
  writeTenantDB(tenantId, { sales });
  res.json({ success: true });
});

app.post("/api/data/settings", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { settings } = req.body || {};
  writeTenantDB(tenantId, { settings });
  res.json({ success: true });
});

app.post("/api/data/expenses", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { expenses } = req.body || {};
  writeTenantDB(tenantId, { expenses });
  res.json({ success: true });
});

app.post("/api/data/chinaTransfers", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { chinaTransfers } = req.body || {};
  writeTenantDB(tenantId, { chinaTransfers });
  res.json({ success: true });
});

app.post("/api/data/audits", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { audits } = req.body || {};
  writeTenantDB(tenantId, { audits });
  res.json({ success: true });
});

app.post("/api/data/customers", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { customers } = req.body || {};
  writeTenantDB(tenantId, { customers });
  res.json({ success: true });
});

app.post("/api/data/warehouses", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { warehouses } = req.body || {};
  writeTenantDB(tenantId, { warehouses });
  res.json({ success: true });
});

app.post("/api/data/stockTransfers", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { stockTransfers } = req.body || {};
  writeTenantDB(tenantId, { stockTransfers });
  res.json({ success: true });
});

app.post("/api/data/priceLists", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { priceLists } = req.body || {};
  writeTenantDB(tenantId, { priceLists });
  res.json({ success: true });
});

app.post("/api/data/suppliers", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { suppliers } = req.body || {};
  writeTenantDB(tenantId, { suppliers });
  res.json({ success: true });
});

app.post("/api/data/purchaseRequests", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { purchaseRequests } = req.body || {};
  writeTenantDB(tenantId, { purchaseRequests });
  res.json({ success: true });
});

app.post("/api/data/rfqs", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  const { rfqs } = req.body || {};
  writeTenantDB(tenantId, { rfqs });
  res.json({ success: true });
});

app.post("/api/data/purchaseOrders", (req, res) => {
  const { purchaseOrders } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { purchaseOrders });
  res.json({ success: true });
});

app.post("/api/data/purchaseInvoices", (req, res) => {
  const { purchaseInvoices } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { purchaseInvoices });
  res.json({ success: true });
});

app.post("/api/data/purchaseReturns", (req, res) => {
  const { purchaseReturns } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { purchaseReturns });
  res.json({ success: true });
});

app.post("/api/data/debitNotes", (req, res) => {
  const { debitNotes } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { debitNotes });
  res.json({ success: true });
});

app.post("/api/data/supplierPayments", (req, res) => {
  const { supplierPayments } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { supplierPayments });
  res.json({ success: true });
});

app.post("/api/data/purchaseSettings", (req, res) => {
  const { purchaseSettings } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { purchaseSettings });
  res.json({ success: true });
});

app.post("/api/data/safes", (req, res) => {
  const { safes } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { safes });
  res.json({ success: true });
});

app.post("/api/data/bankAccounts", (req, res) => {
  const { bankAccounts } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { bankAccounts });
  res.json({ success: true });
});

app.post("/api/data/financeTransactions", (req, res) => {
  const { financeTransactions } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { financeTransactions });
  res.json({ success: true });
});

app.post("/api/data/financeSettings", (req, res) => {
  const { financeSettings } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { financeSettings });
  res.json({ success: true });
});

app.post("/api/data/branches", (req, res) => {
  const { branches } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { branches });
  res.json({ success: true });
});

app.post("/api/data/invoiceTemplateSettings", (req, res) => {
  const { invoiceTemplateSettings } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { invoiceTemplateSettings });
  res.json({ success: true });
});

app.post("/api/data/customDocuments", (req, res) => {
  const { customDocuments } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { customDocuments });
  res.json({ success: true });
});

app.post("/api/data/posTerminals", (req, res) => {
  const { posTerminals } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { posTerminals });
  res.json({ success: true });
});

app.post("/api/data/posSessions", (req, res) => {
  const { posSessions } = req.body || {};
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { posSessions });
  res.json({ success: true });
});

app.post("/api/data/systemUsers", (req, res) => {
  const { systemUsers } = req.body || {};
  writeDB({ systemUsers });
  res.json({ success: true });
});

app.post("/api/data/saasSettings", (req, res) => {
  const { saasSettings } = req.body || {};
  writeDB({ saasSettings });
  res.json({ success: true });
});

// API: Purge database per tenant
app.post("/api/data/purge", (req, res) => {
  const tenantId = (req.query.tenantId as string) || "";
  writeTenantDB(tenantId, { 
    inventory: [], 
    sales: [], 
    settings: {
      storeName: "",
      storeTagline: "",
      currency: "SDG",
      taxRate: 15,
      isTaxEnabled: false,
      lowStockThreshold: 10
    },
    expenses: [], 
    chinaTransfers: [], 
    audits: [], 
    customers: [],
    warehouses: [],
    stockTransfers: [],
    priceLists: [],
    suppliers: [],
    purchaseRequests: [],
    rfqs: [],
    purchaseOrders: [],
    purchaseInvoices: [],
    purchaseReturns: [],
    debitNotes: [],
    supplierPayments: [],
    purchaseSettings: {},
    safes: [],
    bankAccounts: [],
    financeTransactions: [],
    financeSettings: {},
    branches: [],
    invoiceTemplateSettings: {},
    customDocuments: []
  });
  res.json({ success: true });
});

async function startServer() {
  // Initialize MySQL connection and sync tables if active
  const useMySQL = await initMySQL();
  if (useMySQL) {
    console.log("⚡ [MySQL] Synced and active. Syncing cache with MySQL databases...");
    // Overwrite the memory cache with data from DB if available
    await loadGlobalFromDB(dbCache);
    await loadAllTenantsFromDB(tenantCache);

    // Re-verify SaaS settings after loading from MySQL
    if (!dbCache.saasSettings) {
      dbCache.saasSettings = {
        monthlyPrice: 15000,
        annualPrice: 120000,
        currency: "SDG",
        whatsAppNumber: "+249997444409",
        featuresList: [
          "إصدار عدد غير محدود من فواتير المبيعات ونقاط البيع",
          "إدارة المخزون وتفاصيل العجز والعهد والتحويلات",
          "التحويلات والحسابات وحركية الصين المتكاملة والأرباح والديون",
          "الإدارة المالية وحركة الخزائن وصناديق الحساب والعملاء الموردين",
          "التقارير السحابية الفورية ومراقبة تسويات الورديات والمحاسبة"
        ]
      };
      await saveGlobalToDB("saasSettings", dbCache.saasSettings);
    }

    // Re-verify initial user profiles after Loading from MySQL
    if (!dbCache.systemUsers || dbCache.systemUsers.length === 0) {
      dbCache.systemUsers = [
        {
          id: "usr-admin-1",
          name: "هشام مصطفى (الإدارة)",
          email: "hisham.yo005@gmail.com",
          role: "admin",
          password: "123",
          isLocked: false
        },
        {
          id: "usr-cashier-1",
          name: "موظف الكاشير 1",
          email: "cashier1@nobles.com",
          role: "cashier",
          password: "123",
          isLocked: false
        }
      ];
      await saveGlobalToDB("systemUsers", dbCache.systemUsers);
    }
  }

  // Vite middleware for development
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
    console.log(`Local Server running on http://localhost:${PORT}`);
  });
}

startServer();
