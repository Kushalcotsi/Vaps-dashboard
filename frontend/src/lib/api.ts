import axios from 'axios';
import { Unit, DashboardData } from '@/types';

// Use environment variable if set, otherwise automatically detect if we're on localhost or production
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const defaultApiUrl = isLocal 
  ? 'http://localhost:8080/api/v1' 
  : 'https://guided-selling.ai-box1.willscot.com/api/v1';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

export const fetchUnits = async (): Promise<Unit[]> => {
  const { data } = await axios.get(`${API_BASE_URL}/units`);
  return data;
};

export const fetchDashboardData = async (unitId: string): Promise<DashboardData> => {
  const { data } = await axios.get(`${API_BASE_URL}/dashboard/${unitId}`);
  return data;
};

export const fetchMetadata = async (): Promise<{ 
  sources: string[], 
  groups: string[],
  markets: string[],
  divisions: string[],
  regions: string[]
}> => {
  const { data } = await axios.get(`${API_BASE_URL}/metadata`);
  return data;
};
