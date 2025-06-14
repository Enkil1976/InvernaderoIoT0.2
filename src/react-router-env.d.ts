import 'react-router-dom';

declare module 'react-router-dom' {
  interface FutureConfig {
    v7_relativeSplatPath?: boolean;
    v7_startTransition?: boolean;
    v7_fetcherPersist?: boolean;
    v7_normalizeFormMethod?: boolean;
    v7_partialHydration?: boolean;
    v7_skipActionErrorRevalidation?: boolean;
  }

  interface RouterOptions {
    future?: FutureConfig;
  }

  interface BrowserRouterProps {
    future?: FutureConfig;
  }

  interface RouterProviderProps {
    future?: FutureConfig;
  }

  interface Router {
    future?: FutureConfig;
  }
}
