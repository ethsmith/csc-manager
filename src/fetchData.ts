import Papa from 'papaparse';
import type { PlayerStats, GroupedPlayer } from './types';
import { fetchAllPlayers, type CscPlayer } from './fetchFranchises';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1lcZ80NLIG2vLQvS7G3zL8tPcc6_iV24PG_V-ZmZNWHo/gviz/tq?tqx=out:csv&gid=289298243';

function num(val: string | undefined): number {
  if (!val || val.trim() === '') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function isScrimTier(tier: string): boolean {
  return tier.toLowerCase().startsWith('team_');
}

function parseRow(r: string[]): PlayerStats | null {
  if (!r[0] || !r[1]) return null;
  return {
    steamId: r[0] ?? '',
    name: r[1] ?? '',
    tier: r[2] ?? '',
        games: num(r[3]),
        finalRating: num(r[4]),
        hltvRating: num(r[5]),
        roundsPlayed: num(r[6]),
        roundsWon: num(r[7]),
        roundsLost: num(r[8]),
        kills: num(r[9]),
        assists: num(r[10]),
        deaths: num(r[11]),
        damage: num(r[12]),
        adr: num(r[13]),
        kpr: num(r[14]),
        dpr: num(r[15]),
        kast: num(r[16]),
        survival: num(r[17]),
        headshots: num(r[18]),
        headshotPct: num(r[19]),
        avgTimeToKill: num(r[20]),
        openingKills: num(r[21]),
        openingDeaths: num(r[22]),
        openingAttempts: num(r[23]),
        openingSuccesses: num(r[24]),
        openingKillsPerRound: num(r[25]),
        openingDeathsPerRound: num(r[26]),
        openingAttemptsPct: num(r[27]),
        openingSuccessPct: num(r[28]),
        roundsWonAfterOpening: num(r[29]),
        winPctAfterOpeningKill: num(r[30]),
        ecoKillValue: num(r[31]),
        ecoDeathValue: num(r[32]),
        duelSwing: num(r[33]),
        duelSwingPerRound: num(r[34]),
        econImpact: num(r[35]),
        roundImpact: num(r[36]),
        probabilitySwing: num(r[37]),
        probabilitySwingPerRound: num(r[38]),
        clutchRounds: num(r[39]),
        clutchWins: num(r[40]),
        clutchPointsPerRound: num(r[41]),
        clutch1v1Attempts: num(r[42]),
        clutch1v1Wins: num(r[43]),
        clutch1v1WinPct: num(r[44]),
        tradeKills: num(r[45]),
        tradeKillsPerRound: num(r[46]),
        tradeKillsPct: num(r[47]),
        fastTrades: num(r[48]),
        tradedDeaths: num(r[49]),
        tradedDeathsPerRound: num(r[50]),
        tradedDeathsPct: num(r[51]),
        tradeDenials: num(r[52]),
        savedByTeammate: num(r[53]),
        savedByTeammatePerRound: num(r[54]),
        savedTeammate: num(r[55]),
        savedTeammatePerRound: num(r[56]),
        openingDeathsTraded: num(r[57]),
        openingDeathsTradedPct: num(r[58]),
        awpKills: num(r[59]),
        awpKillsPerRound: num(r[60]),
        awpKillsPct: num(r[61]),
        roundsWithAwpKill: num(r[62]),
        roundsWithAwpKillPct: num(r[63]),
        awpMultiKillRounds: num(r[64]),
        awpMultiKillRoundsPerRound: num(r[65]),
        awpOpeningKills: num(r[66]),
        awpOpeningKillsPerRound: num(r[67]),
        awpDeaths: num(r[68]),
        awpDeathsNoKill: num(r[69]),
        oneK: num(r[70]),
        twoK: num(r[71]),
        threeK: num(r[72]),
        fourK: num(r[73]),
        fiveK: num(r[74]),
        roundsWithKill: num(r[75]),
        roundsWithKillPct: num(r[76]),
        roundsWithMultiKill: num(r[77]),
        roundsWithMultiKillPct: num(r[78]),
        killsInWonRounds: num(r[79]),
        killsPerRoundWin: num(r[80]),
        damageInWonRounds: num(r[81]),
        damagePerRoundWin: num(r[82]),
        perfectKills: num(r[83]),
        damagePerKill: num(r[84]),
        knifeKills: num(r[85]),
        pistolVsRifleKills: num(r[86]),
        supportRounds: num(r[87]),
        supportRoundsPct: num(r[88]),
        assistedKills: num(r[89]),
        assistedKillsPct: num(r[90]),
        assistsPerRound: num(r[91]),
        attackRounds: num(r[92]),
        attacksPerRound: num(r[93]),
        timeAlivePerRound: num(r[94]),
        lastAliveRounds: num(r[95]),
        lastAlivePct: num(r[96]),
        savesOnLoss: num(r[97]),
        savesPerRoundLoss: num(r[98]),
        utilityDamage: num(r[99]),
        utilityDamagePerRound: num(r[100]),
        utilityKills: num(r[101]),
        utilityKillsPer100Rounds: num(r[102]),
        flashesThrown: num(r[103]),
        flashesThrownPerRound: num(r[104]),
        flashAssists: num(r[105]),
        flashAssistsPerRound: num(r[106]),
        enemyFlashDurationPerRound: num(r[107]),
        teamFlashCount: num(r[108]),
        teamFlashDurationPerRound: num(r[109]),
        exitFrags: num(r[110]),
        earlyDeaths: num(r[111]),
        manAdvantageKills: num(r[112]),
        manAdvantageKillsPct: num(r[113]),
        manDisadvantageDeaths: num(r[114]),
        manDisadvantageDeathsPct: num(r[115]),
        lowBuyKills: num(r[116]),
        lowBuyKillsPct: num(r[117]),
        disadvantagedBuyKills: num(r[118]),
        disadvantagedBuyKillsPct: num(r[119]),
        pistolRoundsPlayed: num(r[120]),
        pistolRoundKills: num(r[121]),
        pistolRoundDeaths: num(r[122]),
        pistolRoundDamage: num(r[123]),
        pistolRoundsWon: num(r[124]),
        pistolRoundSurvivals: num(r[125]),
        pistolRoundMultiKills: num(r[126]),
        pistolRoundRating: num(r[127]),
        tRoundsPlayed: num(r[128]),
        tKills: num(r[129]),
        tDeaths: num(r[130]),
        tDamage: num(r[131]),
        tSurvivals: num(r[132]),
        tRoundsWithMultiKill: num(r[133]),
        tEcoKillValue: num(r[134]),
        tKast: num(r[135]),
        tClutchRounds: num(r[136]),
        tClutchWins: num(r[137]),
        tManAdvantageKills: num(r[138]),
        tManAdvantageKillsPct: num(r[139]),
        tManDisadvantageDeaths: num(r[140]),
        tManDisadvantageDeathsPct: num(r[141]),
        tRating: num(r[142]),
        tEcoRating: num(r[143]),
        ctRoundsPlayed: num(r[144]),
        ctKills: num(r[145]),
        ctDeaths: num(r[146]),
        ctDamage: num(r[147]),
        ctSurvivals: num(r[148]),
        ctRoundsWithMultiKill: num(r[149]),
        ctEcoKillValue: num(r[150]),
        ctKast: num(r[151]),
        ctClutchRounds: num(r[152]),
        ctClutchWins: num(r[153]),
        ctManAdvantageKills: num(r[154]),
        ctManAdvantageKillsPct: num(r[155]),
        ctManDisadvantageDeaths: num(r[156]),
        ctManDisadvantageDeathsPct: num(r[157]),
        ctRating: num(r[158]),
        ctEcoRating: num(r[159]),
        clutch1v2Attempts: num(r[160]),
        clutch1v2Wins: num(r[161]),
        clutch1v3Attempts: num(r[162]),
        clutch1v3Wins: num(r[163]),
        clutch1v4Attempts: num(r[164]),
        clutch1v4Wins: num(r[165]),
        clutch1v5Attempts: num(r[166]),
        clutch1v5Wins: num(r[167]),
        smokesThrown: num(r[168]),
        hesThrown: num(r[169]),
        molotovsThrown: num(r[170]),
        totalNadesThrown: num(r[171]),
        heDamage: num(r[172]),
        fireDamage: num(r[173]),
        damageTaken: num(r[174]),
        avgTimeToDeath: num(r[175]),
        tOpeningKills: num(r[176]),
        tOpeningDeaths: num(r[177]),
        ctOpeningKills: num(r[178]),
        ctOpeningDeaths: num(r[179]),
        enemiesFlashed: num(r[180]),
        ancientRating: num(r[181]),
        ancientGames: num(r[182]),
        anubisRating: num(r[183]),
        anubisGames: num(r[184]),
        dust2Rating: num(r[185]),
        dust2Games: num(r[186]),
        infernoRating: num(r[187]),
        infernoGames: num(r[188]),
        mirageRating: num(r[189]),
        mirageGames: num(r[190]),
        nukeRating: num(r[191]),
        nukeGames: num(r[192]),
        overpassRating: num(r[193]),
        overpassGames: num(r[194]),
  };
}

export async function fetchPlayerStats(): Promise<GroupedPlayer[]> {
  // Fetch both stats and CSC player data in parallel
  const [csvResponse, cscPlayers] = await Promise.all([
    fetch(SHEET_CSV_URL),
    fetchAllPlayers().catch(() => [] as CscPlayer[]),
  ]);
  
  const csvText = await csvResponse.text();

  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  if (rows.length < 2) return [];

  // Build maps of CSC player names (lowercase) to their tier and type
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

  const dataRows = rows.slice(1);
  const allStats = dataRows
    .map(parseRow)
    .filter((p): p is PlayerStats => p !== null);

  const map = new Map<string, GroupedPlayer>();

  for (const stats of allStats) {
    let group = map.get(stats.steamId);
    if (!group) {
      group = {
        steamId: stats.steamId,
        name: stats.name,
        cscTier: null,
        cscPlayerType: null,
        regulation: [],
        scrim: [],
      };
      map.set(stats.steamId, group);
    }

    const entry = { stats, tier: stats.tier };

    if (isScrimTier(stats.tier)) {
      group.scrim.push(entry);
    } else {
      // Use the regulation name as the display name
      group.name = stats.name;
      group.regulation.push(entry);
      // Try to match CSC tier and type by player name
      const nameLower = stats.name.toLowerCase();
      if (!group.cscTier) {
        group.cscTier = cscTierMap.get(nameLower) ?? null;
      }
      if (!group.cscPlayerType) {
        group.cscPlayerType = cscTypeMap.get(nameLower) ?? null;
      }
    }
  }

  return Array.from(map.values());
}
