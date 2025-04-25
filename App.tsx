/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {requestTokenRefresh, revokeAccess, useWithingsAuth} from './src/services/rest';
import {getNonce} from './src/services/rest/token_manager';
import {checkAuthToken, clearAsyncStorage} from './src/services/storage/async_storage_helper';
import {fetchSleepData, fetchSleepDataSummary} from './src/services/rest/sleep';
import {fetchHeartRateData} from './src/services/rest/heart';
import {fetchStethoList} from './src/services/rest/stetho';


function App(): React.JSX.Element {
    const { accessToken, refreshToken, userId, setAccessToken, setRefreshToken, setUserId } = useWithingsAuth();

    useEffect(() => {
        if (accessToken && refreshToken) {
            console.log('Access Token:', accessToken);
            console.log('Refresh Token:', refreshToken);
        }
    }, [accessToken, refreshToken]);
  return (
      <View style={styles.container}>
          <Text style={styles.title}>Withings OAuth Integration</Text>
          <Text style={styles.tokens}>
              Access Token: {accessToken}{'\n'}Refresh Token: {refreshToken}{'\n'}User ID: {userId}
          </Text>
          <View style={{ marginTop: 20 }}>
              <Button title="Authorize Withings" onPress={() => {
                  console.log('🟢 Authorize button clicked');
                  // startOAuthFlow();
                  checkAuthToken(setAccessToken, setRefreshToken, setUserId).then();
              }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Generate Nonce"
                  onPress={() => {
                      console.log('📡 Generate Nonce...');
                      getNonce().then();
                  }}
              />
          </View>
          {/*<View style={{ marginTop: 20 }}>*/}
          {/*    <Button title="Access Demo Account" onPress={() => {*/}
          {/*        console.log('🟢 Access Demo button clicked');*/}
          {/*        requestDemoAccessToken(setAccessToken, setRefreshToken, setUserId).then();*/}
          {/*    }} />*/}
          {/*</View>*/}
          {/*<View style={{ marginTop: 20 }}>*/}
          {/*    <Button*/}
          {/*        title="Check Stored Tokens"*/}
          {/*        onPress={() => {*/}
          {/*            console.log('Check Stored Tokens');*/}
          {/*            checkTokenExpiration(setAccessToken, setRefreshToken, setUserId).then();*/}
          {/*        }}*/}
          {/*    />*/}
          {/*</View>*/}
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Force Token Refresh"
                  onPress={() => {
                      if(refreshToken != null) {
                          console.log('Requesting Token Refresh');
                          requestTokenRefresh(setAccessToken, setRefreshToken, setUserId, refreshToken).then();
                      } else {
                          Alert.alert('Error', 'Empty Refresh Token');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Fetch Heart Rate"
                  onPress={() => {
                      if(accessToken != null) {
                          console.log('Fetching heart rate data...');
                          fetchHeartRateData(accessToken).then();
                      } else {
                          Alert.alert('Error', 'Empty Access Token');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Fetch Sleep Data"
                  onPress={() => {
                      if(accessToken != null) {
                          console.log('Fetching sleep data...');
                          fetchSleepData(accessToken).then();
                      } else {
                          Alert.alert('Error', 'Empty Access Token');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Fetch Sleep Data Summary"
                  onPress={() => {
                      if(accessToken != null) {
                          console.log('Fetching sleep data...');
                          fetchSleepDataSummary(accessToken).then();
                      } else {
                          Alert.alert('Error', 'Empty Access Token');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Fetch Stetho List"
                  onPress={() => {
                      console.log('Fetch Stetho List');
                      if (accessToken != null) {
                          fetchStethoList(accessToken).then();
                      } else {
                          console.log('Fetch Stetho List failed accessToken is null');
                          Alert.alert('Error', 'Empty Access Token');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="Revoke Access"
                  onPress={() => {
                      console.log('Revoke Access');
                      if (userId != null) {
                        revokeAccess(setAccessToken, setRefreshToken, setUserId, userId).then();
                      } else {
                        console.log('Revoke Access failed: userId is null');
                        Alert.alert('Error', 'UserId is null');
                      }
                  }}
              />
          </View>
          <View style={{ marginTop: 20 }}>
              <Button
                  title="DEBUG: Clear AsyncStorage"
                  onPress={() => {
                      console.log('Clear stored Tokens');
                      clearAsyncStorage().then();
                  }}
              />
          </View>
      </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 30,
        textAlign: 'center',
        color: '#000000',
    },
    tokens: {
        marginTop: 20,
        fontSize: 14,
        fontWeight: '400',
        color: 'green',
        textAlign: 'center',
    },
});

export default App;
