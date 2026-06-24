export type GlossaryCategoryName =
  | "Catalog & Metadata"
  | "Circulation"
  | "Patrons & Access"
  | "Serials"
  | "Acquisitions"
  | "Systems & Technology";

export type GlossaryTerm = {
  term: string;
  category: GlossaryCategoryName;
  definition: string;
  alsoKnownAs?: string;
};

export const GLOSSARY_CATEGORIES: GlossaryCategoryName[] = [
  "Catalog & Metadata",
  "Circulation",
  "Patrons & Access",
  "Serials",
  "Acquisitions",
  "Systems & Technology",
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── Catalog & Metadata ────────────────────────────────────────────────────

  {
    term: "Authority Control",
    category: "Catalog & Metadata",
    definition:
      "The practice of ensuring that names, subject headings, and titles are recorded consistently throughout the catalog. For example, 'Mark Twain,' 'Twain, Mark,' and 'Samuel Clemens' all refer to the same person — authority control establishes one official form and links the variants to it.",
  },
  {
    term: "Authority Record",
    category: "Catalog & Metadata",
    definition:
      "The official entry in an authority file, establishing the preferred (authorized) form of a name, subject, or title along with any variant forms. When a cataloger links a bibliographic record to an authority record, that heading is said to be 'authorized.'",
  },
  {
    term: "Bibliographic Record",
    category: "Catalog & Metadata",
    definition:
      "The catalog entry for a single title. It contains descriptive information about a work — title, author, edition, publisher, date, subject headings, and more. One bib record can be shared by many physical copies (see: Holdings). Think of it as the product description; each copy in the building is a separate holding.",
    alsoKnownAs: "Bib record, catalog record",
  },
  {
    term: "Call Number",
    category: "Catalog & Metadata",
    definition:
      "The shelf address of an item — a code that determines where the item lives in the building. Libraries use either the Dewey Decimal System (e.g. 823.914 ORW) or Library of Congress Classification (e.g. PR6065.A8) to assign call numbers based on subject. Following the call number on the spine label leads you straight to the book.",
  },
  {
    term: "Dewey Decimal System",
    category: "Catalog & Metadata",
    definition:
      "A numerical classification scheme for organizing library collections by subject, developed by Melvil Dewey in 1876. Divides all knowledge into ten main classes (000–999) and subdivides them further with decimals. Widely used in public and school libraries worldwide.",
  },
  {
    term: "Holdings",
    category: "Catalog & Metadata",
    definition:
      "The physical or digital copies of a title that a library actually owns. A single bibliographic record may link to many holding records — each representing one copy, at one branch, with its own barcode, call number, item type, and circulation status. If a bib record is the product description, each holding is an individual unit in stock.",
  },
  {
    term: "LCNAF",
    category: "Catalog & Metadata",
    definition:
      "Library of Congress Name Authority File. The official authority file for personal names, corporate names, conference names, and geographic names, maintained by the Library of Congress. Ensures that all works by, say, J.K. Rowling are cataloged under one consistent authorized form of her name.",
    alsoKnownAs: "Library of Congress Name Authority File",
  },
  {
    term: "LCSH",
    category: "Catalog & Metadata",
    definition:
      "Library of Congress Subject Headings. The most widely used controlled vocabulary for subject headings in English-language libraries, maintained by the Library of Congress. Examples: 'Cooking — Italy,' 'World War, 1939–1945 — Fiction.' LCSH headings let patrons find all materials on the same topic even when authors used different words.",
    alsoKnownAs: "Library of Congress Subject Headings",
  },
  {
    term: "MARC",
    category: "Catalog & Metadata",
    definition:
      "Machine-Readable Cataloging. The worldwide standard data format used to encode bibliographic and authority records. Structured as numbered fields and lettered subfields — for example, field 245 holds the title, field 100 holds the main author, and field 020 holds the ISBN. Invented by the Library of Congress in the 1960s, it is still used universally today.",
    alsoKnownAs: "Machine-Readable Cataloging",
  },
  {
    term: "MARC Editor",
    category: "Catalog & Metadata",
    definition:
      "The interface where catalogers create or edit MARC records by entering and modifying individual fields and subfields. Most catalogers import a base record from an external source (via Z39.50) and then use the editor to correct or enrich it for their local collection.",
  },
  {
    term: "Spine Label",
    category: "Catalog & Metadata",
    definition:
      "A small adhesive label attached to the spine (narrow side) of a book, displaying the item's call number. Spine labels let both staff and patrons locate items on the shelves and reshelve returned items in the correct spot.",
  },
  {
    term: "Subject Heading",
    category: "Catalog & Metadata",
    definition:
      "A standardized topic label assigned to a catalog record to describe what a book is about. Subject headings allow patrons to find all materials on the same topic even if different authors used different words to describe it. Most libraries use LCSH as their subject heading vocabulary.",
  },

  // ── Circulation ───────────────────────────────────────────────────────────

  {
    term: "Check-in",
    category: "Circulation",
    definition:
      "The transaction that records the return of a borrowed item. When an item is checked in, the system verifies whether any holds are waiting for it, whether fines are owed, and whether the item needs to go into transit to another branch.",
    alsoKnownAs: "Return",
  },
  {
    term: "Check-out",
    category: "Circulation",
    definition:
      "The transaction that lends a library item to a patron. The item is linked to the patron's card with a due date. The item's status changes to 'Checked out' and it is unavailable to other borrowers until returned.",
    alsoKnownAs: "Loan, issue, borrow",
  },
  {
    term: "Circulation",
    category: "Circulation",
    definition:
      "The department and set of processes that handle the lending of library materials — check-outs, returns, renewals, holds, fines, and transfers between branches. The circulation desk is typically the first counter you encounter when entering a library.",
    alsoKnownAs: "Access Services",
  },
  {
    term: "Fine",
    category: "Circulation",
    definition:
      "A monetary charge applied to a patron's account for returning an item late, or for items that are lost or damaged. Fine amounts and overdue grace periods are set in the library's circulation rules. Many libraries have moved to 'fine-free' policies to remove barriers for disadvantaged patrons.",
    alsoKnownAs: "Overdue fee, penalty",
  },
  {
    term: "Hold",
    category: "Circulation",
    definition:
      "A patron's request to borrow an item that is currently unavailable — checked out to someone else or located at another branch. When the item becomes available the patron is notified and the item is held at their chosen pickup branch. Holds expire if not collected within the hold expiry period.",
    alsoKnownAs: "Reserve, request, recall request",
  },
  {
    term: "Recall",
    category: "Circulation",
    definition:
      "A request asking a borrower to return an item before its due date, typically because another patron urgently needs it or it is required for course reserves. Recalls are more common in academic libraries than in public libraries.",
  },
  {
    term: "Renewal",
    category: "Circulation",
    definition:
      "Extending the loan period for an item a patron already has checked out. Renewals can usually be done in person, by phone, or online through the OPAC. A renewal may be blocked if another patron has placed a hold on the item or if the maximum number of renewals has been reached.",
  },
  {
    term: "Transit",
    category: "Circulation",
    definition:
      "The state of an item being transferred between library branches — for example, to fulfill a hold placed at a different branch, or to return an item to its home location after it was returned at another branch. An item 'in transit' is not available for borrowing until it arrives and is checked in at its destination.",
  },

  // ── Patrons & Access ──────────────────────────────────────────────────────

  {
    term: "ILL",
    category: "Patrons & Access",
    definition:
      "Interlibrary Loan. A service that allows a patron to borrow a book or article from another library when the home library does not own it. The home library submits a request to a partner library, which sends the item directly. ILL dramatically expands the range of materials any single library can provide.",
    alsoKnownAs: "Interlibrary Loan",
  },
  {
    term: "Library Card",
    category: "Patrons & Access",
    definition:
      "A card issued to a registered patron carrying their unique card number, used to identify them when checking out materials, logging into the OPAC, or requesting services. Modern library cards often double as a barcode that can be scanned at the desk.",
    alsoKnownAs: "Patron card, borrower card, membership card",
  },
  {
    term: "OPAC",
    category: "Patrons & Access",
    definition:
      "Online Public Access Catalog. The public-facing search interface that lets anyone — patrons, students, walk-ins — search the library's catalog, check item availability, place holds, and manage their account. It is the 'customer-facing' side of the library system; everything else is staff-only.",
    alsoKnownAs: "Online Public Access Catalog, library catalog, discovery layer",
  },
  {
    term: "Patron",
    category: "Patrons & Access",
    definition:
      "A registered user of the library who is authorized to borrow materials and access library services. Patrons are assigned a category (e.g. Adult, Student, Senior) that determines their loan periods, item limits, and fine rules.",
    alsoKnownAs: "Member, borrower, user, cardholder",
  },

  // ── Serials ───────────────────────────────────────────────────────────────

  {
    term: "Claim",
    category: "Serials",
    definition:
      "A formal complaint sent to a serial vendor when an expected issue has not arrived within the grace period defined by the prediction pattern. The claim notifies the vendor that the library did not receive the issue and requests a replacement or explanation. Claims are tracked until they are resolved.",
  },
  {
    term: "Issue Check-in",
    category: "Serials",
    definition:
      "The process of marking a received serial issue as arrived. When a new issue of a journal or magazine arrives, staff check it in against the predicted issue list. The system marks it received, stamps it with the arrival date, and makes it available to patrons.",
  },
  {
    term: "Prediction Pattern",
    category: "Serials",
    definition:
      "A template that tells the system when to expect future issues of a serial based on its publication schedule. Defines the frequency (e.g. weekly, monthly, quarterly), the day of publication, and a grace period (how many days late before flagging it as missing). The system uses the pattern to automatically generate a checklist of expected upcoming issues.",
  },
  {
    term: "Routing",
    category: "Serials",
    definition:
      "A workflow where a new serial issue is passed sequentially to a list of readers — for example, department staff — before being shelved for general use. A routing slip travels with the issue and each reader signs off when finished. Common in special and corporate libraries.",
  },
  {
    term: "Serials",
    category: "Serials",
    definition:
      "Publications issued on a recurring schedule, such as journals, magazines, newspapers, annuals, and loose-leaf services. Unlike a monograph (a book bought once), a serial is an ongoing subscription where new issues keep arriving. Managing serials is its own discipline because of the complexity of tracking expected vs. received issues, claims, and renewals.",
  },
  {
    term: "Subscription",
    category: "Serials",
    definition:
      "A library's formal agreement with a vendor to receive all issues of a serial for a defined period — usually one year — in exchange for payment. The subscription record tracks the title, vendor, price, start and end dates, receiving branch, and number of copies.",
  },

  // ── Acquisitions ──────────────────────────────────────────────────────────

  {
    term: "Acquisitions",
    category: "Acquisitions",
    definition:
      "The department and processes responsible for selecting, ordering, receiving, and paying for library materials — books, journals, databases, and other resources. Acquisitions staff manage vendor relationships, budgets, purchase orders, and invoices.",
  },
  {
    term: "EDI",
    category: "Acquisitions",
    definition:
      "Electronic Data Interchange. A standardized electronic format for exchanging business documents — orders, invoices, shipping confirmations — between libraries and vendors automatically, without manual data entry. The library equivalent of B2B e-commerce integration. The common library EDI standard is EDIFACT.",
    alsoKnownAs: "Electronic Data Interchange, EDIFACT",
  },
  {
    term: "Encumbrance",
    category: "Acquisitions",
    definition:
      "Money that has been committed (reserved) for a purchase order but has not yet been paid out. Once an invoice arrives and is paid, the encumbrance is converted into an actual expenditure and the fund balance is reduced. Tracking encumbrances gives an accurate picture of how much money is truly available.",
  },
  {
    term: "Fund",
    category: "Acquisitions",
    definition:
      "A designated pool of money set aside for purchasing library materials. Libraries typically maintain multiple funds — for adult fiction, reference, children's, periodicals, digital resources, etc. — each with its own allocated budget. Funds prevent overspending in one area from depleting money meant for another.",
    alsoKnownAs: "Budget line, fund code",
  },
  {
    term: "Invoice",
    category: "Acquisitions",
    definition:
      "A bill from a vendor for materials that have been delivered. Library staff match invoices against purchase orders to verify that quantities and prices are correct before approving payment. Discrepancies are disputed directly with the vendor.",
  },
  {
    term: "Purchase Order",
    category: "Acquisitions",
    definition:
      "A formal document sent to a vendor listing the items the library wants to buy, their quantities, and agreed prices. A PO is a legal commitment to pay and triggers an encumbrance against the relevant fund. When items arrive, the PO is marked as received.",
    alsoKnownAs: "PO",
  },
  {
    term: "Vendor",
    category: "Acquisitions",
    definition:
      "A company or supplier that sells books or other library materials. Libraries often have preferred-vendor relationships with negotiated discount rates, approval plan arrangements, and EDI integration. Common library vendors include Baker & Taylor, Ingram, and EBSCO.",
  },

  // ── Systems & Technology ──────────────────────────────────────────────────

  {
    term: "Barcode",
    category: "Systems & Technology",
    definition:
      "A unique machine-readable number printed on a label attached to each library item and patron card. Barcodes identify items at the point of checkout or return and are the primary way the system matches a physical copy to its catalog record and patron account.",
  },
  {
    term: "ILS",
    category: "Systems & Technology",
    definition:
      "Integrated Library System. The software platform that manages all core library functions — cataloging, circulation, acquisitions, serials, and the OPAC — in a single integrated system. Athenaeum is an example of an ILS. Also increasingly called a Library Services Platform (LSP).",
    alsoKnownAs: "Library Management System (LMS), Library Services Platform (LSP)",
  },
  {
    term: "RFID",
    category: "Systems & Technology",
    definition:
      "Radio-Frequency Identification. A technology that uses tiny embedded chips and radio signals to identify items without a direct line of sight, unlike barcodes. RFID-tagged items can be checked out at self-service kiosks, and entire shelves can be inventoried by passing a reader down the aisle.",
  },
  {
    term: "SRU",
    category: "Systems & Technology",
    definition:
      "Search/Retrieve via URL. A modern, web-friendly protocol for querying remote library catalogs using standard HTTP requests and XML responses. SRU is the successor to Z39.50, offering the same catalog-to-catalog record retrieval over a simpler interface that works naturally with web applications.",
    alsoKnownAs: "Search/Retrieve via URL, SRW",
  },
  {
    term: "Z39.50",
    category: "Systems & Technology",
    definition:
      "A network protocol (standardized in 1988) that allows one library system to search and retrieve records from another library's catalog remotely. Catalogers use it to import ready-made MARC records from sources like the Library of Congress or WorldCat instead of typing catalog data from scratch. The 'Z39.50 Servers' setting in Admin configures which external catalogs your system can query.",
  },
];
