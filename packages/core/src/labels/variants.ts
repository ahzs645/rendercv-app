export const THEME_LABELS: Record<string, string> = {
  classic: 'Classic',
  engineeringclassic: 'Engineering Classic',
  engineeringresumes: 'Engineering Resumes',
  moderncv: 'ModernCV',
  sb2nov: 'Sb2nov'
};

export const LOCALE_LABELS: Record<string, { flag: string; name: string }> = {
  english: { flag: '🇬🇧', name: 'English' },
  arabic: { flag: '🇸🇦', name: 'Arabic' },
  danish: { flag: '🇩🇰', name: 'Danish' },
  dutch: { flag: '🇳🇱', name: 'Dutch' },
  french: { flag: '🇫🇷', name: 'French' },
  german: { flag: '🇩🇪', name: 'German' },
  hebrew: { flag: '🇮🇱', name: 'Hebrew' },
  hindi: { flag: '🇮🇳', name: 'Hindi' },
  indonesian: { flag: '🇮🇩', name: 'Indonesian' },
  italian: { flag: '🇮🇹', name: 'Italian' },
  japanese: { flag: '🇯🇵', name: 'Japanese' },
  korean: { flag: '🇰🇷', name: 'Korean' },
  mandarin_chinese: { flag: '🇨🇳', name: 'Mandarin Chinese' },
  norwegian_bokmål: { flag: '🇳🇴', name: 'Norwegian Bokmål' },
  norwegian_nynorsk: { flag: '🇳🇴', name: 'Norwegian Nynorsk' },
  persian: { flag: '🇮🇷', name: 'Persian' },
  portuguese: { flag: '🇵🇹', name: 'Portuguese' },
  russian: { flag: '🇷🇺', name: 'Russian' },
  spanish: { flag: '🇪🇸', name: 'Spanish' },
  turkish: { flag: '🇹🇷', name: 'Turkish' }
};

export function themeLabel(key: string) {
  return THEME_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function localeLabel(key: string) {
  const locale = LOCALE_LABELS[key];
  return locale ? `${locale.flag} ${locale.name}` : key.charAt(0).toUpperCase() + key.slice(1);
}
