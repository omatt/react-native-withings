import {TOKEN_SLEEP_URL} from './config';

const endDate = Math.floor(Date.now() / 1000); // now
const startDate = endDate - 7 * 24 * 60 * 60;   // last 7 days
const last48hours = endDate - 2 * 24 * 60 * 60;   // last 2 days

// See: https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-get
export const fetchSleepData = async (accessToken) => {
    try {
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        const response = await fetch(TOKEN_SLEEP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'get',
                startdate: startDate.toString(),
                enddate: endDate.toString(),
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
                    if (hr !== undefined) {console.log('❤️ HR:', hr);}
                    if (rr !== undefined) {console.log('🌬️ RR:', rr);}
                    if (wi !== undefined) {console.log('📈 Withings Index:', wi);}
                });
        } else {
            console.warn('⚠️ No sleep data available.');
        }

    } catch (error) {
        console.error('❌ Error fetching Sleep Data:', error);
        return null;
    }
};

// See: https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-getsummary
export const fetchSleepDataSummary = async (accessToken) => {
    try {
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        const response = await fetch(TOKEN_SLEEP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'getsummary',
                startdate: formatDate(startDate),
                enddate: formatDate(endDate),
                // Store timestamp for last update of data to fetch entries after this date, ideally startDate + endDate
                // Set as startDate for testing
                lastupdate: last48hours,
                access_token: accessToken,
            }).toString(),
        });

        const data = await response.json();
        console.log('Sleep Data Summary Request access token:', accessToken);
        console.log('Sleep Data Response:', data);

        if (data.status === 0 && data.body.series && data.body.series.length > 0) {
            console.log(`✅ Retrieved ${data.body.series.length} sleep entries:`);

            data.body.series.forEach((entry, index) => {
                console.log(`\n--- 💤 Sleep Entry ${index + 1} ---`);
                console.log('Date:', new Date(entry.date).toDateString());
                console.log('  - Sleep Score:', entry.data.sleep_score);
                console.log('  - Total Sleep Time:', entry.data.total_sleep_time, 'seconds');
                console.log('  - Sleep Efficiency:', entry.data.sleep_efficiency + '%');
                console.log('  - Duration to Sleep:', entry.data.duration_to_sleep, 'seconds');
                console.log('  - Duration to Wake:', entry.data.duration_to_wakeup, 'seconds');
                console.log('  - Average Heart Rate:', entry.data.hr_average);
                console.log('  - Min Heart Rate:', entry.data.hr_min);
                console.log('  - Max Heart Rate:', entry.data.hr_max);
                console.log('  - Sleep Start:', new Date(entry.data.startdate * 1000).toISOString());
                console.log('  - Sleep End:', new Date(entry.data.enddate * 1000).toISOString());
            });
        } else {
            console.warn('⚠️ No sleep summary data available.');
        }
    } catch (error) {
        console.error('❌ Error fetching Sleep Data Summary:', error);
        return null;
    }
};

const formatDate = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000); // Convert from seconds to ms
    return date.toISOString().split('T')[0]; // Get 'yyyy-mm-dd'
};

// Optional helper to give human-readable state names
const getSleepStateName = (state) => {
    const states = {
        0: 'Unknown',
        1: 'Awake',
        2: 'Light Sleep',
        3: 'Deep Sleep',
        4: 'REM',
    };
    return states[state] || 'Unrecognized';
};

