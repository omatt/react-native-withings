import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/Navigation.ts';
import {timezone} from '../services/utils';
import {getSleepStateName} from '../services/rest/sleep';

type SleepDataScreenRouteProp = RouteProp<RootStackParamList, 'Sleep Data'>;

export const SleepDataScreen = ({ route }: { route: SleepDataScreenRouteProp }) => {
    const { sleepData } = route.params;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📊 Sleep Data</Text>
            {sleepData.map((entry, index) => (
                <View key={index} style={styles.entry}>
                    <Text>🕒 Start: {new Date(entry.startdate * 1000).toLocaleString()} {timezone}</Text>
                    <Text>🕓 End: {new Date(entry.enddate * 1000).toLocaleString()} {timezone}</Text>
                    <Text>💤 State: {getSleepStateName(entry.state)}</Text>
                    {entry.hr && (
                        <>
                            <Text>❤️ HR Readings:</Text>
                            {Object.entries(entry.hr).map(([ts, bpm]) => (
                                <Text key={ts}>   🕒 {new Date(Number(ts) * 1000).toLocaleTimeString()} → {bpm?.toString()} bpm</Text>
                            ))}
                        </>
                    )}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
    entry: { marginBottom: 30 },
});

export default SleepDataScreen;
