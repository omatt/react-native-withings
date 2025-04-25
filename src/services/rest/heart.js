// See: https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-list
export const fetchHeartRateData = async (accessToken) => {
    try {
        // const endDate = Date.now(); // now
        // // const startDate = endDate - 24 * 60 * 60;       // 24 hours ago
        // const startDate = endDate - (7 * 24 * 60 * 60 * 1000);
        const endDate = Math.floor(Date.now() / 1000); // now
        // const startDate = endDate - 24 * 60 * 60;       // 24 hours ago
        const startDate = endDate - 7 * 24 * 60 * 60;   // last 7 days
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
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
