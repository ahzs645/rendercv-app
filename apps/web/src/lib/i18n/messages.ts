/**
 * UI message catalogue.
 *
 * English is the source of truth: its keys define the `MessageKey` union, so a
 * translation that drifts out of sync fails to typecheck rather than silently
 * falling back at runtime. Keys are grouped by the surface they appear on.
 *
 * Only the app's own chrome belongs here. CV content, section titles and theme
 * or locale names come from the user's document and are never translated.
 */
export const en = {
  // Section tabs
  'section.cv': 'CV',
  'section.design': 'Design',
  'section.locale': 'Locale',
  'section.settings': 'Settings',
  'section.theme': 'Theme',
  'section.localePicker': 'Locale',
  'section.variant': 'Variant',
  'section.newVariant': 'New variant',
  'section.importVariants': 'Import variants…',
  'section.importingVariants': 'Importing…',
  'section.hideArchived': 'Hide archived entries',
  'section.themeLibrary': 'Theme library…',
  'section.importTheme': 'Import theme…',
  'section.importingTheme': 'Importing…',

  // Editor / workspace
  'editor.yaml': 'YAML',
  'editor.form': 'Form',
  'editor.wordWrap': 'Word wrap',
  'editor.undo': 'Undo',
  'editor.redo': 'Redo',
  'editor.copy': 'Copy',
  'editor.copied': 'Copied',

  // Preview
  'preview.title': 'Preview',
  'preview.zoomIn': 'Zoom in',
  'preview.zoomOut': 'Zoom out',
  'preview.fitWidth': 'Fit width',
  'preview.download': 'Download PDF',
  'preview.rendering': 'Rendering…',
  'preview.page': 'Page',

  // Files
  'files.title': 'Files',
  'files.new': 'New CV',
  'files.rename': 'Rename',
  'files.duplicate': 'Duplicate',
  'files.delete': 'Delete',
  'files.archive': 'Archive',
  'files.restore': 'Restore',
  'files.archived': 'Archived',
  'files.trash': 'Trash',
  'files.import': 'Import YAML…',
  'files.export': 'Export',

  // Settings dialog
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.colorMode': 'Color mode',
  'settings.colorMode.light': 'Light',
  'settings.colorMode.dark': 'Dark',
  'settings.colorMode.system': 'System',
  'settings.language': 'Interface language',
  'settings.language.help': 'Changes the app’s own labels. Your CV content is untouched.',
  'settings.data': 'Data',
  'settings.clearData': 'Clear local data',

  // Sidebar
  'sidebar.newCv': 'Create new CV',
  'sidebar.settings': 'App settings',
  'sidebar.settingsHint': 'App settings — AI providers and data',
  'sidebar.tour': 'Product Tour',
  'sidebar.tourHint': 'Start product tour',
  'sidebar.feedback': 'Send feedback',

  // Toolbar
  'toolbar.download': 'Download',
  'toolbar.downloadPdf': 'Download PDF',
  'toolbar.moreDownload': 'More download options',
  'toolbar.share': 'Share',
  'toolbar.sharePdf': 'Share PDF',
  'toolbar.moreShare': 'More share options',
  'toolbar.zoom': 'Zoom',
  'toolbar.resetZoom': 'Reset zoom',
  'toolbar.copyShareLink': 'Copy share link',
  'toolbar.copyPdfLink': 'Copy PDF download link',
  'toolbar.copyMarkdown': 'Copy as Markdown',

  // Preview
  'preview.dismissWarnings': 'Dismiss warnings',

  'files.importYaml': 'Import YAML',
  'files.importingYaml': 'Importing YAML…',
  'files.importYamlFile': 'Import YAML file',
  'sidebar.privacy': 'Privacy Policy',
  'sidebar.terms': 'Terms of Service',
  'preview.fitToPage': 'Fit to page',

  'sidebar.cvs': 'CVs',
  'sidebar.links': 'Links',
  'sidebar.closeList': 'Close CV list',
  'sidebar.noArchived': 'No archived CVs.',
  'sidebar.trashEmpty': 'Trash is empty.',
  'workspace.noCvOpen': 'No CV open',
  'workspace.dropHint': 'You can also drop a cv.yaml anywhere on this page.',
  'workspace.newFromFile': 'A new CV will be created from the file.',
  'toolbar.settings': 'Settings',
  'toolbar.workspaceActions': 'Workspace actions',
  'toolbar.shareAndExport': 'Share and export',
  'toolbar.shareLinks': 'Share links',
  'toolbar.exportFiles': 'Export files',
  'toolbar.exportPdf': 'Export PDF',
  'toolbar.exportMarkdown': 'Export Markdown',
  'toolbar.exportJson': 'Export JSON',
  'toolbar.exportSource': 'Export source (.typ)',
  'toolbar.backupFile': 'Backup file',
  'toolbar.backupFiles': 'Backup files',
  'toolbar.sendPdf': 'Send PDF',
  'toolbar.importBackup': 'Import backup or review copy',
  'review.proposals': 'Review proposals',
  'review.reviewerName': 'Reviewer name',
  'review.copyLink': 'Copy review-copy link',
  'review.exportPackage': 'Export review package',
  'review.importPackage': 'Import review package',
  'settings.downloadAll': 'Download all data',
  'settings.emptyTrash': 'Empty trash',
  'settings.clearAll': 'Clear all data',
  'form.entryType': 'Entry type',
  'form.sectionTitle': 'Section title',
  'form.deleteSection': 'Delete section',
  'form.dragSection': 'Drag to reorder section',
  'form.remove': 'Remove',
  'form.removePosition': 'Remove position',
  'form.movePositionUp': 'Move position up',
  'form.movePositionDown': 'Move position down',
  'form.toggleDetails': 'Toggle entry details',
  'form.archivedHint': 'Tagged archived — always excluded from the PDF',
  'form.previousTheme': 'Previous theme',
  'form.nextTheme': 'Next theme',

  // Common
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.close': 'Close',
  'common.confirm': 'Confirm',
  'common.loading': 'Loading…',
  'common.error': 'Something went wrong.'
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

export const ko: Messages = {
  'section.cv': '이력서',
  'section.design': '디자인',
  'section.locale': '로케일',
  'section.settings': '설정',
  'section.theme': '테마',
  'section.localePicker': '로케일',
  'section.variant': '변형',
  'section.newVariant': '새 변형',
  'section.importVariants': '변형 가져오기…',
  'section.importingVariants': '가져오는 중…',
  'section.hideArchived': '보관된 항목 숨기기',
  'section.themeLibrary': '테마 라이브러리…',
  'section.importTheme': '테마 가져오기…',
  'section.importingTheme': '가져오는 중…',

  'editor.yaml': 'YAML',
  'editor.form': '양식',
  'editor.wordWrap': '자동 줄바꿈',
  'editor.undo': '실행 취소',
  'editor.redo': '다시 실행',
  'editor.copy': '복사',
  'editor.copied': '복사됨',

  'preview.title': '미리보기',
  'preview.zoomIn': '확대',
  'preview.zoomOut': '축소',
  'preview.fitWidth': '너비 맞춤',
  'preview.download': 'PDF 내려받기',
  'preview.rendering': '렌더링 중…',
  'preview.page': '페이지',

  'files.title': '파일',
  'files.new': '새 이력서',
  'files.rename': '이름 바꾸기',
  'files.duplicate': '복제',
  'files.delete': '삭제',
  'files.archive': '보관',
  'files.restore': '복원',
  'files.archived': '보관됨',
  'files.trash': '휴지통',
  'files.import': 'YAML 가져오기…',
  'files.export': '내보내기',

  'settings.title': '설정',
  'settings.appearance': '화면',
  'settings.colorMode': '색상 모드',
  'settings.colorMode.light': '밝게',
  'settings.colorMode.dark': '어둡게',
  'settings.colorMode.system': '시스템 설정',
  'settings.language': '인터페이스 언어',
  'settings.language.help': '앱의 표시 언어만 바뀝니다. 이력서 내용은 변경되지 않습니다.',
  'settings.data': '데이터',
  'settings.clearData': '로컬 데이터 지우기',

  'sidebar.newCv': '새 이력서 만들기',
  'sidebar.settings': '앱 설정',
  'sidebar.settingsHint': '앱 설정 — AI 제공자 및 데이터',
  'sidebar.tour': '제품 둘러보기',
  'sidebar.tourHint': '제품 둘러보기 시작',
  'sidebar.feedback': '의견 보내기',

  'toolbar.download': '내려받기',
  'toolbar.downloadPdf': 'PDF 내려받기',
  'toolbar.moreDownload': '내려받기 옵션 더 보기',
  'toolbar.share': '공유',
  'toolbar.sharePdf': 'PDF 공유',
  'toolbar.moreShare': '공유 옵션 더 보기',
  'toolbar.zoom': '확대/축소',
  'toolbar.resetZoom': '확대/축소 초기화',
  'toolbar.copyShareLink': '공유 링크 복사',
  'toolbar.copyPdfLink': 'PDF 내려받기 링크 복사',
  'toolbar.copyMarkdown': '마크다운으로 복사',

  'preview.dismissWarnings': '경고 닫기',

  'files.importYaml': 'YAML 가져오기',
  'files.importingYaml': 'YAML 가져오는 중…',
  'files.importYamlFile': 'YAML 파일 가져오기',
  'sidebar.privacy': '개인정보 처리방침',
  'sidebar.terms': '이용약관',
  'preview.fitToPage': '페이지에 맞춤',

  'sidebar.cvs': 'CV 목록',
  'sidebar.links': '링크',
  'sidebar.closeList': 'CV 목록 닫기',
  'sidebar.noArchived': '보관된 CV가 없습니다.',
  'sidebar.trashEmpty': '휴지통이 비어 있습니다.',
  'workspace.noCvOpen': '열린 CV가 없습니다',
  'workspace.dropHint': '이 페이지 아무 곳에나 cv.yaml 파일을 끌어다 놓아도 됩니다.',
  'workspace.newFromFile': '파일에서 새 CV가 생성됩니다.',
  'toolbar.settings': '설정',
  'toolbar.workspaceActions': '작업 공간 동작',
  'toolbar.shareAndExport': '공유 및 내보내기',
  'toolbar.shareLinks': '공유 링크',
  'toolbar.exportFiles': '파일 내보내기',
  'toolbar.exportPdf': 'PDF 내보내기',
  'toolbar.exportMarkdown': '마크다운 내보내기',
  'toolbar.exportJson': 'JSON 내보내기',
  'toolbar.exportSource': '소스 내보내기 (.typ)',
  'toolbar.backupFile': '파일 백업',
  'toolbar.backupFiles': '파일 백업',
  'toolbar.sendPdf': 'PDF 보내기',
  'toolbar.importBackup': '백업 또는 검토본 가져오기',
  'review.proposals': '검토 제안',
  'review.reviewerName': '검토자 이름',
  'review.copyLink': '검토본 링크 복사',
  'review.exportPackage': '검토 패키지 내보내기',
  'review.importPackage': '검토 패키지 가져오기',
  'settings.downloadAll': '모든 데이터 내려받기',
  'settings.emptyTrash': '휴지통 비우기',
  'settings.clearAll': '모든 데이터 지우기',
  'form.entryType': '항목 유형',
  'form.sectionTitle': '섹션 제목',
  'form.deleteSection': '섹션 삭제',
  'form.dragSection': '끌어서 섹션 순서 변경',
  'form.remove': '제거',
  'form.removePosition': '직위 제거',
  'form.movePositionUp': '직위를 위로',
  'form.movePositionDown': '직위를 아래로',
  'form.toggleDetails': '항목 세부정보 펼치기/접기',
  'form.archivedHint': 'archived 태그 — PDF에서 항상 제외됩니다',
  'form.previousTheme': '이전 테마',
  'form.nextTheme': '다음 테마',

  'common.cancel': '취소',
  'common.save': '저장',
  'common.close': '닫기',
  'common.confirm': '확인',
  'common.loading': '불러오는 중…',
  'common.error': '문제가 발생했습니다.'
};

export const UI_LANGUAGES = {
  en: { label: 'English', messages: en as Messages },
  ko: { label: '한국어', messages: ko }
} as const;

export type UiLanguage = keyof typeof UI_LANGUAGES;

export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && value in UI_LANGUAGES;
}
