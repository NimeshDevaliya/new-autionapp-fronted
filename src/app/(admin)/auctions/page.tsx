"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gavel, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { auctionsApi } from "@/lib/api/auctions";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { formatMoney } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Give the auction a name"),
  tournament: z.string().min(1, "Choose a tournament"),
  maxSquadSize: z.coerce.number().int().min(1, "Must be at least 1"),
  minSquadSize: z.coerce.number().int().min(0),
  timerSeconds: z.coerce.number().int().min(0),
  firstIncrement: z.coerce.number().min(1, "Must be at least 1"),
  tierThreshold: z.coerce.number().min(0),
  tierIncrement: z.coerce.number().min(1, "Must be at least 1"),
});

type FormValues = z.infer<typeof schema>;

export default function AuctionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};

  const auctions = useQuery({
    queryKey: queryKeys.auctionList(params),
    queryFn: () => auctionsApi.list(params),
  });

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 100 }),
    queryFn: () => tournamentsApi.list({ limit: 100 }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      maxSquadSize: 11,
      minSquadSize: 0,
      timerSeconds: 30,
      firstIncrement: 1,
      tierThreshold: 40,
      tierIncrement: 2,
    },
  });

  const create = useToastMutation({
    mutationFn: (values: FormValues) =>
      auctionsApi.create({
        name: values.name,
        tournament: values.tournament,
        maxSquadSize: values.maxSquadSize,
        minSquadSize: values.minSquadSize,
        timerSeconds: values.timerSeconds,
        // tiered increments: the base rate, then a higher rate above a threshold
        bidIncrementTiers: [
          { threshold: 0, increment: values.firstIncrement },
          { threshold: values.tierThreshold, increment: values.tierIncrement },
        ],
      }),
    successMessage: "Auction created",
    invalidate: [queryKeys.auctions, queryKeys.dashboard],
    onSuccess: () => {
      setCreateOpen(false);
      form.reset();
    },
  });

  return (
    <>
      <PageHeader
        title="Auctions"
        description="Set up an auction, then run it live from the console."
        action={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New auction
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All auctions</option>
          <option value="DRAFT">Draft</option>
          <option value="LIVE">Live</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </Select>
      </div>

      {auctions.isLoading ? (
        <LoadingState label="Loading auctions" />
      ) : auctions.isError ? (
        <ErrorState
          message={(auctions.error as Error).message}
          onRetry={() => auctions.refetch()}
        />
      ) : auctions.data?.items.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {auctions.data.items.map((auction) => {
            const tournament =
              typeof auction.tournament === "object" ? auction.tournament : null;
            return (
              <Panel key={auction._id} className="flex flex-col">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="display text-xl leading-tight text-text">
                      {auction.name}
                    </h2>
                    <StatusBadge status={auction.status} />
                  </div>
                  {tournament && (
                    <p className="mt-1 text-sm text-muted">{tournament.name}</p>
                  )}

                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Squad cap</dt>
                      <dd className="text-text tabular">{auction.maxSquadSize}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Opening increment</dt>
                      <dd className="text-text tabular">
                        {formatMoney(auction.bidIncrementTiers?.[0]?.increment ?? 1)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-2 border-t border-line p-3">
                  <LinkButton
                    href={`/auctions/${auction._id}`}
                    variant={auction.status === "LIVE" ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                  >
                    <Gavel className="size-4" aria-hidden />
                    {auction.status === "LIVE" ? "Open console" : "Console"}
                  </LinkButton>
                  <LinkButton
                    href={`/auctions/${auction._id}/setup`}
                    variant="ghost"
                    size="sm"
                  >
                    <Users className="size-4" aria-hidden />
                    Players
                  </LinkButton>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Gavel}
          title="No auctions yet"
          message="Create an auction against a tournament, add the player pool, then start bidding."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New auction
            </Button>
          }
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New auction"
        description="Bid increments and squad limits are enforced by the server during bidding."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              form="auction-form"
              type="submit"
              loading={create.isPending}
            >
              Create auction
            </Button>
          </>
        }
      >
        <form
          id="auction-form"
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Auction name"
            required
            placeholder="MPL Season 4 Auction"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />

          <Select
            label="Tournament"
            required
            error={form.formState.errors.tournament?.message}
            {...form.register("tournament")}
          >
            <option value="">Choose a tournament</option>
            {tournaments.data?.items.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Maximum squad size"
              type="number"
              min={1}
              error={form.formState.errors.maxSquadSize?.message}
              {...form.register("maxSquadSize")}
            />
            <Input
              label="Minimum squad size"
              type="number"
              min={0}
              error={form.formState.errors.minSquadSize?.message}
              {...form.register("minSquadSize")}
            />
          </div>

          <Input
            label="Bid timer (seconds)"
            type="number"
            min={0}
            hint="Set 0 to run without a countdown."
            error={form.formState.errors.timerSeconds?.message}
            {...form.register("timerSeconds")}
          />

          <fieldset className="rounded-lg border border-line p-4">
            <legend className="px-1.5 text-sm font-medium text-muted">
              Bid increments
            </legend>
            <p className="mb-3 text-sm text-faint">
              Bids rise by the first amount, then by the second once they pass the
              threshold.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Increment"
                type="number"
                min={1}
                error={form.formState.errors.firstIncrement?.message}
                {...form.register("firstIncrement")}
              />
              <Input
                label="Above"
                type="number"
                min={0}
                error={form.formState.errors.tierThreshold?.message}
                {...form.register("tierThreshold")}
              />
              <Input
                label="Rises by"
                type="number"
                min={1}
                error={form.formState.errors.tierIncrement?.message}
                {...form.register("tierIncrement")}
              />
            </div>
          </fieldset>
        </form>
      </Modal>
    </>
  );
}
