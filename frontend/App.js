import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, AppState, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { stackScreenOptions } from './constants/GlobalStyles';
import storage from './utils/storage';
import { setSessionExpiredHandler, userAPI } from './services/api';

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
  const [initialResetToken, setInitialResetToken] = useState('');
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const resetTokenFromUrl = params.get('reset-token');

        if (resetTokenFromUrl) {
          await storage.removeItem('userToken');
          await storage.removeItem('user');
          setInitialResetToken(resetTokenFromUrl);
          setUserToken(null);
          setIsLoading(false);
          return;
        }
      }

      const token = await storage.getItem('userToken');
      setUserToken(token);
    } catch (e) {
      console.log(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUserToken(null);

      const message = 'Tu sesión ha expirado por inactividad. Inicia sesión de nuevo para continuar.';
      if (Platform.OS === 'web') {
        window.alert(message);
        return;
      }

      Alert.alert('Sesión expirada', message);
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!userToken) {
      return;
    }

    const validateSession = async () => {
      try {
        await userAPI.getProfile();
      } catch (error) {
        if (error.response?.status !== 401) {
          console.log('No se pudo revalidar sesión al volver a foreground:', error.message);
        }
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          validateSession();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        validateSession();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [userToken]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                setUserToken={setUserToken}
                initialResetToken={initialResetToken}
              />
            )}
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
