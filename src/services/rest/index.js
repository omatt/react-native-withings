import { CLIENT_ID, CLIENT_SECRET } from '@env';
import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking} from 'react-native';
import {parseUrl} from 'query-string/base';
import { useRef } from 'react';
import {generateSignature, getNonce} from './token_manager';
import {
    AUTHORIZATION_URL,
    REDIRECT_URI, SCOPE,
    TOKEN_OAUTH2_URL,
    TOKEN_URL,
} from './config';
import {
    clearAsyncStorage, storeUserTokens,
} from '../storage/async_storage_helper';

// Start auth process
// Check for existing accessToken and refreshToken and check for token validity
// Start OAuthFlow if there's no existing tokens and use the returned authCode to
// generate an accessToken and refreshToken. Store the generated tokens.
// See: https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-authorize
export const useWithingsAuth = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [userId, setUserId] = useState(null);

    const exchangeAuthCodeForToken = useCallback(async (authCode) => {
        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: authCode,
                    redirect_uri: REDIRECT_URI,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                }).toString(),
            });

            const data = await response.json();
            console.log('🎟️ Token response:', data);

            if (data.status === 0) {
                const accessToken = data.body.access_token;
                const refreshToken = data.body.refresh_token;
                const userId = data.body.userid;
                const expiresIn = data.body.expires_in;

                setAccessToken(accessToken);
                setRefreshToken(refreshToken);
                setUserId(userId);
                console.log('🤖 User ID:', userId);
                console.log('✅ Access Token:', accessToken);
                console.log('🔄 Refresh Token:', refreshToken);
                console.log('⏱️ Expiration:', expiresIn);
                console.log('Scope:', data.body.scope);

                // Save to AsyncStorage
                await storeUserTokens(accessToken, refreshToken, userId.toString());
            } else {
                console.warn('⚠️ No tokens received from Withings');
            }
        } catch (error) {
            console.error('❌ Token exchange failed:', error);
        }
    }, []);

    const hasHandledRedirect = useRef(false);
    const handleRedirect = useCallback((url) => {
        if (hasHandledRedirect.current) {return;} // Prevent double call
        hasHandledRedirect.current = true;

        console.log('🔁 Redirected back to app with URL:', url);
        const parsed = parseUrl(url);
        const authCode = parsed.query.code;

        if (authCode) {
            console.log('✅ Auth Code:', authCode);
            exchangeAuthCodeForToken(authCode);
        } else {
            console.warn('⚠️ No auth code found in redirect URL');
        }
    }, [exchangeAuthCodeForToken]);

    useEffect(() => {
        const handleDeepLink = (event) => {
            handleRedirect(event.url);
        };

        Linking.addEventListener('url', handleDeepLink);
        return () => {
            Linking.removeEventListener('url', handleDeepLink);
        };
    }, [handleRedirect]);
    return {
        accessToken,
        refreshToken,
        setAccessToken,
        setRefreshToken,
        setUserId,
        userId,
        startOAuthFlow,
    };
};

export const startOAuthFlow = () => {
    console.log('🚀 Starting OAuth flow');
    Linking.openURL(AUTHORIZATION_URL).then();
};

// Request new tokens using stored refreshToken
// Generate new accessToken and refreshToken
// Store newly generated tokens
// See: https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getaccesstoken
export const requestTokenRefresh = async (setAccessToken, setRefreshToken, setUserId, refreshToken) => {
    const action = 'requesttoken';
    const grantType = 'refresh_token';
    const response = await fetch(TOKEN_OAUTH2_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: action,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET, // Signature hash protocol requires nonce
            grant_type: grantType,
            refresh_token: refreshToken,
        }).toString(),
    });

    const data = await response.json();
    console.log('Request Token Refresh:', data);

    if (data.status === 0) {
        let accessToken = data.body.access_token;
        let refreshToken = data.body.refresh_token;
        let userId = data.body.userid;
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUserId(userId);

        console.log('Refreshed User ID:', userId);
        console.log('Refreshed Access Token:', accessToken);
        console.log('Refreshed Token:', refreshToken);
        console.log('Scope:', data.body.scope);
        // Save to AsyncStorage
        await storeUserTokens(accessToken, refreshToken, userId.toString());
    } else {
        // If the response was unsuccessful, log an error
        console.error('⚠️ Error: Failed to refresh tokens');
    }
};

// Request access to demo account
// See: https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getdemoaccess
export const requestDemoAccessToken = async (setAccessToken, setRefreshToken, setUserId) => {
    const action = 'getdemoaccess';
    const nonce = await getNonce();
    const signature = generateSignature(action, CLIENT_ID, nonce);
    const response = await fetch(TOKEN_OAUTH2_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: action,
            client_id: CLIENT_ID,
            signature: signature, // Signature hash protocol requires nonce
            nonce: nonce,
            scope_oauth2: SCOPE,
        }).toString(),
    });

    const data = await response.json();
    console.log('Demo Access Response:', data);

    // Check if the response is successful (status === 0)
    if (data.status === 0) {
        // Extract the access token and refresh token
        let accessToken = data.body.access_token;
        let refreshToken = data.body.refresh_token;
        setAccessToken(data.body.access_token);
        setRefreshToken(data.body.refresh_token);
        setUserId(data.body.userid != null ? data.body.userid : ''); // demo account contains no userid
        const expiresIn = data.body.expires_in;

        // Log the tokens and expiration time
        console.log('✅ Access Token:', accessToken);
        console.log('🔄 Refresh Token:', refreshToken);
        console.log('⏱️ Expires In:', expiresIn);
    } else {
        // If the response was unsuccessful, log an error
        console.error('⚠️ Error: Failed to get demo access token');
    }
};

// Revoke user access and clear stored tokens
// See: https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-revoke
export const revokeAccess = async (setAccessToken, setRefreshToken, setUserId, userId) => {
    const action = 'revoke';
    const nonce = await getNonce();
    const signature = await generateSignature(action, CLIENT_ID, nonce);
    try {
        // Prepare the body for the revoke request
        const response = await fetch(TOKEN_OAUTH2_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                client_id: CLIENT_ID,
                signature: signature,
                nonce: nonce,
                userid: userId,
            }).toString(),
        });

        const data = await response.json();
        console.log('Revoke user access response: ', data);

        // Check if the revoke request was successful
        if (data.status === 0) {
            Alert.alert('Success', 'Your access has been successfully revoked.');

            // Optionally, remove the stored token from AsyncStorage if you no longer need it
            await clearAsyncStorage();

            setAccessToken('');
            setRefreshToken('');
            setUserId('');

            console.log('Access revoked successfully.');
        } else {
            Alert.alert('Error', 'Failed to revoke access: ' + (data.error || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error revoking access:', error);
        Alert.alert('Error', 'An error occurred while trying to revoke access.');
    }
};
