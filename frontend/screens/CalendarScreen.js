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
import { Calendar } from 'react-native-calendars';
import { studioAPI, bookingAPI, userAPI, adminAPI } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const SLOTS = [
  { number: 1, start: '08:00', end: '11:00' },
  { number: 2, start: '11:00', end: '14:00' },
  { number: 3, start: '14:00', end: '17:00' },
  { number: 4, start: '17:00', end: '20:00' },
];

export default function CalendarScreen({ route }) {
  const { studio } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchTimeSlots(selectedDate);
  }, [selectedDate]);

  const checkAdminStatus = async () => {
    try {
      const response = await userAPI.getProfile();
      setIsAdmin(response.data.role === 'admin');
    } catch (error) {
      console.log('Error checking admin status:', error);
    }
  };

  useEffect(() => {
    // Generar fechas marcadas para los próximos 60 días
    const marked = {};
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Sábados y domingos en rojo
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
          textColor: '#ff0000',
          dotColor: '#ff0000',
        };
      }
    }
    
    // Agregar el día seleccionado
    if (selectedDate) {
      const selectedDay = new Date(selectedDate).getDay();
      if (selectedDay !== 0 && selectedDay !== 6) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: '#0E6BA8',
        };
      }
    }
    
    setMarkedDates(marked);
  }, [selectedDate]);

  const fetchTimeSlots = async (date) => {
    try {
      setLoading(true);
      const response = await studioAPI.getTimeSlots(studio.id, date);
      setTimeSlots(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot) => {
    // Si es admin y el slot está reservado, mostrar opciones
    if (isAdmin && slot.status === 'booked') {
      Alert.alert(
        'Gestión de Reserva',
        `Reservado por: ${slot.initials}\n¿Qué deseas hacer?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar reserva',
            style: 'destructive',
            onPress: async () => {
              try {
                // Buscar el booking_id desde el slot
                const bookingsResponse = await adminAPI.getAllBookings();
                const booking = bookingsResponse.data.find(
                  b => b.time_slot_id === slot.id && b.status === 'confirmed'
                );
                
                if (booking) {
                  await adminAPI.cancelBooking(booking.id);
                  Alert.alert('Éxito', 'Reserva eliminada');
                  fetchTimeSlots(selectedDate);
                }
              } catch (error) {
                Alert.alert('Error', 'No se pudo eliminar la reserva');
              }
            },
          },
        ]
      );
      return;
    }

    if (slot.status === 'booked') {
      Alert.alert('No disponible', 'Este horario ya está reservado');
      return;
    }

    if (slot.status === 'blocked') {
      Alert.alert('Bloqueado', 'Este horario no está disponible');
      return;
    }

    setBooking(true);
    try {
      await bookingAPI.createBooking(studio.id, slot.id, selectedDate);
      Alert.alert('Éxito', 'Reserva realizada correctamente');
      fetchTimeSlots(selectedDate);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al realizar la reserva');
    } finally {
      setBooking(false);
    }
  };

  const renderSlot = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.slotCard,
        item.status === 'booked' && styles.slotBooked,
        item.status === 'blocked' && styles.slotBlocked,
      ]}
      onPress={() => handleBookSlot(item)}
      disabled={(!isAdmin && (item.status === 'booked' || item.status === 'blocked')) || booking}
    >
      <Text style={styles.slotTime}>{item.start_time} - {item.end_time}</Text>
      <Text style={[
        styles.slotStatus,
        item.status === 'booked' && styles.statusBooked,
        item.status === 'blocked' && styles.statusBlocked,
      ]}>
        {item.status === 'booked' 
          ? `Reservado: ${item.initials}${isAdmin ? ' (toca para eliminar)' : ''}` 
          : item.status === 'blocked'
          ? 'Bloqueado'
          : 'Disponible'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => {
            const dayOfWeek = new Date(day.dateString).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              setSelectedDate(day.dateString);
            }
          }}
          markedDates={markedDates}
          minDate={new Date().toISOString().split('T')[0]}
          firstDay={1}
          monthFormat={'MMMM yyyy'}
          theme={{
            selectedDayBackgroundColor: '#0E6BA8',
            selectedDayTextColor: '#fff',
            todayTextColor: '#0E6BA8',
            arrowColor: '#0E6BA8',
            textDisabledColor: '#ff0000',
          }}
          localeConfig={{
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          }}
        />
      </View>

      <View style={styles.slotsContainer}>
        <Text style={styles.studioTitle}>{studio.name}</Text>
        <Text style={styles.dateText}>
          {new Date(selectedDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0E6BA8" />
          </View>
        ) : (
          <FlatList
            data={timeSlots}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSlot}
            scrollEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  slotsContainer: {
    flex: 1,
    padding: 15,
  },
  studioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 2,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  slotBooked: {
    borderLeftColor: '#f44336',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  slotStatus: {
    fontSize: 13,
    color: '#4CAF50',
  },
  statusBooked: {
    color: '#f44336',
  },
});
