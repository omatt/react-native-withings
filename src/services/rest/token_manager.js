import HmacSHA256 from 'crypto-js/hmac-sha256';
import {enc} from 'crypto-js';
import { CLIENT_ID, CLIENT_SECRET } from '@env';

export const generateSignature = (action, clientId, value) => {
    try {
        const data = `${action},${clientId},${value}`;
        console.log('Data to hash:', data);
        const hash = HmacSHA256(data, CLIENT_SECRET);
        const signature = hash.toString(enc.Hex);
        console.log('Generated Signature:', signature);
        return signature;
    } catch (error) {
        console.error('Error in generateSignature:', error);
    }
};

export const getNonce = async () => {
    const action = 'getnonce';
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch('https://wbsapi.withings.net/v2/signature', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: action,
            client_id: CLIENT_ID,
            timestamp: timestamp.toString(),
            signature: generateSignature(action, CLIENT_ID, timestamp), // signature for nonce require timestamp
        }).toString(),
    });

    // Check if the response is successful
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('getNonce Response:', data);
    if (data.status === 0) {
        console.log('Received Nonce:', data.body.nonce);
        return data.body.nonce;
    } else {
        throw new Error('Failed to retrieve nonce');
    }
};
