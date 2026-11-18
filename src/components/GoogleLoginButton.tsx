import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, loadGoogleIdentityScript } from '../lib/googleSignIn';

interface GoogleLoginButtonProps {
  label?: 'signin_with' | 'continue_with';
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onConfigOrNetworkError: (message: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  label = 'signin_with',
  disabled = false,
  onCredential,
  onConfigOrNetworkError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let active = true;

    void loadGoogleIdentityScript().then((loaded) => {
      if (!active || !loaded || !containerRef.current || !window.google?.accounts?.id) {
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              void onCredentialRef.current(response.credential);
            } else {
              onConfigOrNetworkError('Google Sign-In did not return a credential.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: label,
          shape: 'rectangular',
          width: Math.min(360, containerRef.current.clientWidth || 320),
        });
        setGsiReady(true);
      } catch {
        setGsiReady(false);
      }
    });

    return () => {
      active = false;
    };
  }, [label, onConfigOrNetworkError]);

  if (GOOGLE_CLIENT_ID) {
    return (
      <div className={`w-full flex flex-col items-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
        {!gsiReady && (
          <span className="text-[11px] text-slate-400 mt-1">Loading Google Sign-In...</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        onConfigOrNetworkError(
          'Add VITE_GOOGLE_CLIENT_ID to your .env (and GOOGLE_CLIENT_ID to worker/wrangler.toml) to enable Google Sign-In.'
        )
      }
      className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#1f1f1f] border border-[#747775] font-medium text-sm transition-colors flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
    >
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleLoginButton;
