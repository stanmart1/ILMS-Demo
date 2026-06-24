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

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Librarian" | "Cataloger" | "Circulation Clerk";
  branch: string;
  lastLogin: string;
};

export const patrons: Patron[] = [
  { id: "p1", cardNumber: "C-100245", name: "Eleanor Voss", email: "e.voss@mail.com", category: "Adult", status: "Active", fines: 0, joined: "2021-03-14" },
  { id: "p2", cardNumber: "C-100871", name: "Marcus Holloway", email: "marcus.h@mail.com", category: "Student", status: "Active", fines: 4.5, joined: "2023-09-02" },
  { id: "p3", cardNumber: "C-101120", name: "Priya Raman", email: "p.raman@mail.com", category: "Adult", status: "Active", fines: 0, joined: "2019-11-20" },
  { id: "p4", cardNumber: "C-101455", name: "Jonas Eklund", email: "j.eklund@mail.com", category: "Senior", status: "Active", fines: 1.25, joined: "2017-05-08" },
  { id: "p5", cardNumber: "C-101602", name: "Aisha Bello", email: "a.bello@mail.com", category: "Adult", status: "Suspended", fines: 22.0, joined: "2020-02-18" },
  { id: "p6", cardNumber: "C-101934", name: "Tomás Rivera", email: "t.rivera@mail.com", category: "Juvenile", status: "Active", fines: 0, joined: "2024-01-11" },
  { id: "p7", cardNumber: "C-102205", name: "Hana Watanabe", email: "h.watanabe@mail.com", category: "Staff", status: "Active", fines: 0, joined: "2018-08-30" },
  { id: "p8", cardNumber: "C-102441", name: "Declan O'Hara", email: "d.ohara@mail.com", category: "Adult", status: "Expired", fines: 0, joined: "2015-06-22" },
];

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

export const staffUsers: StaffUser[] = [
  { id: "u1", name: "Margaret Carrington", email: "m.carrington@library.org", role: "Admin", branch: "Central", lastLogin: "2026-06-24 08:14" },
  { id: "u2", name: "James Okafor", email: "j.okafor@library.org", role: "Librarian", branch: "Central", lastLogin: "2026-06-24 07:58" },
  { id: "u3", name: "Sofía Mendez", email: "s.mendez@library.org", role: "Cataloger", branch: "Riverside", lastLogin: "2026-06-23 16:42" },
  { id: "u4", name: "Henrik Lindqvist", email: "h.lindqvist@library.org", role: "Circulation Clerk", branch: "Central", lastLogin: "2026-06-24 09:02" },
  { id: "u5", name: "Aaliyah Brooks", email: "a.brooks@library.org", role: "Librarian", branch: "North Hill", lastLogin: "2026-06-22 14:30" },
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
