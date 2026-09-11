"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { playersApi, type PlayerInput } from "@/lib/api/players";
import { queryKeys } from "@/lib/query-keys";
import type { Player } from "@/types";

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), message);

const schema = z.object({
  fullName: z.string().trim().min(1, "Enter the player's name"),
  role: z.enum(["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"]),
  category: z.enum(["LOCAL", "INTERNATIONAL"]),
  basePrice: z
    .number({ invalid_type_error: "Enter a base price in lakhs" })
    .min(0, "Base price can't be negative"),
  battingStyle: z.string().trim(),
  bowlingStyle: z.string().trim(),
  dateOfBirth: z.string(),
  profileImage: optionalUrl("Enter a full image URL, or leave it blank"),
  externalProfileUrl: optionalUrl("Enter a full profile URL, or leave it blank"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  fullName: "",
  role: "BATTER",
  category: "LOCAL",
  basePrice: 20,
  battingStyle: "",
  bowlingStyle: "",
  dateOfBirth: "",
  profileImage: "",
  externalProfileUrl: "",
  isActive: true,
};

/** `<input type="date">` needs a bare YYYY-MM-DD, not an ISO timestamp. */
function toDateInput(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function valuesFrom(player: Player): FormValues {
  return {
    fullName: player.fullName,
    role: player.role,
    category: player.category,
    basePrice: player.basePrice,
    battingStyle: player.battingStyle ?? "",
    bowlingStyle: player.bowlingStyle ?? "",
    dateOfBirth: toDateInput(player.dateOfBirth),
    profileImage: player.profileImage ?? "",
    externalProfileUrl: player.externalProfileUrl ?? "",
    isActive: player.isActive,
  };
}

/** Create and edit share one form so the fields can't drift apart. */
export function PlayerFormModal({
  open,
  onClose,
  player,
}: {
  open: boolean;
  onClose: () => void;
  player?: Player | null;
}) {
  const editing = Boolean(player);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(player ? valuesFrom(player) : EMPTY);
  }, [open, player, reset]);

  const save = useToastMutation({
    mutationFn: (input: PlayerInput) =>
      player ? playersApi.update(player._id, input) : playersApi.create(input),
    successMessage: editing ? "Player updated" : "Player added",
    invalidate: player
      ? [queryKeys.players, queryKeys.player(player._id)]
      : [queryKeys.players],
    onSuccess: onClose,
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate({
      fullName: values.fullName,
      role: values.role,
      category: values.category,
      basePrice: values.basePrice,
      battingStyle: values.battingStyle || undefined,
      bowlingStyle: values.bowlingStyle || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      profileImage: values.profileImage || undefined,
      externalProfileUrl: values.externalProfileUrl || undefined,
      isActive: values.isActive,
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit player" : "Add player"}
      description={
        editing
          ? "Updates apply everywhere the player appears."
          : "Register a player so they can be entered into an auction."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="player-form"
            variant="primary"
            loading={save.isPending}
          >
            {editing ? "Save changes" : "Add player"}
          </Button>
        </>
      }
    >
      <form
        id="player-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Full name"
          required
          placeholder="Rohit Sharma"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Role"
            required
            error={errors.role?.message}
            {...register("role")}
          >
            <option value="BATTER">Batter</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All-rounder</option>
            <option value="WICKET_KEEPER">Wicket-keeper</option>
          </Select>
          <Select
            label="Category"
            error={errors.category?.message}
            {...register("category")}
          >
            <option value="LOCAL">Local</option>
            <option value="INTERNATIONAL">International</option>
          </Select>
          <Input
            label="Base price (lakhs)"
            required
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            className="tabular"
            error={errors.basePrice?.message}
            {...register("basePrice", { valueAsNumber: true })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Batting style"
            placeholder="Right-hand bat"
            error={errors.battingStyle?.message}
            {...register("battingStyle")}
          />
          <Input
            label="Bowling style"
            placeholder="Right-arm off break"
            error={errors.bowlingStyle?.message}
            {...register("bowlingStyle")}
          />
        </div>

        <Input
          label="Date of birth"
          type="date"
          className="tabular"
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />

        <Input
          label="Profile image URL"
          type="url"
          placeholder="https://…"
          error={errors.profileImage?.message}
          {...register("profileImage")}
        />

        <Input
          label="External profile URL"
          type="url"
          placeholder="https://…"
          hint="Cricinfo, Cricbuzz or wherever their record lives."
          error={errors.externalProfileUrl?.message}
          {...register("externalProfileUrl")}
        />

        <label className="flex items-center gap-2.5 text-sm text-text">
          <input
            type="checkbox"
            className="size-4 rounded border-line-strong bg-ink accent-amber"
            {...register("isActive")}
          />
          Active — available to be entered into auctions
        </label>
      </form>
    </Modal>
  );
}
