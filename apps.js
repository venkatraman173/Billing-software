/**
 * THIRAN - Medical Billing & Pharmacy Suite Controller
 */

const App = {
    activeTab: "billing",
    billingRowCounter: 0,
    purchaseRowCounter: 0,
    editingInvoiceId: null,
    editingPurchaseId: null,
    itemsFilterStatus: "all",
    previewMode: "A4",
    currentPreviewInvoice: null,

    init() {
        Store.init();
        this.updateBrandHeader();
        this.startClock();
        this.bindNavigation();
        this.bindGlobalShortcuts();
        this.bindLiveSearchFilters();
        this.initBillingScreen();
        this.initPurchaseScreen();
        this.navigate("billing");
    },

    // Dynamic brand elements in top banner
    updateBrandHeader() {
        const biz = Store.getBusiness();
        const brandNameEl = document.getElementById("top-brand-name");
        const brandGstEl = document.getElementById("top-brand-gst");
        const brandEmailEl = document.getElementById("top-user-email");
        if (brandNameEl) brandNameEl.textContent = biz.name || "THIRAN";
        if (brandGstEl) brandGstEl.textContent = `GST: ${biz.gstNumber || '-'}`;
        if (brandEmailEl) brandEmailEl.textContent = biz.email || "thiranpharma@gmail.com";
    },

    // Live Clock & Date matching top bar
    startClock() {
        const updateTime = () => {
            const now = new Date();
            const dateEl = document.getElementById("live-date");
            const timeEl = document.getElementById("live-time");
            if (dateEl && timeEl) {
                const d = now.getDate();
                const m = now.getMonth() + 1;
                const y = now.getFullYear();
                dateEl.textContent = `Date: ${d}/${m}/${y}`;

                let hours = now.getHours();
                const minutes = String(now.getMinutes()).padStart(2, "0");
                const seconds = String(now.getSeconds()).padStart(2, "0");
                const ampm = hours >= 12 ? "pm" : "am";
                hours = hours % 12;
                hours = hours ? hours : 12;
                timeEl.textContent = `Time: ${hours}:${minutes}:${seconds} ${ampm}`;
            }
        };
        updateTime();
        setInterval(updateTime, 1000);
    },

    // Navigation between the 9 tabs
    bindNavigation() {
        document.querySelectorAll(".nav-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                this.navigate(tab);
            });
        });
    },

    // Global hotkeys (F2, F4, Esc for Purchase & Billing & Items, Ctrl+S for Billing)
    bindGlobalShortcuts() {
        window.addEventListener("keydown", (e) => {
            // Escape key dismisses modals first
            const activeModal = document.querySelector(".modal-overlay.active");
            if (e.key === "Escape") {
                if (activeModal) {
                    e.preventDefault();
                    this.closeAllModals();
                    return;
                }
                if (this.activeTab === "purchase") {
                    e.preventDefault();
                    this.resetPurchaseForm();
                } else if (this.activeTab === "billing") {
                    e.preventDefault();
                    this.clearBillingForm();
                }
            }

            if (this.activeTab === "purchase") {
                if (e.key === "F2") {
                    e.preventDefault();
                    this.addManualPurchaseRow();
                } else if (e.key === "F4") {
                    e.preventDefault();
                    this.savePurchaseBill();
                }
            } else if (this.activeTab === "billing") {
                if (e.key === "F2") {
                    e.preventDefault();
                    this.addManualBillingRow();
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                    e.preventDefault();
                    this.saveAndPrintBill();
                }
            } else if (this.activeTab === "items") {
                if (e.key === "F2") {
                    e.preventDefault();
                    this.openItemModal();
                }
            }
        });
    },

    // Attach live search filters across list pages
    bindLiveSearchFilters() {
        const itemsSearch = document.getElementById("items-search-input");
        if (itemsSearch) {
            itemsSearch.addEventListener("input", () => this.renderItemsList());
        }

        const custSearch = document.getElementById("customers-search-input");
        if (custSearch) {
            custSearch.addEventListener("input", () => this.renderCustomersList());
        }

        const supSearch = document.getElementById("suppliers-search-input");
        if (supSearch) {
            supSearch.addEventListener("input", () => this.renderSuppliersList());
        }

        const purHistorySearch = document.getElementById("pur-history-search");
        if (purHistorySearch) {
            purHistorySearch.addEventListener("input", () => this.renderPurchaseHistory());
        }

        const invHistorySearch = document.getElementById("invoice-history-search");
        if (invHistorySearch) {
            invHistorySearch.addEventListener("input", () => this.renderInvoiceHistory());
        }
    },

    navigate(tabId) {
        this.activeTab = tabId;

        document.querySelectorAll(".nav-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        document.querySelectorAll(".tab-content-panel").forEach(panel => {
            panel.style.display = panel.id === `tab-${tabId}` ? "block" : "none";
        });

        if (tabId === "billing" && !this.editingInvoiceId) this.refreshBillingMeta();
        if (tabId === "purchase" && !this.editingPurchaseId) this.refreshPurchaseMeta();
        if (tabId === "purchase-history") this.renderPurchaseHistory();
        if (tabId === "items") this.renderItemsList();
        if (tabId === "suppliers") this.renderSuppliersList();
        if (tabId === "supplier-history") this.renderSupplierHistory();
        if (tabId === "customers") this.renderCustomersList();
        if (tabId === "invoice-history") this.renderInvoiceHistory();
        if (tabId === "dashboard") this.renderDashboard();
    },

    // Toast notification
    showToast(message, isSuccess = true) {
        const toast = document.getElementById("toast-box");
        if (!toast) return;
        toast.innerHTML = `<span>${isSuccess ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
        toast.style.display = "flex";
        toast.style.backgroundColor = isSuccess ? "#166534" : "#0f172a";

        setTimeout(() => {
            toast.style.display = "none";
        }, 3000);
    },

    closeAllModals() {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    },
    openModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("active");
    },

    /* ==========================================================================
       1. BILLING PAGE LOGIC
       ========================================================================== */
    initBillingScreen() {
        this.refreshBillingMeta();
        this.clearBillingForm();

        // Customer Autocomplete on Type
        const custInput = document.getElementById("bill-cust-name");
        const custDropdown = document.getElementById("cust-autocomplete-list");

        custInput.addEventListener("input", () => {
            const q = custInput.value.toLowerCase().trim();
            if (!q) {
                custDropdown.style.display = "none";
                return;
            }
            const customers = Store.getCustomers().filter(c =>
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.mobile && c.mobile.includes(q))
            );
            if (customers.length === 0) {
                custDropdown.style.display = "none";
                return;
            }
            custDropdown.innerHTML = customers.map(c => `
        <div class="autocomplete-item" onclick="App.selectBillingCustomer('${c.id}')">
          <div><strong>${c.name}</strong> <span style="color:#64748b; font-size:11px;">(${c.mobile || 'No Mobile'})</span></div>
          <div style="font-size:11px; color:#94a3b8;">${c.doctorReg ? `Reg: ${c.doctorReg}` : ''}</div>
        </div>
      `).join("");
            custDropdown.style.display = "block";
        });

        document.addEventListener("click", (e) => {
            if (!custInput.contains(e.target) && !custDropdown.contains(e.target)) {
                custDropdown.style.display = "none";
            }
        });

        // Product Autocomplete on Type
        const prodInput = document.getElementById("bill-product-search");
        const prodDropdown = document.getElementById("product-autocomplete-list");

        prodInput.addEventListener("input", () => {
            const q = prodInput.value.toLowerCase().trim();
            if (!q) {
                prodDropdown.style.display = "none";
                return;
            }
            const items = Store.getItems().filter(item =>
                (item.name && item.name.toLowerCase().includes(q)) ||
                (item.batch && item.batch.toLowerCase().includes(q))
            );
            if (items.length === 0) {
                prodDropdown.style.display = "none";
                return;
            }
            prodDropdown.innerHTML = items.map(item => `
        <div class="autocomplete-item" onclick="App.addBillingItemFromCatalog('${item.id}')">
          <div>
            <strong>${item.name}</strong>
            <span style="font-size:11px; color:#64748b; margin-left:6px;">Batch: ${item.batch} | Exp: ${item.expiry} | Pack: ${item.pack}</span>
          </div>
          <div style="text-align:right;">
            <strong>₹${item.rate.toFixed(2)}</strong>
            <div style="font-size:10.5px; color:${item.stock <= 10 ? '#dc2626' : '#166534'};">Stock: ${item.stock}</div>
          </div>
        </div>
      `).join("");
            prodDropdown.style.display = "block";
        });

        prodInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const first = prodDropdown.querySelector(".autocomplete-item");
                if (first) {
                    first.click();
                } else if (prodInput.value.trim()) {
                    App.addManualBillingRow({
                        product: prodInput.value.trim(),
                        hsn: "3004",
                        pack: "10's",
                        batch: "B" + Math.floor(100 + Math.random() * 900),
                        expiry: "12/27",
                        qty: 1,
                        free: 0,
                        mrp: 0,
                        rate: 0,
                        gstPercent: 12
                    });
                    prodInput.value = "";
                    prodDropdown.style.display = "none";
                }
            }
        });

        document.addEventListener("click", (e) => {
            if (!prodInput.contains(e.target) && !prodDropdown.contains(e.target)) {
                prodDropdown.style.display = "none";
            }
        });
    },

    refreshBillingMeta() {
        if (!this.editingInvoiceId) {
            document.getElementById("bill-inv-no").value = Store.getNextInvoiceNumber();
            const today = new Date().toISOString().split("T")[0];
            document.getElementById("bill-inv-date").value = today;
            document.getElementById("bill-save-btn").textContent = "Save & Print Bill";
        }
    },

    selectBillingCustomer(customerId) {
        const c = Store.getCustomerById(customerId);
        if (!c) return;
        document.getElementById("bill-cust-name").value = c.name;
        document.getElementById("bill-cust-mobile").value = c.mobile || "";
        document.getElementById("bill-cust-docreg").value = c.doctorReg || "";
        document.getElementById("bill-cust-gst").value = c.gstNumber || "";
        document.getElementById("bill-cust-dlno").value = c.dlNo || "";
        document.getElementById("bill-cust-address").value = c.address || "";
        document.getElementById("cust-autocomplete-list").style.display = "none";
    },

    addBillingItemFromCatalog(itemId) {
        const item = Store.getItemById(itemId);
        if (!item) return;

        this.addManualBillingRow({
            product: item.name,
            hsn: item.hsn || "3004",
            pack: item.pack || "",
            batch: item.batch || "",
            expiry: item.expiry || "",
            qty: 1,
            free: 0,
            mrp: item.mrp || 0,
            rate: item.rate || 0,
            gstPercent: item.gstPercent || 12
        });

        document.getElementById("bill-product-search").value = "";
        document.getElementById("product-autocomplete-list").style.display = "none";
        document.getElementById("bill-product-search").focus();
    },

    addManualBillingRow(data = null) {
        this.billingRowCounter++;
        const tbody = document.getElementById("billing-items-tbody");
        const rowId = `bill-row-${this.billingRowCounter}`;

        const tr = document.createElement("tr");
        tr.id = rowId;

        tr.innerHTML = `
      <td style="text-align: center; font-weight: bold;" class="row-sl">1</td>
      <td>
        <input type="text" class="row-prod" value="${data ? data.product : ''}" placeholder="Medicine name" required>
      </td>
      <td><input type="text" class="row-hsn" value="${data ? data.hsn : '3004'}" placeholder="3004"></td>
      <td><input type="text" class="row-pack" value="${data ? data.pack : ''}" placeholder="10's"></td>
      <td><input type="text" class="row-batch" value="${data ? data.batch : ''}" placeholder="Batch"></td>
      <td><input type="text" class="row-expiry" value="${data ? data.expiry : ''}" placeholder="MM/YY"></td>
      <td><input type="number" class="row-qty" value="${data ? data.qty : '1'}" min="1" step="1" style="text-align: center; font-weight: bold;"></td>
      <td><input type="number" class="row-free" value="${data ? data.free : '0'}" min="0" step="1" style="text-align: center;"></td>
      <td><input type="number" class="row-mrp" value="${data ? data.mrp : '0.00'}" step="0.01" style="text-align: right;"></td>
      <td><input type="number" class="row-rate" value="${data ? data.rate : '0.00'}" step="0.01" style="text-align: right; font-weight: bold;"></td>
      <td><input type="number" class="row-gst" value="${data ? data.gstPercent : '12'}" step="0.5" style="text-align: center;"></td>
      <td style="text-align: right; font-weight: bold;" class="row-amount">₹0.00</td>
      <td style="text-align: center;">
        <button type="button" class="delete-row-btn" onclick="App.removeBillingRow('${rowId}')">&times;</button>
      </td>
    `;

        tbody.appendChild(tr);

        tr.querySelectorAll("input").forEach(input => {
            input.addEventListener("input", () => this.recalculateBillingSummary());
        });

        this.updateBillingRowNumbers();
        this.recalculateBillingSummary();
    },

    removeBillingRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
            this.updateBillingRowNumbers();
            this.recalculateBillingSummary();
        }
    },

    updateBillingRowNumbers() {
        const tbody = document.getElementById("billing-items-tbody");
        const rows = tbody.querySelectorAll("tr");
        rows.forEach((tr, index) => {
            const sl = tr.querySelector(".row-sl");
            if (sl) sl.textContent = index + 1;
        });
    },

    recalculateBillingSummary() {
        const tbody = document.getElementById("billing-items-tbody");
        const rows = tbody.querySelectorAll("tr");

        let totalItems = 0;
        let totalQty = 0;
        let subtotal = 0;
        let totalGst = 0;

        rows.forEach(tr => {
            const prod = tr.querySelector(".row-prod")?.value.trim();
            const qty = parseFloat(tr.querySelector(".row-qty")?.value) || 0;
            const rate = parseFloat(tr.querySelector(".row-rate")?.value) || 0;
            const gst = parseFloat(tr.querySelector(".row-gst")?.value) || 0;

            if (prod && qty > 0) {
                totalItems++;
                totalQty += qty;
                const lineBase = qty * rate;
                const lineGst = lineBase * (gst / 100);
                const lineTotal = lineBase + lineGst;

                subtotal += lineBase;
                totalGst += lineGst;

                const amtCol = tr.querySelector(".row-amount");
                if (amtCol) amtCol.textContent = `₹${lineTotal.toFixed(2)}`;
            }
        });

        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        const grossTotal = subtotal + totalGst;
        const roundedNet = Math.round(grossTotal);
        const roundOff = roundedNet - grossTotal;

        document.getElementById("bill-total-items-count").textContent = totalItems;
        document.getElementById("bill-total-qty").textContent = totalQty;
        document.getElementById("bill-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById("bill-cgst").textContent = `₹${cgst.toFixed(2)}`;
        document.getElementById("bill-sgst").textContent = `₹${sgst.toFixed(2)}`;
        document.getElementById("bill-round-off").textContent = roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2);
        document.getElementById("bill-net-amount").textContent = `₹${roundedNet.toFixed(2)}`;
        this.calculateChangeReturn();
    },

    clearBillingForm() {
        this.editingInvoiceId = null;
        document.getElementById("bill-cust-name").value = "";
        document.getElementById("bill-cust-mobile").value = "";
        document.getElementById("bill-cust-docreg").value = "";
        document.getElementById("bill-cust-gst").value = "";
        document.getElementById("bill-cust-dlno").value = "";
        document.getElementById("bill-cust-address").value = "";
        document.getElementById("bill-party-order").value = "--";
        document.getElementById("bill-order-date").value = "--";
        document.getElementById("bill-dispatched-through").value = "Counter";
        document.getElementById("bill-lr-rr-no").value = "";
        document.getElementById("bill-lr-rr-date").value = "";
        document.getElementById("bill-save-btn").textContent = "Save & Print Bill";

        const tenderedInput = document.getElementById("bill-cash-tendered");
        if (tenderedInput) tenderedInput.value = "";
        const changeReturnEl = document.getElementById("bill-change-return");
        if (changeReturnEl) changeReturnEl.textContent = "₹0.00";

        const tbody = document.getElementById("billing-items-tbody");
        tbody.innerHTML = "";
        this.refreshBillingMeta();
    },

    // Edit Existing Invoice
    editInvoice(id) {
        const inv = Store.getInvoiceById(id);
        if (!inv) return;

        this.editingInvoiceId = id;
        this.navigate("billing");

        document.getElementById("bill-inv-no").value = inv.invoiceNo;
        document.getElementById("bill-inv-date").value = inv.invoiceDate;
        document.getElementById("bill-tax-type").value = inv.taxType || "INTRA STATE";
        document.getElementById("bill-payment-type").value = inv.paymentType || "CASH";
        document.getElementById("bill-party-order").value = inv.partyOrderNo || "--";
        document.getElementById("bill-order-date").value = inv.orderDate || "--";
        document.getElementById("bill-dispatched-through").value = inv.dispatchedThrough || "Counter";
        document.getElementById("bill-lr-rr-no").value = inv.lrRrNo || "";
        document.getElementById("bill-lr-rr-date").value = inv.lrRrDate || "";

        const c = inv.customer || {};
        document.getElementById("bill-cust-name").value = c.name || "";
        document.getElementById("bill-cust-mobile").value = c.mobile || "";
        document.getElementById("bill-cust-docreg").value = c.doctorReg || "";
        document.getElementById("bill-cust-gst").value = c.gstNumber || "";
        document.getElementById("bill-cust-dlno").value = c.dlNo || "";
        document.getElementById("bill-cust-address").value = c.address || "";

        const tbody = document.getElementById("billing-items-tbody");
        tbody.innerHTML = "";
        if (inv.items && inv.items.length > 0) {
            inv.items.forEach(item => this.addManualBillingRow(item));
        } else {
            this.addManualBillingRow();
        }

        document.getElementById("bill-save-btn").textContent = "Update & Print Bill";
        this.recalculateBillingSummary();
        this.showToast(`Editing Invoice ${inv.invoiceNo}`, false);
    },

    saveAndPrintBill() {
        const invNo = document.getElementById("bill-inv-no").value.trim();
        const invDate = document.getElementById("bill-inv-date").value;
        const taxType = document.getElementById("bill-tax-type").value;
        const paymentType = document.getElementById("bill-payment-type").value;
        const partyOrderNo = document.getElementById("bill-party-order").value.trim();
        const orderDate = document.getElementById("bill-order-date").value.trim();
        const dispatchedThrough = document.getElementById("bill-dispatched-through").value.trim();
        const lrRrNo = document.getElementById("bill-lr-rr-no").value.trim();
        const lrRrDate = document.getElementById("bill-lr-rr-date").value;

        const customer = {
            name: document.getElementById("bill-cust-name").value.trim() || "Counter Patient",
            mobile: document.getElementById("bill-cust-mobile").value.trim(),
            doctorReg: document.getElementById("bill-cust-docreg").value.trim(),
            gstNumber: document.getElementById("bill-cust-gst").value.trim(),
            dlNo: document.getElementById("bill-cust-dlno").value.trim(),
            address: document.getElementById("bill-cust-address").value.trim()
        };

        const tbody = document.getElementById("billing-items-tbody");
        const rows = tbody.querySelectorAll("tr");
        const items = [];

        let subtotal = 0;
        let totalGst = 0;

        rows.forEach((tr, index) => {
            const prod = tr.querySelector(".row-prod")?.value.trim();
            const hsn = tr.querySelector(".row-hsn")?.value.trim() || "3004";
            const pack = tr.querySelector(".row-pack")?.value.trim() || "";
            const batch = tr.querySelector(".row-batch")?.value.trim() || "";
            const expiry = tr.querySelector(".row-expiry")?.value.trim() || "";
            const qty = parseFloat(tr.querySelector(".row-qty")?.value) || 0;
            const free = parseFloat(tr.querySelector(".row-free")?.value) || 0;
            const mrp = parseFloat(tr.querySelector(".row-mrp")?.value) || 0;
            const rate = parseFloat(tr.querySelector(".row-rate")?.value) || 0;
            const gstPercent = parseFloat(tr.querySelector(".row-gst")?.value) || 0;

            if (prod && qty > 0) {
                const lineBase = qty * rate;
                const lineGst = lineBase * (gstPercent / 100);
                const amount = lineBase + lineGst;

                subtotal += lineBase;
                totalGst += lineGst;

                items.push({
                    sl: index + 1,
                    product: prod,
                    hsn,
                    pack,
                    batch,
                    expiry,
                    qty,
                    free,
                    mrp,
                    rate,
                    gstPercent,
                    amount
                });
            }
        });

        if (items.length === 0) {
            alert("Please enter at least one product with name, quantity, and rate.");
            return;
        }

        const cgst = totalGst / 2;
        const sgst = totalGst / 2;
        const grossTotal = subtotal + totalGst;
        const netAmount = Math.round(grossTotal);
        const roundOff = netAmount - grossTotal;

        const isEdit = !!this.editingInvoiceId;
        const invoiceData = {
            id: this.editingInvoiceId || ("inv-" + Date.now()),
            invoiceNo: invNo,
            invoiceDate: invDate,
            taxType,
            paymentType,
            partyOrderNo,
            orderDate,
            dispatchedThrough,
            lrRrNo,
            lrRrDate,
            customer,
            items,
            subtotal,
            cgst,
            sgst,
            taxAmount: totalGst,
            roundOff,
            netAmount,
            status: "PAID"
        };

        Store.saveInvoice(invoiceData, isEdit);

        if (customer.name && customer.name !== "Counter Patient") {
            const existing = Store.getCustomers().find(c => c.name.toLowerCase() === customer.name.toLowerCase());
            if (!existing) {
                Store.saveCustomer(customer);
            }
        }

        this.showToast(isEdit ? `Invoice ${invNo} updated successfully!` : `Invoice ${invNo} saved successfully!`);

        this.currentPreviewInvoice = invoiceData;
        this.updateInvoicePreviewRender();
        document.getElementById("preview-modal-title").textContent = `Invoice ${invNo} - Print Preview`;

        this.openModal("modal-invoice-preview");
        this.clearBillingForm();
    },

    /* ==========================================================================
       2. PURCHASE PAGE LOGIC (Exact Content & Layout Matching Attached Images)
       ========================================================================== */
    initPurchaseScreen() {
        this.refreshPurchaseMeta();

        // Type to search suppliers (a-z)... with Autocomplete
        const supInput = document.getElementById("pur-supplier-input");
        const supDropdown = document.getElementById("pur-supplier-autocomplete");

        supInput.addEventListener("input", () => {
            const q = supInput.value.toLowerCase().trim();
            if (!q) {
                supDropdown.style.display = "none";
                document.getElementById("pur-supplier-gst").value = "";
                document.getElementById("pur-supplier-dlno").value = "";
                document.getElementById("pur-supplier-phone").value = "";
                document.getElementById("pur-supplier-address").value = "";
                return;
            }
            const suppliers = Store.getSuppliers().filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.phone && s.phone.includes(q))
            );
            if (suppliers.length === 0) {
                supDropdown.style.display = "none";
                return;
            }
            supDropdown.innerHTML = suppliers.map(s => `
        <div class="autocomplete-item" onclick="App.selectPurchaseSupplier('${s.id}')">
          <div><strong>${s.name}</strong> <span style="color:#64748b; font-size:11px;">(${s.phone || 'No Phone'})</span></div>
          <div style="font-size:11px; color:#94a3b8;">${s.gstNumber || ''}</div>
        </div>
      `).join("");
            supDropdown.style.display = "block";
        });

        document.addEventListener("click", (e) => {
            if (!supInput.contains(e.target) && !supDropdown.contains(e.target)) {
                supDropdown.style.display = "none";
            }
        });

        this.resetPurchaseForm();
    },

    selectPurchaseSupplier(supplierId) {
        const s = Store.getSupplierById(supplierId);
        if (!s) return;
        document.getElementById("pur-supplier-input").value = s.name;
        document.getElementById("pur-supplier-gst").value = s.gstNumber || "";
        document.getElementById("pur-supplier-dlno").value = s.dlNo || "";
        document.getElementById("pur-supplier-phone").value = s.phone || "";
        document.getElementById("pur-supplier-address").value = s.address || "";
        document.getElementById("pur-supplier-autocomplete").style.display = "none";
    },

    refreshPurchaseMeta() {
        if (!this.editingPurchaseId) {
            document.getElementById("pur-bill-no").value = "";
            const today = new Date().toISOString().split("T")[0];
            document.getElementById("pur-bill-date").value = today;
        }
    },

    addManualPurchaseRow(data = null) {
        this.purchaseRowCounter++;
        const tbody = document.getElementById("purchase-items-tbody");
        const rowId = `pur-row-${this.purchaseRowCounter}`;

        const tr = document.createElement("tr");
        tr.id = rowId;

        tr.innerHTML = `
      <td style="text-align: center; font-weight: bold;" class="p-row-sl">1</td>
      <td><input type="text" class="p-row-prod" value="${data ? data.product : ''}" placeholder="Medicine" required></td>
      <td><input type="text" class="p-row-hsn" value="${data ? data.hsn : '3004'}" placeholder="3004"></td>
      <td><input type="text" class="p-row-batch" value="${data ? data.batch : ''}" placeholder="Batch"></td>
      <td><input type="text" class="p-row-exp" value="${data ? data.expiry : ''}" placeholder="MM/YY"></td>
      <td><input type="number" class="p-row-qty" value="${data ? data.qty : '1'}" min="1" step="1" style="text-align: center; font-weight: bold;"></td>
      <td><input type="number" class="p-row-free" value="${data ? data.free : '0'}" min="0" step="1" style="text-align: center;"></td>
      <td><input type="number" class="p-row-mrp" value="${data ? data.mrp : '0.00'}" step="0.01" style="text-align: right;"></td>
      <td><input type="number" class="p-row-rate" value="${data ? data.rate : '0.00'}" step="0.01" style="text-align: right; font-weight: bold;"></td>
      <td><input type="number" class="p-row-gst" value="${data ? data.gstPercent : '12'}" step="0.5" style="text-align: center;"></td>
      <td style="text-align: right; font-weight: bold;" class="p-row-amount">0.00</td>
      <td style="text-align: center;">
        <button type="button" class="delete-row-btn" onclick="App.removePurchaseRow('${rowId}')">&times;</button>
      </td>
    `;

        tbody.appendChild(tr);
        this.attachPurchaseMedicineAutocomplete(tr);

        tr.querySelectorAll("input").forEach(input => {
            input.addEventListener("input", () => this.recalculatePurchaseSummary());
        });

        this.updatePurchaseRowNumbers();
        this.recalculatePurchaseSummary();
    },

    removePurchaseRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            row.remove();
            this.updatePurchaseRowNumbers();
            this.recalculatePurchaseSummary();
        }
    },

    updatePurchaseRowNumbers() {
        const tbody = document.getElementById("purchase-items-tbody");
        const rows = tbody.querySelectorAll("tr");
        rows.forEach((tr, index) => {
            const sl = tr.querySelector(".p-row-sl");
            if (sl) sl.textContent = index + 1;
        });
    },

    recalculatePurchaseSummary() {
        const tbody = document.getElementById("purchase-items-tbody");
        const rows = tbody.querySelectorAll("tr");

        let count = 0;
        let subtotal = 0;
        let totalGst = 0;

        rows.forEach(tr => {
            const prod = tr.querySelector(".p-row-prod")?.value.trim();
            const qty = parseFloat(tr.querySelector(".p-row-qty")?.value) || 0;
            const rate = parseFloat(tr.querySelector(".p-row-rate")?.value) || 0;
            const gst = parseFloat(tr.querySelector(".p-row-gst")?.value) || 0;

            if (prod && qty > 0) {
                count++;
                const lineBase = qty * rate;
                const lineGst = lineBase * (gst / 100);
                const lineTotal = lineBase + lineGst;

                subtotal += lineBase;
                totalGst += lineGst;

                const amtCol = tr.querySelector(".p-row-amount");
                if (amtCol) amtCol.textContent = `${lineTotal.toFixed(2)}`;
            }
        });

        const totalAmt = subtotal + totalGst;

        document.getElementById("pur-items-count").textContent = count;
        document.getElementById("pur-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById("pur-gst-total").textContent = `₹${totalGst.toFixed(2)}`;
        document.getElementById("pur-total-amount").textContent = `₹${totalAmt.toFixed(2)}`;
    },

    resetPurchaseForm() {
        this.editingPurchaseId = null;
        document.getElementById("pur-supplier-input").value = "";
        document.getElementById("pur-supplier-gst").value = "";
        document.getElementById("pur-supplier-dlno").value = "";
        document.getElementById("pur-supplier-phone").value = "";
        document.getElementById("pur-supplier-address").value = "";
        document.getElementById("pur-bill-no").value = "";
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("pur-bill-date").value = today;

        const tbody = document.getElementById("purchase-items-tbody");
        tbody.innerHTML = "";
        this.addManualPurchaseRow();
        this.recalculatePurchaseSummary();
    },

    editPurchase(id) {
        const pur = Store.getPurchaseById(id);
        if (!pur) return;

        this.editingPurchaseId = id;
        this.navigate("purchase");

        document.getElementById("pur-bill-no").value = pur.billNo;
        document.getElementById("pur-bill-date").value = pur.date;
        document.getElementById("pur-tax-type").value = pur.taxType || "INTRA STATE";
        document.getElementById("pur-payment-type").value = pur.paymentType || "CREDIT";

        document.getElementById("pur-supplier-input").value = pur.supplierName || "";
        if (pur.supplierId) {
            const sup = Store.getSupplierById(pur.supplierId);
            if (sup) {
                document.getElementById("pur-supplier-gst").value = sup.gstNumber || "";
                document.getElementById("pur-supplier-dlno").value = sup.dlNo || "";
                document.getElementById("pur-supplier-phone").value = sup.phone || "";
                document.getElementById("pur-supplier-address").value = sup.address || "";
            }
        }

        const tbody = document.getElementById("purchase-items-tbody");
        tbody.innerHTML = "";
        if (pur.items && pur.items.length > 0) {
            pur.items.forEach(item => this.addManualPurchaseRow(item));
        } else {
            this.addManualPurchaseRow();
        }

        this.recalculatePurchaseSummary();
        this.showToast(`Editing Purchase Bill ${pur.billNo}`, false);
    },

    savePurchaseBill() {
        const billNo = document.getElementById("pur-bill-no").value.trim();
        const date = document.getElementById("pur-bill-date").value;
        const supplierName = document.getElementById("pur-supplier-input").value.trim();
        const supplierPhone = document.getElementById("pur-supplier-phone").value.trim();
        const supplierAddress = document.getElementById("pur-supplier-address").value.trim();
        const supplierGst = document.getElementById("pur-supplier-gst").value.trim();
        const supplierDlno = document.getElementById("pur-supplier-dlno").value.trim();
        const taxType = document.getElementById("pur-tax-type").value;
        const paymentType = document.getElementById("pur-payment-type").value;

        if (!supplierName) {
            alert("Please enter a supplier name.");
            document.getElementById("pur-supplier-input").focus();
            return;
        }
        if (!billNo) {
            alert("Please enter supplier invoice / bill number.");
            document.getElementById("pur-bill-no").focus();
            return;
        }

        let supplier = Store.getSupplierByName(supplierName);
        if (!supplier) {
            supplier = Store.saveSupplier({
                name: supplierName,
                contactPerson: "",
                phone: supplierPhone,
                gstNumber: supplierGst,
                dlNo: supplierDlno,
                address: supplierAddress,
                balance: 0
            });
        }

        const tbody = document.getElementById("purchase-items-tbody");
        const rows = tbody.querySelectorAll("tr");
        const items = [];
        let totalAmount = 0;

        rows.forEach((tr, index) => {
            const product = tr.querySelector(".p-row-prod")?.value.trim();
            const hsn = tr.querySelector(".p-row-hsn")?.value.trim() || "3004";
            const batch = tr.querySelector(".p-row-batch")?.value.trim() || "";
            const expiry = tr.querySelector(".p-row-exp")?.value.trim() || "";
            const qty = parseFloat(tr.querySelector(".p-row-qty")?.value) || 0;
            const free = parseFloat(tr.querySelector(".p-row-free")?.value) || 0;
            const rate = parseFloat(tr.querySelector(".p-row-rate")?.value) || 0;
            const mrp = parseFloat(tr.querySelector(".p-row-mrp")?.value) || 0;
            const gstPercent = parseFloat(tr.querySelector(".p-row-gst")?.value) || 0;

            if (product && qty > 0) {
                const lineBase = qty * rate;
                const lineGst = lineBase * (gstPercent / 100);
                const amount = lineBase + lineGst;
                totalAmount += amount;

                items.push({
                    sl: index + 1,
                    product,
                    hsn,
                    pack: "10's",
                    batch,
                    expiry,
                    qty,
                    free,
                    rate,
                    mrp,
                    gstPercent,
                    amount
                });

                const existingItem = Store.getItems().find(i =>
                    i.name.trim().toLowerCase() === product.toLowerCase() &&
                    (!batch || i.batch.trim().toLowerCase() === batch.toLowerCase())
                );
                if (!existingItem) {
                    Store.saveItem({
                        name: product,
                        hsn,
                        pack: "10's",
                        batch,
                        expiry,
                        stock: 0,
                        mrp: mrp || (rate * 1.3),
                        purchaseRate: rate,
                        rate: mrp ? mrp * 0.9 : rate * 1.2,
                        gstPercent,
                        supplierId: supplier.id
                    });
                }
            }
        });

        if (items.length === 0) {
            alert("Please add at least one medicine item.");
            return;
        }

        const isEdit = !!this.editingPurchaseId;
        const purchaseData = {
            id: this.editingPurchaseId || ("pur-" + Date.now()),
            billNo,
            date,
            supplierId: supplier.id,
            supplierName: supplier.name,
            taxType,
            paymentType,
            items,
            totalAmount
        };

        Store.savePurchase(purchaseData, isEdit);
        this.showToast(isEdit ? `Purchase bill ${billNo} updated!` : `Purchase bill ${billNo} saved & stock added!`);
        this.resetPurchaseForm();
        this.navigate("purchase-history");
    },

    /* ==========================================================================
       3. PURCHASE HISTORY PAGE
       ========================================================================== */
    /* ==========================================================================
       3. PURCHASE HISTORY PAGE
       ========================================================================== */
    renderPurchaseHistory() {
        const purchases = Store.getPurchases();
        const search = (document.getElementById("pur-history-search")?.value || "").toLowerCase().trim();

        const filtered = purchases.filter(pur =>
            (pur.billNo && pur.billNo.toLowerCase().includes(search)) ||
            (pur.supplierName && pur.supplierName.toLowerCase().includes(search)) ||
            (pur.date && pur.date.includes(search))
        );

        const tbody = document.getElementById("purchase-history-tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">No purchase records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(pur => `
      <tr>
        <td><strong>${InvoiceEngine.formatDate(pur.date)}</strong></td>
        <td><strong>${pur.billNo}</strong></td>
        <td>${pur.supplierName}</td>
        <td>${pur.items ? pur.items.length : 0} items</td>
        <td><span class="badge ${pur.paymentType === 'CASH' ? 'badge-paid' : 'badge-credit'}">${pur.paymentType}</span></td>
        <td>${pur.taxType || 'INTRA STATE'}</td>
        <td><strong>₹${(pur.totalAmount || 0).toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.editPurchase('${pur.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="App.deletePurchase('${pur.id}')">✕</button>
        </td>
      </tr>
    `).join("");
    },

    deletePurchase(id) {
        if (confirm("Are you sure you want to delete this purchase entry? Stock will be reversed.")) {
            Store.deletePurchase(id);
            this.showToast("Purchase bill deleted and stock reversed.", false);
            this.renderPurchaseHistory();
        }
    },

    /* ==========================================================================
       4. ITEMS / MEDICINES PAGE
       ========================================================================== */
    filterItemsStatus(status) {
        this.itemsFilterStatus = status;
        document.querySelectorAll(".filter-pill-btn").forEach(btn => {
            btn.classList.toggle("active", btn.id === `filter-pill-${status}`);
        });
        this.renderItemsList();
    },

    renderItemsList() {
        const items = Store.getItems();
        const search = (document.getElementById("items-search-input")?.value || "").toLowerCase().trim();

        const now = new Date();
        const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, 1);

        let totalLow = 0;
        let totalNearExp = 0;

        items.forEach(item => {
            const minStock = item.minStock != null ? item.minStock : 10;
            const stock = item.stock || 0;
            if (stock <= minStock) totalLow++;

            if (item.expiry) {
                const parts = item.expiry.split("/");
                if (parts.length === 2) {
                    const yr = parseInt(parts[1], 10);
                    const mo = parseInt(parts[0], 10);
                    const expDate = new Date(yr < 100 ? 2000 + yr : yr, mo - 1, 1);
                    if (expDate <= threeMonthsLater) totalNearExp++;
                }
            }
        });

        const countAllEl = document.getElementById("count-items-all");
        const countLowEl = document.getElementById("count-items-low");
        const countExpEl = document.getElementById("count-items-exp");
        if (countAllEl) countAllEl.textContent = items.length;
        if (countLowEl) countLowEl.textContent = totalLow;
        if (countExpEl) countExpEl.textContent = totalNearExp;

        const filtered = items.filter(i => {
            const matchesSearch = (i.name && i.name.toLowerCase().includes(search)) ||
                (i.hsn && i.hsn.toLowerCase().includes(search)) ||
                (i.batch && i.batch.toLowerCase().includes(search));
            if (!matchesSearch) return false;

            const minStock = i.minStock != null ? i.minStock : 10;
            const stock = i.stock || 0;
            const isLow = stock <= minStock;

            let isNearExpiry = false;
            if (i.expiry) {
                const parts = i.expiry.split("/");
                if (parts.length === 2) {
                    const yr = parseInt(parts[1], 10);
                    const mo = parseInt(parts[0], 10);
                    const expDate = new Date(yr < 100 ? 2000 + yr : yr, mo - 1, 1);
                    isNearExpiry = expDate <= threeMonthsLater;
                }
            }

            if (this.itemsFilterStatus === "low") return isLow;
            if (this.itemsFilterStatus === "expiry") return isNearExpiry;
            return true;
        });

        const tbody = document.getElementById("items-table-tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; color: #94a3b8; padding: 24px;">No medicines found matching criteria. Click 'Add Medicine (F2)' to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((item) => {
            const minStock = item.minStock != null ? item.minStock : 10;
            const stock = item.stock || 0;

            let isNearExpiry = false;
            if (item.expiry) {
                const parts = item.expiry.split("/");
                if (parts.length === 2) {
                    const yr = parseInt(parts[1], 10);
                    const mo = parseInt(parts[0], 10);
                    const expDate = new Date(yr < 100 ? 2000 + yr : yr, mo - 1, 1);
                    isNearExpiry = expDate <= threeMonthsLater;
                }
            }

            const isLow = stock <= minStock;
            let statusBadge;
            if (isLow) {
                statusBadge = `<span class="badge badge-danger">Low Stock</span>`;
            } else if (isNearExpiry) {
                statusBadge = `<span class="badge badge-credit">Near Expiry</span>`;
            } else {
                statusBadge = `<span class="badge badge-paid">In Stock</span>`;
            }

            return `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${item.hsn || '3004'}</td>
          <td>${item.pack || '-'}</td>
          <td>${item.batch || '-'}</td>
          <td>${item.expiry || '-'}</td>
          <td style="text-align:right;">₹${(item.mrp || 0).toFixed(2)}</td>
          <td style="text-align:right;">₹${(item.purchaseRate || 0).toFixed(2)}</td>
          <td style="text-align:right; font-weight:700; color:#0284c7;">₹${(item.rate || 0).toFixed(2)}</td>
          <td style="text-align:center;">${item.gstPercent || 0}%</td>
          <td style="text-align:center;${isLow ? 'color:#dc2626;font-weight:700;' : ''}">${stock}</td>
          <td style="text-align:center;">${minStock}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td style="text-align:center;">
            <button class="btn btn-secondary btn-sm" onclick="App.openItemModal('${item.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="App.deleteItem('${item.id}')">✕</button>
          </td>
        </tr>
      `;
        }).join("");
    },

    openItemModal(id = null) {
        document.getElementById("item-form-id").value = id || "";
        document.getElementById("item-modal-title").textContent = id ? "Edit Medicine" : "Add New Medicine / Item (Manual)";

        if (id) {
            const item = Store.getItemById(id);
            if (item) {
                document.getElementById("item-name").value = item.name || "";
                document.getElementById("item-hsn").value = item.hsn || "3004";
                document.getElementById("item-pack").value = item.pack || "";
                document.getElementById("item-batch").value = item.batch || "";
                document.getElementById("item-expiry").value = item.expiry || "";
                document.getElementById("item-stock").value = item.stock || 0;
                document.getElementById("item-gst").value = item.gstPercent || 12;
                document.getElementById("item-mrp").value = item.mrp || 0;
                document.getElementById("item-purrate").value = item.purchaseRate || 0;
                document.getElementById("item-salerate").value = item.rate || 0;
                const minEl = document.getElementById("item-min-stock");
                if (minEl) minEl.value = item.minStock != null ? item.minStock : 10;
            }
        } else {
            document.getElementById("item-name").value = "";
            document.getElementById("item-hsn").value = "3004";
            document.getElementById("item-pack").value = "10's";
            document.getElementById("item-batch").value = "B" + Math.floor(1000 + Math.random() * 9000);
            document.getElementById("item-expiry").value = "12/27";
            document.getElementById("item-stock").value = "50";
            document.getElementById("item-gst").value = "12";
            document.getElementById("item-mrp").value = "50.00";
            document.getElementById("item-purrate").value = "30.00";
            document.getElementById("item-salerate").value = "45.00";
            const minEl = document.getElementById("item-min-stock");
            if (minEl) minEl.value = "10";
        }

        this.openModal("modal-item");
    },

    saveItemForm() {
        const id = document.getElementById("item-form-id").value;
        const name = document.getElementById("item-name").value.trim();
        const rate = parseFloat(document.getElementById("item-salerate").value) || 0;

        if (!name) {
            alert("Medicine / Product name is required.");
            return;
        }

        const item = {
            id: id || undefined,
            name,
            hsn: document.getElementById("item-hsn").value.trim() || "3004",
            pack: document.getElementById("item-pack").value.trim(),
            batch: document.getElementById("item-batch").value.trim(),
            expiry: document.getElementById("item-expiry").value.trim(),
            stock: parseInt(document.getElementById("item-stock").value, 10) || 0,
            gstPercent: parseFloat(document.getElementById("item-gst").value) || 0,
            mrp: parseFloat(document.getElementById("item-mrp").value) || 0,
            purchaseRate: parseFloat(document.getElementById("item-purrate").value) || 0,
            minStock: parseInt(document.getElementById("item-min-stock")?.value, 10) || 10,
            rate
        };

        Store.saveItem(item);
        this.closeAllModals();
        this.showToast(`Medicine '${name}' saved.`);
        this.renderItemsList();
    },

    deleteItem(id) {
        const item = Store.getItemById(id);
        if (!item) return;
        if (confirm(`Delete medicine '${item.name}'?`)) {
            Store.deleteItem(id);
            this.showToast("Medicine deleted.", false);
            this.renderItemsList();
        }
    },

    /* ==========================================================================
       5. SUPPLIERS PAGE
       ========================================================================== */
    renderSuppliersList() {
        const suppliers = Store.getSuppliers();
        const search = (document.getElementById("suppliers-search-input")?.value || "").toLowerCase().trim();

        const filtered = suppliers.filter(s =>
            (s.name && s.name.toLowerCase().includes(search)) ||
            (s.contactPerson && s.contactPerson.toLowerCase().includes(search))
        );

        const tbody = document.getElementById("suppliers-table-tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 24px;">No suppliers found. Click '+ Add Supplier' to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((sup, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${sup.name}</strong></td>
        <td>${sup.contactPerson || '-'}</td>
        <td>${sup.phone || '-'}</td>
        <td>${sup.gstNumber || '-'}</td>
        <td>${sup.dlNo || '-'}</td>
        <td>${sup.address || '-'}</td>
        <td style="font-weight: bold; color: ${sup.balance > 0 ? '#dc2626' : '#166534'};">
          ₹${(sup.balance || 0).toFixed(2)}
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.openSupplierModal('${sup.id}')">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="App.viewSupplierLedger('${sup.id}')">Ledger</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteSupplier('${sup.id}')">✕</button>
        </td>
      </tr>
    `).join("");
    },

    openSupplierModal(id = null) {
        document.getElementById("sup-form-id").value = id || "";
        document.getElementById("sup-modal-title").textContent = id ? "Edit Supplier" : "Add New Supplier / Distributor (Manual)";

        if (id) {
            const sup = Store.getSupplierById(id);
            if (sup) {
                document.getElementById("sup-name").value = sup.name || "";
                document.getElementById("sup-contact").value = sup.contactPerson || "";
                document.getElementById("sup-phone").value = sup.phone || "";
                document.getElementById("sup-gst").value = sup.gstNumber || "";
                document.getElementById("sup-dlno").value = sup.dlNo || "";
                document.getElementById("sup-address").value = sup.address || "";
                document.getElementById("sup-balance").value = sup.balance || 0;
            }
        } else {
            document.getElementById("sup-name").value = "";
            document.getElementById("sup-contact").value = "";
            document.getElementById("sup-phone").value = "";
            document.getElementById("sup-gst").value = "";
            document.getElementById("sup-dlno").value = "";
            document.getElementById("sup-address").value = "";
            document.getElementById("sup-balance").value = "0.00";
        }

        this.openModal("modal-supplier");
    },

    saveSupplierForm() {
        const id = document.getElementById("sup-form-id").value;
        const name = document.getElementById("sup-name").value.trim();

        if (!name) {
            alert("Supplier name is required.");
            return;
        }

        const supplier = {
            id: id || undefined,
            name,
            contactPerson: document.getElementById("sup-contact").value.trim(),
            phone: document.getElementById("sup-phone").value.trim(),
            gstNumber: document.getElementById("sup-gst").value.trim(),
            dlNo: document.getElementById("sup-dlno").value.trim(),
            address: document.getElementById("sup-address").value.trim(),
            balance: parseFloat(document.getElementById("sup-balance").value) || 0
        };

        Store.saveSupplier(supplier);
        this.closeAllModals();
        this.showToast(`Supplier '${name}' saved.`);
        this.renderSuppliersList();
        this.refreshPurchaseMeta();
    },

    deleteSupplier(id) {
        const sup = Store.getSupplierById(id);
        if (!sup) return;
        if (confirm(`Delete supplier '${sup.name}'?`)) {
            Store.deleteSupplier(id);
            this.showToast("Supplier deleted.", false);
            this.renderSuppliersList();
            this.refreshPurchaseMeta();
        }
    },

    viewSupplierLedger(id) {
        this.navigate("supplier-history");
        const select = document.getElementById("sup-history-select");
        if (select) {
            select.value = id;
            this.renderSupplierHistory();
        }
    },

    /* ==========================================================================
       6. SUPPLIER HISTORY / LEDGER
       ========================================================================== */
    renderSupplierHistory() {
        const suppliers = Store.getSuppliers();
        const select = document.getElementById("sup-history-select");

        const currentSelected = select.value || (suppliers.length > 0 ? suppliers[0].id : "");
        select.innerHTML = suppliers.map(s =>
            `<option value="${s.id}" ${s.id === currentSelected ? 'selected' : ''}>${s.name}</option>`
        ).join("");

        select.onchange = () => this.renderSupplierHistory();

        const selectedSupId = select.value;
        if (!selectedSupId) return;

        const supplier = Store.getSupplierById(selectedSupId);
        const txns = Store.getSupplierTxns().filter(t => t.supplierId === selectedSupId);

        let totalPur = 0;
        let totalPaid = 0;

        txns.forEach(t => {
            totalPur += Number(t.credit) || 0;
            totalPaid += Number(t.debit) || 0;
        });

        const netDue = supplier ? supplier.balance : (totalPur - totalPaid);

        document.getElementById("sup-ledger-purchases").textContent = `₹${totalPur.toFixed(2)}`;
        document.getElementById("sup-ledger-payments").textContent = `₹${totalPaid.toFixed(2)}`;
        document.getElementById("sup-ledger-outstanding").textContent = `₹${netDue.toFixed(2)}`;

        const tbody = document.getElementById("supplier-ledger-tbody");
        if (!tbody) return;

        if (txns.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 20px;">No transactions recorded for this supplier.</td></tr>`;
            return;
        }

        tbody.innerHTML = txns.map(t => `
      <tr>
        <td><strong>${InvoiceEngine.formatDate(t.date)}</strong></td>
        <td><span class="badge ${t.type === 'PURCHASE' ? 'badge-credit' : 'badge-paid'}">${t.type}</span></td>
        <td>${t.refNo || '-'}</td>
        <td style="color: #166534; font-weight: bold;">${t.debit > 0 ? `₹${t.debit.toFixed(2)}` : '-'}</td>
        <td style="color: #dc2626; font-weight: bold;">${t.credit > 0 ? `₹${t.credit.toFixed(2)}` : '-'}</td>
        <td>₹${(t.balance || 0).toFixed(2)}</td>
        <td>${t.note || '-'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.editSupplierPayment('${t.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteSupplierPayment('${t.id}')">✕</button>
        </td>
      </tr>
    `).join("");
    },

    openSupplierPaymentModal() {
        document.getElementById("sup-pay-txn-id").value = "";
        document.getElementById("sup-pay-modal-title").textContent = "Record Supplier Payment (Manual)";

        const suppliers = Store.getSuppliers();
        const select = document.getElementById("sup-pay-supplier");
        const activeSupId = document.getElementById("sup-history-select")?.value;

        select.innerHTML = suppliers.map(s =>
            `<option value="${s.id}" ${s.id === activeSupId ? 'selected' : ''}>${s.name} (Balance: ₹${(s.balance || 0).toFixed(2)})</option>`
        ).join("");

        const today = new Date().toISOString().split("T")[0];
        document.getElementById("sup-pay-date").value = today;
        document.getElementById("sup-pay-amount").value = "";
        document.getElementById("sup-pay-ref").value = "NEFT-" + Math.floor(10000 + Math.random() * 90000);
        document.getElementById("sup-pay-note").value = "";

        this.openModal("modal-supplier-payment");
    },

    editSupplierPayment(txnId) {
        const txn = Store.getSupplierTxnById(txnId);
        if (!txn) return;

        document.getElementById("sup-pay-txn-id").value = txn.id;
        document.getElementById("sup-pay-modal-title").textContent = "Edit Supplier Payment";

        const suppliers = Store.getSuppliers();
        const select = document.getElementById("sup-pay-supplier");
        select.innerHTML = suppliers.map(s =>
            `<option value="${s.id}" ${s.id === txn.supplierId ? 'selected' : ''}>${s.name}</option>`
        ).join("");

        document.getElementById("sup-pay-date").value = txn.date;
        document.getElementById("sup-pay-amount").value = txn.debit || txn.credit || 0;
        document.getElementById("sup-pay-ref").value = txn.refNo || "";
        document.getElementById("sup-pay-note").value = txn.note || "";

        this.openModal("modal-supplier-payment");
    },

    deleteSupplierPayment(txnId) {
        if (confirm("Are you sure you want to delete this payment transaction?")) {
            Store.deleteSupplierTxn(txnId);
            this.showToast("Payment transaction deleted.", false);
            this.renderSupplierHistory();
            this.renderSuppliersList();
        }
    },

    saveSupplierPayment() {
        const txnId = document.getElementById("sup-pay-txn-id").value;
        const supplierId = document.getElementById("sup-pay-supplier").value;
        const date = document.getElementById("sup-pay-date").value;
        const mode = document.getElementById("sup-pay-mode").value;
        const amount = parseFloat(document.getElementById("sup-pay-amount").value) || 0;
        const refNo = document.getElementById("sup-pay-ref").value.trim();
        const note = document.getElementById("sup-pay-note").value.trim();

        if (!supplierId || amount <= 0) {
            alert("Please select supplier and enter valid payment amount.");
            return;
        }

        if (txnId) {
            const existing = Store.getSupplierTxnById(txnId);
            if (existing) {
                existing.supplierId = supplierId;
                existing.date = date;
                existing.refNo = refNo;
                existing.debit = amount;
                existing.note = note || `Payment via ${mode}`;
                Store.updateSupplierTxn(existing);
                this.showToast("Payment record updated.");
            }
        } else {
            const sup = Store.getSupplierById(supplierId);
            const newBal = Math.max(0, (sup.balance || 0) - amount);

            Store.addSupplierTxn({
                supplierId,
                date,
                type: "PAYMENT",
                refNo: `${refNo} (${mode})`,
                debit: amount,
                credit: 0,
                balance: newBal,
                note: note || `Payment via ${mode}`
            });
            this.showToast(`Recorded payment of ₹${amount.toFixed(2)}.`);
        }

        this.closeAllModals();
        this.renderSupplierHistory();
        this.renderSuppliersList();
    },

    /* ==========================================================================
       7. CUSTOMERS PAGE
       ========================================================================== */
    renderCustomersList() {
        const customers = Store.getCustomers();
        const search = (document.getElementById("customers-search-input")?.value || "").toLowerCase().trim();

        const filtered = customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.mobile && c.mobile.includes(search)) ||
            (c.doctorReg && c.doctorReg.toLowerCase().includes(search))
        );

        const tbody = document.getElementById("customers-table-tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">No customers found. Click '+ Add Customer' to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((c, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.mobile || '-'}</td>
        <td>${c.doctorReg || '-'}</td>
        <td>${c.gstNumber || '-'}</td>
        <td>${c.dlNo || '-'}</td>
        <td>${c.address || '-'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.openCustomerModal('${c.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteCustomer('${c.id}')">✕</button>
        </td>
      </tr>
    `).join("");
    },

    openCustomerModal(id = null) {
        document.getElementById("cust-form-id").value = id || "";
        document.getElementById("cust-modal-title").textContent = id ? "Edit Customer" : "Add New Customer / Clinic (Manual)";

        if (id) {
            const c = Store.getCustomerById(id);
            if (c) {
                document.getElementById("cust-name").value = c.name || "";
                document.getElementById("cust-mobile").value = c.mobile || "";
                document.getElementById("cust-docreg").value = c.doctorReg || "";
                document.getElementById("cust-gst").value = c.gstNumber || "";
                document.getElementById("cust-dlno").value = c.dlNo || "";
                document.getElementById("cust-address").value = c.address || "";
            }
        } else {
            document.getElementById("cust-name").value = "";
            document.getElementById("cust-mobile").value = "";
            document.getElementById("cust-docreg").value = "";
            document.getElementById("cust-gst").value = "";
            document.getElementById("cust-dlno").value = "";
            document.getElementById("cust-address").value = "";
        }

        this.openModal("modal-customer");
    },

    saveCustomerForm() {
        const id = document.getElementById("cust-form-id").value;
        const name = document.getElementById("cust-name").value.trim();

        if (!name) {
            alert("Customer name is required.");
            return;
        }

        const customer = {
            id: id || undefined,
            name,
            mobile: document.getElementById("cust-mobile").value.trim(),
            doctorReg: document.getElementById("cust-docreg").value.trim(),
            gstNumber: document.getElementById("cust-gst").value.trim(),
            dlNo: document.getElementById("cust-dlno").value.trim(),
            address: document.getElementById("cust-address").value.trim()
        };

        Store.saveCustomer(customer);
        this.closeAllModals();
        this.showToast(`Customer '${name}' saved.`);
        this.renderCustomersList();
    },

    deleteCustomer(id) {
        const c = Store.getCustomerById(id);
        if (!c) return;
        if (confirm(`Delete customer '${c.name}'?`)) {
            Store.deleteCustomer(id);
            this.showToast("Customer deleted.", false);
            this.renderCustomersList();
        }
    },

    /* ==========================================================================
       8. INVOICE HISTORY PAGE
       ========================================================================== */
    renderInvoiceHistory() {
        const invoices = Store.getInvoices();
        const search = (document.getElementById("invoice-history-search")?.value || "").toLowerCase().trim();

        const filtered = invoices.filter(inv =>
            (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(search)) ||
            (inv.customer && inv.customer.name && inv.customer.name.toLowerCase().includes(search)) ||
            (inv.customer && inv.customer.mobile && inv.customer.mobile.includes(search))
        );

        const tbody = document.getElementById("invoice-history-tbody");
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">No invoices found.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(inv => `
      <tr>
        <td><strong>${InvoiceEngine.formatDate(inv.invoiceDate)}</strong></td>
        <td><strong>${inv.invoiceNo}</strong></td>
        <td>${inv.customer ? inv.customer.name : 'Counter Patient'}</td>
        <td>${inv.customer ? (inv.customer.mobile || '-') : '-'}</td>
        <td><span class="badge badge-paid">${inv.paymentType || 'CASH'}</span></td>
        <td>${inv.taxType || 'INTRA STATE'}</td>
        <td><strong>₹${(inv.netAmount || 0).toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.editInvoice('${inv.id}')">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="App.viewInvoiceDetails('${inv.id}')">Print</button>
          <button class="btn btn-danger btn-sm" onclick="App.deleteInvoice('${inv.id}')">✕</button>
        </td>
      </tr>
    `).join("");
    },

    viewInvoiceDetails(id) {
        const inv = Store.getInvoiceById(id);
        if (!inv) return;

        this.currentPreviewInvoice = inv;
        this.updateInvoicePreviewRender();
        document.getElementById("preview-modal-title").textContent = `Invoice ${inv.invoiceNo} - Preview`;

        this.openModal("modal-invoice-preview");
    },

    deleteInvoice(id) {
        const inv = Store.getInvoiceById(id);
        if (!inv) return;
        if (confirm(`Delete invoice ${inv.invoiceNo}? Sold medicine stock will be restored to inventory.`)) {
            Store.deleteInvoice(id);
            this.showToast(`Invoice ${inv.invoiceNo} deleted and stock restored.`, false);
            this.renderInvoiceHistory();
        }
    },

    /* ==========================================================================
       9. DASHBOARD (AT LAST)
       ========================================================================== */
    renderDashboard() {
        const stats = Store.getDashboardStats();

        document.getElementById("dash-today-sales").textContent = `₹${stats.todaySales.toFixed(2)}`;
        document.getElementById("dash-total-sales").textContent = `₹${stats.totalSales.toFixed(2)}`;
        document.getElementById("dash-stock-value").textContent = `₹${stats.totalStockValue.toFixed(2)}`;
        document.getElementById("dash-stock-qty").textContent = `${stats.totalStockQty} total units across ${stats.totalItemsCount} medicines`;
        document.getElementById("dash-supplier-due").textContent = `₹${stats.supplierOutstanding.toFixed(2)}`;

        // Expiry Table
        const expTbody = document.getElementById("dash-expiry-tbody");
        if (stats.nearExpiryItems.length === 0) {
            expTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #166534; padding: 12px;">All medicines are well within expiry period!</td></tr>`;
        } else {
            expTbody.innerHTML = stats.nearExpiryItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${item.batch}</td>
          <td style="color: #b91c1c; font-weight: bold;">${item.expiry}</td>
          <td>${item.stock} left</td>
        </tr>
      `).join("");
        }

        // Low Stock Table
        const lowTbody = document.getElementById("dash-lowstock-tbody");
        if (stats.lowStockItems.length === 0) {
            lowTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #166534; padding: 12px;">Sufficient inventory across all medicines.</td></tr>`;
        } else {
            lowTbody.innerHTML = stats.lowStockItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td>${item.batch}</td>
          <td style="color: #dc2626; font-weight: bold;">${item.stock} units</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('purchase')">+ Reorder</button>
          </td>
        </tr>
      `).join("");
        }

        // Recent Bills Table
        const billsTbody = document.getElementById("dash-recent-bills-tbody");
        if (stats.recentInvoices.length === 0) {
            billsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">No recent bills.</td></tr>`;
        } else {
            billsTbody.innerHTML = stats.recentInvoices.map(inv => `
        <tr>
          <td><strong>${inv.invoiceNo}</strong></td>
          <td>${InvoiceEngine.formatDate(inv.invoiceDate)}</td>
          <td>${inv.customer ? inv.customer.name : 'Counter Patient'}</td>
          <td><span class="badge badge-paid">${inv.paymentType}</span></td>
          <td><strong>₹${(inv.netAmount || 0).toFixed(2)}</strong></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.viewInvoiceDetails('${inv.id}')">View</button>
          </td>
        </tr>
      `).join("");
        }
    },

    renderDashboardSearch(query) {
        const resultsPanel = document.getElementById("dashboard-search-results");
        if (!resultsPanel) return;

        const q = (query || "").toLowerCase().trim();
        if (!q) {
            resultsPanel.style.display = "none";
            resultsPanel.innerHTML = "";
            return;
        }

        const invoices = Store.getInvoices().filter(inv =>
            (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
            (inv.customer && inv.customer.name && inv.customer.name.toLowerCase().includes(q))
        );

        const items = Store.getItems().filter(i =>
            (i.name && i.name.toLowerCase().includes(q)) ||
            (i.hsn && i.hsn.toLowerCase().includes(q))
        );

        const suppliers = Store.getSuppliers().filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
        );

        const totalResults = invoices.length + items.length + suppliers.length;

        if (totalResults === 0) {
            resultsPanel.style.display = "block";
            resultsPanel.innerHTML = `<div class="panel-container" style="padding:20px; text-align:center; color:#94a3b8;">No results found for "<strong>${query}</strong>"</div>`;
            return;
        }

        let html = `<div class="panel-container">
      <div class="panel-title-bar"><span>🔍 SEARCH RESULTS FOR "${query.toUpperCase()}" — ${totalResults} found</span></div>
      <div style="padding:12px 16px; display:grid; gap:12px;">`;

        if (invoices.length > 0) {
            html += `<div>
        <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:.07em; margin-bottom:6px; text-transform:uppercase;">Invoices (${invoices.length})</div>
        <table class="data-table" style="margin:0;">
          <thead><tr><th>Invoice No</th><th>Date</th><th>Customer</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            ${invoices.slice(0, 8).map(inv => `
              <tr>
                <td><strong>${inv.invoiceNo}</strong></td>
                <td>${InvoiceEngine.formatDate(inv.invoiceDate)}</td>
                <td>${inv.customer ? inv.customer.name : 'Counter Patient'}</td>
                <td><strong>₹${(inv.netAmount || 0).toFixed(2)}</strong></td>
                <td><button class="btn btn-secondary btn-sm" onclick="App.viewInvoiceDetails('${inv.id}')">View</button></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
        }

        if (items.length > 0) {
            html += `<div>
        <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:.07em; margin-bottom:6px; text-transform:uppercase;">Medicines (${items.length})</div>
        <table class="data-table" style="margin:0;">
          <thead><tr><th>Medicine Name</th><th>HSN</th><th>Pack</th><th>Stock</th><th>MRP</th></tr></thead>
          <tbody>
            ${items.slice(0, 8).map(i => `
              <tr>
                <td><strong>${i.name}</strong></td>
                <td>${i.hsn || '-'}</td>
                <td>${i.pack || '-'}</td>
                <td>${i.stock || 0}</td>
                <td>₹${(i.mrp || 0).toFixed(2)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
        }

        if (suppliers.length > 0) {
            html += `<div>
        <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:.07em; margin-bottom:6px; text-transform:uppercase;">Suppliers (${suppliers.length})</div>
        <table class="data-table" style="margin:0;">
          <thead><tr><th>Supplier Name</th><th>Contact</th><th>Phone</th><th>Balance</th></tr></thead>
          <tbody>
            ${suppliers.slice(0, 8).map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.contactPerson || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td style="color:${(s.balance || 0) > 0 ? '#dc2626' : '#16a34a'}; font-weight:700;">₹${(s.balance || 0).toFixed(2)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
        }

        html += `</div></div>`;
        resultsPanel.innerHTML = html;
        resultsPanel.style.display = "block";
    },

    clearDashboardSearch() {
        const input = document.getElementById("dashboard-search-input");
        if (input) input.value = "";
        this.renderDashboardSearch("");
    },

    /* ==========================================================================
       10. ENHANCED CONTROLLERS & DATA HELPERS
       ========================================================================== */
    attachPurchaseMedicineAutocomplete(tr) {
        const prodInput = tr.querySelector(".p-row-prod");
        if (!prodInput) return;
        prodInput.setAttribute("autocomplete", "off");

        let list = tr.querySelector(".p-autocomplete-list");
        if (!list) {
            list = document.createElement("div");
            list.className = "autocomplete-dropdown p-autocomplete-list";
            list.style.display = "none";
            prodInput.parentElement.style.position = "relative";
            prodInput.parentElement.appendChild(list);
        }

        prodInput.addEventListener("input", () => {
            const val = prodInput.value.toLowerCase().trim();
            if (!val) {
                list.style.display = "none";
                return;
            }
            const matches = Store.getItems().filter(i =>
                (i.name && i.name.toLowerCase().includes(val)) ||
                (i.batch && i.batch.toLowerCase().includes(val))
            ).slice(0, 6);

            if (matches.length === 0) {
                list.style.display = "none";
                return;
            }

            list.innerHTML = matches.map(m => `
                <div class="autocomplete-item" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-weight: 600; font-size: 12px; color: #0f172a;">${m.name}</div>
                    <div style="font-size: 11px; color: #64748b;">HSN: ${m.hsn || '3004'} | Pack: ${m.pack || '-'} | Pur: ₹${(m.purchaseRate || 0).toFixed(2)} | MRP: ₹${(m.mrp || 0).toFixed(2)}</div>
                </div>
            `).join("");
            list.style.display = "block";

            list.querySelectorAll(".autocomplete-item").forEach((itemEl, idx) => {
                itemEl.addEventListener("click", () => {
                    const item = matches[idx];
                    prodInput.value = item.name;
                    const hsnEl = tr.querySelector(".p-row-hsn");
                    if (hsnEl) hsnEl.value = item.hsn || "3004";
                    const batchEl = tr.querySelector(".p-row-batch");
                    if (batchEl && !batchEl.value) batchEl.value = item.batch || "";
                    const expEl = tr.querySelector(".p-row-exp");
                    if (expEl && !expEl.value) expEl.value = item.expiry || "";
                    const mrpEl = tr.querySelector(".p-row-mrp");
                    if (mrpEl) mrpEl.value = (item.mrp || 0).toFixed(2);
                    const rateEl = tr.querySelector(".p-row-rate");
                    if (rateEl) rateEl.value = (item.purchaseRate || item.rate || 0).toFixed(2);
                    const gstEl = tr.querySelector(".p-row-gst");
                    if (gstEl) gstEl.value = item.gstPercent || 12;

                    list.style.display = "none";
                    this.recalculatePurchaseSummary();
                });
            });
        });

        document.addEventListener("click", (e) => {
            if (!prodInput.contains(e.target) && !list.contains(e.target)) {
                list.style.display = "none";
            }
        });
    },

    calculateChangeReturn() {
        const netText = document.getElementById("bill-net-amount")?.textContent || "0";
        const net = parseFloat(netText.replace(/[^0-9.]/g, "")) || 0;
        const tendered = parseFloat(document.getElementById("bill-cash-tendered")?.value) || 0;
        const returnEl = document.getElementById("bill-change-return");
        if (!returnEl) return;

        if (tendered > 0 && tendered >= net) {
            const change = tendered - net;
            returnEl.textContent = `₹${change.toFixed(2)}`;
            returnEl.style.color = "#4ade80";
        } else if (tendered > 0 && tendered < net) {
            const due = net - tendered;
            returnEl.textContent = `-₹${due.toFixed(2)} (Due)`;
            returnEl.style.color = "#f87171";
        } else {
            returnEl.textContent = "₹0.00";
            returnEl.style.color = "#4ade80";
        }
    },

    setPreviewMode(mode) {
        this.previewMode = mode;
        const btnA4 = document.getElementById("btn-mode-a4");
        const btnThermal = document.getElementById("btn-mode-thermal");
        if (btnA4 && btnThermal) {
            btnA4.classList.toggle("active", mode === "A4");
            btnThermal.classList.toggle("active", mode === "THERMAL");
        }
        this.updateInvoicePreviewRender();
    },

    updateInvoicePreviewRender() {
        if (!this.currentPreviewInvoice) return;
        const business = Store.getBusiness();
        let printHTML;
        const container = document.getElementById("invoice-preview-container");
        if (this.previewMode === "THERMAL") {
            printHTML = InvoiceEngine.renderThermalReceipt(this.currentPreviewInvoice, business);
            if (container) {
                container.style.maxWidth = "360px";
                container.style.margin = "0 auto";
            }
        } else {
            printHTML = InvoiceEngine.renderMedicalTaxInvoice(this.currentPreviewInvoice, business);
            if (container) {
                container.style.maxWidth = "820px";
                container.style.margin = "0";
            }
        }
        const printContainer = document.getElementById("print-container");
        if (printContainer) printContainer.innerHTML = printHTML;
        if (container) container.innerHTML = printHTML;
    },

    printActiveInvoice() {
        window.print();
    },

    openStoreSettingsModal() {
        const biz = Store.getBusiness();
        document.getElementById("setting-store-name").value = biz.name || "";
        document.getElementById("setting-store-gst").value = biz.gstNumber || "";
        document.getElementById("setting-store-dlno").value = biz.dlNo || "";
        document.getElementById("setting-store-prefix").value = biz.invoicePrefix || "TH/2026-27-";
        document.getElementById("setting-store-phone").value = biz.phone || "";
        document.getElementById("setting-store-email").value = biz.email || "";
        document.getElementById("setting-store-address").value = biz.address || "";
        document.getElementById("setting-bank-name").value = biz.bankName || "";
        document.getElementById("setting-bank-acc").value = biz.bankAccNo || "";
        document.getElementById("setting-bank-ifsc").value = biz.bankIfsc || "";
        document.getElementById("setting-bank-branch").value = biz.bankBranch || "";
        document.getElementById("setting-store-terms").value = biz.terms || "";

        this.openModal("modal-store-settings");
    },

    saveStoreSettings() {
        const name = document.getElementById("setting-store-name").value.trim();
        const gstNumber = document.getElementById("setting-store-gst").value.trim();
        if (!name) {
            alert("Pharmacy name is required.");
            return;
        }

        const current = Store.getBusiness();
        const updated = {
            ...current,
            name,
            gstNumber,
            dlNo: document.getElementById("setting-store-dlno").value.trim(),
            invoicePrefix: document.getElementById("setting-store-prefix").value.trim() || "TH/2026-27-",
            phone: document.getElementById("setting-store-phone").value.trim(),
            email: document.getElementById("setting-store-email").value.trim(),
            address: document.getElementById("setting-store-address").value.trim(),
            bankName: document.getElementById("setting-bank-name").value.trim(),
            bankAccNo: document.getElementById("setting-bank-acc").value.trim(),
            bankIfsc: document.getElementById("setting-bank-ifsc").value.trim(),
            bankBranch: document.getElementById("setting-bank-branch").value.trim(),
            terms: document.getElementById("setting-store-terms").value.trim()
        };

        Store.saveBusiness(updated);
        this.updateBrandHeader();
        this.refreshBillingMeta();
        this.closeAllModals();
        this.showToast("Store settings saved successfully!");
    },

    openBackupModal() {
        this.openModal("modal-backup");
    },

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    downloadJsonBackup() {
        const json = Store.exportAllDataJSON();
        const dateStr = new Date().toISOString().split("T")[0];
        this.downloadFile(json, `Thiran_Pharmacy_Backup_${dateStr}.json`, "application/json");
        this.showToast("Full backup downloaded successfully!");
    },

    handleJsonRestoreFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (confirm("Restore database from this backup file? Existing records will be updated with backup contents.")) {
                const res = Store.importAllDataJSON(content);
                if (res.success) {
                    this.showToast("Backup restored successfully!");
                    this.updateBrandHeader();
                    this.navigate(this.activeTab);
                    this.closeAllModals();
                } else {
                    alert("Error restoring backup: " + res.error);
                }
            }
            event.target.value = "";
        };
        reader.readAsText(file);
    },

    downloadInvoicesCsv() {
        const csv = Store.exportInvoicesCSV();
        const dateStr = new Date().toISOString().split("T")[0];
        this.downloadFile(csv, `Thiran_Invoices_${dateStr}.csv`, "text/csv");
        this.showToast("Invoices CSV downloaded!");
    },

    downloadItemsCsv() {
        const csv = Store.exportItemsCSV();
        const dateStr = new Date().toISOString().split("T")[0];
        this.downloadFile(csv, `Thiran_Medicines_Stock_${dateStr}.csv`, "text/csv");
        this.showToast("Medicines CSV downloaded!");
    },

    downloadPurchasesCsv() {
        const csv = Store.exportPurchasesCSV();
        const dateStr = new Date().toISOString().split("T")[0];
        this.downloadFile(csv, `Thiran_Purchases_${dateStr}.csv`, "text/csv");
        this.showToast("Purchases CSV downloaded!");
    },

    resetDemoData() {
        if (confirm("Reset all data back to original pharmacy demo data? Custom changes will be reset.")) {
            Store.resetDefaults();
            this.updateBrandHeader();
            this.navigate(this.activeTab);
            this.closeAllModals();
            this.showToast("Sample data restored.");
        }
    }
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
