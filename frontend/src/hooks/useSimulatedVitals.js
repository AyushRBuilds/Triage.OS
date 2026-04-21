import { useState, useEffect, useRef } from 'react';
import { connectVitalsStream } from '../api/services';

/**
 * Hook that streams live patient vitals from Supabase Realtime.
 * Falls back gracefully if no data is received.
 *
 * @param {Array} initialPatients - Array of patient objects with vitals
 * @returns {{ patients: Array, isConnected: boolean }}
 */
export function useSimulatedVitals(initialPatients) {
  const [patients, setPatients] = useState(initialPatients || []);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!initialPatients || initialPatients.length === 0) return;
    setPatients(initialPatients);

    const connection = connectVitalsStream((updates) => {
      setPatients((prev) =>
        prev.map((patient) => {
          const update = updates.find((u) => u.patientId === patient.id);
          if (update) {
            return {
              ...patient,
              vitals: update.vitals,
              lastUpdated: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            };
          }
          return patient;
        })
      );
    });

    connectionRef.current = connection;
    setIsConnected(true);

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        setIsConnected(false);
      }
    };
  }, [initialPatients]);

  return { patients, isConnected };
}

/**
 * Hook for animating a single vital value when it changes.
 */
export function useAnimatedValue(value) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setIsUpdating(true);
      setDisplayValue(value);
      prevRef.current = value;
      const timer = setTimeout(() => setIsUpdating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return { displayValue, isUpdating };
}
