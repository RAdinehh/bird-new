import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FloatingAdd from '../cor/ui/FloatingAdd';

/** render داخل MemoryRouter + FloatingAdd (شبیه Layout واقعی) */
export function renderWithRouter(ui: ReactElement, opts?: RenderOptions) {
  return render(
    <MemoryRouter>
      {ui}
      <FloatingAdd />
    </MemoryRouter>,
    opts
  );
}
