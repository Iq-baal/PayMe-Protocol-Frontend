// Robust WebAuthn wrapper for OS Biometrics (Face ID / Touch ID / Android)

// Helpers for Base64URL encoding/decoding (Required for Credential IDs)
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let string = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    string += String.fromCharCode(bytes[i]);
  }
  return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLToBuffer(base64URL: string): Uint8Array {
  const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64.padEnd(base64.length + padLen, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const isBiometricsSupported = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (e) {
        return false;
    }
};

export const registerBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
        alert("Biometrics not supported on this device/browser.");
        return false;
    }

    try {
        // 1. Create Challenge & User ID
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        // 2. Define Creation Options
        const publicKey: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: "PayMe Protocol",
                id: window.location.hostname // CRITICAL: Must match current domain for passkey to be retrievable
            },
            user: {
                id: userId,
                name: "user@payme.io",
                displayName: "PayMe User"
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Forces Platform Auth (FaceID/TouchID)
                userVerification: "preferred",       // Preferred is friendlier than required for some Androids
                residentKey: "preferred"             
            },
            timeout: 60000,
            attestation: "none"
        };

        // 3. Create Credential
        const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
        
        if (credential) {
            // 4. Save Credential ID for later verification
            const credId = bufferToBase64URL(credential.rawId);
            localStorage.setItem('payme_biometric_cred_id', credId);
            console.log("Biometric Credential Created:", credId);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Biometric registration failed:", e);
        // Alert specific error for better debugging
        alert(`Biometric Setup Failed: ${(e as Error).name} - ${(e as Error).message}`);
        return false;
    }
};

export const verifyBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;

    const savedCredId = localStorage.getItem('payme_biometric_cred_id');
    
    if (!savedCredId) {
        console.warn("No biometric credential found. Please re-enable in Settings.");
        return false;
    }

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKey: PublicKeyCredentialRequestOptions = {
            challenge,
            rpId: window.location.hostname, // CRITICAL: Must match creation rp.id
            timeout: 60000,
            userVerification: "preferred",
            allowCredentials: [{
                id: base64URLToBuffer(savedCredId),
                type: 'public-key',
                // transports: ['internal'] // Removed to allow hybrid (cross-device) fallback if needed
            }]
        };

        const assertion = await navigator.credentials.get({ publicKey });
        return !!assertion;
    } catch (e) {
        console.error("Biometric verification failed:", e);
        return false;
    }
};