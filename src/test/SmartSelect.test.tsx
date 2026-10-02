import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SmartSelect from '../shr/components/SmartSelect';

describe('SmartSelect', () => {
  it('رندر بدون خطا', () => {
    const { container } = render(
      <SmartSelect
        value=""
        onChange={() => {}}
        options={[{ value: 'a', label: 'گزینه A' }]}
      />
    );
    expect(container).toBeTruthy();
  });

  it('با چند گزینه', () => {
    const { container } = render(
      <SmartSelect
        value="a"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />
    );
    expect(container).toBeTruthy();
  });
});
