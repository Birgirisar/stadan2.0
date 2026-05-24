import axios from 'axios';
import type { SportmonksResponse } from './types';

const client = axios.create({
  baseURL: 'https://api.sportmonks.com/v3/football',
  timeout: 10_000,
});

export async function smGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const { api_token: _, ...logParams } = {
    api_token: process.env.EXPO_PUBLIC_SPORTMONKS_KEY,
    ...params,
  };
  console.log('[smGet]', path, logParams);
  try {
    const res = await client.get<SportmonksResponse<T>>(path, {
      params: {
        api_token: process.env.EXPO_PUBLIC_SPORTMONKS_KEY,
        ...params,
      },
    });
    console.log('[smGet] OK', path, 'status:', res.status, 'hasData:', res.data?.data != null);
    return res.data.data;
  } catch (err: any) {
    console.error('[smGet] ERROR', path);
    console.error('  status:', err?.response?.status);
    console.error('  message:', err?.message);
    console.error('  body:', JSON.stringify(err?.response?.data)?.slice(0, 500));
    throw err;
  }
}
