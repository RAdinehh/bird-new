import { describe, it, expect } from 'vitest';
import * as audio from '../shr/utils/audio';

describe('audio', () => {
  it('exports موجودن', () => {
    expect(Object.keys(audio).length).toBeGreaterThan(0);
  });
});
