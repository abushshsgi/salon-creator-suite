import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Scissors,
  Clock,
  Globe2,
  ImageIcon,
  Plus,
  Trash2,
  Check,
  Loader2,
  UploadCloud,
  X,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Languages,
  CalendarDays,
  Sparkles,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Types
   ============================================================ */

type Service = {
  id: string;
  name: string;
  price: string;
  duration: string;
};

type DaySchedule = {
  day: string;
  open: boolean;
  from: string;
  to: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LABELS: Record<string, string> = {
  Mon: "Dushanba",
  Tue: "Seshanba",
  Wed: "Chorshanba",
  Thu: "Payshanba",
  Fri: "Juma",
  Sat: "Shanba",
  Sun: "Yakshanba",
};

const LANGUAGES = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
];

/* ============================================================
   Step metadata
   ============================================================ */

const STEP_META = [
  {
    group: "Salon",
    short: "Asosiy",
    title: "Salon haqida ma'lumot",
    subtitle: "Salon nomi va aloqa raqami — mijozlar sizni shu nom bilan topadi.",
    icon: Store,
  },
  {
    group: "Salon",
    short: "Lokatsiya",
    title: "Salon manzili",
    subtitle: "Mijozlar sizning saloningizga oson topib kelishi uchun manzil.",
    icon: MapPin,
  },
  {
    group: "Salon",
    short: "Cover",
    title: "Salon rasmi",
    subtitle: "Bosh sahifada ko'rinadigan chiroyli cover rasm yuklang.",
    icon: ImageIcon,
  },
  {
    group: "Barber",
    short: "Profil",
    title: "Barber profili",
    subtitle: "Endi o'zingiz haqingizda — ism, familiya, telefon va rasm.",
    icon: User,
  },
  {
    group: "Barber",
    short: "Xizmatlar",
    title: "Sizning xizmatlaringiz",
    subtitle: "Mijozlar buyurtma berishi mumkin bo'lgan xizmatlar ro'yxati.",
    icon: Scissors,
  },
  {
    group: "Barber",
    short: "Jadval",
    title: "Ish jadvali",
    subtitle: "Qaysi kunlari ishlaysiz va dam olasiz — vaqtlarni belgilang.",
    icon: CalendarDays,
  },
  {
    group: "Barber",
    short: "Tillar",
    title: "Muloqot tillari",
    subtitle: "Mijozlar bilan qaysi tillarda gaplasha olasiz?",
    icon: Languages,
  },
] as const;

const TOTAL_STEPS = STEP_META.length;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ============================================================
   Phone helpers — +998 fixed prefix, format: 99 123-45-67
   ============================================================ */

// Keep only digits, max 9 digits after +998 (UZ numbers)
function normalizePhoneDigits(input: string) {
  return input.replace(/\D/g, "").slice(0, 9);
}

function formatPhone(digits: string) {
  // Format as: 99 123-45-67
  const d = digits;
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

/* ============================================================
   Page
   ============================================================ */

export function CreateSalonPage() {
  // --- Salon state ---
  const [salonName, setSalonName] = useState("");
  const [salonDescription, setSalonDescription] = useState("");
  const [salonPhoneDigits, setSalonPhoneDigits] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonLandmark, setSalonLandmark] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [coverDrag, setCoverDrag] = useState(false);

  // --- Barber (owner) profile state ---
  const [barberFirstName, setBarberFirstName] = useState("");
  const [barberLastName, setBarberLastName] = useState("");
  const [barberPhoneDigits, setBarberPhoneDigits] = useState("");
  const [barberAvatar, setBarberAvatar] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([
    { id: uid(), name: "", price: "", duration: "" },
  ]);

  const [schedule, setSchedule] = useState<DaySchedule[]>(
    WEEKDAYS.map((d, i) => ({
      day: d,
      open: i < 6,
      from: "09:00",
      to: "20:00",
    })),
  );

  const [languages, setLanguages] = useState<string[]>(["uz"]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- Multi-step wizard ---
  // 0..2 = Salon group (Info, Location, Cover)
  // 3..6 = Barber group (Profile, Services, Schedule, Languages)
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const stepValid = useMemo(() => {
    return [
      // 0: Salon Info
      salonName.trim().length > 1 && salonPhoneDigits.length === 9,
      // 1: Location
      salonCity.trim().length > 1 && salonAddress.trim().length > 2,
      // 2: Cover (optional)
      true,
      // 3: Barber profile
      barberFirstName.trim().length > 1 &&
        barberLastName.trim().length > 1 &&
        barberPhoneDigits.length === 9,
      // 4: Services
      services.every((s) => s.name && s.price && s.duration),
      // 5: Schedule
      schedule.some((d) => d.open),
      // 6: Languages
      languages.length > 0,
    ];
  }, [
    salonName,
    salonPhoneDigits,
    salonCity,
    salonAddress,
    barberFirstName,
    barberLastName,
    barberPhoneDigits,
    services,
    schedule,
    languages,
  ]);

  const isLast = step === TOTAL_STEPS - 1;
  const canNext = stepValid[step];
  const allValid = stepValid.every(Boolean);

  const goNext = () => {
    if (!canNext || isLast) return;
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const updateService = (id: string, key: keyof Service, value: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  const addService = () =>
    setServices((prev) => [...prev, { id: uid(), name: "", price: "", duration: "" }]);

  const removeService = (id: string) =>
    setServices((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

  const toggleLanguage = (code: string) =>
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );

  const handleCoverFile = (files: FileList | null) => {
    if (!files || !files[0]) return;
    if (!files[0].type.startsWith("image/")) return;
    setCover(URL.createObjectURL(files[0]));
  };

  const handleAvatarFile = (files: FileList | null) => {
    if (!files || !files[0]) return;
    if (!files[0].type.startsWith("image/")) return;
    setBarberAvatar(URL.createObjectURL(files[0]));
  };

  const handleSubmit = async () => {
    if (!allValid || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2400);
  };

  const currentMeta = STEP_META[step];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Scissors className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Barber Studio</span>
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            <span className="text-foreground">{step + 1}</span>
            <span className="opacity-50"> / {TOTAL_STEPS}</span>
          </span>
        </div>
        <StepIndicator step={step} stepValid={stepValid} onJump={(i) => {
          // Allow jumping back freely; jumping forward only if all preceding steps are valid
          if (i === step) return;
          if (i < step) {
            setDirection(-1);
            setStep(i);
          } else {
            const canReach = stepValid.slice(0, i).every(Boolean);
            if (!canReach) return;
            setDirection(1);
            setStep(i);
          }
        }} />
      </header>

      <main className="mx-auto max-w-[920px] px-5 pt-10 sm:px-6 sm:pt-14">
        {/* Animated hero — changes per step */}
        <div className="mb-8 overflow-hidden text-center sm:mb-10">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`hero-${step}`}
              custom={direction}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                  <currentMeta.icon className="h-2.5 w-2.5" />
                </span>
                {currentMeta.group} · Qadam {step + 1}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {currentMeta.title}
              </h1>
              <p className="mx-auto mt-3 max-w-[520px] text-sm text-muted-foreground sm:text-base">
                {currentMeta.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5 sm:space-y-6"
          >
            {step === 0 && (
              <SalonInfoStep
                salonName={salonName}
                setSalonName={setSalonName}
                salonDescription={salonDescription}
                setSalonDescription={setSalonDescription}
                salonPhoneDigits={salonPhoneDigits}
                setSalonPhoneDigits={setSalonPhoneDigits}
              />
            )}
            {step === 1 && (
              <SalonLocationStep
                salonCity={salonCity}
                setSalonCity={setSalonCity}
                salonLandmark={salonLandmark}
                setSalonLandmark={setSalonLandmark}
                salonAddress={salonAddress}
                setSalonAddress={setSalonAddress}
              />
            )}
            {step === 2 && (
              <SalonCoverStep
                cover={cover}
                setCover={setCover}
                coverDrag={coverDrag}
                setCoverDrag={setCoverDrag}
                handleCoverFile={handleCoverFile}
              />
            )}
            {step === 3 && (
              <BarberProfileStep
                firstName={barberFirstName}
                setFirstName={setBarberFirstName}
                lastName={barberLastName}
                setLastName={setBarberLastName}
                phoneDigits={barberPhoneDigits}
                setPhoneDigits={setBarberPhoneDigits}
                avatar={barberAvatar}
                handleAvatarFile={handleAvatarFile}
              />
            )}
            {step === 4 && (
              <BarberServicesStep
                services={services}
                addService={addService}
                removeService={removeService}
                updateService={updateService}
              />
            )}
            {step === 5 && (
              <BarberScheduleStep
                schedule={schedule}
                setSchedule={setSchedule}
              />
            )}
            {step === 6 && (
              <BarberLanguagesStep
                languages={languages}
                toggleLanguage={toggleLanguage}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[920px] items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
          <button
            onClick={goBack}
            disabled={step === 0 || submitting}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-[var(--transition-smooth)]",
              step === 0
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-muted active:scale-[0.98]",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Orqaga</span>
          </button>

          <div className="hidden flex-1 items-center justify-center gap-2 text-xs sm:flex">
            <span className="text-muted-foreground">Hozirgi qadam:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`crumb-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-semibold text-foreground"
              >
                <currentMeta.icon className="h-3 w-3" />
                {currentMeta.short}
              </motion.span>
            </AnimatePresence>
          </div>

          {!isLast ? (
            <button
              onClick={goNext}
              disabled={!canNext}
              className={cn(
                "group inline-flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-[var(--transition-smooth)] sm:min-w-[170px]",
                canNext
                  ? "bg-foreground text-background hover:scale-[1.02] active:scale-[0.98]"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              Keyingisi
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              disabled={!allValid || submitting}
              onClick={handleSubmit}
              className={cn(
                "inline-flex h-11 min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-[var(--transition-smooth)]",
                allValid && !submitting
                  ? "bg-foreground text-background hover:scale-[1.02] active:scale-[0.98]"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Yaratilmoqda…
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4" /> Yaratildi
                </>
              ) : (
                <>Yaratish</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-step 0 — Salon Info
   ============================================================ */

function SalonInfoStep(props: {
  salonName: string;
  setSalonName: (v: string) => void;
  salonDescription: string;
  setSalonDescription: (v: string) => void;
  salonPhoneDigits: string;
  setSalonPhoneDigits: (v: string) => void;
}) {
  return (
    <Section
      icon={<Store className="h-4 w-4" />}
      label="Salon"
      title="Asosiy ma'lumotlar"
      description="Salon nomi va aloqa raqami."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingInput
          label="Salon nomi"
          required
          value={props.salonName}
          onChange={props.setSalonName}
        />
        <PhoneInput
          label="Telefon raqami"
          required
          digits={props.salonPhoneDigits}
          onChange={props.setSalonPhoneDigits}
        />
      </div>
      <FloatingTextarea
        label="Salon haqida qisqacha (ixtiyoriy)"
        value={props.salonDescription}
        onChange={props.setSalonDescription}
      />
    </Section>
  );
}

/* ============================================================
   Sub-step 1 — Salon Location
   ============================================================ */

function SalonLocationStep(props: {
  salonCity: string;
  setSalonCity: (v: string) => void;
  salonLandmark: string;
  setSalonLandmark: (v: string) => void;
  salonAddress: string;
  setSalonAddress: (v: string) => void;
}) {
  return (
    <Section
      icon={<MapPin className="h-4 w-4" />}
      label="Lokatsiya"
      title="Salon manzili"
      description="Mijozlar sizni topa olishi uchun aniq manzil."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingInput
          label="Shahar"
          required
          value={props.salonCity}
          onChange={props.setSalonCity}
        />
        <FloatingInput
          label="Mo'ljal (ixtiyoriy)"
          value={props.salonLandmark}
          onChange={props.setSalonLandmark}
        />
      </div>
      <FloatingInput
        label="Ko'cha, uy raqami"
        required
        value={props.salonAddress}
        onChange={props.setSalonAddress}
      />
      {/* Decorative map preview */}
      <div className="relative mt-1 h-44 overflow-hidden rounded-2xl border border-border bg-muted/40">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-2 animate-ping rounded-full bg-foreground/10" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-pop)]">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <span className="max-w-[260px] truncate text-center text-[11px] font-medium text-muted-foreground">
              {props.salonAddress.trim() || "Manzil ko'rsatilmagan"}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   Sub-step 2 — Salon Cover
   ============================================================ */

function SalonCoverStep(props: {
  cover: string | null;
  setCover: (v: string | null) => void;
  coverDrag: boolean;
  setCoverDrag: (v: boolean) => void;
  handleCoverFile: (f: FileList | null) => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  return (
    <Section
      icon={<ImageIcon className="h-4 w-4" />}
      label="Media"
      title="Cover rasm"
      description="Bosh sahifada chiroyli ko'rinishi uchun (ixtiyoriy)."
    >
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          props.handleCoverFile(e.target.files);
          e.target.value = "";
        }}
      />
      {props.cover ? (
        <div className="group relative h-56 w-full overflow-hidden rounded-2xl border border-border bg-muted sm:h-72">
          <img
            src={props.cover}
            alt="Salon cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
              <Check className="h-3 w-3" /> Yuklandi
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-background/90 px-3 text-[11px] font-semibold text-foreground backdrop-blur transition-[var(--transition-smooth)] hover:bg-background"
              >
                <UploadCloud className="h-3 w-3" /> O'zgartirish
              </button>
              <button
                type="button"
                onClick={() => props.setCover(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur transition-[var(--transition-smooth)] hover:bg-destructive hover:text-destructive-foreground"
                aria-label="O'chirish"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            props.setCoverDrag(true);
          }}
          onDragLeave={() => props.setCoverDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            props.setCoverDrag(false);
            props.handleCoverFile(e.dataTransfer.files);
          }}
          className={cn(
            "group flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/30 transition-[var(--transition-smooth)] sm:h-72",
            props.coverDrag
              ? "border-foreground bg-muted"
              : "border-border hover:border-foreground/40 hover:bg-muted/50",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-[var(--shadow-soft)] transition-transform group-hover:scale-110">
            <UploadCloud className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Cover rasm yuklash
          </span>
          <span className="text-[11px] text-muted-foreground">
            Surib qo'ying yoki bosing · PNG, JPG · 10MB gacha
          </span>
        </button>
      )}
    </Section>
  );
}

/* ============================================================
   Sub-step 3 — Barber profile (personal)
   ============================================================ */

function BarberProfileStep(props: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phoneDigits: string;
  setPhoneDigits: (v: string) => void;
  avatar: string | null;
  handleAvatarFile: (f: FileList | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials =
    (props.firstName.trim()[0] || "") + (props.lastName.trim()[0] || "");

  return (
    <Section
      icon={<User className="h-4 w-4" />}
      label="Shaxsiy"
      title="Barber haqida"
      description="Mijozlar sizni shu ism va rasm bilan ko'radi."
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              props.handleAvatarFile(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted text-2xl font-semibold uppercase text-muted-foreground transition-[var(--transition-smooth)] hover:border-foreground"
          >
            {props.avatar ? (
              <img
                src={props.avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : initials.trim() ? (
              <span className="text-foreground">{initials}</span>
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
            <span className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground py-1 text-[10px] font-medium uppercase tracking-wider text-background transition-transform group-hover:translate-y-0">
              {props.avatar ? "O'zgartirish" : "Rasm yuklash"}
            </span>
          </button>
        </div>
        <div className="grid w-full flex-1 gap-3 sm:grid-cols-2">
          <FloatingInput
            label="Ism"
            required
            value={props.firstName}
            onChange={props.setFirstName}
          />
          <FloatingInput
            label="Familiya"
            required
            value={props.lastName}
            onChange={props.setLastName}
          />
          <div className="sm:col-span-2">
            <PhoneInput
              label="Telefon raqami"
              required
              digits={props.phoneDigits}
              onChange={props.setPhoneDigits}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   Sub-step 4 — Services
   ============================================================ */

function BarberServicesStep(props: {
  services: Service[];
  addService: () => void;
  removeService: (id: string) => void;
  updateService: (id: string, k: keyof Service, v: string) => void;
}) {
  return (
    <Section
      icon={<Scissors className="h-4 w-4" />}
      label="Xizmatlar"
      title="Sizning xizmatlaringiz"
      description="Mijozlar buyurtma berishi mumkin bo'lgan xizmatlar."
    >
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {props.services.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)] hover:border-foreground/30">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Xizmat #{String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => props.removeService(s.id)}
                    disabled={props.services.length === 1}
                    className="rounded-lg p-1.5 text-muted-foreground transition-[var(--transition-smooth)] hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                  <FloatingInput
                    label="Xizmat nomi"
                    value={s.name}
                    onChange={(v) => props.updateService(s.id, "name", v)}
                    compact
                  />
                  <FloatingInput
                    label="Narxi (so'm)"
                    value={s.price}
                    onChange={(v) =>
                      props.updateService(s.id, "price", v.replace(/\D/g, ""))
                    }
                    compact
                  />
                  <FloatingInput
                    label="Davomiyligi (min)"
                    value={s.duration}
                    onChange={(v) =>
                      props.updateService(s.id, "duration", v.replace(/\D/g, ""))
                    }
                    compact
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={props.addService}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-4 text-sm font-semibold text-foreground transition-[var(--transition-smooth)] hover:border-foreground hover:bg-muted/60 active:scale-[0.99]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:rotate-90">
            <Plus className="h-4 w-4" />
          </span>
          Yangi xizmat qo'shish
        </button>
      </div>
    </Section>
  );
}

/* ============================================================
   Sub-step 5 — Schedule
   ============================================================ */

function BarberScheduleStep(props: {
  schedule: DaySchedule[];
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
}) {
  return (
    <Section
      icon={<CalendarDays className="h-4 w-4" />}
      label="Jadval"
      title="Ish kunlari"
      description="Ish kunlarini va dam olish kunlarini belgilang."
    >
      <ScheduleEditor schedule={props.schedule} setSchedule={props.setSchedule} />
    </Section>
  );
}

/* ============================================================
   Sub-step 6 — Languages
   ============================================================ */

function BarberLanguagesStep(props: {
  languages: string[];
  toggleLanguage: (code: string) => void;
}) {
  return (
    <Section
      icon={<Languages className="h-4 w-4" />}
      label="Tillar"
      title="Qaysi tillarda gaplashasiz?"
      description="Kamida bitta tilni tanlang."
    >
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => {
          const active = props.languages.includes(l.code);
          return (
            <button
              key={l.code}
              onClick={() => props.toggleLanguage(l.code)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-[var(--transition-smooth)]",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground/40",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  active
                    ? "border-background bg-background text-foreground"
                    : "border-border",
                )}
              >
                {active && <Check className="h-2.5 w-2.5" />}
              </span>
              {l.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/* ============================================================
   Step indicator (top)
   ============================================================ */

function StepIndicator({
  step,
  stepValid,
  onJump,
}: {
  step: number;
  stepValid: boolean[];
  onJump: (i: number) => void;
}) {
  const total = STEP_META.length;
  const progress = ((step + 1) / total) * 100;
  const currentGroup = STEP_META[step].group;
  const currentShort = STEP_META[step].short;
  const CurrentIcon = STEP_META[step].icon;

  return (
    <div className="mx-auto max-w-[920px] px-5 pb-4 sm:px-6">
      {/* Top row: current step pill (animated) + group counter */}
      <div className="mb-2.5 flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={`pill-${step}`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 shadow-[var(--shadow-soft)]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
              <CurrentIcon className="h-3 w-3" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              {currentShort}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              · {currentGroup}
            </span>
          </motion.div>
        </AnimatePresence>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Step dots */}
      <div className="mt-3 flex items-center justify-between gap-1">
        {STEP_META.map((meta, i) => {
          const Icon = meta.icon;
          const done = i < step;
          const active = i === step;
          const reachable =
            i <= step || stepValid.slice(0, i).every(Boolean);
          // Detect group boundary (between Salon and Barber)
          const isGroupStart =
            i > 0 && STEP_META[i - 1].group !== meta.group;
          return (
            <div key={i} className="flex flex-1 items-center gap-1">
              {isGroupStart && (
                <span className="mx-1 hidden h-3 w-px bg-border sm:block" />
              )}
              <button
                type="button"
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                className={cn(
                  "group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-[var(--transition-smooth)]",
                  done
                    ? "border-foreground bg-foreground text-background"
                    : active
                      ? "border-foreground bg-background text-foreground"
                      : "border-border bg-background text-muted-foreground",
                  reachable && !active
                    ? "cursor-pointer hover:border-foreground"
                    : "",
                  !reachable && "cursor-not-allowed opacity-50",
                )}
                aria-label={`${meta.short} qadami`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {active && (
                  <motion.span
                    layoutId="active-ring"
                    className="absolute -inset-1 rounded-full ring-2 ring-foreground/20"
                    transition={{ duration: 0.3 }}
                  />
                )}
                {/* Tooltip-style label under each dot, only for current */}
                {active && (
                  <span className="pointer-events-none absolute -bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider text-foreground sm:block">
                    {meta.short}
                  </span>
                )}
              </button>
              {i < STEP_META.length - 1 && (
                <div
                  className={cn(
                    "h-[2px] flex-1 rounded-full transition-[var(--transition-smooth)]",
                    i < step ? "bg-foreground" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Spacer for tooltip labels under active dot on desktop */}
      <div className="hidden h-3 sm:block" />
    </div>
  );
}

/* ============================================================
   Section
   ============================================================ */

function Section({
  icon,
  label,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7"
    >
      <div className="mb-5 flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

/* ============================================================
   Inputs
   ============================================================ */

function FloatingInput({
  label,
  value,
  onChange,
  required,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  compact?: boolean;
}) {
  const has = value.length > 0;
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "peer w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-[var(--transition-smooth)] placeholder-transparent focus:border-foreground",
          compact ? "h-12 pt-4 pb-1" : "h-14 pt-5 pb-1.5",
        )}
        placeholder={label}
      />
      <label
        className={cn(
          "pointer-events-none absolute left-3.5 text-muted-foreground transition-[var(--transition-smooth)]",
          has || compact
            ? compact
              ? "top-1.5 text-[10px] uppercase tracking-wider"
              : "top-2 text-[10px] uppercase tracking-wider"
            : "top-1/2 -translate-y-1/2 text-sm",
          "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-foreground",
          compact && "peer-focus:top-1.5",
        )}
      >
        {label}
        {required && <span className="ml-0.5 text-foreground">*</span>}
      </label>
    </div>
  );
}

function FloatingTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const has = value.length > 0;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="peer w-full resize-none rounded-xl border border-border bg-background px-3.5 pb-3 pt-6 text-sm text-foreground outline-none transition-[var(--transition-smooth)] focus:border-foreground"
        placeholder=" "
      />
      <label
        className={cn(
          "pointer-events-none absolute left-3.5 transition-[var(--transition-smooth)]",
          has
            ? "top-2 text-[10px] uppercase tracking-wider text-muted-foreground"
            : "top-4 text-sm text-muted-foreground",
          "peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-foreground",
        )}
      >
        {label}
      </label>
    </div>
  );
}

/* ============================================================
   PhoneInput — fixed +998 prefix, format: 99 123-45-67
   ============================================================ */

function PhoneInput({
  label,
  digits,
  onChange,
  required,
}: {
  label: string;
  digits: string;
  onChange: (digitsOnly: string) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formatted = formatPhone(digits);
  const has = digits.length > 0;
  const valid = digits.length === 9;

  // keep cursor at end on type
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const len = el.value.length;
    if (document.activeElement === el) {
      el.setSelectionRange(len, len);
    }
  }, [formatted]);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-14 w-full items-stretch rounded-xl border border-border bg-background transition-[var(--transition-smooth)] focus-within:border-foreground",
          has && !valid && "border-destructive/60 focus-within:border-destructive",
        )}
      >
        {/* prefix */}
        <div className="flex items-center gap-1.5 border-r border-border px-3.5">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold tabular-nums text-foreground">
            +998
          </span>
        </div>
        {/* input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="tel-national"
            value={formatted}
            onChange={(e) => onChange(normalizePhoneDigits(e.target.value))}
            onKeyDown={(e) => {
              // allow Backspace on formatting chars to delete the previous digit
              if (e.key === "Backspace") {
                const el = e.currentTarget;
                const pos = el.selectionStart ?? formatted.length;
                if (pos === el.selectionEnd) {
                  const prev = formatted.slice(0, pos);
                  const after = formatted.slice(pos);
                  // if char before cursor is non-digit, strip it + previous digit
                  const stripped = (prev.replace(/\D+$/g, "").slice(0, -1) + after).replace(
                    /\D/g,
                    "",
                  );
                  if (prev.length && !/\d/.test(prev[prev.length - 1])) {
                    e.preventDefault();
                    onChange(normalizePhoneDigits(stripped));
                  }
                }
              }
            }}
            placeholder="99 123-45-67"
            className={cn(
              "peer h-full w-full rounded-r-xl bg-transparent px-3.5 text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground/60",
              has ? "pt-5 pb-1.5" : "",
            )}
          />
          <label
            className={cn(
              "pointer-events-none absolute left-3.5 text-muted-foreground transition-[var(--transition-smooth)]",
              has
                ? "top-2 text-[10px] uppercase tracking-wider"
                : "top-1/2 -translate-y-1/2 text-sm",
              "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-foreground",
            )}
          >
            {label}
            {required && <span className="ml-0.5 text-foreground">*</span>}
          </label>
        </div>
        {/* status icon */}
        {valid && (
          <div className="flex items-center pr-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="h-3 w-3" />
            </span>
          </div>
        )}
      </div>
      {has && !valid && (
        <p className="mt-1.5 text-[11px] font-medium text-destructive">
          Telefon raqami 9 ta raqamdan iborat bo'lishi kerak
        </p>
      )}
    </div>
  );
}

/* ============================================================
   Schedule editor — clean grid with per-day open/closed and times
   ============================================================ */

function ScheduleEditor({
  schedule,
  setSchedule,
}: {
  schedule: DaySchedule[];
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
}) {
  const update = (day: string, patch: Partial<DaySchedule>) =>
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));

  const applyAll = (patch: Partial<DaySchedule>) =>
    setSchedule((prev) => prev.map((d) => ({ ...d, ...patch })));

  const openCount = schedule.filter((d) => d.open).length;

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3.5 py-2.5">
        <div className="text-xs">
          <span className="font-semibold text-foreground">{openCount}</span>{" "}
          <span className="text-muted-foreground">
            ish kuni · {7 - openCount} dam olish
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => applyAll({ open: true, from: "09:00", to: "20:00" })}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-[var(--transition-smooth)] hover:border-foreground"
          >
            Hammasi
          </button>
          <button
            onClick={() =>
              setSchedule((prev) =>
                prev.map((d) => ({
                  ...d,
                  open: !["Sat", "Sun"].includes(d.day),
                })),
              )
            }
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-[var(--transition-smooth)] hover:border-foreground"
          >
            Du–Ju
          </button>
          <button
            onClick={() => applyAll({ open: false })}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-[var(--transition-smooth)] hover:border-foreground hover:text-foreground"
          >
            Tozalash
          </button>
        </div>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {schedule.map((d) => (
          <div
            key={d.day}
            className={cn(
              "flex items-center gap-2 rounded-xl border bg-card p-2 transition-[var(--transition-smooth)] sm:gap-3 sm:p-2.5",
              d.open
                ? "border-border"
                : "border-dashed border-border/70 bg-muted/30",
            )}
          >
            {/* Day toggle pill */}
            <button
              onClick={() => update(d.day, { open: !d.open })}
              className={cn(
                "flex h-11 w-[72px] shrink-0 flex-col items-center justify-center rounded-lg text-xs font-semibold transition-[var(--transition-smooth)] sm:w-24",
                d.open
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <span className="text-[11px] sm:text-xs">{d.day}</span>
              <span className="text-[9px] font-normal opacity-70 sm:hidden">
                {WEEKDAY_LABELS[d.day]?.slice(0, 3)}
              </span>
              <span className="hidden text-[9px] font-normal opacity-70 sm:block">
                {WEEKDAY_LABELS[d.day]}
              </span>
            </button>

            {/* Time slots or closed label */}
            {d.open ? (
              <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
                <TimeField
                  value={d.from}
                  onChange={(v) => update(d.day, { from: v })}
                />
                <span className="text-xs text-muted-foreground">—</span>
                <TimeField value={d.to} onChange={(v) => update(d.day, { to: v })} />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center sm:justify-start">
                <span className="text-xs font-medium text-muted-foreground">
                  Dam olish kuni
                </span>
              </div>
            )}

            {/* Apply to all (only on open days) */}
            {d.open && (
              <button
                onClick={() =>
                  setSchedule((prev) =>
                    prev.map((x) =>
                      x.open ? { ...x, from: d.from, to: d.to } : x,
                    ),
                  )
                }
                className="hidden h-9 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground transition-[var(--transition-smooth)] hover:border-foreground hover:text-foreground sm:inline-flex"
                title="Boshqa ish kunlariga ham qo'llash"
              >
                Barchaga
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-1 items-center rounded-lg border border-border bg-background transition-[var(--transition-smooth)] focus-within:border-foreground">
      <Clock className="ml-2.5 h-3 w-3 text-muted-foreground" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full bg-transparent px-2 text-xs font-medium tabular-nums text-foreground outline-none"
      />
    </div>
  );
}

/* ============================================================
   Dropzone
   ============================================================ */

function Dropzone({
  drag,
  setDrag,
  onFiles,
  children,
}: {
  drag: boolean;
  setDrag: (v: boolean) => void;
  onFiles: (files: FileList | null) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group relative block h-44 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30 transition-[var(--transition-smooth)] sm:h-52",
        drag ? "border-foreground bg-muted" : "border-border hover:border-foreground/40",
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {children}
    </label>
  );
}

function DropzoneEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
        <UploadCloud className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] uppercase tracking-wider">PNG, JPG · 10MB gacha</span>
    </div>
  );
}
