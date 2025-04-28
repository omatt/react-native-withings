import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {convertSecondsToHMSS, timezone} from '../services/utils';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/Navigation.ts'; // Import your function

type SleepDataSummaryScreenRouteProp = RouteProp<RootStackParamList, 'Sleep Data Summary'>;

const SleepDataSummaryScreen = ({ route }: { route: SleepDataSummaryScreenRouteProp }) => {
    const { sleepDataSummary } = route.params;

    const renderSleepSummary = (entry: SleepDataSummaryEntry, index: number) => (
        <View key={index} style={styles.entryContainer}>
            <Text style={styles.dateText}>{new Date(entry.date).toDateString()}</Text>
            <Text>Total Time in Bed: {convertSecondsToHMSS(entry.data.total_timeinbed)}</Text>
            <Text>Total Sleep Time: {convertSecondsToHMSS(entry.data.total_sleep_time)}</Text>
            <Text>Deep Sleep Duration: {convertSecondsToHMSS(entry.data.deepsleepduration)}</Text>
            <Text>Light Sleep Duration: {convertSecondsToHMSS(entry.data.lightsleepduration)}</Text>
            <Text>Sleep Efficiency: {(entry.data.sleep_efficiency * 100).toFixed(2)}%</Text>
            <Text>Duration to Sleep: {convertSecondsToHMSS(entry.data.durationtosleep)}</Text>
            <Text>Duration to Wake: {convertSecondsToHMSS(entry.data.wakeupduration)}</Text>
            <Text>Average Heart Rate: {entry.hr_average}</Text>
            <Text>Min Heart Rate: {entry.data.hr_min}</Text>
            <Text>Max Heart Rate: {entry.data.hr_max}</Text>
            <Text>Sleep Start: {new Date(entry.startdate * 1000).toLocaleString()} {timezone}</Text>
            <Text>Sleep End: {new Date(entry.enddate * 1000).toLocaleString()} {timezone}</Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Sleep Data Summary</Text>
            {sleepDataSummary.length > 0 ? (
                sleepDataSummary.map((entry, index) => renderSleepSummary(entry, index))
            ) : (
                <Text>No sleep summary data available</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    entryContainer: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, // Adjust this for more or less shadow
        shadowRadius: 6, // Adjust this for the blur radius of the shadow

        // Shadow for Android
        elevation: 4, // This is for Android devices, adjust for depth
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export interface SleepDataSummaryEntry {
    date: number; // Timestamp of the sleep entry date
    startdate: number; // Start timestamp of the sleep
    enddate: number; // End timestamp of the sleep
    hr_average: number; // Average heart rate
    data: {
        total_timeinbed: number;
        total_sleep_time: number;
        deepsleepduration: number;
        lightsleepduration: number;
        sleep_efficiency: number;
        durationtosleep: number;
        wakeupduration: number;
        hr_min: number;
        hr_max: number;
    };
}

export interface SleepDataSummary {
    series: SleepDataSummaryEntry[];
}

export default SleepDataSummaryScreen;
