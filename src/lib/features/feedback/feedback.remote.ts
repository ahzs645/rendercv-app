// Stub: form action object for feedback (static build)
function noopField(name: string) {
  return {
    as: (_type: string) => ({ name, type: _type }),
    value: '',
    errors: [],
  };
}

export const submitFeedback = {
  enhance: (callback?: any) => ({ method: 'POST', action: '?/feedback' }),
  fields: {
    message: noopField('message'),
    email: noopField('email'),
    type: noopField('type'),
    page: noopField('page'),
  },
  result: null,
  pending: false,
};
