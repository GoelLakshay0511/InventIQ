import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import {
  Minus,
  Plus,
  ShoppingBag,
  Mic,
  MicOff,
  Upload,
  FileSpreadsheet,
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Star,
} from 'lucide-react';
import apiClient from '../api/client';
import LoadingSpinner from '../components/shared/LoadingSpinner';

/* ── Number word dictionary (English + Hinglish + Hindi Devanagari + Phonetic) ── */
const NUMBER_WORDS = {
  // English
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  twentyfive: 25, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100,

  // Hindi / Hinglish phonetics
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5,
  chhe: 6, che: 6, saat: 7, aath: 8, ath: 8, nau: 9,
  das: 10, dass: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14,
  pandrah: 15, pandra: 15, solah: 16, satrah: 17, atharah: 18,
  unnees: 19, bees: 20, bis: 20, pachis: 25, pacchees: 25,
  tees: 30, chalis: 40, pachaas: 50, pachas: 50, sau: 100,

  // Hindi Devanagari words
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'पच्चीस': 25, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'सौ': 100,

  // English acoustic approximations when user speaks Hindi in English mode
  'thats': 10, "that's": 10, 'does': 10,
};

const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

/* ── English Devanagari to English Display Dictionary ─────────────────────── */
const ENGLISH_DEVANAGARI_DICT = {
  'कोलगेट': 'Colgate',
  'एंड': 'and',
  'सोल्ड': 'sold',
  'टुडे': 'today',
  'फ्रूटी': 'Frooti',
  'लाइफबॉय': 'Lifebuoy',
  'सोप': 'soap',
  'साबुन': 'soap',
  'ऑयल': 'oil',
  'तेल': 'oil',
  'बटर': 'butter',
  'मिल्क': 'milk',
  'बिस्कुट': 'biscuit',
  'मैगी': 'Maggi',
  'नूडल्स': 'noodles',
  'नूडल': 'noodles',
  'सर्फ': 'Surf',
  'एक्सेल': 'Excel',
  'विम': 'Vim',
  'बार': 'bar',
  'जेल': 'gel',
  'डेटॉल': 'Dettol',
  'हैंडवॉश': 'Handwash',
  'बिसलेरी': 'Bisleri',
  'पानी': 'water',
  'वाटर': 'water',
  'फॉर्च्यून': 'Fortune',
  'सनफ्लावर': 'Sunflower',
  'सफोला': 'Saffola',
  'गोल्ड': 'Gold',
  'पारले': 'Parle',
  'गुड': 'Good',
  'डे': 'Day',
  'लेस': 'Lays',
  'चिप्स': 'chips',
  'कुरकुरे': 'Kurkure',
  'कोक': 'Coke',
  'कोका': 'Coca',
  'कोला': 'Cola',
  'टाटा': 'Tata',
  'नमक': 'salt',
  'सॉल्ट': 'salt',
  'चीनी': 'sugar',
  'शुगर': 'sugar',
  'आटा': 'Atta',
  'आशीर्वाद': 'Aashirvaad',
  'दाल': 'dal',
  'तूर': 'Toor',
  'चना': 'Chana',
  'हारपिक': 'Harpic',
  'शैम्पू': 'shampoo',
  'रेड': 'Red',
  'लेबल': 'Label',
  'टी': 'tea',
  'चाय': 'tea',
  'कॉफी': 'coffee',
  'नेस्कैफे': 'Nescafe',
  'गेंदा': 'Genda',
  'फूल': 'Phool',
  'अमूल': 'Amul'
};

function formatDisplayTranscript(rawText) {
  if (!rawText) return '';
  // Check if spoken in English: contains English grammar/verb markers
  const isEnglishSpoken = /(?<=^|\s)(end|and|sold|today|sale|units|packs|packet|pieces|piece|bottle|can|box|carton|एंड|सोल्ड|टुडे|सेल|यूनिट्स|पैक्स|पीस|बॉटल)(?=$|\s)/i.test(rawText);

  if (!isEnglishSpoken) {
    return rawText; // Preserve pure Hindi output as-is
  }

  // If spoken in English, translate transcribed Devanagari words into clean English
  let formatted = rawText;
  for (const [hi, en] of Object.entries(ENGLISH_DEVANAGARI_DICT)) {
    const rx = new RegExp(hi, 'g');
    formatted = formatted.replace(rx, en);
  }
  return formatted.replace(/।/g, '.').replace(/\s+/g, ' ').trim();
}

/* ── Universal Devanagari to Latin Transliteration ────────────────────────── */
function universalPhonetic(str) {
  if (!str) return '';
  let s = str.toLowerCase();

  const devMap = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऑ': 'o', 'ऍ': 'e',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o', 'ॅ': 'e',
    '्': '', 'ं': 'n', 'ँ': 'n', 'ः': 'h', '़': '',
    'फ़': 'f', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh'
  };

  const consonants = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहफ़ज़ड़ढ़';
  const matras = 'ािीुूेैोौॉॅ्';

  let devOut = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (devMap[ch] !== undefined) {
      devOut += devMap[ch];
      if (consonants.includes(ch) && next && !matras.includes(next) && next !== ' ') {
        devOut += 'a';
      }
    } else {
      devOut += ch;
    }
  }

  // Common Hindi noun translations to English Kirana equivalents
  devOut = devOut
    .replace(/\b(sabun|saboon|saabun)\b/g, 'soap')
    .replace(/\b(tel|tail|tael)\b/g, 'oil')
    .replace(/\b(doodh|dudh|dud)\b/g, 'milk')
    .replace(/\b(makhan|makkhan)\b/g, 'butter')
    .replace(/\b(namak|nimak)\b/g, 'salt')
    .replace(/\b(chini|cheeni|shakkar)\b/g, 'sugar')
    .replace(/\b(pani|paani)\b/g, 'water')
    .replace(/\b(chai|chay|patti)\b/g, 'tea')
    .replace(/\b(biscuit|biscut|biskut)\b/g, 'biscuit')
    .replace(/\b(aata|atta|gehu)\b/g, 'atta');

  // Phonetic reductions & acoustic normalization
  return devOut
    .replace(/ph/g, 'f')
    .replace(/life/g, 'laif')
    .replace(/buoy/g, 'boi')
    .replace(/boy/g, 'boi')
    .replace(/soap/g, 'sop')
    .replace(/oo/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'e')
    .replace(/oa/g, 'o')
    .replace(/ou/g, 'u')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/w/g, 'v')
    .replace(/aa/g, 'a')
    .replace(/(.)\1+/g, '$1') // collapse repeated characters
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/* ── Levenshtein Distance Similarity (0.0 to 1.0) ─────────────────────────── */
function similarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const l1 = s1.length;
  const l2 = s2.length;
  const d = [];
  for (let i = 0; i <= l1; i++) d[i] = [i];
  for (let j = 0; j <= l2; j++) d[0][j] = j;
  for (let i = 1; i <= l1; i++) {
    for (let j = 1; j <= l2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  const maxLen = Math.max(l1, l2);
  return (maxLen - d[l1][l2]) / maxLen;
}

// Aliases for common kirana products (English, Hinglish & Devanagari)
const PRODUCT_ALIASES = [
  // User custom items & Marigold
  { keywords: ['genda phool', 'genda fool', 'ginda fool', 'genda', 'ginda', 'phool', 'गेंदा फूल', 'गेंदा', 'फूल', 'marigold', 'marie gold'], match: 'genda phool' },

  // Butter & Dairy
  { keywords: ['butter', 'makhan', 'makkhan', 'मक्खन', 'बटर', 'अमूल बटर', 'अमुल बटर', 'amul butter', 'amul'], match: 'amul butter' },
  { keywords: ['milk', 'doodh', 'amul milk', 'amul doodh', 'full cream', 'दूध', 'अमूल दूध'], match: 'amul full cream' },
  { keywords: ['curd', 'dahi', 'दही', 'mother dairy curd'], match: 'curd' },

  // Biscuits & Snacks
  { keywords: ['parle', 'parle-g', 'parleg', 'biscuit', 'biscut', 'पारले', 'पारले जी', 'बिस्कुट'], match: 'parle-g' },
  { keywords: ['good day', 'goodday', 'गुड डे'], match: 'good day' },
  { keywords: ['bourbon', 'बर्बन'], match: 'bourbon' },
  { keywords: ['maggi', 'maggie', 'noodles', 'noodle', 'मैगी', 'नूडल्स'], match: 'maggi' },
  { keywords: ['lays', 'lay', 'chips', 'classic', 'चिप्स', 'लेस'], match: 'lays' },
  { keywords: ['kurkure', 'tedhe medhe', 'कुरकुरे'], match: 'kurkure' },

  // Oils & Staples
  { keywords: ['fortune', 'sunflower', 'oil', 'tel', 'meetha tel', 'तेल', 'फॉर्च्यून', 'फॉर्चून'], match: 'fortune' },
  { keywords: ['saffola', 'gold oil', 'सफोला'], match: 'saffola' },
  { keywords: ['atta', 'aata', 'aashirvaad', 'ashirwad', 'gehu', 'आटा', 'आशीर्वाद'], match: 'aashirvaad' },
  { keywords: ['salt', 'namak', 'tata salt', 'नमक'], match: 'tata salt' },
  { keywords: ['sugar', 'cheeni', 'chini', 'shakkar', 'चीनी', 'शक्कर'], match: 'sugar' },
  { keywords: ['toor dal', 'tur dal', 'arhar', 'toor', 'तूर दाल', 'अरहर', 'दाल'], match: 'toor dal' },
  { keywords: ['chana dal', 'chana', 'चना दाल'], match: 'chana dal' },

  // Beverages
  { keywords: ['coca cola', 'coke', 'thums up', 'cold drink', 'कोक', 'कोका कोला'], match: 'coca-cola' },
  { keywords: ['frooti', 'mango', 'फ्रूटी'], match: 'frooti' },
  { keywords: ['bisleri', 'water', 'pani', 'paani', 'पानी', 'बिसलेरी'], match: 'bisleri' },
  { keywords: ['red label', 'chai', 'tea', 'patti', 'चाय', 'पत्ती'], match: 'red label' },
  { keywords: ['tata tea', 'tea gold', 'टाटा टी'], match: 'tata tea' },
  { keywords: ['nescafe', 'coffee', 'कॉफी'], match: 'nescafe' },
  { keywords: ['rooh afza', 'rose syrup', 'sharbat', 'शरबत'], match: 'rooh afza' },
  { keywords: ['corn flakes', 'kelloggs', 'कॉर्न फ्लेक्स'], match: 'corn flakes' },

  // Personal Care & Household
  { keywords: ['lifebuoy', 'soap', 'sabun', 'साबुन'], match: 'lifebuoy' },
  { keywords: ['colgate', 'toothpaste', 'paste', 'dant manjan', 'कोलगेट', 'पेस्ट'], match: 'colgate' },
  { keywords: ['head and shoulders', 'shampoo', 'head & shoulders', 'शैम्पू'], match: 'head & shoulders' },
  { keywords: ['dettol', 'handwash', 'डेटॉल'], match: 'dettol' },
  { keywords: ['vim', 'bartan', 'dishwash', 'विम'], match: 'vim' },
  { keywords: ['harpic', 'हारपिक'], match: 'harpic' },
  { keywords: ['surf', 'surf excel', 'detergent', 'powder', 'सर्फ'], match: 'surf excel' },
];

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function QuickTapPage() {
  const qc = useQueryClient();

  // Active view filters
  const [activeTab, setActiveTab] = useState('top'); // 'top' | 'all' | 'selected'
  const [searchQuery, setSearchQuery] = useState('');

  // Map of { productId → quantitySold }
  const [counts, setCounts] = useState({});

  // Voice recognition state (Automatic multilingual recognition)
  const [isListening, setIsListening] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState(null); // { rawText, matches: [{ name, qty, unit }] }
  const recognitionRef = useRef(null);

  // CSV Import modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);

  // CSV Import summary banner (post-import)
  const [lastImportSummary, setLastImportSummary] = useState(null);

  /* ── Fetch ALL user products (for comprehensive matching & catalog) ──────── */
  const { data: allProducts = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await apiClient.get('/products?limit=100');
      const payload = res.data?.data || res.data;
      return payload?.products || (Array.isArray(payload) ? payload : []);
    },
  });

  const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];

  /* ── Top sellers list ────────────────────────────────────────────────────── */
  const topSellers = useMemo(() => {
    return safeAllProducts.filter((p) => p.isTopSeller);
  }, [safeAllProducts]);

  /* ── Filtered products to display on screen ──────────────────────────────── */
  const displayProducts = useMemo(() => {
    let list = [];
    if (activeTab === 'top') {
      list = topSellers.length > 0 ? topSellers : safeAllProducts;
    } else if (activeTab === 'selected') {
      list = safeAllProducts.filter((p) => (counts[p._id] ?? 0) > 0);
    } else {
      list = safeAllProducts;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
  }, [safeAllProducts, topSellers, activeTab, searchQuery, counts]);

  /* ── Save sales mutation ────────────────────────────────────────────────── */
  const saveSales = useMutation({
    mutationFn: (entries) => apiClient.post('/sales/batch', { entries }),
    onSuccess: () => {
      toast.success("Today's sales saved & stock levels updated!");
      setCounts({});
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save sales.');
    },
  });

  const increment = (id) =>
    setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));

  const decrement = (id) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));

  const handleSave = () => {
    const entries = Object.entries(counts)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantitySold]) => ({
        productId,
        quantitySold,
        date: todayISO(),
        source: 'manual',
      }));

    if (entries.length === 0) {
      toast('No sales recorded yet — tap + on products or use Voice Note.', { icon: '🛒' });
      return;
    }
    saveSales.mutate(entries);
  };

  /* ── Universal Multi-tiered Product Matcher (Voice & CSV) ─────────────── */
  const findProductMatch = (desc) => {
    if (!desc || !safeAllProducts.length) return null;
    const cleanDesc = desc.toLowerCase().trim();
    const normSpoken = universalPhonetic(cleanDesc);

    // Tier 1: Check known Kirana aliases dictionary
    for (const alias of PRODUCT_ALIASES) {
      if (
        alias.keywords.some(
          (kw) => cleanDesc.includes(kw.toLowerCase()) || (normSpoken && normSpoken.includes(universalPhonetic(kw)))
        )
      ) {
        const found = safeAllProducts.find((p) => p.name.toLowerCase().includes(alias.match.toLowerCase()));
        if (found) return found;
      }
    }

    // Tier 2: Direct phonetic substring matching across all catalog products
    for (const p of safeAllProducts) {
      const normCatalog = universalPhonetic(p.name);
      if (normCatalog.includes(normSpoken) || normSpoken.includes(normCatalog)) {
        return p;
      }
    }

    // Tier 3: Universal fuzzy acoustic scoring (Levenshtein token distance)
    const spokenTokens = normSpoken.split(/\s+/).filter(Boolean);
    let bestProduct = null;
    let bestScore = 0;

    for (const p of safeAllProducts) {
      const normCatalog = universalPhonetic(`${p.name} ${p.brand || ''} ${p.category || ''}`);
      const catalogTokens = normCatalog.split(/\s+/).filter(
        (t) => isNaN(t) && t !== 'g' && t !== 'ml' && t !== 'l' && t !== 'kg'
      );

      let totalScore = 0;
      for (const st of spokenTokens) {
        let maxTokScore = 0;
        for (const ct of catalogTokens) {
          const sim = similarity(st, ct);
          if (sim > maxTokScore) maxTokScore = sim;
        }
        totalScore += maxTokScore;
      }
      const avgScore = spokenTokens.length ? totalScore / spokenTokens.length : 0;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestProduct = p;
      }
    }

    return bestScore >= 0.60 ? bestProduct : null;
  };

  /* ── Bi-directional Voice Input Parser ───────────────────────────────────── */
  const parseVoiceInput = (rawText) => {
    let text = rawText.toLowerCase().trim();

    // 1. Replace Devanagari numerals (० to ९) with 0-9
    text = text.replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d] || d);

    // 2. Replace number words (English + Hinglish + Devanagari + acoustic sound-alikes) with digits
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      const escaped = word.replace("'", "\\'");
      const rx = new RegExp(`(?<=^|[\\s.,!?:;])${escaped}(?=$|[\\s.,!?:;])`, 'gi');
      text = text.replace(rx, ` ${val} `);
    }

    // 3. Strip Hindi danda (।), dots, commas, question marks, quotes
    text = text.replace(/[।.,?!;:"']/g, ' ');

    // 4. Clean common Hindi filler, verb particles & unit words
    const fillers = [
      'aaj', 'bika', 'bik gaya', 'biki', 'bike', 'begin', 'diya', 'diye', 'becha', 'beche', 'hoga',
      'ka', 'ki', 'ke', 'ko', 'hai', 'hain', 'wali', 'wale',
      'आज', 'बिका', 'बिकी', 'बिके', 'बिक गया', 'बिक गए', 'दिया', 'दिए', 'बेचा', 'बेचे', 'होगा', 'है', 'हैं', 'का', 'की', 'के', 'को', 'वाले', 'वाली',
      'pack', 'packet', 'bottle', 'piece', 'pcs', 'cup', 'bori', 'bag', 'units', 'litres', 'litre', 'liter', 'kg', 'kilo', 'gram',
      'पैकेट', 'पैक', 'बोतल', 'पीस', 'कप', 'बोरी', 'बैग', 'किलो', 'लीटर'
    ];
    for (const f of fillers) {
      const rx = new RegExp(`(?<=^|\\s)${f}(?=$|\\s)`, 'gi');
      text = text.replace(rx, ' ');
    }

    // 5. Split input by phrase separators: "aur", "and", "और", "or", ",", ";", "+", "&"
    const phrases = text.split(/\s*(?:,|;|\band\b|\baur\b|और|or|\+|\&)\s*/i).filter((p) => p.trim());
    const segments = [];

    for (const phrase of phrases) {
      const tokens = phrase.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;

      let currentQty = null;
      let currentDesc = [];
      const startsWithNum = /^\d+$/.test(tokens[0]);

      if (startsWithNum) {
        // Pattern: <qty> <desc...> <qty> <desc...>
        for (const t of tokens) {
          if (/^\d+$/.test(t)) {
            if (currentQty !== null && currentDesc.length > 0) {
              segments.push({ qty: currentQty, desc: currentDesc.join(' ') });
              currentDesc = [];
            }
            currentQty = parseInt(t, 10);
          } else {
            currentDesc.push(t);
          }
        }
        if (currentQty !== null && currentDesc.length > 0) {
          segments.push({ qty: currentQty, desc: currentDesc.join(' ') });
        }
      } else {
        // Pattern: <desc...> <qty> <desc...> <qty>
        for (const t of tokens) {
          if (/^\d+$/.test(t)) {
            const qty = parseInt(t, 10);
            if (currentDesc.length > 0) {
              segments.push({ qty, desc: currentDesc.join(' ') });
              currentDesc = [];
            }
          } else {
            currentDesc.push(t);
          }
        }
        if (currentDesc.length > 0 && currentQty !== null) {
          segments.push({ qty: currentQty, desc: currentDesc.join(' ') });
        }
      }
    }

    // Fallback: If no segments were extracted but there's a digit somewhere
    if (segments.length === 0) {
      const numMatch = text.match(/\b(\d+)\b/);
      if (numMatch) {
        const qty = parseInt(numMatch[1], 10);
        const desc = text.replace(/\b\d+\b/g, '').trim();
        if (desc) segments.push({ qty, desc });
      }
    }

    const matchedResults = [];
    const updated = { ...counts };

    for (const seg of segments) {
      const matched = findProductMatch(seg.desc);
      if (matched) {
        updated[matched._id] = (updated[matched._id] || 0) + seg.qty;
        matchedResults.push({
          productId: matched._id,
          name: matched.name,
          qty: seg.qty,
          unit: matched.unit || 'units',
        });
      }
    }

    const displayHeard = formatDisplayTranscript(rawText);

    if (matchedResults.length > 0) {
      setCounts(updated);
      setVoiceBanner({
        rawText: displayHeard,
        matches: matchedResults,
      });
      toast.success(`Voice Recognized: Updated ${matchedResults.length} item(s)!`);
    } else {
      setVoiceBanner({
        rawText: displayHeard,
        matches: [],
      });
      toast(`Heard: "${displayHeard}", but couldn't match product. Try: "10 fortune oil 5 maggi" or "milk 2"`, {
        icon: '🎙️',
        duration: 4500,
      });
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is supported in Google Chrome and Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Unified multi-lingual mode (handles Hindi, Hinglish & English)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceBanner(null);
    };

    recognition.onresult = (event) => {
      const transcriptText = event.results[0][0].transcript;
      parseVoiceInput(transcriptText);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error('Microphone access denied or speech timed out.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* ── CSV Parsing & Local Preview ────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || [];
        const previewRows = rows.map((row) => {
          const rawName = (
            row.name ||
            row.productName ||
            row.item ||
            row['Product Name'] ||
            row['Item Name'] ||
            ''
          ).toString().trim();
          const qty = Number(
            row.quantitySold ||
            row.quantity_sold ||
            row.qty ||
            row.quantity ||
            row['Quantity'] ||
            row['Qty'] ||
            0
          );
          const matched = findProductMatch(rawName);

          return {
            rawName,
            qty,
            matchedProduct: matched,
          };
        });
        setCsvPreview(previewRows);
      },
    });
  };

  /* ── Action 1: Load CSV directly into Quick-Tap counters on page ────────── */
  const handleLoadCsvIntoCounters = () => {
    if (!csvPreview.length) return;

    const newCounts = { ...counts };
    let loadedCount = 0;

    csvPreview.forEach((row) => {
      if (row.matchedProduct && row.qty > 0) {
        newCounts[row.matchedProduct._id] = (newCounts[row.matchedProduct._id] || 0) + row.qty;
        loadedCount++;
      }
    });

    if (loadedCount === 0) {
      toast.error('Could not match any products from CSV with your inventory.');
      return;
    }

    setCounts(newCounts);
    setActiveTab('selected');
    setShowCsvModal(false);
    toast.success(`Loaded ${loadedCount} items from CSV into Quick-Tap counters! Adjust numbers & click Save.`);
  };

  /* ── Action 2: Direct Server Upload & Stock Log ─────────────────────────── */
  const handleDirectUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file first.');
      return;
    }

    setImportingCsv(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await apiClient.post('/sales/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const payload = res.data?.data || res.data;
      const importedItems = payload?.items || [];
      const unmatched = payload?.unmatched || [];

      // Store summary card to display prominently on page
      setLastImportSummary({
        fileName: csvFile.name,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        count: importedItems.length,
        items: importedItems,
        unmatched,
      });

      toast.success(`Successfully imported ${importedItems.length} sales and updated stock!`);
      setShowCsvModal(false);
      setCsvFile(null);
      setCsvPreview([]);

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products-all'] });
      qc.invalidateQueries({ queryKey: ['top-sellers'] });
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import CSV. Check format.');
    } finally {
      setImportingCsv(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'Product Name,Quantity,Date\n' +
        'Fortune Sunflower Oil 1L,4,2026-10-20\n' +
        'Parle-G 100g,15,2026-10-20\n' +
        'Maggi Noodles 70g,8,2026-10-20\n' +
        'Amul Full Cream Milk 1L,10,2026-10-20\n' +
        'Bisleri 1L,6,2026-10-20\n'
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'inventiq_sales_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems = Object.values(counts).reduce((sum, v) => sum + v, 0);
  const selectedCount = Object.values(counts).filter((v) => v > 0).length;
  const totalAmount = useMemo(() => {
    return Object.entries(counts).reduce((sum, [id, qty]) => {
      if (qty <= 0) return sum;
      const p = safeAllProducts.find((item) => item._id === id);
      return sum + (p?.sellingPrice ? p.sellingPrice * qty : 0);
    }, 0);
  }, [counts, safeAllProducts]);

  if (isLoadingAll) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 md:space-y-5 pb-32">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Daily Sales Entry</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 font-normal">{todayLabel()}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Voice Note Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl border font-semibold transition-all shadow-2xs ${isListening
              ? 'bg-red-600 text-white border-red-600 animate-pulse'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            title="Tap to speak items sold today in Hindi or English (e.g. '10 milk 5 oil')"
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} className="text-emerald-600" />}
            <span>{isListening ? 'Listening…' : 'Voice Note'}</span>
          </button>

          {/* CSV Import Button */}
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 bg-white font-semibold rounded-xl"
            title="Import from Vyapar / Khatabook / Excel"
          >
            <FileSpreadsheet size={15} className="text-primary-600" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* ── Voice Feedback Banner ─────────────────────────────────────────── */}
      {voiceBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${voiceBanner.matches.length > 0
            ? 'bg-green-50 border-green-200 text-green-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={15} className={voiceBanner.matches.length > 0 ? 'text-green-600' : 'text-amber-600'} />
              <span>Voice Note Heard:</span>
              <span className="italic font-normal">"{voiceBanner.rawText}"</span>
            </div>
            <button
              onClick={() => setVoiceBanner(null)}
              className="text-gray-400 hover:text-gray-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {voiceBanner.matches.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-medium text-green-700">Matched & Updated:</span>
              {voiceBanner.matches.map((m, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-green-300 text-green-800 font-bold px-2 py-0.5 rounded shadow-2xs text-[11px]"
                >
                  {m.name}: +{m.qty} {m.unit}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-amber-800">
              No matching products found. Tip: Say numbers and product names clearly, like{' '}
              <strong>"10 fortune oil 5 maggi"</strong> or <strong>"parle-g 10"</strong>.
            </p>
          )}
        </div>
      )}

      {/* ── Persistent CSV Import Summary Card ─────────────────────────────── */}
      {lastImportSummary && (
        <div className="card border-primary-300 bg-primary-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-primary-600" size={18} />
              <h3 className="font-bold text-gray-800 text-sm">
                CSV Sales Imported: <span className="text-primary-700">{lastImportSummary.fileName}</span>
              </h3>
              <span className="text-[11px] text-gray-500">({lastImportSummary.timestamp})</span>
            </div>
            <button
              onClick={() => setLastImportSummary(null)}
              className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              title="Dismiss summary"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-600">
            Recorded <strong>{lastImportSummary.count} products</strong> directly into sales history and updated inventory stock levels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {lastImportSummary.items.map((it, idx) => (
              <div key={idx} className="bg-white border border-primary-200 rounded-lg p-2.5 shadow-2xs space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-800 truncate pr-1">{it.productName}</span>
                  <span className="font-bold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                    -{it.quantitySold} {it.unit}
                  </span>
                </div>
                {it.previousStock !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <span>Stock: {it.previousStock}</span>
                    <ArrowRight size={11} className="text-gray-400" />
                    <span className="font-bold text-gray-800">{it.newStock} remaining</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {lastImportSummary.unmatched && lastImportSummary.unmatched.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs mt-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>
                {lastImportSummary.unmatched.length} row(s) skipped (not found in catalog):{' '}
                {lastImportSummary.unmatched.map((u) => u.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Search & Filter Controls Card ────────────────────────────────────── */}
      <div className="card p-3 space-y-2.5">
        {/* Real-time Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product or brand to tap..."
            className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-gray-200 rounded-xl bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* 3-Segmented Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('top')}
            className={`py-2 px-1.5 rounded-lg text-center transition-all truncate flex items-center justify-center gap-1 ${activeTab === 'top'
              ? 'bg-white text-gray-900 shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            <span>⭐ Top</span>
            <span className="text-[11px] opacity-75">({topSellers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1.5 rounded-lg text-center transition-all truncate flex items-center justify-center gap-1 ${activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            <span>📦 All</span>
            <span className="text-[11px] opacity-75">({safeAllProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('selected')}
            className={`py-2 px-1.5 rounded-lg text-center transition-all truncate flex items-center justify-center gap-1 ${activeTab === 'selected'
              ? 'bg-emerald-600 text-white shadow-2xs font-bold'
              : selectedCount > 0
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            <span>✅ Selected</span>
            <span className="text-[11px]">({selectedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Product Cards Grid (High Density, Kirana Touch Optimized) ────────── */}
      {displayProducts.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-600 text-sm">No matching products found.</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'selected'
              ? 'No products have been keyed in yet today. Tap + on any product or use Voice Note.'
              : 'Try clearing your search query or switch to "All Products".'}
          </p>
          {activeTab === 'selected' && (
            <button
              onClick={() => setActiveTab('all')}
              className="btn-outline text-xs mt-3 mx-auto py-1.5 px-3"
            >
              Browse All Products
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {displayProducts.map((product) => {
            const qty = counts[product._id] ?? 0;
            const isLow = product.currentStock <= (product.reorderPoint || 5);
            return (
              <div
                key={product._id}
                className={`p-3 bg-white rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${qty > 0
                  ? 'border-emerald-500 bg-emerald-50/20 ring-1.5 ring-emerald-500/40 shadow-xs'
                  : 'border-gray-200/90 hover:border-gray-300 shadow-2xs'
                  }`}
              >
                {/* Product Info, Price & Stock */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                      {product.name}
                    </h4>
                    {product.isTopSeller && (
                      <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.2 rounded font-extrabold flex items-center gap-0.5 shrink-0">
                        <Star size={9} fill="currentColor" /> Top
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 flex-wrap">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px] font-medium">
                      {product.category}
                    </span>
                    {product.sellingPrice ? (
                      <span className="font-extrabold text-gray-900 text-xs">
                        ₹{product.sellingPrice}
                      </span>
                    ) : null}
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${isLow
                        ? 'bg-red-50 text-red-600 font-bold'
                        : 'text-gray-400'
                        }`}
                    >
                      Stock: {product.currentStock} {product.unit || 'units'}
                    </span>
                  </div>

                  {/* If qty > 0, live item subtotal */}
                  {qty > 0 && product.sellingPrice ? (
                    <div className="text-[11px] font-bold text-emerald-700 mt-1">
                      Subtotal: {qty} × ₹{product.sellingPrice} = ₹{(qty * product.sellingPrice).toLocaleString('en-IN')}
                    </div>
                  ) : null}
                </div>

                {/* Tactile Quick-Tap Stepper */}
                <div className="flex items-center gap-1 shrink-0 bg-gray-50/80 p-1 rounded-xl border border-gray-200/70">
                  <button
                    type="button"
                    onClick={() => decrement(product._id)}
                    disabled={qty === 0}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all active:scale-90 ${qty > 0
                      ? 'bg-white text-red-600 hover:bg-red-50 shadow-2xs border border-gray-200'
                      : 'text-gray-300 cursor-not-allowed opacity-30'
                      }`}
                    title="Decrease (-1)"
                  >
                    <Minus size={15} />
                  </button>

                  <div className="w-10 text-center select-none">
                    <span
                      className={`text-base font-black block leading-none ${qty > 0 ? 'text-emerald-700 font-black' : 'text-gray-300'
                        }`}
                    >
                      {qty}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-tight block mt-0.5 truncate font-medium">
                      {product.unit || 'units'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => increment(product._id)}
                    className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white flex items-center justify-center font-bold shadow-2xs transition-all"
                    title="Increase (+1)"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Floating Sticky Bottom Save Bar (Visible above bottom nav when items selected) ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-[68px] inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
          <div
            className="pointer-events-auto max-w-3xl mx-auto p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-fade-up"
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #a7f3d0',
              boxShadow: '0 12px 32px -4px rgba(16, 185, 129, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                  {totalAmount > 0 && (
                    <span className="text-emerald-700 font-extrabold ml-1">
                      • ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[11px] text-gray-500 block truncate mt-0.5 font-medium">
                Across {selectedCount} unique product{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCounts({})}
                className="px-2.5 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition text-xs font-semibold flex items-center gap-1 border border-gray-200 bg-gray-50/80"
                title="Reset all counters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveSales.isPending}
                className="btn-primary py-2 px-4 sm:px-5 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                {saveSales.isPending ? 'Updating…' : 'Save Sales ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import Modal with Live Preview ───────────────────────────────── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FileSpreadsheet className="text-primary-600" size={20} />
                Import Sales from Billing App
              </h3>
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Export sales from <strong>Vyapar</strong>, <strong>Khatabook</strong>, or any spreadsheet and import them here. InventIQ automatically matches product names and updates inventory stock.
            </p>

            <form onSubmit={handleDirectUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-primary-400 transition-colors bg-gray-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block">
                  <Upload size={28} className="mx-auto text-primary-600 mb-2" />
                  <span className="text-xs font-semibold text-gray-700 block">
                    {csvFile ? csvFile.name : 'Click to select CSV file'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">Supports standard .csv format</span>
                </label>
              </div>

              {/* Live Preview of parsed rows */}
              {csvPreview.length > 0 && (
                <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/70">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Parsed Items ({csvPreview.length})</span>
                    <span className="text-primary-600 font-semibold text-[11px]">
                      {csvPreview.filter((r) => r.matchedProduct).length} matched to inventory
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 text-xs max-h-48 overflow-y-auto pr-1">
                    {csvPreview.map((row, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="font-semibold text-gray-800">{row.rawName || 'Unnamed'}</span>
                          {row.matchedProduct ? (
                            <span className="block text-[10px] text-green-600 font-medium">
                              ✓ Matched: {row.matchedProduct.name} (Stock: {row.matchedProduct.currentStock})
                            </span>
                          ) : (
                            <span className="block text-[10px] text-amber-600 font-medium">
                              ⚠ Not matched in catalog (will be skipped)
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] shrink-0">
                          {row.qty} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-primary-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Download size={13} />
                  Download Sample CSV
                </button>
                <span className="text-gray-400 text-[11px]">Required headers: Product Name, Quantity</span>
              </div>

              {/* Action Buttons: Dual Option (Counters Draft vs Immediate Log) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleLoadCsvIntoCounters}
                    disabled={!csvFile || csvPreview.length === 0}
                    className="btn-outline flex-1 text-xs py-2.5 font-semibold disabled:opacity-40"
                    title="Populate the sales counter cards so you can review and adjust numbers before saving"
                  >
                    Load into Sales Counters
                  </button>

                  <button
                    type="submit"
                    disabled={!csvFile || importingCsv}
                    className="btn-primary flex-1 text-xs py-2.5 font-semibold disabled:opacity-40"
                    title="Directly save sales to database and immediately deduct stock"
                  >
                    {importingCsv ? 'Importing…' : 'Log Directly to Stock'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
