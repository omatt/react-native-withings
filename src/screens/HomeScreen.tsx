import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/Navigation.ts';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {requestTokenRefresh, revokeAccess, useWithingsAuth} from '../services/rest';
import {checkAuthToken, clearAsyncStorage} from '../services/storage/async_storage_helper';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {fetchHeartList} from '../services/rest/heart';
import {fetchSleepData, fetchSleepDataSummary} from '../services/rest/sleep';
import {fetchStethoList} from '../services/rest/stetho';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function App(): React.JSX.Element {
    const navigation = useNavigation<HomeScreenNavigationProp>();

    const { accessToken, refreshToken, userId, setAccessToken, setRefreshToken, setUserId } = useWithingsAuth();

    useEffect(() => {
        // Check existing auth tokens, disable Web Auth Flow launch
        checkAuthToken(setAccessToken, setRefreshToken, setUserId, false).then();
        if (accessToken && refreshToken) {
            console.log('Access Token:', accessToken);
            console.log('Refresh Token:', refreshToken);
        }
    }, [accessToken, refreshToken, setAccessToken, setRefreshToken, setUserId]);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Withings OAuth Integration</Text>
            <Text style={styles.tokens}>
                Access Token: {accessToken}{'\n'}Refresh Token: {refreshToken}{'\n'}User ID: {userId}
            </Text>
            <View style={styles.buttonContainer}>
                <Button title="Authorize Withings" onPress={() => {
                    console.log('🟢 Authorize button clicked');
                    // Check existing auth tokens, enable Web Auth Flow launch
                    checkAuthToken(setAccessToken, setRefreshToken, setUserId, true).then();
                }}
                />
            </View>
            {/*<View style={styles.buttonContainer}>*/}
            {/*    <Button*/}
            {/*        title="Generate Nonce"*/}
            {/*        onPress={() => {*/}
            {/*            console.log('📡 Generate Nonce...');*/}
            {/*            getNonce().then();*/}
            {/*        }}*/}
            {/*    />*/}
            {/*</View>*/}
            {/*<View style={styles.buttonContainer}>*/}
            {/*    <Button title="Access Demo Account" onPress={() => {*/}
            {/*        console.log('🟢 Access Demo button clicked');*/}
            {/*        requestDemoAccessToken(setAccessToken, setRefreshToken, setUserId).then();*/}
            {/*    }} />*/}
            {/*</View>*/}
            {/*<View style={styles.buttonContainer}>*/}
            {/*    <Button*/}
            {/*        title="Check Stored Tokens"*/}
            {/*        onPress={() => {*/}
            {/*            console.log('Check Stored Tokens');*/}
            {/*            checkTokenExpiration(setAccessToken, setRefreshToken, setUserId).then();*/}
            {/*        }}*/}
            {/*    />*/}
            {/*</View>*/}
            <View style={styles.buttonContainer}>
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
            <View style={styles.buttonContainer}>
                <Button
                    title="Fetch Heart List"
                    onPress={() => {
                        if(accessToken != null) {
                            console.log('Fetching heart rate data...');
                            fetchHeartList(accessToken).then();
                        } else {
                            Alert.alert('Error', 'Empty Access Token');
                        }
                    }}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Fetch Sleep Data"
                    onPress={async () => {
                        if(accessToken != null) {
                            console.log('Fetching sleep data...');
                            fetchSleepData(accessToken).then((fetchedSleepData) =>{
                                if (fetchedSleepData?.body?.series?.length > 0) {
                                    navigation.navigate('Sleep Data', { sleepData: fetchedSleepData.body.series });
                                } else {
                                    Alert.alert('Info', 'No sleep data available');
                                }
                            });
                        } else {
                            Alert.alert('Error', 'Empty Access Token');
                        }
                    }}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Fetch Sleep Data Summary"
                    onPress={() => {
                        if(accessToken != null) {
                            console.log('Fetching sleep data...');
                            fetchSleepDataSummary(accessToken).then((fetchedSleepDataSummary) => {
                                if (fetchedSleepDataSummary?.body?.series?.length > 0) {
                                    navigation.navigate('Sleep Data Summary', { sleepDataSummary: fetchedSleepDataSummary.body.series });
                                } else {
                                    Alert.alert('Info', 'No sleep data summary available');
                                }
                            });
                        } else {
                            Alert.alert('Error', 'Empty Access Token');
                        }
                    }}
                />
            </View>
            <View style={styles.buttonContainer}>
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
            <View style={styles.buttonContainer}>
                <Button
                    title="Revoke Access"
                    onPress={() => {
                        if (userId != null) {
                            Alert.alert('Are you sure?', 'This will revoke user access.',
                                [{text: 'Cancel', style: 'cancel'},
                                    {text: 'OK', onPress: () => {
                                            console.log('Revoke Access');
                                            revokeAccess(setAccessToken, setRefreshToken, setUserId, userId).then();
                                        },
                                    },
                                ]
                            );
                        } else {
                            console.log('Revoke Access failed: userId is null');
                            Alert.alert('Error', 'UserId is null');
                        }
                    }}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="DEBUG: Clear AsyncStorage"
                    onPress={() => {
                        Alert.alert('Are you sure?', 'This will clear all stored tokens.',
                            [{text: 'Cancel', style: 'cancel'},
                                {text: 'OK', onPress: () => {
                                        console.log('Clear stored Tokens');
                                        clearAsyncStorage().then();
                                    },
                                },
                            ]
                        );
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 20,
    },
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
