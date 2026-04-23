import { useMemo, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
const LANGUAGES = [
  { code: "uz", label: "Uzbek" },
  { code: "ru", label: "Russian" },
  { code: "en", label: "English" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
];

const STEPS = ["Profile", "Location", "Services", "Schedule", "Media"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function CreateSalonPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

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

  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [closedDays, setClosedDays] = useState<string[]>(["Sun"]);

  const [cover, setCover] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [coverDrag, setCoverDrag] = useState(false);
  const [galleryDrag, setGalleryDrag] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 1 &&
      phone.trim().length > 4 &&
      address.trim().length > 2 &&
      services.every((s) => s.name && s.price && s.duration)
    );
  }, [name, phone, address, services]);

  const completedSteps = useMemo(() => {
    const flags = [
      name.trim() && phone.trim() && address.trim(),
      lat && lng,
      services.every((s) => s.name && s.price && s.duration),
      schedule.some((d) => d.open),
      cover || gallery.length > 0,
    ];
    return flags.map(Boolean);
  }, [name, phone, address, lat, lng, services, schedule, cover, gallery]);

  const activeStep = completedSteps.findIndex((c) => !c);
  const currentStep = activeStep === -1 ? STEPS.length - 1 : activeStep;

  const updateService = (id: string, key: keyof Service, value: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  const addService = () =>
    setServices((prev) => [...prev, { id: uid(), name: "", price: "", duration: "" }]);

  const removeService = (id: string) =>
    setServices((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

  const updateSchedule = (day: string, patch: Partial<DaySchedule>) =>
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));

  const toggleLanguage = (code: string) =>
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );

  const toggleClosed = (day: string) =>
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const handleFiles = (files: FileList | null, multiple: boolean) => {
    if (!files) return;
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    if (multiple) setGallery((prev) => [...prev, ...urls]);
    else if (urls[0]) setCover(urls[0]);
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2400);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Scissors className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Barber Studio</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <ProgressBar steps={STEPS} completed={completedSteps} current={currentStep} />
      </header>

      <main className="mx-auto max-w-[900px] px-6 pt-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Create Your Salon
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Set up your salon profile to start accepting clients
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Section: Basic Info */}
          <Section
            icon={<Building2 className="h-4 w-4" />}
            label="01"
            title="Basic Information"
            description="Tell clients who you are."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Salon name"
                required
                value={name}
                onChange={setName}
              />
              <FloatingInput label="Phone number" value={phone} onChange={setPhone} />
            </div>
            <FloatingInput label="Address" value={address} onChange={setAddress} />
            <FloatingTextarea
              label="Description"
              value={description}
              onChange={setDescription}
            />
          </Section>

          {/* Section: Location */}
          <Section
            icon={<MapPin className="h-4 w-4" />}
            label="02"
            title="Location"
            description="Pin your salon on the map."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput label="Latitude" value={lat} onChange={setLat} />
              <FloatingInput label="Longitude" value={lng} onChange={setLng} />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter coordinates to place your salon on map
            </p>
            <div className="relative mt-2 h-44 overflow-hidden rounded-2xl border border-border bg-muted/60">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="relative">
                    <div className="absolute -inset-3 animate-ping rounded-full bg-foreground/10" />
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                  <span className="text-xs">Map preview</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Section: Services */}
          <Section
            icon={<Scissors className="h-4 w-4" />}
            label="03"
            title="Services"
            description="What do you offer?"
          >
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {services.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="group rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)] hover:border-foreground/30">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Service {String(i + 1).padStart(2, "0")}
                        </span>
                        <button
                          onClick={() => removeService(s.id)}
                          disabled={services.length === 1}
                          className="rounded-lg p-1.5 text-muted-foreground transition-[var(--transition-smooth)] hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Remove service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                        <FloatingInput
                          label="Service name"
                          value={s.name}
                          onChange={(v) => updateService(s.id, "name", v)}
                          compact
                        />
                        <FloatingInput
                          label="Price"
                          value={s.price}
                          onChange={(v) => updateService(s.id, "price", v)}
                          compact
                        />
                        <FloatingInput
                          label="Min"
                          value={s.duration}
                          onChange={(v) => updateService(s.id, "duration", v)}
                          compact
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={addService}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-transparent px-4 py-3.5 text-sm font-medium text-muted-foreground transition-[var(--transition-smooth)] hover:border-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Add service
              </button>
            </div>
          </Section>

          {/* Section: Working Hours */}
          <Section
            icon={<Clock className="h-4 w-4" />}
            label="04"
            title="Working Hours"
            description="Set your weekly schedule."
          >
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {schedule.map((d) => (
                <div
                  key={d.day}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={d.open}
                      onChange={(v) => updateSchedule(d.day, { open: v })}
                    />
                    <span
                      className={cn(
                        "w-12 text-sm font-medium",
                        d.open ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {d.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.open ? (
                      <>
                        <TimeInput
                          value={d.from}
                          onChange={(v) => updateSchedule(d.day, { from: v })}
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <TimeInput
                          value={d.to}
                          onChange={(v) => updateSchedule(d.day, { to: v })}
                        />
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Additional */}
          <Section
            icon={<Globe2 className="h-4 w-4" />}
            label="05"
            title="Additional Settings"
            description="Languages and closed days."
          >
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const active = languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() => toggleLanguage(l.code)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-medium transition-[var(--transition-smooth)]",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:border-foreground/40",
                      )}
                    >
                      {l.code.toUpperCase()}
                      <span className="ml-1.5 opacity-60">{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Closed weekdays
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const active = closedDays.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleClosed(d)}
                      className={cn(
                        "flex h-10 w-12 items-center justify-center rounded-xl border text-xs font-medium transition-[var(--transition-smooth)]",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:border-foreground/40",
                      )}
                    >
                      {d.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Section: Media */}
          <Section
            icon={<ImageIcon className="h-4 w-4" />}
            label="06"
            title="Media"
            description="Upload your cover and gallery."
          >
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cover image
              </label>
              <Dropzone
                drag={coverDrag}
                setDrag={setCoverDrag}
                onFiles={(f) => handleFiles(f, false)}
              >
                {cover ? (
                  <div className="relative h-full w-full">
                    <img src={cover} alt="cover" className="h-full w-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCover(null);
                      }}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 backdrop-blur transition-[var(--transition-smooth)] hover:bg-foreground group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <DropzoneEmpty label="Drop cover image or click to upload" />
                )}
              </Dropzone>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Gallery
              </label>
              <Dropzone
                drag={galleryDrag}
                setDrag={setGalleryDrag}
                onFiles={(f) => handleFiles(f, true)}
                short
              >
                <DropzoneEmpty label="Drop multiple images or click to upload" small />
              </Dropzone>
              {gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  <AnimatePresence>
                    {gallery.map((src, i) => (
                      <motion.div
                        key={src}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-border"
                      >
                        <img
                          src={src}
                          alt={`gallery-${i}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setGallery((prev) => prev.filter((g) => g !== src))
                          }
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 backdrop-blur transition-[var(--transition-smooth)] group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Section>
        </div>
      </main>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {isValid ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Check className="h-3.5 w-3.5" /> Ready to create
              </span>
            ) : (
              "Please fill all required fields"
            )}
          </p>
          <button
            disabled={!isValid || submitting}
            onClick={handleSubmit}
            className={cn(
              "group relative inline-flex h-11 min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-[var(--transition-smooth)]",
              isValid && !submitting
                ? "bg-foreground text-background hover:scale-[1.02] active:scale-[0.98]"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4" /> Created
              </>
            ) : (
              <>Create Salon</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ProgressBar({
  steps,
  completed,
  current,
}: {
  steps: string[];
  completed: boolean[];
  current: number;
}) {
  return (
    <div className="mx-auto max-w-[900px] px-6 pb-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = completed[i];
          const isCurrent = i === current;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-[var(--transition-smooth)]",
                  done
                    ? "bg-foreground"
                    : isCurrent
                      ? "bg-foreground/40"
                      : "bg-border",
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 hidden grid-cols-5 gap-2 sm:grid">
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              i <= current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

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
      className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
    >
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

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
          compact ? "h-11 pt-3.5 pb-1" : "h-14 pt-5 pb-1.5",
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
          compact &&
            "peer-focus:top-1.5",
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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 rounded-full border transition-[var(--transition-smooth)]",
        checked ? "border-foreground bg-foreground" : "border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-[var(--transition-smooth)]",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground outline-none transition-[var(--transition-smooth)] focus:border-foreground"
    />
  );
}

function Dropzone({
  drag,
  setDrag,
  onFiles,
  children,
  short,
}: {
  drag: boolean;
  setDrag: (v: boolean) => void;
  onFiles: (files: FileList | null) => void;
  children: React.ReactNode;
  short?: boolean;
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
        "group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30 transition-[var(--transition-smooth)]",
        drag ? "border-foreground bg-muted" : "border-border hover:border-foreground/40",
        short ? "h-28" : "h-44",
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple={short}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {children}
    </label>
  );
}

function DropzoneEmpty({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-background",
          small ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        <UploadCloud className={small ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <span className={cn("font-medium", small ? "text-xs" : "text-sm")}>{label}</span>
      <span className="text-[10px] uppercase tracking-wider">PNG, JPG up to 10MB</span>
    </div>
  );
}