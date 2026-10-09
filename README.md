# THIRAN - Medical Billing & Pharmacy Suite

A dedicated, specialized pharmaceutical and medical billing software with clean, uncluttered layout and typography.

---

## 🚀 How to Run

- **1-Click Launcher**: Double-click **`run.bat`** in `d:\billing-software\`
- **Direct Browser Access**: Double-click **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox)

---

## 🏥 Key Features & Architecture

### 1. 📝 Billing (Point of Sale)
- **Live Autocomplete Customer Entry**: Search existing patients/clinics by name or mobile number; auto-populates Doctor Reg No, GSTIN, DL No, and address.
- **Direct Medicine Search & Barcode/Batch Add**: Instant suggestions from catalog with stock status and rates. Pressing Enter adds the item directly to bill.
- **Tendered Cash & Change Calculator**: Real-time change return calculator when cashier enters patient cash amount (e.g., ₹500 note).
- **Auto-Advancing Invoice Numbers**: Uses customizable store prefix (e.g., `TH/2026-27-000185`).
- **Save & Print Hotkeys**: Press `Ctrl+S` to save and trigger print modal; `F2` to add empty row.

### 2. 🖨️ Dual Print Modes (A4 Tax Invoice & 80mm Thermal Slip)
- **Standard A4 Tax Invoice**: Complete GST compliant B2B/B2C invoice with HSN breakup, CGST/SGST (or IGST for Inter-State), net amount in words, bank details for wire transfers, and pharmacy terms & conditions.
- **80mm Thermal POS Receipt**: Compact, fast-printing 3-inch slip formatted specifically for POS thermal roll printers with custom pharmacy header, items, totals, and "Get Well Soon" greeting.
- **Instant Mode Switch**: Switch seamlessly between A4 and Thermal preview before printing.

### 3. 🛒 Purchase (Stock Inward)
- **Supplier Autocomplete**: Type supplier name; automatically suggests registered distributors and loads GST, DL No, and opening balance.
- **Medicine Catalog Autocomplete**: When entering inward items, typing medicine name auto-fills HSN, pack size, default purchase rate, selling rate, and GST%.
- **Automatic Stock Tracking**: Inward purchases automatically update inventory quantities.
- **Keyboard Shortcuts**: `F2` to add row, `F4` to save purchase inward bill, `Esc` to reset.

### 4. 📦 Inventory & Medicine Catalog
- **Multi-Rate Tracking**: Track MRP, Purchase Rate, and Selling Rate side-by-side with GST%.
- **Status Filter Pills**: Quick filter by **All**, **Low Stock** (≤ 10 units), and **Near Expiry** (expiring within 3 months).
- **Live Search**: Instant keyword search across medicine names, HSN codes, and batch numbers.
- **Add & Edit Modal (`F2`)**: Full modal to add or edit medicines with batch, expiry (MM/YY), min stock, and GST rate.

### 5. ✏️ Edit & Stock Reversal Everywhere
- **Accurate Stock Reversals**: Deleting or editing past sales invoices or purchase bills automatically reverses and recalculates warehouse inventory to prevent discrepancy.
- **Edit Invoices**: Load past invoices back into billing screen to edit items, rates, or customer info.
- **Edit Purchases**: Modify past inward bills and recalculate supplier balances automatically.
- **Edit Supplier Transactions**: Edit payment dates, reference numbers, and modes.

### 6. ⚙️ Store & GST Profile Settings
- Accessible via the **⚙️ Settings** button in the top banner.
- Configure Pharmacy Name, GSTIN, Drug Licence (DL 20B/21B), Phone, Email, Address, and Invoice Prefix.
- Configure Bank Account Details (Bank Name, A/C No, IFSC, Branch) to appear on printed B2B invoices.
- Configure custom invoice terms and conditions.

### 7. 💾 Backup, Restore & CSV Exports
- Accessible via the **💾 Data Backup** button in the top banner.
- **Full JSON Backup**: Download a complete, timestamped backup file of your entire database.
- **JSON Restore**: Upload and restore previous backups with 1-click.
- **CSV Spreadsheets**: Export clean CSV files for:
  - Sales Invoices
  - Medicine Catalog & Stock Valuation
  - Inward Purchases

### 8. 📊 Pharmacy Dashboard
- Real-time KPIs: Today's Sales, Cumulative Sales, Total Stock Valuation, Total Stock Units, and Supplier Outstanding Balance.
- Interactive tables for **Near Expiry Alert** and **Low Stock Alert** with direct 1-click reorder navigation.
- Global search across all invoices, medicines, and distributors.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Context | Action |
|---|---|---|
| **F2** | Items Catalog | Open Add Medicine Modal |
| **F2** | Billing Screen | Add New Item Row |
| **F2** | Purchase Screen | Add New Item Row |
| **F4** | Purchase Screen | Save Purchase Bill |
| **Ctrl + S** | Billing Screen | Save & Print Invoice |
| **Ctrl + P** | Invoice Preview | Print Invoice / Thermal Slip |
| **Escape** | Anywhere | Close Open Modal / Reset Form |

---

## 📁 File Structure

- **`index.html`**: Main single-page application structure, modals, and tab panels.
- **`style.css`**: Complete design system, typography (Plus Jakarta Sans), responsive layouts, and print stylesheets.
- **`apps.js`**: Core application controller, live search, keyboard shortcuts, tender calculator, and modal managers.
- **`store.js`**: Data persistence layer in `localStorage`, stock adjustment engines, JSON backup/restore, and CSV exporters.
- **`invoices.js`**: A4 tax invoice and 80mm thermal receipt generators with number-to-words conversion.
- **`sample-data.js`**: Default pharmaceutical business profile, distributors, clinics, and medicine items.
- **`run.bat`**: Windows desktop 1-click launcher.
