import { useState, useEffect, useRef, useCallback } from 'react';
import { connectVitalsStream } from '../api/services';

/**
 * Hook that provides live-updating patient vitals via simulated WebSocket.
 * Updates every 3 seconds with slight random fluctuations.
 * 
 * @param {Array} initialPatients - Array of patient objects with vitals
 * @returns {{ patients: Array, isConnected: boolean }}
 */
export function useSimulatedVitals(initialPatients) {
  const [patients, setPatients] = useState(initialPatients);
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
 * Hook for a single patient's vital with animated value transition.
 * Returns current value and previous value for animation comparison.
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
