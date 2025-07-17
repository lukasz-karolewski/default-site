import { getAllRedirects, Redirect } from '../lib/database';

export async function parseHosts(): Promise<string[]> {
  try {
    // Get hosts from database instead of parsing Caddyfile
    const redirects = getAllRedirects();
    return redirects.map((redirect: Redirect) => redirect.host);
  } catch (error) {
    console.error('Error getting hosts from database:', error);
    return [];
  }
}

export async function getRedirects(): Promise<Redirect[]> {
  try {
    return getAllRedirects();
  } catch (error) {
    console.error('Error getting redirects from database:', error);
    return [];
  }
}