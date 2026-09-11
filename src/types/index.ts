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
  points: number;
  runs: number;
  wickets: number;
  players: number;
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

export interface LeaderboardEntry {
  _id: string;
  player: Pick<Player, "fullName" | "profileImage" | "role"> | null;
  runs?: number;
  balls?: number;
  innings?: number;
  strikeRate?: number;
  wickets?: number;
  runsConceded?: number;
}

export interface TournamentStatistics {
  totals: {
    matches: number;
    teams: number;
    players: number;
    runs: number;
    wickets: number;
  };
  topRunScorers: LeaderboardEntry[];
  topWicketTakers: LeaderboardEntry[];
  highestScores: Array<{
    _id: string;
    runs: number;
    balls: number;
    player: Pick<Player, "fullName" | "profileImage" | "role">;
    team: Pick<Team, "name" | "shortName" | "logo">;
  }>;
}

export interface PointsTableRow extends TeamStats {
  team: Pick<Team, "_id" | "name" | "shortName" | "logo" | "color">;
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
  winner?: Team | null;
  result?: string;
  overs?: number;
}

export interface SearchResults {
  players: Player[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
}
