import Papa from 'papaparse';
import type { PlayerStats, GroupedPlayer } from './types';

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
        econImpact: num(r[33]),
        roundImpact: num(r[34]),
        probabilitySwing: num(r[35]),
        probabilitySwingPerRound: num(r[36]),
        clutchRounds: num(r[37]),
        clutchWins: num(r[38]),
        clutchPointsPerRound: num(r[39]),
        clutch1v1Attempts: num(r[40]),
        clutch1v1Wins: num(r[41]),
        clutch1v1WinPct: num(r[42]),
        tradeKills: num(r[43]),
        tradeKillsPerRound: num(r[44]),
        tradeKillsPct: num(r[45]),
        fastTrades: num(r[46]),
        tradedDeaths: num(r[47]),
        tradedDeathsPerRound: num(r[48]),
        tradedDeathsPct: num(r[49]),
        tradeDenials: num(r[50]),
        savedByTeammate: num(r[51]),
        savedByTeammatePerRound: num(r[52]),
        savedTeammate: num(r[53]),
        savedTeammatePerRound: num(r[54]),
        openingDeathsTraded: num(r[55]),
        openingDeathsTradedPct: num(r[56]),
        awpKills: num(r[57]),
        awpKillsPerRound: num(r[58]),
        awpKillsPct: num(r[59]),
        roundsWithAwpKill: num(r[60]),
        roundsWithAwpKillPct: num(r[61]),
        awpMultiKillRounds: num(r[62]),
        awpMultiKillRoundsPerRound: num(r[63]),
        awpOpeningKills: num(r[64]),
        awpOpeningKillsPerRound: num(r[65]),
        awpDeaths: num(r[66]),
        awpDeathsNoKill: num(r[67]),
        oneK: num(r[68]),
        twoK: num(r[69]),
        threeK: num(r[70]),
        fourK: num(r[71]),
        fiveK: num(r[72]),
        roundsWithKill: num(r[73]),
        roundsWithKillPct: num(r[74]),
        roundsWithMultiKill: num(r[75]),
        roundsWithMultiKillPct: num(r[76]),
        killsInWonRounds: num(r[77]),
        killsPerRoundWin: num(r[78]),
        damageInWonRounds: num(r[79]),
        damagePerRoundWin: num(r[80]),
        perfectKills: num(r[81]),
        damagePerKill: num(r[82]),
        knifeKills: num(r[83]),
        pistolVsRifleKills: num(r[84]),
        supportRounds: num(r[85]),
        supportRoundsPct: num(r[86]),
        assistedKills: num(r[87]),
        assistedKillsPct: num(r[88]),
        assistsPerRound: num(r[89]),
        attackRounds: num(r[90]),
        attacksPerRound: num(r[91]),
        timeAlivePerRound: num(r[92]),
        lastAliveRounds: num(r[93]),
        lastAlivePct: num(r[94]),
        savesOnLoss: num(r[95]),
        savesPerRoundLoss: num(r[96]),
        utilityDamage: num(r[97]),
        utilityDamagePerRound: num(r[98]),
        utilityKills: num(r[99]),
        utilityKillsPer100Rounds: num(r[100]),
        flashesThrown: num(r[101]),
        flashesThrownPerRound: num(r[102]),
        flashAssists: num(r[103]),
        flashAssistsPerRound: num(r[104]),
        enemyFlashDurationPerRound: num(r[105]),
        teamFlashCount: num(r[106]),
        teamFlashDurationPerRound: num(r[107]),
        exitFrags: num(r[108]),
        earlyDeaths: num(r[109]),
        lowBuyKills: num(r[110]),
        lowBuyKillsPct: num(r[111]),
        disadvantagedBuyKills: num(r[112]),
        disadvantagedBuyKillsPct: num(r[113]),
        pistolRoundsPlayed: num(r[114]),
        pistolRoundKills: num(r[115]),
        pistolRoundDeaths: num(r[116]),
        pistolRoundDamage: num(r[117]),
        pistolRoundsWon: num(r[118]),
        pistolRoundSurvivals: num(r[119]),
        pistolRoundMultiKills: num(r[120]),
        pistolRoundRating: num(r[121]),
        tRoundsPlayed: num(r[122]),
        tKills: num(r[123]),
        tDeaths: num(r[124]),
        tDamage: num(r[125]),
        tSurvivals: num(r[126]),
        tRoundsWithMultiKill: num(r[127]),
        tEcoKillValue: num(r[128]),
        tKast: num(r[129]),
        tClutchRounds: num(r[130]),
        tClutchWins: num(r[131]),
        tRating: num(r[132]),
        tEcoRating: num(r[133]),
        ctRoundsPlayed: num(r[134]),
        ctKills: num(r[135]),
        ctDeaths: num(r[136]),
        ctDamage: num(r[137]),
        ctSurvivals: num(r[138]),
        ctRoundsWithMultiKill: num(r[139]),
        ctEcoKillValue: num(r[140]),
        ctKast: num(r[141]),
        ctClutchRounds: num(r[142]),
        ctClutchWins: num(r[143]),
        ctRating: num(r[144]),
        ctEcoRating: num(r[145]),
        ancientRating: num(r[146]),
        ancientGames: num(r[147]),
        anubisRating: num(r[148]),
        anubisGames: num(r[149]),
        dust2Rating: num(r[150]),
        dust2Games: num(r[151]),
        infernoRating: num(r[152]),
        infernoGames: num(r[153]),
        mirageRating: num(r[154]),
        mirageGames: num(r[155]),
        nukeRating: num(r[156]),
        nukeGames: num(r[157]),
    overpassRating: num(r[158]),
    overpassGames: num(r[159]),
  };
}

export async function fetchPlayerStats(): Promise<GroupedPlayer[]> {
  const response = await fetch(SHEET_CSV_URL);
  const csvText = await response.text();

  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  if (rows.length < 2) return [];

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
    }
  }

  return Array.from(map.values());
}
