/**
 * Server-side PDF receipt generation for membership payments and renewals.
 *
 * WHAT IT RENDERS - one clean A4 portrait "Focus Fitness" membership receipt:
 *   1. Header      - orange brand bar, logo + gym identity, RECEIPT / MEMBER COPY
 *   2. Information - receipt no, receipt date, payment status, member name,
 *                    member code, contact number
 *   3. Fees table  - fees name, package, total fees, already paid, paid fees,
 *                    balance
 *   4. Validity    - membership start date, end date, duration
 *   5. Summary     - total amount, discount, gross amount, final amount paid,
 *                    balance due, payment mode, amount in words
 *   6. Footer      - policy text, signature area, gym contact strip
 *
 * DATA RULES - existing values only, no new fields and no schema change:
 *   membership.amount       plan total before discount -> "Total Amount"
 *   membership.discount     discount                   -> "Discount"
 *   membership.finalAmount  discounted gross payable   -> "Gross Amount"
 *   payment.amount          money actually received    -> "Final Amount Paid"
 *   alreadyPaidBefore       money received on this membership before this
 *                           receipt (optional, supplied by the caller)
 *   balance due             max(0, gross - already paid - paid now)
 *
 * Dates are rendered from UTC calendar dates (lib/datetime.ts), matching the
 * previous implementation, so a receipt never shifts by a day. The standard PDF
 * fonts use WinAnsi encoding and cannot encode the rupee sign, therefore amounts
 * are printed as "Rs. 1,500.00".
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import {
  formatUtcDateForDisplay,
  getDateStringInTimeZone,
} from "@/lib/datetime";

export type RenewalReceiptData = {
  gymName: string;
  gymPhone?: string | null;
  gymEmail?: string | null;
  gymAddress?: string | null;
  gymLogo?: string | null;

  memberName: string;
  memberPhone: string;
  memberCode?: string | null;

  planName: string;
  /** Receipt date - when this payment was received (payment.paymentDate). */
  renewalDate: Date;
  startDate: Date;
  endDate: Date;

  /** Membership plan total before discount (membership.amount). */
  amount: number;
  /** Discount granted on this membership (membership.discount). */
  discount: number;
  /** Discounted / gross payable membership amount (membership.finalAmount). */
  finalAmount: number;
  /** Money received for this receipt (payment.amount). Defaults to finalAmount. */
  paidAmount?: number | null;
  /** Money received on this membership before this receipt. Defaults to 0. */
  alreadyPaidBefore?: number | null;

  paymentMode: string;
  paymentStatus: string;
  receiptNumber: string;
  transactionId?: string | null;
};

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_LEFT = MARGIN;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

/** Focus Fitness orange brand palette. */
const ORANGE = rgb(0.918, 0.345, 0.047); // #EA580C
const ORANGE_DARK = rgb(0.486, 0.176, 0.071); // #7C2D12
const ORANGE_SOFT = rgb(1, 0.929, 0.835); // #FFEDD5
const ORANGE_BAND = rgb(1, 0.969, 0.929); // #FFF7ED

const INK = rgb(0.059, 0.09, 0.165); // #0F172A
const MUTED = rgb(0.392, 0.455, 0.545); // #64748B
const SUBTLE = rgb(0.58, 0.639, 0.722); // #94A3B8
const BORDER = rgb(0.886, 0.91, 0.941); // #E2E8F0
const BORDER_STRONG = rgb(0.796, 0.835, 0.882); // #CBD5E1
const PANEL = rgb(0.973, 0.98, 0.988); // #F8FAFC
const WHITE = rgb(1, 1, 1);

const GREEN = rgb(0.016, 0.471, 0.341); // #047857
const GREEN_SOFT = rgb(0.925, 0.992, 0.961); // #ECFDF5
const AMBER = rgb(0.706, 0.325, 0.035); // #B45309
const AMBER_SOFT = rgb(1, 0.984, 0.922); // #FFFBEB

type PdfColor = ReturnType<typeof rgb>;
type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

type FeeColumn = { label: string; width: number; align: "left" | "right" };

/** Fee table columns - the widths add up to the full content width. */
const FEE_COLUMNS: FeeColumn[] = [
  { label: "#", width: 16, align: "left" },
  { label: "Fees Name", width: 98, align: "left" },
  { label: "Package / Membership Plan", width: 112, align: "left" },
  { label: "Total Fees", width: 71.32, align: "right" },
  { label: "Already Paid", width: 71.32, align: "right" },
  { label: "Paid Fees", width: 71.32, align: "right" },
  { label: "Balance", width: 71.32, align: "right" },
];

/** Padding kept between a cell edge and its text. */
const CELL_PADDING = 16;

/** Round to paise so floating point noise never reaches the receipt. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Coerce any incoming number to a safe, non-negative money value. */
function toAmount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, round2(value));
}

/** Rupee amount with Indian grouping: 1500 -> "Rs. 1,500.00". */
export function formatReceiptAmount(value: number): string {
  return `Rs. ${toAmount(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Professional filename: MemberName_Renewal_Receipt_YYYY-MM-DD.pdf */
export function buildReceiptFilename(
  memberName: string,
  paymentDate: Date
): string {
  const safeName =
    memberName
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Member";
  const dateStr = paymentDate.toISOString().slice(0, 10);
  return `${safeName}_Renewal_Receipt_${dateStr}.pdf`;
}
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a payment timestamp as 'DD MMM YYYY' in the gym's local timezone.
 * Defaults to 'Asia/Kolkata' for Indian gyms. Uses the project's existing
 * getDateStringInTimeZone from lib/datetime.ts.
 */
export function formatReceiptDateInTimeZone(
  date: Date,
  timeZone: string = "Asia/Kolkata"
): string {
  const dateStr = getDateStringInTimeZone(date, timeZone); // 'YYYY-MM-DD'
  const [year, monthStr, dayStr] = dateStr.split("-");
  const monthIdx = parseInt(monthStr, 10) - 1;
  const month = MONTH_NAMES[monthIdx] ?? monthStr;
  return `${dayStr} ${month} ${year}`;
}


const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

function twoDigitWords(value: number): string {
  if (value < 20) return ONES[value];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones > 0 ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigitWords(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) parts.push(twoDigitWords(rest));
  return parts.join(" ");
}

/** Indian numbering system: crore / lakh / thousand / hundred. */
function integerToIndianWords(value: number): string {
  if (value <= 0) return "Zero";
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundreds = value % 1000;
  const parts: string[] = [];
  if (crore > 0) parts.push(`${integerToIndianWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundreds > 0) parts.push(threeDigitWords(hundreds));
  return parts.join(" ");
}

/**
 * Amount in words, Indian numbering system:
 * 1250.5 -> "One Thousand Two Hundred Fifty Rupees and Fifty Paise Only"
 */
export function formatReceiptAmountInWords(value: number): string {
  const safe = toAmount(value);
  let rupees = Math.floor(safe);
  let paise = Math.round((safe - rupees) * 100);
  if (paise >= 100) {
    rupees += 1;
    paise = 0;
  }
  const parts = [`${integerToIndianWords(rupees)} Rupees`];
  if (paise > 0) parts.push(`and ${twoDigitWords(paise)} Paise`);
  return `${parts.join(" ")} Only`;
}

/** Collapse whitespace the same way the header always did. */
function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Shorten text with a trailing ellipsis so it always fits its cell. */
function truncateToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string {
  const value = cleanText(text);
  if (value.length === 0) return value;
  if (maxWidth <= 0 || font.widthOfTextAtSize(value, size) <= maxWidth) {
    return value;
  }
  let clipped = value;
  while (
    clipped.length > 1 &&
    font.widthOfTextAtSize(`${clipped}...`, size) > maxWidth
  ) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trimEnd()}...`;
}

/** Greedy wrap limited to `maxLines`, truncating whatever does not fit. */
function wrapToWidth(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });
  if (current) lines.push(current);

  const limit = Math.max(1, maxLines);
  const limited = lines.slice(0, limit);
  if (limited.length === 0) return [""];
  if (lines.length > limit) {
    limited[limited.length - 1] = `${limited[limited.length - 1]} ${lines
      .slice(limit)
      .join(" ")}`;
  }
  return limited.map((line) => truncateToWidth(line, font, size, maxWidth));
}

/** Largest font size (down to 6.5) at which the value still fits its column. */
function fitFontSize(
  text: string,
  font: PDFFont,
  preferredSize: number,
  maxWidth: number
): number {
  // Very large rupee values (lakhs/crores) step down a little before they are
  // ever truncated, so a money value is never clipped on the receipt.
  const sizes = [
    preferredSize,
    preferredSize - 0.5,
    preferredSize - 1,
    8.5,
    8,
    7.5,
    7,
    6.5,
  ];
  for (const size of sizes) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return size;
  }
  return sizes[sizes.length - 1];
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: PdfColor = INK
): void {
  if (text.length === 0) return;
  page.drawText(text, { x, y, size, font, color });
}

function drawTextRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: PdfColor = INK
): void {
  if (text.length === 0) return;
  page.drawText(text, {
    x: rightX - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color,
  });
}

function drawTextCenter(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: PdfColor = INK
): void {
  if (text.length === 0) return;
  page.drawText(text, {
    x: centerX - font.widthOfTextAtSize(text, size) / 2,
    y,
    size,
    font,
    color,
  });
}

/**
 * Embed the gym logo from the existing branding source (data URL or http(s)
 * URL). The logo is decorative: any failure simply falls back to text only,
 * exactly as before.
 */
async function tryEmbedLogo(
  pdfDoc: PDFDocument,
  logo?: string | null
): Promise<PDFImage | null> {
  if (!logo) return null;
  try {
    const dataUrlMatch = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(logo);
    if (dataUrlMatch) {
      const bytes = Buffer.from(dataUrlMatch[2], "base64");
      return dataUrlMatch[1] === "image/png"
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    }
    if (/^https?:\/\//i.test(logo)) {
      const response = await fetch(logo, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.byteLength === 0) return null;
      return /\.png(\?|$)/i.test(logo)
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
    }
  } catch {
    // Logo is decorative - never fail the receipt because of it.
  }
  return null;
}

// Section building blocks -------------------------------------------------

/** Orange section label with a hairline rule underneath. */
function drawSectionTitle(
  page: PDFPage,
  title: string,
  y: number,
  fonts: Fonts
): void {
  drawText(page, title.toUpperCase(), CONTENT_LEFT, y, fonts.bold, 9, ORANGE);
  page.drawLine({
    start: { x: CONTENT_LEFT, y: y - 5.5 },
    end: { x: CONTENT_RIGHT, y: y - 5.5 },
    thickness: 0.6,
    color: BORDER,
  });
}

type FieldGridOptions = {
  columns: number;
  top: number;
  rowHeight: number;
  fonts: Fonts;
  fill?: PdfColor;
  border?: PdfColor;
};

/**
 * Aligned label/value grid used for the receipt/member information block and
 * the membership validity strip. Returns the bottom edge of the grid.
 */
function drawFieldGrid(
  page: PDFPage,
  fields: Array<{ label: string; value: string; color?: PdfColor }>,
  options: FieldGridOptions
): number {
  const { columns, top, rowHeight, fonts, fill = PANEL, border = BORDER } =
    options;
  const rows = Math.max(1, Math.ceil(fields.length / columns));
  const height = rows * rowHeight;
  const bottom = top - height;
  const cellWidth = CONTENT_WIDTH / columns;

  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height,
    color: fill,
  });

  for (let column = 1; column < columns; column += 1) {
    const x = CONTENT_LEFT + cellWidth * column;
    page.drawLine({
      start: { x, y: bottom },
      end: { x, y: top },
      thickness: 0.5,
      color: border,
    });
  }
  for (let row = 1; row < rows; row += 1) {
    const y = top - rowHeight * row;
    page.drawLine({
      start: { x: CONTENT_LEFT, y },
      end: { x: CONTENT_RIGHT, y },
      thickness: 0.5,
      color: border,
    });
  }

  fields.forEach((field, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cellTop = top - rowHeight * row;
    const x = CONTENT_LEFT + cellWidth * column + 11;
    drawText(
      page,
      field.label.toUpperCase(),
      x,
      cellTop - rowHeight * 0.42,
      fonts.regular,
      7,
      SUBTLE
    );
    drawText(
      page,
      truncateToWidth(field.value, fonts.bold, 10.5, cellWidth - 22),
      x,
      cellTop - rowHeight * 0.78,
      fonts.bold,
      10.5,
      field.color ?? INK
    );
  });

  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height,
    borderColor: border,
    borderWidth: 0.8,
  });

  return bottom;
}

/**
 * Fees table: orange header row plus a single membership fee row. Only values
 * the data model actually holds are rendered - nothing is invented.
 */
function drawFeesTable(
  page: PDFPage,
  cells: Array<{ value: string; strong?: boolean; color?: PdfColor }>,
  top: number,
  fonts: Fonts
): number {
  const headerHeight = 24;
  const rowHeight = 26;
  const headerBottom = top - headerHeight;
  const bottom = headerBottom - rowHeight;
  const headerCenter = headerBottom + headerHeight / 2;
  const headerLineGap = 9.5;

  page.drawRectangle({
    x: CONTENT_LEFT,
    y: headerBottom,
    width: CONTENT_WIDTH,
    height: headerHeight,
    color: ORANGE,
  });

  // Header labels: vertically centred, wrapped to at most two lines.
  let headerX = CONTENT_LEFT;
  FEE_COLUMNS.forEach((column) => {
    const lines = wrapToWidth(column.label, fonts.bold, 8, column.width - 14, 2);
    const lastBaseline =
      headerCenter - 2.5 - ((lines.length - 1) * headerLineGap) / 2;
    lines.forEach((line, index) => {
      const baseline = lastBaseline + (lines.length - 1 - index) * headerLineGap;
      if (column.align === "right") {
        drawTextRight(
          page,
          line,
          headerX + column.width - 7,
          baseline,
          fonts.bold,
          8,
          WHITE
        );
      } else {
        drawText(page, line, headerX + 7, baseline, fonts.bold, 8, WHITE);
      }
    });
    headerX += column.width;
  });

  // Body row.
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height: rowHeight,
    color: WHITE,
  });

  const baseline = headerBottom - 15.5;
  let bodyX = CONTENT_LEFT;
  FEE_COLUMNS.forEach((column, index) => {
    const cell = cells[index];
    if (!cell) return;
    const font = cell.strong ? fonts.bold : fonts.regular;
    if (column.align === "right") {
      const size = fitFontSize(cell.value, font, 9.5, column.width - CELL_PADDING);
      drawTextRight(
        page,
        truncateToWidth(cell.value, font, size, column.width - CELL_PADDING),
        bodyX + column.width - 8,
        baseline,
        font,
        size,
        cell.color ?? INK
      );
    } else {
      drawText(
        page,
        truncateToWidth(cell.value, font, 9.5, column.width - CELL_PADDING),
        bodyX + 8,
        baseline,
        font,
        9.5,
        cell.color ?? INK
      );
    }
    bodyX += column.width;
  });

  // Thin column guides, then the outer border on top of them.
  let dividerX = CONTENT_LEFT;
  FEE_COLUMNS.slice(0, -1).forEach((column) => {
    dividerX += column.width;
    page.drawLine({
      start: { x: dividerX, y: bottom },
      end: { x: dividerX, y: headerBottom },
      thickness: 0.5,
      color: BORDER,
    });
  });
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height: top - bottom,
    borderColor: BORDER_STRONG,
    borderWidth: 0.8,
  });

  return bottom;
}

type PaymentSummaryInput = {
  totalAmount: number;
  discount: number;
  grossAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: string;
  transactionId?: string | null;
  amountInWords: string;
};

/**
 * Payment summary card. The amount received is the visual anchor of the
 * receipt, the balance due sits directly underneath it, and the amount in
 * words closes the card. Returns the bottom edge of the card.
 */
function drawPaymentSummary(
  page: PDFPage,
  input: PaymentSummaryInput,
  top: number,
  fonts: Fonts
): number {
  const padX = 12;
  const moneyRowHeight = 19;
  const paidBandHeight = 30;
  const balanceBandHeight = 28;
  const metaRowHeight = 19;
  const wordsHeight = 40;

  const moneyBaselines = [
    top - 21,
    top - 21 - moneyRowHeight,
    top - 21 - moneyRowHeight * 2,
  ];
  const dividerY = moneyBaselines[2] - 8;
  const paidBandTop = dividerY - 8;
  const paidBandBottom = paidBandTop - paidBandHeight;
  const balanceBandTop = paidBandBottom - 6;
  const balanceBandBottom = balanceBandTop - balanceBandHeight;

  const metaRows: Array<[string, string]> = [
    ["Payment Mode", input.paymentMode],
  ];
  const reference = input.transactionId?.trim();
  if (reference) metaRows.push(["Transaction / Reference ID", reference]);
  const metaBaselines = metaRows.map(
    (_, index) => balanceBandBottom - 17 - index * metaRowHeight
  );
  const wordsTop = metaBaselines[metaBaselines.length - 1] - 13;
  const bottom = wordsTop - wordsHeight;

  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height: top - bottom,
    color: WHITE,
  });

  const moneyRows: Array<[string, number, boolean]> = [
    ["Total Amount", input.totalAmount, false],
    ["Discount", input.discount, false],
    ["Gross Amount", input.grossAmount, true],
  ];
  moneyRows.forEach(([label, value, strong], index) => {
    const y = moneyBaselines[index];
    drawText(
      page,
      label,
      CONTENT_LEFT + padX,
      y,
      strong ? fonts.bold : fonts.regular,
      9.5,
      strong ? INK : MUTED
    );
    drawTextRight(
      page,
      index === 1 && value > 0
        ? `- ${formatReceiptAmount(value)}`
        : formatReceiptAmount(value),
      CONTENT_RIGHT - padX,
      y,
      strong ? fonts.bold : fonts.regular,
      strong ? 11 : 9.5,
      INK
    );
  });

  page.drawLine({
    start: { x: CONTENT_LEFT + padX, y: dividerY },
    end: { x: CONTENT_RIGHT - padX, y: dividerY },
    thickness: 0.6,
    color: BORDER,
  });

  // Amount actually received - the strongest element on the receipt.
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: paidBandBottom,
    width: CONTENT_WIDTH,
    height: paidBandHeight,
    color: ORANGE,
  });
  drawText(
    page,
    "Final Amount Paid",
    CONTENT_LEFT + padX,
    paidBandBottom + 10.5,
    fonts.bold,
    10.5,
    WHITE
  );
  drawTextRight(
    page,
    formatReceiptAmount(input.paidAmount),
    CONTENT_RIGHT - padX,
    paidBandBottom + 8.5,
    fonts.bold,
    14,
    WHITE
  );

  // Balance still payable.
  const settled = input.balanceDue <= 0;
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: balanceBandBottom,
    width: CONTENT_WIDTH,
    height: balanceBandHeight,
    color: settled ? GREEN_SOFT : AMBER_SOFT,
  });
  drawText(
    page,
    "Balance Due",
    CONTENT_LEFT + padX,
    balanceBandBottom + 9.5,
    fonts.bold,
    9.5,
    settled ? GREEN : AMBER
  );
  if (settled) {
    const tagLabel = "PAID IN FULL";
    const tagWidth = fonts.bold.widthOfTextAtSize(tagLabel, 7) + 14;
    page.drawRectangle({
      x: CONTENT_RIGHT - padX - tagWidth,
      y: balanceBandBottom + 7,
      width: tagWidth,
      height: 14,
      color: GREEN,
    });
    drawTextCenter(
      page,
      tagLabel,
      CONTENT_RIGHT - padX - tagWidth / 2,
      balanceBandBottom + 11.5,
      fonts.bold,
      7,
      WHITE
    );
    drawTextRight(
      page,
      formatReceiptAmount(input.balanceDue),
      CONTENT_RIGHT - padX - tagWidth - 10,
      balanceBandBottom + 9.5,
      fonts.bold,
      11,
      GREEN
    );
  } else {
    drawTextRight(
      page,
      formatReceiptAmount(input.balanceDue),
      CONTENT_RIGHT - padX,
      balanceBandBottom + 9.5,
      fonts.bold,
      11,
      AMBER
    );
  }

  metaRows.forEach(([label, value], index) => {
    const y = metaBaselines[index];
    drawText(page, label, CONTENT_LEFT + padX, y, fonts.regular, 9.5, MUTED);
    drawTextRight(
      page,
      truncateToWidth(value, fonts.bold, 10, CONTENT_WIDTH * 0.5),
      CONTENT_RIGHT - padX,
      y,
      fonts.bold,
      10,
      INK
    );
  });

  // Amount in words - closes the card.
  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height: wordsHeight,
    color: ORANGE_BAND,
  });
  page.drawLine({
    start: { x: CONTENT_LEFT, y: wordsTop },
    end: { x: CONTENT_RIGHT, y: wordsTop },
    thickness: 0.6,
    color: ORANGE_SOFT,
  });
  drawText(
    page,
    "AMOUNT IN WORDS",
    CONTENT_LEFT + padX,
    wordsTop - 13,
    fonts.bold,
    7,
    ORANGE_DARK
  );
  wrapToWidth(
    input.amountInWords,
    fonts.italic,
    9.5,
    CONTENT_WIDTH - padX * 2,
    2
  ).forEach((line, index) => {
    drawText(
      page,
      line,
      CONTENT_LEFT + padX,
      wordsTop - 24 - index * 11,
      fonts.italic,
      9.5,
      INK
    );
  });

  page.drawRectangle({
    x: CONTENT_LEFT,
    y: bottom,
    width: CONTENT_WIDTH,
    height: top - bottom,
    borderColor: BORDER_STRONG,
    borderWidth: 0.8,
  });

  return bottom;
}

type ReceiptFooterInput = {
  gymName: string;
  gymPhone?: string | null;
  gymEmail?: string | null;
  gymAddress?: string | null;
};

/**
 * Bottom block: policy text on the left, signature area on the right and the
 * thank-you/contact strip underneath. Anchored to fixed heights so the footer
 * always lands in the same place regardless of the data above it.
 */
function drawReceiptFooter(
  page: PDFPage,
  input: ReceiptFooterInput,
  fonts: Fonts
): void {
  const signatureWidth = 168;
  const signatureLeft = CONTENT_RIGHT - signatureWidth;
  const termsWidth = signatureLeft - CONTENT_LEFT - 24;

  drawText(page, "TERMS & CONDITIONS", CONTENT_LEFT, 196, fonts.bold, 8, ORANGE);
  drawText(
    page,
    truncateToWidth(
      "No Refund, No Transfer, No Extension.",
      fonts.regular,
      8.5,
      termsWidth
    ),
    CONTENT_LEFT,
    181,
    fonts.regular,
    8.5,
    INK
  );
  drawText(
    page,
    truncateToWidth(
      "This is a computer-generated receipt and does not require a physical signature.",
      fonts.regular,
      7.6,
      termsWidth
    ),
    CONTENT_LEFT,
    168,
    fonts.regular,
    7.6,
    SUBTLE
  );
  drawText(
    page,
    truncateToWidth(
      "Please retain this receipt for your records.",
      fonts.regular,
      7.6,
      termsWidth
    ),
    CONTENT_LEFT,
    156,
    fonts.regular,
    7.6,
    SUBTLE
  );

  drawTextRight(
    page,
    truncateToWidth(`For ${input.gymName}`, fonts.bold, 8.5, signatureWidth),
    CONTENT_RIGHT,
    196,
    fonts.bold,
    8.5,
    INK
  );
  page.drawLine({
    start: { x: signatureLeft, y: 166 },
    end: { x: CONTENT_RIGHT, y: 166 },
    thickness: 0.7,
    color: BORDER_STRONG,
  });
  drawTextRight(
    page,
    "Authorised Signatory",
    CONTENT_RIGHT,
    155,
    fonts.regular,
    8,
    MUTED
  );

  page.drawLine({
    start: { x: CONTENT_LEFT, y: 132 },
    end: { x: CONTENT_RIGHT, y: 132 },
    thickness: 0.6,
    color: BORDER,
  });
  drawTextCenter(
    page,
    truncateToWidth(
      `Thank you for choosing ${input.gymName}!`,
      fonts.bold,
      10.5,
      CONTENT_WIDTH
    ),
    PAGE_WIDTH / 2,
    116,
    fonts.bold,
    10.5,
    ORANGE
  );

  const contact = [input.gymPhone, input.gymEmail]
    .map((value) => (value ? cleanText(value) : ""))
    .filter(Boolean)
    .join("  |  ");
  if (contact) {
    drawTextCenter(
      page,
      truncateToWidth(contact, fonts.regular, 8, CONTENT_WIDTH),
      PAGE_WIDTH / 2,
      99,
      fonts.regular,
      8,
      MUTED
    );
  }

  const address = input.gymAddress ? cleanText(input.gymAddress) : "";
  if (address) {
    drawTextCenter(
      page,
      truncateToWidth(address, fonts.regular, 7.6, CONTENT_WIDTH),
      PAGE_WIDTH / 2,
      87,
      fonts.regular,
      7.6,
      SUBTLE
    );
  }
}

/**
 * Build the Focus Fitness membership receipt as A4 PDF bytes.
 *
 * The signature and the return type are unchanged: the WhatsApp media upload
 * path expects exactly these bytes.
 */
export async function buildRenewalReceiptPdf(
  data: RenewalReceiptData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${data.gymName} Receipt ${data.receiptNumber}`);
  pdfDoc.setSubject("Membership payment receipt");
  pdfDoc.setCreator(data.gymName);
  pdfDoc.setProducer(data.gymName);

  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  };

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Figures are derived from existing membership/payment values only.
  const totalAmount = toAmount(data.amount);
  const discountAmount = toAmount(data.discount);
  const grossAmount = toAmount(data.finalAmount);
  const paidNow =
    data.paidAmount === undefined || data.paidAmount === null
      ? grossAmount
      : toAmount(data.paidAmount);
  const alreadyPaid = Math.max(0, toAmount(data.alreadyPaidBefore ?? 0));
  const balanceDue = Math.max(0, round2(grossAmount - alreadyPaid - paidNow));
  const validityDays = Math.max(
    0,
    Math.round((data.endDate.getTime() - data.startDate.getTime()) / 86400000)
  );
  const statusColor =
    data.paymentStatus === "PAID"
      ? GREEN
      : data.paymentStatus === "PARTIAL" || data.paymentStatus === "PENDING"
        ? AMBER
        : MUTED;

  // Header ---------------------------------------------------------------
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 7,
    width: PAGE_WIDTH,
    height: 7,
    color: ORANGE,
  });

  const headerTop = PAGE_HEIGHT - 34;
  const headerBottom = headerTop - 62;

  const logo = await tryEmbedLogo(pdfDoc, data.gymLogo);
  let identityX = CONTENT_LEFT;
  if (logo) {
    const logoHeight = 46;
    const logoWidth = Math.min(130, (logo.width * logoHeight) / logo.height);
    page.drawImage(logo, {
      x: CONTENT_LEFT,
      y: headerTop - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    identityX = CONTENT_LEFT + logoWidth + 14;
  }

  const identityWidth = Math.max(120, CONTENT_RIGHT - identityX - 128);
  drawText(
    page,
    truncateToWidth(data.gymName, fonts.bold, 17, identityWidth),
    identityX,
    headerTop - 20,
    fonts.bold,
    17,
    INK
  );
  if (data.gymAddress) {
    drawText(
      page,
      truncateToWidth(data.gymAddress, fonts.regular, 9, identityWidth),
      identityX,
      headerTop - 36,
      fonts.regular,
      9,
      MUTED
    );
  }
  const headerContact = [data.gymPhone, data.gymEmail]
    .map((value) => (value ? cleanText(value) : ""))
    .filter(Boolean)
    .join("  |  ");
  if (headerContact) {
    drawText(
      page,
      truncateToWidth(headerContact, fonts.regular, 9, identityWidth),
      identityX,
      headerTop - 50,
      fonts.regular,
      9,
      MUTED
    );
  }

  drawTextRight(
    page,
    "RECEIPT",
    CONTENT_RIGHT,
    headerTop - 21,
    fonts.bold,
    23,
    ORANGE
  );
  const copyLabel = "MEMBER COPY";
  const badgeWidth = fonts.bold.widthOfTextAtSize(copyLabel, 8) + 20;
  const badgeBottom = headerTop - 58;
  page.drawRectangle({
    x: CONTENT_RIGHT - badgeWidth,
    y: badgeBottom,
    width: badgeWidth,
    height: 16,
    color: ORANGE_SOFT,
    borderColor: ORANGE,
    borderWidth: 0.6,
  });
  drawTextCenter(
    page,
    copyLabel,
    CONTENT_RIGHT - badgeWidth / 2,
    badgeBottom + 5.5,
    fonts.bold,
    8,
    ORANGE_DARK
  );

  page.drawLine({
    start: { x: CONTENT_LEFT, y: headerBottom },
    end: { x: CONTENT_RIGHT, y: headerBottom },
    thickness: 1.4,
    color: ORANGE,
  });
  page.drawLine({
    start: { x: CONTENT_LEFT, y: headerBottom - 3.2 },
    end: { x: CONTENT_RIGHT, y: headerBottom - 3.2 },
    thickness: 0.5,
    color: BORDER_STRONG,
  });

  // Receipt and member information ---------------------------------------
  let cursor = headerBottom - 26;
  drawSectionTitle(page, "Receipt Information", cursor, fonts);
  const infoBottom = drawFieldGrid(
    page,
    [
      { label: "Receipt No.", value: data.receiptNumber },
      { label: "Receipt Date", value: formatReceiptDateInTimeZone(data.renewalDate) },
      { label: "Payment Status", value: data.paymentStatus, color: statusColor },
      { label: "Member Name", value: data.memberName },
      {
        label: "Member Code",
        value: data.memberCode ? cleanText(data.memberCode) : "-",
      },
      {
        label: "Contact Number",
        value: data.memberPhone ? cleanText(data.memberPhone) : "-",
      },
    ],
    { columns: 3, top: cursor - 12, rowHeight: 30, fonts }
  );

  // Fees table ------------------------------------------------------------
  cursor = infoBottom - 30;
  drawSectionTitle(page, "Fees Details", cursor, fonts);
  const tableBottom = drawFeesTable(
    page,
    [
      { value: "1", color: MUTED },
      { value: "Membership Fees", strong: true },
      { value: data.planName },
      { value: formatReceiptAmount(totalAmount) },
      { value: formatReceiptAmount(alreadyPaid), color: MUTED },
      { value: formatReceiptAmount(paidNow), strong: true },
      {
        value: formatReceiptAmount(balanceDue),
        strong: true,
        color: balanceDue > 0 ? AMBER : GREEN,
      },
    ],
    cursor - 12,
    fonts
  );

  // Membership validity ---------------------------------------------------
  cursor = tableBottom - (alreadyPaid > 0 ? 22 : 12);
  if (alreadyPaid > 0) {
    drawText(
      page,
      "Already Paid = amount received on this membership before this receipt.",
      CONTENT_LEFT,
      tableBottom - 12,
      fonts.regular,
      7,
      SUBTLE
    );
  }
  const stripBottom = drawFieldGrid(
    page,
    [
      {
        label: "Membership Start Date",
        value: formatUtcDateForDisplay(data.startDate),
      },
      {
        label: "Membership End Date (Expiry)",
        value: formatUtcDateForDisplay(data.endDate),
      },
      { label: "Membership Duration", value: `${validityDays} Days` },
    ],
    {
      columns: 3,
      top: cursor,
      rowHeight: 36,
      fonts,
      fill: ORANGE_BAND,
      border: ORANGE_SOFT,
    }
  );

  // Payment summary -------------------------------------------------------
  cursor = stripBottom - 30;
  drawSectionTitle(page, "Payment Summary", cursor, fonts);
  drawPaymentSummary(
    page,
    {
      totalAmount,
      discount: discountAmount,
      grossAmount,
      paidAmount: paidNow,
      balanceDue,
      paymentMode: data.paymentMode,
      transactionId: data.transactionId,
      // Receipts state the amount actually received in words.
      amountInWords: formatReceiptAmountInWords(paidNow),
    },
    cursor - 12,
    fonts
  );

  // Footer ----------------------------------------------------------------
  drawReceiptFooter(
    page,
    {
      gymName: data.gymName,
      gymPhone: data.gymPhone,
      gymEmail: data.gymEmail,
      gymAddress: data.gymAddress,
    },
    fonts
  );

  return await pdfDoc.save();
}
