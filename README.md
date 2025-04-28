# Withings API Setup

## Configuring Private Keys
To use the Withings API, `CLIENT_ID` and `CLIENT_SECRET` key needs to be obtained from the [Withings Developer Dashboard](https://developer.withings.com/dashboard/). Create an application on the Withings Developer Dashboard to fetch a key. Here's how the Developer Dashboard looks like.

<img width="1454" alt="Bildschirmfoto 2025-04-24 um 19 52 36" src="https://github.com/user-attachments/assets/61f48208-3bcd-4f76-841e-4a2f15a30471" />


Create an `.env` and store the keys as:

```
CLIENT_ID=YOUR_CLIENT_ID
CLIENT_SECRET=YOUR_SECRET_KEY
```

## Callback URL
Set up a Callback URL. Ensure that it matches the callback URL configured in the app to handle the redirect after Withings authentication.

AndroidManifest.xml
```no-script
<activity
    android:name=".MainActivity"
    android:label="@string/app_name"
    ...>
    <intent-filter android:label="auth0">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="idm" android:host="callback" />
    </intent-filter>
</activity>   
```

Info.plist
```no-script
<key>CFBundleURLTypes</key>
<array>
<dict>
<key>CFBundleURLSchemes</key>
<array>
<string>idm</string>
</array>
</dict>
</array>
```

## Implemented Withings API

Withings API documentation can be found [here](https://developer.withings.com/api-reference/).

### OAuth2

The Withings API uses OAuth 2.0, an industry-standard protocol for authorization.
OAuth 2.0 enables the application to access user-specific data with a secure and seamless way without requiring users to share their Withings credentials with the app.

The Withings API supports the Authorization Code Flow, which is suitable for server-side applications. In this flow, the app will obtain an authorization code from the user, which can then be exchanged for an access token and refresh token.

### Fetch authCode through Web Auth Flow

To use the [Web Authorization Flow](https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-authorize), an authorization URL needs to be constructed with the appropriate query parameters. Here's an example of an authorization URL:

```no-lang
https://account.withings.com/oauth2_user/authorize2?response_type=code&client_id=YOUR_CLIENT_ID&scope=user.info,user.metrics,user.activity&redirect_uri=YOUR_REDIRECT_URI&state=YOUR_STATE
```

/src/services/rest/index.js

```javascript
export const startOAuthFlow = () => {
    console.log('🚀 Starting OAuth flow');
    Linking.openURL(AUTHORIZATION_URL).then();
};
```

### [Request Token - with AuthCode](https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getaccesstoken)

After receiving the app callback with the authorization code, `exchangeAuthCodeForToken()` will process the request for auth tokens, and it will return an ACCESS_TOKEN and REFRESH_TOKEN.

/src/services/rest/index.js

```javascript
const exchangeAuthCodeForToken = useCallback(async (authCode) => {
    // ...
}, []);
```

The tokens will then be stored in AsyncStorage.

```javascript
// Save to AsyncStorage
await storeUserTokens(accessToken, refreshToken, userId.toString());
```

### [Token Refresh - Request Token with RefreshToken](https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getaccesstoken)

ACCESS_TOKEN is only valid for three (3) hours while REFRESH_TOKEN is valid for one (1) year. Requesting for a token refresh will generate a new ACCESS_TOKEN and REFRESH_TOKEN, the used REFRESH_TOKEN on this token refresh request will no longer be valid.

/src/services/rest/index.js

```javascript
export const requestTokenRefresh = async (refreshToken) => {
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
            client_secret: CLIENT_SECRET,
            grant_type: grantType,
            refresh_token: refreshToken,
        }).toString(),
    });
};
```

### [Revoke User Access](https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-revoke)

This service allows to revoke the access your application have been granted to a user's data. After calling this webservice, your access and refresh tokens for this user will become invalid.

/src/services/rest/index.js

```javascript
export const revokeAccess = async (userId) => {
    const action = 'revoke';
    const nonce = await getNonce();
    const signature = await generateSignature(action, CLIENT_ID, nonce);
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
};
```

Clear stored tokens after revoking user access.

```javascript
await clearAsyncStorage();
```

### [Get Demo account access](https://developer.withings.com/api-reference/#tag/oauth2/operation/oauth2-getdemoaccess)

This service grants access to a demo account containing mock data.

/src/services/rest/index.js

```javascript
export const requestDemoAccessToken = async (setUserId) => {
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
            signature: signature,
            nonce: nonce,
            scope_oauth2: SCOPE,
        }).toString(),
    });
};
```

### [Heart v2 Get](https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-get)

**NOTE: it's undocumented on how a SIGNAL_TOKEN can be produced or retrieved.**

Fetches high frequency ECG recording using SIGNAL_ID as identifier. 

/src/services/rest/heart.js

```javascript
export const fetchHeartData = async (signalId, accessToken) => {
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
            signal_token: 'TODO', // TODO:  how to fetch signal_token is undocumented
        }).toString(),
    });
};
```

### [Heart v2 List](https://developer.withings.com/api-reference/#tag/heart/operation/heartv2-list)

**NOTE: using Withings ScanWatch Light as test device, it returns an empty List.**

Returns a list of ECG records.

/src/services/rest/heart.js

```javascript
export const fetchHeartList = async (accessToken) => {
    const action = 'list';
    const response = await fetch(TOKEN_HEART_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: action,
            startdate: START_DATE.toString(),
            enddate: END_DATE.toString(),
            access_token: accessToken,
            offset: 0, // TODO: Add pagination
        }).toString(),
    });    
};
```

### [Sleep v2 Get](https://developer.withings.com/api-reference/#tag/sleep/operation/sleepv2-get)

Returns sleep data captured at high frequency, including sleep stages.

/src/services/rest/sleep.js

```javascript
export const fetchSleepData = async (accessToken) => {
    const action = 'get';
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
};
```

Sleep stages can be interpreted with this function.

```javascript
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
```

### Sleep v2 Get Summary

Returns sleep activity summaries, which are an aggregation of all the data captured at high frequency during the sleep activity.

/src/services/rest/sleep.js

```javascript
export const fetchSleepDataSummary = async (accessToken) => {
    const action = 'getsummary';
    const response = await fetch(TOKEN_SLEEP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: action,
            startdateymd: formatDateYYYYMMDD(START_DATE),
            enddateymd: formatDateYYYYMMDD(END_DATE),
            lastupdate: START_DATE,
            access_token: accessToken,
        }).toString(),
    });    
};
```

### [Stetho v2 List](https://developer.withings.com/api-reference/#tag/stetho/operation/stethov2-list)

This service should return stetho signalIds which can be later fetched individually using [Stetho v2 Get API](https://developer.withings.com/api-reference/#tag/stetho/operation/stethov2-get).

```javascript
export const fetchStethoList = async (accessToken) => {
    const action = 'list';
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
};
```

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
