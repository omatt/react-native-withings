import { CLIENT_ID, CLIENT_SECRET } from '@env';
import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking} from 'react-native';
import {parseUrl} from 'query-string/base';
import { useRef } from 'react';
import {generateSignature, getNonce} from './token_manager';
import {
    AUTHORIZATION_URL,
    REDIRECT_URI,REVOKE_URL, SCOPE,
    TOKEN_BASE_URL,
    TOKEN_URL,
} from './config';
import {
    clearAsyncStorage, storeUserTokens,
} from '../storage/async_storage_helper';

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

    const startOAuthFlow = () => {
        console.log('🚀 Starting OAuth flow');
        Linking.openURL(AUTHORIZATION_URL).then();
    };

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

export const requestTokenRefresh = async (setAccessToken, setRefreshToken, setUserId, refreshToken) => {
    const action = 'requesttoken';
    const grantType = 'refresh_token';
    const response = await fetch(TOKEN_BASE_URL, {
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
        console.error('⚠️ Error: Failed to get demo access token');
    }
};

export const requestDemoAccessToken = async (setAccessToken, setRefreshToken, setUserId) => {
    const action = 'getdemoaccess';
    const nonce = await getNonce();
    const signature = generateSignature(action, CLIENT_ID, nonce);
    const response = await fetch(TOKEN_BASE_URL, {
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

export const revokeAccess = async (userId) => {
    const action = 'revoke';
    const nonce = await getNonce();
    const signature = generateSignature(action, CLIENT_ID, nonce);
    try {
        // Prepare the body for the revoke request
        const response = await fetch(REVOKE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                client_id: CLIENT_ID,
                signature: generateSignature(action, CLIENT_ID, signature),
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

            console.log('Access revoked successfully.');
        } else {
            Alert.alert('Error', 'Failed to revoke access: ' + (data.error || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error revoking access:', error);
        Alert.alert('Error', 'An error occurred while trying to revoke access.');
    }
};

// Reference: https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-list
export const fetchHeartRateData = async (accessToken) => {
    try {
        const endDate = Math.floor(Date.now() / 1000); // now
        // const startDate = endDate - 24 * 60 * 60;       // 24 hours ago
        const startDate = endDate - 7 * 24 * 60 * 60;   // last 7 days
        console.log('Start Date:', new Date(startDate * 1000).toISOString());
        console.log('End Date:', new Date(endDate * 1000).toISOString());
        const response = await fetch('https://wbsapi.withings.net/v2/heart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'Authorization': `Bearer ${accessToken}`,
            },
            body: new URLSearchParams({
                action: 'list',
                startdate: startDate.toString(),
                enddate: endDate.toString(),
                access_token: accessToken,
                offset: 0,
            }).toString(),
        });

        const data = await response.json();
        console.log('Heart Rate Request access token:', accessToken);
        console.log('Heart Rate Response:', data);

        if (data.status === 0 && data.body && data.body.series) {
            const heartRates = data.body.series.map(entry => ({
                timestamp: entry.timestamp,
                bpm: entry.heart_rate,
            }));
            console.log('❤️ Heart Rate Series:', heartRates);
            console.log('Heart Rate more:', data.body.more);
            console.log('Heart Rate offset:', data.body.offset);
            return heartRates;
        } else {
            console.warn('⚠️ Failed to fetch heart rate data:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching heart rate data:', error);
        return null;
    }
};
