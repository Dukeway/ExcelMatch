// Replaces 'vite/client' reference which was missing
// Defines process.env for API_KEY usage as per guidelines

declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
