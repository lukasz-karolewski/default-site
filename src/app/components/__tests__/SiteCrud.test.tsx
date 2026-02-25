import { describe, it, expect } from 'vitest';
import { buildSiteUrl } from '../../utils/siteLink';

describe('buildSiteUrl', () => {
  it('appends the root domain for subdomain labels', () => {
    expect(buildSiteUrl('alpha', 'example.com')).toBe('https://alpha.example.com');
  });

  it('keeps hosts already under the root domain', () => {
    expect(buildSiteUrl('alpha.example.com', 'example.com')).toBe('https://alpha.example.com');
  });

  it('normalizes leading protocol and dots', () => {
    expect(buildSiteUrl('https://beta..', '.example.com.')).toBe('https://beta.example.com');
  });
});
