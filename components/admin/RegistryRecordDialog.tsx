"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  createBaptismRecord,
  createDepartedRecord,
  createMarriageRecord,
  deleteBaptismRecord,
  deleteDepartedRecord,
  deleteMarriageRecord,
  updateBaptismRecord,
  updateDepartedRecord,
  updateMarriageRecord,
} from "@/actions/registry";
import SmartNameInput from "@/components/admin/SmartNameInput";
import { adminActionDanger, adminActionOutline } from "@/components/admin/admin-ui";
import {
  emptyBaptismForm,
  emptyDepartedForm,
  emptyMarriageForm,
  type BaptismFormValues,
  type BaptismRecordItem,
  type DepartedFormValues,
  type DepartedRecordItem,
  type MarriageFormValues,
  type MarriageRecordItem,
  type RegistryTab,
} from "@/lib/registry";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black disabled:opacity-60";

type EditorState =
  | { mode: "create"; kind: RegistryTab }
  | { mode: "edit"; kind: RegistryTab; id: string };

const dialogTitle: Record<RegistryTab, { create: string; edit: string }> = {
  baptisms: { create: "إضافة سجل معمودية", edit: "تعديل سجل معمودية" },
  marriages: { create: "إضافة سجل زواج", edit: "تعديل سجل زواج" },
  departed: { create: "إضافة سجل نياحة", edit: "تعديل سجل نياحة" },
};

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "tel" | "date";
}) {
  const isPlain = type === "text";

  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-bold text-deep-red">{label}</span>
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        dir={isPlain ? undefined : "ltr"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClassName} ${isPlain ? "" : "text-left"}`}
      />
    </label>
  );
}

function AreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 sm:col-span-2" htmlFor={id}>
      <span className="text-sm font-bold text-deep-red">{label}</span>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
      />
    </label>
  );
}

function CheckField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 items-center gap-3 rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-deep-red"
      />
      <span className="text-sm font-bold text-deep-red">{label}</span>
    </label>
  );
}

function FormActions({
  isSaving,
  onClose,
  onDelete,
}: {
  isSaving: boolean;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-coptic-gold-main/30 pt-4">
      <button type="submit" disabled={isSaving} className={primaryButtonClass}>
        {isSaving ? "جارٍ الحفظ..." : "حفظ"}
      </button>
      <button type="button" onClick={onClose} disabled={isSaving} className={adminActionOutline}>
        إلغاء
      </button>
      {onDelete ? (
        <button type="button" onClick={onDelete} disabled={isSaving} className={adminActionDanger}>
          حذف
        </button>
      ) : null}
    </div>
  );
}

function BaptismFields({
  recordId,
  initial,
  onClose,
}: {
  recordId: string | null;
  initial: BaptismFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function patch(partial: Partial<BaptismFormValues>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const result = recordId
      ? await updateBaptismRecord(recordId, form)
      : await createBaptismRecord(form);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!recordId || !window.confirm("هل تريد حذف هذا السجل؟ لا يمكن التراجع عن الحذف.")) {
      return;
    }

    setIsSaving(true);
    const result = await deleteBaptismRecord(recordId);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {recordId && form.serialNumber ? (
        <p className="text-sm font-bold text-deep-red">رقم المسلسل: {form.serialNumber}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="baptism-date" label="تاريخ المعمودية" type="date" value={form.baptismDate} onChange={(baptismDate) => patch({ baptismDate })} />
        <TextField id="baptism-birth-name" label="الاسم بالميلاد" value={form.birthName} onChange={(birthName) => patch({ birthName })} />
        <TextField id="baptism-name" label="الاسم بالمعمودية" value={form.baptismName} onChange={(baptismName) => patch({ baptismName })} />
        <SmartNameInput
          id="baptism-father"
          label="اسم الأب"
          value={form.fatherName}
          onValueChange={(fatherName) => patch({ fatherName })}
          onServantSelect={(servant) =>
            patch({
              fatherName: servant.name,
              fatherPhone: servant.phone ?? "",
            })
          }
        />
        <TextField id="baptism-father-phone" label="تليفون الأب" type="tel" value={form.fatherPhone} onChange={(fatherPhone) => patch({ fatherPhone })} />
        <TextField id="baptism-mother" label="اسم الأم" value={form.motherName} onChange={(motherName) => patch({ motherName })} />
        <TextField id="baptism-priest" label="الأب الكاهن" value={form.priest} onChange={(priest) => patch({ priest })} />
        <div className="sm:col-span-2">
          <CheckField
            id="baptism-certificate"
            label="تم استلام شهادة العماد"
            checked={form.receivedCertificate}
            onChange={(receivedCertificate) => patch({ receivedCertificate })}
          />
        </div>
      </div>
      {error ? <p role="alert" className="text-sm font-bold text-deep-red">{error}</p> : null}
      <FormActions isSaving={isSaving} onClose={onClose} onDelete={recordId ? () => void handleDelete() : undefined} />
    </form>
  );
}

function MarriageFields({
  recordId,
  initial,
  onClose,
}: {
  recordId: string | null;
  initial: MarriageFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function patch(partial: Partial<MarriageFormValues>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const result = recordId
      ? await updateMarriageRecord(recordId, form)
      : await createMarriageRecord(form);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!recordId || !window.confirm("هل تريد حذف هذا السجل؟ لا يمكن التراجع عن الحذف.")) {
      return;
    }

    setIsSaving(true);
    const result = await deleteMarriageRecord(recordId);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {recordId && form.serialNumber ? (
        <p className="text-sm font-bold text-deep-red">رقم المسلسل: {form.serialNumber}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="marriage-date" label="تاريخ صلاة الإكليل" type="date" value={form.weddingDate} onChange={(weddingDate) => patch({ weddingDate })} />
        <TextField id="marriage-time" label="الساعة" value={form.weddingTime} onChange={(weddingTime) => patch({ weddingTime })} />
        <TextField id="marriage-church" label="كنيسة الزفاف" value={form.weddingChurch} onChange={(weddingChurch) => patch({ weddingChurch })} />
        <SmartNameInput
          id="marriage-husband"
          label="اسم العريس"
          value={form.husbandName}
          onValueChange={(husbandName) => patch({ husbandName })}
          onServantSelect={(servant) =>
            patch({
              husbandName: servant.name,
              husbandPhone: servant.phone ?? "",
              isHusbandServant: true,
            })
          }
        />
        <TextField id="marriage-husband-phone" label="موبايل العريس" type="tel" value={form.husbandPhone} onChange={(husbandPhone) => patch({ husbandPhone })} />
        <SmartNameInput
          id="marriage-wife"
          label="اسم العروسة"
          value={form.wifeName}
          onValueChange={(wifeName) => patch({ wifeName })}
          onServantSelect={(servant) =>
            patch({
              wifeName: servant.name,
              wifePhone: servant.phone ?? "",
              isWifeServant: true,
            })
          }
        />
        <TextField id="marriage-wife-phone" label="موبايل العروسة" type="tel" value={form.wifePhone} onChange={(wifePhone) => patch({ wifePhone })} />
        <div className="sm:col-span-2">
          <TextField id="marriage-priest" label="الأب الكاهن" value={form.priest} onChange={(priest) => patch({ priest })} />
        </div>
        <CheckField
          id="marriage-husband-servant"
          label="العريس خادم"
          checked={form.isHusbandServant}
          onChange={(isHusbandServant) => patch({ isHusbandServant })}
        />
        <CheckField
          id="marriage-wife-servant"
          label="العروسة خادمة"
          checked={form.isWifeServant}
          onChange={(isWifeServant) => patch({ isWifeServant })}
        />
      </div>
      {error ? <p role="alert" className="text-sm font-bold text-deep-red">{error}</p> : null}
      <FormActions isSaving={isSaving} onClose={onClose} onDelete={recordId ? () => void handleDelete() : undefined} />
    </form>
  );
}

function DepartedFields({
  recordId,
  initial,
  onClose,
}: {
  recordId: string | null;
  initial: DepartedFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function patch(partial: Partial<DepartedFormValues>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const result = recordId
      ? await updateDepartedRecord(recordId, form)
      : await createDepartedRecord(form);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!recordId || !window.confirm("هل تريد حذف هذا السجل؟ لا يمكن التراجع عن الحذف.")) {
      return;
    }

    setIsSaving(true);
    const result = await deleteDepartedRecord(recordId);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {recordId && form.serialNumber ? (
        <p className="text-sm font-bold text-deep-red">رقم المسلسل: {form.serialNumber}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="departed-age" label="العمر عند الوفاة" value={form.ageAtDeath} onChange={(ageAtDeath) => patch({ ageAtDeath })} />
        <div className="sm:col-span-2">
          <SmartNameInput
            id="departed-name"
            label="اسم المنتقل"
            value={form.departedName}
            onValueChange={(departedName) => patch({ departedName })}
            onServantSelect={(servant) =>
              setForm((current) => ({
                ...current,
                departedName: servant.name,
                isServant: true,
                contactMobile: servant.phone || current.contactMobile,
                contactOwner: current.contactOwner || servant.name,
              }))
            }
          />
        </div>
        <CheckField
          id="departed-servant"
          label="المنتقل خادم"
          checked={form.isServant}
          onChange={(isServant) => patch({ isServant })}
        />
        <SmartNameInput
          id="departed-spouse"
          label="الزوج / الزوجة"
          value={form.spouseName}
          onValueChange={(spouseName) => patch({ spouseName })}
          onServantSelect={(servant) => patch({ spouseName: servant.name })}
        />
        <AreaField id="departed-children" label="الأولاد" value={form.childrenNames} onChange={(childrenNames) => patch({ childrenNames })} />
        <AreaField id="departed-address" label="عنوان الأسرة" value={form.familyAddress} onChange={(familyAddress) => patch({ familyAddress })} />
        <TextField id="departed-mobile" label="رقم موبايل للتواصل" type="tel" value={form.contactMobile} onChange={(contactMobile) => patch({ contactMobile })} />
        <TextField id="departed-owner" label="صاحب الموبايل" value={form.contactOwner} onChange={(contactOwner) => patch({ contactOwner })} />
        <TextField id="departed-date" label="تاريخ صلاة التجنيز" type="date" value={form.funeralDate} onChange={(funeralDate) => patch({ funeralDate })} />
        <TextField id="departed-time" label="موعد الصلاة" value={form.funeralTime} onChange={(funeralTime) => patch({ funeralTime })} />
        <TextField id="departed-place" label="مكان الصلاة" value={form.funeralPlace} onChange={(funeralPlace) => patch({ funeralPlace })} />
        <TextField id="departed-burial" label="مكان المدفن" value={form.burialPlace} onChange={(burialPlace) => patch({ burialPlace })} />
        <TextField id="departed-priest" label="الكاهن الذي قام بالصلاة" value={form.priest} onChange={(priest) => patch({ priest })} />
        <TextField id="departed-third" label="موعد صلاة الثالث" value={form.thirdDayPrayerTime} onChange={(thirdDayPrayerTime) => patch({ thirdDayPrayerTime })} />
        <AreaField id="departed-cause" label="سبب الوفاة" value={form.causeOfDeath} onChange={(causeOfDeath) => patch({ causeOfDeath })} />
        <AreaField id="departed-notes" label="ملاحظات / الخدمة" value={form.notes} onChange={(notes) => patch({ notes })} />
      </div>
      {error ? <p role="alert" className="text-sm font-bold text-deep-red">{error}</p> : null}
      <FormActions isSaving={isSaving} onClose={onClose} onDelete={recordId ? () => void handleDelete() : undefined} />
    </form>
  );
}

export default function RegistryRecordDialog({
  editor,
  baptisms,
  marriages,
  departed,
  onClose,
}: {
  editor: EditorState;
  baptisms: BaptismRecordItem[];
  marriages: MarriageRecordItem[];
  departed: DepartedRecordItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const title = dialogTitle[editor.kind][editor.mode === "edit" ? "edit" : "create"];
  const baptism = editor.kind === "baptisms" && editor.mode === "edit"
    ? baptisms.find((item) => item.id === editor.id)
    : undefined;
  const marriage = editor.kind === "marriages" && editor.mode === "edit"
    ? marriages.find((item) => item.id === editor.id)
    : undefined;
  const departedRecord = editor.kind === "departed" && editor.mode === "edit"
    ? departed.find((item) => item.id === editor.id)
    : undefined;
  const missingEdit =
    editor.mode === "edit" &&
    ((editor.kind === "baptisms" && !baptism) ||
      (editor.kind === "marriages" && !marriage) ||
      (editor.kind === "departed" && !departedRecord));

  return (
    <AnimatePresence>
      <motion.button
        key="registry-dialog-backdrop"
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        aria-label="إغلاق النموذج"
        onClick={onClose}
      />
      <div key="registry-dialog-panel" className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registry-dialog-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="pointer-events-auto max-h-[100dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-2xl md:max-h-[90dvh] md:w-[min(46rem,100%)] md:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="registry-dialog-title" className="text-lg font-bold text-deep-red">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-coptic-gold-dark hover:bg-coptic-gold-main/15"
          >
            إغلاق
          </button>
        </div>
        {missingEdit ? (
          <p className="text-sm text-deep-red">السجل غير موجود.</p>
        ) : editor.kind === "baptisms" ? (
          <BaptismFields
            key={baptism?.id ?? "new-baptism"}
            recordId={baptism?.id ?? null}
            initial={baptism ?? emptyBaptismForm}
            onClose={onClose}
          />
        ) : editor.kind === "marriages" ? (
          <MarriageFields
            key={marriage?.id ?? "new-marriage"}
            recordId={marriage?.id ?? null}
            initial={marriage ?? emptyMarriageForm}
            onClose={onClose}
          />
        ) : (
          <DepartedFields
            key={departedRecord?.id ?? "new-departed"}
            recordId={departedRecord?.id ?? null}
            initial={departedRecord ?? emptyDepartedForm}
            onClose={onClose}
          />
        )}
      </motion.div>
      </div>
    </AnimatePresence>
  );
}

export type { EditorState };
