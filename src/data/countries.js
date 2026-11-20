export const COUNTRIES = [
  // Top / Prioritaires
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳", placeholder: "20 123 456" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "06 12 34 56 78" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿", placeholder: "05 50 12 34 56" },
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦", placeholder: "06 12 34 56 78" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "(514) 555-0123" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪", placeholder: "0470 12 34 56" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭", placeholder: "078 123 45 67" },
  { code: "DE", name: "Allemagne", dialCode: "+49", flag: "🇩🇪", placeholder: "0151 12345678" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧", placeholder: "07911 123456" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸", placeholder: "(201) 555-0123" },
  { code: "IT", name: "Italie", dialCode: "+39", flag: "🇮🇹", placeholder: "320 123 4567" },
  { code: "ES", name: "Espagne", dialCode: "+34", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", placeholder: "3312 3456" },
  { code: "SA", name: "Arabie saoudite", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567" },
  { code: "EG", name: "Égypte", dialCode: "+20", flag: "🇪🇬", placeholder: "10 1234 5678" },
  { code: "SN", name: "Sénégal", dialCode: "+221", flag: "🇸🇳", placeholder: "77 123 45 67" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮", placeholder: "07 12 34 56 78" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺", placeholder: "628 123 456" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31", flag: "🇳🇱", placeholder: "06 12345678" },
  { code: "TR", name: "Turquie", dialCode: "+90", flag: "🇹🇷", placeholder: "501 234 5678" },
  { code: "LY", name: "Libye", dialCode: "+218", flag: "🇱🇾", placeholder: "91 123 4567" },
  { code: "MR", name: "Mauritanie", dialCode: "+222", flag: "🇲🇷", placeholder: "22 12 34 56" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", placeholder: "912 345 678" },
  { code: "SE", name: "Suède", dialCode: "+46", flag: "🇸🇪", placeholder: "070 123 45 67" },
  { code: "NO", name: "Norvège", dialCode: "+47", flag: "🇳🇴", placeholder: "412 34 567" },
  { code: "DK", name: "Danemark", dialCode: "+45", flag: "🇩🇰", placeholder: "32 12 34 56" },
  { code: "AT", name: "Autriche", dialCode: "+43", flag: "🇦🇹", placeholder: "0664 1234567" },
  { code: "IE", name: "Irlande", dialCode: "+353", flag: "🇮🇪", placeholder: "085 123 4567" },
  { code: "RO", name: "Roumanie", dialCode: "+40", flag: "🇷🇴", placeholder: "0712 345 678" },
  { code: "PL", name: "Pologne", dialCode: "+48", flag: "🇵🇱", placeholder: "512 345 678" },
  { code: "GR", name: "Grèce", dialCode: "+30", flag: "🇬🇷", placeholder: "691 234 5678" },
  { code: "BR", name: "Brésil", dialCode: "+55", flag: "🇧🇷", placeholder: "(11) 91234-5678" },
  { code: "AU", name: "Australie", dialCode: "+61", flag: "🇦🇺", placeholder: "0412 345 678" },
  { code: "JP", name: "Japon", dialCode: "+81", flag: "🇯🇵", placeholder: "090-1234-5678" },
  { code: "IN", name: "Inde", dialCode: "+91", flag: "🇮🇳", placeholder: "98123 45678" },
  { code: "CN", name: "Chine", dialCode: "+86", flag: "🇨🇳", placeholder: "131 2345 6789" },
  { code: "KR", name: "Corée du Sud", dialCode: "+82", flag: "🇰🇷", placeholder: "010-1234-5678" },
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27", flag: "🇿🇦", placeholder: "071 123 4567" },
  { code: "CM", name: "Cameroun", dialCode: "+237", flag: "🇨🇲", placeholder: "6 71 23 45 67" },
  { code: "MG", name: "Madagascar", dialCode: "+261", flag: "🇲🇬", placeholder: "32 12 345 67" },
  { code: "LB", name: "Liban", dialCode: "+961", flag: "🇱🇧", placeholder: "71 123 456" },
  { code: "JO", name: "Jordanie", dialCode: "+962", flag: "🇯🇴", placeholder: "7 9012 3456" },
  { code: "KW", name: "Koweït", dialCode: "+965", flag: "🇰🇼", placeholder: "5012 3456" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", placeholder: "9123 4567" },
  { code: "BH", name: "Bahreïn", dialCode: "+973", flag: "🇧🇭", placeholder: "3600 1234" }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // TN (+216)

export const findCountryByCode = (code) => {
  if (!code) return DEFAULT_COUNTRY;
  return COUNTRIES.find((c) => c.code.toUpperCase() === String(code).toUpperCase()) || DEFAULT_COUNTRY;
};

export const findCountryByDialCode = (dialCode) => {
  if (!dialCode) return DEFAULT_COUNTRY;
  const clean = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((c) => c.dialCode === clean) || DEFAULT_COUNTRY;
};
