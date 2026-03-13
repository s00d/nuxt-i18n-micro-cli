const UI_LABELS = {
  save: 'Save',
  cancel: 'Cancel',
} as const

export function getActionLabel(kind: 'save' | 'cancel') {
  return UI_LABELS[kind]
}
