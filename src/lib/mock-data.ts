// Centralized mock data for the library management system.

export type Patron = {
  id: string;
  cardNumber: string;
  name: string;
  email: string;
  category: "Adult" | "Student" | "Senior" | "Staff" | "Juvenile";
  status: "Active" | "Suspended" | "Expired";
  fines: number;
  joined: string;
  // Staff fields — present only on patron records that are also library employees.
  // Granting staffRole gives this patron access to the staff dashboard.
  staffRole?: "Admin" | "Librarian" | "Cataloger" | "Circulation Clerk";
  staffBranch?: string;
  lastLogin?: string;
};

// A StaffUser is simply a Patron whose staffRole is set.
// There is no separate table — this matches how real ILS (Koha, Evergreen) work.
export type StaffUser = Patron & {
  staffRole: NonNullable<Patron["staffRole"]>;
  staffBranch: string;
  lastLogin: string;
};

export type BibRecord = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  callNumber: string;
  format: "MARC21" | "UNIMARC";
  subjects: string[];
  copies: number;
  available: number;
};

export type Checkout = {
  id: string;
  patron: string;
  cardNumber: string;
  title: string;
  barcode: string;
  checkedOut: string;
  dueDate: string;
  status: "On loan" | "Overdue" | "Returned";
  renewals: number;
};

export type Hold = {
  id: string;
  patron: string;
  title: string;
  placed: string;
  pickupBranch: string;
  position: number;
  status: "Waiting" | "Ready for pickup" | "In transit";
};

export type Vendor = {
  id: string;
  name: string;
  contact: string;
  email: string;
  activeOrders: number;
  totalSpent: number;
};

export type PurchaseOrder = {
  id: string;
  vendor: string;
  items: number;
  total: number;
  status: "Draft" | "Submitted" | "Received" | "Cancelled";
  created: string;
  fund: string;
};

export type Budget = {
  fund: string;
  allocated: number;
  spent: number;
  encumbered: number;
};

export type Subscription = {
  id: string;
  title: string;
  issn: string;
  vendor: string;
  frequency: "Weekly" | "Monthly" | "Quarterly" | "Annual";
  nextIssue: string;
  status: "Active" | "Lapsed" | "Renewing";
  lastReceived: string;
};

export type SerialIssue = {
  id: string;
  title: string;
  issue: string;
  expected: string;
  received: string | null;
  status: "Received" | "Expected" | "Claimed" | "Late";
};

// StaffUser is now defined near the top of this file as a Patron type alias.

export const patrons: Patron[] = [
  // ── Public borrowers ────────────────────────────────────────────────────────
  { id: "p1", cardNumber: "C-100245", name: "Eleanor Voss",       email: "e.voss@mail.com",       category: "Adult",    status: "Active",    fines: 0,    joined: "2021-03-14" },
  { id: "p2", cardNumber: "C-100871", name: "Marcus Holloway",    email: "marcus.h@mail.com",      category: "Student",  status: "Active",    fines: 4.5,  joined: "2023-09-02" },
  { id: "p3", cardNumber: "C-101120", name: "Priya Raman",        email: "p.raman@mail.com",       category: "Adult",    status: "Active",    fines: 0,    joined: "2019-11-20" },
  { id: "p4", cardNumber: "C-101455", name: "Jonas Eklund",       email: "j.eklund@mail.com",      category: "Senior",   status: "Active",    fines: 1.25, joined: "2017-05-08" },
  { id: "p5", cardNumber: "C-101602", name: "Aisha Bello",        email: "a.bello@mail.com",       category: "Adult",    status: "Suspended", fines: 22.0, joined: "2020-02-18" },
  { id: "p6", cardNumber: "C-101934", name: "Tomás Rivera",       email: "t.rivera@mail.com",      category: "Juvenile", status: "Active",    fines: 0,    joined: "2024-01-11" },
  { id: "p7", cardNumber: "C-102205", name: "Hana Watanabe",      email: "h.watanabe@mail.com",    category: "Staff",    status: "Active",    fines: 0,    joined: "2018-08-30" },
  { id: "p8", cardNumber: "C-102441", name: "Declan O'Hara",      email: "d.ohara@mail.com",       category: "Adult",    status: "Expired",   fines: 0,    joined: "2015-06-22" },
  // ── Staff patrons (also library employees — staffRole grants dashboard access) ─
  { id: "u1", cardNumber: "C-200001", name: "Margaret Carrington", email: "m.carrington@library.org", category: "Staff", status: "Active", fines: 0, joined: "2018-01-15", staffRole: "Admin",             staffBranch: "Central",    lastLogin: "2026-06-24 08:14" },
  { id: "u2", cardNumber: "C-200002", name: "James Okafor",        email: "j.okafor@library.org",     category: "Staff", status: "Active", fines: 0, joined: "2019-03-20", staffRole: "Librarian",         staffBranch: "Central",    lastLogin: "2026-06-24 07:58" },
  { id: "u3", cardNumber: "C-200003", name: "Sofía Mendez",        email: "s.mendez@library.org",     category: "Staff", status: "Active", fines: 0, joined: "2020-06-10", staffRole: "Cataloger",         staffBranch: "Riverside",  lastLogin: "2026-06-23 16:42" },
  { id: "u4", cardNumber: "C-200004", name: "Henrik Lindqvist",    email: "h.lindqvist@library.org",  category: "Staff", status: "Active", fines: 0, joined: "2021-09-01", staffRole: "Circulation Clerk", staffBranch: "Central",    lastLogin: "2026-06-24 09:02" },
  { id: "u5", cardNumber: "C-200005", name: "Aaliyah Brooks",      email: "a.brooks@library.org",     category: "Staff", status: "Active", fines: 0, joined: "2022-02-14", staffRole: "Librarian",         staffBranch: "North Hill", lastLogin: "2026-06-22 14:30" },
];

// Derived view: all patrons whose staffRole is set.
// Kept for backward compatibility — no separate table exists.
export const staffUsers: StaffUser[] = patrons.filter(
  (p): p is StaffUser => !!p.staffRole,
);

export const bibRecords: BibRecord[] = [
  { id: "b1", isbn: "9780143127741", title: "The Sympathizer", author: "Viet Thanh Nguyen", publisher: "Grove Press", year: 2015, callNumber: "PS3614.G97 S96", format: "MARC21", subjects: ["Fiction", "Vietnam War", "Espionage"], copies: 4, available: 2 },
  { id: "b2", isbn: "9780062316097", title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", publisher: "Harper", year: 2015, callNumber: "D20 .H318", format: "MARC21", subjects: ["History", "Anthropology"], copies: 6, available: 3 },
  { id: "b3", isbn: "9780525559474", title: "The Midnight Library", author: "Matt Haig", publisher: "Viking", year: 2020, callNumber: "PR6108.A36 M53", format: "MARC21", subjects: ["Fiction", "Philosophy"], copies: 5, available: 0 },
  { id: "b4", isbn: "9782070612758", title: "L'Étranger", author: "Albert Camus", publisher: "Gallimard", year: 1942, callNumber: "PQ2605.A3734 E8", format: "UNIMARC", subjects: ["Fiction", "French literature"], copies: 3, available: 3 },
  { id: "b5", isbn: "9780374533557", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", publisher: "FSG", year: 2011, callNumber: "BF441 .K238", format: "MARC21", subjects: ["Psychology", "Decision making"], copies: 4, available: 1 },
  { id: "b6", isbn: "9780393635829", title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", publisher: "W. W. Norton", year: 2017, callNumber: "QB982 .T97", format: "MARC21", subjects: ["Science", "Astronomy"], copies: 3, available: 2 },
  { id: "b7", isbn: "9788437604947", title: "Cien años de soledad", author: "Gabriel García Márquez", publisher: "Cátedra", year: 1967, callNumber: "PQ8180.17.A73 C5", format: "UNIMARC", subjects: ["Fiction", "Magic realism"], copies: 5, available: 4 },
  { id: "b8", isbn: "9780062273260", title: "Educated", author: "Tara Westover", publisher: "Random House", year: 2018, callNumber: "LC32 .W47", format: "MARC21", subjects: ["Biography", "Education"], copies: 4, available: 2 },
];

export const checkouts: Checkout[] = [
  { id: "co1", patron: "Eleanor Voss", cardNumber: "C-100245", title: "The Sympathizer", barcode: "31901-00045", checkedOut: "2026-06-10", dueDate: "2026-07-08", status: "On loan", renewals: 0 },
  { id: "co2", patron: "Marcus Holloway", cardNumber: "C-100871", title: "Sapiens", barcode: "31901-00112", checkedOut: "2026-05-22", dueDate: "2026-06-19", status: "Overdue", renewals: 1 },
  { id: "co3", patron: "Priya Raman", cardNumber: "C-101120", title: "Thinking, Fast and Slow", barcode: "31901-00203", checkedOut: "2026-06-18", dueDate: "2026-07-16", status: "On loan", renewals: 0 },
  { id: "co4", patron: "Jonas Eklund", cardNumber: "C-101455", title: "Educated", barcode: "31901-00321", checkedOut: "2026-06-01", dueDate: "2026-06-29", status: "On loan", renewals: 2 },
  { id: "co5", patron: "Hana Watanabe", cardNumber: "C-102205", title: "Astrophysics for People in a Hurry", barcode: "31901-00428", checkedOut: "2026-06-20", dueDate: "2026-07-18", status: "On loan", renewals: 0 },
  { id: "co6", patron: "Tomás Rivera", cardNumber: "C-101934", title: "The Midnight Library", barcode: "31901-00510", checkedOut: "2026-05-15", dueDate: "2026-06-12", status: "Overdue", renewals: 0 },
];

export const holds: Hold[] = [
  { id: "h1", patron: "Marcus Holloway", title: "The Midnight Library", placed: "2026-06-15", pickupBranch: "Central", position: 1, status: "Ready for pickup" },
  { id: "h2", patron: "Priya Raman", title: "The Sympathizer", placed: "2026-06-18", pickupBranch: "Riverside", position: 2, status: "Waiting" },
  { id: "h3", patron: "Eleanor Voss", title: "Sapiens", placed: "2026-06-19", pickupBranch: "Central", position: 1, status: "In transit" },
  { id: "h4", patron: "Jonas Eklund", title: "Educated", placed: "2026-06-20", pickupBranch: "Central", position: 3, status: "Waiting" },
];

export const vendors: Vendor[] = [
  { id: "v1", name: "Baker & Taylor", contact: "Sarah Lin", email: "orders@btol.com", activeOrders: 4, totalSpent: 28450.75 },
  { id: "v2", name: "Ingram Content Group", contact: "David Park", email: "library@ingram.com", activeOrders: 2, totalSpent: 19320.40 },
  { id: "v3", name: "EBSCO Information Services", contact: "Renée Dupont", email: "subs@ebsco.com", activeOrders: 7, totalSpent: 42870.00 },
  { id: "v4", name: "Midwest Library Service", contact: "Tom Becker", email: "service@mls.com", activeOrders: 1, totalSpent: 8965.20 },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2026-0142", vendor: "Baker & Taylor", items: 24, total: 612.40, status: "Submitted", created: "2026-06-12", fund: "Adult Fiction" },
  { id: "PO-2026-0143", vendor: "Ingram Content Group", items: 12, total: 348.90, status: "Received", created: "2026-06-08", fund: "Reference" },
  { id: "PO-2026-0144", vendor: "EBSCO Information Services", items: 6, total: 2840.00, status: "Submitted", created: "2026-06-15", fund: "Periodicals" },
  { id: "PO-2026-0145", vendor: "Midwest Library Service", items: 18, total: 489.75, status: "Draft", created: "2026-06-21", fund: "Children's" },
  { id: "PO-2026-0146", vendor: "Baker & Taylor", items: 9, total: 217.05, status: "Cancelled", created: "2026-05-30", fund: "Adult Non-Fiction" },
];

export const budgets: Budget[] = [
  { fund: "Adult Fiction", allocated: 35000, spent: 21450, encumbered: 4200 },
  { fund: "Adult Non-Fiction", allocated: 28000, spent: 14820, encumbered: 3100 },
  { fund: "Children's", allocated: 22000, spent: 16400, encumbered: 1800 },
  { fund: "Reference", allocated: 18000, spent: 9200, encumbered: 2400 },
  { fund: "Periodicals", allocated: 42000, spent: 31200, encumbered: 5600 },
  { fund: "Digital Resources", allocated: 55000, spent: 38700, encumbered: 7200 },
];

export const subscriptions: Subscription[] = [
  { id: "s1", title: "Nature", issn: "0028-0836", vendor: "EBSCO", frequency: "Weekly", nextIssue: "2026-06-27", status: "Active", lastReceived: "2026-06-20" },
  { id: "s2", title: "The New Yorker", issn: "0028-792X", vendor: "EBSCO", frequency: "Weekly", nextIssue: "2026-06-30", status: "Active", lastReceived: "2026-06-23" },
  { id: "s3", title: "Scientific American", issn: "0036-8733", vendor: "EBSCO", frequency: "Monthly", nextIssue: "2026-07-01", status: "Active", lastReceived: "2026-06-01" },
  { id: "s4", title: "Foreign Affairs", issn: "0015-7120", vendor: "EBSCO", frequency: "Quarterly", nextIssue: "2026-07-15", status: "Renewing", lastReceived: "2026-04-15" },
  { id: "s5", title: "National Geographic", issn: "0027-9358", vendor: "Baker & Taylor", frequency: "Monthly", nextIssue: "2026-07-05", status: "Active", lastReceived: "2026-06-05" },
  { id: "s6", title: "The Economist", issn: "0013-0613", vendor: "EBSCO", frequency: "Weekly", nextIssue: "2026-06-28", status: "Lapsed", lastReceived: "2026-05-31" },
];

export const serialIssues: SerialIssue[] = [
  { id: "si1", title: "Nature", issue: "Vol 632, No 8024", expected: "2026-06-20", received: "2026-06-20", status: "Received" },
  { id: "si2", title: "Nature", issue: "Vol 632, No 8025", expected: "2026-06-27", received: null, status: "Expected" },
  { id: "si3", title: "The New Yorker", issue: "Jun 23, 2026", expected: "2026-06-23", received: "2026-06-24", status: "Received" },
  { id: "si4", title: "Scientific American", issue: "Vol 334, No 6", expected: "2026-06-01", received: "2026-06-03", status: "Received" },
  { id: "si5", title: "The Economist", issue: "Jun 14, 2026", expected: "2026-06-14", received: null, status: "Claimed" },
  { id: "si6", title: "The Economist", issue: "Jun 21, 2026", expected: "2026-06-21", received: null, status: "Late" },
  { id: "si7", title: "Foreign Affairs", issue: "Jul/Aug 2026", expected: "2026-07-15", received: null, status: "Expected" },
];

// staffUsers is now a derived view of patrons — see declaration near the top of this file.

// ─── Extended data types ───────────────────────────────────────────────────

export type Fine = {
  id: string;
  patronId: string;
  patronName: string;
  cardNumber: string;
  itemTitle: string;
  barcode: string;
  type: "Overdue" | "Lost item" | "Damaged" | "Processing fee";
  amount: number;
  paid: boolean;
  date: string;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  active: boolean;
};

export type PatronCategory = {
  id: string;
  name: string;
  loanPeriod: number;
  maxCheckouts: number;
  maxRenewals: number;
  finePerDay: number;
  registrationFee: number;
  description: string;
};

export type ItemType = {
  id: string;
  code: string;
  description: string;
  loanPeriod: number;
  renewals: number;
  finePerDay: number;
  notForLoan: boolean;
};

export type Invoice = {
  id: string;
  poId: string;
  vendor: string;
  amount: number;
  invoiceDate: string;
  receivedDate: string;
  status: "Pending" | "Approved" | "Paid" | "Disputed";
  fund: string;
};

export type Notification = {
  id: string;
  type: "overdue" | "hold_ready" | "renewal" | "system" | "acquisition";
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export type RoutingSlip = {
  id: string;
  subscriptionId: string;
  title: string;
  recipients: string[];
  currentHolder: string;
  returnBy: string;
  status: "Active" | "Complete";
};

export type CirculationRule = {
  id: string;
  patronCategory: string;
  itemType: string;
  loanDays: number;
  renewals: number;
  finePerDay: number;
  maxCheckouts: number;
  holdable: boolean;
};

export type FineRule = {
  id: string;
  patronCategory: string;
  itemType: string;
  finePerDay: number;
  graceDays: number;
  maxFine: number;
  lostAfterDays: number;
  lostFee: number;
};

// ─── Extended mock data ────────────────────────────────────────────────────

export const fines: Fine[] = [
  { id: "f1", patronId: "p2", patronName: "Marcus Holloway", cardNumber: "C-100871", itemTitle: "Sapiens", barcode: "31901-00112", type: "Overdue", amount: 4.50, paid: false, date: "2026-06-19" },
  { id: "f2", patronId: "p4", patronName: "Jonas Eklund", cardNumber: "C-101455", itemTitle: "Educated", barcode: "31901-00321", type: "Overdue", amount: 1.25, paid: false, date: "2026-06-22" },
  { id: "f3", patronId: "p5", patronName: "Aisha Bello", cardNumber: "C-101602", itemTitle: "The Great Gatsby", barcode: "31901-00098", type: "Lost item", amount: 22.00, paid: false, date: "2026-05-10" },
  { id: "f4", patronId: "p1", patronName: "Eleanor Voss", cardNumber: "C-100245", itemTitle: "Brief History of Time", barcode: "31901-00077", type: "Overdue", amount: 2.00, paid: true, date: "2026-06-01" },
  { id: "f5", patronId: "p6", patronName: "Tomás Rivera", cardNumber: "C-101934", itemTitle: "The Midnight Library", barcode: "31901-00510", type: "Overdue", amount: 3.75, paid: false, date: "2026-06-12" },
  { id: "f6", patronId: "p3", patronName: "Priya Raman", cardNumber: "C-101120", itemTitle: "Dune", barcode: "31901-00142", type: "Damaged", amount: 15.00, paid: true, date: "2026-04-18" },
];

export const branches: Branch[] = [
  { id: "br1", name: "Central", address: "100 Main St, Springfield", phone: "555-0100", email: "central@athenaeum.lib", manager: "Margaret Carrington", active: true },
  { id: "br2", name: "Riverside", address: "45 River Rd, Springfield", phone: "555-0145", email: "riverside@athenaeum.lib", manager: "Sofía Mendez", active: true },
  { id: "br3", name: "North Hill", address: "220 Hill Ave, Springfield", phone: "555-0220", email: "northhill@athenaeum.lib", manager: "Aaliyah Brooks", active: true },
  { id: "br4", name: "Eastside Annex", address: "88 East Blvd, Springfield", phone: "555-0088", email: "eastside@athenaeum.lib", manager: "James Okafor", active: false },
];

export const patronCategories: PatronCategory[] = [
  { id: "pc1", name: "Adult", loanPeriod: 28, maxCheckouts: 30, maxRenewals: 2, finePerDay: 0.25, registrationFee: 0, description: "Standard adult borrower" },
  { id: "pc2", name: "Student", loanPeriod: 28, maxCheckouts: 50, maxRenewals: 3, finePerDay: 0.10, registrationFee: 0, description: "Enrolled students" },
  { id: "pc3", name: "Senior", loanPeriod: 42, maxCheckouts: 30, maxRenewals: 3, finePerDay: 0.10, registrationFee: 0, description: "Patrons age 65+" },
  { id: "pc4", name: "Juvenile", loanPeriod: 28, maxCheckouts: 20, maxRenewals: 3, finePerDay: 0.00, registrationFee: 0, description: "Under 18 years of age" },
  { id: "pc5", name: "Staff", loanPeriod: 90, maxCheckouts: 100, maxRenewals: 5, finePerDay: 0.00, registrationFee: 0, description: "Library staff members" },
];

export const itemTypes: ItemType[] = [
  { id: "it1", code: "BK", description: "Book", loanPeriod: 28, renewals: 2, finePerDay: 0.25, notForLoan: false },
  { id: "it2", code: "DVD", description: "DVD / Blu-ray", loanPeriod: 7, renewals: 1, finePerDay: 1.00, notForLoan: false },
  { id: "it3", code: "REF", description: "Reference", loanPeriod: 0, renewals: 0, finePerDay: 0.00, notForLoan: true },
  { id: "it4", code: "AUD", description: "Audiobook", loanPeriod: 21, renewals: 2, finePerDay: 0.25, notForLoan: false },
  { id: "it5", code: "PER", description: "Periodical (in-library)", loanPeriod: 0, renewals: 0, finePerDay: 0.00, notForLoan: true },
  { id: "it6", code: "MAP", description: "Map", loanPeriod: 14, renewals: 1, finePerDay: 0.50, notForLoan: false },
];

export const invoices: Invoice[] = [
  { id: "inv1", poId: "PO-2026-0143", vendor: "Ingram Content Group", amount: 348.90, invoiceDate: "2026-06-10", receivedDate: "2026-06-12", status: "Paid", fund: "Reference" },
  { id: "inv2", poId: "PO-2026-0142", vendor: "Baker & Taylor", amount: 612.40, invoiceDate: "2026-06-14", receivedDate: "2026-06-16", status: "Approved", fund: "Adult Fiction" },
  { id: "inv3", poId: "PO-2026-0144", vendor: "EBSCO Information Services", amount: 2840.00, invoiceDate: "2026-06-17", receivedDate: "2026-06-19", status: "Pending", fund: "Periodicals" },
  { id: "inv4", poId: "PO-2026-0141", vendor: "Baker & Taylor", amount: 425.00, invoiceDate: "2026-05-28", receivedDate: "2026-06-01", status: "Disputed", fund: "Adult Non-Fiction" },
  { id: "inv5", poId: "PO-2026-0139", vendor: "Midwest Library Service", amount: 315.00, invoiceDate: "2026-05-15", receivedDate: "2026-05-18", status: "Paid", fund: "Children's" },
];

export const notifications: Notification[] = [
  { id: "n1", type: "overdue", title: "2 items overdue", message: "Marcus Holloway (C-100871) and Tomás Rivera (C-101934) have overdue items.", date: "2026-06-24 08:00", read: false },
  { id: "n2", type: "hold_ready", title: "Hold ready for pickup", message: "The Midnight Library is ready for pickup at Central branch for Marcus Holloway.", date: "2026-06-23 15:30", read: false },
  { id: "n3", type: "acquisition", title: "PO received", message: "PO-2026-0143 from Ingram Content Group (12 items) has been fully received.", date: "2026-06-23 11:10", read: true },
  { id: "n4", type: "renewal", title: "Subscription renewing", message: "Foreign Affairs (ISSN 0015-7120) subscription is up for renewal — expires 2026-07-15.", date: "2026-06-22 09:00", read: false },
  { id: "n5", type: "system", title: "System maintenance", message: "Scheduled maintenance window: Sunday 29 Jun 02:00–04:00. System will be read-only.", date: "2026-06-21 10:00", read: true },
  { id: "n6", type: "overdue", title: "Serial claim required", message: "The Economist issues for Jun 14 and Jun 21 have not been received. Claim letters pending.", date: "2026-06-24 07:45", read: false },
];

export const routingSlips: RoutingSlip[] = [
  { id: "rs1", subscriptionId: "s1", title: "Nature", recipients: ["James Okafor", "Sofía Mendez", "Aaliyah Brooks"], currentHolder: "James Okafor", returnBy: "2026-06-30", status: "Active" },
  { id: "rs2", subscriptionId: "s2", title: "The New Yorker", recipients: ["Margaret Carrington", "Hana Watanabe"], currentHolder: "Margaret Carrington", returnBy: "2026-07-05", status: "Active" },
  { id: "rs3", subscriptionId: "s3", title: "Scientific American", recipients: ["James Okafor", "Henrik Lindqvist"], currentHolder: "Henrik Lindqvist", returnBy: "2026-07-10", status: "Complete" },
];

export const circulationRules: CirculationRule[] = [
  { id: "cr1", patronCategory: "Adult", itemType: "Book", loanDays: 28, renewals: 2, finePerDay: 0.25, maxCheckouts: 30, holdable: true },
  { id: "cr2", patronCategory: "Adult", itemType: "DVD", loanDays: 7, renewals: 1, finePerDay: 1.00, maxCheckouts: 5, holdable: true },
  { id: "cr3", patronCategory: "Student", itemType: "Book", loanDays: 28, renewals: 3, finePerDay: 0.10, maxCheckouts: 50, holdable: true },
  { id: "cr4", patronCategory: "Juvenile", itemType: "Book", loanDays: 28, renewals: 3, finePerDay: 0.00, maxCheckouts: 20, holdable: true },
  { id: "cr5", patronCategory: "Senior", itemType: "Book", loanDays: 42, renewals: 3, finePerDay: 0.10, maxCheckouts: 30, holdable: true },
  { id: "cr6", patronCategory: "Staff", itemType: "Any", loanDays: 90, renewals: 5, finePerDay: 0.00, maxCheckouts: 100, holdable: true },
];

export const fineRules: FineRule[] = [
  { id: "fr1", patronCategory: "Adult", itemType: "Book", finePerDay: 0.25, graceDays: 1, maxFine: 10.00, lostAfterDays: 90, lostFee: 30.00 },
  { id: "fr2", patronCategory: "Adult", itemType: "DVD", finePerDay: 1.00, graceDays: 0, maxFine: 20.00, lostAfterDays: 30, lostFee: 25.00 },
  { id: "fr3", patronCategory: "Student", itemType: "Book", finePerDay: 0.10, graceDays: 2, maxFine: 5.00, lostAfterDays: 90, lostFee: 30.00 },
  { id: "fr4", patronCategory: "Juvenile", itemType: "Book", finePerDay: 0.00, graceDays: 7, maxFine: 0.00, lostAfterDays: 120, lostFee: 15.00 },
  { id: "fr5", patronCategory: "Senior", itemType: "Book", finePerDay: 0.10, graceDays: 3, maxFine: 5.00, lostAfterDays: 90, lostFee: 30.00 },
  { id: "fr6", patronCategory: "Staff", itemType: "Any", finePerDay: 0.00, graceDays: 7, maxFine: 0.00, lostAfterDays: 180, lostFee: 0.00 },
];

export const sampleMarc = `=LDR  00000nam a2200000 a 4500
=001  ocn123456789
=005  20260612153045.0
=008  150114s2015\\\\nyu\\\\\\\\\\\\000\\1\\eng\\d
=020  \\\\$a9780143127741
=040  \\\\$aDLC$beng$cDLC
=100  1\\$aNguyen, Viet Thanh,$d1971-$eauthor.
=245  14$aThe sympathizer :$ba novel /$cViet Thanh Nguyen.
=260  \\\\$aNew York :$bGrove Press,$c2015.
=300  \\\\$a371 pages ;$c24 cm
=520  \\\\$aThe story of a communist double agent...
=650  \\0$aVietnam War, 1961-1975$vFiction.
=650  \\0$aSpies$vFiction.
=852  \\\\$aCentral$bFiction$hPS3614.G97$iS96 2015`;
