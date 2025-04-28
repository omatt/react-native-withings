import {END_DATE, START_DATE, TOKEN_STETHO_URL} from './config';

// See: https://developer.withings.com/api-reference/#tag/stetho/operation/stethov2-list
export const fetchStethoList = async (accessToken) => {
    try {
        const action = 'list';
        console.log('Start Date:', new Date(START_DATE * 1000).toISOString());
        console.log('End Date:', new Date(END_DATE * 1000).toISOString());
        const response = await fetch(TOKEN_STETHO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                startdate: START_DATE.toString(),
                enddate: END_DATE.toString(),
                access_token: accessToken,
                offset: 0,
            }).toString(),
        });

        const data = await response.json();
        console.log('Stetho List Response:', data);
    } catch (error) {
        console.error('❌ Error fetching Stetho List data:', error);
        return null;
    }
};
