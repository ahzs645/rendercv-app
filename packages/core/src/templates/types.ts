export interface TemplateModule<TData> {
  id: string;
  label: string;
  schemaDescription: string;
  exampleYaml: string;
  render: (data: TData) => string;
  defaultFilename: (data: TData) => string;
}

