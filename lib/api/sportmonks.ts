import axios from 'axios';
import type { SportmonksResponse } from './types';

const client = axios.create({
  baseURL: 'https://api.sportmonks.com/v3/football',
  timeout: 10_000,
});

export async function smGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const res = await client.get<SportmonksResponse<T>>(path, {
    params: {
      api_token: process.env.EXPO_PUBLIC_SPORTMONKS_KEY,
      ...params,
    },
  });
  return res.data.data;
}
