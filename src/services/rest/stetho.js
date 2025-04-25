// See: https://developer.withings.com/api-reference/#tag/stetho/operation/stethov2-list
export const fetchStethoList = async (accessToken) => {
    try {
        // const endDate = Date.now(); // now
        // // const startDate = endDate - 24 * 60 * 60;       // 24 hours ago
        // const startDate = endDate - (7 * 24 * 60 * 60 * 1000);
        const endDate = Math.floor(Date.now() / 1000); // now
        // const startDate = endDate - 24 * 60 * 60;       // 24 hours ago
        const startDate = endDate - 7 * 24 * 60 * 60;   // last 7 days
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        const response = await fetch('https://wbsapi.withings.net/v2/stetho', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
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
        console.log('Stetho List Response:', data);
    } catch (error) {
        console.error('❌ Error fetching Stetho List data:', error);
        return null;
    }
};
