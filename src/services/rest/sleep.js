import {END_DATE, START_DATE, TOKEN_SLEEP_URL} from './config';
import {convertSecondsToHMSS, formatDateYYYYMMDD} from '../utils';

// See: https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-get
export const fetchSleepData = async (accessToken) => {
    try {
        const action = 'get';
        console.log('Start Date:', new Date(START_DATE * 1000).toISOString());
        console.log('End Date:', new Date(END_DATE * 1000).toISOString());
        const response = await fetch(TOKEN_SLEEP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                startdate: START_DATE.toString(),
                enddate: END_DATE.toString(),
                access_token: accessToken,
                // See data_fields reference: https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-get
                data_fields: 'hr,rr,withings_index',
            }).toString(),
        });

        const data = await response.json();
        console.log('Sleep Data Request access token:', accessToken);
        console.log('Sleep Data Response:', data);
        if (data.status === 0 && data.body.series && data.body.series.length > 0) {
            console.log(`✅ Retrieved ${data.body.series.length} sleep data points:`);
            // Sort the entries by the latest date (descending order)
            data.body.series.sort((a, b) => b.startdate - a.startdate);
            data.body.series.forEach((entry, index) => {
                const start = new Date(entry.startdate * 1000); // Convert from seconds
                const end = new Date(entry.enddate * 1000);
                const state = entry.state; // Sleep stage
                const hr = entry.hr;
                const rr = entry.rr;
                const wi = entry.withings_index;

                console.log(`\n--- 📊 Sleep Point ${index + 1} ---`);
                console.log('🕒 Start:', start.toISOString());
                console.log('🕓 End:', end.toISOString());
                console.log('💤 State:', getSleepStateName(state));
                if (hr !== undefined) {
                    console.log('❤️ HR:', hr);
                    Object.entries(hr).forEach(([timestamp, value]) => {
                        const time = new Date(Number(timestamp) * 1000).toISOString();
                        console.log(`   🕒 ${time} → ❤️ ${value} bpm`);
                    });
                }
                if (rr !== undefined) {console.log('🌬️ RR:', rr);}
                if (wi !== undefined) {console.log('📈 Withings Index:', wi);}
            });
            return data;
        } else {
            console.warn('⚠️ No sleep data available.');
            return null;
        }

    } catch (error) {
        console.error('❌ Error fetching Sleep Data:', error);
        return null;
    }
};

// See: https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-getsummary
export const fetchSleepDataSummary = async (accessToken) => {
    try {
        const action = 'getsummary';
        console.log('Start Date:', new Date(START_DATE * 1000).toISOString());
        console.log('End Date:', new Date(END_DATE * 1000).toISOString());
        const response = await fetch(TOKEN_SLEEP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: action,
                startdateymd: formatDateYYYYMMDD(START_DATE),
                enddateymd: formatDateYYYYMMDD(END_DATE),
                // Store timestamp for last update of data to fetch entries after this date, ideally startDate + endDate
                // Set as startDate for testing
                lastupdate: START_DATE,
                access_token: accessToken,
            }).toString(),
        });

        const data = await response.json();
        console.log('Sleep Data Summary Request access token:', accessToken);
        console.log('Sleep Data Response:', data);

        if (data.status === 0 && data.body.series && data.body.series.length > 0) {
            console.log(`✅ Retrieved ${data.body.series.length} sleep entries:`);

            // Sort the entries by the latest date (descending order)
            data.body.series.sort((a, b) => b.startdate - a.startdate);

            data.body.series.forEach((entry, index) => {
                console.log(`\n--- 💤 Sleep Entry ${index + 1} ---`);
                console.log('Date:', new Date(entry.date).toDateString());
                console.log('  - Total Time in Bed:', convertSecondsToHMSS(entry.data.total_timeinbed));
                console.log('  - Total Sleep Time:', convertSecondsToHMSS(entry.data.total_sleep_time));
                console.log('  - Deep Sleep Duration:', convertSecondsToHMSS(entry.data.deepsleepduration));
                console.log('  - Light Sleep Duration:', convertSecondsToHMSS(entry.data.lightsleepduration));
                console.log('  - Sleep Efficiency:', (entry.data.sleep_efficiency * 100 ) + '%');
                console.log('  - Duration to Sleep:', convertSecondsToHMSS(entry.data.durationtosleep));
                console.log('  - Duration to Wake:', convertSecondsToHMSS(entry.data.wakeupduration));
                console.log('  - Average Heart Rate:', entry.hr_average);
                console.log('  - Min Heart Rate:', entry.data.hr_min);
                console.log('  - Max Heart Rate:', entry.data.hr_max);
                console.log('  - Sleep Start:', new Date(entry.startdate * 1000).toISOString());
                console.log('  - Sleep End:', new Date(entry.enddate * 1000).toISOString());
            });

            return data;
        } else {
            console.warn('⚠️ No sleep summary data available.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching Sleep Data Summary:', error);
        return null;
    }
};

// Optional helper to give human-readable state names
export const getSleepStateName = (state) => {
    const states = {
        0: 'Unknown',
        1: 'Awake',
        2: 'Light Sleep',
        3: 'Deep Sleep',
        4: 'REM',
    };
    return states[state] || 'Unrecognized';
};

