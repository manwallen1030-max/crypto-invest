'use client';

// Drop-in replacement for the old Font Awesome `<i className="fas fa-…">`
// glyphs. Every page in the dashboard still passes the same class strings
// (they also come from shared config such as paymentMethods.js), but they are
// now drawn as crisp Lucide SVG icons that inherit colour and size from the
// `style` prop exactly like the old font glyphs did.

import { createElement } from 'react';
import {
  LayoutGrid, TrendingUp, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine,
  Users, IdCard, Headset, Settings, Wallet, Trophy, Receipt, Plus, Check,
  CircleCheck, CircleX, CircleMinus, CircleAlert, CircleHelp, Info, Clock,
  History, Copy, Send, Upload, CloudUpload, Trash2, Camera, Coins, Sprout,
  LogOut, ChevronDown, ChevronRight, X, Menu, Bell, BellOff, ArrowRight,
  ArrowLeft, ArrowUp, ArrowDown, User, UserPlus, ShieldCheck, SlidersHorizontal,
  Banknote, FileText, FileCheck, FileSignature, Briefcase, Target, RotateCw,
  RotateCcw, Loader2, Bitcoin, DollarSign, Landmark, CreditCard, Building2,
  Mail, Gem, House, Workflow, Scale, TriangleAlert, ScanSearch, CircleDollarSign,
  BadgeCheck, Circle, Eye, EyeOff, Newspaper, Zap, Flame, Search, ExternalLink,
} from 'lucide-react';

const MAP = {
  'grid-2': LayoutGrid,
  'chart-line': TrendingUp,
  'arrow-right-arrow-left': ArrowLeftRight,
  'circle-arrow-down': ArrowDownToLine,
  'circle-arrow-up': ArrowUpFromLine,
  users: Users,
  'id-card': IdCard,
  'id-badge': BadgeCheck,
  headset: Headset,
  gear: Settings,
  wallet: Wallet,
  trophy: Trophy,
  receipt: Receipt,
  plus: Plus,
  'circle-plus': Plus,
  check: Check,
  'circle-check': CircleCheck,
  'circle-xmark': CircleX,
  'circle-minus': CircleMinus,
  'circle-exclamation': CircleAlert,
  'circle-question': CircleHelp,
  'circle-info': Info,
  clock: Clock,
  'clock-rotate-left': History,
  copy: Copy,
  'paper-plane': Send,
  upload: Upload,
  'cloud-arrow-up': CloudUpload,
  trash: Trash2,
  camera: Camera,
  coins: Coins,
  seedling: Sprout,
  'right-from-bracket': LogOut,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  xmark: X,
  bars: Menu,
  bell: Bell,
  'bell-slash': BellOff,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  user: User,
  'user-plus': UserPlus,
  'user-shield': ShieldCheck,
  'shield-halved': ShieldCheck,
  sliders: SlidersHorizontal,
  'sack-dollar': Banknote,
  'file-pdf': FileText,
  'file-check': FileCheck,
  'file-contract': FileSignature,
  'file-lines': FileText,
  briefcase: Briefcase,
  bullseye: Target,
  rotate: RotateCw,
  'rotate-left': RotateCcw,
  spinner: Loader2,
  bitcoin: Bitcoin,
  ethereum: CircleDollarSign,
  'dollar-sign': DollarSign,
  'building-columns': Landmark,
  'credit-card': CreditCard,
  building: Building2,
  envelope: Mail,
  gem: Gem,
  house: House,
  'diagram-project': Workflow,
  'scale-balanced': Scale,
  'triangle-exclamation': TriangleAlert,
  'magnifying-glass-dollar': ScanSearch,
  eye: Eye,
  'eye-slash': EyeOff,
  newspaper: Newspaper,
  bolt: Zap,
  fire: Flame,
  search: Search,
  'external-link': ExternalLink,
};

export function resolveIcon(className = '') {
  const token = String(className)
    .split(/\s+/)
    .find((t) => t.startsWith('fa-') && t !== 'fa-spin' && t !== 'fa-fw');
  return MAP[token ? token.slice(3) : ''] || Circle;
}

export default function FaIcon({ className = '', style = {}, size, strokeWidth = 2, ...rest }) {
  const Cmp = resolveIcon(className);
  const spin = /\bfa-spin\b/.test(className);
  const { fontSize, color, width, textAlign, ...restStyle } = style || {};
  // Font glyphs were sized with fontSize; Lucide wants a pixel size.
  const px = size ?? (typeof fontSize === 'number' ? Math.round(fontSize * 1.08) : 16);
  void width; void textAlign;
  return createElement(Cmp, {
    size: px,
    strokeWidth,
    color,
    'aria-hidden': 'true',
    className: spin ? 'dash-spin' : undefined,
    style: { flexShrink: 0, ...restStyle },
    ...rest,
  });
}
