/**
 * PurchasesPage — wrapper برای InvoicePage (kind=purchase)
 */
import InvoicePage from './InvoicePage';

export default function PurchasesPage({ active = true }: { active?: boolean } = {}) {
  return <InvoicePage kind="purchase" active={active} />;
}
