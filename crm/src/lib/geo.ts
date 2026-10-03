/**
 * US geography helpers: state names, default time zones and area codes.
 *
 * Time zones are the compliance-critical part (TCPA calling hours are judged in
 * the *called party's* local time). A few states straddle two zones, so a lead's
 * zone can be "approximate": the queue then applies a stricter calling window.
 */

const ET = "America/New_York";
const CT = "America/Chicago";
const MT = "America/Denver";
const PT = "America/Los_Angeles";
const AZ = "America/Phoenix";
const AK = "America/Anchorage";
const HI = "Pacific/Honolulu";

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const STATE_TZ: Record<string, string> = {
  CT: ET, DE: ET, DC: ET, FL: ET, GA: ET, IN: ET, KY: ET, ME: ET, MD: ET, MA: ET,
  MI: ET, NH: ET, NJ: ET, NY: ET, NC: ET, OH: ET, PA: ET, RI: ET, SC: ET, TN: CT,
  VT: ET, VA: ET, WV: ET,
  AL: CT, AR: CT, IL: CT, IA: CT, KS: CT, LA: CT, MN: CT, MS: CT, MO: CT, NE: CT,
  ND: CT, OK: CT, SD: CT, TX: CT, WI: CT,
  AZ: AZ, CO: MT, ID: MT, MT: MT, NM: MT, UT: MT, WY: MT,
  CA: PT, NV: PT, OR: PT, WA: PT,
  AK: AK, HI: HI,
};

/** States that span two zones, so a state alone can't pin the zone down. */
const SPLIT_STATES = new Set(["FL", "TX", "TN", "KY", "IN", "MI", "KS", "NE", "SD", "ND", "OR", "ID"]);

/** Area codes per state. */
const AREA_CODES_BY_STATE: Record<string, string> = {
  AL: "205 251 256 334 659 938", AK: "907", AZ: "480 520 602 623 928", AR: "479 501 870",
  CA: "209 213 279 310 323 341 369 408 415 424 442 510 530 559 562 619 626 628 650 657 661 669 707 714 747 760 805 818 820 831 840 858 909 916 925 949 951",
  CO: "303 719 720 970 983", CT: "203 475 860 959", DE: "302", DC: "202 771",
  FL: "239 305 321 324 352 386 407 448 561 645 656 689 727 728 754 772 786 813 850 863 904 941 954",
  GA: "229 404 470 478 678 706 762 770 912 943", HI: "808", ID: "208 986",
  IL: "217 224 309 312 331 447 618 630 708 773 779 815 847 872",
  IN: "219 260 317 463 574 765 812 930", IA: "319 515 563 641 712", KS: "316 620 785 913",
  KY: "270 364 502 606 859", LA: "225 318 337 504 985", ME: "207",
  MD: "240 301 410 443 667", MA: "339 351 413 508 617 774 781 857 978",
  MI: "231 248 269 313 517 586 616 734 810 906 947 989",
  MN: "218 320 507 612 651 763 952", MS: "228 601 662 769",
  MO: "314 417 573 636 660 816 975", MT: "406", NE: "308 402 531", NV: "702 725 775",
  NH: "603", NJ: "201 551 609 640 732 848 856 862 908 973", NM: "505 575",
  NY: "212 315 332 347 516 518 585 607 631 646 680 716 718 838 845 914 917 929 934",
  NC: "252 336 704 743 828 910 919 980 984", ND: "701",
  OH: "216 220 234 326 330 380 419 440 513 567 614 740 937",
  OK: "405 539 572 580 918", OR: "458 503 541 971",
  PA: "215 223 267 272 412 445 484 570 610 717 724 814 835 878", RI: "401",
  SC: "803 839 843 854 864", SD: "605", TN: "423 615 629 731 865 901 931",
  TX: "210 214 254 281 325 346 361 409 430 432 469 512 682 713 726 737 806 817 830 832 903 915 936 940 956 972 979",
  UT: "385 435 801", VT: "802", VA: "276 434 540 571 703 757 804 826 948",
  WA: "206 253 360 425 509 564", WV: "304 681", WI: "262 274 414 534 608 715 920", WY: "307",
};

/** Area code -> state. */
export const AREA_TO_STATE: Record<string, string> = {};
for (const [st, codes] of Object.entries(AREA_CODES_BY_STATE)) {
  for (const c of codes.split(" ")) AREA_TO_STATE[c] = st;
}

/**
 * Area-code time-zone overrides inside split states. `exact: false` means the
 * code itself straddles a boundary, so the queue stays conservative.
 */
const AREA_TZ: Record<string, { tz: string; exact: boolean }> = {
  // Texas — El Paso is Mountain.
  "915": { tz: MT, exact: true },
  // Florida — the panhandle (Pensacola Central, Tallahassee Eastern).
  "850": { tz: CT, exact: false }, "448": { tz: CT, exact: false },
  // Tennessee.
  "423": { tz: ET, exact: true }, "865": { tz: ET, exact: true },
  "615": { tz: CT, exact: true }, "629": { tz: CT, exact: true },
  "731": { tz: CT, exact: true }, "901": { tz: CT, exact: true }, "931": { tz: CT, exact: true },
  // Kentucky.
  "270": { tz: CT, exact: true }, "364": { tz: CT, exact: true },
  "502": { tz: ET, exact: true }, "606": { tz: ET, exact: true }, "859": { tz: ET, exact: true },
  // Indiana.
  "219": { tz: CT, exact: true }, "812": { tz: ET, exact: false },
  "260": { tz: ET, exact: true }, "317": { tz: ET, exact: true }, "463": { tz: ET, exact: true },
  "574": { tz: ET, exact: true }, "765": { tz: ET, exact: true }, "930": { tz: ET, exact: true },
  // Michigan — the Upper Peninsula.
  "906": { tz: ET, exact: false },
  // Kansas / Nebraska / Dakotas / Idaho / Oregon.
  "620": { tz: CT, exact: false }, "308": { tz: CT, exact: false },
  "605": { tz: CT, exact: false }, "701": { tz: CT, exact: false },
  "208": { tz: MT, exact: false }, "986": { tz: MT, exact: false }, "541": { tz: PT, exact: false },
};

const NAME_TO_STATE: Record<string, string> = {};
for (const [code, name] of Object.entries(STATE_NAMES)) {
  NAME_TO_STATE[name.toLowerCase()] = code;
}

/** "tx", "TX.", "Texas" -> "TX"; anything unrecognised -> null. */
export function normalizeState(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim().replace(/\./g, "");
  if (!s) return null;
  const up = s.toUpperCase();
  if (STATE_NAMES[up]) return up;
  return NAME_TO_STATE[s.toLowerCase()] ?? null;
}

export function areaCodeOf(e164: string | null | undefined): string | null {
  const m = e164?.match(/^\+1(\d{3})\d{7}$/);
  return m ? m[1] : null;
}

export type ZoneGuess = { state: string | null; timezone: string | null; approx: boolean };

/** Work out a lead's state and time zone from whatever we know. */
export function resolveZone(opts: { state?: string | null; phone?: string | null }): ZoneGuess {
  const area = areaCodeOf(opts.phone);
  let state = normalizeState(opts.state);
  if (!state && area) state = AREA_TO_STATE[area] ?? null;
  if (!state) return { state: null, timezone: null, approx: false };

  let tz = STATE_TZ[state];
  let approx = SPLIT_STATES.has(state);
  if (area && AREA_TO_STATE[area] === state && AREA_TZ[area]) {
    tz = AREA_TZ[area].tz;
    approx = !AREA_TZ[area].exact;
  }
  return { state, timezone: tz, approx };
}

export const US_TIMEZONES = [
  { value: ET, label: "Eastern (New York)" },
  { value: CT, label: "Central (Chicago)" },
  { value: MT, label: "Mountain (Denver)" },
  { value: AZ, label: "Arizona (Phoenix)" },
  { value: PT, label: "Pacific (Los Angeles)" },
  { value: AK, label: "Alaska" },
  { value: HI, label: "Hawaii" },
];

export const OTHER_TIMEZONES = [
  { value: "Asia/Karachi", label: "Pakistan (Karachi)" },
  { value: "Asia/Dubai", label: "UAE (Dubai)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Berlin", label: "Central Europe (Berlin)" },
  { value: "Asia/Manila", label: "Philippines (Manila)" },
  { value: "UTC", label: "UTC" },
];

export const ALL_TIMEZONES = [...US_TIMEZONES, ...OTHER_TIMEZONES];

export const isValidTimezone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
