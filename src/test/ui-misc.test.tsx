import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as UI from '../shr/components/ui';

describe('ui module exports', () => {
  it('Btn هست', () => expect(UI.Btn).toBeTruthy());
  it('Input هست', () => expect(UI.Input).toBeTruthy());
  it('Modal هست', () => expect(UI.Modal).toBeTruthy());
  it('Sheet هست', () => expect(UI.Sheet).toBeTruthy());
  it('Field هست', () => expect(UI.Field).toBeTruthy());
  it('Select هست', () => expect(UI.Select).toBeTruthy());
  it('PageContainer هست', () => expect(UI.PageContainer).toBeTruthy());
  it('ErrorBox هست', () => expect(UI.ErrorBox).toBeTruthy());
  it('Empty هست', () => expect(UI.Empty).toBeTruthy());
  it('Tag هست', () => expect(UI.Tag).toBeTruthy());
  it('BtnRow هست', () => expect(UI.BtnRow).toBeTruthy());
  it('Grid2 هست', () => expect(UI.Grid2).toBeTruthy());
});
