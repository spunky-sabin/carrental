export {};

declare global {
  type GoogleCredentialResponse = {
    credential: string;
  };

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
            }
          ): void;
        };
      };
    };
    __google_gsi_initialized?: boolean;
    __google_gsi_callback?: (response: GoogleCredentialResponse) => void;
  }
}
