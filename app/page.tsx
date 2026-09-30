'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { format, addDays, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
  X
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

// Define the steps of our journey
type Step = 'delivery' | 'opening' | 'bot_chat' | 'mood_select' | 'date_select' | 'confirmed';

interface MoodOption {
  id: string;
  icon: string;
  title: string;
  detail: string;
  compliment: string | ((custom: string) => string);
}

export interface AutumnEvent {
  id: string;
  title: string;
  category: 'fireworks' | 'festival' | 'food';
  categoryLabel: string;
  badgeEmoji: string;
  dates: string[]; // YYYY-MM-DD
  dateDisplay: string;
  location: string;
  timeInfo: string;
  shortDesc: string;
  fullDesc: string;
  recommendedSlot?: string;
  highlightTag?: string;
  isRecommended?: boolean;
  recommendBadge?: string;
}

export const autumnEvents: AutumnEvent[] = [
  {
    id: 'shinagawa-fireworks',
    title: '天王洲アイル・秋の運河花火まつり2026',
    category: 'fireworks',
    categoryLabel: '秋の運河花火大会',
    badgeEmoji: '🎆',
    dates: ['2026-10-10'],
    dateDisplay: '10月10日 (土)',
    location: '品川区 / 東品川海上公園・天王洲公園（天王洲アイル）',
    timeInfo: '花火 19:00〜19:30（土曜18:00〜OK）',
    shortDesc: '水辺の夜風と運河沿いの夜景が最高！お互いの家からすぐ近くなので、行き帰りも楽ちんで安心です✨',
    fullDesc: '水辺のウッドデッキから見上げる約8,000発の華麗な花火！なんといってもお互いの家からすぐ近くなので移動も帰り道もすごく楽ちん✨ 屋台や水辺のライトアップカフェもあって、混雑に疲れることなくゆったり秋の夜を楽しめるアドワイトの一番のおすすめスポットです！',
    recommendedSlot: '19:00',
    highlightTag: '約8,000発 · 水辺の夜景',
    isRecommended: true,
    recommendBadge: '近くて一番おすすめ'
  },
  {
    id: 'tamagawa-fireworks',
    title: '第48回 世田谷区たまがわ花火大会',
    category: 'fireworks',
    categoryLabel: '秋の大花火大会',
    badgeEmoji: '🎆',
    dates: ['2026-10-03'],
    dateDisplay: '10月3日 (土)',
    location: '世田谷区 / 二子玉川緑地運動場',
    timeInfo: '花火 18:00〜19:00',
    shortDesc: '約6,000発！多摩川の夜空を彩る大花火大会。屋台もたくさん並びます✨',
    fullDesc: '秋空の下、多摩川の両岸で打ち上がる約6,000発の華麗な大花火！屋台グルメも楽しめて、土曜18:00のアドワイトの空き時間にぴったりです。',
    recommendedSlot: '18:00',
    highlightTag: '約6,000発・屋台あり'
  },
  {
    id: 'shonan-candle',
    title: '江の島 湘南キャンドル2026',
    category: 'festival',
    categoryLabel: '日本最大級・1万本の灯火',
    badgeEmoji: '🕯️',
    dates: [
      '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14',
      '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19',
      '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24',
      '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29',
      '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'
    ],
    dateDisplay: '10/10(土)〜11/3(火・祝) 毎日開催',
    location: '藤沢市江の島 / サムエル・コッキング苑',
    timeInfo: '点灯 17:00〜 (平日20:00 / 土日祝21:00)',
    shortDesc: '日本最大級1万本のキャンドルが灯る幻想的な25日間✨ 海風と江の島夜景も最高！',
    fullDesc: '江の島シーキャンドルとコッキング苑に1万本のキャンドルが灯る秋の祭典。期間中は毎日開催！夕暮れの海と富士山、夜のキャンドルの光がとても綺麗です。',
    recommendedSlot: '17:30',
    highlightTag: '1万本の灯火・25日間毎日開催 🕯️'
  },
  {
    id: 'ikebukuro-yosakoi',
    title: '第57回 ふくろ祭り・東京よさこい',
    category: 'festival',
    categoryLabel: '伝統のお祭り',
    badgeEmoji: '🏮',
    dates: ['2026-10-10', '2026-10-11'],
    dateDisplay: '10月10日(土)〜11日(日)',
    location: '豊島区 / 池袋駅西口周辺',
    timeInfo: '10/10(土) 前夜祭・10/11(日) 終日本祭',
    shortDesc: '全国から踊り手が集結！大迫力の舞と熱気に包まれる秋のビッグフェス✨',
    fullDesc: '池袋西口の通りを踊り手たちが練り歩く大熱狂のよさこい祭り！日曜日はアドワイトも終日フリーなので、昼から屋台巡りもできます。',
    recommendedSlot: '13:30',
    highlightTag: '大迫力の踊り・屋台巡り'
  },
  {
    id: 'oeshiki-mando',
    title: 'お会式 万灯練供養 (Oeshiki Festival)',
    category: 'festival',
    categoryLabel: '伝統の夜祭り',
    badgeEmoji: '🏮',
    dates: ['2026-10-12'],
    dateDisplay: '10月12日 (月・祝)',
    location: '大田区 / 池上本門寺',
    timeInfo: '18:30〜深夜 (クライマックス)',
    shortDesc: '和紙の桜で飾られた万灯を持つ3,000人の幻想的な行列！入場無料✨',
    fullDesc: '池上本門寺へ向かって、3,000人もの人々が桜の花で飾られた美しい万灯を掲げて練り歩く伝統行事。太鼓と笛の音が夜空に響く圧巻の光景です。',
    recommendedSlot: '19:00',
    highlightTag: '桜灯籠行列・幻想的な夜'
  },
  {
    id: 'kawagoe-matsuri',
    title: '川越まつり (小江戸川越の秋祭り)',
    category: 'festival',
    categoryLabel: '伝統の山車祭り',
    badgeEmoji: '🏮',
    dates: ['2026-10-17', '2026-10-18'],
    dateDisplay: '10月17日(土)〜18日(日)',
    location: '埼玉県川越市 / 蔵造りの町並み',
    timeInfo: '夕方〜夜 (山車巡行・提灯)',
    shortDesc: '関東三大祭り！小江戸の蔵造り通りを彩る豪華絢爛な山車巡行🏮',
    fullDesc: '江戸の風情が色濃く残る川越の町を、巨大で絢爛豪華な山車が巡行します。夜には提灯が灯り、お囃子の競演「曳っかわせ」は大迫力！',
    recommendedSlot: '18:00',
    highlightTag: '関東三大祭り・豪華山車'
  },
  {
    id: 'asakusa-dragon',
    title: '浅草寺 金龍の舞 (Golden Dragon Dance)',
    category: 'festival',
    categoryLabel: '浅草寺伝統の舞',
    badgeEmoji: '🐉',
    dates: ['2026-10-18'],
    dateDisplay: '10月18日 (日)',
    location: '台東区 / 浅草 浅草寺',
    timeInfo: '11:00 / 14:00 / 15:00 (境内演舞)',
    shortDesc: '18mの黄金の龍が舞い踊る浅草寺の名物行事！日曜昼のお散歩に最高✨',
    fullDesc: '浅草寺本堂前で、長さ18メートル・重さ約88キロの黄金に輝く龍が勇壮に舞い踊る名物行事。芸者衆の華やかな行列も見どころです。日曜終日OK！',
    recommendedSlot: '13:30',
    highlightTag: '18mの金龍・芸者行列'
  },
  {
    id: 'tokyo-bay-fireworks',
    title: '中央区・港区 東京湾大華火祭',
    category: 'fireworks',
    categoryLabel: '11年ぶりの復活大花火',
    badgeEmoji: '🎆',
    dates: ['2026-10-24'],
    dateDisplay: '10月24日 (土)',
    location: '中央区 / 東京港晴海埠頭沖海上',
    timeInfo: '花火 17:30〜19:00',
    shortDesc: '11年ぶりの復活！東京湾の夜空に咲く約1万2,000発の超特大花火の祭典✨',
    fullDesc: '東京の秋を代表する伝説の花火大会が11年ぶりに復活！晴海沖から打ち上がる約1万2,000発の花火と東京タワー・ベイエリアの夜景のコラボは必見です。',
    recommendedSlot: '18:00',
    highlightTag: '約12,000発・11年ぶり復活'
  },
  {
    id: 'koenji-fes',
    title: '高円寺フェス 2026',
    category: 'festival',
    categoryLabel: '秋のカルチャーフェス',
    badgeEmoji: '🎭',
    dates: ['2026-10-24', '2026-10-25'],
    dateDisplay: '10月24日(土)〜25日(日)',
    location: '杉並区 / 高円寺駅周辺商店街',
    timeInfo: '昼〜夕方開催',
    shortDesc: '路上プロレス・生ライブ・古着＆フード市！高円寺の街中がお祭り騒ぎ✨',
    fullDesc: '個性あふれる高円寺の街全体がテーマパークに！駅前での無料路上プロレスや、ライブ、ハンドメイドマーケット、カフェ巡りなど見どころ満載です。',
    recommendedSlot: '13:30',
    highlightTag: '路上プロレス・ライブ・古着'
  },
  {
    id: 'tokyo-ramen-festa',
    title: '東京ラーメンフェスタ 2026',
    category: 'food',
    categoryLabel: '日本最大級ラーメン祭',
    badgeEmoji: '🍜',
    dates: ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'],
    dateDisplay: '10月30日(金)〜11月3日(火・祝)',
    location: '世田谷区 / 駒沢オリンピック公園 中央広場',
    timeInfo: '10:30〜20:30',
    shortDesc: '日本全国から名店が大集結！豚骨・醤油・味噌など絶品ラーメン食べ比べ🍜',
    fullDesc: '駒沢公園の青空の下で全国選りすぐりのご当地ラーメンを楽しめる秋の恒例フェス！入場無料で、肌寒くなってきた秋の夜に熱々の一杯をシェアするのに最高です。',
    recommendedSlot: '18:00',
    highlightTag: '全国の名店・入場無料'
  }
];

const moodOptions: MoodOption[] = [
  {
    id: 'fireworks',
    icon: '🎆',
    title: '秋の花火・キャンドル・お祭り',
    detail: '天王洲アイル（10/10）や江の島キャンドルへ！',
    compliment: '🎆 天王洲アイル（10/10）や江の島キャンドル、最高だにゃ！澄んだ秋の夜風と屋台グルメは最高の思い出になるよ！アドワイトも大喜び間違いなし🐾'
  },
  {
    id: 'golf',
    icon: '⛳️',
    title: 'ゴルフの打ちっぱなし',
    detail: '一緒にスイング練習してリフレッシュ🏌️‍♀️',
    compliment: '⛳️ ゴルフ練習、いいね！アドワイトも密かにスイングを練習してるみたいだけど、きっと淳子の方がフォームが綺麗だにゃ！楽しく打ってリフレッシュしよう！🐾'
  },
  {
    id: 'dinner',
    icon: '🍽️',
    title: 'おいしい夜ご飯',
    detail: '落ち着くお店でゆっくりおしゃべり🍽️',
    compliment: '🍽️ 美味しいご飯、最高だにゃ！温かい空間でたくさんおしゃべりして、美味しいスイーツまで楽しもうね🍰🐾'
  },
  {
    id: 'other',
    icon: '✨',
    title: '淳子のおすすめプラン',
    detail: '行きたい場所があれば教えてね！',
    compliment: (customText: string) =>
      `🌟 「${customText || '淳子の特別プラン'}」！それすごく楽しそうだにゃ！淳子のセンスは最高！アドワイトもきっと大喜びするよ🐾`
  }
];

const generalExcuses = [
  '🐾 猫審議会からの報告：アドワイトはお仕事中ですが、淳子と遊ぶ日を楽しみにして指折り数えています！',
  '🐾 最高のお出かけにするために、美味しいご飯屋さんを一生懸命リサーチ中です！',
  '🐾 お出かけ当日に向けて、猫からの指令でしっかりエネルギーチャージしています🐾',
  '🐾 淳子に笑顔になってもらえるよう、面白いお話を準備しているみたいです😸',
  '🐾 猫の特別パトロール：アドワイトはお仕事中も淳子との約束を楽しみにしてワクワクしています！'
];

const confetti = Array.from({ length: 32 }, (_, id) => ({
  id,
  left: `${3 + ((id * 37) % 94)}%`,
  delay: `${(id % 8) * 0.08}s`,
  color: ['#ad5f6c', '#cf8e99', '#dfc3a7', '#8ea594', '#d8c5b0'][id % 5]
}));

export default function Home() {
  const [step, setStep] = useState<Step>('delivery');
  const [deliveryDropped, setDeliveryDropped] = useState(false);
  const [noHovered, setNoHovered] = useState(false);
  const [noAttempts, setNoAttempts] = useState(0);
  const [noWarning, setNoWarning] = useState<string | null>(null);

  // Mood selection
  const [selectedMoodId, setSelectedMoodId] = useState<string>('golf');
  const [customMoodText, setCustomMoodText] = useState<string>('');
  const [activeCompliment, setActiveCompliment] = useState<string>('');

  // Date & Slot selection
  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const indiaStartDate = useMemo(() => new Date(2026, 10, 6), []); // Nov 6, 2026
  const maxAvailableDate = useMemo(() => new Date(2026, 10, 5), []); // Nov 5, 2026

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => tomorrow);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [showExcuseDrawer, setShowExcuseDrawer] = useState<boolean>(false);
  const [indiaWarningModal, setIndiaWarningModal] = useState<boolean>(false);
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [notifySent, setNotifySent] = useState<boolean>(false);
  const [appliedEventToast, setAppliedEventToast] = useState<string | null>(null);

  // All event dates as Date objects for calendar modifier
  const eventDateObjects = useMemo(() => {
    const dates: Date[] = [];
    autumnEvents.forEach(ev => {
      ev.dates.forEach(dStr => {
        const [year, month, day] = dStr.split('-').map(Number);
        dates.push(new Date(year, month - 1, day));
      });
    });
    return dates;
  }, []);

  // Events matching the currently selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return autumnEvents.filter(ev => ev.dates.includes(dateKey));
  }, [selectedDate]);

  // Reset activeEventIndex when selectedDate changes
  useEffect(() => {
    setActiveEventIndex(0);
  }, [selectedDate]);

  // Jump to an event date from the quick-pick bar
  const handleJumpToEvent = (ev: AutumnEvent) => {
    const [year, month, day] = ev.dates[0].split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    setSelectedDate(targetDate);
    const dateKey = format(targetDate, 'yyyy-MM-dd');
    const dayEvents = autumnEvents.filter(e => e.dates.includes(dateKey));
    const evIdx = dayEvents.findIndex(e => e.id === ev.id);
    setActiveEventIndex(evIdx >= 0 ? evIdx : 0);
    if (ev.recommendedSlot) {
      setSelectedSlot(ev.recommendedSlot);
    }
  };

  // Apply the event as the hangout activity plan
  const handleApplyEventToPlan = (ev: AutumnEvent) => {
    setSelectedMoodId('other');
    setCustomMoodText(`${ev.title} ${ev.badgeEmoji}`);
    if (ev.recommendedSlot) {
      setSelectedSlot(ev.recommendedSlot);
    }
    setAppliedEventToast(`「${ev.title}」をお出かけプランに設定しました！🐾`);
    window.setTimeout(() => setAppliedEventToast(null), 3500);
  };

  // Apply a combo plan (e.g. Golf/Dinner + Tennozu Isle Fireworks)
  const handleApplyComboToPlan = (ev: AutumnEvent) => {
    setSelectedMoodId('other');
    const comboTitle = `${currentMoodTitle} ＆ ${ev.title} ${ev.badgeEmoji}`;
    setCustomMoodText(comboTitle);
    if (ev.recommendedSlot) {
      setSelectedSlot(ev.recommendedSlot);
    }
    setAppliedEventToast(`「${currentMoodTitle} ＆ ${ev.title}」をセットにしました！🐾`);
    window.setTimeout(() => setAppliedEventToast(null), 3500);
  };

  // Preload cat sprite images
  useEffect(() => {
    ['/black-cat-walk.png', '/black-cat-wave.png', '/black-date-cat.png', '/envelope.png', '/cat-peeking-card.png', '/cat-paw-press.png'].forEach(src => {
      const img = new window.Image();
      img.src = src;
      void img.decode?.().catch(() => undefined);
    });
  }, []);

  // Drop letter after cat walks in
  useEffect(() => {
    if (step === 'delivery') {
      const timer = window.setTimeout(() => {
        setDeliveryDropped(true);
      }, 1900);
      return () => window.clearTimeout(timer);
    }
  }, [step]);

  // When step switches to mood_select, initialize compliment
  useEffect(() => {
    if (step === 'mood_select') {
      const mood = moodOptions.find(m => m.id === selectedMoodId);
      if (mood) {
        if (typeof mood.compliment === 'function') {
          setActiveCompliment(mood.compliment(customMoodText));
        } else {
          setActiveCompliment(mood.compliment);
        }
      }
    }
  }, [step, selectedMoodId, customMoodText]);

  // Day schedule & availability rules based on date
  const daySchedule = useMemo(() => {
    if (!selectedDate) return null;
    const day = selectedDate.getDay();

    if (day === 0) {
      // Sunday: Free whole day!
      return {
        dayName: '日曜日',
        badge: '終日OK！☀️',
        description: '日曜日は一日中フリー！お昼のお散歩や夜ご飯まで何時でも合わせられます！',
        slots: ['11:30', '13:30', '15:30', '17:30', '19:00', '20:30'],
        excuse: '日曜日はミーティングが全くありません！淳子の都合の良い時間にいつでも合わせられます！'
      };
    } else if (day >= 1 && day <= 4) {
      // Monday to Thursday: Free after 19:00 (7:00 PM)
      return {
        dayName: format(selectedDate, 'EEEE', { locale: ja }),
        badge: '19:00〜 OK 🌙',
        description: '平日の夜にまったりお出かけ！19:00以降ならいつでも大丈夫です。',
        slots: ['19:00', '19:30', '20:00', '20:30', '21:00'],
        excuse: '🐾 平日のお仕事事情：アドワイトは19:00までデスクでお仕事中ですが、19:00を過ぎたらすぐに駆けつけられます！'
      };
    } else if (day === 5) {
      // Friday: Free after 18:00 (6:00 PM)
      return {
        dayName: '金曜日',
        badge: '18:00〜 OK ✨',
        description: '華金ナイト！1週間の締めくくりに、18:00から乾杯やお出かけを楽しみましょう！',
        slots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
        excuse: '🐾 金曜日はお仕事を早めに切り上げて、18:00には準備万全で待機しています！'
      };
    } else {
      // Saturday: Free after 18:00 (6:00 PM)
      return {
        dayName: '土曜日',
        badge: '18:00〜 OK 🌆',
        description: '土曜の夕方から！ゆったりとした週末のひとときを過ごしましょう。',
        slots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
        excuse: '🐾 土曜の昼間は用事を済ませて、夕方18:00以降はお出かけフリーです！'
      };
    }
  }, [selectedDate]);

  // Set default slot when day schedule changes
  useEffect(() => {
    if (daySchedule && (!selectedSlot || !daySchedule.slots.includes(selectedSlot))) {
      setSelectedSlot(daySchedule.slots[0]);
    }
  }, [daySchedule, selectedSlot]);

  // Handler for tapping the envelope
  const handleOpenLetter = () => {
    if (step !== 'delivery') return;
    setStep('opening');
    window.setTimeout(() => {
      setStep('bot_chat');
    }, 2800);
  };

  // Playful defense on "No" button
  const handleNoInteraction = () => {
    setNoHovered(true);
    setNoAttempts(prev => {
      const next = prev + 1;
      const warnings = [
        '🐾 猫パンチ発動！淳子、アドワイトに「いいえ」は言えません！🥺',
        '🐾 猫の法律によりアクセス拒否！光る「もちろん、行こう！」を押してね✨',
        '🐾 ぷいっ！猫がボタンをガードしています。アドワイトをがっかりさせないで〜！😸',
        '🐾 猫の肉球スタンプで拒否！「はい」を押すのが唯一のルールです🥰',
        '🐾 猫の特別ルール：「いいえ」を押すことは法律で禁じられています🐾'
      ];
      setNoWarning(warnings[(next - 1) % warnings.length]);
      return next;
    });
  };

  const handleNoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleNoInteraction();
    // Do NOT prematurely force page navigation!
    // Junko has all the time to read the funny cat warning.
  };

  // Select mood
  const handleSelectMood = (id: string) => {
    setSelectedMoodId(id);
    if (id === 'fireworks') {
      setSelectedDate(new Date(2026, 9, 10)); // Default to Oct 10 (Tennozu Isle Fireworks!)
      setSelectedSlot('19:00');
    }
    const mood = moodOptions.find(m => m.id === id);
    if (mood) {
      if (typeof mood.compliment === 'function') {
        setActiveCompliment(mood.compliment(customMoodText));
      } else {
        setActiveCompliment(mood.compliment);
      }
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomMoodText(text);
    const otherMood = moodOptions.find(m => m.id === 'other');
    if (otherMood && typeof otherMood.compliment === 'function') {
      setActiveCompliment(otherMood.compliment(text));
    }
  };

  const currentMoodTitle = useMemo(() => {
    if (selectedMoodId === 'other') {
      return customMoodText.trim() ? customMoodText : '淳子のおすすめプラン';
    }
    return moodOptions.find(m => m.id === selectedMoodId)?.title ?? 'ゴルフの打ちっぱなし';
  }, [selectedMoodId, customMoodText]);

  const isFireworksPlan = selectedMoodId === 'fireworks';

  const calendarIntroInfo = useMemo(() => {
    switch (selectedMoodId) {
      case 'fireworks':
        return {
          eyebrow: 'STEP 03 / 日程選び',
          title: 'いつ花火を見に行く？🎆',
          subtext: '行きたい日をタップして選んでね！'
        };
      case 'golf':
        return {
          eyebrow: 'STEP 03 / 日程選び',
          title: 'いつゴルフに行く？🏌️‍♀️',
          subtext: '空いてる日をタップして選んでね！'
        };
      case 'dinner':
        return {
          eyebrow: 'STEP 03 / 日程選び',
          title: 'いつ夜ご飯に行く？🍽️',
          subtext: '空いてる日をタップして選んでね！'
        };
      default:
        return {
          eyebrow: 'STEP 03 / 日程選び',
          title: 'いつ遊びに行く？✨',
          subtext: '空いてる日をタップして選んでね！'
        };
    }
  }, [selectedMoodId]);

  // Clean, sweet, casual Japanese note for Adwait
  const shareText = useMemo(() => {
    const formattedDate = selectedDate
      ? format(selectedDate, 'M月d日(E)', { locale: ja })
      : 'その日';
    return `アドワイト、${formattedDate} ${selectedSlot} の「${currentMoodTitle}」、空いてるよ！行こう 🙂`;
  }, [selectedDate, selectedSlot, currentMoodTitle]);

  const handleConfirmHangout = async () => {
    setIsNotifying(true);
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy年 M月d日 (EEEE)', { locale: ja }) : '';
    const payload = {
      activity: currentMoodTitle,
      date: formattedDate,
      time: selectedSlot,
      message: shareText,
      guest: '淳子',
      timestamp: new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('junko_hangout_confirmed', JSON.stringify(payload));
      }
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setNotifySent(true);
    } catch (err) {
      console.error('Failed to notify Adwait directly:', err);
    } finally {
      setIsNotifying(false);
      setStep('confirmed');
    }
  };

  return (
    <main className={`junko-page stage-${step}`}>
      <div className="grain" aria-hidden="true" />

      {/* Top Navigation */}
      <nav className="click-nav">
        <button className="brand button-reset" onClick={() => setStep('delivery')} aria-label="Restart delivery">
          <span className="brand-mark"><Heart size={14} fill="currentColor" /></span>
          <span>JUNKO VERSE</span>
        </button>

        <div className="scene-dots" aria-label="Progress">
          <i className={['delivery', 'opening'].includes(step) ? 'active' : 'done'} />
          <i className={step === 'bot_chat' ? 'active' : ['mood_select', 'date_select', 'confirmed'].includes(step) ? 'done' : ''} />
          <i className={step === 'mood_select' ? 'active' : ['date_select', 'confirmed'].includes(step) ? 'done' : ''} />
          <i className={step === 'date_select' ? 'active' : step === 'confirmed' ? 'done' : ''} />
          <i className={step === 'confirmed' ? 'active' : ''} />
        </div>

        <span className="top-note">淳子へ、小さなお手紙</span>
      </nav>

      <div className="main-content-window">
        {/* ========================================================================= */}
        {/* STAGE 1: LETTER DELIVERY (Cat walks in, drops letter, says Open it)     */}
        {/* ========================================================================= */}
        {step === 'delivery' && (
          <section className="delivery-view animate-fade-in">
            <div className="delivery-hero-text">
              <p className="eyebrow"><Sparkles size={14} /> 特別なお届けもの</p>
              <h1>淳子へ、<br />大切なお手紙。</h1>
              <p className="delivery-sub">
                黒猫が手紙を届けにやってきました 🐾
              </p>
            </div>

            <div className="delivery-stage">
              {/* Walking cat moving into center */}
              {!deliveryDropped && (
                <div className="delivery-walker">
                  <Image
                    src="/black-cat-walk-anim.png"
                    alt="Courier cat walking in carrying letter in mouth"
                    width={320}
                    height={270}
                    className="walking-cat-img"
                    unoptimized
                    priority
                  />
                </div>
              )}

              {/* Once dropped: Waving cat and the clickable glowing envelope */}
              {deliveryDropped && (
                <div className="delivery-dropped-stage">
                  <div className="dropped-cat-wrap">
                    <div className="cat-dialog-bubble">
                      <span className="bubble-paw">🐾</span>
                      <p>お手紙が届いたよ！タップして開けてね 💌</p>
                    </div>
                    <Image
                      src="/black-cat-wave-anim.png"
                      alt="Cute courier cat waving"
                      width={260}
                      height={297}
                      className="waving-cat-img"
                      unoptimized
                      priority
                    />
                  </div>

                  {/* Clickable Envelope */}
                  <div className="envelope-interactive" onClick={handleOpenLetter} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleOpenLetter()} aria-label="お手紙をタップして開く">
                    <div className="envelope-halo" />
                    <Image src="/envelope.png" alt="Letter for Junko sealed with cat paw" width={280} height={233} className="envelope-main-img" priority />
                    <div className="tap-badge">
                      <Sparkles size={13} /> タップして開く 🐾
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: FLYING LETTER OPENING (No cat, letter takes flight & opens)      */}
        {/* ========================================================================= */}
        {step === 'opening' && (
          <section className="opening-view" aria-label="Opening letter for Junko">
            <div className="confetti" aria-hidden="true">
              {confetti.map(piece => (
                <i key={piece.id} style={{ left: piece.left, animationDelay: piece.delay, background: piece.color }} />
              ))}
            </div>

            <div className="flying-letter-stage">
              {/* Golden Ambient Stardust Aura */}
              <div className="flying-letter-aura" />

              {/* The Flying & Hovering Letter Assembly */}
              <div className="flying-letter-assembly">
                {/* Parchment card that slides and unfolds upwards as it opens */}
                <div className="letter-unfolding-parchment">
                  <div className="parchment-inner">
                    <span className="parchment-sparkle">✨</span>
                    <p className="parchment-title">淳子へ</p>
                    <span className="parchment-badge">大切なお手紙 🐾</span>
                  </div>
                </div>

                {/* Envelope Front with Paw Wax Seal */}
                <div className="flying-envelope-wrap">
                  <Image
                    src="/envelope.png"
                    alt="Flying letter opening"
                    width={300}
                    height={250}
                    className="flying-envelope-img"
                    priority
                  />
                  {/* Wax Seal Magic Light Burst */}
                  <div className="wax-magic-burst" />
                </div>
              </div>

              <div className="flying-letter-caption">
                <Sparkles size={14} className="caption-sparkle" />
                <span>特別なお手紙を開封中…</span>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* STAGE 3: AI CAT BOT CHAT (Cat Holding Card by Two Hands, Face Behind)     */}
        {/* ========================================================================= */}
        {step === 'bot_chat' && (
          <section className="bot-chat-view animate-fade-in">
            <div className="bot-chat-center-stage">
              {/* Cat Peeking from Behind, Holding Card with Both Paws */}
              <div className="holding-cat-wrap">
                <Image
                  src="/cat-peeking-card.png"
                  alt="JunkoBot Cat holding card"
                  width={380}
                  height={340}
                  className="cat-holding-img"
                  priority
                />
              </div>

              <div className="bot-chat-card card-held-by-cat">
                <div className="bot-card-header">
                  <div>
                    <span className="step-tag"><Sparkles size={12} /> JUNKO VERSE AI</span>
                    <h2>黒猫アンバサダーより公式の質問</h2>
                  </div>
                  <div className="bot-status-pill">
                    <span className="live-dot" /> 淳子Bot 🐾
                  </div>
                </div>

                <div className="chat-stream">
                  <div className="chat-bubble bot-msg animate-bubble-1">
                    <span className="bubble-icon">🐾</span>
                    <div className="bubble-content">
                      <p className="bubble-greeting">淳子、こんにちは！✨</p>
                      <p>アドワイトからのお手紙をお預かりしています 🐾</p>
                    </div>
                  </div>

                  <div className="chat-bubble bot-msg animate-bubble-2">
                    <span className="bubble-icon">💌</span>
                    <div className="bubble-content">
                      <p className="highlight-question">「今度、一緒に遊びに行かない？🥺」</p>
                    </div>
                  </div>
                </div>

                {/* No warning alert if she hovered/tried to click No */}
                {noWarning && (
                  <div className="no-warning-banner animate-bounce-short">
                    <p>{noWarning}</p>
                  </div>
                )}

                {/* Two Option Buttons: YES vs NO (with Cute Cat Paw Guard) */}
                <div className="bot-choice-actions">
                  <button
                    type="button"
                    className="primary-action yes-action"
                    onClick={() => setStep('mood_select')}
                  >
                    <Heart size={16} fill="currentColor" /> もちろん、行こう！ 🥰
                  </button>

                  {/* The "NO" button with real cute cat paw stamp */}
                  <div
                    className={`no-button-wrapper ${noHovered ? 'is-shaking' : ''}`}
                    onMouseEnter={handleNoInteraction}
                    onTouchStart={handleNoInteraction}
                  >
                    <button
                      type="button"
                      className="no-action-btn"
                      onClick={handleNoClick}
                    >
                      いやだ 🙈
                    </button>

                    {/* Cute Cat Paw Image pressing over NO */}
                    <div className="cat-paw-press-overlay" title="猫が阻止しています！">
                      <Image
                        src="/cat-paw-press.png"
                        alt="Cat paw holding down No"
                        width={68}
                        height={64}
                        className="cat-paw-stamp-img"
                      />
                      <span className="paw-veto-pill">猫パンチ！🐾</span>
                    </div>
                  </div>
                </div>

                <p className="bot-subtext">※ 猫の法律により、「いいえ」の選択肢は厳重にブロックされています。</p>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: MOOD QUESTION & PERSONALIZED COMPLIMENT                         */}
        {/* ========================================================================= */}
        {step === 'mood_select' && (
          <section className="mood-view animate-fade-in">
            <button className="back-action" onClick={() => setStep('bot_chat')}>
              <ArrowLeft size={16} /> 戻る
            </button>

            <div className="mood-header">
              <p className="eyebrow"><Sparkles size={14} /> STEP 02 / プラン選び</p>
              <h2>アドワイトと、<br />何をして過ごす？</h2>
              <p className="mood-sub">淳子の気分に合わせて、好きなプランを教えてね！</p>
            </div>

            <div className="mood-grid">
              {moodOptions.map(mood => {
                const isSelected = selectedMoodId === mood.id;
                return (
                  <div
                    key={mood.id}
                    className={`mood-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectMood(mood.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectMood(mood.id)}
                  >
                    <div className="mood-card-top">
                      <span className="mood-emoji">{mood.icon}</span>
                      {isSelected && <span className="check-chip"><Check size={14} /></span>}
                    </div>
                    <h3>{mood.title}</h3>
                    <p>{mood.detail}</p>

                    {/* Custom text input if Other is selected */}
                    {mood.id === 'other' && isSelected && (
                      <div className="custom-input-box" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="例：ピクニック、水族館、ドライブなど…"
                          value={customMoodText}
                          onChange={(e) => handleCustomTextChange(e.target.value)}
                          className="custom-text-field"
                          maxLength={60}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Compliment Bubble from Cat Bot */}
            {activeCompliment && (
              <div className="compliment-card animate-slide-up">
                <div className="compliment-avatar">
                  <Image src="/black-date-cat.png" alt="Cat Compliment" width={68} height={85} className="compliment-cat-img" />
                </div>
                <div className="compliment-text">
                  <span className="compliment-kicker"><Sparkles size={13} /> 黒猫からのコメント</span>
                  <p>{activeCompliment}</p>
                </div>
              </div>
            )}

            <div className="mood-actions">
              <button
                type="button"
                className="primary-action mood-next-btn"
                onClick={() => {
                  if (selectedMoodId === 'fireworks' && (!selectedDate || format(selectedDate, 'yyyy-MM-dd') !== '2026-10-10')) {
                    setSelectedDate(new Date(2026, 9, 10)); // Oct 10 (Tennozu Isle)
                    setSelectedSlot('19:00');
                  }
                  setStep('date_select');
                }}
              >
                日程と時間を選びに行く <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: DATE & TIME SLOT SELECTION (With India Rules & Excuses)         */}
        {/* ========================================================================= */}
        {step === 'date_select' && (
          <section className="schedule-view animate-fade-in">
            <button className="back-action" onClick={() => setStep('mood_select')}>
              <ArrowLeft size={16} /> プランを選び直す
            </button>

            <div className="schedule-layout">
              {/* Left Column: Calendar & India Notice */}
              <div className="calendar-col">
                <div className="calendar-intro">
                  <p className="eyebrow"><Sparkles size={14} /> {calendarIntroInfo.eyebrow}</p>
                  <h2>{calendarIntroInfo.title}</h2>
                  <p className="subtext">
                    {calendarIntroInfo.subtext}
                  </p>
                </div>

                {/* India Travel Notice Banner */}
                <div className="india-notice-banner" onClick={() => setIndiaWarningModal(true)} role="button" tabIndex={0}>
                  <span className="india-notice-icon">✈️</span>
                  <div className="india-notice-copy">
                    <p>11/6〜インド出張のため、<strong>11/5まで遊べます</strong> 🇮🇳</p>
                  </div>
                  <HelpCircle size={15} className="info-icon" />
                </div>

                {/* The Friendly Hangout Calendar with Japanese Locale */}
                <div className="calendar-card friendly-calendar-card">
                  <Calendar
                    mode="single"
                    locale={ja}
                    selected={selectedDate}
                    defaultMonth={selectedDate || tomorrow}
                    modifiers={{
                      hasEvent: eventDateObjects,
                    }}
                    modifiersClassNames={{
                      hasEvent: 'calendar-day-has-event',
                      selected: 'calendar-selected',
                      today: 'calendar-today'
                    }}
                    onSelect={(d) => {
                      if (!d) return;
                      if (isAfter(d, maxAvailableDate)) {
                        setIndiaWarningModal(true);
                        return;
                      }
                      setSelectedDate(d);
                    }}
                    disabled={(date) => {
                      if (isBefore(date, tomorrow)) return true;
                      if (isAfter(date, maxAvailableDate)) return true;
                      return false;
                    }}
                    className="friendly-calendar"
                    classNames={{
                      selected: 'calendar-selected',
                      today: 'calendar-today'
                    }}
                  />
                </div>

                {/* Autumn Events Quick-Pick Bar (Always accessible for all plans) */}
                <div className="autumn-events-quick-bar">
                  <div className="quick-bar-header">
                    <div className="quick-bar-title-wrap">
                      <span className="quick-bar-icon">🎆</span>
                      <h4>10月〜11月の注目花火＆お祭り</h4>
                    </div>
                    <span className="quick-bar-badge">タップで日付ジャンプ 🐾</span>
                  </div>

                  <div className="quick-events-scroll">
                    {autumnEvents.map(ev => {
                      const isEventActive = selectedDate && ev.dates.includes(format(selectedDate, 'yyyy-MM-dd'));
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          className={`quick-event-chip ${isEventActive ? 'is-active' : ''} ${ev.isRecommended ? 'is-recommended' : ''}`}
                          onClick={() => handleJumpToEvent(ev)}
                        >
                          <span className="chip-badge-emoji">{ev.badgeEmoji}</span>
                          <div className="chip-texts">
                            <div className="chip-date-row">
                              <span className="chip-date">{ev.dateDisplay}</span>
                              {ev.isRecommended && (
                                <span className="chip-recommend-pill">⭐ 近くてイチ推し</span>
                              )}
                            </div>
                            <span className="chip-name">{ev.title}</span>
                          </div>
                          {isEventActive && <Check size={13} className="chip-active-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Time Slots & Excuses */}
              <div className="slots-col">
                {selectedDate && daySchedule ? (
                  <div className="slots-card animate-slide-up">
                    <div className="slots-header">
                      <div>
                        <span className="selected-date-badge">
                          {format(selectedDate, 'M月d日 (EEEE)', { locale: ja })}
                        </span>
                        <h3>空き時間</h3>
                      </div>
                      <span className="day-badge-chip">{daySchedule.badge}</span>
                    </div>

                    {/* Event Spotlight Section (Hero Card with Pill Switcher for multiple events) */}
                    {selectedDateEvents.length > 0 && (() => {
                      const safeIndex = activeEventIndex < selectedDateEvents.length ? activeEventIndex : 0;
                      const activeEvent = selectedDateEvents[safeIndex];
                      const isAlreadyPlan = customMoodText.includes(activeEvent.title);

                      return (
                        <div className="selected-date-events-wrapper">
                          {/* If multiple events, show sleek horizontal pill selector */}
                          {selectedDateEvents.length > 1 && (
                            <div className="event-switcher-row">
                              <div className="switcher-header">
                                <span className="switcher-title">
                                  <Sparkles size={12} /> この日のイベント ({selectedDateEvents.length}件)
                                </span>
                                <span className="switcher-hint">タップで切替 🐾</span>
                              </div>
                              <div className="event-pills-list">
                                {selectedDateEvents.map((ev, index) => {
                                  const isPillActive = safeIndex === index;
                                  const shortName = ev.title.includes('・') 
                                    ? ev.title.split('・')[0] 
                                    : ev.title.split(' ')[0].replace(/第\d+回/, '');
                                  return (
                                    <button
                                      key={ev.id}
                                      type="button"
                                      className={`event-pill-tab ${isPillActive ? 'is-active' : ''} ${ev.isRecommended ? 'is-recommended' : ''}`}
                                      onClick={() => setActiveEventIndex(index)}
                                    >
                                      <span className="pill-emoji">{ev.badgeEmoji}</span>
                                      <span className="pill-title">{shortName}</span>
                                      {ev.isRecommended && <span className="pill-crown">⭐推し</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* The Single Focused Spotlight Card */}
                          <div
                            key={activeEvent.id}
                            className={`event-spotlight-card animate-slide-up ${activeEvent.isRecommended ? 'is-recommended-card' : ''}`}
                          >
                            {activeEvent.isRecommended && (
                              <div className="spotlight-recommend-banner">
                                <Sparkles size={13} className="banner-sparkle" />
                                <span>⭐ イチ推し！お互いの家からすぐ近く 🏠✨</span>
                              </div>
                            )}

                            <div className="spotlight-top">
                              <span className="spotlight-category-chip">
                                <Sparkles size={12} /> {activeEvent.categoryLabel} {activeEvent.badgeEmoji}
                              </span>
                              {activeEvent.highlightTag && (
                                <span className="spotlight-highlight-tag">{activeEvent.highlightTag}</span>
                              )}
                            </div>

                            <h4 className="spotlight-title">{activeEvent.title}</h4>

                            <div className="spotlight-meta-row">
                              <div className="spotlight-meta-item">
                                <MapPin size={12} className="meta-icon" />
                                <span>{activeEvent.location}</span>
                              </div>
                              <div className="spotlight-meta-item">
                                <Clock size={12} className="meta-icon" />
                                <span>{activeEvent.timeInfo}</span>
                              </div>
                            </div>

                            <p className="spotlight-desc">{activeEvent.shortDesc}</p>

                            {isFireworksPlan ? (
                              <button
                                type="button"
                                className={`spotlight-plan-btn ${isAlreadyPlan ? 'is-selected-plan' : ''}`}
                                onClick={() => handleApplyEventToPlan(activeEvent)}
                              >
                                {isAlreadyPlan ? (
                                  <>
                                    <Check size={14} /> このイベントに行く！✨
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} /> {activeEvent.category === 'fireworks' ? 'この花火プランにする ✨' : 'このイベントプランにする ✨'}
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="spotlight-dual-actions">
                                <button
                                  type="button"
                                  className={`spotlight-plan-btn spotlight-combo-btn ${isAlreadyPlan ? 'is-selected-plan' : ''}`}
                                  onClick={() => handleApplyComboToPlan(activeEvent)}
                                >
                                  <Sparkles size={13} /> {selectedMoodId === 'golf' ? `ゴルフ ＆ ${activeEvent.badgeEmoji}を両方楽しむ！🏌️‍♀️` : `ご飯 ＆ ${activeEvent.badgeEmoji}を両方楽しむ！🍽️`}
                                </button>
                                <button
                                  type="button"
                                  className="spotlight-switch-btn"
                                  onClick={() => handleApplyEventToPlan(activeEvent)}
                                >
                                  {activeEvent.category === 'fireworks' ? '花火プランに変更する 🎆' : 'イベントプランに変更する ✨'}
                                </button>
                              </div>
                            )}

                            {/* Pager if multiple events */}
                            {selectedDateEvents.length > 1 && (
                              <div className="spotlight-pager">
                                <button
                                  type="button"
                                  className="pager-btn"
                                  disabled={safeIndex === 0}
                                  onClick={() => setActiveEventIndex(prev => Math.max(0, prev - 1))}
                                  aria-label="前のイベント"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <div className="pager-dots">
                                  {selectedDateEvents.map((_, i) => (
                                    <span
                                      key={i}
                                      className={`pager-dot ${safeIndex === i ? 'is-active' : ''}`}
                                      onClick={() => setActiveEventIndex(i)}
                                    />
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className="pager-btn"
                                  disabled={safeIndex === selectedDateEvents.length - 1}
                                  onClick={() => setActiveEventIndex(prev => Math.min(selectedDateEvents.length - 1, prev + 1))}
                                  aria-label="次のイベント"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Applied Event Toast Message */}
                    {appliedEventToast && (
                      <div className="applied-event-toast animate-bounce-short">
                        <span>🐾</span>
                        <p>{appliedEventToast}</p>
                      </div>
                    )}

                    <p className="schedule-rule-note">{daySchedule.description}</p>

                    {/* Time Slot Chips */}
                    <div className="time-slots-grid">
                      {daySchedule.slots.map(slot => {
                        const isSlotSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`slot-chip ${isSlotSelected ? 'is-active' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <Clock size={14} />
                            <span>{slot}</span>
                            {isSlotSelected && <Check size={14} className="slot-check" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Cute Daytime Excuse Button / Accordion */}
                    <div className="excuses-section">
                      <button
                        type="button"
                        className="toggle-excuse-btn"
                        onClick={() => setShowExcuseDrawer(!showExcuseDrawer)}
                      >
                        <span>🐾 アドワイトのスケジュール事情をのぞく</span>
                        <span>{showExcuseDrawer ? '▲ 閉じる' : '▼ のぞいてみる'}</span>
                      </button>

                      {showExcuseDrawer && (
                        <div className="excuse-box animate-fade-in">
                          <p className="excuse-quote">{daySchedule.excuse}</p>
                          <hr className="excuse-divider" />
                          <p className="excuse-random">
                            <strong>🐾 猫のウラ情報：</strong> {generalExcuses[selectedDate.getDate() % generalExcuses.length]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Selected Summary & Confirm Button */}
                    <div className="booking-summary-bar">
                      <div className="summary-left">
                        <span className="summary-label">選択中のプラン & 日時</span>
                        <p className="summary-val">
                          <strong>{currentMoodTitle}</strong> · {format(selectedDate, 'M月d日(E)', { locale: ja })} @ {selectedSlot}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="primary-action confirm-btn"
                        disabled={!selectedSlot || isNotifying}
                        onClick={handleConfirmHangout}
                      >
                        {isNotifying ? (
                          <span>アドワイトに連絡中… 🐾</span>
                        ) : (
                          <>
                            アドワイトと約束を確定する <Heart size={16} fill="currentColor" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="slots-empty-card">
                    <div className="slots-empty-icon">📅</div>
                    <h3>日付を選んでね</h3>
                    <p>
                      カレンダーから気になる日をタップすると、その日の予定やアドワイトの空き時間がここに表示されるよ！✨
                    </p>
                    {isFireworksPlan && (
                      <div className="slots-empty-hint">
                        <span>💡 10月〜11月の花火やお祭りの日には <span className="empty-hint-dot">●</span> マークが付いているよ！</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* India Warning Modal */}
            {indiaWarningModal && (
              <div className="modal-backdrop" onClick={() => setIndiaWarningModal(false)}>
                <div className="modal-dialog animate-scale-up" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setIndiaWarningModal(false)} aria-label="閉じる">
                    <X size={18} />
                  </button>
                  <div className="modal-header">
                    <span className="modal-plane">✈️ 🇮🇳</span>
                    <h3>アドワイトはインド出張中！</h3>
                  </div>
                  <div className="modal-body">
                    <p className="modal-intro">
                      淳子、ごめんなさい！<strong>11月6日</strong>からはインドへ出張するため、遊べるのは<strong>11月5日</strong>までとなります！淳子にお土産を買ってくる特別ミッションがあります 🎁🇮🇳
                    </p>
                    <div className="modal-cat-note">
                      <span>🐾</span>
                      <p>「猫審議会により、アドワイトが出発する11月5日までのすべての日程をキープしています！11月5日までの都合のいい日を選んでね🐾」</p>
                    </div>
                  </div>
                  <button type="button" className="primary-action modal-action" onClick={() => setIndiaWarningModal(false)}>
                    了解！11月5日までにします 🐾
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* STAGE 6: CONFIRMED OFFICIAL INVITATION TICKET                           */}
        {/* ========================================================================= */}
        {step === 'confirmed' && (
          <section className="confirmed-view animate-fade-in">
            <div className="confetti" aria-hidden="true">
              {confetti.map(piece => (
                <i key={piece.id} style={{ left: piece.left, animationDelay: piece.delay, background: piece.color }} />
              ))}
            </div>

            <div className="confirmed-layout">
              <div className="confirmed-cat-side">
                <Image src="/black-date-cat.png" alt="Celebrating Cat" width={420} height={530} className="celebrating-cat-img" priority />
                <div className="happy-bubble animate-bounce-short">
                  <span>🎉</span>
                  <p>約束成立！アドワイトも大喜びするよ！</p>
                </div>
              </div>

              <article className="official-ticket-card">
                <div className="ticket-top">
                  <div className="ticket-badge">
                    <Sparkles size={14} /> おでかけの約束 確定！ ✨
                  </div>
                  <span className="ticket-ref">NO. ADWAIT-JUNKO-001</span>
                </div>

                <div className="ticket-title-block">
                  <h2>約束成立、<em>淳子！</em> 🎉</h2>
                  <p className="ticket-sub">アドワイト専属の猫アシスタントが、しっかりお約束を受け付けました🐾</p>
                </div>

                <div className="ticket-info-grid">
                  <div className="info-cell">
                    <span className="cell-label">特別ゲスト</span>
                    <strong className="cell-val">淳子 ✨</strong>
                  </div>

                  <div className="info-cell">
                    <span className="cell-label">ホスト</span>
                    <strong className="cell-val">アドワイト 🙋‍♂️</strong>
                  </div>

                  <div className="info-cell">
                    <span className="cell-label">日時</span>
                    <strong className="cell-val">
                      {selectedDate ? format(selectedDate, 'yyyy年 M月d日 (EEEE)', { locale: ja }) : 'お楽しみに'} @ {selectedSlot}
                    </strong>
                  </div>

                  <div className="info-cell">
                    <span className="cell-label">おでかけプラン</span>
                    <strong className="cell-val">{currentMoodTitle}</strong>
                  </div>
                </div>

                <div className="ticket-seal-box">
                  <span className="seal-paw">🐾</span>
                  <div>
                    <strong>猫印鑑の認定保証</strong>
                    <p>100%楽しい時間、笑顔、おいしいご飯、心地よい最高のひとときをお約束します。</p>
                  </div>
                </div>

                <div className="ticket-india-reminder">
                  <Gift size={16} className="gift-icon" />
                  <p>P.S. アドワイトは11月6日からインドに行って、特別なお土産を探してきます！🎁🇮🇳</p>
                </div>

                {/* Direct Delivery Confirmation & Casual Note Box */}
                <div className="direct-delivery-card">
                  <div className="direct-delivery-badge">
                    <Check size={16} className="direct-check-icon" />
                    <span>アドワイトへ直接連絡しました！</span>
                  </div>
                  <div className="direct-message-box">
                    <span className="direct-message-label">送信されたメッセージ：</span>
                    <p className="direct-message-quote">“{shareText}”</p>
                  </div>
                </div>

                {/* Action Buttons: Replay */}
                <div className="ticket-actions">
                  <button
                    type="button"
                    className="button-reset replay-btn"
                    onClick={() => {
                      setStep('delivery');
                      setDeliveryDropped(false);
                      setNoHovered(false);
                      setNoAttempts(0);
                    }}
                  >
                    <RotateCcw size={14} /> 最初からやり直す 🐾
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}
      </div>

      <footer>
        <span>Created with joy & friendship · 淳子 & アドワイト · 2026</span>
      </footer>
    </main>
  );
}
