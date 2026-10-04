export interface EmojiGroup { id: string; name: string; icon: string; emojis: string[] }

export const EMOJI_GROUPS: EmojiGroup[] = [
  { id: 'bird',      name: 'پرنده',   icon: '🐔', emojis: ['🐔','🐓','🐤','🐣','🦆','🦢','🕊️','🦜','🥚','🍳'] },
  { id: 'feed',      name: 'خوراک',   icon: '🌾', emojis: ['🌾','🌽','🍞','🥣','🥛','🍚','🫘','🥬','🥕','🍎'] },
  { id: 'water',     name: 'آب',      icon: '💧', emojis: ['💧','💦','🚰','🚿','🛁','🌊','🧊','♨️'] },
  { id: 'equip',     name: 'تجهیزات', icon: '🔧', emojis: ['🔧','🔨','⚙️','🛠️','🔩','🪛','🔗','🧰','📏','📐'] },
  { id: 'energy',    name: 'انرژی',   icon: '⚡', emojis: ['⚡','🔌','💡','🔋','🔦','🕯️','☀️','🌟'] },
  { id: 'weather',   name: 'هوا',     icon: '🌡️', emojis: ['🌡️','❄️','🔥','💨','🌀','🌪️','☁️','🌧️','🌤️','🌫️'] },
  { id: 'building',  name: 'ساختمان', icon: '🏭', emojis: ['🏭','🏠','🏗️','🚪','🪟','🧱','🛖','🏚️'] },
  { id: 'money',     name: 'مالی',    icon: '💰', emojis: ['💰','💵','💴','💶','💷','🪙','💳','📈','📉','📊'] },
  { id: 'health',    name: 'سلامت',   icon: '💊', emojis: ['💊','🩺','🩹','🧴','💉','🧪','🔬','🏥'] },
  { id: 'time',      name: 'زمان',    icon: '⏰', emojis: ['⏰','📅','📆','🗓️','⌚','⏳','⌛','🕐'] },
  { id: 'logistics', name: 'حمل',     icon: '🚚', emojis: ['🚚','📦','📥','📤','🏷️','🛒','🚛','🛫'] },
  { id: 'docs',      name: 'اسناد',   icon: '📝', emojis: ['📝','📋','📄','📑','📁','📂','🗂️','📓'] },
  { id: 'alert',     name: 'هشدار',   icon: '⚠️', emojis: ['⚠️','🚨','❗','❌','✅','🛑','🔔','🔕'] },
  { id: 'people',    name: 'افراد',   icon: '👤', emojis: ['👤','👥','📞','📱','✉️','📧','💬','🤝'] },
  { id: 'symbols',   name: 'نماد',    icon: '⭐', emojis: ['⭐','❤️','👍','👎','🔥','💯','✔️','➡️','⬅️','⬆️','⬇️'] },
];
