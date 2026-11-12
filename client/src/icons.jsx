/**
 * Icons: lucide outlines, 2px stroke, the colour of the text they sit in (Design Guide Part Q).
 * Screens ask for an icon by what it means here ("receive", "custody"), so the drawing can
 * change in one place.
 */

import {
  AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowLeftRight, BarChart3, Building2, Camera, Check, ChevronRight,
  ClipboardList, Clock, Download, FileText, Filter, HelpCircle, Home, Inbox, Info, LayoutGrid, LogOut, Minus,
  MoreHorizontal, Package, Pencil, Plus, ScanLine, Search, Settings, ShieldCheck, Shirt, ShoppingCart, Smartphone,
  Sparkles, Trash2, Truck, X, FlaskConical, Snowflake,
} from 'lucide-react';

const ICONS = {
  today: Home, stock: Package, use: ArrowDownToLine, scan: ScanLine, phone: Smartphone, custody: ShieldCheck,
  linen: Shirt, requests: Inbox, receive: Truck, transfer: ArrowLeftRight, purchasing: ShoppingCart,
  counts: ClipboardList, corrections: Pencil, reports: BarChart3, admin: Settings, help: HelpCircle,
  search: Search, plus: Plus, minus: Minus, close: X, chevron: ChevronRight, back: ArrowLeft, check: Check,
  alert: AlertTriangle, clock: Clock, logout: LogOut, more: MoreHorizontal, download: Download, trash: Trash2,
  unit: Building2, filter: Filter, edit: Pencil, sparkle: Sparkles, apps: LayoutGrid, camera: Camera,
  file: FileText, info: Info, lab: FlaskConical, cold: Snowflake,
};

export default function Icon({ name, size = 20, className = '', label }) {
  const Drawn = ICONS[name] || Package;
  return (
    <Drawn className={`icon ${className}`} size={size} role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : true} />
  );
}
