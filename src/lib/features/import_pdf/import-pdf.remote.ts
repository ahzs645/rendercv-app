// Stub: form action object for PDF import (static build)
function noopField(name: string) {
  return {
    as: (_type: string) => ({ name, type: _type }),
    value: undefined,
    errors: [],
  };
}

export const importPdf = {
  enhance: (callback?: any) => ({ method: 'POST', action: '?/import-pdf' }),
  fields: {
    pdf: noopField('pdf'),
  },
  result: null as { cv?: string } | null,
  pending: false,
};
