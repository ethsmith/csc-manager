import type { PlayerStats, GroupedPlayer, MatchPlayer, PlayerTierBreakdown, TierBreakdown, MatchWithTiers } from './types';
import { fetchAllPlayers, type CscPlayer } from './fetchFranchises';

const API_BASE = 'https://fragg-3-0-api.vercel.app/player-stats';
const CACHE_DURATION_MS = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const playerStatsCache = new Map<number, CacheEntry<GroupedPlayer[]>>();

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

function mapApiToStats(api: Record<string, unknown>): PlayerStats {
  const mk = (api.multi_kills as Record<string, number> | undefined) ?? {};
  return {
    steamId: String(api.steam_id ?? ''),
    name: String(api.name ?? ''),
    teamName: String(api.team_name ?? ''),
    games: Number(api.games ?? 0),
    finalRating: Number(api.final_rating ?? 0),
    hltvRating: Number(api.hltv_rating ?? 0),
    roundsPlayed: Number(api.rounds_played ?? 0),
    roundsWon: Number(api.rounds_won ?? 0),
    roundsLost: Number(api.rounds_lost ?? 0),
    kills: Number(api.kills ?? 0),
    assists: Number(api.assists ?? 0),
    deaths: Number(api.deaths ?? 0),
    damage: Number(api.damage ?? 0),
    adr: Number(api.adr ?? 0),
    kpr: Number(api.kpr ?? 0),
    dpr: Number(api.dpr ?? 0),
    kast: Number(api.kast ?? 0),
    survival: Number(api.survival ?? 0),
    headshots: Number(api.headshots ?? 0),
    headshotPct: Number(api.headshot_pct ?? 0),
    avgTimeToKill: Number(api.avg_time_to_kill ?? 0),
    openingKills: Number(api.opening_kills ?? 0),
    openingDeaths: Number(api.opening_deaths ?? 0),
    openingAttempts: Number(api.opening_attempts ?? 0),
    openingSuccesses: Number(api.opening_successes ?? 0),
    openingKillsPerRound: Number(api.opening_kills_per_round ?? 0),
    openingDeathsPerRound: Number(api.opening_deaths_per_round ?? 0),
    openingAttemptsPct: Number(api.opening_attempts_pct ?? 0),
    openingSuccessPct: Number(api.opening_success_pct ?? 0),
    roundsWonAfterOpening: Number(api.rounds_won_after_opening ?? 0),
    winPctAfterOpeningKill: Number(api.win_pct_after_opening_kill ?? 0),
    ecoKillValue: Number(api.eco_kill_value ?? 0),
    ecoDeathValue: Number(api.eco_death_value ?? 0),
    duelSwing: Number(api.duel_swing ?? 0),
    duelSwingPerRound: Number(api.duel_swing_per_round ?? 0),
    econImpact: Number(api.econ_impact ?? 0),
    roundImpact: Number(api.round_impact ?? 0),
    probabilitySwing: Number(api.probability_swing ?? 0),
    probabilitySwingPerRound: Number(api.probability_swing_per_round ?? 0),
    clutchRounds: Number(api.clutch_rounds ?? 0),
    clutchWins: Number(api.clutch_wins ?? 0),
    clutchPointsPerRound: Number(api.clutch_points_per_round ?? 0),
    clutch1v1Attempts: Number(api.clutch_1v1_attempts ?? 0),
    clutch1v1Wins: Number(api.clutch_1v1_wins ?? 0),
    clutch1v1WinPct: Number(api.clutch_1v1_win_pct ?? 0),
    tradeKills: Number(api.trade_kills ?? 0),
    tradeKillsPerRound: Number(api.trade_kills_per_round ?? 0),
    tradeKillsPct: Number(api.trade_kills_pct ?? 0),
    fastTrades: Number(api.fast_trades ?? 0),
    tradedDeaths: Number(api.traded_deaths ?? 0),
    tradedDeathsPerRound: Number(api.traded_deaths_per_round ?? 0),
    tradedDeathsPct: Number(api.traded_deaths_pct ?? 0),
    tradeDenials: Number(api.trade_denials ?? 0),
    savedByTeammate: Number(api.saved_by_teammate ?? 0),
    savedByTeammatePerRound: Number(api.saved_by_teammate_per_round ?? 0),
    savedTeammate: Number(api.saved_teammate ?? 0),
    savedTeammatePerRound: Number(api.saved_teammate_per_round ?? 0),
    openingDeathsTraded: Number(api.opening_deaths_traded ?? 0),
    openingDeathsTradedPct: Number(api.opening_deaths_traded_pct ?? 0),
    awpKills: Number(api.awp_kills ?? 0),
    awpKillsPerRound: Number(api.awp_kills_per_round ?? 0),
    awpKillsPct: Number(api.awp_kills_pct ?? 0),
    roundsWithAwpKill: Number(api.rounds_with_awp_kill ?? 0),
    roundsWithAwpKillPct: Number(api.rounds_with_awp_kill_pct ?? 0),
    awpMultiKillRounds: Number(api.awp_multi_kill_rounds ?? 0),
    awpMultiKillRoundsPerRound: Number(api.awp_multi_kill_rounds_per_round ?? 0),
    awpOpeningKills: Number(api.awp_opening_kills ?? 0),
    awpOpeningKillsPerRound: Number(api.awp_opening_kills_per_round ?? 0),
    awpDeaths: Number(api.awp_deaths ?? 0),
    awpDeathsNoKill: Number(api.awp_deaths_no_kill ?? 0),
    oneK: Number(mk['1k'] ?? 0),
    twoK: Number(mk['2k'] ?? 0),
    threeK: Number(mk['3k'] ?? 0),
    fourK: Number(mk['4k'] ?? 0),
    fiveK: Number(mk['5k'] ?? 0),
    roundsWithKill: Number(api.rounds_with_kill ?? 0),
    roundsWithKillPct: Number(api.rounds_with_kill_pct ?? 0),
    roundsWithMultiKill: Number(api.rounds_with_multi_kill ?? 0),
    roundsWithMultiKillPct: Number(api.rounds_with_multi_kill_pct ?? 0),
    killsInWonRounds: Number(api.kills_in_won_rounds ?? 0),
    killsPerRoundWin: Number(api.kills_per_round_win ?? 0),
    damageInWonRounds: Number(api.damage_in_won_rounds ?? 0),
    damagePerRoundWin: Number(api.damage_per_round_win ?? 0),
    perfectKills: Number(api.perfect_kills ?? 0),
    damagePerKill: Number(api.damage_per_kill ?? 0),
    knifeKills: Number(api.knife_kills ?? 0),
    pistolVsRifleKills: Number(api.pistol_vs_rifle_kills ?? 0),
    supportRounds: Number(api.support_rounds ?? 0),
    supportRoundsPct: Number(api.support_rounds_pct ?? 0),
    assistedKills: Number(api.assisted_kills ?? 0),
    assistedKillsPct: Number(api.assisted_kills_pct ?? 0),
    assistsPerRound: Number(api.assists_per_round ?? 0),
    attackRounds: Number(api.attack_rounds ?? 0),
    attacksPerRound: Number(api.attacks_per_round ?? 0),
    timeAlivePerRound: Number(api.time_alive_per_round ?? 0),
    lastAliveRounds: Number(api.last_alive_rounds ?? 0),
    lastAlivePct: Number(api.last_alive_pct ?? 0),
    savesOnLoss: Number(api.saves_on_loss ?? 0),
    savesPerRoundLoss: Number(api.saves_per_round_loss ?? 0),
    utilityDamage: Number(api.utility_damage ?? 0),
    utilityDamagePerRound: Number(api.utility_damage_per_round ?? 0),
    utilityKills: Number(api.utility_kills ?? 0),
    utilityKillsPer100Rounds: Number(api.utility_kills_per_100_rounds ?? 0),
    flashesThrown: Number(api.flashes_thrown ?? 0),
    flashesThrownPerRound: Number(api.flashes_thrown_per_round ?? 0),
    flashAssists: Number(api.flash_assists ?? 0),
    flashAssistsPerRound: Number(api.flash_assists_per_round ?? 0),
    enemyFlashDurationPerRound: Number(api.enemy_flash_duration_per_round ?? 0),
    teamFlashCount: Number(api.team_flash_count ?? 0),
    teamFlashDurationPerRound: Number(api.team_flash_duration_per_round ?? 0),
    exitFrags: Number(api.exit_frags ?? 0),
    earlyDeaths: Number(api.early_deaths ?? 0),
    manAdvantageKills: Number(api.man_advantage_kills ?? 0),
    manAdvantageKillsPct: Number(api.man_advantage_kills_pct ?? 0),
    manDisadvantageDeaths: Number(api.man_disadvantage_deaths ?? 0),
    manDisadvantageDeathsPct: Number(api.man_disadvantage_deaths_pct ?? 0),
    lowBuyKills: Number(api.low_buy_kills ?? 0),
    lowBuyKillsPct: Number(api.low_buy_kills_pct ?? 0),
    disadvantagedBuyKills: Number(api.disadvantaged_buy_kills ?? 0),
    disadvantagedBuyKillsPct: Number(api.disadvantaged_buy_kills_pct ?? 0),
    pistolRoundsPlayed: Number(api.pistol_rounds_played ?? 0),
    pistolRoundKills: Number(api.pistol_round_kills ?? 0),
    pistolRoundDeaths: Number(api.pistol_round_deaths ?? 0),
    pistolRoundDamage: Number(api.pistol_round_damage ?? 0),
    pistolRoundsWon: Number(api.pistol_rounds_won ?? 0),
    pistolRoundSurvivals: Number(api.pistol_round_survivals ?? 0),
    pistolRoundMultiKills: Number(api.pistol_round_multi_kills ?? 0),
    pistolRoundRating: Number(api.pistol_round_rating ?? 0),
    tRoundsPlayed: Number(api.t_rounds_played ?? 0),
    tKills: Number(api.t_kills ?? 0),
    tDeaths: Number(api.t_deaths ?? 0),
    tDamage: Number(api.t_damage ?? 0),
    tSurvivals: Number(api.t_survivals ?? 0),
    tRoundsWithMultiKill: Number(api.t_rounds_with_multi_kill ?? 0),
    tEcoKillValue: Number(api.t_eco_kill_value ?? 0),
    tKast: Number(api.t_kast ?? 0),
    tClutchRounds: Number(api.t_clutch_rounds ?? 0),
    tClutchWins: Number(api.t_clutch_wins ?? 0),
    tManAdvantageKills: Number(api.t_man_advantage_kills ?? 0),
    tManAdvantageKillsPct: Number(api.t_man_advantage_kills_pct ?? 0),
    tManDisadvantageDeaths: Number(api.t_man_disadvantage_deaths ?? 0),
    tManDisadvantageDeathsPct: Number(api.t_man_disadvantage_deaths_pct ?? 0),
    tRating: Number(api.t_rating ?? 0),
    tEcoRating: Number(api.t_eco_rating ?? 0),
    ctRoundsPlayed: Number(api.ct_rounds_played ?? 0),
    ctKills: Number(api.ct_kills ?? 0),
    ctDeaths: Number(api.ct_deaths ?? 0),
    ctDamage: Number(api.ct_damage ?? 0),
    ctSurvivals: Number(api.ct_survivals ?? 0),
    ctRoundsWithMultiKill: Number(api.ct_rounds_with_multi_kill ?? 0),
    ctEcoKillValue: Number(api.ct_eco_kill_value ?? 0),
    ctKast: Number(api.ct_kast ?? 0),
    ctClutchRounds: Number(api.ct_clutch_rounds ?? 0),
    ctClutchWins: Number(api.ct_clutch_wins ?? 0),
    ctManAdvantageKills: Number(api.ct_man_advantage_kills ?? 0),
    ctManAdvantageKillsPct: Number(api.ct_man_advantage_kills_pct ?? 0),
    ctManDisadvantageDeaths: Number(api.ct_man_disadvantage_deaths ?? 0),
    ctManDisadvantageDeathsPct: Number(api.ct_man_disadvantage_deaths_pct ?? 0),
    ctRating: Number(api.ct_rating ?? 0),
    ctEcoRating: Number(api.ct_eco_rating ?? 0),
    clutch1v2Attempts: Number(api.clutch_1v2_attempts ?? 0),
    clutch1v2Wins: Number(api.clutch_1v2_wins ?? 0),
    clutch1v3Attempts: Number(api.clutch_1v3_attempts ?? 0),
    clutch1v3Wins: Number(api.clutch_1v3_wins ?? 0),
    clutch1v4Attempts: Number(api.clutch_1v4_attempts ?? 0),
    clutch1v4Wins: Number(api.clutch_1v4_wins ?? 0),
    clutch1v5Attempts: Number(api.clutch_1v5_attempts ?? 0),
    clutch1v5Wins: Number(api.clutch_1v5_wins ?? 0),
    smokesThrown: Number(api.smokes_thrown ?? 0),
    hesThrown: Number(api.hes_thrown ?? 0),
    molotovsThrown: Number(api.molotovs_thrown ?? 0),
    totalNadesThrown: Number(api.total_nades_thrown ?? 0),
    heDamage: Number(api.he_damage ?? 0),
    fireDamage: Number(api.fire_damage ?? 0),
    damageTaken: Number(api.damage_taken ?? 0),
    avgTimeToDeath: Number(api.avg_time_to_death ?? 0),
    tOpeningKills: Number(api.t_opening_kills ?? 0),
    tOpeningDeaths: Number(api.t_opening_deaths ?? 0),
    ctOpeningKills: Number(api.ct_opening_kills ?? 0),
    ctOpeningDeaths: Number(api.ct_opening_deaths ?? 0),
    enemiesFlashed: Number(api.enemies_flashed ?? 0),
    ancientRating: 0,
    ancientGames: 0,
    anubisRating: 0,
    anubisGames: 0,
    dust2Rating: 0,
    dust2Games: 0,
    infernoRating: 0,
    infernoGames: 0,
    mirageRating: 0,
    mirageGames: 0,
    nukeRating: 0,
    nukeGames: 0,
    overpassRating: 0,
    overpassGames: 0,
  };
}

export async function fetchPlayerStats(season?: number): Promise<GroupedPlayer[]> {
  const seasonKey = season ?? 0;
  const cached = playerStatsCache.get(seasonKey);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  const seasonParam = season != null ? `&season=${season}` : '';
  const [regResponse, combineResponse, cscPlayers] = await Promise.all([
    fetch(`${API_BASE}/aggregated?type=regulation${seasonParam}`),
    fetch(`${API_BASE}/aggregated?type=combine${seasonParam}`),
    fetchAllPlayers().catch(() => [] as CscPlayer[]),
  ]);

  const regData = await regResponse.json();
  const combineData = await combineResponse.json();

  const cscTierMap = new Map<string, string>();
  const cscTypeMap = new Map<string, string>();
  for (const player of cscPlayers) {
    const nameLower = player.name.toLowerCase();
    if (player.tier?.name) {
      cscTierMap.set(nameLower, player.tier.name);
    }
    if (player.type) {
      cscTypeMap.set(nameLower, player.type);
    }
  }

  const map = new Map<string, GroupedPlayer>();

  const regResults: Record<string, unknown>[] = regData.results ?? [];
  const combineResults: Record<string, unknown>[] = combineData.results ?? [];

  for (const api of regResults) {
    const steamId = String(api.steam_id ?? '');
    if (!steamId) continue;
    let group = map.get(steamId);
    if (!group) {
      group = {
        steamId,
        name: String(api.name ?? ''),
        cscTier: null,
        cscPlayerType: null,
        regulation: null,
        combine: null,
      };
      map.set(steamId, group);
    }
    group.regulation = mapApiToStats(api);
    group.name = String(api.name ?? '');

    const nameLower = String(api.name ?? '').toLowerCase();
    if (!group.cscTier) {
      group.cscTier = cscTierMap.get(nameLower) ?? null;
    }
    if (!group.cscPlayerType) {
      group.cscPlayerType = cscTypeMap.get(nameLower) ?? null;
    }
  }

  for (const api of combineResults) {
    const steamId = String(api.steam_id ?? '');
    if (!steamId) continue;
    let group = map.get(steamId);
    if (!group) {
      group = {
        steamId,
        name: String(api.name ?? ''),
        cscTier: null,
        cscPlayerType: null,
        regulation: null,
        combine: null,
      };
      map.set(steamId, group);
    }
    group.combine = mapApiToStats(api);

    const nameLower = String(api.name ?? '').toLowerCase();
    if (!group.cscTier) {
      group.cscTier = cscTierMap.get(nameLower) ?? null;
    }
    if (!group.cscPlayerType) {
      group.cscPlayerType = cscTypeMap.get(nameLower) ?? null;
    }
  }

  const result = Array.from(map.values());
  playerStatsCache.set(seasonKey, { data: result, timestamp: Date.now() });
  return result;
}

const matchCache = new Map<string, CacheEntry<MatchPlayer[]>>();
const playerMatchListCache = new Map<string, CacheEntry<{ matchId: string; type: string; season: number }[]>>();

export async function fetchPlayerMatches(
  steamId: string,
  type: string,
  season: number,
): Promise<PlayerTierBreakdown> {
  const cscPlayers = await fetchAllPlayers().catch(() => [] as CscPlayer[]);
  const tierMap = new Map<string, string>();
  for (const p of cscPlayers) {
    if (p.tier?.name) {
      tierMap.set(p.steam64Id, p.tier.name);
    }
  }

  let allMatches: { matchId: string; type: string; season: number }[];
  const listCached = playerMatchListCache.get(steamId);
  if (isCacheValid(listCached)) {
    allMatches = listCached.data;
  } else {
    const playerRes = await fetch(`${API_BASE}/player/${steamId}`);
    const playerData = await playerRes.json();
    const results: Record<string, unknown>[] = playerData.results ?? [];
    allMatches = results.map((r) => ({
      matchId: String(r.match_id ?? ''),
      type: String(r.type ?? ''),
      season: Number(r.season ?? 0),
    })).filter((m) => m.matchId);
    playerMatchListCache.set(steamId, { data: allMatches, timestamp: Date.now() });
  }

  const filteredMatches = allMatches.filter((m) => m.type === type && m.season === season);
  const matchIds = [...new Set(filteredMatches.map((m) => m.matchId))];

  const matchPlayers: MatchWithTiers[] = [];

  await Promise.all(
    matchIds.map(async (matchId) => {
      let players: MatchPlayer[];
      const matchCached = matchCache.get(matchId);
      if (isCacheValid(matchCached)) {
        players = matchCached.data;
      } else {
        const matchRes = await fetch(`${API_BASE}/match/${matchId}`);
        const matchData = await matchRes.json();
        const results: Record<string, unknown>[] = matchData.results ?? [];
        players = results.map((r) => ({
          steamId: String(r.steam_id ?? ''),
          name: String(r.name ?? ''),
          teamName: String(r.team_name ?? ''),
        }));
        matchCache.set(matchId, { data: players, timestamp: Date.now() });
      }

      const teams = new Set(players.map((p) => p.teamName));
      const teamArray = [...teams];
      const teamA = teamArray[0] ?? '';
      const teamB = teamArray[1] ?? '';

      const matchTierCounts = new Map<string, number>();
      const playersWithTiers = players.map((p) => {
        const tier = tierMap.get(p.steamId) ?? null;
        matchTierCounts.set(tier ?? 'Unknown', (matchTierCounts.get(tier ?? 'Unknown') ?? 0) + 1);
        return { ...p, tier };
      });

      const totalInMatch = playersWithTiers.length;
      const matchBreakdown: TierBreakdown[] = [];
      for (const [tier, count] of matchTierCounts) {
        matchBreakdown.push({ tier, count, pct: count / totalInMatch });
      }
      matchBreakdown.sort((a, b) => b.count - a.count);

      matchPlayers.push({
        matchId,
        teamA,
        teamB,
        players: playersWithTiers,
        tierBreakdown: matchBreakdown,
      });
    })
  );

  matchPlayers.sort((a, b) => a.matchId.localeCompare(b.matchId));

  const overallCounts = new Map<string, number>();
  let totalPlayers = 0;
  for (const m of matchPlayers) {
    for (const tb of m.tierBreakdown) {
      overallCounts.set(tb.tier, (overallCounts.get(tb.tier) ?? 0) + tb.count);
      totalPlayers += tb.count;
    }
  }

  const overall: TierBreakdown[] = [];
  for (const [tier, count] of overallCounts) {
    overall.push({ tier, count, pct: totalPlayers > 0 ? count / totalPlayers : 0 });
  }
  overall.sort((a, b) => b.pct - a.pct);

  return { overall, matches: matchPlayers, totalPlayers };
}
