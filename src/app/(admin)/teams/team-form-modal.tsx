"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { teamsApi, type TeamInput } from "@/lib/api/teams";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import type { Team } from "@/types";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** A neutral mark colour, used until the owner picks the team's own. */
export const DEFAULT_TEAM_COLOR = "#24314c";

const schema = z
  .object({
    name: z.string().trim().min(1, "Give the team a name"),
    shortName: z.string().trim().max(8, "Keep the short name to 8 characters"),
    ownerName: z.string().trim(),
    color: z.string().regex(HEX, "Use a hex colour such as #f5a524"),
    budget: z
      .number({ invalid_type_error: "Enter the purse in lakhs" })
      .positive("The purse must be more than zero"),
    maxPlayers: z
      .number({ invalid_type_error: "Enter a squad ceiling" })
      .int("Whole players only")
      .min(1, "A squad needs at least one player"),
    minPlayers: z
      .number({ invalid_type_error: "Enter a squad floor" })
      .int("Whole players only")
      .min(0, "Can't be negative"),
    tournament: z.string().min(1, "Choose a tournament"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .refine((values) => values.minPlayers <= values.maxPlayers, {
    message: "The floor can't be above the ceiling",
    path: ["minPlayers"],
  });

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: "",
  shortName: "",
  ownerName: "",
  color: DEFAULT_TEAM_COLOR,
  budget: 1000,
  maxPlayers: 18,
  minPlayers: 11,
  tournament: "",
  status: "ACTIVE",
};

function tournamentIdOf(team: Team): string {
  return typeof team.tournament === "string"
    ? team.tournament
    : team.tournament._id;
}

function valuesFrom(team: Team): FormValues {
  return {
    name: team.name,
    shortName: team.shortName ?? "",
    ownerName: team.ownerName ?? "",
    color: HEX.test(team.color ?? "") ? team.color! : DEFAULT_TEAM_COLOR,
    budget: team.budget,
    maxPlayers: team.maxPlayers,
    minPlayers: team.minPlayers,
    tournament: tournamentIdOf(team),
    status: team.status,
  };
}

/**
 * One form for both creating and editing a team — passing `team` switches it
 * into edit mode so the two entry points can't drift apart.
 */
export function TeamFormModal({
  open,
  onClose,
  team,
  defaultTournament,
}: {
  open: boolean;
  onClose: () => void;
  team?: Team | null;
  defaultTournament?: string;
}) {
  const editing = Boolean(team);

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 100 }),
    queryFn: () => tournamentsApi.list({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  // reopening the modal must never show the previous team's numbers
  useEffect(() => {
    if (!open) return;
    reset(
      team
        ? valuesFrom(team)
        : { ...EMPTY, tournament: defaultTournament ?? "" }
    );
  }, [open, team, defaultTournament, reset]);

  const save = useToastMutation({
    mutationFn: (input: TeamInput) =>
      team ? teamsApi.update(team._id, input) : teamsApi.create(input),
    successMessage: editing ? "Team updated" : "Team created",
    invalidate: team
      ? [queryKeys.teams, queryKeys.team(team._id)]
      : [queryKeys.teams],
    onSuccess: onClose,
  });

  const colorValue = useWatch({ control, name: "color" });
  const swatch = HEX.test(colorValue ?? "") ? colorValue : DEFAULT_TEAM_COLOR;

  const onSubmit = handleSubmit((values) => {
    save.mutate({
      name: values.name,
      shortName: values.shortName || undefined,
      ownerName: values.ownerName || undefined,
      color: values.color,
      budget: values.budget,
      maxPlayers: values.maxPlayers,
      minPlayers: values.minPlayers,
      tournament: values.tournament,
      status: values.status,
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit team" : "New team"}
      description={
        editing
          ? "Changes apply immediately across the auction console."
          : "Set the purse and squad limits before the auction opens."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="team-form"
            variant="primary"
            loading={save.isPending}
          >
            {editing ? "Save changes" : "Create team"}
          </Button>
        </>
      }
    >
      <form
        id="team-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Team name"
          required
          placeholder="Mumbai Mavericks"
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Short name"
            placeholder="MUM"
            hint="Shown on scorecards and the auction board."
            error={errors.shortName?.message}
            {...register("shortName")}
          />
          <Input
            label="Owner"
            placeholder="Who runs the franchise"
            error={errors.ownerName?.message}
            {...register("ownerName")}
          />
        </div>

        <Field
          label="Team colour"
          error={errors.color?.message}
          hint="Used for the crest and purse bar, nothing else."
          htmlFor="team-color-hex"
        >
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick the team colour"
              value={swatch}
              onChange={(event) =>
                setValue("color", event.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-line-strong bg-ink p-1"
            />
            <input
              id="team-color-hex"
              spellCheck={false}
              placeholder="#f5a524"
              aria-invalid={errors.color ? true : undefined}
              className="h-11 w-full rounded-md border border-line-strong bg-ink px-3 text-text tabular placeholder:text-faint transition-colors focus:border-amber focus:outline-none"
              {...register("color")}
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Purse (lakhs)"
            required
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            className="tabular"
            error={errors.budget?.message}
            {...register("budget", { valueAsNumber: true })}
          />
          <Input
            label="Max players"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            className="tabular"
            error={errors.maxPlayers?.message}
            {...register("maxPlayers", { valueAsNumber: true })}
          />
          <Input
            label="Min players"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            className="tabular"
            error={errors.minPlayers?.message}
            {...register("minPlayers", { valueAsNumber: true })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tournament"
            required
            error={errors.tournament?.message}
            disabled={tournaments.isLoading}
            {...register("tournament")}
          >
            <option value="">
              {tournaments.isLoading ? "Loading tournaments" : "Select one"}
            </option>
            {tournaments.data?.items.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            error={errors.status?.message}
            {...register("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
