/**
 * Medical Billing & Pharmacy Data Store - THIRAN
 */

const STORAGE_KEYS = {
    BUSINESS: "med_app_business",
    ITEMS: "med_app_items",
    SUPPLIERS: "med_app_suppliers",
    SUPPLIER_TXNS: "med_app_supplier_txns",
    CUSTOMERS: "med_app_customers",
    PURCHASES: "med_app_purchases",
    INVOICES: "med_app_invoices"
};

const Store = {
    init() {
        const bizRaw = localStorage.getItem(STORAGE_KEYS.BUSINESS);
        if (!bizRaw) {
            this.saveBusiness(DEFAULT_PHARMA_BUSINESS);
        } else {
            const b = JSON.parse(bizRaw);
            if (b.name === "JAPS HEALTHCARE" || !b.name) {
                b.name = "THIRAN";
                b.email = "thiranpharma@gmail.com";
                b.invoicePrefix = "TH/2026-27-";
                this.saveBusiness(b);
            }
        }

        if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
            this.saveItems(DEFAULT_PHARMA_ITEMS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
            this.saveSuppliers(DEFAULT_PHARMA_SUPPLIERS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUPPLIER_TXNS)) {
            this.saveSupplierTxns(DEFAULT_PHARMA_SUPPLIER_TXNS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
            this.saveCustomers(DEFAULT_PHARMA_CUSTOMERS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
            this.savePurchases(DEFAULT_PHARMA_PURCHASES);
        }
        if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
            this.saveInvoices(DEFAULT_PHARMA_INVOICES);
        }
    },

    // Business Details
    getBusiness() {
        const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS);
        const data = raw ? JSON.parse(raw) : { ...DEFAULT_PHARMA_BUSINESS };
        if (data.name === "JAPS HEALTHCARE") {
            data.name = "THIRAN";
            data.email = "thiranpharma@gmail.com";
        }
        return data;
    },
    saveBusiness(data) {
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(data));
    },

    // Medicines / Items
    getItems() {
        const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
        return raw ? JSON.parse(raw) : [];
    },
    saveItems(items) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    },
    getItemById(id) {
        return this.getItems().find(i => i.id === id) || null;
    },
    saveItem(item) {
        const list = this.getItems();
        if (!item.id) {
            item.id = "med-" + Date.now();
            list.push(item);
        } else {
            const idx = list.findIndex(i => i.id === item.id);
            if (idx !== -1) list[idx] = item;
            else list.push(item);
        }
        this.saveItems(list);
        return item;
    },
    deleteItem(id) {
        const list = this.getItems().filter(i => i.id !== id);
        this.saveItems(list);
    },
    adjustStock(productName, batch, changeQty) {
        const list = this.getItems();
        const item = list.find(i =>
            i.name.trim().toLowerCase() === productName.trim().toLowerCase() &&
            (!batch || i.batch.trim().toLowerCase() === batch.trim().toLowerCase())
        );
        if (item) {
            item.stock = Math.max(0, (Number(item.stock) || 0) + changeQty);
            this.saveItems(list);
        }
    },

    // Suppliers
    getSuppliers() {
        const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
        return raw ? JSON.parse(raw) : [];
    },
    saveSuppliers(suppliers) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
    },
    getSupplierById(id) {
        return this.getSuppliers().find(s => s.id === id) || null;
    },
    getSupplierByName(name) {
        if (!name) return null;
        return this.getSuppliers().find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase()) || null;
    },
    saveSupplier(supplier) {
        const list = this.getSuppliers();
        if (!supplier.id) {
            supplier.id = "sup-" + Date.now();
            supplier.balance = Number(supplier.balance) || 0;
            list.push(supplier);
        } else {
            const idx = list.findIndex(s => s.id === supplier.id);
            if (idx !== -1) list[idx] = supplier;
            else list.push(supplier);
        }
        this.saveSuppliers(list);
        return supplier;
    },
    deleteSupplier(id) {
        const list = this.getSuppliers().filter(s => s.id !== id);
        this.saveSuppliers(list);
    },

    // Supplier Transactions
    getSupplierTxns() {
        const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIER_TXNS);
        return raw ? JSON.parse(raw) : [];
    },
    saveSupplierTxns(txns) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIER_TXNS, JSON.stringify(txns));
    },
    getSupplierTxnById(id) {
        return this.getSupplierTxns().find(t => t.id === id) || null;
    },
    addSupplierTxn(txn) {
        const txns = this.getSupplierTxns();
        if (!txn.id) txn.id = "stx-" + Date.now();
        txns.unshift(txn);
        this.saveSupplierTxns(txns);

        // Update supplier outstanding balance
        const sup = this.getSupplierById(txn.supplierId);
        if (sup) {
            if (txn.type === "PURCHASE") {
                sup.balance = (Number(sup.balance) || 0) + Number(txn.credit || 0);
            } else if (txn.type === "PAYMENT") {
                sup.balance = Math.max(0, (Number(sup.balance) || 0) - Number(txn.debit || 0));
            }
            this.saveSupplier(sup);
        }
        return txn;
    },
    updateSupplierTxn(txn) {
        const txns = this.getSupplierTxns();
        const idx = txns.findIndex(t => t.id === txn.id);
        if (idx !== -1) {
            txns[idx] = txn;
            this.saveSupplierTxns(txns);
            this.recalculateSupplierBalance(txn.supplierId);
            return txn;
        }
        return null;
    },
    deleteSupplierTxn(id) {
        const txns = this.getSupplierTxns();
        const txn = txns.find(t => t.id === id);
        const list = txns.filter(t => t.id !== id);
        this.saveSupplierTxns(list);
        if (txn && txn.supplierId) {
            this.recalculateSupplierBalance(txn.supplierId);
        }
    },
    recalculateSupplierBalance(supplierId) {
        const sup = this.getSupplierById(supplierId);
        if (!sup) return;
        const txns = this.getSupplierTxns().filter(t => t.supplierId === supplierId);
        let bal = 0;
        txns.forEach(t => {
            bal += Number(t.credit || 0) - Number(t.debit || 0);
        });
        sup.balance = Math.max(0, bal);
        this.saveSupplier(sup);
    },

    // Customers
    getCustomers() {
        const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        return raw ? JSON.parse(raw) : [];
    },
    saveCustomers(customers) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    },
    getCustomerById(id) {
        return this.getCustomers().find(c => c.id === id) || null;
    },
    saveCustomer(customer) {
        const list = this.getCustomers();
        if (!customer.id) {
            customer.id = "cust-" + Date.now();
            list.push(customer);
        } else {
            const idx = list.findIndex(c => c.id === customer.id);
            if (idx !== -1) list[idx] = customer;
            else list.push(customer);
        }
        this.saveCustomers(list);
        return customer;
    },
    deleteCustomer(id) {
        const list = this.getCustomers().filter(c => c.id !== id);
        this.saveCustomers(list);
    },

    // Purchases
    getPurchases() {
        const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        return raw ? JSON.parse(raw) : [];
    },
    savePurchases(purchases) {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    },
    getPurchaseById(id) {
        return this.getPurchases().find(p => p.id === id) || null;
    },
    savePurchase(purchase, isEdit = false) {
        const list = this.getPurchases();
        const oldPurchase = isEdit && purchase.id ? this.getPurchaseById(purchase.id) : null;

        if (!purchase.id) {
            purchase.id = "pur-" + Date.now();
            list.unshift(purchase);
        } else {
            const idx = list.findIndex(p => p.id === purchase.id);
            if (idx !== -1) list[idx] = purchase;
            else list.unshift(purchase);
        }

        // Revert previous stock if updating an existing purchase
        if (oldPurchase && Array.isArray(oldPurchase.items)) {
            oldPurchase.items.forEach(oldItem => {
                const oldQty = (Number(oldItem.qty) || 0) + (Number(oldItem.free) || 0);
                this.adjustStock(oldItem.product, oldItem.batch, -oldQty);
            });
        }

        // Add inward stock for items
        if (Array.isArray(purchase.items)) {
            purchase.items.forEach(item => {
                const qtyToAdd = (Number(item.qty) || 0) + (Number(item.free) || 0);
                this.adjustStock(item.product, item.batch, qtyToAdd);
            });
        }

        // Sync supplier transaction & balance
        if (purchase.supplierId) {
            const txns = this.getSupplierTxns();
            const existingTxn = txns.find(t => t.supplierId === purchase.supplierId && t.refNo === purchase.billNo && t.type === "PURCHASE");
            if (existingTxn) {
                existingTxn.date = purchase.date;
                existingTxn.credit = purchase.totalAmount;
                existingTxn.note = `Purchase Bill #${purchase.billNo}`;
                this.saveSupplierTxns(txns);
                this.recalculateSupplierBalance(purchase.supplierId);
            } else {
                this.addSupplierTxn({
                    supplierId: purchase.supplierId,
                    date: purchase.date,
                    type: "PURCHASE",
                    refNo: purchase.billNo,
                    debit: 0,
                    credit: purchase.totalAmount,
                    note: `Purchase Bill #${purchase.billNo}`
                });
            }
        }

        this.savePurchases(list);
        return purchase;
    },
    deletePurchase(id) {
        const pur = this.getPurchaseById(id);
        if (pur) {
            // Reverse inward stock
            if (Array.isArray(pur.items)) {
                pur.items.forEach(item => {
                    const qtyToRemove = (Number(item.qty) || 0) + (Number(item.free) || 0);
                    this.adjustStock(item.product, item.batch, -qtyToRemove);
                });
            }
            // Remove supplier transaction
            const txns = this.getSupplierTxns().filter(t => !(t.refNo === pur.billNo && t.type === "PURCHASE"));
            this.saveSupplierTxns(txns);
            if (pur.supplierId) {
                this.recalculateSupplierBalance(pur.supplierId);
            }
        }
        const list = this.getPurchases().filter(p => p.id !== id);
        this.savePurchases(list);
    },

    // Invoices (Billing)
    getInvoices() {
        const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
        return raw ? JSON.parse(raw) : [];
    },
    saveInvoices(invoices) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    },
    getInvoiceById(id) {
        return this.getInvoices().find(i => i.id === id) || null;
    },
    getNextInvoiceNumber() {
        const biz = this.getBusiness();
        const prefix = biz.invoicePrefix || "TH/2026-27-";
        const invoices = this.getInvoices();
        let maxSeq = 184;
        invoices.forEach(inv => {
            if (inv.invoiceNo) {
                const parts = inv.invoiceNo.split("-");
                const last = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(last) && last > maxSeq) {
                    maxSeq = last;
                }
            }
        });
        const nextSeq = String(maxSeq + 1).padStart(6, "0");
        return `${prefix}${nextSeq}`;
    },
    saveInvoice(invoice, isEdit = false) {
        const list = this.getInvoices();
        const oldInvoice = isEdit && invoice.id ? this.getInvoiceById(invoice.id) : null;

        if (!invoice.id) {
            invoice.id = "inv-" + Date.now();
            list.unshift(invoice);
        } else {
            const idx = list.findIndex(i => i.id === invoice.id);
            if (idx !== -1) list[idx] = invoice;
            else list.unshift(invoice);
        }

        // Revert old invoice stock deduction if editing
        if (oldInvoice && Array.isArray(oldInvoice.items)) {
            oldInvoice.items.forEach(oldItem => {
                const qtyToRestore = (Number(oldItem.qty) || 0) + (Number(oldItem.free) || 0);
                this.adjustStock(oldItem.product, oldItem.batch, qtyToRestore);
            });
        }

        // Deduct new items from inventory
        if (Array.isArray(invoice.items)) {
            invoice.items.forEach(item => {
                const qtyToDeduct = (Number(item.qty) || 0) + (Number(item.free) || 0);
                this.adjustStock(item.product, item.batch, -qtyToDeduct);
            });
        }

        this.saveInvoices(list);
        return invoice;
    },
    deleteInvoice(id) {
        const inv = this.getInvoiceById(id);
        if (inv && Array.isArray(inv.items)) {
            // Restore inventory stock when bill is deleted
            inv.items.forEach(item => {
                const qtyToRestore = (Number(item.qty) || 0) + (Number(item.free) || 0);
                this.adjustStock(item.product, item.batch, qtyToRestore);
            });
        }
        const list = this.getInvoices().filter(i => i.id !== id);
        this.saveInvoices(list);
    },

    // Dashboard Stats
    getDashboardStats() {
        const invoices = this.getInvoices();
        const purchases = this.getPurchases();
        const items = this.getItems();
        const suppliers = this.getSuppliers();
        const customers = this.getCustomers();

        const todayStr = new Date().toISOString().split("T")[0];

        let todaySales = 0;
        let totalSales = 0;
        invoices.forEach(inv => {
            const amt = Number(inv.netAmount) || 0;
            totalSales += amt;
            if (inv.invoiceDate === todayStr) {
                todaySales += amt;
            }
        });

        let todayPurchases = 0;
        let totalPurchases = 0;
        purchases.forEach(pur => {
            const amt = Number(pur.totalAmount) || 0;
            totalPurchases += amt;
            if (pur.date === todayStr) {
                todayPurchases += amt;
            }
        });

        let totalStockQty = 0;
        let totalStockValue = 0;
        const lowStockItems = [];
        const nearExpiryItems = [];

        const currDate = new Date();
        const currYear = currDate.getFullYear() % 100;
        const currMonth = currDate.getMonth() + 1;

        items.forEach(item => {
            const qty = Number(item.stock) || 0;
            const rate = Number(item.rate) || 0;
            totalStockQty += qty;
            totalStockValue += qty * rate;

            if (qty <= 10) {
                lowStockItems.push(item);
            }

            if (item.expiry && item.expiry.includes("/")) {
                const parts = item.expiry.split("/");
                const expMonth = parseInt(parts[0], 10);
                const expYear = parseInt(parts[1], 10);
                if (!isNaN(expMonth) && !isNaN(expYear)) {
                    const diffMonths = (expYear - currYear) * 12 + (expMonth - currMonth);
                    if (diffMonths <= 3) {
                        nearExpiryItems.push({ ...item, diffMonths });
                    }
                }
            }
        });

        let supplierOutstanding = suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);

        return {
            todaySales,
            totalSales,
            todayPurchases,
            totalPurchases,
            totalStockQty,
            totalStockValue,
            lowStockItems,
            nearExpiryItems,
            supplierOutstanding,
            totalInvoicesCount: invoices.length,
            totalPurchasesCount: purchases.length,
            totalItemsCount: items.length,
            totalSuppliersCount: suppliers.length,
            totalCustomersCount: customers.length,
            recentInvoices: invoices.slice(0, 5),
            recentPurchases: purchases.slice(0, 5)
        };
    },

    // ==========================================
    // BACKUP, RESTORE & DATA EXPORT (JSON & CSV)
    // ==========================================
    exportAllDataJSON() {
        const fullBackup = {
            exportDate: new Date().toISOString(),
            app: "THIRAN - Medical Billing & Pharmacy Suite",
            version: "2.0",
            business: this.getBusiness(),
            items: this.getItems(),
            suppliers: this.getSuppliers(),
            supplierTxns: this.getSupplierTxns(),
            customers: this.getCustomers(),
            purchases: this.getPurchases(),
            invoices: this.getInvoices()
        };
        return JSON.stringify(fullBackup, null, 2);
    },

    importAllDataJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.business) this.saveBusiness(data.business);
            if (Array.isArray(data.items)) this.saveItems(data.items);
            if (Array.isArray(data.suppliers)) this.saveSuppliers(data.suppliers);
            if (Array.isArray(data.supplierTxns)) this.saveSupplierTxns(data.supplierTxns);
            if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
            if (Array.isArray(data.purchases)) this.savePurchases(data.purchases);
            if (Array.isArray(data.invoices)) this.saveInvoices(data.invoices);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    // CSV Helper: escape cell content
    escapeCsvCell(str) {
        if (str == null) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
    },

    exportInvoicesCSV() {
        const invoices = this.getInvoices();
        const headers = ["Invoice No", "Date", "Customer Name", "Mobile", "Payment Type", "Tax Type", "Subtotal (₹)", "CGST (₹)", "SGST (₹)", "Round Off", "Net Amount (₹)"];
        const rows = invoices.map(inv => [
            this.escapeCsvCell(inv.invoiceNo),
            this.escapeCsvCell(inv.invoiceDate),
            this.escapeCsvCell(inv.customer ? inv.customer.name : "Counter Patient"),
            this.escapeCsvCell(inv.customer ? (inv.customer.mobile || "") : ""),
            this.escapeCsvCell(inv.paymentType || "CASH"),
            this.escapeCsvCell(inv.taxType || "INTRA STATE"),
            Number(inv.subtotal || 0).toFixed(2),
            Number(inv.cgst || 0).toFixed(2),
            Number(inv.sgst || 0).toFixed(2),
            Number(inv.roundOff || 0).toFixed(2),
            Number(inv.netAmount || 0).toFixed(2)
        ].join(","));
        return [headers.join(","), ...rows].join("\r\n");
    },

    exportItemsCSV() {
        const items = this.getItems();
        const headers = ["Medicine Name", "HSN", "Pack", "Batch", "Expiry", "MRP (₹)", "Purchase Rate (₹)", "Selling Rate (₹)", "GST %", "Current Stock", "Min Stock"];
        const rows = items.map(i => [
            this.escapeCsvCell(i.name),
            this.escapeCsvCell(i.hsn || "3004"),
            this.escapeCsvCell(i.pack || ""),
            this.escapeCsvCell(i.batch || ""),
            this.escapeCsvCell(i.expiry || ""),
            Number(i.mrp || 0).toFixed(2),
            Number(i.purchaseRate || 0).toFixed(2),
            Number(i.rate || 0).toFixed(2),
            Number(i.gstPercent || 0),
            Number(i.stock || 0),
            Number(i.minStock || 10)
        ].join(","));
        return [headers.join(","), ...rows].join("\r\n");
    },

    exportPurchasesCSV() {
        const purchases = this.getPurchases();
        const headers = ["Bill No", "Date", "Supplier Name", "Items Count", "Tax Type", "Payment Type", "Total Amount (₹)"];
        const rows = purchases.map(p => [
            this.escapeCsvCell(p.billNo),
            this.escapeCsvCell(p.date),
            this.escapeCsvCell(p.supplierName || ""),
            p.items ? p.items.length : 0,
            this.escapeCsvCell(p.taxType || "INTRA STATE"),
            this.escapeCsvCell(p.paymentType || "CREDIT"),
            Number(p.totalAmount || 0).toFixed(2)
        ].join(","));
        return [headers.join(","), ...rows].join("\r\n");
    },

    resetDefaults() {
        this.saveBusiness(DEFAULT_PHARMA_BUSINESS);
        this.saveItems(DEFAULT_PHARMA_ITEMS);
        this.saveSuppliers(DEFAULT_PHARMA_SUPPLIERS);
        this.saveSupplierTxns(DEFAULT_PHARMA_SUPPLIER_TXNS);
        this.saveCustomers(DEFAULT_PHARMA_CUSTOMERS);
        this.savePurchases(DEFAULT_PHARMA_PURCHASES);
        this.saveInvoices(DEFAULT_PHARMA_INVOICES);
    }
};
