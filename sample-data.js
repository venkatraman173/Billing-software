/**
 * Medical Pharmacy Sample Data - THIRAN
 */

const DEFAULT_PHARMA_BUSINESS = {
    name: "THIRAN",
    gstNumber: "33ANBPV6835E2ZT",
    dlNo: "20B/21B-TN-98124/2022",
    email: "thiranpharma@gmail.com",
    phone: "+91 98401 23456",
    address: "No. 45, Gandhi Road, Healthcare Complex, Chennai - 600001",
    currencySymbol: "₹",
    currency: "INR",
    invoicePrefix: "TH/2026-27-",
    bankName: "HDFC Bank",
    bankAccNo: "50200012345678",
    bankIfsc: "HDFC0000240",
    bankBranch: "Anna Nagar, Chennai",
    terms: "1. Goods once sold will not be taken back without original bill.\n2. Subject to local jurisdiction. Consult physician before consumption.\n3. Schedule H/H1 drugs dispensed strictly on valid registered medical prescription."
};

const DEFAULT_PHARMA_SUPPLIERS = [
    {
        id: "sup-1",
        name: "Sun Pharma Distributors Ltd",
        contactPerson: "Rajesh Sharma",
        phone: "9876543210",
        email: "orders@sunpharma-dist.com",
        gstNumber: "33AAACS1234F1Z1",
        dlNo: "20B/8821/TN",
        address: "Plot 12, Industrial Estate, Guindy, Chennai",
        balance: 14500.00
    },
    {
        id: "sup-2",
        name: "Cipla Healthcare Agencies",
        contactPerson: "Venkatesh K",
        phone: "9845112233",
        email: "chennai.sales@cipla-agency.com",
        gstNumber: "33AABCC5544K1Z8",
        dlNo: "20B/4412/TN",
        address: "77 Mount Road, Teynampet, Chennai",
        balance: 8200.00
    },
    {
        id: "sup-3",
        name: "Abbott Healthcare Wholesale",
        contactPerson: "Arun Kumar",
        phone: "9940223344",
        email: "wholesale@abbott-dist.in",
        gstNumber: "33AABCA9988D1Z4",
        dlNo: "20B/6619/TN",
        address: "24 SIDCO Complex, Ambattur, Chennai",
        balance: 0.00
    }
];

const DEFAULT_PHARMA_CUSTOMERS = [
    {
        id: "cust-1",
        name: "Dr. K. Mohan M.D.",
        mobile: "9884011223",
        doctorReg: "TMC-48192",
        gstNumber: "33AABPK1122D1Z9",
        dlNo: "20B/1102/TN",
        address: "Lifecare Clinic, 14 Anna Nagar West, Chennai"
    },
    {
        id: "cust-2",
        name: "Apollo Pharmacy Sub-Store",
        mobile: "9841099887",
        doctorReg: "",
        gstNumber: "33AACCA8899F1Z3",
        dlNo: "20B/7712/TN",
        address: "21 Greams Road, Thousand Lights, Chennai"
    },
    {
        id: "cust-3",
        name: "Ramesh Babu (Patient)",
        mobile: "9789012345",
        doctorReg: "Dr. Suresh (Cardio)",
        gstNumber: "",
        dlNo: "",
        address: "4/12 Lake View Road, Adyar, Chennai"
    }
];

const DEFAULT_PHARMA_ITEMS = [
    {
        id: "med-1",
        name: "DOLO 650 MG TABLET",
        hsn: "3004",
        pack: "15's",
        batch: "DL2601",
        expiry: "11/27",
        stock: 120,
        minStock: 15,
        mrp: 34.50,
        purchaseRate: 22.00,
        rate: 30.50,
        gstPercent: 12,
        supplierId: "sup-1"
    },
    {
        id: "med-2",
        name: "AUGMENTIN 625 DUO TAB",
        hsn: "3004",
        pack: "10's",
        batch: "AG8902",
        expiry: "04/28",
        stock: 45,
        minStock: 10,
        mrp: 220.00,
        purchaseRate: 155.00,
        rate: 198.00,
        gstPercent: 12,
        supplierId: "sup-2"
    },
    {
        id: "med-3",
        name: "PAN 40 MG TABLET",
        hsn: "3004",
        pack: "15's",
        batch: "PN7741",
        expiry: "08/27",
        stock: 80,
        minStock: 10,
        mrp: 165.00,
        purchaseRate: 110.00,
        rate: 145.00,
        gstPercent: 12,
        supplierId: "sup-1"
    },
    {
        id: "med-4",
        name: "AZITHRAL 500 MG TAB",
        hsn: "3004",
        pack: "5's",
        batch: "AZ4419",
        expiry: "12/26",
        stock: 8, // Low Stock demo
        minStock: 10,
        mrp: 132.00,
        purchaseRate: 90.00,
        rate: 118.00,
        gstPercent: 12,
        supplierId: "sup-2"
    },
    {
        id: "med-5",
        name: "BENADRYL COUGH SYRUP",
        hsn: "3004",
        pack: "100ml",
        batch: "BN1022",
        expiry: "10/26",
        stock: 35,
        minStock: 10,
        mrp: 145.00,
        purchaseRate: 98.00,
        rate: 130.00,
        gstPercent: 12,
        supplierId: "sup-3"
    },
    {
        id: "med-6",
        name: "TELMA 40 MG TABLET",
        hsn: "3004",
        pack: "30's",
        batch: "TL9918",
        expiry: "03/28",
        stock: 60,
        minStock: 10,
        mrp: 290.00,
        purchaseRate: 195.00,
        rate: 260.00,
        gstPercent: 12,
        supplierId: "sup-3"
    }
];

const DEFAULT_PHARMA_PURCHASES = [
    {
        id: "pur-101",
        billNo: "PINV-7810",
        supplierId: "sup-1",
        supplierName: "Sun Pharma Distributors Ltd",
        date: "2026-09-20",
        totalAmount: 18500.00,
        taxType: "INTRA STATE",
        paymentType: "CREDIT",
        items: [
            {
                product: "DOLO 650 MG TABLET",
                hsn: "3004",
                pack: "15's",
                batch: "DL2601",
                expiry: "11/27",
                qty: 100,
                free: 10,
                mrp: 34.50,
                rate: 22.00,
                gstPercent: 12,
                amount: 2464.00
            },
            {
                product: "PAN 40 MG TABLET",
                hsn: "3004",
                pack: "15's",
                batch: "PN7741",
                expiry: "08/27",
                qty: 100,
                free: 5,
                mrp: 165.00,
                rate: 110.00,
                gstPercent: 12,
                amount: 12320.00
            }
        ]
    },
    {
        id: "pur-102",
        billNo: "PINV-9932",
        supplierId: "sup-2",
        supplierName: "Cipla Healthcare Agencies",
        date: "2026-09-25",
        totalAmount: 12200.00,
        taxType: "INTRA STATE",
        paymentType: "CASH",
        items: [
            {
                product: "AUGMENTIN 625 DUO TAB",
                hsn: "3004",
                pack: "10's",
                batch: "AG8902",
                expiry: "04/28",
                qty: 50,
                free: 5,
                mrp: 220.00,
                rate: 155.00,
                gstPercent: 12,
                amount: 8680.00
            }
        ]
    }
];

const DEFAULT_PHARMA_SUPPLIER_TXNS = [
    {
        id: "stx-1",
        supplierId: "sup-1",
        date: "2026-09-20",
        type: "PURCHASE",
        refNo: "PINV-7810",
        debit: 0,
        credit: 18500.00,
        balance: 18500.00,
        note: "Purchase Bill #PINV-7810"
    },
    {
        id: "stx-2",
        supplierId: "sup-1",
        date: "2026-09-24",
        type: "PAYMENT",
        refNo: "NEFT-99120",
        debit: 4000.00,
        credit: 0,
        balance: 14500.00,
        note: "Bank NEFT Payment"
    },
    {
        id: "stx-3",
        supplierId: "sup-2",
        date: "2026-09-25",
        type: "PURCHASE",
        refNo: "PINV-9932",
        debit: 0,
        credit: 12200.00,
        balance: 12200.00,
        note: "Purchase Bill #PINV-9932"
    },
    {
        id: "stx-4",
        supplierId: "sup-2",
        date: "2026-09-26",
        type: "PAYMENT",
        refNo: "CHQ-33104",
        debit: 4000.00,
        credit: 0,
        balance: 8200.00,
        note: "Cheque Payment"
    }
];

const DEFAULT_PHARMA_INVOICES = [
    {
        id: "inv-2001",
        invoiceNo: "TH/2026-27-000184",
        invoiceDate: "2026-09-30",
        taxType: "INTRA STATE",
        paymentType: "CASH",
        partyOrderNo: "--",
        orderDate: "--",
        dispatchedThrough: "Counter",
        lrRrNo: "LR-88219",
        lrRrDate: "2026-09-30",
        customer: {
            name: "Dr. K. Mohan M.D.",
            mobile: "9884011223",
            doctorReg: "TMC-48192",
            gstNumber: "33AABPK1122D1Z9",
            dlNo: "20B/1102/TN",
            address: "Lifecare Clinic, 14 Anna Nagar West, Chennai"
        },
        items: [
            {
                sl: 1,
                product: "DOLO 650 MG TABLET",
                hsn: "3004",
                pack: "15's",
                batch: "DL2601",
                expiry: "11/27",
                qty: 10,
                free: 1,
                mrp: 34.50,
                rate: 30.50,
                gstPercent: 12,
                amount: 341.60
            },
            {
                sl: 2,
                product: "PAN 40 MG TABLET",
                hsn: "3004",
                pack: "15's",
                batch: "PN7741",
                expiry: "08/27",
                qty: 5,
                free: 0,
                mrp: 165.00,
                rate: 145.00,
                gstPercent: 12,
                amount: 812.00
            }
        ],
        subtotal: 1030.00,
        cgst: 61.80,
        sgst: 61.80,
        taxAmount: 123.60,
        roundOff: 0.40,
        netAmount: 1154.00,
        status: "PAID"
    }
];
