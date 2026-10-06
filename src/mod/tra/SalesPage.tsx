/**
 * SalesPage — wrapper برای InvoicePage (kind=sale)
 */
import InvoicePage from './InvoicePage';

export default function SalesPage({ active = true }: { active?: boolean } = {}) {
  return <InvoicePage kind="sale" active={active} />;
}
