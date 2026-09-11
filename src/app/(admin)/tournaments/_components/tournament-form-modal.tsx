"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { TournamentInput } from "@/lib/api/tournaments";
import type { Tournament } from "@/types";

const FORM_ID = "tournament-form";

const STATUS_OPTIONS: Array<{ value: Tournament["status"]; label: string }> = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

const schema = z
  .object({
    name: z.string().min(2, "Enter a tournament name"),
    shortName: z.string().max(24, "Keep the short name under 24 characters"),
    seriesName: z.string().max(120, "Keep the series name under 120 characters"),
    seasonName: z.string().max(120, "Keep the season name under 120 characters"),
    seasonNumber: z.string().regex(/^\d*$/, "Use digits only"),
    location: z.string().max(160, "Keep the location under 160 characters"),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]),
    description: z.string().max(2000, "Keep the description under 2000 characters"),
  })
  .refine(
    (values) =>
      !values.startDate || !values.endDate || values.endDate >= values.startDate,
    { path: ["endDate"], message: "The end date can't be before the start date" }
  );

export type TournamentFormValues = z.infer<typeof schema>;

/** ISO timestamps come back from the API; date inputs want `YYYY-MM-DD`. */
function toDateInput(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toFormValues(tournament?: Tournament | null): TournamentFormValues {
  return {
    name: tournament?.name ?? "",
    shortName: tournament?.shortName ?? "",
    seriesName: tournament?.seriesName ?? "",
    seasonName: tournament?.seasonName ?? "",
    seasonNumber:
      tournament?.seasonNumber === undefined ? "" : String(tournament.seasonNumber),
    location: tournament?.location ?? "",
    startDate: toDateInput(tournament?.startDate),
    endDate: toDateInput(tournament?.endDate),
    status: tournament?.status ?? "UPCOMING",
    description: tournament?.description ?? "",
  };
}

/** Blank optional fields are omitted rather than sent as empty strings. */
function toInput(values: TournamentFormValues): TournamentInput {
  const trimmed = (value: string) => {
    const next = value.trim();
    return next.length > 0 ? next : undefined;
  };

  return {
    name: values.name.trim(),
    shortName: trimmed(values.shortName),
    seriesName: trimmed(values.seriesName),
    seasonName: trimmed(values.seasonName),
    seasonNumber: values.seasonNumber.trim()
      ? Number(values.seasonNumber.trim())
      : undefined,
    location: trimmed(values.location),
    startDate: trimmed(values.startDate),
    endDate: trimmed(values.endDate),
    status: values.status,
    description: trimmed(values.description),
  };
}

export function TournamentFormModal({
  open,
  onClose,
  tournament,
  onSubmit,
  submitting,
  title,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Present when editing; omit to create. */
  tournament?: Tournament | null;
  onSubmit: (input: TournamentInput) => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(tournament),
  });

  // reopening the dialog should show the record as it stands, not stale edits
  useEffect(() => {
    if (open) reset(toFormValues(tournament));
  }, [open, tournament, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Series and season details help group tournaments across years."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={submitting}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit((values) => onSubmit(toInput(values)))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Input
            label="Tournament name"
            required
            placeholder="Median Premier League 2026"
            autoComplete="off"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>

        <Input
          label="Short name"
          placeholder="MPL 2026"
          hint="Used where space is tight."
          autoComplete="off"
          error={errors.shortName?.message}
          {...register("shortName")}
        />
        <Input
          label="Series name"
          placeholder="Median Premier League"
          autoComplete="off"
          error={errors.seriesName?.message}
          {...register("seriesName")}
        />

        <Input
          label="Season name"
          placeholder="Season 4"
          autoComplete="off"
          error={errors.seasonName?.message}
          {...register("seasonName")}
        />
        <Input
          label="Season number"
          inputMode="numeric"
          placeholder="4"
          autoComplete="off"
          error={errors.seasonNumber?.message}
          {...register("seasonNumber")}
        />

        <div className="sm:col-span-2">
          <Input
            label="Location"
            placeholder="Ahmedabad, Gujarat"
            autoComplete="off"
            error={errors.location?.message}
            {...register("location")}
          />
        </div>

        <Input
          label="Start date"
          type="date"
          error={errors.startDate?.message}
          {...register("startDate")}
        />
        <Input
          label="End date"
          type="date"
          error={errors.endDate?.message}
          {...register("endDate")}
        />

        <Select label="Status" error={errors.status?.message} {...register("status")}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="sm:col-span-2">
          <Textarea
            label="Description"
            rows={3}
            placeholder="Format, participating teams, anything worth noting."
            error={errors.description?.message}
            {...register("description")}
          />
        </div>
      </form>
    </Modal>
  );
}
