'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { format, addDays, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
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

const moodOptions: MoodOption[] = [
  {
    id: 'golf',
    icon: '⛳️',
    title: 'ゴルフの打ちっぱなし',
    detail: '一緒にスイング練習！どっちが遠くに飛ばせるか勝負🏌️‍♀️',
    compliment: '⛳️ ゴルフ練習、いいね！アドワイトも密かにスイングを練習してるみたいだけど、きっとじゅんこの方がフォームが綺麗だにゃ！楽しく打ってリフレッシュしよう！'
  },
  {
    id: 'dinner',
    icon: '🍽️',
    title: 'おいしい夜ご飯 ＆ カフェ',
    detail: '落ち着くお店で美味しいご飯を食べて、のんびりおしゃべり✨',
    compliment: '🍽️ 美味しいご飯、最高だにゃ！温かい空間でたくさんおしゃべりして、美味しいスイーツまで楽しもうね🍰'
  },
  {
    id: 'cafe',
    icon: '☕️',
    title: 'カフェでお茶 ＆ スイーツ巡り',
    detail: 'ゆったりカフェでコーヒーや紅茶、甘いスイーツでほっこり',
    compliment: '☕️ まったりカフェタイム、素敵なチョイス！美味しいケーキと香りのいい紅茶で、ゆったり癒されよう〜🐾'
  },
  {
    id: 'other',
    icon: '✨',
    title: 'じゅんこのおすすめプラン（自由入力）',
    detail: '行きたい場所ややってみたいことがあれば教えてね！',
    compliment: (customText: string) =>
      `🌟 「${customText || 'じゅんこの特別プラン'}」！それすごく楽しそうだにゃ！じゅんこのセンスは最高！アドワイトもきっと大喜びするよ🐾`
  }
];

const generalExcuses = [
  '🐾 猫審議会からの報告：アドワイトはお仕事中ですが、じゅんこと遊ぶ日を楽しみにして指折り数えています！',
  '🐾 最高のお出かけにするために、美味しいお店やスイーツを一生懸命リサーチ中です！',
  '🐾 お出かけ当日に向けて、猫からの指令でしっかりエネルギーチャージしています🐾',
  '🐾 じゅんこに笑顔になってもらえるよう、面白いお話を準備しているみたいです😸',
  '🐾 猫の特別パトロール：アドワイトはお仕事中もじゅんことの約束を楽しみにしてワクワクしています！'
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
  const [showExcuseDrawer, setShowExcuseDrawer] = useState<boolean>(false);
  const [indiaWarningModal, setIndiaWarningModal] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [notifySent, setNotifySent] = useState<boolean>(false);

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
        description: '日曜日は一日中フリー！お昼のカフェやお散歩、夜ご飯まで何時でも合わせられます！',
        slots: ['11:30', '13:30', '15:30', '17:30', '19:00', '20:30'],
        excuse: '日曜日はミーティングが全くありません！じゅんこの都合の良い時間にいつでも合わせられます！'
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
        '🐾 猫パンチ発動！じゅんこ、アドワイトに「いいえ」は言えません！🥺',
        '🐾 猫の法律によりアクセス拒否！光る「もちろん、行こう！」を押してね✨',
        '🐾 ぷいっ！猫がボタンをガードしています。アドワイトをがっかりさせないで〜！😸',
        '🐾 猫の肉球スタンプで拒否！「はい」を押すのが唯一のルールです🥰',
        '🐾 猫の特別布告：「いいえ」を押すことは法律で禁じられていますにゃ🐾'
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
      return customMoodText.trim() ? customMoodText : 'じゅんこのおすすめプラン';
    }
    return moodOptions.find(m => m.id === selectedMoodId)?.title ?? 'ゴルフの打ちっぱなし';
  }, [selectedMoodId, customMoodText]);

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
      guest: 'Junko',
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

  const handleCopyMessage = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedToast(true);
      window.setTimeout(() => setCopiedToast(false), 3000);
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

        <span className="top-note">じゅんこへ、小さなお手紙</span>
      </nav>

      <div className="main-content-window">
        {/* ========================================================================= */}
        {/* STAGE 1: LETTER DELIVERY (Cat walks in, drops letter, says Open it)     */}
        {/* ========================================================================= */}
        {step === 'delivery' && (
          <section className="delivery-view animate-fade-in">
            <div className="delivery-hero-text">
              <p className="eyebrow"><Sparkles size={14} /> 特別なお届けもの</p>
              <h1>じゅんこへ、<br />大切なお手紙。</h1>
              <p className="delivery-sub">
                アドワイト専属のかわいい黒猫が、<br />
                大切なお手紙を届けにやってきました。
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
                      <p>お手紙届いたにゃ！タップして開けてね 💌</p>
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
                    <p className="parchment-title">じゅんこへ</p>
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
                    <span className="live-dot" /> じゅんこBot 🐾
                  </div>
                </div>

                <div className="chat-stream">
                  <div className="chat-bubble bot-msg animate-bubble-1">
                    <span className="bubble-icon">🐾</span>
                    <div className="bubble-content">
                      <p className="bubble-greeting">じゅんこバースへようこそ！✨</p>
                      <p>アドワイト専属の公式黒猫アシスタント（兼・仲良し特使 🐾）ですにゃ。</p>
                    </div>
                  </div>

                  <div className="chat-bubble bot-msg animate-bubble-2">
                    <span className="bubble-icon">💌</span>
                    <div className="bubble-content">
                      <p>じゅんこに、どうしても聞きたい大切な質問があります…！</p>
                      <p className="highlight-question">「今度、アドワイトと一緒に遊びに行かない？🥺」</p>
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
              <p className="mood-sub">じゅんこの気分に合わせて、好きなプランを教えてね！</p>
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
                          placeholder="例：ピクニック、抹茶カフェ、水族館など…"
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
                onClick={() => setStep('date_select')}
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
                  <p className="eyebrow"><Sparkles size={14} /> STEP 03 / 日程選び</p>
                  <h2>都合のいい日を<br />教えてね。</h2>
                  <p className="subtext">
                    明日から<strong>11月5日</strong>までの間で、空いてる日を選んでね！
                  </p>
                </div>

                {/* India Travel Notice Banner */}
                <div className="india-notice-banner" onClick={() => setIndiaWarningModal(true)} role="button" tabIndex={0}>
                  <div className="india-notice-icon">✈️</div>
                  <div className="india-notice-copy">
                    <strong>11月6日以降について：</strong>
                    <p>アドワイトはインド出張のため、遊べるのは11月5日までとなります 🎁🇮🇳</p>
                  </div>
                  <HelpCircle size={17} className="info-icon" />
                </div>

                {/* The Friendly Hangout Calendar with Japanese Locale */}
                <div className="calendar-card friendly-calendar-card">
                  <Calendar
                    mode="single"
                    locale={ja}
                    selected={selectedDate}
                    defaultMonth={selectedDate || tomorrow}
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
              </div>

              {/* Right Column: Time Slots & Excuses */}
              <div className="slots-col">
                {selectedDate && daySchedule ? (
                  <div className="slots-card animate-slide-up">
                    <div className="slots-header">
                      <div>
                        <span className="selected-date-badge">
                          {format(selectedDate, 'yyyy年 M月d日 (EEEE)', { locale: ja })}
                        </span>
                        <h3>アドワイトの空き時間</h3>
                      </div>
                      <span className="day-badge-chip">{daySchedule.badge}</span>
                    </div>

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
                    <p>カレンダーから日付を選んで、空き時間を確認してね！</p>
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
                      じゅんこ、ごめんなさい！<strong>11月6日</strong>からはインドへ出張するため、遊べるのは<strong>11月5日</strong>までとなります！じゅんこにお土産を買ってくる特別ミッションがあります 🎁🇮🇳
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
                  <p>約束成立にゃ！アドワイトも大喜びするよ！</p>
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
                  <h2>約束成立、<em>じゅんこ！</em> 🎉</h2>
                  <p className="ticket-sub">アドワイト専属の猫アシスタントが、しっかりお約束を受け付けました🐾</p>
                </div>

                <div className="ticket-info-grid">
                  <div className="info-cell">
                    <span className="cell-label">特別ゲスト</span>
                    <strong className="cell-val">じゅんこ ✨</strong>
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

                {/* Action Buttons: Copy Message & Replay */}
                <div className="ticket-actions">
                  <button
                    type="button"
                    className="primary-action copy-action-btn"
                    onClick={handleCopyMessage}
                  >
                    {copiedToast ? <Check size={16} /> : <Copy size={16} />}
                    {copiedToast ? 'コピーしました！ 🙂' : 'メッセージをコピー 🙂'}
                  </button>

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
        <span>Created with joy & friendship · Junko & Adwait · 2026</span>
      </footer>
    </main>
  );
}
