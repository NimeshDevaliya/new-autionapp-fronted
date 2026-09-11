export type AdminRole = "SUPER_ADMIN" | "AUCTION_ADMIN";
export type AdminStatus = "ACTIVE" | "INACTIVE";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED";
export type TeamStatus = "ACTIVE" | "INACTIVE";
export type PlayerRole = "BATTER" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";
export type PlayerCategory = "LOCAL" | "INTERNATIONAL";
export type AuctionStatus = "DRAFT" | "LIVE" | "PAUSED" | "COMPLETED";
export type AuctionPlayerStatus = "PENDING" | "IN_AUCTION" | "SOLD" | "UNSOLD";
export type MatchStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "ABANDONED";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta?: PaginationMeta;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  _id: string;
  name: string;
  shortName?: string;
  seriesName?: string;
  seasonName?: string;
  seasonNumber?: number;
  logo?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status: TournamentStatus;
  description?: string;
  /** CricHeroes tournament id, when results are synced from there */
  externalId?: number;
  createdAt: string;
  updatedAt: string;
  teamCount?: number;
  playerCount?: number;
  matchCount?: number;
  auction?: { _id: string; name: string; status: AuctionStatus } | null;
}

export interface Team {
  _id: string;
  name: string;
  shortName?: string;
  logo?: string;
  ownerName?: string;
  color?: string;
  budget: number;
  spent: number;
  remainingBudget: number;
  maxPlayers: number;
  minPlayers: number;
  maxForeignPlayers?: number;
  status: TeamStatus;
  tournament: string | Tournament;
  playersBought?: number;
  playersRemaining?: number;
  stats?: TeamStats;
  createdAt: string;
}

export interface TeamStats {
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  pointsAdjustment: number;
  /** null until the team has both batted and bowled */
  netRunRate: number | null;
  runsFor: number;
  oversFor: number;
  runsAgainst: number;
  oversAgainst: number;
  runs: number;
  wickets: number;
  players: number;
  /** last five results, oldest first */
  form: Array<"W" | "L" | "T" | "N">;
}

export interface Player {
  _id: string;
  fullName: string;
  profileImage?: string;
  dateOfBirth?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  role: PlayerRole;
  category: PlayerCategory;
  basePrice: number;
  isActive: boolean;
  externalProfileUrl?: string;
  currentTeam?: Team | null;
  soldPrice?: number | null;
  currentSquad?: TeamSquadEntry | null;
  squadHistory?: TeamSquadEntry[];
  auctionHistory?: AuctionPlayer[];
  createdAt: string;
}

export interface TeamSquadEntry {
  _id: string;
  tournament: string | Tournament;
  team: Team;
  player: Player | string;
  basePrice: number;
  soldPrice: number;
  acquisitionType: "AUCTION" | "RETAINED";
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface BidIncrementTier {
  threshold: number;
  increment: number;
}

export interface Auction {
  _id: string;
  name: string;
  tournament: string | Tournament;
  status: AuctionStatus;
  bidIncrementTiers: BidIncrementTier[];
  maxSquadSize: number;
  minSquadSize: number;
  maxForeignPlayers?: number;
  timerSeconds?: number;
  currentAuctionPlayer?: string | null;
  startedAt?: string;
  completedAt?: string;
  counts?: { total: number; sold: number; unsold: number; pending: number };
  createdAt: string;
}

export interface AuctionPlayer {
  _id: string;
  auction: string | Auction;
  player: Player;
  basePrice: number;
  currentBid: number;
  currentBiddingTeam?: Team | null;
  status: AuctionPlayerStatus;
  soldPrice?: number | null;
  soldToTeam?: Team | null;
  order: number;
  category?: string;
}

export interface Bid {
  _id: string;
  auctionPlayer: string;
  team: Team;
  amount: number;
  createdAt: string;
}

export interface AuctionTeamState extends Team {
  isHighestBidder: boolean;
}

export interface AuctionState {
  auction: Auction;
  currentPlayer: AuctionPlayer | null;
  nextBid: number | null;
  teams: AuctionTeamState[];
  bidHistory: Bid[];
}

export interface AuctionResults {
  sold: AuctionPlayer[];
  unsold: AuctionPlayer[];
  teamWise: Array<{
    team: Team;
    players: AuctionPlayer[];
    totalSpent: number;
    playerCount: number;
    remainingBudget: number;
  }>;
  summary: {
    totalSold: number;
    totalUnsold: number;
    totalAmount: number;
    highestBuy: AuctionPlayer | null;
    lowestBuy: AuctionPlayer | null;
  };
}

export interface BattingStats {
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  notOuts: number;
  highestScore: number;
  average: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
}

export interface BowlingStats {
  innings: number;
  overs: number;
  balls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  average: number;
  strikeRate: number;
  bestBowling: string;
}

export interface FieldingStats {
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface PlayerStatistics {
  batting: BattingStats;
  bowling: BowlingStats;
  fielding: FieldingStats;
}

export interface PlayerStatsResponse {
  career: PlayerStatistics;
  scoped: PlayerStatistics | null;
  seasons: Array<{
    tournament: Pick<
      Tournament,
      "_id" | "name" | "seriesName" | "seasonName" | "seasonNumber" | "status"
    >;
    stats: PlayerStatistics;
  }>;
}

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalTeams: number;
  totalPlayers: number;
  totalAuctions: number;
  soldPlayers: number;
  unsoldPlayers: number;
  totalAuctionAmount: number;
}

type PlayerSummary = Pick<Player, "_id" | "fullName" | "profileImage" | "role">;
type TeamSummary = Pick<Team, "_id" | "name" | "shortName" | "logo" | "color">;

/** Shared shape of every leaderboard row: the player and the team they last played for. */
interface LeaderboardBase {
  _id: string;
  player: PlayerSummary | null;
  team: TeamSummary | null;
}

export interface BattingLeaderboardEntry extends LeaderboardBase {
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  notOuts: number;
  highestScore: number;
  /** null when never dismissed */
  average: number | null;
  strikeRate: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
}

export interface BowlingLeaderboardEntry extends LeaderboardBase {
  matches: number;
  innings: number;
  balls: number;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  average: number | null;
  strikeRate: number | null;
  bestBowling: string;
}

export interface AllRounderLeaderboardEntry extends LeaderboardBase {
  matches: number;
  battingInnings: number;
  runs: number;
  strikeRate: number;
  bowlingInnings: number;
  wickets: number;
  economy: number;
  /** runs + (wicket weight × wickets); the weight is sent alongside */
  points: number;
}

export interface FieldingLeaderboardEntry extends LeaderboardBase {
  catches: number;
  stumpings: number;
  runOuts: number;
  dismissals: number;
}

/**
 * Loose union kept for components that only read the common batting/bowling
 * fields; prefer the specific entry types in new code.
 */
export type LeaderboardEntry = LeaderboardBase & {
  runs?: number;
  balls?: number;
  innings?: number;
  strikeRate?: number | null;
  wickets?: number;
  runsConceded?: number;
};

export interface MatchRef {
  _id: string;
  matchNumber?: number;
  matchDate?: string;
  teamA: string;
  teamB: string;
}

export interface HighestScoreEntry {
  _id: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  player: PlayerSummary | null;
  team: TeamSummary | null;
  match: MatchRef | null;
}

export interface BestBowlingEntry {
  _id: string;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  player: PlayerSummary | null;
  team: TeamSummary | null;
  match: MatchRef | null;
}

export interface TournamentStatistics {
  totals: {
    matches: number;
    completedMatches: number;
    teams: number;
    players: number;
    runs: number;
    wickets: number;
    fours: number;
    sixes: number;
  };
  allRounderWicketWeight: number;
  topRunScorers: BattingLeaderboardEntry[];
  topWicketTakers: BowlingLeaderboardEntry[];
  topAllRounders: AllRounderLeaderboardEntry[];
  topFielders: FieldingLeaderboardEntry[];
  highestScores: HighestScoreEntry[];
  bestBowling: BestBowlingEntry[];
}

export interface Leaderboards {
  allRounderWicketWeight: number;
  topRunScorers: BattingLeaderboardEntry[];
  topWicketTakers: BowlingLeaderboardEntry[];
  topAllRounders: AllRounderLeaderboardEntry[];
  topFielders: FieldingLeaderboardEntry[];
}

export interface PointsTableRow extends TeamStats {
  team: TeamSummary;
}

/** One side's score in a match list. */
export interface InningsSummary {
  team: string;
  inningsNumber: number;
  runs: number;
  wickets: number;
  overs: number;
  allOut: boolean;
}

export interface Match {
  _id: string;
  tournament: string | Tournament;
  matchNumber?: number;
  teamA: Team;
  teamB: Team;
  matchDate?: string;
  venue?: string;
  status: MatchStatus;
  tossWonBy?: Team | null;
  tossDecision?: "BAT" | "BOWL";
  winner?: Team | null;
  result?: string;
  overs?: number;
  playerOfTheMatch?: PlayerSummary | null;
  externalId?: number;
  innings?: InningsSummary[];
}

export type DismissalType =
  | "NOT_OUT"
  | "BOWLED"
  | "CAUGHT"
  | "LBW"
  | "RUN_OUT"
  | "STUMPED"
  | "HIT_WICKET"
  | "RETIRED_HURT"
  | "OTHER";

export interface ScorecardBatting {
  _id: string;
  player: PlayerSummary;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: DismissalType;
  dismissalBowler?: Pick<Player, "_id" | "fullName"> | null;
  dismissalFielder?: Pick<Player, "_id" | "fullName"> | null;
  battingPosition?: number;
}

export interface ScorecardBowling {
  _id: string;
  player: PlayerSummary;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface ScorecardInnings {
  innings: {
    _id: string;
    battingTeam: string;
    bowlingTeam: string;
    inningsNumber: number;
    totalRuns: number;
    totalWickets: number;
    totalOvers: number;
    extras: number;
    allOut: boolean;
  };
  batting: ScorecardBatting[];
  bowling: ScorecardBowling[];
}

export interface MatchDetail extends Match {
  scorecard: ScorecardInnings[];
}

export interface ImportReport {
  tournament: { id: string; name: string; externalId: number };
  matches: { found: number; imported: number; failed: Array<{ matchId: number; error: string }> };
  players: {
    linkedById: number;
    matched: Array<{ cricheroes: string; ours: string; rule: string }>;
    created: string[];
    aliased: Array<{ name: string; externalId: number }>;
  };
  outsideSquad: Array<{ player: string; playedFor: string }>;
  unresolvedNames: string[];
  warnings: string[];
  standings: Array<{
    team: string;
    official: { matches: number; won: number; lost: number; points: number; nrr: string };
    derived: { matches: number; wins: number; losses: number; points: number; nrr: number | null };
    pointsAdjustment: number;
  }>;
}

export interface SearchResults {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
}
