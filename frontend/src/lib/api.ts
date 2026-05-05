import axios from 'axios';
import { Unit, DashboardData } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const fetchUnits = async (): Promise<Unit[]> => {
  const { data } = await axios.get(`${API_BASE_URL}/units`);
  return data;
};

export const fetchDashboardData = async (unitId: string): Promise<DashboardData> => {
  const { data } = await axios.get(`${API_BASE_URL}/dashboard/${unitId}`);
  return data;
};

export const fetchMetadata = async (): Promise<{ sources: string[], groups: string[] }> => {
  const { data } = await axios.get(`${API_BASE_URL}/metadata`);
  return data;
};
