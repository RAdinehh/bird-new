import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** render داخل MemoryRouter */
export function renderWithRouter(ui: ReactElement, opts?: RenderOptions) {
  return render(<MemoryRouter>{ui}</MemoryRouter>, opts);
}
