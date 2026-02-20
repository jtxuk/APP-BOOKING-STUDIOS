import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../services/api';
import Colors from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', onPress: () => {} },
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            try {
              await bookingAPI.cancelBooking(bookingId);
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
              fetchBookings();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la reserva');
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingInfo}>
        <Text style={styles.studioName}>{item.studio_name}</Text>
        <Text style={styles.slotTime}>
          {item.start_time} - {item.end_time}
        </Text>
        <Text style={styles.date}>
          {new Date(item.slot_date).toLocaleDateString('es-ES')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => handleCancelBooking(item.id)}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E6BA8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tienes reservas</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  centerContainer: GlobalStyles.centerContainer,
  listContent: GlobalStyles.listContent,
  bookingCard: {
    ...GlobalStyles.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  studioName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  slotTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cancelButton: {
    backgroundColor: Colors.error,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
});
