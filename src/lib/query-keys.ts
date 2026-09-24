/** Single source of truth for query keys, so invalidation always matches. */
export const queryKeys = {
  auth: ["auth"] as const,
  me: () => [...queryKeys.auth, "me"] as const,

  admins: ["admins"] as const,
  adminList: (params?: unknown) => [...queryKeys.admins, "list", params] as const,
  admin: (id: string) => [...queryKeys.admins, id] as const,

  tournaments: ["tournaments"] as const,
  tournamentList: (params?: unknown) =>
    [...queryKeys.tournaments, "list", params] as const,
  tournament: (id: string) => ["tournament", id] as const,
  tournamentStats: (id: string) => ["tournament", id, "statistics"] as const,
  pointsTable: (id: string) => ["tournament", id, "points-table"] as const,

  seasons: ["seasons"] as const,

  teams: ["teams"] as const,
  teamList: (params?: unknown) => [...queryKeys.teams, "list", params] as const,
  team: (id: string) => ["team", id] as const,
  teamSquad: (id: string) => ["team", id, "squad"] as const,
  teamOwners: (id: string) => ["team", id, "owners"] as const,

  // team-owner app session (separate token, separate cache)
  teamSession: ["team-session"] as const,
  teamMe: () => [...queryKeys.teamSession, "me"] as const,
  teamSquadPublic: (id: string) => ["team-session", "squad", id] as const,

  players: ["players"] as const,
  playerList: (params?: unknown) => [...queryKeys.players, "list", params] as const,
  player: (id: string) => ["player", id] as const,
  playerStats: (id: string, scope?: unknown) =>
    ["player", id, "statistics", scope] as const,

  auctions: ["auction"] as const,
  auctionList: (params?: unknown) => [...queryKeys.auctions, "list", params] as const,
  auction: (id: string) => ["auction", id] as const,
  auctionState: (id: string) => ["auction", id, "state"] as const,
  auctionPlayers: (id: string, params?: unknown) =>
    ["auction", id, "players", params] as const,
  auctionResults: (id: string, params?: unknown) =>
    ["auction", id, "results", params] as const,

  matches: ["matches"] as const,
  matchList: (params?: unknown) => [...queryKeys.matches, "list", params] as const,
  match: (id: string) => ["match", id] as const,

  dashboard: ["statistics", "dashboard"] as const,
  leaderboards: (params?: unknown) => ["statistics", "leaderboards", params] as const,

  search: (term: string) => ["search", term] as const,
};
