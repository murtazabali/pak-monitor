import type { City } from "@/lib/types";

/**
 * Monitored cities. Karachi is the default selection in the UI.
 *
 * ── To ADD a city: append an object with a unique `slug`, a display `name`,
 *    its approximate `lat`/`lng` (for the map dot), and a `localities` list of
 *    neighborhoods / landmarks. An article is tagged to a city when its title or
 *    summary mentions the city name OR any of its localities (whole-word, case
 *    insensitive). It immediately shows up as a chip and a map node.
 *
 * Tip: prefer DISTINCTIVE localities. Generic names shared across cities
 * (e.g. "Cantt", "Saddar", "Model Town", "Bahria Town") are intentionally left
 * out to avoid mis-tagging — the city name itself is always matched anyway.
 */
export const CITIES: City[] = [
  {
    slug: "karachi",
    name: "Karachi",
    province: "Sindh",
    lat: 24.8607,
    lng: 67.0011,
    localities: [
      "clifton", "korangi", "gulshan-e-iqbal", "nazimabad", "north nazimabad",
      "malir", "landhi", "orangi", "lyari", "gulistan-e-johar", "liaquatabad",
      "keamari", "kemari", "sea view", "tariq road", "shah faisal colony",
      "federal b area", "north karachi", "surjani", "baldia", "shahrah-e-faisal",
      "i.i. chundrigar", "boat basin", "gulshan-e-hadeed",
    ],
  },
  {
    slug: "lahore",
    name: "Lahore",
    province: "Punjab",
    lat: 31.5204,
    lng: 74.3587,
    localities: [
      "johar town", "model town", "anarkali", "mall road", "shadman",
      "faisal town", "garden town", "wapda town", "township", "samanabad",
      "walled city", "data darbar", "liberty market", "ichhra", "ichra",
      "shalimar garden", "minar-e-pakistan", "badshahi mosque", "gawalmandi",
      "mughalpura", "raiwind", "thokar niaz baig", "fortress stadium",
    ],
  },
  {
    slug: "islamabad",
    name: "Islamabad",
    province: "Islamabad Capital Territory",
    lat: 33.6844,
    lng: 73.0479,
    localities: [
      "blue area", "margalla", "faisal mosque", "aabpara", "bani gala",
      "constitution avenue", "centaurus", "diplomatic enclave", "bara kahu",
      "bhara kahu", "rawal lake", "saidpur", "tarlai", "g-9", "i-8",
      "red zone", "parliament house", "d-chowk", "shakarparian",
    ],
  },
  {
    slug: "rawalpindi",
    name: "Rawalpindi",
    province: "Punjab",
    lat: 33.5651,
    lng: 73.0169,
    localities: [
      "pindi", "raja bazaar", "committee chowk", "murree road", "chaklala",
      "westridge", "pirwadhai", "liaquat bagh", "adiala", "faizabad",
      "rawat", "tench bhatta", "dhoke kala khan", "gawalmandi pindi",
      "katarian", "morgah",
    ],
  },
  {
    slug: "faisalabad",
    name: "Faisalabad",
    province: "Punjab",
    lat: 31.4504,
    lng: 73.135,
    localities: [
      "lyallpur", "d ground", "madina town", "peoples colony", "jaranwala road",
      "sargodha road", "susan road", "millat road", "ghanta ghar",
      "clock tower faisalabad", "dijkot", "jhang road", "samundri road",
    ],
  },
  {
    slug: "multan",
    name: "Multan",
    province: "Punjab",
    lat: 30.1575,
    lng: 71.5249,
    localities: [
      "bosan road", "gulgasht", "shah rukn-e-alam", "vehari road",
      "khanewal road", "hussain agahi", "bahauddin zakariya", "qasim bagh",
      "chowk kumharanwala", "old shujabad road", "fort kohna", "mumtazabad",
    ],
  },
  {
    slug: "peshawar",
    name: "Peshawar",
    province: "Khyber Pakhtunkhwa",
    lat: 34.0151,
    lng: 71.5249,
    localities: [
      "hayatabad", "qissa khwani", "board bazaar", "karkhano", "khyber bazaar",
      "warsak road", "charsadda road", "ring road peshawar", "tehkal",
      "gulbahar", "university road peshawar", "bara", "kohat road",
    ],
  },
  {
    slug: "quetta",
    name: "Quetta",
    province: "Balochistan",
    lat: 30.1798,
    lng: 66.975,
    localities: [
      "sariab road", "hazara town", "hanna lake", "brewery road", "kuchlak",
      "pishin stop", "mastung road", "jinnah road quetta", "spiny road",
      "alamdar road", "mekongi road",
    ],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    province: "Sindh",
    lat: 25.396,
    lng: 68.3578,
    localities: [
      "latifabad", "qasimabad", "hala naka", "auto bhan", "tilak incline",
      "pakka qila", "phuleli", "hirabad", "city gate hyderabad",
      "kohsar hyderabad",
    ],
  },
  {
    slug: "sialkot",
    name: "Sialkot",
    province: "Punjab",
    lat: 32.4945,
    lng: 74.5229,
    localities: [
      "paris road", "kashmir road", "daska", "pasrur", "sambrial", "ugoki",
      "rangpura", "kotli loharan", "head marala", "khadim ali road",
    ],
  },
];

/** Default city shown when the user has no saved selection. */
export const DEFAULT_CITY = "karachi";

/** Quick lookup by slug. */
export const CITY_BY_SLUG: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c]),
);

/** Urdu names, matched alongside the English name so Urdu-language feeds tag too. */
export const URDU_NAMES: Record<string, string> = {
  karachi: "کراچی",
  lahore: "لاہور",
  islamabad: "اسلام آباد",
  rawalpindi: "راولپنڈی",
  faisalabad: "فیصل آباد",
  multan: "ملتان",
  peshawar: "پشاور",
  quetta: "کوئٹہ",
  hyderabad: "حیدرآباد",
  sialkot: "سیالکوٹ",
};
