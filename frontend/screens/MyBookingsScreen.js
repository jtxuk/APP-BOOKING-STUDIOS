import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../services/api';
import Colors from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';

export default function MyBookingsScreen() {
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await bookingAPI.getMyBookings();
      const active = response.data?.active || [];
      const history = response.data?.history || [];
      setActiveBookings(active);
      setBookingHistory(history);
    } catch (error) {
      setActiveBookings([]);
      setBookingHistory([]);
      setErrorMessage('No se pudieron cargar las reservas. Pulsa Reintentar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const doCancel = async () => {
      try {
        await bookingAPI.cancelBooking(bookingId);
        showAlert('Éxito', 'Reserva cancelada correctamente');
        await fetchBookings();
      } catch (error) {
        const message = error.response?.data?.error || 'No se puede cancelar la reserva faltando menos de tres horas';
        showAlert('Error', message);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás seguro de que deseas cancelar esta reserva?');
      if (confirmed) {
        await doCancel();
      }
      return;
    }

    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', onPress: () => {} },
        {
          text: 'Sí, cancelar',
          onPress: doCancel,
        },
      ]
    );
  };

  const getHistoryStatusLabel = (item) => {
    if (item.status === 'cancelled') {
      return 'Cancelada';
    }
    return 'Completada';
  };

  const renderActiveBooking = ({ item }) => (
    <View style={[styles.bookingCard, styles.activeBookingCard]}>
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

  const renderHistoryBooking = ({ item }) => {
    const isCancelled = item.status === 'cancelled';

    return (
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
        <View style={[styles.statusBadge, isCancelled ? styles.statusCancelled : styles.statusOther]}>
          <Text style={styles.statusBadgeText}>{getHistoryStatusLabel(item)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E6BA8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : activeBookings.length === 0 && bookingHistory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tienes reservas</Text>
        </View>
      ) : (
        <FlatList
          data={bookingHistory}
          keyExtractor={(item) => `history-${item.id}`}
          renderItem={renderHistoryBooking}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reservas activas ({activeBookings.length}/2)</Text>
              </View>
              {activeBookings.length === 0 ? (
                <Text style={styles.emptySectionText}>No tienes reservas activas</Text>
              ) : (
                activeBookings.map((booking) => (
                  <View key={`active-${booking.id}`}>{renderActiveBooking({ item: booking })}</View>
                ))
              )}

              <View style={[styles.sectionHeader, styles.historyHeader]}>
                <Text style={styles.sectionTitle}>Historial reciente</Text>
              </View>
              {bookingHistory.length === 0 ? (
                <Text style={styles.emptySectionText}>Sin historial todavía</Text>
              ) : null}
            </View>
          }
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
  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },
  historyHeader: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySectionText: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  bookingCard: {
    ...GlobalStyles.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBookingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
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
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 92,
    alignItems: 'center',
  },
  statusCancelled: {
    backgroundColor: '#d32f2f',
  },
  statusOther: {
    backgroundColor: '#2e7d32',
  },
  statusBadgeText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 320,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: Colors.textWhite,
    fontWeight: '600',
  },
});
