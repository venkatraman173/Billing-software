/**
 * Pharmaceutical Invoice & Print Generator for THIRAN
 */

const InvoiceEngine = {
    formatMoney(val, symbol = "₹") {
        const num = Number(val) || 0;
        return `${symbol}${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    formatDate(dateStr) {
        if (!dateStr) return "N/A";
        try {
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    },

    numberToWords(amount) {
        const words = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const num = Math.round(Number(amount) || 0);
        if (num === 0) return "Zero Rupees Only";

        const convertLessThanOneThousand = (n) => {
            let str = "";
            if (n >= 100) {
                str += words[Math.floor(n / 100)] + " Hundred ";
                n %= 100;
            }
            if (n >= 20) {
                str += tens[Math.floor(n / 10)] + " ";
                n %= 10;
            }
            if (n > 0) {
                str += words[n] + " ";
            }
            return str.trim();
        };

        let result = "";
        const crore = Math.floor(num / 10000000);
        const lakh = Math.floor((num % 10000000) / 100000);
        const thousand = Math.floor((num % 100000) / 1000);
        const remainder = num % 1000;

        if (crore > 0) result += convertLessThanOneThousand(crore) + " Crore ";
        if (lakh > 0) result += convertLessThanOneThousand(lakh) + " Lakh ";
        if (thousand > 0) result += convertLessThanOneThousand(thousand) + " Thousand ";
        if (remainder > 0) result += convertLessThanOneThousand(remainder) + " ";

        return `Rupees ${result.trim()} Only`;
    },

    renderMedicalTaxInvoice(invoice, business) {
        const symbol = business.currencySymbol || "₹";
        const customer = invoice.customer || {};

        const rows = (invoice.items || []).map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">
          <strong>${item.product}</strong>
        </td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.hsn || "3004"}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.pack || "-"}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.batch || "-"}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.expiry || "-"}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px; font-weight: bold;">${item.qty}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.free || 0}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px 8px;">${this.formatMoney(item.mrp, symbol)}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px 8px;">${this.formatMoney(item.rate, symbol)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 4px;">${item.gstPercent}%</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">${this.formatMoney(item.amount, symbol)}</td>
      </tr>
    `).join("");

        return `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; font-size: 11.5px; line-height: 1.45; border: 1px solid #0f172a; padding: 18px;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 10px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">${business.name || 'THIRAN'}</h1>
          <div style="font-size: 12px; margin-top: 3px; color: #334155;">${business.address}</div>
          <div style="font-size: 11.5px; margin-top: 2px; color: #475569;">
            <strong>Phone:</strong> ${business.phone} &nbsp;|&nbsp; <strong>Email:</strong> ${business.email}
          </div>
          <div style="font-size: 12px; margin-top: 4px; font-weight: bold; color: #0f172a;">
            GSTIN: ${business.gstNumber} &nbsp;|&nbsp; D.L. No: ${business.dlNo}
          </div>
        </div>

        <div style="text-align: center; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; background-color: #f1f5f9; padding: 4px;">
          TAX INVOICE / BILL OF SUPPLY
        </div>

        <!-- Meta Details (Customer & Invoice) -->
        <div style="display: flex; justify-content: space-between; border: 1px solid #0f172a; padding: 10px; margin-bottom: 10px; background-color: #ffffff;">
          <div style="flex: 1.1; border-right: 1px solid #cbd5e1; padding-right: 12px;">
            <div style="font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px;">BILLED TO:</div>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${customer.name || "Counter Patient"}</div>
            <div><strong>Mobile:</strong> ${customer.mobile || "-"}</div>
            ${customer.doctorReg ? `<div><strong>Doctor Reg No:</strong> ${customer.doctorReg}</div>` : ""}
            ${customer.gstNumber ? `<div><strong>GSTIN:</strong> ${customer.gstNumber}</div>` : ""}
            ${customer.dlNo ? `<div><strong>D.L. No:</strong> ${customer.dlNo}</div>` : ""}
            <div><strong>Address:</strong> ${customer.address || "-"}</div>
          </div>
          <div style="flex: 0.9; padding-left: 14px;">
            <div><strong>INVOICE NO:</strong> <span style="font-weight: 800;">${invoice.invoiceNo}</span></div>
            <div><strong>INVOICE DATE:</strong> ${this.formatDate(invoice.invoiceDate)}</div>
            <div><strong>TAX TYPE:</strong> ${invoice.taxType || "INTRA STATE"}</div>
            <div><strong>PAYMENT TYPE:</strong> ${invoice.paymentType || "CASH"}</div>
            ${invoice.partyOrderNo && invoice.partyOrderNo !== '--' ? `<div><strong>Order No:</strong> ${invoice.partyOrderNo}</div>` : ""}
            ${invoice.dispatchedThrough ? `<div><strong>Dispatched Through:</strong> ${invoice.dispatchedThrough}</div>` : ""}
            ${invoice.lrRrNo ? `<div><strong>L.R. / R.R. No.:</strong> <span style="font-weight:bold;">${invoice.lrRrNo}</span> ${invoice.lrRrDate ? `(${this.formatDate(invoice.lrRrDate)})` : ''}</div>` : ""}
          </div>
        </div>

        <!-- Medicine Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">SL</th>
              <th style="border: 1px solid #0f172a; padding: 6px 8px; text-align: left;">PRODUCT NAME</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">HSN</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">PACK</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">BATCH</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">EXP</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">QTY</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">FREE</th>
              <th style="border: 1px solid #0f172a; padding: 6px 8px; text-align: right;">MRP</th>
              <th style="border: 1px solid #0f172a; padding: 6px 8px; text-align: right;">RATE</th>
              <th style="border: 1px solid #0f172a; padding: 6px 4px;">GST%</th>
              <th style="border: 1px solid #0f172a; padding: 6px 8px; text-align: right;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <!-- Summary & Tax Breakup -->
        <div style="display: flex; justify-content: space-between; border: 1px solid #0f172a; padding: 10px; margin-bottom: 10px;">
          <div style="flex: 1.2;">
            <div style="font-weight: 700; margin-bottom: 4px; color: #0f172a;">Amount in Words:</div>
            <div style="font-weight: 600; color: #1e293b;">${this.numberToWords(invoice.netAmount)}</div>
            ${business.bankAccNo ? `
              <div style="font-size: 10.5px; color: #334155; margin-top: 8px; padding: 6px 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
                <strong>Bank Details:</strong> ${business.bankName || 'Bank'} &nbsp;|&nbsp; 
                <strong>A/C:</strong> ${business.bankAccNo} &nbsp;|&nbsp; 
                <strong>IFSC:</strong> ${business.bankIfsc || '-'} ${business.bankBranch ? `&nbsp;|&nbsp; <strong>Branch:</strong> ${business.bankBranch}` : ''}
              </div>
            ` : ''}
            <div style="margin-top: 10px; font-size: 10px; color: #64748b; line-height: 1.5; white-space: pre-line;">
              ${business.terms || '• Goods once sold will not be taken back without original bill.\n• Subject to local jurisdiction. Consult physician before consumption.'}
            </div>
          </div>
          <div style="flex: 0.8; font-size: 12px; line-height: 1.7; padding-left: 14px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <strong>${this.formatMoney(invoice.subtotal, symbol)}</strong>
            </div>
            ${invoice.taxType === 'INTER STATE' ? `
              <div style="display: flex; justify-content: space-between;">
                <span>IGST:</span>
                <span>${this.formatMoney(invoice.taxAmount || ((invoice.cgst || 0) + (invoice.sgst || 0)), symbol)}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between;">
                <span>CGST:</span>
                <span>${this.formatMoney(invoice.cgst, symbol)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>SGST:</span>
                <span>${this.formatMoney(invoice.sgst, symbol)}</span>
              </div>
            `}
            ${invoice.roundOff ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Round Off:</span>
                <span>${invoice.roundOff > 0 ? '+' : ''}${invoice.roundOff.toFixed(2)}</span>
              </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 6px; margin-top: 4px; color: #0f172a;">
              <span>NET PAYABLE:</span>
              <span>${this.formatMoney(invoice.netAmount, symbol)}</span>
            </div>
          </div>
        </div>

        <!-- Footer Signature -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 10px;">
          <div style="font-size: 11px; color: #64748b;">
            <div>Prepared By: Counter Cashier</div>
            <div>E. &amp; O.E.</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 700; color: #0f172a;">For ${business.name || 'THIRAN'}</div>
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #0f172a; width: 170px; font-size: 11px; font-weight: 600; padding-top: 3px;">Authorized Signatory</div>
          </div>
        </div>

      </div>
    `;
    },

    renderThermalReceipt(invoice, business) {
        const symbol = business.currencySymbol || "₹";
        const customer = invoice.customer || {};
        const items = invoice.items || [];

        const itemRows = items.map((item, idx) => `
          <div style="margin-bottom: 6px;">
            <div style="font-weight: bold; font-size: 12px; display: flex; justify-content: space-between;">
              <span>${idx + 1}. ${item.product}</span>
              <span>${this.formatMoney(item.amount, symbol)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #475569; padding-left: 12px;">
              <span>Bat: ${item.batch || '-'} | Exp: ${item.expiry || '-'}</span>
              <span>${item.qty} ${item.free ? `+${item.free}` : ''} x ${item.rate} (${item.gstPercent}%)</span>
            </div>
          </div>
        `).join("");

        return `
      <div class="thermal-receipt-container" style="max-width: 320px; margin: 0 auto; padding: 16px 12px; font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 11px; color: #000000; background: #ffffff; line-height: 1.4; border: 1px dashed #94a3b8;">
        
        <!-- Store Header -->
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-size: 17px; font-weight: 900; letter-spacing: 1px;">${business.name || 'THIRAN'}</div>
          <div style="font-size: 10.5px; margin-top: 2px;">${business.address || ''}</div>
          <div style="font-size: 10px; margin-top: 2px;">Ph: ${business.phone || ''}</div>
          <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">GST: ${business.gstNumber || '-'} | DL: ${business.dlNo || '-'}</div>
        </div>

        <!-- Meta -->
        <div style="font-size: 11px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Bill: ${invoice.invoiceNo}</strong>
            <span>${this.formatDate(invoice.invoiceDate)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Pt: ${customer.name || 'Counter Patient'}</span>
            <span>${invoice.paymentType || 'CASH'}</span>
          </div>
          ${customer.mobile ? `<div>Mob: ${customer.mobile}</div>` : ''}
          ${customer.doctorReg ? `<div>Dr. Reg: ${customer.doctorReg}</div>` : ''}
        </div>

        <!-- Medicine List -->
        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          ${itemRows}
        </div>

        <!-- Totals -->
        <div style="font-size: 11.5px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${this.formatMoney(invoice.subtotal, symbol)}</span>
          </div>
          ${invoice.taxType === 'INTER STATE' ? `
            <div style="display: flex; justify-content: space-between;">
              <span>IGST:</span>
              <span>${this.formatMoney(invoice.taxAmount, symbol)}</span>
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between;">
              <span>CGST:</span>
              <span>${this.formatMoney(invoice.cgst, symbol)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>SGST:</span>
              <span>${this.formatMoney(invoice.sgst, symbol)}</span>
            </div>
          `}
          ${invoice.roundOff ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Round Off:</span>
              <span>${invoice.roundOff > 0 ? '+' : ''}${invoice.roundOff.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px;">
            <span>NET AMOUNT:</span>
            <span>${this.formatMoney(invoice.netAmount, symbol)}</span>
          </div>
          <div style="font-size: 9.5px; margin-top: 4px; font-style: italic;">
            ${this.numberToWords(invoice.netAmount)}
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 10px; margin-top: 10px;">
          <div>*** GET WELL SOON ***</div>
          <div style="margin-top: 3px; font-size: 9px; color: #475569;">Medicines cannot be returned without bill</div>
          <div style="margin-top: 8px; font-family: monospace; letter-spacing: 4px; font-weight: bold; font-size: 13px;">|||| ||||| |||| ||||||</div>
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Thank You! Visit Again</div>
        </div>

      </div>
    `;
    }
};
