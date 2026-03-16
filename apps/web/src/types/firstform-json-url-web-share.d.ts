declare module '@firstform/json-url/web-share' {
  import type { CreateEngineOptions, EngineClient, JsonUrlValue } from '@firstform/json-url';

  export default function createWebShareEngine<TValue = JsonUrlValue>(
    options?: CreateEngineOptions
  ): EngineClient<TValue>;
}
