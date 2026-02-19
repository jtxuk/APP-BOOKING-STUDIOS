import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { stackScreenOptions } from './constants/GlobalStyles';

import LoginScreen from './screens/LoginScreen';
import StudioListScreen from './screens/StudioListScreen';
import CalendarScreen from './screens/CalendarScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function StudioStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name="StudioList" 
        component={StudioListScreen}
        options={{ title: 'Estudios' }}
      />
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendario' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStackNavigator({ setUserToken }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name="ProfileMain" 
        options={{ title: 'Perfil' }}
      >
        {(props) => <ProfileScreen {...props} setUserToken={setUserToken} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{ title: 'Gestión de Alumnos' }}
      />
    </Stack.Navigator>
  );
}

function MyBookingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name="MyBookingsMain" 
        component={MyBookingsScreen}
        options={{ title: 'Mis Reservas' }}
      />
    </Stack.Navigator>
  );
}

function AuthenticatedApp({ setUserToken }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#f5f5f5' },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Studios" 
        component={StudioStackNavigator}
        options={{
          title: 'Estudios',
          tabBarLabel: 'Estudios',
        }}
      />
      <Tab.Screen 
        name="MyBookings" 
        component={MyBookingsStackNavigator}
        options={{
          title: 'Mis Reservas',
          tabBarLabel: 'Mis Reservas',
        }}
      />
      <Tab.Screen 
        name="Profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
        }}
      >
        {(props) => <ProfileStackNavigator {...props} setUserToken={setUserToken} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      setUserToken(token);
    } catch (e) {
      console.log(e);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} setUserToken={setUserToken} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen 
            name="App">
            {(props) => <AuthenticatedApp {...props} setUserToken={setUserToken} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
