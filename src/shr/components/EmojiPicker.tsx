import { Modal } from './ui';
import EmojiGrid from './EmojiGrid';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  title?: string;
  value?: string;
}

export default function EmojiPicker({ open, onClose, onPick, title, value }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'انتخاب آیکن'}>
      <EmojiGrid value={value} onPick={em => { onPick(em); onClose(); }} />
    </Modal>
  );
}
