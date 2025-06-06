import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './src/navigation/Navigation.ts';
import {Home} from './src/screens/HomeScreen.tsx';
import SleepDataScreen from './src/screens/SleepDataScreen.tsx';
import SleepDataSummaryScreen from './src/screens/SleepDataSummaryScreen.tsx';

// export default App;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Main() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home"
                              component={Home}
                              options={{ headerShown: false }}  // Hide the header for this screen
                />
                <Stack.Screen name="Sleep Data" component={SleepDataScreen} />
                <Stack.Screen name="Sleep Data Summary" component={SleepDataSummaryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
