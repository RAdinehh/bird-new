import { showConfirmAsync } from '../store/dialog';

export function useConfirm() {
  const confirmDelete = async (what: string = 'این مورد'): Promise<boolean> => {
    return await showConfirmAsync('تأیید حذف', what + ' حذف شود؟', { danger: true });
  };
  return { confirmDelete };
}
