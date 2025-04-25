import AsyncStorage from '@react-native-async-storage/async-storage';
import {ACCESS_TOKEN_EXPIRATION, REFRESH_TOKEN_EXPIRATION} from '../rest/config';
import {requestTokenRefresh, startOAuthFlow} from '../rest';

// Define constants for token keys in AsyncStorage
export const KEY_ACCESS_TOKEN = 'accessToken';
export const KEY_REFRESH_TOKEN = 'refreshToken';
export const KEY_ACCESS_TOKEN_EXPIRATION = 'accessTokenExpiration';
export const KEY_REFRESH_TOKEN_EXPIRATION = 'refreshTokenExpiration';
export const KEY_USER_ID = 'userId';

export const storeUserTokens = async (accessToken, refreshToken, userId) => {
    await AsyncStorage.multiSet([
        [KEY_ACCESS_TOKEN, accessToken],
        [KEY_REFRESH_TOKEN, refreshToken],
        [KEY_USER_ID, userId.toString()],
        [KEY_ACCESS_TOKEN_EXPIRATION, (Date.now() + ACCESS_TOKEN_EXPIRATION).toString()],
        [KEY_REFRESH_TOKEN_EXPIRATION, (Date.now() + REFRESH_TOKEN_EXPIRATION).toString()]]);
};

// Function to check token expiration and refresh if necessary
export const checkAuthToken = async (setAccessToken, setRefreshToken, setUserId) => {
    try {
        // Retrieve tokens and expiration times from AsyncStorage
        const accessToken = await AsyncStorage.getItem(KEY_ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(KEY_REFRESH_TOKEN);
        const userId = await AsyncStorage.getItem(KEY_USER_ID);
        const accessTokenExpiration = await AsyncStorage.getItem(KEY_ACCESS_TOKEN_EXPIRATION);
        const refreshTokenExpiration = await AsyncStorage.getItem(KEY_REFRESH_TOKEN_EXPIRATION);

        if (!accessToken || !refreshToken || !accessTokenExpiration || !refreshTokenExpiration) {
            console.log('⚠️ Tokens or expiration times not found in AsyncStorage');
            // Alert.alert('Error','⚠️ Tokens or expiration times not found in AsyncStorage');
            startOAuthFlow();  // Call the hook to initiate OAuth flow
            return;
        }

        // Convert expiration times from string to number
        const accessTokenExpTime = Number(accessTokenExpiration);
        const refreshTokenExpTime = Number(refreshTokenExpiration);
        const currentTime = Date.now();

        // Check if access token is expired
        if (currentTime > accessTokenExpTime) {
            console.log('❌ Access token has expired');

            // If refresh token is also expired, initiate OAuth flow
            if (currentTime > refreshTokenExpTime) {
                console.log('❌ Both tokens are expired. Proceeding with OAuth flow...');
                startOAuthFlow();  // Call the hook to initiate OAuth flow
            } else {
                console.log('🔄 Access token expired, but refresh token is still valid. Refreshing access token...');
                requestTokenRefresh(setAccessToken, setRefreshToken, setUserId, refreshToken).then();  // Refresh the access token
            }
        } else {
            console.log('✅ Access token is still valid');
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);
            setUserId(userId);
        }

      // Fetch and log all the stored data from AsyncStorage
      const storedData = await AsyncStorage.multiGet([
        KEY_ACCESS_TOKEN,
        KEY_REFRESH_TOKEN,
        KEY_USER_ID,
        KEY_ACCESS_TOKEN_EXPIRATION,
        KEY_REFRESH_TOKEN_EXPIRATION,
      ]);

      // Print all stored data
      storedData.forEach(([key, value]) => {
        console.log(`Key: ${key}, Value: ${value}`);
      });
    } catch (error) {
        console.error('❌ Error checking token expiration:', error);
    }
};

export const clearAsyncStorage = async () => {
    try {
        await AsyncStorage.clear();
        console.log('AsyncStorage cleared successfully!');
    } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
    }
};
