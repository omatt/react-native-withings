import { CLIENT_ID } from '@env';
import {generateSignature, getNonce} from './token_manager';
import {START_DATE, END_DATE, TOKEN_HEART_URL} from './config';

// See: https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-get
export const fetchHeartData = async (signalId, accessToken) => {
    try {
        const action = 'get';
        const nonce = await getNonce();
        const signature = await generateSignature(action, CLIENT_ID, nonce);
        const response = await fetch(TOKEN_HEART_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                signalid: signalId,
                client_id: CLIENT_ID,
                signature: signature,
                nonce: nonce,
                signal_token: 'TODO', // TODO:  how to fetch signal_token is undocumented https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-get
            }).toString(),
        });

        const data = await response.json();
        console.log('Heart v2 Get Response:', data);
    } catch (error) {
        console.error('❌ Error fetching heart rate data:', error);
        return null;
    }
};

// See: https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-list
export const fetchHeartList = async (accessToken) => {
    try {
        const action = 'list';
        console.log('Start Date:', new Date(START_DATE * 1000).toISOString());
        console.log('End Date:', new Date(END_DATE * 1000).toISOString());
        const response = await fetch(TOKEN_HEART_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'Authorization': `Bearer ${accessToken}`,
            },
            body: new URLSearchParams({
                action: action,
                startdate: START_DATE.toString(),
                enddate: END_DATE.toString(),
                access_token: accessToken,
                offset: 0, // TODO: Add pagination
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
