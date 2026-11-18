/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Gamepad2, 
  Heart, 
  Play, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Bot, 
  Users, 
  User, 
  Trophy, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Zap,
  Radio,
  Disc,
  Crosshair,
  RotateCcw,
  CheckSquare,
  Square,
  Droplet,
  Grid3X3,
  Target,
  Orbit,
  Activity,
  Copy,
  Coins,
  Snowflake,
  Bomb,
  Cpu,
  Scale,
  LogOut,
  Globe,
  Wifi
} from 'lucide-react';
import DraftScreen from './components/DraftScreen';
import GoogleLoginButton from './components/GoogleLoginButton';

const RAW_WORKER_URL = (
  import.meta.env.VITE_WORKER_URL ||
  import.meta.env.VITE_APP_URL ||
  'http://127.0.0.1:8787'
).replace(/\/+$/, '');

const WORKER_HTTP_URL = RAW_WORKER_URL.replace(/^ws(s?):\/\//i, 'http$1://');
const WORKER_WS_URL = RAW_WORKER_URL.replace(/^http(s?):\/\//i, 'ws$1://');

function sendWsEvent(
  ws: WebSocket | null | undefined,
  type: string,
  payload?: unknown,
  requestId?: string
): boolean {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(requestId ? { type, payload, requestId } : { type, payload }));
    return true;
  } catch {
    return false;
  }
}

/* ==========================================================================
   ARENA THEME PRESETS
   ========================================================================== */
export interface ArenaTheme {
  id: string;
  name: string;
  description: string;
  wallColor: string;
  wallGlow: string;
  floorCenter: string;
  floorMid: string;
  floorOuter: string;
  gridColor: string;
  centerRingColor: string;
}

export const ARENA_THEMES: ArenaTheme[] = [
  {
    id: 'cyber-neon',
    name: 'Tactical Light Grid',
    description: 'Clean high-contrast light grid floor with electric cyan containment walls',
    wallColor: '#0284c7',
    wallGlow: '#38bdf8',
    floorCenter: '#ffffff',
    floorMid: '#f8fafc',
    floorOuter: '#f1f5f9',
    gridColor: 'rgba(148, 163, 184, 0.45)',
    centerRingColor: 'rgba(2, 132, 199, 0.35)',
  },
  {
    id: 'magma-forge',
    name: 'Solar Foundry Grid',
    description: 'High-contrast warm ivory grid floor enclosed in blazing amber barriers',
    wallColor: '#ea580c',
    wallGlow: '#f97316',
    floorCenter: '#fffbeb',
    floorMid: '#fef3c7',
    floorOuter: '#fde68a',
    gridColor: 'rgba(217, 119, 6, 0.32)',
    centerRingColor: 'rgba(234, 88, 12, 0.35)',
  },
  {
    id: 'void-nebula',
    name: 'Aether Prism Grid',
    description: 'Crisp alabaster laboratory grid enclosed in hyper-violet shields',
    wallColor: '#7e22ce',
    wallGlow: '#a855f7',
    floorCenter: '#faf5ff',
    floorMid: '#f3e8ff',
    floorOuter: '#e9d5ff',
    gridColor: 'rgba(147, 51, 234, 0.28)',
    centerRingColor: 'rgba(126, 34, 206, 0.35)',
  },
  {
    id: 'toxic-reactor',
    name: 'Bio-Lab Cleanroom',
    description: 'High-visibility sterile mint grid with high-voltage emerald barriers',
    wallColor: '#059669',
    wallGlow: '#10b981',
    floorCenter: '#f0fdf4',
    floorMid: '#dcfce7',
    floorOuter: '#bbf7d0',
    gridColor: 'rgba(16, 185, 129, 0.32)',
    centerRingColor: 'rgba(5, 150, 105, 0.35)',
  },
];

/* ==========================================================================
   BALL TYPE DEFINITIONS & ROSTER METADATA (26 UNIQUE CLASSES)
   ========================================================================== */
export type BallTypeId = 
  | 'standard' 
  | 'quadblade' 
  | 'aura' 
  | 'venom' 
  | 'mathgrid' 
  | 'sniper'
  | 'bow'
  | 'blackhole'
  | 'vampire'
  | 'mirror'
  | 'jackpot'
  | 'frost'
  | 'blink'
  | 'trap'
  | 'inertia'
  | 'swarm'
  | 'engineer'
  | 'rubberpirate'
  | 'ninjashadow'
  | 'supersaiyan'
  | 'soulreaper'
  | 'threesword'
  | 'limitless'
  | 'kingofcurses'
  | 'waterbreathing'
  | 'thunderflash'
  | 'scoutspinner'
  | 'starplatinum'
  | 'alchemist'
  | 'shinigaminote'
  | 'oneforsmash'
  | 'capedbaldy'
  | 'natsu'
  | 'todoroki'
  | 'mustang'
  | 'esdeath'
  | 'aokiji'
  | 'killua'
  | 'korosensei'
  | 'yoruichi'
  | 'minato'
  | 'sonic'
  | 'megumin'
  | 'yami'
  | 'fushiguro'
  | 'lucy'
  | 'rimuru'
  | 'vash'
  | 'deaththekid'
  | 'sinon'
  | 'hawkeye'
  | 'escanor'
  | 'whitebeard'
  | 'kenpachi'
  | 'allmight'
  | 'broly'
  | 'hisoka'
  | 'shikamaru'
  | 'kurapika'
  | 'shigaraki'
  | 'katakuri'
  | 'eva01'
  | 'gundam'
  | 'motoko'
  | 'spike'
  | 'edward';

export interface BallTypeInfo {
  id: BallTypeId;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BALL_TYPES: BallTypeInfo[] = [
  // Batch 4 (Fire & Ice)
  {
    id: 'natsu',
    name: 'Natsu',
    badge: 'Fairy Tail • Fire Dragon Roar',
    description: 'Inspired by Natsu (🐉). Breathes a roaring cone of crimson Dragon Slayer flames every 3.5s and ignites on collision as his Dragon Force heats up!',
    icon: Flame,
  },
  {
    id: 'todoroki',
    name: 'Todoroki',
    badge: 'MHA • Half-Cold Half-Hot',
    description: 'Inspired by Todoroki (🌓). Split cryo-ice and hellfire body; alternates launching freezing glacier waves and scorching prominence fire blasts!',
    icon: Snowflake,
  },
  {
    id: 'mustang',
    name: 'Roy Mustang',
    badge: 'FMA • Ignition Glove Snap',
    description: 'Inspired by Roy Mustang (🔥). Snaps his ignition gloves every 3s to pinpoint-detonate a high-temperature alchemy explosion directly on the enemy!',
    icon: Flame,
  },
  {
    id: 'esdeath',
    name: 'Esdeath',
    badge: 'Akame ga Kill • Icicle Volley & Freeze',
    description: 'Inspired by Esdeath (🧊). Summons orbiting ice cavalry spears that fire at the enemy and triggers Mahapadma cryo-freeze waves!',
    icon: Snowflake,
  },
  {
    id: 'aokiji',
    name: 'Aokiji',
    badge: 'One Piece • Ice Age & Pheasant Beak',
    description: 'Inspired by Aokiji (❄️). Leaves a freezing Ice Age trail and launches a glacial Pheasant Beak ice-bird projectile that freezes the opponent!',
    icon: Snowflake,
  },
  // Batch 5 (Assassins & Speed)
  {
    id: 'killua',
    name: 'Killua',
    badge: 'HxH • Godspeed Whirlwind',
    description: 'Inspired by Killua (⚡). Cloaked in Godspeed lightning (+35% speed); automatically zaps nearby enemies and deflects projectiles with electric reflexes!',
    icon: Zap,
  },
  {
    id: 'korosensei',
    name: 'Koro-sensei',
    badge: 'Assassination Classroom • Mach 20',
    description: 'Inspired by Koro-sensei (🐙). Blurs across the arena at Mach 20 speed, shifting face stripes by mood and leaving afterimages that halve collision damage!',
    icon: Sparkles,
  },
  {
    id: 'yoruichi',
    name: 'Yoruichi',
    badge: 'Bleach • Shunpo & Shunko Thunder',
    description: 'Inspired by Yoruichi (🐈‍⬛). Uses Flash Step every 3.5s to blink behind the opponent and detonate a golden-violet Shunko lightning burst!',
    icon: Zap,
  },
  {
    id: 'minato',
    name: 'Minato',
    badge: 'Naruto • Flying Raijin & Rasengan',
    description: 'Inspired by Minato (🗡️). Scatters Flying Raijin marked kunai across the floor and instantaneously warps to the kunai closest to the enemy for a Rasengan slam!',
    icon: Zap,
  },
  {
    id: 'sonic',
    name: 'Sonic',
    badge: 'OPM • Ten Shadows Burial & Shuriken',
    description: 'Inspired by Speed-o-Sound Sonic (🥷). Projects 4 high-speed ninja afterimages and hurls exploding wind shuriken at the opponent!',
    icon: Crosshair,
  },
  // Batch 6 (Magic & Summoners)
  {
    id: 'megumin',
    name: 'Megumin',
    badge: 'Konosuba • 1 Massive Explosion -> Exhausted',
    description: 'Inspired by Megumin (🧙‍♀️). Chants for 6s to unleash ONE massive arena-wide EXPLOSION dealing catastrophic damage, then collapses exhausted for the rest of the round!',
    icon: Bomb,
  },
  {
    id: 'yami',
    name: 'Yami',
    badge: 'Black Clover • Dimension Slash',
    description: 'Inspired by Yami (🌑). Cloaked in Dark Magic that absorbs nearby projectiles and fires a screen-splitting Dark Cloaked Dimension Slash every 4.5s!',
    icon: Orbit,
  },
  {
    id: 'fushiguro',
    name: 'Fushiguro',
    badge: 'JJK • Ten Shadows Animal Summons',
    description: 'Inspired by Fushiguro (🐺). Summons shadowy animal canvas shapes (Divine Dog & Nue) from shadow puddles that autonomously chase and strike the enemy!',
    icon: Copy,
  },
  {
    id: 'lucy',
    name: 'Lucy',
    badge: 'Fairy Tail • Celestial Spirit Gates',
    description: 'Inspired by Lucy (🗝️). Opens golden Celestial Spirit gates that orbit her and rain down Urano Metria starlight projectiles!',
    icon: Sparkles,
  },
  {
    id: 'rimuru',
    name: 'Rimuru',
    badge: 'Slime • Predator Projectile Absorption',
    description: 'Inspired by Rimuru (💧). Translucent slime body absorbs incoming enemy projectiles to heal HP and fires back stored energy as Black Lightning!',
    icon: Droplet,
  },
  // Batch 7 (Snipers & Gunners)
  {
    id: 'vash',
    name: 'Vash',
    badge: 'Trigun • Ricochet Revolver & Angel Arm',
    description: 'Inspired by Vash the Stampede (🔫). Fires silver revolver bullets that ricochet off arena walls to hit the enemy!',
    icon: Target,
  },
  {
    id: 'deaththekid',
    name: 'Death Kid',
    badge: 'Soul Eater • Twin Demon Pistols',
    description: 'Inspired by Death The Kid (💀). Wields symmetrical dual Demon Twin Pistols that fire parallel soul-resonance laser blasts every 2.2s!',
    icon: Crosshair,
  },
  {
    id: 'sinon',
    name: 'Sinon',
    badge: 'SAO • Hecate II Anti-Materiel Rifle',
    description: 'Inspired by Sinon (🎯). Locks on with a green laser sight and fires armor-piercing Hecate II rounds with heavy knockback!',
    icon: Target,
  },
  {
    id: 'hawkeye',
    name: 'Hawkeye',
    badge: 'FMA • Triple Pinpoint Volley',
    description: 'Inspired by Riza Hawkeye (🦅). Master military sharpshooter that fires a rapid 3-round burst of high-velocity pinpoint bullets every 2.8s!',
    icon: Target,
  },
  // Batch 8 (Heavy Hitters)
  {
    id: 'escanor',
    name: 'Escanor',
    badge: 'Seven Deadly Sins • Sunshine Timer Scaling',
    description: 'Inspired by Escanor (☀️). Gets progressively larger, heavier, and stronger every second as the round timer approaches High Noon, hurling Cruel Sun fireballs!',
    icon: Flame,
  },
  {
    id: 'whitebeard',
    name: 'Whitebeard',
    badge: 'One Piece • Screen-Shaking Quakes',
    description: 'Inspired by Whitebeard (🌊). Shatters the air with Gura Gura fracture lines every 4.5s, triggering violent screen-shaking quakes that damage and hurl the enemy!',
    icon: Activity,
  },
  {
    id: 'kenpachi',
    name: 'Kenpachi',
    badge: 'Bleach • Unpatched Berserker Slash',
    description: 'Inspired by Kenpachi (👹). Radiates golden spiritual pressure and swings a jagged cleaver; deals heavier collision and slash damage the lower his HP drops!',
    icon: Flame,
  },
  {
    id: 'allmight',
    name: 'All Might',
    badge: 'MHA • United States of Smash',
    description: 'Inspired by All Might (💪). Heavy titan brawler that unleashes golden air-pressure shockwaves and tornado smashes on impact!',
    icon: Trophy,
  },
  {
    id: 'broly',
    name: 'Broly',
    badge: 'DBZ • Legendary Bio-Energy Barrage',
    description: 'Inspired by Broly (🟢). Surrounded by an expanding neon-green Legendary aura that fires barrages of volatile Eraser Cannon orbs!',
    icon: Zap,
  },
  // Batch 9 (Weird & Strategic)
  {
    id: 'hisoka',
    name: 'Hisoka',
    badge: 'HxH • Elastic Bungee Gum Tether',
    description: 'Inspired by Hisoka (🃏). Attaches elastic pink Bungee Gum to the enemy; when stretched, it violently snaps the enemy back into a high-speed collision!',
    icon: Sparkles,
  },
  {
    id: 'shikamaru',
    name: 'Shikamaru',
    badge: 'Naruto • Shadow Possession Bind',
    description: 'Inspired by Shikamaru (♟️). Extends a black shadow line across the floor that binds the enemy in Shadow Possession, forcing them to mirror movements and take tick damage!',
    icon: Disc,
  },
  {
    id: 'kurapika',
    name: 'Kurapika',
    badge: 'HxH • Judgment Chain & Emperor Time',
    description: 'Inspired by Kurapika (⛓️). Whirls 5 metallic chains that snare the opponent and siphon health while Scarlet Eyes glow!',
    icon: Orbit,
  },
  {
    id: 'shigaraki',
    name: 'Shigaraki',
    badge: 'MHA • Touch Decay & Crumbling Ground',
    description: 'Inspired by Shigaraki (🖐️). Decays enemy health over 4s on touch or via spreading dark-purple ground cracks!',
    icon: Droplet,
  },
  {
    id: 'katakuri',
    name: 'Katakuri',
    badge: 'One Piece • Future Sight Dodge & Mochi',
    description: 'Inspired by Katakuri (🍩). Uses Future Sight Haki to predict and phase through attacks every 4s while firing Peerless Donut Mochi punches!',
    icon: Orbit,
  },
  // Batch 10 (Mecha & Sci-Fi)
  {
    id: 'eva01',
    name: 'Eva-01',
    badge: 'Evangelion • A.T. Field & Low-HP Berserk',
    description: 'Inspired by Eva Unit-01 (👾). Wields a silver Progressive Knife, projects an octagonal orange A.T. Field, and drops into BERSERK Mode below 45% HP with a blood-red aura and 1.5x speed & collision damage!',
    icon: Cpu,
  },
  {
    id: 'gundam',
    name: 'Gundam',
    badge: 'Mobile Suit • Beam Rifle & Fin Funnels',
    description: 'Inspired by Gundam (🛡️). Fires high-energy pink Beam Rifle blasts every 2.2s while 2 Fin Funnels orbit and zap the enemy!',
    icon: Cpu,
  },
  {
    id: 'motoko',
    name: 'Motoko',
    badge: 'Ghost in the Shell • Thermoptic Invisibility',
    description: 'Inspired by Major Motoko (👁️). Cloaks in Thermoptic Camouflage to turn invisible and break enemy targeting before landing cyber-ambush crits!',
    icon: User,
  },
  {
    id: 'spike',
    name: 'Spike',
    badge: 'Cowboy Bebop • Jeet Kune Do Counter',
    description: 'Inspired by Spike Spiegel (🚬). Flows like water; periodically enters a Martial Arts Counter stance that reflects enemy collision damage back at 1.8x force!',
    icon: Crosshair,
  },
  {
    id: 'edward',
    name: 'Edward',
    badge: 'Cowboy Bebop • System Hack & Disable',
    description: 'Inspired by Radical Edward (💻). Broadcasts digital hacking pulses every 5s that hack and disable the enemy ball’s special abilities for 2.8 seconds!',
    icon: Cpu,
  },
  {
    id: 'starplatinum',
    name: 'Jotaro',
    badge: 'Jotaro • 12s Time Stop (2.5s Freeze)',
    description: 'Inspired by Jotaro (⭐). Every 12s triggers a 2.5s Time Stop that completely freezes the enemy ball and all projectiles in place while retaining full movement!',
    icon: Sparkles,
  },
  {
    id: 'alchemist',
    name: 'Edward Elric',
    badge: 'Edward Elric • Solid Stone Pillars',
    description: 'Inspired by Edward Elric (⚙️). Every 4s raises a static, solid grey stone pillar from the arena floor that permanently alters bounce angles and blocks projectiles!',
    icon: Settings2,
  },
  {
    id: 'shinigaminote',
    name: 'Light Yagami',
    badge: 'Death Note • 20s Unharmed Instant KO',
    description: 'Inspired by Death Note (📓). Deals almost zero collision damage, but avoiding all damage for 20s straight triggers an instant-kill Heart Attack on the enemy!',
    icon: Activity,
  },
  {
    id: 'oneforsmash',
    name: 'Deku',
    badge: 'Deku • Max Smash + 15% Recoil',
    description: 'Inspired by Deku (✊). Highest collision multiplier in the game for catastrophic impact damage, but takes 15% recoil damage to its own health bar on every hit!',
    icon: Zap,
  },
  {
    id: 'capedbaldy',
    name: 'Saitama',
    badge: 'Saitama • Slow Ramp / 9999 Instant KO',
    description: 'Inspired by Saitama (👊). Moves incredibly slowly with terrible acceleration, but landing a direct high-speed collision deals 9999 damage (Instant KO)!',
    icon: Trophy,
  },
  {
    id: 'limitless',
    name: 'Gojo',
    badge: 'Gojo • Infinity 90% Slow Aura',
    description: 'Inspired by Gojo (♾️). Visible Infinity aura ring reduces the velocity of any entering enemy ball or projectile by 90%, preventing high-speed collisions!',
    icon: Orbit,
  },
  {
    id: 'kingofcurses',
    name: 'Sukuna',
    badge: 'Sukuna • Invisible Domain Flurry',
    description: 'Inspired by Sukuna (🔪). Invisible domain radius; if the enemy stays within it for >2s, they are hit by 5 rapid, unavoidable slash animations for heavy damage!',
    icon: Flame,
  },
  {
    id: 'waterbreathing',
    name: 'Tanjiro',
    badge: 'Tanjiro • Flowing Water Trail',
    description: 'Inspired by Tanjiro (🌊). Leaves a trailing path of blue water canvas shapes as it moves; enemies touching the water trail are slowed and take tick damage!',
    icon: Droplet,
  },
  {
    id: 'thunderflash',
    name: 'Zenitsu',
    badge: 'Zenitsu • 6s Lightning Teleport',
    description: 'Inspired by Zenitsu (⚡). Moves at 30% speed normally (sleeping), but every 6s teleports straight through the enemy with a yellow lightning strike and massive burst damage!',
    icon: Zap,
  },
  {
    id: 'scoutspinner',
    name: 'Levi',
    badge: 'Levi • 2s Rotational Blade Latch',
    description: 'Inspired by Levi (🗡️). On collision, instead of bouncing off, latches onto the enemy and rapidly rotates around them for 2s dealing continuous blade damage!',
    icon: Crosshair,
  },
  {
    id: 'rubberpirate',
    name: 'Luffy',
    badge: 'Luffy • Stretch Punch & Slingshot',
    description: 'Inspired by Luffy (👒). Every 4s shoots a stretching fist (canvas line with circle at the end) at the enemy; on hit, deals multiple rapid ticks of damage and slingshots to the enemy!',
    icon: Sparkles,
  },
  {
    id: 'ninjashadow',
    name: 'Naruto',
    badge: 'Naruto • 2 Shadow Clones & Kunai',
    description: 'Inspired by Naruto (🍥). Spawns 2 slightly transparent Shadow Clones that mirror movement, throw weak kunai projectiles, die in one hit, and confuse enemy projectile targeting!',
    icon: Copy,
  },
  {
    id: 'supersaiyan',
    name: 'Goku',
    badge: 'Goku • 10s Charge Kamehameha',
    description: 'Inspired by Goku (💥). Features a 10s charge ring UI. Once full, fires a massive, thick blue laser beam (Kamehameha) straight across the entire arena dealing devastating damage!',
    icon: Zap,
  },
  {
    id: 'soulreaper',
    name: 'Ichigo',
    badge: 'Ichigo • Piercing Getsuga Tensho',
    description: 'Inspired by Ichigo (💀). Every 5s fires a wide, crescent-shaped energy wave (Getsuga Tensho) that travels forward and penetrates through obstacles and clones!',
    icon: Flame,
  },
  {
    id: 'threesword',
    name: 'Zoro',
    badge: 'Zoro • 180° Santoryu Slash Cone',
    description: 'Inspired by Zoro (⚔️). Permanent 180-degree damage cone facing its direction of movement; any enemy entering the frontal arc takes continuous slashing damage while incoming projectiles get deflected away!',
    icon: Crosshair,
  },
  {
    id: 'standard',
    name: 'Brawler',
    badge: 'Momentum Specialist',
    description: 'Balanced kinetic core (🥊) with heavy impact resistance and responsive handling.',
    icon: Disc,
  },
  {
    id: 'quadblade',
    name: 'Knife Master',
    badge: 'Rotary Knife Slicer',
    description: 'Metallic grey body with 4 detailed protruding knives (brown handle, silver crossguard, sharp blade). Lv2 (35 dmg): +30% longer. Lv3 (70 dmg): 8 knives!',
    icon: Crosshair,
  },
  {
    id: 'aura',
    name: 'Mystic Aura',
    badge: 'Resonance Field',
    description: 'Violet aura core (🔮). Deals pulsing damage every second enemy touches/enters the ring, scaling up with round time.',
    icon: Radio,
  },
  {
    id: 'venom',
    name: 'Venom',
    badge: 'Toxic Zone',
    description: 'Neon green bubbling body (☠️). Starts at 2 tick dmg; scales to 3 tick dmg at 35 dmg and 4 tick dmg at 70 dmg.',
    icon: Droplet,
  },
  {
    id: 'mathgrid',
    name: 'Math Grid',
    badge: 'Center Tic-Tac-Toe Grid',
    description: 'White body with etched grid lines (🔢). Permanent 3x3 tic-tac-toe grid in arena center grants damage multipliers only when colliding inside it!',
    icon: Grid3X3,
  },
  {
    id: 'engineer',
    name: 'Engineer',
    badge: 'Turret Builder',
    description: 'Industrial gear chassis (⚙️). Drops a static grey square Turret every 5s that auto-fires low-damage projectiles at the enemy every 2s.',
    icon: Settings2,
  },
  {
    id: 'sniper',
    name: 'Sniper',
    badge: 'High-Caliber Rifle & Back-Dash',
    description: 'Realistic sniper rifle (🎯) with dark grey stock, long black barrel & scope. Fires high-velocity glowing rounds with fading particle trails and dashes backward when foes get too close!',
    icon: Target,
  },
  {
    id: 'bow',
    name: 'Archer',
    badge: 'Scaling Recurve Bow',
    description: 'Curved wooden bow with taut string (🏹). Fires 1 arrow/4s initially; upgrades at 30 dmg to 2 spread arrows, and at 60 dmg to 3 rapid arrows!',
    icon: Crosshair,
  },
  {
    id: 'blackhole',
    name: 'Black Hole',
    badge: 'Gravitational Singularity',
    description: 'Pitch black singularity (🕳️) with rotating purple event horizon. Controlled pull + tidal shearing (2/sec).',
    icon: Orbit,
  },
  {
    id: 'vampire',
    name: 'Vampire',
    badge: 'Life-Steal Siphon',
    description: 'Crimson blood jewel (🧛). Siphons 35% of speed-based collision damage dealt into health.',
    icon: Activity,
  },
  {
    id: 'mirror',
    name: 'Mirage',
    badge: 'Holographic Decoy',
    description: 'Prismatic mirror finish (🪞). Holographic decoy clone mirrors movements across arena to confuse opponent.',
    icon: Copy,
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    badge: 'Slot Machine RNG',
    description: 'Gilded gold casino core (🎰). 20% jackpot chance grants +3 utility damage and golden coin shower.',
    icon: Coins,
  },
  {
    id: 'frost',
    name: 'Frost Nova',
    badge: 'Cryo Freeze & Shatter',
    description: 'Glacial ice core (❄️). Emits 140px Frost Nova freezing foes (2 dmg); striking frozen foes adds +2 shatter damage.',
    icon: Snowflake,
  },
  {
    id: 'blink',
    name: 'Blink',
    badge: 'Quantum Warp & Rift',
    description: 'Spacetime magenta core (🌀). Teleports behind opponents, leaving a quantum rupture rift (2 tick dmg/sec).',
    icon: Zap,
  },
  {
    id: 'trap',
    name: 'Minefield',
    badge: 'Proximity Laser Mines',
    description: 'Industrial hazard orange (💣) with caution stripes. Deploys proximity mines (3 concussion dmg + knockback).',
    icon: Bomb,
  },
  {
    id: 'inertia',
    name: 'Juggernaut',
    badge: 'Mass Capacitor',
    description: 'Heavy tungsten capacitor (⚡). Dynamically swells physics mass (32-72) to scale momentum collision damage.',
    icon: Scale,
  },
  {
    id: 'swarm',
    name: 'Drone Swarm',
    badge: 'Autonomous Drones',
    description: 'Stealth carbon carrier (🛸) with 2 autonomous drones firing 1.0 tick damage micro-plasma darts.',
    icon: Cpu,
  },
];

/* ==========================================================================
   LIGHTWEIGHT AUDIO ENGINE (Native Browser window.AudioContext API)
   Zero external MP3s. Synthesizes unique voices per ball subclass using
   Oscillator waveforms (sine, square, sawtooth, triangle), envelopes & LFOs.
   Strictly initializes ONLY after the user clicks 'Start Match'.
   ========================================================================== */
export type ArenaSoundEffect =
  | 'hit'
  | 'wall'
  | 'ko'
  | 'start'
  | 'slice'
  | 'aura'
  | 'dash'
  | 'poison'
  | 'arrow'
  | 'crit'
  | 'siphon'
  | 'jackpot'
  | 'freeze'
  | 'shatter'
  | 'teleport'
  | 'explosion'
  | 'laser';

export interface HDSynthOptions {
  secondWaveform?: OscillatorType;
  secondStartFreq?: number;
  secondEndFreq?: number;
  secondGainRatio?: number;
  detuneCents?: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterEndFreq?: number;
  filterQ?: number;
  swellAttack?: number; // 0..0.9 fraction of duration for Void/Gravity vacuum swell
  fmRate?: number;      // Hz for LFO / frequency modulation
  fmDepth?: number;     // Frequency deviation in Hz
  lfoRate?: number;     // Alias for fmRate (LFO speed in Hz)
  lfoDepth?: number;    // Alias for fmDepth (LFO deviation in Hz)
  lfoWaveform?: OscillatorType;
  abruptCut?: boolean;  // Holds ambient drone level and suddenly cuts out to silence
}

export class AudioController {
  private ctx: AudioContext | null = null;
  private initializedByStartButton: boolean = false;
  private lastHitConfirmMs: number = 0;
  public soundEnabled: boolean = true;

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!this.ctx) return;
    try {
      if (!enabled && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (enabled && this.initializedByStartButton && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio context state errors
    }
  }

  // Strictly initializes the AudioContext synchronously inside user click gestures ('ENTER ARENA' / 'Start Match')
  public initOnStartMatch(): void {
    this.initializedByStartButton = true;
    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.soundEnabled && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      // Play an inaudible 1-sample silent buffer synchronously inside the user gesture
      // to guarantee Web Audio API unlock across Chrome, Safari, and embedded iFrames.
      if (this.soundEnabled && this.ctx) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      }
    } catch {
      // Fallback if Web Audio API is blocked
    }
  }

  private getReadyContext(): AudioContext | null {
    if (!this.soundEnabled || !this.initializedByStartButton || !this.ctx) {
      return null;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // HD Dual-Oscillator + LFO + BiquadFilterNode frequency-envelope synthesizer
  // Layers a primary oscillator with a secondary oscillator (e.g., low-frequency sine sub-bass + sawtooth/square crunch)
  // optionally modulated by a fast LFO and routed through a BiquadFilterNode (lowpass, highpass, bandpass).
  public synthesizeEnvelope(
    waveform: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    peakGain: number = 0.22,
    rampType: 'exponential' | 'linear' = 'exponential',
    options?: HDSynthOptions
  ): void {
    const ctx = this.getReadyContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const safeDuration = Math.max(0.02, duration);
      const safeStart = Math.max(16, startFreq);
      const safeEnd = Math.max(16, endFreq);

      // Primary Oscillator
      const osc1 = ctx.createOscillator();
      const osc1Gain = ctx.createGain();
      osc1.type = waveform;
      osc1.frequency.setValueAtTime(safeStart, now);
      if (rampType === 'exponential') {
        osc1.frequency.exponentialRampToValueAtTime(safeEnd, now + safeDuration);
      } else {
        osc1.frequency.linearRampToValueAtTime(safeEnd, now + safeDuration);
      }
      osc1Gain.gain.setValueAtTime(1.0, now);

      // Layered Secondary Oscillator
      const osc2 = ctx.createOscillator();
      const osc2Gain = ctx.createGain();
      const isHeavyOrLow = safeStart < 380 || safeEnd < 160 || waveform === 'sawtooth' || waveform === 'square';
      const secWave: OscillatorType =
        options?.secondWaveform ?? (isHeavyOrLow ? 'sine' : 'sawtooth');
      const secStart = Math.max(
        16,
        options?.secondStartFreq ?? (isHeavyOrLow ? safeStart * 0.5 : safeStart * 1.5)
      );
      const secEnd = Math.max(
        16,
        options?.secondEndFreq ?? (isHeavyOrLow ? safeEnd * 0.5 : safeEnd * 1.5)
      );
      const secRatio = options?.secondGainRatio ?? (isHeavyOrLow ? 0.65 : 0.35);

      osc2.type = secWave;
      if (options?.detuneCents) {
        osc2.detune.setValueAtTime(options.detuneCents, now);
      }
      osc2.frequency.setValueAtTime(secStart, now);
      if (rampType === 'exponential') {
        osc2.frequency.exponentialRampToValueAtTime(secEnd, now + safeDuration);
      } else {
        osc2.frequency.linearRampToValueAtTime(secEnd, now + safeDuration);
      }
      osc2Gain.gain.setValueAtTime(secRatio, now);

      // Optional Fast LFO / Frequency Modulation (for Ice/Magic crystalline chimes & Sci-Fi FM lasers)
      const lfoRate = options?.lfoRate ?? options?.fmRate;
      const lfoDepth = options?.lfoDepth ?? options?.fmDepth;
      let lfoOsc: OscillatorNode | null = null;
      if (lfoRate && lfoDepth) {
        lfoOsc = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfoOsc.type = options?.lfoWaveform ?? (waveform === 'square' ? 'square' : 'sine');
        lfoOsc.frequency.setValueAtTime(Math.max(1, lfoRate), now);
        lfoGain.gain.setValueAtTime(lfoDepth, now);
        lfoOsc.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
      }

      // BiquadFilterNode routing (lowpass for Fire/Heavy rumble; highpass for Slash/Steel & Ice/Magic snap)
      const filter = ctx.createBiquadFilter();
      filter.type = options?.filterType ?? (safeStart > 850 ? 'highpass' : 'lowpass');
      const startCutoff = Math.max(
        24,
        Math.min(18000, options?.filterFreq ?? (filter.type === 'highpass' ? 720 : 2600))
      );
      filter.frequency.setValueAtTime(startCutoff, now);
      if (options?.filterEndFreq) {
        const endCutoff = Math.max(24, Math.min(18000, options.filterEndFreq));
        filter.frequency.exponentialRampToValueAtTime(endCutoff, now + safeDuration);
      }
      filter.Q.setValueAtTime(options?.filterQ ?? 1.8, now);

      // Master Envelope Gain (supports abrupt cut-out, slow vacuum swell, or fast transient decay)
      const masterGain = ctx.createGain();
      if (options?.abruptCut) {
        const cutStart = Math.max(now + 0.02, now + safeDuration - 0.01);
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.04, safeDuration * 0.15));
        masterGain.gain.setValueAtTime(peakGain, cutStart);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration);
      } else if (options?.swellAttack && options.swellAttack > 0 && options.swellAttack < 0.95) {
        const peakTime = now + safeDuration * options.swellAttack;
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(peakGain, peakTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);
      } else {
        masterGain.gain.setValueAtTime(Math.max(0.001, peakGain), now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);
      }

      osc1.connect(osc1Gain);
      osc2.connect(osc2Gain);
      osc1Gain.connect(filter);
      osc2Gain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      if (lfoOsc) lfoOsc.start(now);

      osc1.stop(now + safeDuration);
      osc2.stop(now + safeDuration);
      if (lfoOsc) lfoOsc.stop(now + safeDuration);
    } catch {
      // Ignore audio scheduling errors
    }
  }

  // =========================================================================
  // ARCHETYPE AUDIO PROFILE 1: Fire / Heavy
  // Layers a low-frequency sine wave (sub-bass) with a sawtooth wave,
  // routed through a lowpass BiquadFilterNode for a booming, muffled rumble.
  // =========================================================================
  public playFireHeavy(
    pitchMultiplier: number = 1.0,
    duration: number = 0.32,
    style: 'explosion' | 'rumble' | 'punch' = 'explosion'
  ): void {
    const isPunch = style === 'punch';
    const isRumble = style === 'rumble';
    this.synthesizeEnvelope(
      'sine',
      (isPunch ? 135 : isRumble ? 84 : 112) * pitchMultiplier,
      (isPunch ? 28 : 22) * pitchMultiplier,
      duration,
      isPunch ? 0.36 : 0.38,
      'exponential',
      {
        secondWaveform: 'sawtooth',
        secondStartFreq: (isPunch ? 280 : isRumble ? 195 : 320) * pitchMultiplier,
        secondEndFreq: 38 * pitchMultiplier,
        secondGainRatio: isRumble ? 0.68 : 0.74,
        detuneCents: -16,
        filterType: 'lowpass',
        filterFreq: (isRumble ? 680 : 1080) * pitchMultiplier,
        filterEndFreq: (isRumble ? 48 : 64) * pitchMultiplier,
        filterQ: isRumble ? 3.2 : 2.6,
      }
    );
  }

  // Backwards-compatible alias
  public playFireExplosionVoice(pitchMultiplier: number = 1.0, duration: number = 0.32): void {
    this.playFireHeavy(pitchMultiplier, duration, 'explosion');
  }

  // =========================================================================
  // ARCHETYPE AUDIO PROFILE 2: Slash / Steel
  // Layers high-frequency triangle and sawtooth waves through a highpass
  // BiquadFilterNode for a sharp, metallic 'shing!' ring.
  // =========================================================================
  public playSlashSteel(
    pitchMultiplier: number = 1.0,
    duration: number = 0.17,
    style: 'shing' | 'cleave' | 'kunai' = 'shing'
  ): void {
    const startTri = style === 'cleave' ? 1420 : style === 'kunai' ? 2350 : 1880;
    const endTri = style === 'cleave' ? 980 : style === 'kunai' ? 1650 : 2720;
    const startSaw = style === 'cleave' ? 2450 : style === 'kunai' ? 3900 : 3320;
    const endSaw = style === 'cleave' ? 1120 : style === 'kunai' ? 2100 : 2280;

    this.synthesizeEnvelope(
      'triangle',
      startTri * pitchMultiplier,
      endTri * pitchMultiplier,
      duration,
      0.27,
      'exponential',
      {
        secondWaveform: 'sawtooth',
        secondStartFreq: startSaw * pitchMultiplier,
        secondEndFreq: endSaw * pitchMultiplier,
        secondGainRatio: 0.48,
        detuneCents: 19,
        filterType: 'highpass',
        filterFreq: (style === 'cleave' ? 860 : 1280) * pitchMultiplier,
        filterEndFreq: (style === 'cleave' ? 1400 : 2400) * pitchMultiplier,
        filterQ: style === 'shing' ? 4.4 : 3.4,
      }
    );
  }

  // Backwards-compatible alias
  public playSlashSteelVoice(pitchMultiplier: number = 1.0, duration: number = 0.16): void {
    this.playSlashSteel(pitchMultiplier, duration, 'shing');
  }

  // =========================================================================
  // ARCHETYPE AUDIO PROFILE 3: Ice / Magic
  // Uses dual sine waves with fast frequency modulation (LFOs) to create
  // crystalline, glass-shattering chimes.
  // =========================================================================
  public playIceMagic(
    pitchMultiplier: number = 1.0,
    duration: number = 0.24,
    style: 'crystalline' | 'shatter' | 'mystic' = 'crystalline'
  ): void {
    const baseFreq = style === 'shatter' ? 1680 : style === 'mystic' ? 880 : 1320;
    const endFreq = style === 'shatter' ? 2940 : style === 'mystic' ? 1320 : 2180;
    const lfoHz = style === 'shatter' ? 76 : style === 'mystic' ? 38 : 58;
    const lfoAmp = style === 'shatter' ? 340 : style === 'mystic' ? 155 : 240;

    this.synthesizeEnvelope(
      'sine',
      baseFreq * pitchMultiplier,
      endFreq * pitchMultiplier,
      duration,
      0.26,
      'exponential',
      {
        secondWaveform: 'sine',
        secondStartFreq: baseFreq * 1.98 * pitchMultiplier,
        secondEndFreq: endFreq * 1.49 * pitchMultiplier,
        secondGainRatio: 0.56,
        detuneCents: 12,
        filterType: style === 'mystic' ? 'bandpass' : 'highpass',
        filterFreq: (style === 'mystic' ? 1100 : 1250) * pitchMultiplier,
        filterEndFreq: (style === 'mystic' ? 1950 : 2800) * pitchMultiplier,
        filterQ: style === 'shatter' ? 4.0 : 2.8,
        lfoRate: lfoHz * pitchMultiplier,
        lfoDepth: lfoAmp,
        lfoWaveform: 'sine',
      }
    );
  }

  // =========================================================================
  // ARCHETYPE AUDIO PROFILE 4: Sci-Fi / Guns
  // Uses quick descending square waves for punchy, retro-arcade laser 'pews'
  // and heavy artillery thuds.
  // =========================================================================
  public playSciFiGuns(
    pitchMultiplier: number = 1.0,
    mode: 'pew' | 'artillery' | 'capacitor' = 'pew',
    duration?: number
  ): void {
    if (mode === 'artillery') {
      // Heavy gun / sniper artillery thud: quick descending square snap + deep sine bass drop
      this.synthesizeEnvelope(
        'square',
        840 * pitchMultiplier,
        54 * pitchMultiplier,
        duration ?? 0.22,
        0.34,
        'exponential',
        {
          secondWaveform: 'sine',
          secondStartFreq: 185 * pitchMultiplier,
          secondEndFreq: 28 * pitchMultiplier,
          secondGainRatio: 0.88,
          detuneCents: -10,
          filterType: 'lowpass',
          filterFreq: 2400 * pitchMultiplier,
          filterEndFreq: 110 * pitchMultiplier,
          filterQ: 2.4,
        }
      );
      return;
    }

    if (mode === 'capacitor') {
      // Charging Sci-Fi digital pulse
      this.synthesizeEnvelope(
        'square',
        340 * pitchMultiplier,
        1520 * pitchMultiplier,
        duration ?? 0.22,
        0.24,
        'exponential',
        {
          secondWaveform: 'sawtooth',
          secondStartFreq: 170 * pitchMultiplier,
          secondEndFreq: 760 * pitchMultiplier,
          secondGainRatio: 0.52,
          detuneCents: 14,
          filterType: 'bandpass',
          filterFreq: 680 * pitchMultiplier,
          filterEndFreq: 2300 * pitchMultiplier,
          filterQ: 3.1,
          lfoRate: 62 * pitchMultiplier,
          lfoDepth: 175,
          lfoWaveform: 'square',
        }
      );
      return;
    }

    // Punchy retro-arcade laser 'pew': quick descending square wave + harmonic square sweep
    this.synthesizeEnvelope(
      'square',
      1560 * pitchMultiplier,
      150 * pitchMultiplier,
      duration ?? 0.14,
      0.26,
      'exponential',
      {
        secondWaveform: 'square',
        secondStartFreq: 780 * pitchMultiplier,
        secondEndFreq: 75 * pitchMultiplier,
        secondGainRatio: 0.55,
        detuneCents: 11,
        filterType: 'lowpass',
        filterFreq: 4200 * pitchMultiplier,
        filterEndFreq: 340 * pitchMultiplier,
        filterQ: 2.8,
        lfoRate: 48 * pitchMultiplier,
        lfoDepth: 140,
        lfoWaveform: 'square',
      }
    );
  }

  // Backwards-compatible Sci-Fi/Mecha voice helper
  public playSciFiMechaVoice(
    pitchMultiplier: number = 1.0,
    mode: 'laser' | 'capacitor' = 'laser'
  ): void {
    this.playSciFiGuns(pitchMultiplier, mode === 'capacitor' ? 'capacitor' : 'pew');
  }

  // Void/Gravity vacuum profile: Ultra-low sine sub-bass with slow volume swell
  public playVoidGravityVoice(pitchMultiplier: number = 1.0, duration: number = 0.34): void {
    this.synthesizeEnvelope(
      'sine',
      74 * pitchMultiplier,
      26 * pitchMultiplier,
      duration,
      0.36,
      'exponential',
      {
        secondWaveform: 'triangle',
        secondStartFreq: 148 * pitchMultiplier,
        secondEndFreq: 38 * pitchMultiplier,
        secondGainRatio: 0.5,
        detuneCents: -10,
        filterType: 'lowpass',
        filterFreq: 280 * pitchMultiplier,
        filterEndFreq: 48 * pitchMultiplier,
        filterQ: 3.6,
        swellAttack: 0.58,
      }
    );
  }

  // Lightning electric crackle & cryo snap helper
  public playHighpassSnapVoice(
    pitchMultiplier: number = 1.0,
    element: 'lightning' | 'ice' = 'lightning'
  ): void {
    if (element === 'ice') {
      this.playIceMagic(pitchMultiplier, 0.22, 'crystalline');
      return;
    }
    this.synthesizeEnvelope(
      'square',
      1920 * pitchMultiplier,
      180 * pitchMultiplier,
      0.16,
      0.27,
      'exponential',
      {
        secondWaveform: 'sawtooth',
        secondStartFreq: 960 * pitchMultiplier,
        secondEndFreq: 90 * pitchMultiplier,
        secondGainRatio: 0.52,
        detuneCents: 16,
        filterType: 'highpass',
        filterFreq: 1100 * pitchMultiplier,
        filterEndFreq: 650 * pitchMultiplier,
        filterQ: 3.8,
        lfoRate: 78 * pitchMultiplier,
        lfoDepth: 230,
        lfoWaveform: 'square',
      }
    );
  }

  // Heavy sniper / gunner shot helper
  public playSniperPew(pitchMultiplier: number = 1.0): void {
    this.playSciFiGuns(pitchMultiplier, 'artillery', 0.18);
  }

  // Venom & organic slime LFO bubble
  public playVenomBubble(pitchMultiplier: number = 1.0): void {
    this.synthesizeEnvelope(
      'sine',
      220 * pitchMultiplier,
      390 * pitchMultiplier,
      0.21,
      0.25,
      'linear',
      {
        secondWaveform: 'triangle',
        secondStartFreq: 110 * pitchMultiplier,
        secondEndFreq: 195 * pitchMultiplier,
        secondGainRatio: 0.45,
        filterType: 'lowpass',
        filterFreq: 1150 * pitchMultiplier,
        filterQ: 3.2,
        lfoRate: 26 * pitchMultiplier,
        lfoDepth: 105,
        lfoWaveform: 'sine',
      }
    );
  }

  // Heavy kinetic impact bass boom
  public playKineticBassBoom(pitchMultiplier: number = 1.0): void {
    this.playFireHeavy(pitchMultiplier * 0.9, 0.25, 'punch');
  }

  // Metallic multi-blade ring
  public playQuadBladeChing(pitchMultiplier: number = 1.0): void {
    this.playSlashSteel(pitchMultiplier * 1.12, 0.16, 'shing');
  }

  // =========================================================================
  // PHYSICAL COLLISION MATERIAL VOICES
  // Distinct kinetic impact synthesis based on what each colliding ball is made of.
  // =========================================================================

  // Base kinetic 'thud' for standard physical ball-to-ball collisions
  public playKineticCollisionThud(pitchMultiplier: number = 1.0): void {
    this.synthesizeEnvelope(
      'sine',
      148 * pitchMultiplier,
      42 * pitchMultiplier,
      0.13,
      0.27,
      'exponential',
      {
        secondWaveform: 'triangle',
        secondStartFreq: 235 * pitchMultiplier,
        secondEndFreq: 64 * pitchMultiplier,
        secondGainRatio: 0.45,
        filterType: 'lowpass',
        filterFreq: 680 * pitchMultiplier,
        filterEndFreq: 115 * pitchMultiplier,
        filterQ: 2.2,
      }
    );
  }

  // Mecha / Tech material: Heavy metallic 'clank' or 'ringing steel' (triangle/square + highpass)
  public playMechaCollisionClank(
    pitchMultiplier: number = 1.0,
    style: 'gundam' | 'eva' | 'engineer' | 'tech' = 'gundam'
  ): void {
    const isEva = style === 'eva';
    const isEng = style === 'engineer';
    const primaryWave: OscillatorType = isEva ? 'square' : 'triangle';
    const secondaryWave: OscillatorType = isEva ? 'triangle' : 'square';
    const f1Start = (isEng ? 1380 : isEva ? 680 : 940) * pitchMultiplier;
    const f1End = (isEng ? 940 : isEva ? 380 : 540) * pitchMultiplier;
    const f2Start = (isEng ? 2160 : isEva ? 1240 : 1510) * pitchMultiplier;
    const f2End = (isEng ? 1420 : isEva ? 720 : 880) * pitchMultiplier;

    this.synthesizeEnvelope(primaryWave, f1Start, f1End, isEva ? 0.23 : 0.20, 0.28, 'exponential', {
      secondWaveform: secondaryWave,
      secondStartFreq: f2Start,
      secondEndFreq: f2End,
      secondGainRatio: 0.56,
      detuneCents: 28,
      filterType: 'highpass',
      filterFreq: (isEng ? 1100 : isEva ? 720 : 860) * pitchMultiplier,
      filterEndFreq: (isEng ? 1580 : 1180) * pitchMultiplier,
      filterQ: isEng ? 5.6 : 4.9,
    });
  }

  // Heavy Hitters material: Deep, booming 'thud' (low-frequency sine wave + lowpass filter)
  public playHeavyCollisionBoom(
    pitchMultiplier: number = 1.0,
    style: 'allmight' | 'whitebeard' | 'juggernaut' | 'titan' = 'allmight'
  ): void {
    const isQuake = style === 'whitebeard';
    const isJugg = style === 'juggernaut';
    const startHz = (isQuake ? 74 : isJugg ? 86 : 96) * pitchMultiplier;
    const endHz = (isQuake ? 20 : isJugg ? 22 : 26) * pitchMultiplier;

    this.synthesizeEnvelope('sine', startHz, endHz, isQuake ? 0.34 : 0.28, 0.36, 'exponential', {
      secondWaveform: isJugg ? 'triangle' : 'sine',
      secondStartFreq: startHz * (isJugg ? 1.5 : 0.55),
      secondEndFreq: Math.max(16, endHz * 0.65),
      secondGainRatio: 0.78,
      detuneCents: -10,
      filterType: 'lowpass',
      filterFreq: (isQuake ? 175 : isJugg ? 260 : 230) * pitchMultiplier,
      filterEndFreq: (isQuake ? 40 : 54) * pitchMultiplier,
      filterQ: isQuake ? 4.2 : 3.4,
    });
  }

  // Magic / Liquid material: Squishy, bubbly 'splash' (sine wave + LFO modulation)
  public playLiquidCollisionSplash(
    pitchMultiplier: number = 1.0,
    style: 'rimuru' | 'tanjiro' | 'venom' | 'mochi' = 'rimuru'
  ): void {
    const isVenom = style === 'venom';
    const isWater = style === 'tanjiro';
    const isMochi = style === 'mochi';

    this.synthesizeEnvelope(
      'sine',
      (isVenom ? 195 : isWater ? 280 : isMochi ? 235 : 340) * pitchMultiplier,
      (isVenom ? 365 : isWater ? 560 : isMochi ? 460 : 640) * pitchMultiplier,
      0.21,
      0.28,
      'linear',
      {
        secondWaveform: isWater ? 'triangle' : 'sine',
        secondStartFreq: (isVenom ? 110 : 175) * pitchMultiplier,
        secondEndFreq: (isVenom ? 220 : 390) * pitchMultiplier,
        secondGainRatio: 0.54,
        filterType: isVenom ? 'lowpass' : 'bandpass',
        filterFreq: (isVenom ? 860 : isWater ? 740 : 620) * pitchMultiplier,
        filterEndFreq: (isVenom ? 420 : isWater ? 1480 : 1220) * pitchMultiplier,
        filterQ: isVenom ? 4.0 : 3.2,
        lfoRate: (isVenom ? 24 : isWater ? 44 : isMochi ? 30 : 36) * pitchMultiplier,
        lfoDepth: isVenom ? 115 : isWater ? 210 : 170,
        lfoWaveform: 'sine',
      }
    );
  }

  // Ice material: Crystalline, glass-cracking chime (dual high sine + fast LFO + highpass)
  public playIceCollisionChime(
    pitchMultiplier: number = 1.0,
    style: 'aokiji' | 'esdeath' | 'frost' | 'todoroki' = 'aokiji'
  ): void {
    const isEsdeath = style === 'esdeath';
    const isFrost = style === 'frost';
    const baseHz = (isEsdeath ? 1820 : isFrost ? 1260 : 1480) * pitchMultiplier;
    const endHz = (isEsdeath ? 3120 : isFrost ? 2140 : 2460) * pitchMultiplier;

    this.synthesizeEnvelope('sine', baseHz, endHz, isFrost ? 0.25 : 0.22, 0.28, 'exponential', {
      secondWaveform: 'sine',
      secondStartFreq: baseHz * 1.97,
      secondEndFreq: endHz * 1.52,
      secondGainRatio: 0.62,
      detuneCents: 14,
      filterType: 'highpass',
      filterFreq: (isEsdeath ? 1750 : isFrost ? 1220 : 1380) * pitchMultiplier,
      filterEndFreq: (isEsdeath ? 3200 : 2600) * pitchMultiplier,
      filterQ: isEsdeath ? 4.8 : 4.2,
      lfoRate: (isEsdeath ? 86 : isFrost ? 58 : 70) * pitchMultiplier,
      lfoDepth: isEsdeath ? 340 : isFrost ? 210 : 265,
      lfoWaveform: 'sine',
    });
  }

  // =========================================================================
  // UNIVERSAL HIT CONFIRMATION SOUND
  // Crisp, high-pitched 'tic' / 'smack' transient played whenever any
  // projectile or attack successfully connects with the enemy hitbox.
  // =========================================================================
  public playHitConfirm(damage: number = 5): void {
    const ctx = this.getReadyContext();
    if (!ctx) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastHitConfirmMs < 26) return;
    this.lastHitConfirmMs = nowMs;

    const pitchBoost = damage >= 18 ? 1.12 : damage >= 8 ? 1.05 : 1.0;
    const gainLevel = damage >= 18 ? 0.24 : 0.19;
    this.synthesizeEnvelope(
      'triangle',
      3100 * pitchBoost,
      1250 * pitchBoost,
      0.036,
      gainLevel,
      'exponential',
      {
        secondWaveform: 'sine',
        secondStartFreq: 4400 * pitchBoost,
        secondEndFreq: 1950 * pitchBoost,
        secondGainRatio: 0.6,
        detuneCents: 8,
        filterType: 'highpass',
        filterFreq: 1750,
        filterEndFreq: 1100,
        filterQ: 2.6,
      }
    );
  }

  // =========================================================================
  // UNIQUE CHARACTER VOICE MAPPING (Complete Individual Roster Switch Statement)
  // Every single BallTypeId has an explicit case and a bespoke synthesizeEnvelope
  // signature with distinct waveform, frequency sweep, filter, and LFO tuning.
  // =========================================================================
  public playSubclassVoice(
    ballType: BallTypeId | string,
    event: 'attack' | 'hit' | 'ability'
  ): void {
    const eventPitch = event === 'hit' ? 0.84 : event === 'ability' ? 1.14 : 1.0;
    const durScale = event === 'ability' ? 1.2 : event === 'hit' ? 0.78 : 1.0;
    const gainScale = event === 'ability' ? 1.1 : event === 'hit' ? 0.86 : 1.0;

    switch (ballType) {
      // --- BATCH 4: FIRE & ICE ---
      case 'natsu':
        // Fire Dragon Roar: roaring sawtooth flame breath over sub-sine core
        this.synthesizeEnvelope('sawtooth', 280 * eventPitch, 68 * eventPitch, 0.28 * durScale, 0.28 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 140 * eventPitch,
          secondEndFreq: 34 * eventPitch,
          secondGainRatio: 0.78,
          detuneCents: -14,
          filterType: 'lowpass',
          filterFreq: 1280 * eventPitch,
          filterEndFreq: 180 * eventPitch,
          filterQ: 2.8,
          fmRate: 24,
          fmDepth: 48,
        });
        break;
      case 'todoroki':
        // Half-Cold Half-Hot: crystalline LFO ice chime on strikes, thermal fire wave on ability
        if (event === 'ability') {
          this.synthesizeEnvelope('sawtooth', 220 * eventPitch, 58 * eventPitch, 0.30, 0.29, 'exponential', {
            secondWaveform: 'sine',
            secondStartFreq: 110 * eventPitch,
            secondEndFreq: 29 * eventPitch,
            secondGainRatio: 0.74,
            filterType: 'lowpass',
            filterFreq: 980 * eventPitch,
            filterEndFreq: 130 * eventPitch,
            filterQ: 3.1,
            fmRate: 21,
            fmDepth: 42,
          });
        } else {
          this.synthesizeEnvelope('sine', 1540 * eventPitch, 2460 * eventPitch, 0.22 * durScale, 0.24 * gainScale, 'exponential', {
            secondWaveform: 'triangle',
            secondStartFreq: 770 * eventPitch,
            secondEndFreq: 1230 * eventPitch,
            secondGainRatio: 0.5,
            filterType: 'highpass',
            filterFreq: 940 * eventPitch,
            filterEndFreq: 1820 * eventPitch,
            filterQ: 3.4,
            fmRate: 52,
            fmDepth: 210,
          });
        }
        break;
      case 'mustang':
        // Ignition Glove Snap: crisp spark crack snapping into focused alchemy blast
        this.synthesizeEnvelope('square', 820 * eventPitch, 78 * eventPitch, 0.21 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 1640 * eventPitch,
          secondEndFreq: 156 * eventPitch,
          secondGainRatio: 0.62,
          detuneCents: 11,
          filterType: 'bandpass',
          filterFreq: 1450 * eventPitch,
          filterEndFreq: 240 * eventPitch,
          filterQ: 3.4,
          fmRate: 35,
          fmDepth: 120,
        });
        break;
      case 'esdeath':
        // Ice Cavalry & Mahapadma: piercing glass-shatter dual sine LFO chime
        this.synthesizeEnvelope('sine', 1780 * eventPitch, 3120 * eventPitch, 0.24 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 3560 * eventPitch,
          secondEndFreq: 4680 * eventPitch,
          secondGainRatio: 0.58,
          detuneCents: 16,
          filterType: 'highpass',
          filterFreq: 1480 * eventPitch,
          filterEndFreq: 3100 * eventPitch,
          filterQ: 4.4,
          fmRate: 84,
          fmDepth: 360,
        });
        break;
      case 'aokiji':
        // Glacial Pheasant Beak: deep resonant frost sweep with crystalline wobble
        this.synthesizeEnvelope('sine', 920 * eventPitch, 1620 * eventPitch, 0.27 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 460 * eventPitch,
          secondEndFreq: 810 * eventPitch,
          secondGainRatio: 0.54,
          detuneCents: -9,
          filterType: 'bandpass',
          filterFreq: 1050 * eventPitch,
          filterEndFreq: 1880 * eventPitch,
          filterQ: 3.8,
          fmRate: 44,
          fmDepth: 170,
        });
        break;

      // --- BATCH 5: ASSASSINS & SPEED ---
      case 'killua':
        // Godspeed Whirlwind: hyper-fast high-voltage square lightning snap
        this.synthesizeEnvelope('square', 2240 * eventPitch, 340 * eventPitch, 0.14 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 1120 * eventPitch,
          secondEndFreq: 170 * eventPitch,
          secondGainRatio: 0.52,
          detuneCents: 18,
          filterType: 'highpass',
          filterFreq: 1320 * eventPitch,
          filterEndFreq: 680 * eventPitch,
          filterQ: 4.5,
          fmRate: 96,
          fmDepth: 340,
          lfoWaveform: 'square',
        });
        break;
      case 'korosensei':
        // Mach-20 Afterimage: high-speed upward Doppler sine + square zip
        this.synthesizeEnvelope('sine', 640 * eventPitch, 2180 * eventPitch, 0.13 * durScale, 0.23 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 320 * eventPitch,
          secondEndFreq: 1090 * eventPitch,
          secondGainRatio: 0.42,
          filterType: 'highpass',
          filterFreq: 760 * eventPitch,
          filterQ: 2.2,
          fmRate: 32,
          fmDepth: 95,
        });
        break;
      case 'yoruichi':
        // Shunko Raijin Flash Step: snappy thunderclap square + triangle burst
        this.synthesizeEnvelope('square', 1620 * eventPitch, 210 * eventPitch, 0.16 * durScale, 0.26 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 810 * eventPitch,
          secondEndFreq: 105 * eventPitch,
          secondGainRatio: 0.58,
          detuneCents: 13,
          filterType: 'bandpass',
          filterFreq: 1280 * eventPitch,
          filterEndFreq: 540 * eventPitch,
          filterQ: 3.6,
          fmRate: 74,
          fmDepth: 230,
          lfoWaveform: 'square',
        });
        break;
      case 'minato':
        // Flying Raijin Kunai: instant spatial chirp + sharp steel flick
        this.synthesizeEnvelope('triangle', 2480 * eventPitch, 1420 * eventPitch, 0.13 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 1240 * eventPitch,
          secondEndFreq: 2840 * eventPitch,
          secondGainRatio: 0.48,
          detuneCents: 15,
          filterType: 'highpass',
          filterFreq: 1520 * eventPitch,
          filterQ: 4.2,
          fmRate: 58,
          fmDepth: 185,
        });
        break;
      case 'sonic':
        // Speed-o'-Sound Shuriken: piercing supersonic blade whistle
        this.synthesizeEnvelope('triangle', 2950 * eventPitch, 1780 * eventPitch, 0.11 * durScale, 0.23 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 4120 * eventPitch,
          secondEndFreq: 2250 * eventPitch,
          secondGainRatio: 0.44,
          detuneCents: 22,
          filterType: 'highpass',
          filterFreq: 1850 * eventPitch,
          filterQ: 5.0,
          fmRate: 46,
          fmDepth: 150,
        });
        break;

      // --- BATCH 6: MAGIC & SUMMONERS ---
      case 'megumin':
        // EXPLOSION!: colossal sub-bass detonation sweep
        this.synthesizeEnvelope('sawtooth', 165 * eventPitch, 24 * eventPitch, 0.44 * durScale, 0.36 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 82 * eventPitch,
          secondEndFreq: 18 * eventPitch,
          secondGainRatio: 0.88,
          detuneCents: -22,
          filterType: 'lowpass',
          filterFreq: 960 * eventPitch,
          filterEndFreq: 48 * eventPitch,
          filterQ: 3.4,
          fmRate: 19,
          fmDepth: 65,
        });
        break;
      case 'yami':
        // Dark Cloaked Dimension Slash: ominous vacuum swell + dark cleave
        this.synthesizeEnvelope('sawtooth', 110 * eventPitch, 42 * eventPitch, 0.32 * durScale, 0.30 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 880 * eventPitch,
          secondEndFreq: 220 * eventPitch,
          secondGainRatio: 0.56,
          detuneCents: -15,
          filterType: 'bandpass',
          filterFreq: 440 * eventPitch,
          filterEndFreq: 140 * eventPitch,
          filterQ: 4.2,
          swellAttack: event === 'ability' ? 0.42 : 0.18,
          fmRate: 28,
          fmDepth: 85,
        });
        break;
      case 'fushiguro':
        // Ten Shadows Summon: shadowy lowpass howl rising out of shadow pool
        this.synthesizeEnvelope('triangle', 240 * eventPitch, 96 * eventPitch, 0.28 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 120 * eventPitch,
          secondEndFreq: 48 * eventPitch,
          secondGainRatio: 0.68,
          detuneCents: -11,
          filterType: 'lowpass',
          filterFreq: 520 * eventPitch,
          filterEndFreq: 160 * eventPitch,
          filterQ: 4.6,
          swellAttack: 0.35,
          fmRate: 14,
          fmDepth: 34,
        });
        break;
      case 'lucy':
        // Celestial Spirit Urano Metria: sparkling golden starlight harmonic chime
        this.synthesizeEnvelope('sine', 1180 * eventPitch, 2360 * eventPitch, 0.24 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 1770 * eventPitch,
          secondEndFreq: 3540 * eventPitch,
          secondGainRatio: 0.52,
          detuneCents: 10,
          filterType: 'highpass',
          filterFreq: 1080 * eventPitch,
          filterEndFreq: 2100 * eventPitch,
          filterQ: 3.2,
          fmRate: 42,
          fmDepth: 135,
        });
        break;
      case 'rimuru':
        // Predator Slime Absorption: bright liquid bubbly LFO sine warp
        this.synthesizeEnvelope('sine', 290 * eventPitch, 590 * eventPitch, 0.21 * durScale, 0.25 * gainScale, 'linear', {
          secondWaveform: 'triangle',
          secondStartFreq: 580 * eventPitch,
          secondEndFreq: 885 * eventPitch,
          secondGainRatio: 0.46,
          filterType: 'bandpass',
          filterFreq: 760 * eventPitch,
          filterEndFreq: 1380 * eventPitch,
          filterQ: 4.8,
          fmRate: 30,
          fmDepth: 135,
        });
        break;

      // --- BATCH 7: SNIPERS & GUNNERS ---
      case 'vash':
        // Silver Ricochet Revolver: sharp gun-crack with metallic ricochet ring
        this.synthesizeEnvelope('sawtooth', 1520 * eventPitch, 148 * eventPitch, 0.15 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 760 * eventPitch,
          secondEndFreq: 340 * eventPitch,
          secondGainRatio: 0.62,
          filterType: 'bandpass',
          filterFreq: 1720 * eventPitch,
          filterEndFreq: 680 * eventPitch,
          filterQ: 3.8,
          fmRate: 22,
          fmDepth: 75,
        });
        break;
      case 'deaththekid':
        // Symmetrical Twin Demon Pistols: parallel detuned square laser blasts
        this.synthesizeEnvelope('square', 1360 * eventPitch, 195 * eventPitch, 0.13 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 1360 * eventPitch,
          secondEndFreq: 195 * eventPitch,
          secondGainRatio: 0.85,
          detuneCents: 18,
          filterType: 'lowpass',
          filterFreq: 3400 * eventPitch,
          filterEndFreq: 420 * eventPitch,
          filterQ: 2.6,
          fmRate: 52,
          fmDepth: 110,
          lfoWaveform: 'square',
        });
        break;
      case 'sinon':
        // Hecate II Anti-Materiel Sniper: massive sub-bass drop sniper cannon
        this.synthesizeEnvelope('square', 540 * eventPitch, 34 * eventPitch, 0.25 * durScale, 0.34 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 140 * eventPitch,
          secondEndFreq: 24 * eventPitch,
          secondGainRatio: 0.92,
          detuneCents: -12,
          filterType: 'lowpass',
          filterFreq: 1850 * eventPitch,
          filterEndFreq: 78 * eventPitch,
          filterQ: 2.8,
        });
        break;
      case 'hawkeye':
        // Riza Hawkeye Triple Pinpoint Burst: tight crisp military sidearm snap
        this.synthesizeEnvelope('square', 1140 * eventPitch, 96 * eventPitch, 0.11 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 570 * eventPitch,
          secondEndFreq: 48 * eventPitch,
          secondGainRatio: 0.55,
          filterType: 'bandpass',
          filterFreq: 1580 * eventPitch,
          filterEndFreq: 320 * eventPitch,
          filterQ: 2.2,
        });
        break;

      // --- BATCH 8: HEAVY HITTERS ---
      case 'escanor':
        // Cruel Sun Sunshine: majestic heavy roaring solar lowpass blaze
        this.synthesizeEnvelope('sawtooth', 168 * eventPitch, 38 * eventPitch, 0.34 * durScale, 0.33 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 84 * eventPitch,
          secondEndFreq: 22 * eventPitch,
          secondGainRatio: 0.84,
          detuneCents: -14,
          filterType: 'lowpass',
          filterFreq: 980 * eventPitch,
          filterEndFreq: 90 * eventPitch,
          filterQ: 3.1,
          fmRate: 16,
          fmDepth: 32,
        });
        break;
      case 'whitebeard':
        // Gura Gura Sea-Quake: air-fracture crack into tectonic sub-bass tremor
        this.synthesizeEnvelope('sine', 78 * eventPitch, 20 * eventPitch, 0.38 * durScale, 0.36 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 420 * eventPitch,
          secondEndFreq: 44 * eventPitch,
          secondGainRatio: 0.66,
          detuneCents: -18,
          filterType: 'lowpass',
          filterFreq: 640 * eventPitch,
          filterEndFreq: 42 * eventPitch,
          filterQ: 4.1,
          fmRate: 34,
          fmDepth: 55,
        });
        break;
      case 'kenpachi':
        // Zaraki Jagged Cleaver: brutal heavy iron blade cleave
        this.synthesizeEnvelope('triangle', 1180 * eventPitch, 540 * eventPitch, 0.22 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 1960 * eventPitch,
          secondEndFreq: 820 * eventPitch,
          secondGainRatio: 0.56,
          detuneCents: 28,
          filterType: 'highpass',
          filterFreq: 740 * eventPitch,
          filterEndFreq: 1220 * eventPitch,
          filterQ: 3.8,
          fmRate: 40,
          fmDepth: 115,
        });
        break;
      case 'allmight':
        // United States of Smash: heroic air-tornado kinetic boom
        this.synthesizeEnvelope('sine', 180 * eventPitch, 36 * eventPitch, 0.30 * durScale, 0.34 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 360 * eventPitch,
          secondEndFreq: 72 * eventPitch,
          secondGainRatio: 0.64,
          filterType: 'lowpass',
          filterFreq: 1180 * eventPitch,
          filterEndFreq: 120 * eventPitch,
          filterQ: 2.6,
          fmRate: 22,
          fmDepth: 44,
        });
        break;
      case 'broly':
        // Legendary Eraser Cannon: feral green bio-energy roar
        this.synthesizeEnvelope('sawtooth', 210 * eventPitch, 46 * eventPitch, 0.31 * durScale, 0.32 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 420 * eventPitch,
          secondEndFreq: 92 * eventPitch,
          secondGainRatio: 0.58,
          detuneCents: -24,
          filterType: 'lowpass',
          filterFreq: 1460 * eventPitch,
          filterEndFreq: 140 * eventPitch,
          filterQ: 3.5,
          fmRate: 48,
          fmDepth: 88,
        });
        break;

      // --- BATCH 9: WEIRD & STRATEGIC ---
      case 'hisoka':
        // Bungee Gum: springy rubber-snap LFO sine + triangle twang
        this.synthesizeEnvelope('sine', 260 * eventPitch, 740 * eventPitch, 0.22 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 520 * eventPitch,
          secondEndFreq: 210 * eventPitch,
          secondGainRatio: 0.52,
          filterType: 'bandpass',
          filterFreq: 880 * eventPitch,
          filterQ: 4.4,
          fmRate: 24,
          fmDepth: 115,
        });
        break;
      case 'shikamaru':
        // Shadow Possession Bind: stealthy low creeping shadow swell
        this.synthesizeEnvelope('triangle', 185 * eventPitch, 72 * eventPitch, 0.26 * durScale, 0.26 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 92 * eventPitch,
          secondEndFreq: 36 * eventPitch,
          secondGainRatio: 0.65,
          filterType: 'lowpass',
          filterFreq: 390 * eventPitch,
          filterEndFreq: 110 * eventPitch,
          filterQ: 3.2,
          swellAttack: 0.35,
          fmRate: 9,
          fmDepth: 22,
        });
        break;
      case 'kurapika':
        // Judgment Chain: ringing highpass steel chain clink
        this.synthesizeEnvelope('triangle', 1960 * eventPitch, 1320 * eventPitch, 0.18 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 3140 * eventPitch,
          secondEndFreq: 2280 * eventPitch,
          secondGainRatio: 0.42,
          detuneCents: 16,
          filterType: 'highpass',
          filterFreq: 1420 * eventPitch,
          filterQ: 5.2,
          fmRate: 56,
          fmDepth: 190,
        });
        break;
      case 'shigaraki':
        // Touch Decay: gritty crumbling sawtooth + square rasp
        this.synthesizeEnvelope('sawtooth', 340 * eventPitch, 52 * eventPitch, 0.26 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 170 * eventPitch,
          secondEndFreq: 28 * eventPitch,
          secondGainRatio: 0.58,
          detuneCents: 35,
          filterType: 'bandpass',
          filterFreq: 620 * eventPitch,
          filterEndFreq: 140 * eventPitch,
          filterQ: 4.5,
          fmRate: 88,
          fmDepth: 140,
        });
        break;
      case 'katakuri':
        // Peerless Donut Mochi Punch: thick elastic lowpass thump
        this.synthesizeEnvelope('sine', 155 * eventPitch, 44 * eventPitch, 0.21 * durScale, 0.31 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 310 * eventPitch,
          secondEndFreq: 62 * eventPitch,
          secondGainRatio: 0.48,
          filterType: 'lowpass',
          filterFreq: 720 * eventPitch,
          filterEndFreq: 95 * eventPitch,
          filterQ: 3.6,
          fmRate: 15,
          fmDepth: 42,
        });
        break;

      // --- BATCH 10: MECHA & SCI-FI ---
      case 'eva01':
        // Eva-01 Progressive Knife & AT Field: menacing industrial square surge
        this.synthesizeEnvelope('square', 620 * eventPitch, 82 * eventPitch, 0.22 * durScale, 0.28 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 310 * eventPitch,
          secondEndFreq: 41 * eventPitch,
          secondGainRatio: 0.72,
          detuneCents: -19,
          filterType: 'bandpass',
          filterFreq: 940 * eventPitch,
          filterEndFreq: 210 * eventPitch,
          filterQ: 4.0,
          fmRate: 54,
          fmDepth: 165,
          lfoWaveform: 'square',
        });
        break;
      case 'gundam':
        // Mobile Suit Beam Rifle: classic descending square mecha laser pew
        this.synthesizeEnvelope('square', 1640 * eventPitch, 175 * eventPitch, 0.15 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 820 * eventPitch,
          secondEndFreq: 88 * eventPitch,
          secondGainRatio: 0.56,
          detuneCents: 12,
          filterType: 'lowpass',
          filterFreq: 4200 * eventPitch,
          filterEndFreq: 380 * eventPitch,
          filterQ: 2.8,
          fmRate: 48,
          fmDepth: 145,
          lfoWaveform: 'square',
        });
        break;
      case 'motoko':
        // Major Motoko Thermoptic SMG: stealthy crisp high-tech FM pew
        this.synthesizeEnvelope('square', 1940 * eventPitch, 240 * eventPitch, 0.12 * durScale, 0.23 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 970 * eventPitch,
          secondEndFreq: 120 * eventPitch,
          secondGainRatio: 0.48,
          filterType: 'highpass',
          filterFreq: 920 * eventPitch,
          filterQ: 3.1,
          fmRate: 64,
          fmDepth: 170,
        });
        break;
      case 'spike':
        // Jericho 941 & Jeet Kune Do Counter: crisp dry 9mm pistol crack
        this.synthesizeEnvelope('sawtooth', 960 * eventPitch, 64 * eventPitch, 0.16 * durScale, 0.28 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 480 * eventPitch,
          secondEndFreq: 32 * eventPitch,
          secondGainRatio: 0.65,
          filterType: 'lowpass',
          filterFreq: 2150 * eventPitch,
          filterEndFreq: 160 * eventPitch,
          filterQ: 2.2,
        });
        break;
      case 'edward':
        // Radical Edward Hacking Pulse: bubbly retro digital modem chirp
        this.synthesizeEnvelope('square', 420 * eventPitch, 1760 * eventPitch, 0.19 * durScale, 0.23 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 840 * eventPitch,
          secondEndFreq: 440 * eventPitch,
          secondGainRatio: 0.5,
          filterType: 'bandpass',
          filterFreq: 1320 * eventPitch,
          filterQ: 4.8,
          fmRate: 92,
          fmDepth: 320,
          lfoWaveform: 'square',
        });
        break;

      // --- ANIME LEGENDS & CLASSICS ---
      case 'starplatinum':
        // Jotaro Time Stop: ultra-deep sub-bass time warp drop + abrupt stop
        this.synthesizeEnvelope('sine', 92 * eventPitch, 24 * eventPitch, 0.34 * durScale, 0.35 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 184 * eventPitch,
          secondEndFreq: 36 * eventPitch,
          secondGainRatio: 0.58,
          detuneCents: -10,
          filterType: 'lowpass',
          filterFreq: 360 * eventPitch,
          filterEndFreq: 44 * eventPitch,
          filterQ: 4.4,
          swellAttack: 0.45,
          abruptCut: event === 'ability',
        });
        break;
      case 'alchemist':
        // Edward Elric Stone Pillars: heavy crunchy mineral earth quake
        this.synthesizeEnvelope('triangle', 142 * eventPitch, 38 * eventPitch, 0.28 * durScale, 0.31 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 284 * eventPitch,
          secondEndFreq: 76 * eventPitch,
          secondGainRatio: 0.62,
          filterType: 'lowpass',
          filterFreq: 540 * eventPitch,
          filterEndFreq: 88 * eventPitch,
          filterQ: 3.0,
          fmRate: 28,
          fmDepth: 52,
        });
        break;
      case 'shinigaminote':
        // Light Yagami Heart Attack: chilling low heartbeat swell
        this.synthesizeEnvelope('sine', 68 * eventPitch, 28 * eventPitch, 0.36 * durScale, 0.31 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 136 * eventPitch,
          secondEndFreq: 42 * eventPitch,
          secondGainRatio: 0.48,
          filterType: 'lowpass',
          filterFreq: 220 * eventPitch,
          filterEndFreq: 55 * eventPitch,
          filterQ: 4.0,
          swellAttack: 0.55,
          fmRate: 6,
          fmDepth: 14,
        });
        break;
      case 'oneforsmash':
        // Deku Detroit Smash: explosive kinetic bass punch + One For All spark
        this.synthesizeEnvelope('sine', 210 * eventPitch, 42 * eventPitch, 0.26 * durScale, 0.33 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 420 * eventPitch,
          secondEndFreq: 84 * eventPitch,
          secondGainRatio: 0.56,
          filterType: 'lowpass',
          filterFreq: 1540 * eventPitch,
          filterEndFreq: 140 * eventPitch,
          filterQ: 2.9,
          fmRate: 58,
          fmDepth: 110,
        });
        break;
      case 'capedbaldy':
        // Saitama Serious Punch: singular, deafening low-pass sine 'boom' with zero high-end frequency
        this.synthesizeEnvelope('sine', 118 * eventPitch, 24 * eventPitch, 0.42 * durScale, 0.44 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 59 * eventPitch,
          secondEndFreq: 18 * eventPitch,
          secondGainRatio: 0.92,
          filterType: 'lowpass',
          filterFreq: 135,
          filterEndFreq: 36,
          filterQ: 1.4,
        });
        break;
      case 'limitless':
        // Gojo Infinity: eerie, ambient spatial sine drone that suddenly cuts out
        this.synthesizeEnvelope('sine', 198 * eventPitch, 192 * eventPitch, 0.36 * durScale, 0.28 * gainScale, 'linear', {
          secondWaveform: 'sine',
          secondStartFreq: 297 * eventPitch,
          secondEndFreq: 288 * eventPitch,
          secondGainRatio: 0.65,
          detuneCents: 7,
          filterType: 'bandpass',
          filterFreq: 320 * eventPitch,
          filterQ: 3.5,
          fmRate: 5,
          fmDepth: 12,
          abruptCut: true,
        });
        break;
      case 'kingofcurses':
        // Sukuna Malevolent Cleave: aggressive, tearing sawtooth wave with heavy high-pass filter
        this.synthesizeEnvelope('sawtooth', 1850 * eventPitch, 520 * eventPitch, 0.17 * durScale, 0.28 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 2680 * eventPitch,
          secondEndFreq: 840 * eventPitch,
          secondGainRatio: 0.68,
          detuneCents: 31,
          filterType: 'highpass',
          filterFreq: 1680 * eventPitch,
          filterEndFreq: 2850 * eventPitch,
          filterQ: 5.8,
          fmRate: 68,
          fmDepth: 280,
        });
        break;
      case 'waterbreathing':
        // Tanjiro Flowing Water: fluid rising sine/triangle sweep with gentle wave LFO
        this.synthesizeEnvelope('sine', 360 * eventPitch, 820 * eventPitch, 0.20 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 720 * eventPitch,
          secondEndFreq: 1640 * eventPitch,
          secondGainRatio: 0.45,
          filterType: 'highpass',
          filterFreq: 490 * eventPitch,
          filterQ: 3.1,
          fmRate: 20,
          fmDepth: 68,
        });
        break;
      case 'thunderflash':
        // Zenitsu Thunderclap & Flash: razor-sharp high-voltage lightning snap
        this.synthesizeEnvelope('square', 2480 * eventPitch, 210 * eventPitch, 0.15 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 1240 * eventPitch,
          secondEndFreq: 105 * eventPitch,
          secondGainRatio: 0.54,
          detuneCents: 15,
          filterType: 'highpass',
          filterFreq: 1220 * eventPitch,
          filterEndFreq: 720 * eventPitch,
          filterQ: 4.2,
          fmRate: 86,
          fmDepth: 285,
          lfoWaveform: 'square',
        });
        break;
      case 'scoutspinner':
        // Levi ODM Spin: ultra-fast rotary steel whirr & highpass 'shing!'
        this.synthesizeEnvelope('triangle', 2150 * eventPitch, 2980 * eventPitch, 0.14 * durScale, 0.26 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 3225 * eventPitch,
          secondEndFreq: 1680 * eventPitch,
          secondGainRatio: 0.48,
          detuneCents: 20,
          filterType: 'highpass',
          filterFreq: 1580 * eventPitch,
          filterEndFreq: 2450 * eventPitch,
          filterQ: 4.6,
          fmRate: 52,
          fmDepth: 165,
        });
        break;
      case 'rubberpirate':
        // Luffy Gum-Gum Slingshot: bouncy, pitch-bending sine wave sweeping upwards like stretching rubber
        this.synthesizeEnvelope('sine', 145 * eventPitch, 720 * eventPitch, 0.22 * durScale, 0.30 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 210 * eventPitch,
          secondEndFreq: 1080 * eventPitch,
          secondGainRatio: 0.52,
          filterType: 'lowpass',
          filterFreq: 1350 * eventPitch,
          filterEndFreq: 2200 * eventPitch,
          filterQ: 4.8,
          fmRate: 16,
          fmDepth: 55,
        });
        break;
      case 'ninjashadow':
        // Naruto Shadow Clone & Kunai: crisp kunai steel flick + chakra wind
        this.synthesizeEnvelope('triangle', 1720 * eventPitch, 1140 * eventPitch, 0.14 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 860 * eventPitch,
          secondEndFreq: 1720 * eventPitch,
          secondGainRatio: 0.44,
          filterType: 'highpass',
          filterFreq: 980 * eventPitch,
          filterQ: 3.2,
          fmRate: 36,
          fmDepth: 125,
        });
        break;
      case 'supersaiyan':
        // Goku Kamehameha: rising ki beam surge into roaring sawtooth blast
        this.synthesizeEnvelope('sawtooth', 310 * eventPitch, 1180 * eventPitch, 0.28 * durScale, 0.29 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 155 * eventPitch,
          secondEndFreq: 590 * eventPitch,
          secondGainRatio: 0.68,
          detuneCents: -10,
          filterType: 'bandpass',
          filterFreq: 920 * eventPitch,
          filterEndFreq: 2400 * eventPitch,
          filterQ: 3.4,
          fmRate: 44,
          fmDepth: 130,
        });
        break;
      case 'soulreaper':
        // Ichigo Getsuga Tensho: dark crescent steel cleave
        this.synthesizeEnvelope('sawtooth', 1380 * eventPitch, 620 * eventPitch, 0.20 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 2420 * eventPitch,
          secondEndFreq: 960 * eventPitch,
          secondGainRatio: 0.52,
          detuneCents: 14,
          filterType: 'highpass',
          filterFreq: 860 * eventPitch,
          filterEndFreq: 1540 * eventPitch,
          filterQ: 3.8,
          fmRate: 30,
          fmDepth: 95,
        });
        break;
      case 'threesword':
        // Zoro Three-Sword Style: iconic triple-edge metallic 'shing!'
        this.synthesizeEnvelope('triangle', 1920 * eventPitch, 2780 * eventPitch, 0.17 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 3380 * eventPitch,
          secondEndFreq: 2240 * eventPitch,
          secondGainRatio: 0.5,
          detuneCents: 21,
          filterType: 'highpass',
          filterFreq: 1360 * eventPitch,
          filterEndFreq: 2560 * eventPitch,
          filterQ: 4.8,
        });
        break;

      // --- ORIGINAL ARENA SPECIALISTS ---
      case 'quadblade':
        // Knife Master: bright spinning 4-knife highpass chime
        this.synthesizeEnvelope('triangle', 2240 * eventPitch, 2880 * eventPitch, 0.15 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 3620 * eventPitch,
          secondEndFreq: 2440 * eventPitch,
          secondGainRatio: 0.45,
          detuneCents: 17,
          filterType: 'highpass',
          filterFreq: 1480 * eventPitch,
          filterQ: 4.5,
          fmRate: 34,
          fmDepth: 110,
        });
        break;
      case 'aura':
        // Mystic Aura: shimmering LFO harmonic magic pulse
        this.synthesizeEnvelope('sine', 740 * eventPitch, 1180 * eventPitch, 0.24 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 1480 * eventPitch,
          secondEndFreq: 1770 * eventPitch,
          secondGainRatio: 0.56,
          detuneCents: 9,
          filterType: 'bandpass',
          filterFreq: 1120 * eventPitch,
          filterEndFreq: 1780 * eventPitch,
          filterQ: 4.2,
          fmRate: 32,
          fmDepth: 145,
        });
        break;
      case 'venom':
        // Venom: viscous acidic bubbling lowpass sine LFO
        this.synthesizeEnvelope('sine', 195 * eventPitch, 365 * eventPitch, 0.21 * durScale, 0.25 * gainScale, 'linear', {
          secondWaveform: 'triangle',
          secondStartFreq: 98 * eventPitch,
          secondEndFreq: 182 * eventPitch,
          secondGainRatio: 0.48,
          filterType: 'lowpass',
          filterFreq: 980 * eventPitch,
          filterQ: 3.8,
          fmRate: 26,
          fmDepth: 110,
        });
        break;
      case 'mathgrid':
        // Math Grid: crisp digital geometric square logic tone
        this.synthesizeEnvelope('square', 880 * eventPitch, 1320 * eventPitch, 0.15 * durScale, 0.22 * gainScale, 'linear', {
          secondWaveform: 'sine',
          secondStartFreq: 440 * eventPitch,
          secondEndFreq: 660 * eventPitch,
          secondGainRatio: 0.52,
          filterType: 'bandpass',
          filterFreq: 1100 * eventPitch,
          filterQ: 5.0,
          fmRate: 40,
          fmDepth: 90,
        });
        break;
      case 'engineer':
        // Engineer Turret: mechanical ratchet square + sawtooth bolt
        this.synthesizeEnvelope('square', 1320 * eventPitch, 165 * eventPitch, 0.14 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 660 * eventPitch,
          secondEndFreq: 82 * eventPitch,
          secondGainRatio: 0.52,
          filterType: 'bandpass',
          filterFreq: 1080 * eventPitch,
          filterEndFreq: 290 * eventPitch,
          filterQ: 3.2,
          fmRate: 42,
          fmDepth: 115,
        });
        break;
      case 'sniper':
        // Sniper: supersonic tactical rifle crack + lowpass thud
        this.synthesizeEnvelope('sawtooth', 920 * eventPitch, 58 * eventPitch, 0.19 * durScale, 0.30 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 190 * eventPitch,
          secondEndFreq: 30 * eventPitch,
          secondGainRatio: 0.82,
          detuneCents: -8,
          filterType: 'lowpass',
          filterFreq: 2650 * eventPitch,
          filterEndFreq: 120 * eventPitch,
          filterQ: 2.4,
        });
        break;
      case 'bow':
        // Archer: taut wooden recurve bow triangle twang
        this.synthesizeEnvelope('triangle', 540 * eventPitch, 1380 * eventPitch, 0.12 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 960 * eventPitch,
          secondEndFreq: 380 * eventPitch,
          secondGainRatio: 0.42,
          filterType: 'highpass',
          filterFreq: 460 * eventPitch,
          filterQ: 2.8,
          fmRate: 18,
          fmDepth: 45,
        });
        break;
      case 'usopp':
        // Usopp Slingshot: quick high-pitched elastic triangle twang
        this.synthesizeEnvelope('triangle', 640 * eventPitch, 1620 * eventPitch, 0.11 * durScale, 0.26 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 1180 * eventPitch,
          secondEndFreq: 460 * eventPitch,
          secondGainRatio: 0.4,
          filterType: 'highpass',
          filterFreq: 520 * eventPitch,
          filterQ: 2.6,
        });
        break;
      case 'bakugo':
        // Bakugo Nitroglycerin Blast: crackling explosive blast
        this.synthesizeEnvelope('sawtooth', 175 * eventPitch, 30 * eventPitch, 0.30 * durScale, 0.34 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 88 * eventPitch,
          secondEndFreq: 22 * eventPitch,
          secondGainRatio: 0.8,
          detuneCents: -16,
          filterType: 'lowpass',
          filterFreq: 1420 * eventPitch,
          filterEndFreq: 75 * eventPitch,
          filterQ: 2.8,
          fmRate: 50,
          fmDepth: 90,
        });
        break;
      case 'blackhole':
        // Black Hole: ultra-deep singularity gravity vacuum swell
        this.synthesizeEnvelope('sine', 68 * eventPitch, 24 * eventPitch, 0.38 * durScale, 0.35 * gainScale, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 136 * eventPitch,
          secondEndFreq: 36 * eventPitch,
          secondGainRatio: 0.52,
          detuneCents: -12,
          filterType: 'lowpass',
          filterFreq: 240 * eventPitch,
          filterEndFreq: 42 * eventPitch,
          filterQ: 4.2,
          swellAttack: 0.58,
          fmRate: 8,
          fmDepth: 18,
        });
        break;
      case 'vampire':
        // Vampire: dark crimson life-steal siphon drain
        this.synthesizeEnvelope('triangle', 390 * eventPitch, 145 * eventPitch, 0.25 * durScale, 0.27 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 195 * eventPitch,
          secondEndFreq: 72 * eventPitch,
          secondGainRatio: 0.62,
          filterType: 'bandpass',
          filterFreq: 520 * eventPitch,
          filterEndFreq: 210 * eventPitch,
          filterQ: 3.6,
          swellAttack: 0.32,
          fmRate: 20,
          fmDepth: 48,
        });
        break;
      case 'mirror':
        // Mirage: shimmering ultra-high prismatic glass reflection
        this.synthesizeEnvelope('sine', 1860 * eventPitch, 2840 * eventPitch, 0.20 * durScale, 0.23 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 2790 * eventPitch,
          secondEndFreq: 4260 * eventPitch,
          secondGainRatio: 0.5,
          detuneCents: 14,
          filterType: 'highpass',
          filterFreq: 1620 * eventPitch,
          filterQ: 4.6,
          fmRate: 64,
          fmDepth: 250,
        });
        break;
      case 'jackpot':
        // Jackpot: bright retro casino arcade square bell arpeggio
        this.synthesizeEnvelope('square', 784 * eventPitch, 1568 * eventPitch, 0.16 * durScale, 0.23 * gainScale, 'linear', {
          secondWaveform: 'triangle',
          secondStartFreq: 1176 * eventPitch,
          secondEndFreq: 2352 * eventPitch,
          secondGainRatio: 0.5,
          filterType: 'highpass',
          filterFreq: 880 * eventPitch,
          filterQ: 3.0,
          fmRate: 28,
          fmDepth: 85,
        });
        break;
      case 'frost':
        // Frost Nova: crystalline cryo shatter chime
        this.synthesizeEnvelope('sine', 1520 * eventPitch, 2680 * eventPitch, 0.24 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 3040 * eventPitch,
          secondEndFreq: 4020 * eventPitch,
          secondGainRatio: 0.55,
          detuneCents: 11,
          filterType: 'highpass',
          filterFreq: 1380 * eventPitch,
          filterEndFreq: 2600 * eventPitch,
          filterQ: 4.0,
          fmRate: 76,
          fmDepth: 310,
        });
        break;
      case 'blink':
        // Blink: rapid quantum phase-shift square warp
        this.synthesizeEnvelope('square', 2120 * eventPitch, 390 * eventPitch, 0.13 * durScale, 0.24 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 620 * eventPitch,
          secondEndFreq: 1860 * eventPitch,
          secondGainRatio: 0.5,
          filterType: 'bandpass',
          filterFreq: 1480 * eventPitch,
          filterQ: 3.8,
          fmRate: 72,
          fmDepth: 220,
        });
        break;
      case 'trap':
        // Minefield: proximity mine concussion detonation
        this.synthesizeEnvelope('sawtooth', 145 * eventPitch, 32 * eventPitch, 0.29 * durScale, 0.32 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 580 * eventPitch,
          secondEndFreq: 64 * eventPitch,
          secondGainRatio: 0.54,
          filterType: 'lowpass',
          filterFreq: 1120 * eventPitch,
          filterEndFreq: 85 * eventPitch,
          filterQ: 2.8,
        });
        break;
      case 'inertia':
        // Juggernaut: ultra-heavy tungsten anvil slam
        this.synthesizeEnvelope('sine', 96 * eventPitch, 26 * eventPitch, 0.29 * durScale, 0.34 * gainScale, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 192 * eventPitch,
          secondEndFreq: 34 * eventPitch,
          secondGainRatio: 0.66,
          filterType: 'lowpass',
          filterFreq: 580 * eventPitch,
          filterEndFreq: 52 * eventPitch,
          filterQ: 3.4,
        });
        break;
      case 'swarm':
        // Drone Swarm: rapid high-pitched micro-plasma dart pew
        this.synthesizeEnvelope('square', 2260 * eventPitch, 320 * eventPitch, 0.10 * durScale, 0.22 * gainScale, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 1130 * eventPitch,
          secondEndFreq: 160 * eventPitch,
          secondGainRatio: 0.5,
          detuneCents: 15,
          filterType: 'highpass',
          filterFreq: 780 * eventPitch,
          filterQ: 2.5,
          fmRate: 60,
          fmDepth: 165,
          lfoWaveform: 'square',
        });
        break;
      case 'standard':
      default:
        // Brawler: punchy balanced kinetic triangle + sine thump
        this.synthesizeEnvelope('triangle', 310 * eventPitch, 82 * eventPitch, 0.15 * durScale, 0.25 * gainScale, 'exponential', {
          secondWaveform: 'sine',
          secondStartFreq: 155 * eventPitch,
          secondEndFreq: 40 * eventPitch,
          secondGainRatio: 0.65,
          filterType: 'lowpass',
          filterFreq: 1180 * eventPitch,
          filterEndFreq: 140 * eventPitch,
          filterQ: 2.0,
        });
        break;
    }
  }

  // General arena & UI sound effects (upgraded to HD dual-oscillator + BiquadFilterNode synthesis)
  public playEffect(type: ArenaSoundEffect): void {
    const ctx = this.getReadyContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (type === 'arrow') {
        this.playSciFiGuns(1.15, 'pew', 0.13);
        return;
      } else if (type === 'poison') {
        this.playVenomBubble(1.0);
        return;
      } else if (type === 'slice') {
        this.playSlashSteel(1.0, 0.16, 'shing');
        return;
      } else if (type === 'explosion') {
        this.playFireHeavy(1.0, 0.34, 'explosion');
        return;
      } else if (type === 'laser') {
        this.playSciFiGuns(1.0, 'pew', 0.15);
        return;
      } else if (type === 'freeze') {
        this.playIceMagic(1.0, 0.22, 'crystalline');
        return;
      } else if (type === 'shatter') {
        this.playIceMagic(1.22, 0.24, 'shatter');
        return;
      } else if (type === 'hit') {
        // Heavy hit: low-frequency sine sub-bass + sawtooth crunch through a punchy lowpass filter
        this.playFireHeavy(1.25, 0.16, 'punch');
        return;
      } else if (type === 'wall') {
        this.synthesizeEnvelope('sine', 130, 44, 0.09, 0.20, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 260,
          secondEndFreq: 88,
          secondGainRatio: 0.4,
          filterType: 'lowpass',
          filterFreq: 680,
          filterEndFreq: 120,
        });
        return;
      } else if (type === 'aura') {
        this.playIceMagic(0.88, 0.20, 'mystic');
        return;
      } else if (type === 'siphon') {
        this.playVoidGravityVoice(1.15, 0.22);
        return;
      } else if (type === 'teleport') {
        this.synthesizeEnvelope('sine', 320, 1080, 0.18, 0.24, 'exponential', {
          secondWaveform: 'square',
          secondStartFreq: 160,
          secondEndFreq: 540,
          filterType: 'bandpass',
          filterFreq: 820,
          lfoRate: 44,
          lfoDepth: 140,
        });
        return;
      } else if (type === 'dash') {
        this.synthesizeEnvelope('triangle', 260, 720, 0.16, 0.25, 'exponential', {
          secondWaveform: 'sawtooth',
          secondStartFreq: 520,
          secondEndFreq: 1440,
          filterType: 'highpass',
          filterFreq: 480,
        });
        return;
      } else if (type === 'start') {
        this.synthesizeEnvelope('sine', 220, 880, 0.28, 0.24, 'exponential', {
          secondWaveform: 'triangle',
          secondStartFreq: 440,
          secondEndFreq: 1760,
          filterType: 'lowpass',
          filterFreq: 2400,
        });
        return;
      }

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(420, now);
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'crit' || type === 'jackpot') {
        osc.type = 'square';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.07);
        osc.frequency.setValueAtTime(783, now + 0.14);
        osc.frequency.setValueAtTime(1046, now + 0.21);
        osc2.frequency.setValueAtTime(261.5, now);
        osc2.frequency.setValueAtTime(523, now + 0.21);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.45);
        osc2.stop(now + 0.45);
      } else if (type === 'ko') {
        osc.type = 'sawtooth';
        osc2.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.35);
        osc2.frequency.setValueAtTime(220, now);
        osc2.frequency.setValueAtTime(440, now + 0.35);
        gain.gain.setValueAtTime(0.30, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.65);
        osc2.stop(now + 0.65);
      }
    } catch {}
  }

  playFatalitySound(archetype: string) {
    const ctx = this.getReadyContext();
    if (!ctx) return;
    try {
      switch (archetype) {
        case 'Void': {
          this.playVoidGravityVoice(0.75, 0.65);
          break;
        }
        case 'Ice': {
          this.playIceMagic(1.12, 0.34, 'shatter');
          this.playIceMagic(0.78, 0.42, 'crystalline');
          break;
        }
        case 'Slash': {
          this.playSlashSteel(1.08, 0.20, 'shing');
          this.playSlashSteel(0.84, 0.28, 'cleave');
          break;
        }
        case 'Fire': {
          this.playFireHeavy(0.82, 0.52, 'explosion');
          break;
        }
        case 'Lightning': {
          this.playHighpassSnapVoice(1.05, 'lightning');
          this.playFireHeavy(1.1, 0.32, 'explosion');
          break;
        }
        case 'Cyber':
        case 'Ranged': {
          this.playSciFiGuns(0.95, 'pew', 0.18);
          this.playSciFiGuns(0.75, 'artillery', 0.26);
          break;
        }
        case 'Default':
        default: {
          this.playEffect('explosion');
          this.playEffect('ko');
          break;
        }
      }
    } catch {}
  }
}

export const audioController = new AudioController();

/* ==========================================================================
   FLOATING DAMAGE TEXT CLASS
   ========================================================================== */
export class DamageText {
  x: number;
  y: number;
  damage: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  elapsed: number;
  duration: number;
  vy: number;

  constructor(x: number, y: number, damage: number, attackerColor: string) {
    this.x = x;
    this.y = y;
    this.damage = Math.max(1, Math.round(damage));
    // Display a minus sign followed by the damage number (e.g., '-25')
    this.text = `-${this.damage}`;
    // Color matches the color of the ball that dealt the damage
    this.color = attackerColor;
    // Dynamically scale font size based on damage amount, scaled up by +30% (1.3x)
    this.fontSize = Math.round(Math.min(72, Math.round(18 + this.damage * 1.8)) * 1.3);
    this.alpha = 1.0;
    this.elapsed = 0;
    // Slowly float upwards and fade out over 1.5 seconds
    this.duration = 1.5;
    this.vy = -36; // upward velocity in pixels per second
  }

  update(dt: number): boolean {
    this.elapsed += dt;
    this.y += this.vy * dt;
    this.alpha = Math.max(0, 1 - this.elapsed / this.duration);
    return this.elapsed < this.duration && this.alpha > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = `900 ${this.fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, Math.round(this.fontSize * 0.16));
    ctx.strokeStyle = this.color.toLowerCase() === '#000000' ? '#f8fafc' : '#0f172a';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

/* ==========================================================================
   GLOBAL PARTICLE ENGINE
   ========================================================================== */
export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity?: number;
  update?: (dt?: number) => void;
  draw?: (ctx: CanvasRenderingContext2D) => void;
  radius?: number;
  size?: number;
  shrink?: number;
  decay?: number;
  targetX?: number;
  targetY?: number;
  color?: string;
  alpha?: number;
  life?: number;
  maxLife?: number;
}

function colorToRgbFloats(color: string = '#f59e0b') {
  if (!color) return { r: 0.96, g: 0.62, b: 0.07 };
  if (color.startsWith('#')) {
    let c = color.slice(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const n = parseInt(c, 16);
    if (!isNaN(n)) {
      return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
    }
  }
  return { r: 0.96, g: 0.62, b: 0.07 };
}

export class TypedParticlePool {
  static readonly MAX = 4000;
  static readonly STRIDE = 12;
  data = new Float32Array(TypedParticlePool.MAX * TypedParticlePool.STRIDE);
  count = 0;

  clear() {
    this.count = 0;
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    decay: number,
    type: number,
    color: string = '#f59e0b',
    life: number = 1.0,
    rot: number = 0
  ) {
    if (this.count >= TypedParticlePool.MAX) {
      this.count = TypedParticlePool.MAX - 1;
    }
    const idx = this.count * TypedParticlePool.STRIDE;
    this.count++;

    const rgb = colorToRgbFloats(color);

    this.data[idx] = x;
    this.data[idx + 1] = y;
    this.data[idx + 2] = vx;
    this.data[idx + 3] = vy;
    this.data[idx + 4] = life;
    this.data[idx + 5] = decay;
    this.data[idx + 6] = radius;
    this.data[idx + 7] = type;
    this.data[idx + 8] = rgb.r;
    this.data[idx + 9] = rgb.g;
    this.data[idx + 10] = rgb.b;
    this.data[idx + 11] = rot;
  }

  push(p: any) {
    if (!p) return;
    const x = p.x ?? 0;
    const y = p.y ?? 0;
    const vx = p.vx ?? (Math.random() - 0.5) * 8;
    const vy = p.vy ?? (Math.random() - 0.5) * 8;
    const radius = p.radius ?? p.size ?? p.length ?? 4;
    const decay = p.decay ?? 0.015;
    const color = p.color ?? p.baseColor ?? '#f59e0b';
    const life = p.opacity ?? p.alpha ?? 1.0;
    const rot = p.rotation ?? 0;

    let type = 0;
    if (p.points) type = 1;
    else if (p.isSmoke || p.kind === 'smoke') type = 2;
    else if (p.flashFrame !== undefined) type = 3;
    else if (p.length !== undefined) type = 4;

    this.spawn(x, y, vx, vy, radius, decay, type, color, life, rot);
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, dt: number = 0.016) {
    if (this.count === 0) return;
    const step = Math.max(0.05, dt * 60);
    const dragFactor = Math.pow(0.94, step);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    let i = 0;
    while (i < this.count) {
      const idx = i * TypedParticlePool.STRIDE;

      // Update position scaled by dt * 60 (respecting global timeScale)
      this.data[idx] += this.data[idx + 2] * step; // x += vx * step
      this.data[idx + 1] += this.data[idx + 3] * step; // y += vy * step
      this.data[idx + 2] *= dragFactor; // vx *= 0.94^step
      this.data[idx + 3] *= dragFactor; // vy *= 0.94^step

      const type = this.data[idx + 7];
      if (type === 0 || type === 1) {
        this.data[idx + 3] += 0.14 * step; // vy += gravity
      } else if (type === 2) {
        this.data[idx + 6] += 0.25 * step; // radius += growth
      }

      this.data[idx + 4] -= this.data[idx + 5] * step; // life -= decay

      const life = this.data[idx + 4];
      if (life <= 0) {
        // Swap with last active particle
        this.count--;
        if (i < this.count) {
          const lastIdx = this.count * TypedParticlePool.STRIDE;
          for (let k = 0; k < TypedParticlePool.STRIDE; k++) {
            this.data[idx + k] = this.data[lastIdx + k];
          }
        }
        continue;
      }

      const x = this.data[idx];
      const y = this.data[idx + 1];
      const radius = Math.max(0.5, this.data[idx + 6]);
      const r = Math.floor(this.data[idx + 8] * 255);
      const g = Math.floor(this.data[idx + 9] * 255);
      const b = Math.floor(this.data[idx + 10] * 255);
      const rot = this.data[idx + 11];

      ctx.globalAlpha = Math.max(0, life);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;

      if (type === 3) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillRect(-radius / 2, -radius / 2, radius, radius);
        ctx.restore();
      } else if (type === 4) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - this.data[idx + 2] * 1.5, y - this.data[idx + 3] * 1.5);
        ctx.stroke();
      } else if (type === 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillRect(-radius / 2, -radius / 2, radius, radius * 0.7);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      i++;
    }

    ctx.restore();
  }
}

export const globalParticlePool = new TypedParticlePool();

export let particles: any = new Proxy(globalParticlePool, {
  get(target, prop, receiver) {
    if (prop === 'push') {
      return (...items: any[]) => {
        for (const item of items) target.push(item);
      };
    }
    if (prop === 'length') {
      return target.count;
    }
    if (prop === 'filter') {
      return (_predicate?: (p: any) => boolean) => {
        let i = 0;
        while (i < target.count) {
          const offset = i * TypedParticlePool.STRIDE;
          if (target.data[offset + 4] <= 0) {
            target.count--;
            if (i < target.count) {
              const lastOffset = target.count * TypedParticlePool.STRIDE;
              target.data.copyWithin(offset, lastOffset, lastOffset + TypedParticlePool.STRIDE);
            }
          } else {
            i++;
          }
        }
        return particles;
      };
    }
    if (prop === 'splice') {
      return (start: number, deleteCount: number) => {
        if (start === 0 && deleteCount >= target.count) {
          target.count = 0;
        }
      };
    }
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      const idx = Number(prop);
      if (idx >= 0 && idx < target.count) {
        const offset = idx * TypedParticlePool.STRIDE;
        return {
          x: target.data[offset],
          y: target.data[offset + 1],
          vx: target.data[offset + 2],
          vy: target.data[offset + 3],
          opacity: target.data[offset + 4],
          life: target.data[offset + 4],
        };
      }
    }
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    if (prop === 'length') {
      target.count = Math.max(0, Math.min(value, TypedParticlePool.MAX));
      return true;
    }
    return Reflect.set(target, prop, value, receiver);
  },
});

export let currentArena: string = 'Default';
if (typeof window !== 'undefined') {
  (window as any).particles = particles;
  (window as any).globalParticlePool = globalParticlePool;
  (window as any).currentArena = currentArena;
}

// 1. Fire Characters: Rising Orange & Grey Circle Particles (smoke & embers)
export class RisingCircleParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  isSmoke: boolean;
  decay: number;
  growth: number;

  constructor(x: number, y: number, kind: 'smoke' | 'ember' = 'ember') {
    this.isSmoke = kind === 'smoke';
    this.x = x + (Math.random() - 0.5) * 32;
    this.y = y + (Math.random() - 0.5) * 32;
    this.vx = (Math.random() - 0.5) * (this.isSmoke ? 4.5 : 9.5);
    this.vy = -(3.0 + Math.random() * (this.isSmoke ? 5.0 : 9.5));
    this.radius = this.isSmoke ? 12 + Math.random() * 18 : 5 + Math.random() * 8;
    const smokeColors = ['#4b5563', '#6b7280', '#374151', '#9ca3af', '#1f2937'];
    const emberColors = ['#ff5722', '#ff9800', '#f97316', '#fbbf24', '#ef4444'];
    this.color = this.isSmoke
      ? smokeColors[Math.floor(Math.random() * smokeColors.length)]
      : emberColors[Math.floor(Math.random() * emberColors.length)];
    this.opacity = this.isSmoke ? 0.88 : 1.0;
    this.decay = this.isSmoke ? 0.005 + Math.random() * 0.004 : 0.007 + Math.random() * 0.005;
    this.growth = this.isSmoke ? 0.28 : 0.08;
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.radius += this.growth;
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 2. Ice Characters: Jagged Cyan Polygon Shapes (shards) that explode outward and fade
export class ShardParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number = 1.0;
  rotation: number;
  vRot: number;
  decay: number;
  color: string;
  points: { x: number; y: number }[];

  constructor(x: number, y: number, customColor: string = '#22d3ee') {
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y + (Math.random() - 0.5) * 20;
    const angle = Math.random() * Math.PI * 2;
    const speed = 8.0 + Math.random() * 20.0;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.45;
    this.decay = 0.007 + Math.random() * 0.006;
    const iceColors = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#e0f2fe', customColor];
    this.color = iceColors[Math.floor(Math.random() * iceColors.length)];

    const numPoints = 3 + Math.floor(Math.random() * 3);
    const size = 9 + Math.random() * 14;
    this.points = [];
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const r = size * (0.5 + Math.random() * 0.6);
      this.points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.vy += 0.18; // gravity drop
    this.rotation += this.vRot;
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0 || this.points.length < 3) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// 3. Ninja/Speed Characters: Expanding White Cloud Particles ('poof' smoke-bomb exit)
export class CloudParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  growth: number;
  opacity: number = 0.95;
  decay: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x + (Math.random() - 0.5) * 28;
    this.y = y + (Math.random() - 0.5) * 28;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 8.0;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12 + Math.random() * 15;
    this.growth = 0.95 + Math.random() * 1.1;
    this.decay = 0.008 + Math.random() * 0.006;
    const whites = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
    this.color = whites[Math.floor(Math.random() * whites.length)];
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.radius += this.growth;
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 4. Tech/Mecha Characters: Square, Yellow Electrical Spark Particles that flash rapidly
export class SquareSparkParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  opacity: number = 1.0;
  decay: number;
  flashFrame: number = 0;
  baseColor: string;

  constructor(x: number, y: number, baseColor: string = '#facc15') {
    this.x = x + (Math.random() - 0.5) * 24;
    this.y = y + (Math.random() - 0.5) * 24;
    const angle = Math.random() * Math.PI * 2;
    const speed = 8.5 + Math.random() * 22.0;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 7.0 + Math.random() * 9.0;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.55;
    this.decay = 0.008 + Math.random() * 0.007;
    this.baseColor = baseColor;
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.rotation += this.vRot;
    this.flashFrame++;
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const isWhite = Math.floor(this.flashFrame / 2) % 2 === 0;
    ctx.fillStyle = isWhite ? '#ffffff' : this.baseColor;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// 5. Standard / Base Explosion Particle
export class ExplosionParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number = 1.0;
  decay: number;

  constructor(x: number, y: number, color: string, speedMultiplier: number = 1) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = (6.0 + Math.random() * 18.0) * speedMultiplier;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 4 + Math.random() * 6.5;
    this.color = color;
    this.decay = 0.007 + Math.random() * 0.006;
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.vy += 0.15; // gravity drop
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 6. Directional Slash Spark Particle
export class SlashSparkParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  color: string;
  opacity: number = 1.0;
  decay: number;

  constructor(x: number, y: number, color: string = '#ef4444', angle?: number) {
    this.x = x;
    this.y = y;
    const dir = angle !== undefined ? angle + (Math.random() - 0.5) * 0.4 : Math.random() * Math.PI * 2;
    const speed = 10.0 + Math.random() * 24.0;
    this.vx = Math.cos(dir) * speed;
    this.vy = Math.sin(dir) * speed;
    this.length = 14 + Math.random() * 22;
    this.color = color;
    this.decay = 0.009 + Math.random() * 0.007;
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
    ctx.stroke();
    ctx.restore();
  }
}

// 7. Implosion Singularity Void Particle
export class VoidParticle implements GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number = 1.0;
  decay: number;

  constructor(originX: number, originY: number, color: string = '#a855f7') {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 85;
    this.x = originX + Math.cos(angle) * dist;
    this.y = originY + Math.sin(angle) * dist;
    this.vx = -Math.cos(angle) * (6.0 + Math.random() * 10.0);
    this.vy = -Math.sin(angle) * (6.0 + Math.random() * 10.0);
    this.radius = 3.5 + Math.random() * 5.5;
    this.color = color;
    this.decay = 0.008 + Math.random() * 0.006;
  }

  update(_dt: number = 0.016) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.radius = Math.max(0.5, this.radius - 0.03);
    this.opacity = Math.max(0, this.opacity - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function pushProjectileTrail(p: { x: number; y: number; trail?: { x: number; y: number }[] }) {
  if (!p.trail) p.trail = [];
  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 5) p.trail.shift();
}

export function sweptSegmentDistToPoint(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) return Math.hypot(px - x2, py - y2);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function clampProjectileSpawn(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(355, Math.min(925, x)),
    y: Math.max(75, Math.min(645, y)),
  };
}

export function drawArcadeCometTrail(
  ctx: CanvasRenderingContext2D,
  trail: { x: number; y: number }[] | undefined,
  color: string,
  baseWidth: number = 14
) {
  if (!trail || trail.length < 2) return;

  const startP = trail[0];
  const endP = trail[trail.length - 1];
  const grad = ctx.createLinearGradient(startP.x, startP.y, endP.x, endP.y);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, '#ffffff');

  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = grad;
  ctx.lineWidth = baseWidth * 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startP.x, startP.y);
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

// Scales all projectiles and background items (turrets, mines, puddles, summons, kunai, portals)
// by +30% (1.3x) around their local center without altering arena coordinates!
export function createScaledEntityContext(
  ctx: CanvasRenderingContext2D,
  scale: number = 1.3
): CanvasRenderingContext2D {
  let isTranslated = false;
  const stateStack: boolean[] = [];

  return new Proxy(ctx, {
    get(target, prop, _receiver) {
      if (prop === 'save') {
        return () => {
          stateStack.push(isTranslated);
          target.save();
        };
      }
      if (prop === 'restore') {
        return () => {
          isTranslated = stateStack.pop() ?? false;
          target.restore();
        };
      }
      if (prop === 'translate') {
        return (x: number, y: number) => {
          if (!isTranslated) {
            target.translate(x, y);
            target.scale(scale, scale);
            isTranslated = true;
          } else {
            target.translate(x, y);
          }
        };
      }
      if (prop === 'arc') {
        return (
          x: number,
          y: number,
          radius: number,
          startAngle: number,
          endAngle: number,
          counterclockwise?: boolean
        ) => {
          target.arc(
            x,
            y,
            isTranslated ? radius : radius * scale,
            startAngle,
            endAngle,
            counterclockwise
          );
        };
      }
      if (prop === 'ellipse') {
        return (
          x: number,
          y: number,
          radiusX: number,
          radiusY: number,
          rotation: number,
          startAngle: number,
          endAngle: number,
          counterclockwise?: boolean
        ) => {
          target.ellipse(
            x,
            y,
            isTranslated ? radiusX : radiusX * scale,
            isTranslated ? radiusY : radiusY * scale,
            rotation,
            startAngle,
            endAngle,
            counterclockwise
          );
        };
      }
      if (prop === 'createRadialGradient') {
        return (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
          return target.createRadialGradient(
            x0,
            y0,
            isTranslated ? r0 : r0 * scale,
            x1,
            y1,
            isTranslated ? r1 : r1 * scale
          );
        };
      }
      if (prop === 'fillRect') {
        return (x: number, y: number, w: number, h: number) => {
          if (isTranslated) {
            target.fillRect(x, y, w, h);
          } else {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const nw = w * scale;
            const nh = h * scale;
            target.fillRect(cx - nw / 2, cy - nh / 2, nw, nh);
          }
        };
      }
      if (prop === 'strokeRect') {
        return (x: number, y: number, w: number, h: number) => {
          if (isTranslated) {
            target.strokeRect(x, y, w, h);
          } else {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const nw = w * scale;
            const nh = h * scale;
            target.strokeRect(cx - nw / 2, cy - nh / 2, nw, nh);
          }
        };
      }
      if (prop === 'roundRect') {
        return (x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[]) => {
          if (isTranslated) {
            target.roundRect(x, y, w, h, radii);
          } else {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const nw = w * scale;
            const nh = h * scale;
            target.roundRect(cx - nw / 2, cy - nh / 2, nw, nh, radii);
          }
        };
      }

      const val = (target as any)[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    },
    set(target, prop, value) {
      if (prop === 'lineWidth' && !isTranslated && typeof value === 'number') {
        target.lineWidth = value * scale;
        return true;
      }
      (target as any)[prop] = value;
      return true;
    },
  });
}

/* ==========================================================================
   BASE BALL CLASS (Master Ball)
   ========================================================================== */
export class Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  targetVx: number;
  targetVy: number;
  mass: number;
  radius: number;
  initialRadius: number;
  health: number;
  maxHealth: number;
  color: string;
  initialColor: string;
  glowColor: string;
  initialGlowColor: string;
  name: string;
  playerName: string;
  type: BallTypeId;
  iconText: string;
  totalDamageDealt: number;
  level: number;
  private lastCollisionVoiceMs: number = 0;
  wins: number;
  damageFlash: number;
  isFrozen: boolean = false;
  frozenTimer: number = 0;
  infinitySlowTimer: number = 0;
  waterSlowTimer: number = 0;
  timeStopFrozenTimer: number = 0;
  hackedDisableTimer: number = 0;
  decayTimer: number = 0;
  decayTickTimer: number = 0;
  screenShakeTimer: number = 0;
  opticCamoTimer: number = 0;
  trail: { x: number; y: number; alpha: number }[];
  floatingTexts: { text: string; x: number; y: number; alpha: number; color: string; vy: number }[];
  damageTexts: DamageText[];
  phaseDamageMultiplier: number;
  hitCount: number = 0;
  hitScalingBonus: number = 0;
  prevX: number = 0;
  prevY: number = 0;
  parryActiveTimer: number = 0;
  parryCooldownTimer: number = 0;
  parryPenaltyLockoutTimer: number = 0;
  parryInputTimestamps: number[] = [];
  dodgeDashCooldownDuration: number = 3.0;
  dodgeDashCooldownTimer: number = 0;
  dodgeInvulnTimer: number = 0;
  roundElapsed: number;
  lastAttacker: Ball | null = null;
  currentOpponent: Ball | null = null;
  isDead: boolean = false;
  hasPlayedDeath: boolean = false;
  deathElapsed: number = 0;
  isCelebratingVictory: boolean = false;
  victoryHopTimer: number = 0;
  victoryHopOffsetY: number = 0;
  victoryBaseY: number | null = null;
  launchAngle: number = 0;
  activeEmote: { emoji: string; timer: number } | null = null;
  renderDt: number = 0.016;
  fatalityState: {
    style:
      | 'slash'
      | 'beam'
      | 'sniper'
      | 'lightning'
      | 'ice_shatter'
      | 'inferno'
      | 'singularity'
      | 'curse_heart'
      | 'colossal_smash'
      | 'explosion';
    timer: number;
    maxTimer: number;
    attackerX: number;
    attackerY: number;
    attackerColor: string;
    finisherLabel: string;
    render: (ctx: CanvasRenderingContext2D, dt: number) => void;
  } | null = null;

  constructor(
    x: number,
    y: number,
    radius: number,
    mass: number,
    color: string,
    glowColor: string,
    playerName: string,
    startingHealth = 100,
    type: BallTypeId = 'standard',
    iconText: string = '⚔️'
  ) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.targetVx = 0;
    this.targetVy = 0;
    this.mass = mass;
    const scaledRadius = radius * 1.3;
    this.radius = scaledRadius;
    this.initialRadius = scaledRadius;
    this.health = startingHealth;
    this.maxHealth = startingHealth;
    this.color = color;
    this.initialColor = color;
    this.glowColor = glowColor;
    this.initialGlowColor = glowColor;
    this.name = playerName;
    this.playerName = playerName;
    this.type = type;
    this.iconText = iconText;
    this.totalDamageDealt = 0;
    this.level = 1;
    this.wins = 0;
    this.damageFlash = 0;
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.infinitySlowTimer = 0;
    this.waterSlowTimer = 0;
    this.timeStopFrozenTimer = 0;
    this.hackedDisableTimer = 0;
    this.decayTimer = 0;
    this.decayTickTimer = 0;
    this.screenShakeTimer = 0;
    this.opticCamoTimer = 0;
    this.trail = [];
    this.floatingTexts = [];
    this.damageTexts = [];
    this.phaseDamageMultiplier = 1.0;
    this.roundElapsed = 0;
    this.lastAttacker = null;
    this.isDead = false;
    this.deathElapsed = 0;
    this.isCelebratingVictory = false;
    this.victoryHopTimer = 0;
    this.victoryHopOffsetY = 0;
    this.victoryBaseY = null;
    this.launchAngle = 0;
    this.fatalityState = null;
  }

  _archetype: string = '';

  get archetype(): string {
    if (this._archetype) return this._archetype;
    const cName = this.constructor ? this.constructor.name : '';
    const n = (this.name || '').toLowerCase();

    // Fire (Natsu, Mustang, Todoroki, Escanor, Megumin)
    if (
      ['Natsu', 'RoyMustang', 'Mustang', 'Todoroki', 'Escanor', 'Megumin', 'Minefield'].includes(cName) ||
      ['natsu', 'mustang', 'todoroki', 'escanor', 'megumin', 'minefield', 'flame', 'fire'].some((k) => n.includes(k))
    ) {
      return 'Fire';
    }

    // Ice (Aokiji, Esdeath)
    if (
      ['Aokiji', 'Esdeath', 'FrostNova'].includes(cName) ||
      ['aokiji', 'esdeath', 'frost', 'ice', 'cryo'].some((k) => n.includes(k))
    ) {
      return 'Ice';
    }

    // Slash (Zoro, Levi, Sukuna, Ichigo, Kenpachi)
    if (
      [
        'ThreeSwordBall',
        'Zoro',
        'ScoutSpinnerBall',
        'Levi',
        'Sukuna',
        'KingOfCursesBall',
        'Ichigo',
        'SoulReaperBall',
        'Kenpachi',
        'KnifeMaster',
        'KnifeBall',
        'DeathKid',
        'Kurapika',
        'Tanjiro',
      ].includes(cName) ||
      ['zoro', 'levi', 'sukuna', 'ichigo', 'kenpachi', 'blade', 'slash', 'knife', 'deathkid', 'kurapika', 'tanjiro', 'sword'].some((k) => n.includes(k))
    ) {
      return 'Slash';
    }

    // Void (Black Hole, Yami, Gojo, Rimuru, Shikamaru)
    if (
      ['BlackHoleBall', 'BlackHole', 'Yami', 'Gojo', 'LimitlessBall', 'Rimuru', 'Shikamaru', 'Shigaraki', 'Vampire', 'LightYagami', 'Fushiguro'].includes(cName) ||
      ['black hole', 'yami', 'gojo', 'rimuru', 'shikamaru', 'void', 'shigaraki', 'vampire', 'light', 'fushiguro', 'dark', 'shadow'].some((k) => n.includes(k))
    ) {
      return 'Void';
    }

    // Lightning (Killua, Zenitsu, Yoruichi, Minato)
    if (
      ['Killua', 'ThunderFlashBall', 'Zenitsu', 'Yoruichi', 'Minato'].includes(cName) ||
      ['killua', 'zenitsu', 'yoruichi', 'minato', 'thunder', 'lightning', 'zap', 'flash'].some((k) => n.includes(k))
    ) {
      return 'Lightning';
    }

    // Cyber (Gundam, Eva-01, Edward)
    if (
      ['Gundam', 'EvaUnit01', 'Eva-01', 'Edward', 'EdwardElric', 'Motoko', 'Engineer', 'DroneSwarm', 'MathGrid', 'Blink'].includes(cName) ||
      ['gundam', 'eva', 'edward', 'motoko', 'cyber', 'mecha', 'engineer', 'drone', 'math', 'blink', 'tech'].some((k) => n.includes(k))
    ) {
      return 'Cyber';
    }

    return 'Default';
  }

  set archetype(val: string) {
    this._archetype = val;
  }

  collisionDamageMultiplier: number = 1.0;

  get isRanged(): boolean {
    if (this.collisionDamageMultiplier < 0.5) return true;
    if (['Ranged', 'Sniper', 'Magic'].includes(this.archetype)) return true;
    const cName = this.constructor ? this.constructor.name : '';
    if (
      [
        'Sniper',
        'SniperBall',
        'Archer',
        'Engineer',
        'LaserBall',
        'Gojo',
        'Vash',
        'DeathKid',
        'Sinon',
        'Hawkeye',
        'Megumin',
        'DrStrange',
        'Natsu',
        'Ace',
        'RoyMustang',
        'Todoroki',
        'Broly',
        'Gundam',
        'Motoko',
        'Spike',
        'DroneSwarm',
        'MathGrid',
      ].includes(cName)
    ) {
      return true;
    }
    return false;
  }

  drawLaserSight(ctx: CanvasRenderingContext2D) {
    if (this.isDead || !this.isRanged) return;

    const opponent = this.currentOpponent;
    if (!opponent || opponent.isDead) return;

    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0.001) return;

    const angle = Math.atan2(dy, dx);
    const lineDist = Math.max(0, dist - opponent.radius);
    const endX = this.x + Math.cos(angle) * lineDist;
    const endY = this.y + Math.sin(angle) * lineDist;

    ctx.save();
    // 1. Outer Neon Laser Glow Line
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.glowColor || '#ef4444';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 2. High-Visibility Inner Dashed Core
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    ctx.setLineDash([9, 6]);
    ctx.lineDashOffset = -((Date.now() / 20) % 15);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 3. Circular Targeting Reticle directly on the Opponent's Body
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = this.glowColor || '#ef4444';
    ctx.beginPath();
    ctx.arc(opponent.x, opponent.y, opponent.radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(opponent.x, opponent.y, Math.max(8, opponent.radius * 0.48), 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawProjectiles(_ctx: CanvasRenderingContext2D) {
    // Base hook overridden by subclasses with active projectiles
  }

  // Subclass-specific synthesized voice triggers
  playAttackVoice() {
    audioController.playSubclassVoice(this.type, 'attack');
  }

  playHitVoice() {
    audioController.playSubclassVoice(this.type, 'hit');
  }

  playAbilityVoice() {
    audioController.playSubclassVoice(this.type, 'ability');
  }

  protected canPlayCollisionVoice(): boolean {
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastCollisionVoiceMs < 40) return false;
    this.lastCollisionVoiceMs = nowMs;
    return true;
  }

  // Material-based physical collision sound (overridden by Mecha, Heavy, Liquid, and Ice subclasses)
  playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playKineticCollisionThud(1.0);
  }

  get effectiveHitRadius(): number {
    const speed = Math.hypot(this.vx, this.vy);
    // Velocity-adaptive hitbox compensation prevents high-velocity tunneling & rigid hitbox misses
    return this.radius + Math.min(11, speed * 0.38);
  }

  isAbilityReady(): boolean {
    if (this.isDead || this.timeStopFrozenTimer > 0 || this.hackedDisableTimer > 0) {
      return false;
    }
    const parryReady =
      this.parryCooldownTimer <= 0 &&
      this.parryPenaltyLockoutTimer <= 0 &&
      this.parryActiveTimer <= 0;
    const dashReady = this.dodgeDashCooldownTimer <= 0 && this.dodgeInvulnTimer <= 0;
    const selfAny = this as any;
    const subclassAbilityReady =
      (typeof selfAny.backDashCooldown === 'number' && selfAny.backDashCooldown <= 0) ||
      (typeof selfAny.dashCooldown === 'number' && selfAny.dashCooldown <= 0);
    return parryReady || dashReady || subclassAbilityReady;
  }

  getSpecialCooldownInfo(): {
    progress: number;
    remainingSeconds: number;
    isActive: boolean;
    statusText: string;
  } {
    if (this.isDead) {
      return { progress: 0, remainingSeconds: 0, isActive: false, statusText: 'KO' };
    }
    const freezeRem = Math.max(0, this.timeStopFrozenTimer, this.hackedDisableTimer);
    if (freezeRem > 0) {
      return {
        progress: 0,
        remainingSeconds: freezeRem,
        isActive: false,
        statusText: `LOCK ${freezeRem.toFixed(1)}s`,
      };
    }

    const s = this as any;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    const up = (timerVal: unknown, maxVal: number, active = false) => {
      if (active) {
        return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'ACTIVE' };
      }
      const max = Math.max(0.1, maxVal);
      const t = Math.max(0, typeof timerVal === 'number' && Number.isFinite(timerVal) ? timerVal : 0);
      const progress = clamp01(t / max);
      const remainingSeconds = Math.max(0, max - t);
      return {
        progress,
        remainingSeconds,
        isActive: false,
        statusText: progress >= 0.99 ? 'READY' : `${remainingSeconds.toFixed(1)}s`,
      };
    };
    const down = (timerVal: unknown, maxVal: number, active = false) => {
      if (active) {
        return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'ACTIVE' };
      }
      const max = Math.max(0.1, maxVal);
      const remainingSeconds = Math.max(
        0,
        typeof timerVal === 'number' && Number.isFinite(timerVal) ? timerVal : 0
      );
      const progress = clamp01(1 - remainingSeconds / max);
      return {
        progress,
        remainingSeconds,
        isActive: false,
        statusText: progress >= 0.99 ? 'READY' : `${remainingSeconds.toFixed(1)}s`,
      };
    };
    const parryFallback = () => {
      if (this.parryActiveTimer > 0) {
        return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'ACTIVE' };
      }
      if (this.parryPenaltyLockoutTimer > 0) {
        return down(this.parryPenaltyLockoutTimer, 2.8);
      }
      if (this.parryCooldownTimer > 0) {
        return down(this.parryCooldownTimer, 1.35);
      }
      return { progress: 1, remainingSeconds: 0, isActive: false, statusText: 'READY' };
    };

    switch (this.type) {
      // Count-up special timers
      case 'frost':
        return up(s.novaTimer, s.novaCooldown || 4.5);
      case 'blink':
        return up(s.teleportTimer, s.teleportCooldown || 3.6);
      case 'trap':
        return up(s.deployTimer, s.deployCooldown || 2.8);
      case 'supersaiyan':
        return up(s.chargeTimer, s.chargeDuration || 10.0, (s.beamActiveTimer ?? 0) > 0);
      case 'thunderflash':
        return up(s.thunderTimer, s.thunderCooldown || 6.0);
      case 'starplatinum':
        return up(s.timeStopTimer, s.timeStopCooldown || 12.0, (s.timeStopActiveTimer ?? 0) > 0);
      case 'alchemist':
        return up(s.pillarTimer, s.pillarCooldown || 4.0);
      case 'shinigaminote':
        return up(s.unharmedTimer, s.requiredSafeSeconds || 8.0);
      case 'natsu':
        return up(s.roarTimer, 3.5);
      case 'todoroki':
        return up(s.cycleTimer, 3.2);
      case 'mustang':
        return up(s.snapTimer, 3.0);
      case 'killua':
        return up(s.zapTimer, 1.4);
      case 'yoruichi':
        return up(s.shunpoTimer, 3.5);
      case 'minato':
        return up(s.warpTimer, 4.0);
      case 'megumin':
        return up(s.chantTimer, s.chantDuration || 4.2);
      case 'yami':
        return up(s.slashTimer, 4.5);
      case 'whitebeard':
        return up(s.quakeTimer, 4.5);
      case 'allmight':
        return up(s.airBlastTimer, 3.5);
      case 'hisoka':
        return up(s.gumPullCooldown, 2.8);
      case 'shikamaru':
        return up(s.shadowTimer, 4.2, (s.bindActiveTimer ?? 0) > 0);
      case 'shigaraki':
        return up(s.puddleTimer, 1.8);
      case 'edward':
        return up(s.hackTimer, 5.0);
      case 'kingofcurses':
        return up(s.domainExposureTimer, 2.0, (s.flurrySlashesRemaining ?? 0) > 0);
      case 'inertia': {
        const progress = clamp01((s.kineticCharge ?? 0) / 100);
        const pct = Math.round(progress * 100);
        return {
          progress,
          remainingSeconds: 0,
          isActive: progress >= 0.99,
          statusText: progress >= 0.99 ? 'MAX' : `${pct}%`,
        };
      }
      case 'capedbaldy': {
        const progress = clamp01(s.momentumCharge ?? 0);
        const pct = Math.round(progress * 100);
        return {
          progress,
          remainingSeconds: 0,
          isActive: progress >= 0.99,
          statusText: progress >= 0.99 ? 'READY' : `${pct}%`,
        };
      }

      // Count-down special timers
      case 'sniper':
        return down(s.shootTimer, 2.8);
      case 'bow': {
        const cd = Math.max(
          0.25,
          typeof s.getCurrentCooldown === 'function' ? s.getCurrentCooldown() : 2.0
        );
        return down(s.shootTimer, cd);
      }
      case 'swarm':
        return down(s.fireTimer, s.fireCooldown || 1.8);
      case 'engineer':
        return down(s.turretDropTimer, 5.0);
      case 'rubberpirate':
        return down(s.punchCooldown, 4.0, Boolean(s.punchState && s.punchState !== 'idle'));
      case 'soulreaper':
        return down(s.waveTimer, s.waveCooldown || 5.0);
      case 'esdeath':
        return down(s.spearTimer, 2.2);
      case 'aokiji':
        return down(s.beakTimer, 3.8);
      case 'sonic':
        return down(s.shurikenTimer, 2.3);
      case 'lucy':
        return down(s.starTimer, 2.1);
      case 'rimuru':
        return down(s.spitTimer, 2.8);
      case 'vash':
        return down(s.shotTimer, 2.2);
      case 'deaththekid':
        return down(s.twinTimer, 2.2);
      case 'sinon':
        return down(s.hecateTimer, 3.2);
      case 'hawkeye':
        return down(s.burstTimer, 2.8);
      case 'escanor':
        return down(s.sunTimer, 3.2);
      case 'broly':
        return down(s.orbTimer, 2.4);
      case 'gundam':
        return down(s.beamTimer, 2.1);
      case 'motoko':
        return down(s.shotTimer, 2.0);
      case 'spike':
        return down(s.shotTimer, 2.4);
      case 'katakuri':
        return down(s.dodgeCooldown, 3.8);
      case 'venom':
        return down(s.dropTimer, 0.5);
      case 'blackhole':
        return down(s.tidalCooldown, 0.75);
      case 'kurapika':
        return down(s.chainTick, 0.75);
      case 'quadblade':
        return down(s.bladeHitCooldown, 0.5);
      case 'aura':
        return down(s.auraDamageTickCooldown, 1.0);
      case 'scoutspinner':
        return down(s.latchCooldown, 1.6, (s.latchTimer ?? 0) > 0);
      case 'waterbreathing':
        return down(s.tickCooldown, 0.42);
      case 'threesword':
        return down(s.slashTickCooldown, 0.28);
      case 'fushiguro': {
        const list = Array.isArray(s.shikigami) ? s.shikigami : [];
        if (list.length > 0) {
          const minCd = Math.min(...list.map((sh: any) => Math.max(0, sh.bitCooldown ?? 0)));
          return down(minCd, 1.4);
        }
        return { progress: 1, remainingSeconds: 0, isActive: false, statusText: 'READY' };
      }
      case 'ninjashadow': {
        const aliveClones = Array.isArray(s.clones)
          ? s.clones.filter((c: any) => c && c.alive)
          : [];
        if (aliveClones.length > 0) {
          const minCd = Math.min(...aliveClones.map((c: any) => Math.max(0, c.kunaiTimer ?? 0)));
          return down(minCd, 2.4);
        }
        return parryFallback();
      }

      // Passive / Stance / Aura / Transform fighters
      case 'limitless': {
        const slowingEnemy = (this.currentOpponent?.infinitySlowTimer ?? 0) > 0;
        return {
          progress: 1,
          remainingSeconds: 0,
          isActive: slowingEnemy,
          statusText: slowingEnemy ? 'ACTIVE' : 'READY',
        };
      }
      case 'mathgrid': {
        if (typeof s.isInsideCenterGrid === 'function' && s.isInsideCenterGrid()) {
          return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'ACTIVE' };
        }
        return parryFallback();
      }
      case 'eva01': {
        if (typeof s.isBerserk === 'function' && s.isBerserk()) {
          return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'BERSERK' };
        }
        if ((s.atFieldFlash ?? 0) > 0) {
          return { progress: 1, remainingSeconds: 0, isActive: true, statusText: 'A.T. FLD' };
        }
        return parryFallback();
      }
      case 'kenpachi':
      case 'oneforsmash':
      case 'korosensei':
      case 'vampire':
      case 'mirror':
      case 'jackpot':
      case 'standard':
      default:
        return parryFallback();
    }
  }

  getSpecialRechargeProgress(): number {
    return this.getSpecialCooldownInfo().progress;
  }

  triggerParry(
    nowMs: number,
    callbacks?: {
      playSound?: (type: any) => void;
      spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ): 'activated' | 'cooldown' | 'macro_blocked' {
    if (this.isDead) return 'cooldown';

    // Server/Engine-Grade Anti-Auto-Parry Validation:
    // Detects inhuman spam (< 145ms intervals) or fixed-cadence macro scripts (< 14ms variance across 3+ presses)
    this.parryInputTimestamps.push(nowMs);
    if (this.parryInputTimestamps.length > 5) {
      this.parryInputTimestamps.shift();
    }

    const len = this.parryInputTimestamps.length;
    if (len >= 2) {
      const latestDelta = this.parryInputTimestamps[len - 1] - this.parryInputTimestamps[len - 2];
      let isRoboticMacro = latestDelta < 145;
      if (!isRoboticMacro && len >= 4) {
        const d1 = this.parryInputTimestamps[len - 1] - this.parryInputTimestamps[len - 2];
        const d2 = this.parryInputTimestamps[len - 2] - this.parryInputTimestamps[len - 3];
        const d3 = this.parryInputTimestamps[len - 3] - this.parryInputTimestamps[len - 4];
        if (d1 < 550 && Math.abs(d1 - d2) < 14 && Math.abs(d2 - d3) < 14) {
          isRoboticMacro = true;
        }
      }

      if (isRoboticMacro) {
        this.parryActiveTimer = 0;
        this.parryPenaltyLockoutTimer = 2.8;
        this.parryCooldownTimer = 2.8;
        this.floatingTexts.push({
          text: '⚠️ AUTO-PARRY MACRO BLOCKED! (2.8s LOCK)',
          x: this.x,
          y: this.y - this.radius - 36,
          alpha: 1.0,
          color: '#f43f5e',
          vy: -1.3,
        });
        callbacks?.spawnSparks?.(this.x, this.y, '#f43f5e', 14);
        return 'macro_blocked';
      }
    }

    if (this.parryPenaltyLockoutTimer > 0 || this.parryCooldownTimer > 0 || this.parryActiveTimer > 0) {
      return 'cooldown';
    }

    this.parryActiveTimer = 0.28;
    this.parryCooldownTimer = 1.35;
    this.floatingTexts.push({
      text: '🛡️ PARRY STANCE!',
      x: this.x,
      y: this.y - this.radius - 30,
      alpha: 1.0,
      color: '#38bdf8',
      vy: -1.4,
    });
    callbacks?.playSound?.('aura');
    callbacks?.spawnShockwave?.(this.x, this.y, '#38bdf8', this.radius + 36);
    return 'activated';
  }

  triggerDash(callbacks?: {
    playSound?: (type: any) => void;
    spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
    spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
  }): 'activated' | 'cooldown' | 'disabled' {
    if (this.isDead || this.timeStopFrozenTimer > 0 || this.hackedDisableTimer > 0) {
      return 'disabled';
    }
    if (this.dodgeDashCooldownTimer > 0 || this.dodgeInvulnTimer > 0) {
      return 'cooldown';
    }

    let dashAngle = Math.atan2(this.vy, this.vx);
    if (this.currentOpponent && !this.currentOpponent.isDead) {
      const toOppAngle = Math.atan2(this.currentOpponent.y - this.y, this.currentOpponent.x - this.x);
      // Choose whichever perpendicular evasion direction keeps the ball closer to arena center (640, 360)
      const perpA = toOppAngle + Math.PI * 0.58;
      const perpB = toOppAngle - Math.PI * 0.58;
      const distCenterA = Math.hypot(this.x + Math.cos(perpA) * 90 - 640, this.y + Math.sin(perpA) * 90 - 360);
      const distCenterB = Math.hypot(this.x + Math.cos(perpB) * 90 - 640, this.y + Math.sin(perpB) * 90 - 360);
      dashAngle = distCenterA <= distCenterB ? perpA : perpB;
    } else if (Math.hypot(this.vx, this.vy) < 0.5) {
      dashAngle = Math.random() * Math.PI * 2;
    }

    const dashBurstSpeed = 15.5;
    this.vx = Math.cos(dashAngle) * dashBurstSpeed;
    this.vy = Math.sin(dashAngle) * dashBurstSpeed;
    this.dodgeInvulnTimer = 0.26;
    this.dodgeDashCooldownTimer = this.dodgeDashCooldownDuration;

    this.floatingTexts.push({
      text: '💨 DODGE DASH!',
      x: this.x,
      y: this.y - this.radius - 30,
      alpha: 1.0,
      color: '#22d3ee',
      vy: -1.45,
    });
    callbacks?.playSound?.('dash');
    callbacks?.spawnShockwave?.(this.x, this.y, '#22d3ee', this.radius + 42);
    callbacks?.spawnSparks?.(this.x, this.y, '#a5f3fc', 14);
    return 'activated';
  }

  setStartingHealth(hp: number) {
    this.maxHealth = hp;
    this.health = hp;
  }

  takeDamage(
    amount: number,
    attackerColor = '#ef4444',
    _label?: string,
    bypassEarlyCap = false,
    attacker?: Ball | null
  ): number {
    // Track Last Attacker whenever this ball takes damage (from collision or weapon/projectile)
    if (attacker) {
      this.lastAttacker = attacker;
    } else if (this.currentOpponent) {
      this.lastAttacker = this.currentOpponent;
    }

    const isInstantKill = amount >= 9000;

    // Evasive Dodge Dash i-frames: negate incoming hit cleanly during active dash burst
    if (this.dodgeInvulnTimer > 0 && !isInstantKill) {
      this.floatingTexts.push({
        text: '💨 DODGED!',
        x: this.x,
        y: this.y - this.radius - 32,
        alpha: 1.0,
        color: '#22d3ee',
        vy: -1.4,
      });
      return 0;
    }

    // Skill-Based Parry Deflection: If Parry Shield is active, negate incoming damage and reflect counter-force!
    if (this.parryActiveTimer > 0 && !isInstantKill) {
      this.parryActiveTimer = 0;
      this.parryCooldownTimer = 0.35; // Instant cooldown reset reward for landing a Perfect Parry!
      this.floatingTexts.push({
        text: '⚡ PERFECT PARRY! REFLECTED!',
        x: this.x,
        y: this.y - this.radius - 38,
        alpha: 1.0,
        color: '#facc15',
        vy: -1.6,
      });
      const targetAttacker = attacker || this.currentOpponent;
      if (targetAttacker && !targetAttacker.isDead) {
        const reflectDmg = Math.max(2, Math.round(amount * 0.55));
        targetAttacker.health = Math.max(1, targetAttacker.health - reflectDmg);
        targetAttacker.damageFlash = 0.25;
        targetAttacker.damageTexts.push(new DamageText(targetAttacker.x, targetAttacker.y, reflectDmg, '#facc15'));
        const dx = targetAttacker.x - this.x;
        const dy = targetAttacker.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        targetAttacker.vx = (dx / dist) * 18.5;
        targetAttacker.vy = (dy / dist) * 18.5;
      }
      return 0;
    }

    // Strict Auto-Balance Rule: No ball can one-shot another early in the game,
    // except explicit Instant-KO mechanics (ShinigamiNoteBall 20s Heart Attack or CapedBaldyBall 9999 Serious Punch).
    const earlyGameCap = isInstantKill
      ? 99999
      : bypassEarlyCap
      ? Math.max(amount, 30, Math.floor(this.maxHealth * 0.65))
      : this.roundElapsed < 8
      ? Math.max(10, Math.floor(this.maxHealth * 0.16))
      : this.roundElapsed < 16
      ? Math.max(16, Math.floor(this.maxHealth * 0.25))
      : this.maxHealth;

    const attackerBonus = attacker ? attacker.hitScalingBonus : (this.currentOpponent ? this.currentOpponent.hitScalingBonus : 0);
    const totalRawAmount = amount + attackerBonus;
    const scaledAmount = isInstantKill ? 9999 : Math.min(earlyGameCap, totalRawAmount * this.phaseDamageMultiplier);
    const roundedDamage = Math.max(1, Math.round(scaledAmount || 0));
    this.health = Math.max(0, this.health - roundedDamage);
    this.damageFlash = 0.25;
    // Universal crisp high-pitched 'tic'/'smack' hit confirmation + target subclass hit voice
    audioController.playHitConfirm(roundedDamage);
    this.playHitVoice();

    // Instantiate a DamageText object at this exact x/y location with the attacker's color
    this.damageTexts.push(new DamageText(this.x, this.y, roundedDamage, attackerColor));

    // Action-Game Hitstop (Micro-pauses): Trigger 0.05s (~3-4 frames) freeze when taking > 15 damage or on KO
    if (roundedDamage > 15 || this.health <= 0) {
      hitstopTimer = 0.05;
    }

    // Action-Game Impact Frames (Inverted Colors): Trigger 2-frame high-contrast silhouette flash on massive hits or Instant KO
    if (isInstantKill || roundedDamage >= 22 || this.health <= 0) {
      impactFrameTimer = 2;
    }

    // When a ball's HP reaches 0, set this.isDead = true, halt its movement, and call this.playDeathAnimation()
    if (this.health <= 0 && !this.isDead) {
      this.isDead = true;
      this.vx = 0;
      this.vy = 0;
      this.playDeathAnimation();
    }
    return roundedDamage;
  }

  // Damage Progression System: tracks totalDamageDealt, hit-based scaling, and triggers level ups at 35 and 70
  recordDamageDealt(
    amount: number,
    callbacks?: {
      playSound?: (type: any) => void;
      spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (amount <= 0) return;
    this.hitCount += 1;

    // Universal Hit-Based Damage Scaling:
    // - If base damage < 7 and reload takes time (single-shot / slow cadence), increases every 3 hits (+1.5 dmg)
    // - If damage is constant (rapid multi-hit / aura / DoT / high base), increases every 12 hits (+1.5 dmg)
    const constantDamageTypes: BallTypeId[] = [
      'aura', 'venom', 'blackhole', 'frost', 'blink', 'swarm', 'waterbreathing',
      'scoutspinner', 'kingofcurses', 'killua', 'shigaraki', 'kurapika',
      'hawkeye', 'deaththekid', 'broly', 'fushiguro', 'lucy', 'ninjashadow'
    ];
    const isConstantDamage = constantDamageTypes.includes(this.type) || amount <= 2.5;
    const hitsRequired = (!isConstantDamage && amount < 7) ? 3 : 12;

    if (this.hitCount % hitsRequired === 0) {
      this.hitScalingBonus += 1.5;
      this.floatingTexts.push({
        text: `⚡ +1.5 DMG UP! (${this.hitCount} HITS)`,
        x: this.x,
        y: this.y - this.radius - 28,
        alpha: 1.0,
        color: '#facc15',
        vy: -1.4,
      });
      callbacks?.spawnSparks?.(this.x, this.y, '#facc15', 10);
    }

    this.totalDamageDealt += (amount + this.hitScalingBonus) * this.phaseDamageMultiplier;
    this.checkLevelUp(callbacks);
  }

  checkLevelUp(
    callbacks?: {
      playSound?: (type: any) => void;
      spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.totalDamageDealt >= 70 && this.level < 3) {
      this.level = 3;
      this.onLevelUp(3, callbacks);
      this.floatingTexts.push({
        text: '★ LEVEL 3 MAX! ★',
        x: this.x,
        y: this.y - this.radius - 34,
        alpha: 1.0,
        color: '#facc15',
        vy: -1.5,
      });
      callbacks?.playSound?.('crit');
      callbacks?.spawnShockwave?.(this.x, this.y, '#facc15', 105);
      callbacks?.spawnSparks?.(this.x, this.y, '#fbbf24', 24);
    } else if (this.totalDamageDealt >= 35 && this.level < 2) {
      this.level = 2;
      this.onLevelUp(2, callbacks);
      this.floatingTexts.push({
        text: '★ LEVEL 2 UPGRADE! ★',
        x: this.x,
        y: this.y - this.radius - 34,
        alpha: 1.0,
        color: '#38bdf8',
        vy: -1.5,
      });
      callbacks?.playSound?.('crit');
      callbacks?.spawnShockwave?.(this.x, this.y, '#38bdf8', 85);
      callbacks?.spawnSparks?.(this.x, this.y, '#38bdf8', 18);
    }
  }

  onLevelUp(_newLevel: number, _callbacks?: any) {
    // Custom subclass hook for dynamic scaling upgrades
  }

  heal(amount: number) {
    const rounded = Math.round(amount);
    const actual = Math.min(this.maxHealth - this.health, rounded);
    if (actual > 0) {
      this.health += actual;
      this.floatingTexts.push({
        text: `+${actual} HP`,
        x: this.x,
        y: this.y - this.radius - 28,
        alpha: 1.0,
        color: '#10b981',
        vy: -1.3,
      });
    }
  }

  resetPosition(x: number, y: number, startingHealth?: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.targetVx = 0;
    this.targetVy = 0;
    this.radius = this.initialRadius;
    this.color = this.initialColor;
    this.glowColor = this.initialGlowColor;
    if (startingHealth !== undefined) {
      this.maxHealth = startingHealth;
      this.health = startingHealth;
    } else {
      this.health = this.maxHealth;
    }
    this.damageFlash = 0;
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.infinitySlowTimer = 0;
    this.waterSlowTimer = 0;
    this.timeStopFrozenTimer = 0;
    this.hackedDisableTimer = 0;
    this.decayTimer = 0;
    this.decayTickTimer = 0;
    this.screenShakeTimer = 0;
    this.opticCamoTimer = 0;
    this.totalDamageDealt = 0;
    this.hitCount = 0;
    this.hitScalingBonus = 0;
    this.parryActiveTimer = 0;
    this.parryCooldownTimer = 0;
    this.parryPenaltyLockoutTimer = 0;
    this.parryInputTimestamps = [];
    this.dodgeDashCooldownTimer = 0;
    this.dodgeInvulnTimer = 0;
    this.level = 1;
    this.trail = [];
    this.floatingTexts = [];
    this.damageTexts = [];
    this.phaseDamageMultiplier = 1.0;
    this.roundElapsed = 0;
    this.lastAttacker = null;
    this.isDead = false;
    this.hasPlayedDeath = false;
    this.deathElapsed = 0;
    this.isCelebratingVictory = false;
    this.victoryHopTimer = 0;
    this.victoryHopOffsetY = 0;
    this.victoryBaseY = null;
    this.launchAngle = 0;
    this.activeEmote = null;
    this.fatalityState = null;
  }

  // The Unique Death Method: Called when a ball's HP reaches 0 to halt movement and spawn particles
  playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    this.hasPlayedDeath = true;
    this.isDead = true;
    this.vx = 0;
    this.vy = 0;

    // Base death animation: 45 omnidirectional explosion particles
    const colors = [this.color, this.glowColor, '#ffffff', '#fbbf24', '#f87171'];
    for (let i = 0; i < 45; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(new ExplosionParticle(this.x, this.y, color, 1.2));
    }
  }

  drawDeadFatality(ctx: CanvasRenderingContext2D, dt: number = 0.016) {
    if (!this.fatalityState) return;
    this.fatalityState.timer += dt;
    const { style, timer, maxTimer } = this.fatalityState;
    const progress = Math.min(1, timer / maxTimer);
    const fade = Math.max(0, 1 - progress);

    if (style === 'slash') {
      ctx.save();
      const cutAngle = Math.PI / 4; // 45-degree bisecting diagonal cut
      const perpAngle = cutAngle + Math.PI / 2;
      const driftDist = timer * 48; // distance halves slide apart
      const rotAngle = timer * 0.45; // angle halves rotate away

      const half1X = this.x + Math.cos(perpAngle) * driftDist;
      const half1Y = this.y + Math.sin(perpAngle) * driftDist;
      const half2X = this.x - Math.cos(perpAngle) * driftDist;
      const half2Y = this.y - Math.sin(perpAngle) * driftDist;

      // Draw Top Half
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(half1X, half1Y);
      ctx.rotate(cutAngle - rotAngle);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing crimson & white edge along cut face
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius, 0);
      ctx.lineTo(this.radius, 0);
      ctx.stroke();
      ctx.restore();

      // Draw Bottom Half
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(half2X, half2Y);
      ctx.rotate(cutAngle + rotAngle);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing crimson & white edge along cut face
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius, 0);
      ctx.lineTo(this.radius, 0);
      ctx.stroke();
      ctx.restore();

      // Blinding White Light Beam shining through the gap between the two halves before they dissolve into dust
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.sin(progress * Math.PI) * 0.95);
      ctx.translate(this.x, this.y);
      ctx.rotate(cutAngle);
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 19;

      const lightWidth = Math.min(28, 4 + timer * 20);
      const lightGrad = ctx.createLinearGradient(0, -lightWidth, 0, lightWidth);
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      lightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
      lightGrad.addColorStop(0.5, '#ffffff');
      lightGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.95)');
      lightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = lightGrad;
      ctx.fillRect(-1280, -lightWidth, 2560, lightWidth * 2);
      ctx.restore();

      // Continuously spawn crimson & white spark particles along the gap
      if (timer < 1.8 && Math.random() < 0.65) {
        const pOffset = (Math.random() - 0.5) * this.radius * 2;
        const sparkX = this.x + Math.cos(cutAngle) * pOffset;
        const sparkY = this.y + Math.sin(cutAngle) * pOffset;
        particles.push(new SlashSparkParticle(sparkX, sparkY, Math.random() < 0.5 ? '#ffffff' : '#ef4444', perpAngle + (Math.random() - 0.5) * 0.5));
      }
      ctx.restore();
    } else if (style === 'singularity') {
      // Void Singularity Animation: Pitch-black circle with glowing accretion aura that rapidly expands then violently snaps to 0 radius
      ctx.save();
      let singRadius = 0;
      if (timer < 0.85) {
        // Rapid expansion to 2.8x ball radius
        singRadius = this.radius * 2.8 * (timer / 0.85);
      } else if (timer < 1.3) {
        // Violent snap down to 0 radius!
        singRadius = this.radius * 2.8 * Math.max(0, 1 - (timer - 0.85) / 0.45);
      } else {
        singRadius = 0;
      }

      if (singRadius > 0) {
        ctx.translate(this.x, this.y);

        // Multi-layered glowing neon purple/magenta/cyan accretion halo
        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, singRadius + 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, singRadius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Pitch-black void core
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, singRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // True Singularity Gravitational Pull: Violently sucking all surrounding particles into center point!
      if (timer < 1.6) {
        const totalPoolCount = globalParticlePool.count * TypedParticlePool.STRIDE;
        for (let idx = 0; idx < totalPoolCount; idx += TypedParticlePool.STRIDE) {
          const px = globalParticlePool.data[idx];
          const py = globalParticlePool.data[idx + 1];
          const dx = this.x - px;
          const dy = this.y - py;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 380) {
            const pullForce = (1 - dist / 380) * 2.5;
            globalParticlePool.data[idx + 2] += (dx / dist) * pullForce;
            globalParticlePool.data[idx + 3] += (dy / dist) * pullForce;
          }
        }
      }
      ctx.restore();
    } else if (this.fatalityState.render) {
      this.fatalityState.render(ctx, dt);
    }
  }

  update(dt: number, friction: number) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.roundElapsed += dt;
    if (this.parryActiveTimer > 0) {
      this.parryActiveTimer = Math.max(0, this.parryActiveTimer - dt);
    }
    if (this.parryCooldownTimer > 0) {
      this.parryCooldownTimer = Math.max(0, this.parryCooldownTimer - dt);
    }
    if (this.parryPenaltyLockoutTimer > 0) {
      this.parryPenaltyLockoutTimer = Math.max(0, this.parryPenaltyLockoutTimer - dt);
    }
    if (this.dodgeDashCooldownTimer > 0) {
      this.dodgeDashCooldownTimer = Math.max(0, this.dodgeDashCooldownTimer - dt);
    }
    if (this.dodgeInvulnTimer > 0) {
      this.dodgeInvulnTimer = Math.max(0, this.dodgeInvulnTimer - dt);
    }
    if (this.hackedDisableTimer > 0) {
      this.hackedDisableTimer = Math.max(0, this.hackedDisableTimer - dt);
    }
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer = Math.max(0, this.screenShakeTimer - dt);
    }
    if (this.opticCamoTimer > 0) {
      this.opticCamoTimer = Math.max(0, this.opticCamoTimer - dt);
    }
    if (this.decayTimer > 0) {
      this.decayTimer = Math.max(0, this.decayTimer - dt);
      this.decayTickTimer -= dt;
      if (this.decayTickTimer <= 0 && this.health > 0) {
        this.decayTickTimer = 0.45;
        this.takeDamage(2.0, '#7e22ce', '🖐️ DECAY');
      }
    }

    // If frozen by StarPlatinumBall's 'Time Stop', completely freeze position in place for 2.5s!
    if (this.timeStopFrozenTimer > 0) {
      this.timeStopFrozenTimer = Math.max(0, this.timeStopFrozenTimer - dt);
      if (this.damageFlash > 0) {
        this.damageFlash -= dt;
      }
      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.025;
      }
      this.floatingTexts = this.floatingTexts.filter((ft) => ft.alpha > 0);
      this.damageTexts = this.damageTexts.filter((dtItem) => dtItem.update(dt));
      return;
    }

    if (this.infinitySlowTimer > 0) {
      this.infinitySlowTimer = Math.max(0, this.infinitySlowTimer - dt);
    }
    if (this.waterSlowTimer > 0) {
      this.waterSlowTimer = Math.max(0, this.waterSlowTimer - dt);
    }
    const step = Math.max(0.05, dt * 60);
    // If frozen by FrostNovaBall, apply heavy cryo drag / friction
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      this.isFrozen = this.frozenTimer > 0;
      const cryoDrag = Math.pow(0.90, step);
      this.vx *= cryoDrag;
      this.vy *= cryoDrag;
    } else {
      this.isFrozen = false;
      const frictionDrag = Math.pow(friction, step);
      this.vx *= frictionDrag;
      this.vy *= frictionDrag;
    }

    this.x += this.vx * step;
    this.y += this.vy * step;

    if (this.damageFlash > 0) {
      this.damageFlash -= dt;
    }

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 1.5 && this.opticCamoTimer <= 0) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.55 });
    }
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= 0.04 * step;
    }
    this.trail = this.trail.filter((t) => t.alpha > 0);

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * step;
      ft.alpha -= 0.025 * step;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.alpha > 0);

    // Update all active DamageText instances (slowly float upwards and fade out over 1.5s)
    this.damageTexts = this.damageTexts.filter((dtItem) => dtItem.update(dt));
    if ((this as any).projectiles) {
      (this as any).projectiles = (this as any).projectiles.filter((p: any) => (p.life === undefined || p.life > 0) && (p.active === undefined || p.active));
    }
  }

  updateActiveEmote(dt: number) {
    if (this.activeEmote) {
      this.activeEmote.timer -= dt;
      if (this.activeEmote.timer <= 0) {
        this.activeEmote = null;
      }
    }
  }

  // Hook for subclass custom mechanics
  updateSpecial(
    _dt: number,
    _opponent: Ball,
    _callbacks: {
      playSound: (type: 'hit' | 'wall' | 'ko' | 'slice' | 'aura' | 'dash' | 'poison' | 'arrow' | 'crit' | 'siphon' | 'jackpot' | 'freeze' | 'shatter' | 'teleport' | 'explosion' | 'laser') => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {}

  // Returns target coordinates for enemy projectiles (overridden by NinjaShadowBall or Motoko Optic Camo)
  getTargetPosition(_fromX?: number, _fromY?: number): { x: number; y: number } {
    if (this.opticCamoTimer > 0) {
      return {
        x: 640 + Math.cos(this.roundElapsed * 5.0) * 210,
        y: 360 + Math.sin(this.roundElapsed * 5.0) * 210,
      };
    }
    return { x: this.x, y: this.y };
  }

  // Checks if an attack or projectile hits a fragile clone (overridden by NinjaShadowBall where clones die in 1 hit)
  hitShadowCloneAt(
    _px: number,
    _py: number,
    _hitRadius: number,
    _callbacks?: {
      playSound?: (type: any) => void;
      spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ): boolean {
    return false;
  }

  drawBackground(_ctx: CanvasRenderingContext2D) {}

  // Visual Identity & Current HP Display in the exact center of the ball:
  // Renders the Canvas text emoji (👒, 🍥, 💥, 💀, ⚔️, etc.) and the bold white HP number with thick black stroke
  drawCenterIcon(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Canvas text (emoji) in the center of the ball for visual identity (scaled +30% by 1.3x)
    const emojiSize = Math.round(this.radius * 0.56 * 1.3);
    ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.fillText(this.iconText, this.x, this.y - this.radius * 0.26);

    // 2. Ball's current health as a large, bold white number with a thick black stroke in the center (scaled +30% by 1.3x)
    const hpText = `${Math.max(0, Math.ceil(this.health))}`;
    const hpFontSize = Math.round(this.radius * 0.56 * 1.3);
    ctx.font = `900 ${hpFontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    ctx.lineWidth = Math.round(6 * 1.3);
    ctx.strokeStyle = '#000000';
    ctx.strokeText(hpText, this.x, this.y + this.radius * 0.30);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(hpText, this.x, this.y + this.radius * 0.30);
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, dt: number = 0.016) {
    if (this.isDead) {
      // Render Fix: In the main loop, if ball.isDead === true, do not draw the ball, its weapon, or its HP text.
      // Only the global particles should remain on screen during the 2.5-second cinematic delay before the round transitions.
      return;
    }
    // High-visibility laser sight line connecting directly to the opponent's edge for all Ranged characters
    this.drawLaserSight(ctx);

    // 1. Motion Trail (Optimized: single save/restore block with batched canvas fills)
    if (this.trail.length > 0) {
      ctx.save();
      for (const t of this.trail) {
        ctx.globalAlpha = Math.max(0, t.alpha * 0.35);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Outer Sphere (shadowBlur stripped to save GPU memory)
    ctx.save();

    // 3. Radial Gradient Sphere
    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.32,
      this.y - this.radius * 0.32,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );

    if (this.damageFlash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f87171');
      grad.addColorStop(1, '#991b1b');
    } else if (this.isFrozen) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#bae6fd');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, this.color);
      grad.addColorStop(1, this.glowColor);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = this.damageFlash > 0 ? '#ffffff' : (this.isFrozen ? '#e0f2fe' : 'rgba(255, 255, 255, 0.55)');
    ctx.stroke();

    // If frozen, draw crystalline ice shards and jagged rim
    if (this.isFrozen) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const ix1 = this.x + Math.cos(a) * (this.radius - 2);
        const iy1 = this.y + Math.sin(a) * (this.radius - 2);
        const ix2 = this.x + Math.cos(a) * (this.radius + 6);
        const iy2 = this.y + Math.sin(a) * (this.radius + 6);
        ctx.beginPath();
        ctx.moveTo(ix1, iy1);
        ctx.lineTo(ix2, iy2);
        ctx.stroke();
      }
    }

    // Active Parry Deflector Shield Ring (Skill-Based Parry Window)
    if (this.parryActiveTimer > 0) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 17, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.parryPenaltyLockoutTimer > 0) {
      // Anti-Auto-Parry Lockout Indicator
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Active Dodge Dash Invulnerability Ring
    if (this.dodgeInvulnTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Edward's 'Hacked' Status Effect: digital 0s and 1s float over the enemy while weapons & special abilities are disabled
    if (this.hackedDisableTimer > 0) {
      const t = performance.now() / 150;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '900 15px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const bits = ['1', '0', '1', '0', '1', '0'];
      for (let i = 0; i < bits.length; i++) {
        const bAngle = (i / bits.length) * Math.PI * 2 + t * 0.45;
        const bx = this.x + Math.cos(bAngle) * (this.radius + 19);
        const by = this.y + Math.sin(bAngle) * (this.radius + 19) - Math.sin(t + i) * 5;
        ctx.strokeStyle = '#022c22';
        ctx.lineWidth = 3.5;
        ctx.strokeText(bits[i], bx, by);
        ctx.fillStyle = i % 2 === 0 ? '#34d399' : '#a7f3d0';
        ctx.fillText(bits[i], bx, by);
      }
    }

    // Celebratory Victory Aura Ring & Golden Crown when winner is hopping after fatality finishes
    if (this.isCelebratingVictory) {
      const pulseR = this.radius + 10 + Math.sin(this.victoryHopTimer * 12) * 4;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(this.victoryHopTimer * 45);
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulseR + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating Golden Crown & WINNER banner above the hopping ball
      ctx.font = '900 22px "Apple Color Emoji", "Segoe UI Emoji", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', this.x, this.y - this.radius - 20);

      ctx.font = '900 12px system-ui, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#090d16';
      ctx.strokeText('★ WINNER! ★', this.x, this.y - this.radius - 38);
      ctx.fillStyle = '#facc15';
      ctx.fillText('★ WINNER! ★', this.x, this.y - this.radius - 38);
    }

    ctx.restore();

    // 4. Draw current HP in the exact center of the ball (large bold white number with thick black stroke)
    this.drawCenterIcon(ctx);

    // 4b. Canvas Nameplate: Render playerName as a crisp, small white font with a black stroke sitting 25px above the top of the ball's radius
    const displayPlayerName = (this.playerName || this.name || '').trim();
    if (displayPlayerName) {
      const nameplateY = this.y - this.radius - 25;
      ctx.save();
      ctx.font = '800 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(displayPlayerName, this.x, nameplateY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayPlayerName, this.x, nameplateY);
      ctx.restore();
    }

    // 5. Floating damage text
    this.drawFloatingDamageText(ctx);

    // 6. Pop-Up Emoji Speech Bubble Tracking the Ball
    if (this.activeEmote && this.activeEmote.timer > 0) {
      const frameDt = this.renderDt > 0 ? this.renderDt : dt;
      this.activeEmote.timer -= frameDt;
      this.renderDt = 0;

      const scale = Math.max(0, Math.min(1, (2.5 - Math.max(0, this.activeEmote.timer)) * 5));
      if (scale > 0) {
        const bubbleW = 64;
        const bubbleH = 52;
        const tailHalfW = 8;
        const tailH = 12;
        const bubbleX = this.x;
        const bubbleY = this.y - this.radius - bubbleH / 2 - tailH - 6;

        ctx.save();
        // Anchor scale animation at the tip of the tail (top of the ball) so it pops out of the ball
        ctx.translate(bubbleX, bubbleY + bubbleH / 2 + tailH);
        ctx.scale(scale, scale);
        ctx.translate(0, -(bubbleH / 2 + tailH));

        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';

        // Crisp white rounded cartoon speech bubble
        ctx.beginPath();
        ctx.roundRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 16);
        ctx.fill();
        ctx.stroke();

        // Stylized cartoon tail pointing down toward the top of the ball
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-tailHalfW, bubbleH / 2 - 2);
        ctx.bezierCurveTo(-tailHalfW * 0.4, bubbleH / 2 + tailH * 0.6, -2, bubbleH / 2 + tailH, 0, bubbleH / 2 + tailH);
        ctx.bezierCurveTo(2, bubbleH / 2 + tailH, tailHalfW * 0.4, bubbleH / 2 + tailH * 0.6, tailHalfW, bubbleH / 2 - 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-tailHalfW, bubbleH / 2 - 1);
        ctx.bezierCurveTo(-tailHalfW * 0.4, bubbleH / 2 + tailH * 0.6, -2, bubbleH / 2 + tailH, 0, bubbleH / 2 + tailH);
        ctx.bezierCurveTo(2, bubbleH / 2 + tailH, tailHalfW * 0.4, bubbleH / 2 + tailH * 0.6, tailHalfW, bubbleH / 2 - 1);
        ctx.stroke();

        // Render activeEmote.emoji in the exact center of the white speech bubble
        ctx.font = '32px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(this.activeEmote.emoji, 0, 2);

        ctx.restore();
      }

      if (this.activeEmote.timer <= 0) {
        this.activeEmote = null;
      }
    }
  }

  startVictoryCelebration() {
    if (this.isDead) return;
    if (!this.isCelebratingVictory) {
      this.isCelebratingVictory = true;
      this.victoryHopTimer = 0;
      this.victoryHopOffsetY = 0;
      this.victoryBaseY = Math.max(125, Math.min(625, this.y));
      this.y = this.victoryBaseY;
    }
  }

  // Celebratory victory hop animation driven by Math.sin() on the y-axis while the victory screen is active
  updateVictoryAnimation(dt: number): boolean {
    if (!this.isCelebratingVictory || this.isDead) {
      if (this.victoryBaseY !== null) {
        this.y = this.victoryBaseY;
        this.victoryBaseY = null;
      }
      this.victoryHopOffsetY = 0;
      return false;
    }
    if (this.victoryBaseY === null) {
      this.victoryBaseY = Math.max(125, Math.min(625, this.y));
    }
    const prevCycle = Math.floor(this.victoryHopTimer * 2.8);
    this.victoryHopTimer += dt;
    const curCycle = Math.floor(this.victoryHopTimer * 2.8);
    const hopPhase = (this.victoryHopTimer * 2.8) % 1;
    this.victoryHopOffsetY = Math.abs(Math.sin(hopPhase * Math.PI)) * 46;
    this.y = this.victoryBaseY - this.victoryHopOffsetY;
    return curCycle > prevCycle;
  }

  drawVictoryAnimation(ctx: CanvasRenderingContext2D, dt: number = 0.016) {
    if (!this.isCelebratingVictory || this.isDead) {
      this.draw(ctx, dt);
      return;
    }

    const hopPhase = (this.victoryHopTimer * 2.8) % 1;
    const hopHeight = this.victoryHopOffsetY;
    const groundY = this.victoryBaseY ?? (this.y + hopHeight);

    // Dynamic ground shadow ellipse anchored underneath the hopping winner ball
    ctx.save();
    const shadowScale = Math.max(0.42, 1 - hopHeight / 68);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(
      this.x,
      groundY + this.radius + 4,
      this.radius * 0.85 * shadowScale,
      this.radius * 0.28 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Celebratory hop along the y-axis with squash & stretch applied to the entire ball & subclass weapon
    const squash = Math.cos(hopPhase * Math.PI * 2);
    const scaleX = 1 + squash * 0.11;
    const scaleY = 1 - squash * 0.11;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-this.x, -this.y);
    this.draw(ctx, dt);
    ctx.restore();
  }

  // External health bars removed: HP is now displayed directly in the exact center of the ball
  drawFloatingHealthBar(_ctx: CanvasRenderingContext2D) {}

  drawFloatingDamageText(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = '800 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    this.floatingTexts.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3.5;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();

    // Render all DamageText objects (dynamically scaled by damage amount, colored by attacker ball)
    for (const dtItem of this.damageTexts) {
      dtItem.draw(ctx);
    }
  }
}

/* ==========================================================================
   SUBCLASSES: StandardBall, QuadBladeBall, AuraBall, VenomTrailBall, MathGridBall, SniperBowBall
   ========================================================================== */
export class Brawler extends Ball {
  constructor(x: number, y: number, radius: number, mass: number, color: string, glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, color, glowColor, name, startingHealth, 'standard', '🥊');
    this.archetype = 'Default';
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
    // Kinetic core shield ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    this.drawCenterIcon(ctx);
  }
}

export class KnifeMaster extends Ball {
  bladeAngle: number;
  bladeRotationSpeed: number;
  baseBladeLength: number;
  bladeLength: number;
  bladeCount: number;
  bladeWidth: number;
  bladeHitCooldown: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // QuadBladeBall has a metallic grey body and rotary blade icon 🗡️
    super(x, y, radius, mass, '#94a3b8', '#475569', name, startingHealth, 'quadblade', '🗡️');
    this.archetype = 'Slash';
    this.bladeAngle = 0;
    this.bladeRotationSpeed = 3.8;
    this.baseBladeLength = Math.round(36.4 * 1.3); // +30% global scale increase
    this.bladeLength = this.baseBladeLength;
    this.bladeCount = 4;
    this.bladeWidth = Math.round(13 * 1.3); // +30% global scale increase
    this.bladeHitCooldown = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.bladeAngle = 0;
    this.bladeHitCooldown = 0;
    this.bladeLength = this.baseBladeLength;
    this.bladeCount = 4;
  }

  override onLevelUp(newLevel: number) {
    if (newLevel >= 2) {
      // At 35 damage, the blades grow 30% longer
      this.bladeLength = this.baseBladeLength * 1.3;
    }
    if (newLevel >= 3) {
      // At 70 damage, spawns 4 additional blades (becoming an 8-blade ball)
      this.bladeCount = 8;
      this.bladeLength = this.baseBladeLength * 1.3;
    }
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.bladeAngle += this.bladeRotationSpeed * dt;
    if (this.bladeHitCooldown > 0) this.bladeHitCooldown -= dt;
  }

  override updateSpecial(_dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (this.bladeHitCooldown > 0 || opponent.health <= 0 || this.health <= 0) return;

    const angleStep = (Math.PI * 2) / this.bladeCount;
    for (let i = 0; i < this.bladeCount; i++) {
      const angle = this.bladeAngle + i * angleStep;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x1 = this.x + cosA * (this.radius * 0.7);
      const y1 = this.y + sinA * (this.radius * 0.7);
      const x2 = this.x + cosA * (this.radius + this.bladeLength);
      const y2 = this.y + sinA * (this.radius + this.bladeLength);

      const segDx = x2 - x1;
      const segDy = y2 - y1;
      const segLenSq = segDx * segDx + segDy * segDy;
      const toOppX = opponent.x - x1;
      const toOppY = opponent.y - y1;

      const t = Math.max(0, Math.min(1, (toOppX * segDx + toOppY * segDy) / segLenSq));
      const closestX = x1 + t * segDx;
      const closestY = y1 + t * segDy;
      const distSq = (opponent.x - closestX) ** 2 + (opponent.y - closestY) ** 2;

      if (distSq <= opponent.radius * opponent.radius) {
        const sliceDmg = 2;
        opponent.takeDamage(sliceDmg, this.color, 'SLICE');
        this.recordDamageDealt(sliceDmg, callbacks);
        this.bladeHitCooldown = 0.5;
        // QuadBladeBall: 'triangle' wave rapid metallic 'ching' sound whenever a blade connects
        this.playAbilityVoice();
        callbacks.spawnSparks(closestX, closestY, '#64748b', 8);
        callbacks.spawnSparks(closestX, closestY, '#94a3b8', 6);
        break;
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw Detailed Knives Protruding from the Ball
    // Using canvas paths: brown handle, silver crossguard, and sharp metallic blade
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.bladeAngle);

    const angleStep = (Math.PI * 2) / this.bladeCount;
    for (let i = 0; i < this.bladeCount; i++) {
      ctx.save();
      ctx.rotate(i * angleStep);

      const handleStartR = this.radius - 6.5;
      const handleLen = 14.3;
      const guardR = handleStartR + handleLen;
      const tipR = this.radius + this.bladeLength + 10.4;
      const halfBladeW = this.bladeWidth * 0.56;

      // A. Brown Handle (protruding from ball rim)
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#270e02';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-4.7, -guardR, 9.4, handleLen, 2.0);
      ctx.fill();
      ctx.stroke();

      // Leather grip wrap ridges on brown handle
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4.4, -handleStartR - 4.5);
      ctx.lineTo(4.4, -handleStartR - 4.5);
      ctx.moveTo(-4.4, -handleStartR - 9.1);
      ctx.lineTo(4.4, -handleStartR - 9.1);
      ctx.stroke();

      // Silver pommel cap at base of handle
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -handleStartR, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // B. Silver Crossguard (wide metallic guard separating handle and blade)
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-12.4, -guardR + 2.0);
      ctx.lineTo(-13.7, -guardR - 3.3);
      ctx.lineTo(13.7, -guardR - 3.3);
      ctx.lineTo(12.4, -guardR + 2.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // C. Sharp Metallic Blade (double-beveled steel dagger/knife blade with fuller)
      const bladeBaseY = -guardR - 3.3;
      const bladeTipY = -tipR;
      const bladeGrad = ctx.createLinearGradient(-halfBladeW, bladeBaseY, halfBladeW, bladeTipY);
      bladeGrad.addColorStop(0, '#ffffff');
      bladeGrad.addColorStop(0.35, '#e2e8f0');
      bladeGrad.addColorStop(0.7, '#94a3b8');
      bladeGrad.addColorStop(1, '#475569');

      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-halfBladeW, bladeBaseY);
      ctx.lineTo(-halfBladeW * 1.12, bladeBaseY - (tipR - guardR) * 0.58);
      ctx.lineTo(0, bladeTipY); // Razor-sharp tip
      ctx.lineTo(halfBladeW * 1.12, bladeBaseY - (tipR - guardR) * 0.58);
      ctx.lineTo(halfBladeW, bladeBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central metallic ridge / fuller line down the blade
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, bladeBaseY - 2);
      ctx.lineTo(0, bladeTipY + 2.5);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // 2. Base Ball
    super.draw(ctx);

    // 3. Metallic Grey Body Overlay (Polished Steel Sheen & Rivets)
    ctx.save();
    const metalGrad = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      this.radius * 0.08,
      this.x,
      this.y,
      this.radius
    );
    metalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    metalGrad.addColorStop(0.25, 'rgba(203, 213, 225, 0.7)');
    metalGrad.addColorStop(0.65, 'rgba(100, 116, 139, 0.75)');
    metalGrad.addColorStop(1, 'rgba(51, 65, 85, 0.85)');

    ctx.fillStyle = metalGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4 Steel Rivet Bolts along perimeter
    const rivetDist = this.radius * 0.76;
    for (let r = 0; r < 4; r++) {
      const ra = (r * Math.PI) / 2 + Math.PI / 4;
      const rx = this.x + Math.cos(ra) * rivetDist;
      const ry = this.y + Math.sin(ra) * rivetDist;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // 4. Re-draw current HP in the exact center on top of metallic overlay
    this.drawCenterIcon(ctx);
  }
}

export class KnifeBall extends KnifeMaster {}

export class MysticAura extends Ball {
  auraTimer: number;
  roundElapsed: number;
  auraDamageTickCooldown: number;
  baseAuraRadius: number;
  currentAuraRadius: number;
  isTouchingEnemy: boolean;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // AuraBall has a mystical violet body with a pulsing energy aura ring and crystal orb icon
    super(x, y, radius, mass, '#a855f7', '#7e22ce', name, startingHealth, 'aura', '🔮');
    this.auraTimer = 0;
    this.roundElapsed = 0;
    this.auraDamageTickCooldown = 0;
    this.baseAuraRadius = this.radius + Math.round(68 * 1.3);
    this.currentAuraRadius = this.baseAuraRadius;
    this.isTouchingEnemy = false;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.auraTimer = 0;
    this.roundElapsed = 0;
    this.auraDamageTickCooldown = 0;
    this.isTouchingEnemy = false;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.auraTimer += dt * 3.5;
    this.roundElapsed += dt;
    const levelRadiusBonus = (this.level - 1) * 13;
    this.currentAuraRadius = this.baseAuraRadius + levelRadiusBonus + Math.sin(this.auraTimer) * 9;
    if (this.auraDamageTickCooldown > 0) this.auraDamageTickCooldown -= dt;
  }

  // Explicitly deals damage every second the enemy is touching or inside the aura ring, scaling with round time
  override updateSpecial(_dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (opponent.health <= 0 || this.health <= 0) {
      this.isTouchingEnemy = false;
      return;
    }

    const dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
    // Touching or inside the aura ring
    const isTouchingOrInside = dist <= this.currentAuraRadius + opponent.radius;
    this.isTouchingEnemy = isTouchingOrInside;

    if (isTouchingOrInside && this.auraDamageTickCooldown <= 0) {
      // Scale aura damage up slightly based on how much time has passed in the round (+ level bonus)
      const timeScaledDamage = Math.round(2 + this.roundElapsed * 0.15 + (this.level - 1) * 0.5);
      opponent.takeDamage(timeScaledDamage, this.color, 'AURA');
      this.recordDamageDealt(timeScaledDamage, callbacks);
      this.auraDamageTickCooldown = 1.0; // Explicitly every 1 second
      callbacks.playSound('aura');
      callbacks.spawnSparks(opponent.x, opponent.y, '#a855f7', 8);
      callbacks.spawnSparks(opponent.x, opponent.y, '#f43f5e', 4);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    const auraRad = this.currentAuraRadius;
    const pulseFactor = (Math.sin(this.auraTimer) + 1) / 2;

    const auraGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, auraRad);
    if (this.isTouchingEnemy) {
      auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
      auraGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.22)');
      auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0.42)');
    } else {
      auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.04)');
      auraGrad.addColorStop(0.75, 'rgba(168, 85, 247, 0.14)');
      auraGrad.addColorStop(1, `rgba(147, 51, 234, ${0.24 + pulseFactor * 0.16})`);
    }

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, auraRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = this.isTouchingEnemy ? 3 : 2.2;
    ctx.strokeStyle = this.isTouchingEnemy ? '#e11d48' : '#9333ea';
    ctx.shadowColor = this.isTouchingEnemy ? '#e11d48' : '#a855f7';
    ctx.shadowBlur = this.isTouchingEnemy ? 9 : 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, auraRad, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary pulsating inner resonance ring
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 14 + pulseFactor * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    super.draw(ctx);
  }
}

export class Venom extends Ball {
  dropTimer: number;
  puddles: { x: number; y: number; radius: number; life: number; maxLife: number }[];
  tickCooldown: number;
  bubbleTimer: number;
  poisonTickDamage: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Neon green body with skull icon ☠️
    super(x, y, radius, mass, '#22c55e', '#15803d', name, startingHealth, 'venom', '☠️');
    this.dropTimer = 0.5;
    this.puddles = [];
    this.tickCooldown = 0;
    this.bubbleTimer = 0;
    this.poisonTickDamage = 2; // Starts at 2 tick damage
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playLiquidCollisionSplash(0.88, 'venom');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.dropTimer = 0.5;
    this.puddles = [];
    this.tickCooldown = 0;
    this.bubbleTimer = 0;
    this.poisonTickDamage = 2;
  }

  override onLevelUp(newLevel: number) {
    // Starts at 2 tick damage. Increases to 3 tick damage at 35 total damage, and 4 tick damage at 70.
    if (newLevel === 2) {
      this.poisonTickDamage = 3;
    } else if (newLevel >= 3) {
      this.poisonTickDamage = 4;
    }
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.bubbleTimer += dt;
    this.dropTimer -= dt;
    if (this.dropTimer <= 0) {
      this.dropTimer = 0.5;
      this.puddles.push({ x: this.x, y: this.y, radius: Math.round(30 * 1.3), life: 4.0, maxLife: 4.0 });
    }
    for (let i = 0; i < this.puddles.length; i++) {
      this.puddles[i].life -= dt;
    }
    this.puddles = this.puddles.filter((p) => p.life > 0);
    if (this.tickCooldown > 0) this.tickCooldown -= dt;
  }

  // Dynamic Scaling Poison: 2 tick damage -> 3 at 35 dmg -> 4 at 70 dmg
  override updateSpecial(_dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (opponent.health <= 0 || this.health <= 0) return;
    const currentTickDmg = this.totalDamageDealt >= 70 ? 4 : (this.totalDamageDealt >= 35 ? 3 : 2);
    this.poisonTickDamage = currentTickDmg;

    for (const puddle of this.puddles) {
      const dist = Math.hypot(puddle.x - opponent.x, puddle.y - opponent.y);
      if (dist <= puddle.radius + opponent.radius) {
        if (this.tickCooldown <= 0) {
          opponent.takeDamage(this.poisonTickDamage, this.color, `POISON Lv${this.level}`);
          this.recordDamageDealt(this.poisonTickDamage, callbacks);
          this.tickCooldown = 0.75;
          // VenomTrailBall: 'sine' wave with LFO bubbly organic 'blub' sound
          this.playAbilityVoice();
          callbacks.spawnSparks(opponent.x, opponent.y, '#22c55e', 8);
          callbacks.spawnSparks(puddle.x, puddle.y, '#86efac', 5);
        }
        break;
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const puddle of this.puddles) {
      const alpha = Math.max(0, puddle.life / puddle.maxLife);
      ctx.globalAlpha = alpha * 0.85;

      const pGrad = ctx.createRadialGradient(puddle.x, puddle.y, 4, puddle.x, puddle.y, puddle.radius);
      pGrad.addColorStop(0, '#86efac');
      pGrad.addColorStop(0.45, '#22c55e');
      pGrad.addColorStop(0.85, '#15803d');
      pGrad.addColorStop(1, 'rgba(21, 128, 61, 0)');

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Neon green body with dynamic bubbling animation effect + skull ☠️ center icon
  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2);
    ctx.clip();

    const bubbles = [
      { ox: -15.6, oy: -13, baseR: 7.2, speed: 3.4, phase: 0 },
      { ox: 13, oy: -18.2, baseR: 5.5, speed: 4.2, phase: 1.5 },
      { ox: 16.9, oy: 9.1, baseR: 7.8, speed: 2.8, phase: 3.1 },
      { ox: -14.3, oy: 15.6, baseR: 6.2, speed: 3.8, phase: 4.2 },
      { ox: -19.5, oy: -2.6, baseR: 4.9, speed: 4.6, phase: 5.1 },
      { ox: 10.4, oy: 16.9, baseR: 5.9, speed: 3.1, phase: 0.8 },
    ];

    for (const b of bubbles) {
      const pulse = Math.sin(this.bubbleTimer * b.speed + b.phase);
      const r = Math.max(1, b.baseR + pulse * 2.0);
      const bx = this.x + b.ox + Math.sin(this.bubbleTimer * 2.2 + b.phase) * 1.5;
      const by = this.y + b.oy - ((this.bubbleTimer * 5 + b.phase * 3) % 10 - 5);

      const bGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.1, bx, by, r);
      bGrad.addColorStop(0, '#f0fdf4');
      bGrad.addColorStop(0.35, '#86efac');
      bGrad.addColorStop(0.8, '#22c55e');
      bGrad.addColorStop(1, '#166534');

      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.restore();

    // Re-draw skull ☠️ icon clearly in center above bubbles
    this.drawCenterIcon(ctx);
  }
}

export class MathGrid extends Ball {
  gridCells: { row: number; col: number; x: number; y: number; size: number; multiplier: number }[];
  gridX: number;
  gridY: number;
  gridSize: number;
  cellSize: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Pure white body with grid lines and 🔢 icon
    super(x, y, radius, mass, '#ffffff', '#94a3b8', name, startingHealth, 'mathgrid', '🔢');
    // Permanent 3x3 tic-tac-toe grid in the exact center of the arena (640, 360)
    this.gridSize = 270;
    this.cellSize = 90;
    this.gridX = (1280 - this.gridSize) / 2;
    this.gridY = (720 - this.gridSize) / 2;
    this.gridCells = [];
    this.generateRandomGrid();
  }

  generateRandomGrid() {
    this.gridCells = [];
    const tacticalMultipliers = [1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        // Center cell of the tic-tac-toe board always has a high-value multiplier
        const mult = (r === 1 && c === 1)
          ? 2.0
          : tacticalMultipliers[Math.floor(Math.random() * tacticalMultipliers.length)];
        this.gridCells.push({
          row: r,
          col: c,
          x: this.gridX + c * this.cellSize,
          y: this.gridY + r * this.cellSize,
          size: this.cellSize,
          multiplier: mult,
        });
      }
    }
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.generateRandomGrid();
  }

  // Returns true ONLY if MathGridBall is physically inside the permanent center 3x3 grid
  isInsideCenterGrid(): boolean {
    return (
      this.x >= this.gridX &&
      this.x <= this.gridX + this.gridSize &&
      this.y >= this.gridY &&
      this.y <= this.gridY + this.gridSize
    );
  }

  // MathGridBall ONLY gets its damage multiplier if it collides while physically inside the center grid
  getCurrentMultiplier(): number {
    if (!this.isInsideCenterGrid()) {
      return 1.0;
    }
    const levelBonus = (this.level - 1) * 0.15;
    for (const cell of this.gridCells) {
      if (this.x >= cell.x && this.x <= cell.x + cell.size && this.y >= cell.y && this.y <= cell.y + cell.size) {
        return cell.multiplier + levelBonus;
      }
    }
    return 1.0;
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const insideGrid = this.isInsideCenterGrid();
    const currentMult = this.getCurrentMultiplier();

    // Subtle backdrop for the permanent center 3x3 tic-tac-toe zone
    ctx.fillStyle = insideGrid ? 'rgba(254, 243, 199, 0.55)' : 'rgba(241, 245, 249, 0.65)';
    ctx.fillRect(this.gridX, this.gridY, this.gridSize, this.gridSize);

    for (const cell of this.gridCells) {
      const isBallInsideCell =
        this.x >= cell.x &&
        this.x <= cell.x + cell.size &&
        this.y >= cell.y &&
        this.y <= cell.y + cell.size;

      if (isBallInsideCell) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
      }

      ctx.font = isBallInsideCell ? '900 22px system-ui, sans-serif' : '800 17px system-ui, sans-serif';
      ctx.fillStyle = isBallInsideCell ? '#b45309' : '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${cell.multiplier.toFixed(1)}x`, cell.x + cell.size / 2, cell.y + cell.size / 2);
    }

    // Draw classic 3x3 Tic-Tac-Toe '#' dividing lines in the exact center of the arena
    ctx.strokeStyle = insideGrid ? '#d97706' : '#334155';
    ctx.lineWidth = insideGrid ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Vertical tic-tac-toe bars
    ctx.moveTo(this.gridX + this.cellSize, this.gridY);
    ctx.lineTo(this.gridX + this.cellSize, this.gridY + this.gridSize);
    ctx.moveTo(this.gridX + this.cellSize * 2, this.gridY);
    ctx.lineTo(this.gridX + this.cellSize * 2, this.gridY + this.gridSize);
    // Horizontal tic-tac-toe bars
    ctx.moveTo(this.gridX, this.gridY + this.cellSize);
    ctx.lineTo(this.gridX + this.gridSize, this.gridY + this.cellSize);
    ctx.moveTo(this.gridX, this.gridY + this.cellSize * 2);
    ctx.lineTo(this.gridX + this.gridSize, this.gridY + this.cellSize * 2);
    ctx.stroke();

    // Outer dashed boundary around the center tic-tac-toe zone
    ctx.strokeStyle = insideGrid ? '#d97706' : 'rgba(71, 85, 105, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(this.gridX, this.gridY, this.gridSize, this.gridSize);
    ctx.setLineDash([]);

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = insideGrid ? '#b45309' : '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(
      insideGrid
        ? `⚡ INSIDE CENTER GRID • ACTIVE MULTIPLIER: ${currentMult.toFixed(2)}x`
        : `CENTER 3×3 TIC-TAC-TOE GRID • COLLIDE INSIDE FOR BOOST (OUTSIDE: 1.0x)`,
      1280 / 2,
      this.gridY - 10
    );
    ctx.restore();
  }

  // White body with grid lines drawn directly on the ball + center icon
  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();

    this.trail.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha * 0.35);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      this.radius * 0.08,
      this.x,
      this.y,
      this.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#f8fafc');
    grad.addColorStop(0.85, '#e2e8f0');
    grad.addColorStop(1, '#cbd5e1');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Grid lines drawn directly on the ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;

    const r3 = this.radius / 3;
    ctx.beginPath();
    ctx.moveTo(this.x - this.radius, this.y - r3);
    ctx.lineTo(this.x + this.radius, this.y - r3);
    ctx.moveTo(this.x - this.radius, this.y + r3);
    ctx.lineTo(this.x + this.radius, this.y + r3);
    ctx.moveTo(this.x - r3, this.y - this.radius);
    ctx.lineTo(this.x - r3, this.y + this.radius);
    ctx.moveTo(this.x + r3, this.y - this.radius);
    ctx.lineTo(this.x + r3, this.y + this.radius);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    this.drawCenterIcon(ctx);
    this.drawFloatingHealthBar(ctx);
    this.drawFloatingDamageText(ctx);
  }
}

/* ==========================================================================
   SNIPER BALL (Realistic Sniper Rifle Render & Pointed Golden Bullet)
   - Realistic sniper rifle drawn with ctx: dark grey stock, long black barrel, small scope on top aiming at enemy.
   - Fires pointed, fast-moving golden bullets with a white motion-blur trail.
   - Damage starts moderate; bullet velocity increases every 10 seconds.
   ========================================================================== */
export class Sniper extends Ball {
  matchTime: number;
  shootTimer: number;
  dashCooldown: number;
  dashRingTimer: number;
  dashOriginX: number;
  dashOriginY: number;
  aimAngle: number;
  recoilOffset: number;
  muzzleFlashTimer: number;
  bulletParticles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    color: string;
  }[];
  bullets: {
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    vx: number;
    vy: number;
    angle: number;
    speed: number;
    damage: number;
    life: number;
    trailLength: number;
    trail?: { x: number; y: number }[];
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#0284c7', '#0369a1', name, startingHealth, 'sniper', '🎯');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 22;
    this.matchTime = 0;
    this.shootTimer = 0.6;
    this.dashCooldown = 0;
    this.dashRingTimer = 0;
    this.dashOriginX = x;
    this.dashOriginY = y;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.recoilOffset = 0;
    this.muzzleFlashTimer = 0;
    this.bulletParticles = [];
    this.bullets = [];
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.matchTime = 0;
    this.shootTimer = 0.6;
    this.dashCooldown = 0;
    this.dashRingTimer = 0;
    this.dashOriginX = x;
    this.dashOriginY = y;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.recoilOffset = 0;
    this.muzzleFlashTimer = 0;
    this.bulletParticles = [];
    this.bullets = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.matchTime += dt;
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
    if (this.dashRingTimer > 0) {
      this.dashRingTimer = Math.max(0, this.dashRingTimer - dt);
    }
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 28);
    }
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
    }

    // Update fading particle trail for bullets
    for (let i = this.bulletParticles.length - 1; i >= 0; i--) {
      const pt = this.bulletParticles[i];
      pt.x += pt.vx * dt * 60;
      pt.y += pt.vy * dt * 60;
      pt.alpha -= dt * 2.8;
      pt.size = Math.max(1, pt.size - dt * 6);
      if (pt.alpha <= 0) {
        this.bulletParticles.splice(i, 1);
      }
    }

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      b.prevX = b.x;
      b.prevY = b.y;
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
      b.life -= dt;
      pushProjectileTrail(b);

      // Emit intense fading tracer particles along the bullet wake
      if (this.bulletParticles.length < 120) {
        const perpX = -Math.sin(b.angle);
        const perpY = Math.cos(b.angle);
        const spread = (Math.random() - 0.5) * 14;
        this.bulletParticles.push({
          x: b.x - Math.cos(b.angle) * 24 + perpX * spread,
          y: b.y - Math.sin(b.angle) * 24 + perpY * spread,
          vx: -b.vx * 0.12 + (Math.random() - 0.5) * 1.4,
          vy: -b.vy * 0.12 + (Math.random() - 0.5) * 1.4,
          alpha: 0.95,
          size: 4.5 + Math.random() * 3.5,
          color: Math.random() > 0.4 ? '#facc15' : '#38bdf8',
        });
      }
    }
    this.bullets = this.bullets.filter(
      (b) => b.life > 0 && b.x > 340 && b.x < 940 && b.y > 60 && b.y < 660
    );
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    const targetPos = opponent.getTargetPosition(this.x, this.y);
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    this.aimAngle = Math.atan2(dy, dx);

    // Tactical Evasive Back-Dash: When opponent gets too close, dash backward to safety!
    const distToOpponent = Math.hypot(opponent.x - this.x, opponent.y - this.y);
    const dangerThreshold = this.radius + opponent.radius + Math.round(95 * 1.3);
    if (distToOpponent <= dangerThreshold && this.dashCooldown <= 0) {
      this.dashCooldown = 3.6;
      this.dashRingTimer = 0.45;
      this.dashOriginX = this.x;
      this.dashOriginY = this.y;

      let awayAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
      // Smart Arena-Boundary Check: If cornered against a wall, angle the back-dash toward open arena center
      const testX = this.x + Math.cos(awayAngle) * 110;
      const testY = this.y + Math.sin(awayAngle) * 110;
      if (testX < 385 || testX > 895 || testY < 105 || testY > 615) {
        const toCenterAngle = Math.atan2(360 - this.y, 640 - this.x);
        awayAngle = toCenterAngle + (Math.random() > 0.5 ? 0.45 : -0.45);
      }

      const dashSpeed = 16.5;
      this.vx = Math.cos(awayAngle) * dashSpeed;
      this.vy = Math.sin(awayAngle) * dashSpeed;

      // Leave afterimage trail nodes for crisp visual feedback
      for (let k = 1; k <= 4; k++) {
        this.trail.push({
          x: this.x - Math.cos(awayAngle) * k * 8,
          y: this.y - Math.sin(awayAngle) * k * 8,
          alpha: 0.75,
        });
      }

      this.floatingTexts.push({
        text: '🎯 TACTICAL BACK-DASH!',
        x: this.x,
        y: this.y - this.radius - 28,
        alpha: 1.0,
        color: '#38bdf8',
        vy: -1.4,
      });

      callbacks.playSound('dash');
      callbacks.spawnShockwave?.(this.dashOriginX, this.dashOriginY, '#38bdf8', 98);
      callbacks.spawnSparks(this.dashOriginX, this.dashOriginY, '#38bdf8', 12);
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = 2.8;

      // Bullet velocity increases every 10 seconds!
      const velocityTier = Math.floor(this.matchTime / 10);
      const speed = 15.0 + velocityTier * 4.5;
      // Buffed Sniper base damage (6.5) that also scales every 3 hits via reload-time hit scaling!
      const damage = 6.5 + velocityTier * 2.0 + (this.level - 1) * 2.0;
      const barrelTipDist = this.radius + 26;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(this.aimAngle) * barrelTipDist,
        this.y + Math.sin(this.aimAngle) * barrelTipDist
      );

      this.bullets.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(this.aimAngle) * speed,
        vy: Math.sin(this.aimAngle) * speed,
        angle: this.aimAngle,
        speed,
        damage,
        life: 3.0,
        trailLength: 50 + velocityTier * 12,
        trail: [{ x: this.x, y: this.y }],
      });

      this.recoilOffset = 7;
      this.muzzleFlashTimer = 0.1;

      // SniperBall: 'sawtooth' oscillator with rapid frequency drop ('pew' / gunshot sound)
      this.playAbilityVoice();
      callbacks.spawnSparks(spawn.x, spawn.y, '#facc15', 8);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      // Check if bullet hits a NinjaShadowBall clone (dies in 1 hit)
      if (opponent.hitShadowCloneAt(b.x, b.y, 16, callbacks)) {
        this.bullets.splice(i, 1);
        continue;
      }

      const prevX = typeof b.prevX === 'number' ? b.prevX : b.x - b.vx;
      const prevY = typeof b.prevY === 'number' ? b.prevY : b.y - b.vy;
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, b.x, b.y);

      if (dist <= opponent.radius + Math.max(35, b.speed || 30)) {
        opponent.takeDamage(b.damage, this.color, 'SNIPED');
        this.recordDamageDealt(b.damage, callbacks);
        opponent.vx += Math.cos(b.angle) * 3.8;
        opponent.vy += Math.sin(b.angle) * 3.8;
        this.playAttackVoice();
        callbacks.spawnSparks(b.x, b.y, '#facc15', 16);
        this.bullets.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.bullets.length === 0 && this.bulletParticles.length === 0 && this.dashRingTimer <= 0) return;
    ctx.save();

    // 1. Draw Tactical Back-Dash impulse ring if active
    if (this.dashRingTimer > 0) {
      const progress = 1 - this.dashRingTimer / 0.45;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.dashOriginX, this.dashOriginY, 18 + progress * 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Fading High-Velocity Particle Trail
    for (const pt of this.bulletParticles) {
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Draw High-Velocity Sniper Bullets with Normalized 40x14px Heavy Blast Dimensions & Bright Glow
    for (const b of this.bullets) {
      drawArcadeCometTrail(ctx, (b as any).trail, '#facc15', 10);

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;

      // Subtle outer high-velocity energy aura glow
      const haloGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 24);
      haloGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      haloGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.25)');
      haloGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Normalized 40x14px heavy dark obsidian tracer round
      const bulletGrad = ctx.createLinearGradient(-20, -7, 20, 7);
      bulletGrad.addColorStop(0, '#090d16');
      bulletGrad.addColorStop(0.5, '#1e293b');
      bulletGrad.addColorStop(1, '#0284c7');

      ctx.fillStyle = bulletGrad;
      ctx.fillRect(-20, -7, 40, 14);

      // High contrast solid white border stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-20, -7, 40, 14);

      // Mach-cone tip flare on front of bullet
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(10, -10);
      ctx.lineTo(24, 0);
      ctx.lineTo(10, 10);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // 1. Draw Base Ball
    super.draw(ctx);

    // 3. Draw Realistic Scaled Sniper Rifle Aiming at the Enemy (1.3x global scale)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const rx = -this.recoilOffset;
    const ry = (this.radius / 1.3) * 0.38;

    // A. Dark Grey Stock (1.35x scaled)
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(rx - 36, ry + 7);
    ctx.lineTo(rx - 36, ry - 6);
    ctx.lineTo(rx - 18, ry - 4);
    ctx.lineTo(rx - 8, ry - 1);
    ctx.lineTo(rx - 8, ry + 6);
    ctx.lineTo(rx - 21, ry + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rubber recoil buttpad
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(rx - 39, ry - 6, 3.5, 13);

    // Pistol grip
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(rx - 10, ry + 3);
    ctx.lineTo(rx - 15, ry + 12);
    ctx.lineTo(rx - 9, ry + 12);
    ctx.lineTo(rx - 5, ry + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. Rifle Receiver & Box Magazine
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(rx - 9, ry - 6, 28, 10, 2);
    ctx.fill();
    ctx.stroke();

    // Box Magazine
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx + 2, ry + 4, 10, 8);
    ctx.strokeRect(rx + 2, ry + 4, 10, 8);

    // C. Long Black Barrel + Muzzle Brake
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.fillRect(rx + 19, ry - 4, 44, 5.5);
    ctx.strokeRect(rx + 19, ry - 4, 44, 5.5);

    // Slotted heavy sniper muzzle brake
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx + 63, ry - 5, 9, 8);
    ctx.strokeRect(rx + 63, ry - 5, 9, 8);

    // Muzzle flash when firing
    if (this.muzzleFlashTimer > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(rx + 72, ry - 1);
      ctx.lineTo(rx + 88, ry - 8);
      ctx.lineTo(rx + 82, ry - 1);
      ctx.lineTo(rx + 94, ry - 1);
      ctx.lineTo(rx + 82, ry + 1);
      ctx.lineTo(rx + 88, ry + 7);
      ctx.closePath();
      ctx.fill();
    }

    // D. Scope on Top
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rx - 3, ry - 10, 3.5, 4);
    ctx.fillRect(rx + 11, ry - 10, 3.5, 4);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx - 8, ry - 13);
    ctx.lineTo(rx + 14, ry - 13);
    ctx.lineTo(rx + 20, ry - 15);
    ctx.lineTo(rx + 20, ry - 9);
    ctx.lineTo(rx + 14, ry - 10);
    ctx.lineTo(rx - 8, ry - 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Optical lens reflection
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(rx + 18.5, ry - 14.5, 2, 5);

    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

/* ==========================================================================
   BOW BALL (Realistic Curved Wooden Bow & Scaling Arrows)
   ========================================================================== */
export class Archer extends Ball {
  shootTimer: number;
  aimAngle: number;
  arrows: {
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    vx: number;
    vy: number;
    angle: number;
    speed: number;
    damage: number;
    life: number;
    trail?: { x: number; y: number }[];
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#16a34a', '#14532d', name, startingHealth, 'bow', '🏹');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 22;
    this.shootTimer = 0.7;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.arrows = [];
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.shootTimer = 0.7;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.arrows = [];
  }

  getBowTier(): 1 | 2 | 3 {
    if (this.totalDamageDealt >= 60) return 3;
    if (this.totalDamageDealt >= 30) return 2;
    return 1;
  }

  getCurrentCooldown(): number {
    const tier = this.getBowTier();
    if (tier === 3) return 1.8;
    if (tier === 2) return 3.2;
    return 4.0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    for (let i = 0; i < this.arrows.length; i++) {
      const a = this.arrows[i];
      a.prevX = a.x;
      a.prevY = a.y;
      a.x += a.vx * dt * 60;
      a.y += a.vy * dt * 60;
      a.life -= dt;
      pushProjectileTrail(a);
    }
    this.arrows = this.arrows.filter(
      (a) => a.life > 0 && a.x > 340 && a.x < 940 && a.y > 60 && a.y < 660
    );
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    const targetPos = opponent.getTargetPosition(this.x, this.y);
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    this.aimAngle = Math.atan2(dy, dx);

    const tier = this.getBowTier();
    const cooldown = this.getCurrentCooldown();

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = cooldown;

      const spreadAngles =
        tier === 1
          ? [0]
          : tier === 2
          ? [-0.11, 0.11]
          : [-0.15, 0, 0.15];

      const arrowSpeed = tier === 3 ? 13.5 : tier === 2 ? 11.8 : 10.5;
      const arrowDamage = tier === 3 ? 4.5 : tier === 2 ? 3.5 : 3.0;

      for (const offsetAngle of spreadAngles) {
        const fireAngle = this.aimAngle + offsetAngle;
        const spawn = clampProjectileSpawn(
          this.x + Math.cos(fireAngle) * (this.radius + 20),
          this.y + Math.sin(fireAngle) * (this.radius + 20)
        );
        this.arrows.push({
          x: spawn.x,
          y: spawn.y,
          prevX: this.x,
          prevY: this.y,
          vx: Math.cos(fireAngle) * arrowSpeed,
          vy: Math.sin(fireAngle) * arrowSpeed,
          angle: fireAngle,
          speed: arrowSpeed,
          damage: arrowDamage,
          life: 3.5,
          trail: [{ x: this.x, y: this.y }],
        });
      }

      this.playAbilityVoice();
      callbacks.spawnSparks(
        this.x + Math.cos(this.aimAngle) * (this.radius + 20),
        this.y + Math.sin(this.aimAngle) * (this.radius + 20),
        tier === 3 ? '#facc15' : '#a16207',
        6 + tier * 2
      );
    }

    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];

      if (opponent.hitShadowCloneAt(a.x, a.y, 16, callbacks)) {
        this.arrows.splice(i, 1);
        continue;
      }

      const prevX = typeof a.prevX === 'number' ? a.prevX : a.x - a.vx;
      const prevY = typeof a.prevY === 'number' ? a.prevY : a.y - a.vy;
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, a.x, a.y);

      if (dist <= opponent.radius + Math.max(35, a.speed || 30)) {
        opponent.takeDamage(a.damage, this.color, 'ARROW');
        this.recordDamageDealt(a.damage, callbacks);
        opponent.vx += Math.cos(a.angle) * 2.6;
        opponent.vy += Math.sin(a.angle) * 2.6;
        this.playAttackVoice();
        callbacks.spawnSparks(a.x, a.y, '#a16207', 10);
        this.arrows.splice(i, 1);
      }
    }
  }

  private drawRealisticArrow(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 10;

    // Fletching feathers (~5px wingspan)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-9, -1);
    ctx.lineTo(-14, -4.5);
    ctx.lineTo(-16, -3.5);
    ctx.lineTo(-12.5, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-9, 1);
    ctx.lineTo(-14, 4.5);
    ctx.lineTo(-16, 3.5);
    ctx.lineTo(-12.5, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arrow shaft (~24px)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();

    // Broadhead tip (~32px total length, crisp white outline)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(7, -5);
    ctx.lineTo(9, 0);
    ctx.lineTo(7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.arrows.length === 0) return;
    ctx.save();
    for (const arrow of this.arrows) {
      drawArcadeCometTrail(ctx, (arrow as any).trail, '#fef08a', 7);

      ctx.save();
      ctx.translate(arrow.x, arrow.y);
      ctx.rotate(arrow.angle);

      this.drawRealisticArrow(ctx);

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // 2. Draw Base Ball
    super.draw(ctx);

    // 3. Draw Realistic Curved Wooden Bow (using ctx.arc) and Taut String (using ctx.lineTo)
    const tier = this.getBowTier();
    const cooldown = this.getCurrentCooldown();
    const drawProgress = Math.max(0, Math.min(1, 1 - this.shootTimer / cooldown));

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);

    const bowCenterX = this.radius * 0.25;
    const bowArcRadius = this.radius + 16 + (tier - 1) * 4;
    const bowHalfAngle = 1.05; // Arc span of the curved bow limbs

    // Calculate top and bottom limb tips on the arc
    const topTipX = bowCenterX + Math.cos(-bowHalfAngle) * bowArcRadius;
    const topTipY = Math.sin(-bowHalfAngle) * bowArcRadius;
    const botTipX = bowCenterX + Math.cos(bowHalfAngle) * bowArcRadius;
    const botTipY = Math.sin(bowHalfAngle) * bowArcRadius;

    // String nock point pulls backward as the bow draws taut
    const stringPullX = topTipX - drawProgress * 20;

    // A. Taut Bowstring drawn with ctx.lineTo
    ctx.strokeStyle = tier === 3 ? '#fef08a' : '#f8fafc';
    ctx.lineWidth = tier >= 2 ? 2.9 : 2.3;
    ctx.beginPath();
    ctx.moveTo(topTipX, topTipY);
    ctx.lineTo(stringPullX, 0);
    ctx.lineTo(botTipX, botTipY);
    ctx.stroke();

    // B. Curved Wooden Bow drawn with ctx.arc
    // Outer dark wood edge
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 9.8 + (tier - 1) * 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(bowCenterX, 0, bowArcRadius, -bowHalfAngle, bowHalfAngle);
    ctx.stroke();

    // Inner carved wood core (upgrades visually at 30 and 60 damage!)
    ctx.strokeStyle = tier === 3 ? '#eab308' : tier === 2 ? '#d97706' : '#92400e';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(bowCenterX, 0, bowArcRadius, -bowHalfAngle, bowHalfAngle);
    ctx.stroke();

    // Leather grip wrap at center of bow riser
    ctx.strokeStyle = tier >= 2 ? '#facc15' : '#1e293b';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(bowCenterX, 0, bowArcRadius, -0.18, 0.18);
    ctx.stroke();

    // Visual Upgrade Limb Caps at 30+ and 60+ damage
    if (tier >= 2) {
      ctx.fillStyle = tier === 3 ? '#facc15' : '#cbd5e1';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(topTipX, topTipY, 5.2, 0, Math.PI * 2);
      ctx.arc(botTipX, botTipY, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // C. Draw nocked arrow(s) on the taut string while drawing back
    if (drawProgress > 0.2) {
      const previewAngles = tier === 1 ? [0] : tier === 2 ? [-0.08, 0.08] : [-0.12, 0, 0.12];
      for (const pa of previewAngles) {
        ctx.save();
        ctx.translate(stringPullX + 12, 0);
        ctx.rotate(pa);
        this.drawRealisticArrow(ctx);
        ctx.restore();
      }
    }

    ctx.restore();

    // Ensure center HP number stays crisp on top
    this.drawCenterIcon(ctx);
  }
}

/* ==========================================================================
   NEW SUBCLASS 7: BlackHoleBall
   Pitch black with slowly rotating purple event horizon ring and 🕳️ icon.
   ========================================================================== */
export class BlackHole extends Ball {
  vortexAngle: number;
  tidalCooldown: number;
  particles: { angle: number; dist: number; speed: number; size: number }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#000000', '#7c3aed', name, startingHealth, 'blackhole', '🕳️');
    this.vortexAngle = 0;
    this.tidalCooldown = 0;
    this.particles = [];
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 35 + Math.random() * 85,
        speed: 1.2 + Math.random() * 2.0,
        size: 1.5 + Math.random() * 2.2,
      });
    }
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.vortexAngle = 0;
    this.tidalCooldown = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.vortexAngle += dt * 1.5;
    if (this.tidalCooldown > 0) this.tidalCooldown -= dt;

    for (const p of this.particles) {
      p.angle += dt * p.speed;
      p.dist -= dt * 12;
      if (p.dist < this.radius * 0.8) {
        p.dist = 45 + Math.random() * 80;
      }
    }
  }

  override updateSpecial(_dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void; }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    const dx = this.x - opponent.x;
    const dy = this.y - opponent.y;
    const dist = Math.hypot(dx, dy);

    const pullRange = Math.round(420 * 1.3);
    if (dist < pullRange && dist > 12) {
      const normalizedProximity = (pullRange - dist) / pullRange;
      const suctionStrength = Math.pow(normalizedProximity, 1.4) * (0.65 + (this.level - 1) * 0.1);

      const nx = dx / dist;
      const ny = dy / dist;
      opponent.vx += nx * suctionStrength;
      opponent.vy += ny * suctionStrength;
    }

    if (dist <= this.radius + opponent.radius + Math.round(14 * 1.3)) {
      if (this.tidalCooldown <= 0) {
        const tickDmg = 1 + this.level;
        opponent.takeDamage(tickDmg, this.color, 'GRAVITY');
        this.recordDamageDealt(tickDmg, callbacks);
        this.tidalCooldown = 0.75;
        callbacks.playSound('poison');
        callbacks.spawnSparks(opponent.x, opponent.y, '#a855f7', 8);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    const diskRadius = this.radius * 2.2;
    const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.7, this.x, this.y, diskRadius);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.35, 'rgba(124, 58, 237, 0.38)');
    grad.addColorStop(0.7, 'rgba(67, 56, 202, 0.18)');
    grad.addColorStop(1, 'rgba(124, 58, 237, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, diskRadius, 0, Math.PI * 2);
    ctx.fill();

    for (const p of this.particles) {
      const px = this.x + Math.cos(p.angle) * p.dist;
      const py = this.y + Math.sin(p.angle) * p.dist;
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Slowly rotating purple event horizon ring
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.vortexAngle);

    ctx.strokeStyle = '#a855f7';
    ctx.shadowColor = '#9333ea';
    ctx.shadowBlur = 9;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const nodeAngle = (i * Math.PI) / 3;
      const nx = Math.cos(nodeAngle) * (this.radius + 8);
      const ny = Math.sin(nodeAngle) * (this.radius + 8);
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Pitch black body
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    this.drawCenterIcon(ctx);
    this.drawFloatingHealthBar(ctx);
    this.drawFloatingDamageText(ctx);
  }

  // Void Characters: Push dark purple particles that implode inward
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 40; i++) {
      particles.push(new VoidParticle(this.x, this.y, '#a855f7'));
    }
  }
}

export class Vampire extends Ball {
  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#dc2626', '#7f1d1d', name, startingHealth, 'vampire', '🧛');
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    const pulse = Math.sin(performance.now() * 0.005) * 3.5;
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 4 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    super.draw(ctx);
  }
}

export class Mirage extends Ball {
  cloneX: number;
  cloneY: number;
  cloneVx: number;
  cloneVy: number;
  arenaCenterX: number;
  arenaCenterY: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#e2e8f0', '#6366f1', name, startingHealth, 'mirror', '🪞');
    this.arenaCenterX = 640;
    this.arenaCenterY = 360;
    this.cloneX = 2 * this.arenaCenterX - this.x;
    this.cloneY = 2 * this.arenaCenterY - this.y;
    this.cloneVx = 0;
    this.cloneVy = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.cloneX = 2 * this.arenaCenterX - this.x;
    this.cloneY = 2 * this.arenaCenterY - this.y;
    this.cloneVx = 0;
    this.cloneVy = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);

    this.cloneVx = -this.vx;
    this.cloneVy = -this.vy;
    this.cloneX += this.cloneVx;
    this.cloneY += this.cloneVy;

    const innerLeft = 350;
    const innerRight = 930;
    const innerTop = 70;
    const innerBottom = 650;

    if (this.cloneX - this.radius < innerLeft) {
      this.cloneX = innerLeft + this.radius;
      this.cloneVx = -this.cloneVx * 0.88;
    }
    if (this.cloneX + this.radius > innerRight) {
      this.cloneX = innerRight - this.radius;
      this.cloneVx = -this.cloneVx * 0.88;
    }
    if (this.cloneY - this.radius < innerTop) {
      this.cloneY = innerTop + this.radius;
      this.cloneVy = -this.cloneVy * 0.88;
    }
    if (this.cloneY + this.radius > innerBottom) {
      this.cloneY = innerBottom - this.radius;
      this.cloneVy = -this.cloneVy * 0.88;
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.8;

    const cloneGrad = ctx.createRadialGradient(
      this.cloneX - this.radius * 0.32,
      this.cloneY - this.radius * 0.32,
      this.radius * 0.1,
      this.cloneX,
      this.cloneY,
      this.radius
    );
    cloneGrad.addColorStop(0, '#ffffff');
    cloneGrad.addColorStop(0.3, '#c7d2fe');
    cloneGrad.addColorStop(0.8, '#6366f1');
    cloneGrad.addColorStop(1, '#4338ca');

    ctx.fillStyle = cloneGrad;
    ctx.beginPath();
    ctx.arc(this.cloneX, this.cloneY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(this.cloneX, this.cloneY, this.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const iconSize = Math.round(this.radius * 0.9);
    ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪞', this.cloneX, this.cloneY + 1);

    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = '#4338ca';
    ctx.fillText('DECOY CLONE', this.cloneX, this.cloneY - this.radius - 8);
    ctx.restore();

    super.draw(ctx);
  }
}

export class Jackpot extends Ball {
  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#eab308', '#a16207', name, startingHealth, 'jackpot', '🎰');
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    super.draw(ctx);
  }
}

export class FrostNova extends Ball {
  novaCooldown: number;
  novaTimer: number;
  frostRings: { radius: number; maxRadius: number; alpha: number; hitOpponent: boolean }[];
  crystalAngle: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#38bdf8', '#0284c7', name, startingHealth, 'frost', '❄️');
    this.novaCooldown = 4.5;
    this.novaTimer = 0;
    this.frostRings = [];
    this.crystalAngle = 0;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playIceCollisionChime(0.94, 'frost');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.novaTimer = 0;
    this.frostRings = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.crystalAngle += dt * 1.5;
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.novaTimer += dt;
    if (this.novaTimer >= this.novaCooldown) {
      this.novaTimer = 0;
      this.frostRings.push({
        radius: this.radius + 3,
        maxRadius: Math.round((150 + (this.level - 1) * 15) * 1.3),
        alpha: 1.0,
        hitOpponent: false,
      });
      callbacks.playSound('freeze');
      callbacks.spawnSparks(this.x, this.y, '#0284c7', 16);
      callbacks.spawnShockwave?.(this.x, this.y, '#38bdf8', 195);
    }

    for (let i = this.frostRings.length - 1; i >= 0; i--) {
      const ring = this.frostRings[i];
      ring.radius += dt * 234;
      ring.alpha = Math.max(0, 1 - ring.radius / ring.maxRadius);

      if (!ring.hitOpponent) {
        const dist = Math.hypot(this.x - opponent.x, this.y - opponent.y);
        if (Math.abs(dist - ring.radius) < 31 || dist < ring.radius) {
          ring.hitOpponent = true;
          opponent.isFrozen = true;
          opponent.frozenTimer = 2.5;
          const novaDmg = 1 + this.level;
          opponent.takeDamage(novaDmg, this.color, 'FROST NOVA');
          this.recordDamageDealt(novaDmg, callbacks);
          callbacks.playSound('freeze');
          callbacks.spawnSparks(opponent.x, opponent.y, '#38bdf8', 14);
        }
      }

      if (ring.radius >= ring.maxRadius || ring.alpha <= 0) {
        this.frostRings.splice(i, 1);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    for (const ring of this.frostRings) {
      ctx.save();
      ctx.globalAlpha = ring.alpha * 0.8;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    for (let i = 0; i < 4; i++) {
      const angle = this.crystalAngle + (i * Math.PI) / 2;
      const dist = this.radius + 12;
      const cx = this.x + Math.cos(angle) * dist;
      const cy = this.y + Math.sin(angle) * dist;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, -7.8);
      ctx.lineTo(5.2, 0);
      ctx.lineTo(0, 7.8);
      ctx.lineTo(-5.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();

    super.draw(ctx);
  }

  // Ice Characters: Push jagged cyan polygon shapes (shards) that explode outward and fade
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new ShardParticle(this.x, this.y, '#38bdf8'));
    }
  }
}

export class Blink extends Ball {
  teleportCooldown: number;
  teleportTimer: number;
  rifts: { x: number; y: number; life: number; maxLife: number; angle: number }[];
  phaseGhosts: { x: number; y: number; alpha: number }[];
  riftTickCooldown: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#c026d3', '#701a75', name, startingHealth, 'blink', '🌀');
    this.teleportCooldown = 3.6;
    this.teleportTimer = 1.0;
    this.rifts = [];
    this.phaseGhosts = [];
    this.riftTickCooldown = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.teleportTimer = 1.0;
    this.rifts = [];
    this.phaseGhosts = [];
    this.riftTickCooldown = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.riftTickCooldown > 0) this.riftTickCooldown -= dt;

    for (let i = this.phaseGhosts.length - 1; i >= 0; i--) {
      this.phaseGhosts[i].alpha -= dt * 2.5;
      if (this.phaseGhosts[i].alpha <= 0) {
        this.phaseGhosts.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.teleportTimer += dt;
    const dx = opponent.x - this.x;
    const dy = opponent.y - this.y;
    const dist = Math.hypot(dx, dy);

    const shouldBlink = (dist < 130 && this.teleportTimer >= 2.2) || (this.teleportTimer >= this.teleportCooldown);

    if (shouldBlink) {
      this.teleportTimer = 0;

      this.rifts.push({
        x: this.x,
        y: this.y,
        life: 2.2,
        maxLife: 2.2,
        angle: 0,
      });

      this.phaseGhosts.push({ x: this.x, y: this.y, alpha: 0.9 });
      callbacks.spawnSparks(this.x, this.y, '#c026d3', 16);
      callbacks.playSound('teleport');

      const oppSpeed = Math.hypot(opponent.vx, opponent.vy);
      const angle = oppSpeed > 0.5 ? Math.atan2(opponent.vy, opponent.vx) : Math.atan2(dy, dx);
      const destX = opponent.x - Math.cos(angle) * 115;
      const destY = opponent.y - Math.sin(angle) * 115;

      this.x = Math.max(380, Math.min(900, destX));
      this.y = Math.max(100, Math.min(620, destY));

      const newDx = opponent.x - this.x;
      const newDy = opponent.y - this.y;
      const newDist = Math.hypot(newDx, newDy) || 1;
      this.vx = (newDx / newDist) * 6.5;
      this.vy = (newDy / newDist) * 6.5;

      callbacks.spawnShockwave?.(this.x, this.y, '#d946ef', 70);
      callbacks.spawnSparks(this.x, this.y, '#c026d3', 12);
    }

    for (let i = this.rifts.length - 1; i >= 0; i--) {
      const rift = this.rifts[i];
      rift.life -= dt;
      rift.angle += dt * 3.5;

      const distToOpp = Math.hypot(rift.x - opponent.x, rift.y - opponent.y);
      if (distToOpp < 47 + opponent.radius && this.riftTickCooldown <= 0) {
        const riftDmg = 1 + this.level;
        opponent.takeDamage(riftDmg, this.color, 'WARP RIFT');
        this.recordDamageDealt(riftDmg, callbacks);
        this.riftTickCooldown = 0.75;
        callbacks.playSound('hit');
        callbacks.spawnSparks(rift.x, rift.y, '#c026d3', 10);
      }

      if (rift.life <= 0) {
        this.rifts.splice(i, 1);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    for (const rift of this.rifts) {
      const alpha = Math.min(1, rift.life / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.translate(rift.x, rift.y);
      ctx.rotate(rift.angle);

      ctx.strokeStyle = '#a21caf';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const ghost of this.phaseGhosts) {
      ctx.save();
      ctx.globalAlpha = ghost.alpha * 0.45;
      ctx.fillStyle = '#c026d3';
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    super.draw(ctx);
  }
}

/* ==========================================================================
   NEW SUBCLASS 13: MinefieldTrapBall
   Industrial hazard orange body with 💣 (bomb) icon.
   ========================================================================== */
export class Minefield extends Ball {
  static mines: { x: number; y: number; armTimer: number; isArmed: boolean; life: number; pulse: number }[] = [];
  deployCooldown: number;
  deployTimer: number;
  mines: { x: number; y: number; armTimer: number; isArmed: boolean; life: number; pulse: number }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Hazard orange body with 💣 bomb icon
    super(x, y, radius, mass, '#ea580c', '#9a3412', name, startingHealth, 'trap', '💣');
    this.deployCooldown = 2.8;
    this.deployTimer = 0;
    this.mines = [];
    Minefield.mines = this.mines;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.deployTimer = 0;
    this.mines = [];
    Minefield.mines = this.mines;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.deployTimer += dt;
    const maxMines = 2 + this.level;
    if (this.deployTimer >= this.deployCooldown && this.mines.length < maxMines) {
      this.deployTimer = 0;
      this.mines.push({
        x: this.x,
        y: this.y,
        armTimer: 0.8,
        isArmed: false,
        life: 8.5,
        pulse: 0,
      });
      callbacks.playSound('wall');
      callbacks.spawnSparks(this.x, this.y, '#ea580c', 8);
    }

    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      mine.life -= dt;
      mine.pulse += dt * 4;

      if (!mine.isArmed) {
        mine.armTimer -= dt;
        if (mine.armTimer <= 0) {
          mine.isArmed = true;
          callbacks.spawnSparks(mine.x, mine.y, '#ef4444', 6);
        }
      } else {
        const dx = opponent.x - mine.x;
        const dy = opponent.y - mine.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 44 + opponent.radius) {
          const mineDmg = 2 + this.level;
          opponent.takeDamage(mineDmg, this.color, 'MINE BLAST');
          this.recordDamageDealt(mineDmg, callbacks);
          const knockAngle = Math.atan2(dy, dx) || 0;
          opponent.vx += Math.cos(knockAngle) * 9.5;
          opponent.vy += Math.sin(knockAngle) * 9.5;

          this.playAbilityVoice();
          callbacks.playSound('explosion');
          callbacks.spawnSparks(mine.x, mine.y, '#ea580c', 16);
          callbacks.spawnShockwave?.(mine.x, mine.y, '#f97316', 98);

          this.mines.splice(i, 1);
          continue;
        }
      }

      if (mine.life <= 0) {
        this.mines.splice(i, 1);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    for (const mine of this.mines) {
      ctx.save();
      const alpha = Math.min(1, mine.life / 0.8);
      ctx.globalAlpha = alpha;

      const ringColor = mine.isArmed ? '#dc2626' : '#d97706';
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 13, 0, Math.PI * 2);
      ctx.fill();

      const ledGlow = Math.sin(mine.pulse) > 0 ? '#ef4444' : '#7f1d1d';
      ctx.fillStyle = mine.isArmed ? ledGlow : '#fbbf24';
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    super.draw(ctx);
  }

  // Fire Characters: Push large, rising orange and grey circle particles (smoke and embers)
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
    for (let i = 0; i < 40; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
  }
}

export class Juggernaut extends Ball {
  kineticCharge: number;
  baseMass: number;
  glowPulse: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, 60, '#0284c7', '#0f172a', name, startingHealth, 'inertia', '⚡');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 60;
    this.baseMass = 60;
    this.kineticCharge = 0;
    this.glowPulse = 0;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(0.95, 'juggernaut');
  }

  absorbKinetic(amount: number) {
    this.kineticCharge = Math.min(100, this.kineticCharge + amount);
    this.mass = this.baseMass + (this.kineticCharge / 100) * 40;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.kineticCharge = 0;
    this.mass = this.baseMass;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.glowPulse += dt * 5;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 5.5) {
      this.absorbKinetic(dt * 8);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    const chargePercent = this.kineticCharge / 100;
    const arcRadius = this.radius + 6;

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, arcRadius, 0, Math.PI * 2);
    ctx.stroke();

    if (chargePercent > 0) {
      const chargeColor = chargePercent > 0.7 ? '#d97706' : '#0284c7';
      ctx.strokeStyle = chargeColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, arcRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargePercent);
      ctx.stroke();
    }
    ctx.restore();

    super.draw(ctx);
  }
}

export class DroneSwarm extends Ball {
  droneAngle: number;
  fireCooldown: number;
  fireTimer: number;
  plasmaBolts: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; life: number; damage: number; trail?: { x: number; y: number }[] }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    super(x, y, radius, mass, '#0891b2', '#0e7490', name, startingHealth, 'swarm', '🛸');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 24;
    this.droneAngle = 0;
    this.fireCooldown = 1.8;
    this.fireTimer = 0.6;
    this.plasmaBolts = [];
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.24, 'tech');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.droneAngle = 0;
    this.fireTimer = 0.6;
    this.plasmaBolts = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.droneAngle += dt * 2.8;

    for (let i = this.plasmaBolts.length - 1; i >= 0; i--) {
      const bolt = this.plasmaBolts[i];
      bolt.prevX = bolt.x;
      bolt.prevY = bolt.y;
      bolt.x += bolt.vx;
      bolt.y += bolt.vy;
      bolt.life -= dt;
      pushProjectileTrail(bolt);
      if (bolt.life <= 0 || bolt.x < 340 || bolt.x > 940 || bolt.y < 60 || bolt.y > 660) {
        this.plasmaBolts.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.fireTimer -= dt;
    const orbitDist = this.radius + 24;
    const drone1X = this.x + Math.cos(this.droneAngle) * orbitDist;
    const drone1Y = this.y + Math.sin(this.droneAngle) * orbitDist;
    const drone2X = this.x + Math.cos(this.droneAngle + Math.PI) * orbitDist;
    const drone2Y = this.y + Math.sin(this.droneAngle + Math.PI) * orbitDist;

    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown;

      const fireFromDrone = (dx: number, dy: number) => {
        const spawn = clampProjectileSpawn(dx, dy);
        const targetPos = opponent.getTargetPosition(spawn.x, spawn.y);
        const toOppX = targetPos.x - spawn.x;
        const toOppY = targetPos.y - spawn.y;
        const dist = Math.hypot(toOppX, toOppY) || 1;
        const boltSpeed = 10.5;
        this.plasmaBolts.push({
          x: spawn.x,
          y: spawn.y,
          prevX: spawn.x,
          prevY: spawn.y,
          vx: (toOppX / dist) * boltSpeed,
          vy: (toOppY / dist) * boltSpeed,
          speed: boltSpeed,
          life: 1.8,
          damage: 1.5 + (this.level - 1) * 0.5,
          trail: [],
        });
      };

      fireFromDrone(drone1X, drone1Y);
      fireFromDrone(drone2X, drone2Y);

      this.playAbilityVoice();
      callbacks.playSound('laser');
      callbacks.spawnSparks(drone1X, drone1Y, '#0891b2', 4);
      callbacks.spawnSparks(drone2X, drone2Y, '#0891b2', 4);
    }

    for (let i = this.plasmaBolts.length - 1; i >= 0; i--) {
      const bolt = this.plasmaBolts[i];
      if (opponent.hitShadowCloneAt(bolt.x, bolt.y, 18, callbacks)) {
        this.plasmaBolts.splice(i, 1);
        continue;
      }
      const prevX = typeof bolt.prevX === 'number' ? bolt.prevX : bolt.x - bolt.vx;
      const prevY = typeof bolt.prevY === 'number' ? bolt.prevY : bolt.y - bolt.vy;
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, bolt.x, bolt.y);

      if (dist <= opponent.radius + Math.max(35, bolt.speed || 30)) {
        opponent.takeDamage(bolt.damage, this.color, 'PLASMA');
        this.recordDamageDealt(bolt.damage, callbacks);
        callbacks.playSound('hit');
        callbacks.spawnSparks(bolt.x, bolt.y, '#0891b2', 6);
        this.plasmaBolts.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.plasmaBolts.length === 0) return;
    ctx.save();
    for (const bolt of this.plasmaBolts) {
      drawArcadeCometTrail(ctx, (bolt as any).trail, '#0891b2', 8);

      ctx.save();
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();

    const orbitDist = this.radius + 24;
    const dronePositions = [
      { x: this.x + Math.cos(this.droneAngle) * orbitDist, y: this.y + Math.sin(this.droneAngle) * orbitDist, angle: this.droneAngle },
      { x: this.x + Math.cos(this.droneAngle + Math.PI) * orbitDist, y: this.y + Math.sin(this.droneAngle + Math.PI) * orbitDist, angle: this.droneAngle + Math.PI },
    ];

    for (const d of dronePositions) {
      ctx.save();
      ctx.strokeStyle = 'rgba(8, 145, 178, 0.35)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle + Math.PI / 2);
      ctx.scale(1.3, 1.3);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    super.draw(ctx);
  }

  // Tech/Mecha Characters: Push square, yellow electrical spark particles that flash rapidly
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#0891b2'));
    }
  }
}

/* ==========================================================================
   NEW SUBCLASSES: EngineerBall (⚙️), RubberPirateBall (👒), ThreeSwordBall (⚔️)
   ========================================================================== */

export class Engineer extends Ball {
  turretDropTimer: number;
  gearAngle: number;
  turrets: {
    x: number;
    y: number;
    fireTimer: number;
    aimAngle: number;
    recoil: number;
  }[];
  projectiles: {
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    vx: number;
    vy: number;
    speed: number;
    damage: number;
    life: number;
    trail?: { x: number; y: number }[];
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Industrial steel/amber body with ⚙️ gear icon
    super(x, y, radius, mass, '#64748b', '#f59e0b', name, startingHealth, 'engineer', '⚙️');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 24;
    this.turretDropTimer = 0.6;
    this.gearAngle = 0;
    this.turrets = [];
    this.projectiles = [];
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.16, 'engineer');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.turretDropTimer = 0.6;
    this.gearAngle = 0;
    this.turrets = [];
    this.projectiles = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.gearAngle += 2.2 * dt;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      pushProjectileTrail(p);
      if (p.life <= 0 || p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Drops static 'Turrets' (small grey squares) that shoot targeted projectiles at the opponent every 2s.
  override updateSpecial(dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    // 1. Turret drop timer (every 5 seconds after quick initial drop)
    this.turretDropTimer -= dt;
    if (this.turretDropTimer <= 0) {
      this.turretDropTimer = 5.0;
      const maxTurrets = 5 + (this.level - 1) * 2;
      if (this.turrets.length >= maxTurrets) {
        this.turrets.shift();
      }
      this.turrets.push({
        x: Math.max(385, Math.min(895, this.x)),
        y: Math.max(105, Math.min(615, this.y)),
        fireTimer: 0.4,
        aimAngle: Math.atan2(opponent.y - this.y, opponent.x - this.x),
        recoil: 0,
      });
      this.floatingTexts.push({
        text: '⚙️ TURRET DEPLOYED!',
        x: this.x,
        y: this.y - this.radius - 22,
        alpha: 1.0,
        vy: -1.1,
        color: '#f59e0b',
      });
      this.playAbilityVoice();
      callbacks.playSound('wall');
      callbacks.spawnSparks(this.x, this.y, '#94a3b8', 10);
    }

    // 2. Update static turrets & auto-fire every 2 seconds at opponent's current (or clone-confused) position
    const bulletDamage = 1.5 + (this.level - 1) * 0.5;
    for (const turret of this.turrets) {
      const targetPos = opponent.getTargetPosition(turret.x, turret.y);
      turret.aimAngle = Math.atan2(targetPos.y - turret.y, targetPos.x - turret.x);
      if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * 12);
      }

      turret.fireTimer -= dt;
      if (turret.fireTimer <= 0) {
        turret.fireTimer = 2.0;
        turret.recoil = 5.2;
        const speed = 10.5;
        const spawn = clampProjectileSpawn(
          turret.x + Math.cos(turret.aimAngle) * 18,
          turret.y + Math.sin(turret.aimAngle) * 18
        );
        this.projectiles.push({
          x: spawn.x,
          y: spawn.y,
          prevX: turret.x,
          prevY: turret.y,
          vx: Math.cos(turret.aimAngle) * speed,
          vy: Math.sin(turret.aimAngle) * speed,
          speed,
          damage: bulletDamage,
          life: 2.6,
          trail: [{ x: turret.x, y: turret.y }],
        });
        this.playAttackVoice();
        callbacks.playSound('laser');
        callbacks.spawnSparks(spawn.x, spawn.y, '#f59e0b', 4);
      }
    }

    // 3. Check projectile collisions with opponent (and Shadow Clones)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (opponent.hitShadowCloneAt(p.x, p.y, 17, callbacks)) {
        this.projectiles.splice(i, 1);
        continue;
      }
      const prevX = typeof p.prevX === 'number' ? p.prevX : p.x - p.vx;
      const prevY = typeof p.prevY === 'number' ? p.prevY : p.y - p.vy;
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        opponent.takeDamage(p.damage, this.color, 'TURRET');
        this.recordDamageDealt(p.damage, callbacks);
        this.playAttackVoice();
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#f59e0b', 7);
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Draw static grey square Turrets on the map (scaled 1.3x)
    for (const turret of this.turrets) {
      ctx.save();
      ctx.translate(turret.x, turret.y);
      ctx.scale(1.3, 1.3);

      // Subtle placement base shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.fillRect(-13, -13, 26, 26);

      // Static small grey square body
      const sqSize = 22;
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.2;
      ctx.fillRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
      ctx.strokeRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);

      // Inner metallic plate & corner rivets
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-sqSize / 2 + 3, -sqSize / 2 + 3, sqSize - 6, sqSize - 6);

      ctx.fillStyle = '#e2e8f0';
      const rOff = sqSize / 2 - 3;
      ctx.fillRect(-rOff - 1, -rOff - 1, 2, 2);
      ctx.fillRect(rOff - 1, -rOff - 1, 2, 2);
      ctx.fillRect(-rOff - 1, rOff - 1, 2, 2);
      ctx.fillRect(rOff - 1, rOff - 1, 2, 2);

      // Rotating turret gun barrel pointing at opponent
      ctx.save();
      ctx.rotate(turret.aimAngle);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      const barrelOffset = -turret.recoil;
      ctx.fillRect(barrelOffset, -3.5, 16, 7);
      ctx.strokeRect(barrelOffset, -3.5, 16, 7);

      // Amber muzzle tip
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barrelOffset + 12, -2.5, 4, 5);
      ctx.restore();

      // Center turret pivot cap
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#f59e0b', 7);

      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Draw EngineerBall core with rotating gear teeth rim
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.gearAngle);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    super.draw(ctx);
  }

  // Tech/Mecha Characters: Push square, yellow electrical spark particles that flash rapidly
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#f59e0b'));
    }
  }
}

/* ==========================================================================
   5 ANIME-INSPIRED SUBCLASSES:
   1. RubberPirateBall (👒) - Inspired by Luffy
   2. NinjaShadowBall (🍥)  - Inspired by Naruto
   3. SuperSaiyanBall (💥)  - Inspired by Goku
   4. SoulReaperBall (💀)   - Inspired by Ichigo
   5. ThreeSwordBall (⚔️)   - Inspired by Zoro
   ========================================================================== */

export class Luffy extends Ball {
  punchCooldown: number;
  punchState: 'idle' | 'extending' | 'slingshot' | 'retracting';
  punchAngle: number;
  punchLength: number;
  maxPunchLength: number;
  fistX: number;
  fistY: number;
  rapidTicksRemaining: number;
  rapidTickTimer: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Straw-hat gold & crimson pirate theme with 👒 icon in center
    super(x, y, radius, mass, '#f59e0b', '#ef4444', name, startingHealth, 'rubberpirate', '👒');
    this.punchCooldown = 4.0;
    this.punchState = 'idle';
    this.punchAngle = 0;
    this.punchLength = 0;
    this.maxPunchLength = 480;
    this.fistX = x;
    this.fistY = y;
    this.rapidTicksRemaining = 0;
    this.rapidTickTimer = 0;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playLiquidCollisionSplash(1.12, 'mochi');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.punchCooldown = 4.0;
    this.punchState = 'idle';
    this.punchAngle = 0;
    this.punchLength = 0;
    this.fistX = x;
    this.fistY = y;
    this.rapidTicksRemaining = 0;
    this.rapidTickTimer = 0;
  }

  // Every 4s shoots a stretching fist (a canvas line with a circle at the end) directly at the enemy.
  // If it hits, it deals multiple rapid ticks of damage and slingshots the RubberPirateBall to the enemy's location!
  override updateSpecial(dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    if (this.punchState === 'idle') {
      this.punchCooldown -= dt;
      if (this.punchCooldown <= 0) {
        this.punchCooldown = 4.0;
        this.punchState = 'extending';
        this.punchLength = this.radius + 10;
        const targetPos = opponent.getTargetPosition(this.x, this.y);
        this.punchAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
        this.fistX = this.x + Math.cos(this.punchAngle) * this.punchLength;
        this.fistY = this.y + Math.sin(this.punchAngle) * this.punchLength;
        this.playAbilityVoice();
        callbacks.playSound('dash');
      }
    } else if (this.punchState === 'extending') {
      const targetPos = opponent.getTargetPosition(this.x, this.y);
      const targetAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
      let diff = targetAngle - this.punchAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.punchAngle += diff * 0.25;

      const extendSpeed = 1150;
      this.punchLength += extendSpeed * dt;
      this.fistX = this.x + Math.cos(this.punchAngle) * this.punchLength;
      this.fistY = this.y + Math.sin(this.punchAngle) * this.punchLength;

      // Check if stretching fist hits a NinjaShadowBall clone (dies in 1 hit)
      if (opponent.hitShadowCloneAt(this.fistX, this.fistY, 21, callbacks)) {
        this.punchState = 'retracting';
        return;
      }

      // Check if stretching fist connects with the enemy ball
      const distToEnemy = Math.hypot(this.fistX - opponent.x, this.fistY - opponent.y);
      if (distToEnemy <= opponent.radius + 24) {
        // Transition to 'slingshot': deals multiple rapid ticks of damage (4 rapid ticks) while slingshotting to enemy
        this.punchState = 'slingshot';
        this.rapidTicksRemaining = 4;
        this.rapidTickTimer = 0;
        this.playAbilityVoice();
        callbacks.playSound('explosion');
        callbacks.spawnShockwave?.(opponent.x, opponent.y, '#ef4444', 143);
      } else if (
        this.punchLength >= this.maxPunchLength ||
        this.fistX < 355 ||
        this.fistX > 925 ||
        this.fistY < 75 ||
        this.fistY > 645
      ) {
        this.punchState = 'retracting';
      }
    } else if (this.punchState === 'slingshot') {
      // Keep the circle fist anchored on the enemy while RubberPirateBall slingshots to the enemy's location
      this.fistX = opponent.x;
      this.fistY = opponent.y;
      const dx = opponent.x - this.x;
      const dy = opponent.y - this.y;
      const dist = Math.hypot(dx, dy);
      const pullAngle = Math.atan2(dy, dx);
      this.punchAngle = pullAngle;
      this.punchLength = dist;

      // Deal multiple rapid ticks of damage during the stretch punch & slingshot!
      this.rapidTickTimer -= dt;
      if (this.rapidTickTimer <= 0 && this.rapidTicksRemaining > 0) {
        this.rapidTickTimer = 0.065;
        this.rapidTicksRemaining--;
        const tickDamage = 1.5 + this.roundElapsed * 0.05 + (this.level - 1) * 0.6;
        opponent.takeDamage(tickDamage, this.color, '👊 GATLING!');
        this.recordDamageDealt(tickDamage, callbacks);
        this.playAttackVoice();
        callbacks.spawnSparks(
          opponent.x + (Math.random() - 0.5) * 24,
          opponent.y + (Math.random() - 0.5) * 24,
          '#f59e0b',
          8
        );
      }

      // Slingshot RubberPirateBall rapidly toward the enemy's location
      const slingshotStep = 1350 * dt;
      this.trail.push({ x: this.x, y: this.y, alpha: 0.85 });

      const contactDist = this.radius + opponent.radius + 4;
      if (dist > contactDist + slingshotStep) {
        this.x += Math.cos(pullAngle) * slingshotStep;
        this.y += Math.sin(pullAngle) * slingshotStep;
      } else {
        // Reached enemy location: finish any remaining rapid ticks and impart slingshot momentum
        while (this.rapidTicksRemaining > 0) {
          this.rapidTicksRemaining--;
          const tickDamage = 1.5 + this.roundElapsed * 0.05 + (this.level - 1) * 0.6;
          opponent.takeDamage(tickDamage, this.color, '👊 GATLING!');
          this.recordDamageDealt(tickDamage, callbacks);
        }

        this.x = Math.max(
          360 + this.radius,
          Math.min(920 - this.radius, opponent.x - Math.cos(pullAngle) * contactDist)
        );
        this.y = Math.max(
          80 + this.radius,
          Math.min(640 - this.radius, opponent.y - Math.sin(pullAngle) * contactDist)
        );
        const slingshotSpeed = 14.5;
        this.vx = Math.cos(pullAngle) * slingshotSpeed;
        this.vy = Math.sin(pullAngle) * slingshotSpeed;
        opponent.vx += Math.cos(pullAngle) * 5.5;
        opponent.vy += Math.sin(pullAngle) * 5.5;

        this.punchState = 'idle';
        this.punchLength = 0;
      }
    } else if (this.punchState === 'retracting') {
      const retractSpeed = 1400;
      this.punchLength -= retractSpeed * dt;
      this.fistX = this.x + Math.cos(this.punchAngle) * Math.max(0, this.punchLength);
      this.fistY = this.y + Math.sin(this.punchAngle) * Math.max(0, this.punchLength);
      if (this.punchLength <= this.radius) {
        this.punchState = 'idle';
        this.punchLength = 0;
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // Draw stretching fist (a canvas line with a circle at the end) when active
    if (this.punchState !== 'idle' && this.punchLength > this.radius * 0.6) {
      ctx.save();

      // 1. Canvas line (stretched rubber arm with dark Haki border and golden elastic core)
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.fistX, this.fistY);
      ctx.stroke();

      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.fistX, this.fistY);
      ctx.stroke();

      // 2. Circle at the end of the canvas line (stretching fist)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.beginPath();
      ctx.arc(this.fistX, this.fistY, 27, 0, Math.PI * 2);
      ctx.fill();

      const fistGrad = ctx.createRadialGradient(
        this.fistX - 5,
        this.fistY - 5,
        2,
        this.fistX,
        this.fistY,
        20
      );
      fistGrad.addColorStop(0, '#fca5a5');
      fistGrad.addColorStop(0.45, '#ef4444');
      fistGrad.addColorStop(1, '#7f1d1d');

      ctx.fillStyle = fistGrad;
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(this.fistX, this.fistY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    super.draw(ctx);

    // Signature Straw Hat crimson ribbon ring
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 2: NinjaShadowBall (🍥) - Inspired by Naruto
   - Upon spawning, creates 2 'Shadow Clones' (slightly transparent copies).
   - Clones mirror the main ball's movement and occasionally throw weak projectiles (kunai).
   - Clones die in one hit, but confuse the targeting of enemy projectiles.
   ========================================================================== */
export interface ShadowClone {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  kunaiTimer: number;
  mirrorMode: 'horizontal' | 'vertical';
}

export class Naruto extends Ball {
  clones: ShadowClone[];
  kunaiProjectiles: {
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    vx: number;
    vy: number;
    angle: number;
    speed: number;
    damage: number;
    life: number;
    trail?: { x: number; y: number }[];
  }[];
  smokePuffs: { x: number; y: number; radius: number; alpha: number }[];
  confusionIndex: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Shinobi orange & chakra cyan with 🍥 emoji in center
    super(x, y, radius, mass, '#f97316', '#0284c7', name, startingHealth, 'ninjashadow', '🍥');
    this.clones = [];
    this.kunaiProjectiles = [];
    this.smokePuffs = [];
    this.confusionIndex = 0;
    this.spawnShadowClones();
  }

  spawnShadowClones() {
    const clampX = (val: number) => Math.max(350 + this.radius, Math.min(930 - this.radius, val));
    const clampY = (val: number) => Math.max(70 + this.radius, Math.min(650 - this.radius, val));

    this.clones = [
      {
        id: 1,
        x: clampX(this.x + (this.x < 640 ? 95 : -95)),
        y: clampY(this.y - 110),
        vx: 0,
        vy: 0,
        alive: true,
        kunaiTimer: 0.8,
        mirrorMode: 'horizontal',
      },
      {
        id: 2,
        x: clampX(this.x + (this.x < 640 ? 95 : -95)),
        y: clampY(this.y + 110),
        vx: 0,
        vy: 0,
        alive: true,
        kunaiTimer: 1.4,
        mirrorMode: 'vertical',
      },
    ];

    for (const c of this.clones) {
      this.smokePuffs.push({ x: c.x, y: c.y, radius: this.radius * 1.15, alpha: 0.9 });
    }
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.kunaiProjectiles = [];
    this.smokePuffs = [];
    this.spawnShadowClones();
  }

  // Confuses enemy projectile targeting by directing enemy aim toward alive Shadow Clones!
  override getTargetPosition(fromX?: number, fromY?: number): { x: number; y: number } {
    const aliveClones = this.clones.filter((c) => c.alive);
    if (aliveClones.length === 0) {
      return { x: this.x, y: this.y };
    }
    if (fromX !== undefined && fromY !== undefined) {
      // Pick the closest alive Shadow Clone to intercept/confuse incoming enemy targeting
      let closest = aliveClones[0];
      let minDist = Math.hypot(closest.x - fromX, closest.y - fromY);
      for (const c of aliveClones) {
        const d = Math.hypot(c.x - fromX, c.y - fromY);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }
      return { x: closest.x, y: closest.y };
    }
    this.confusionIndex = (this.confusionIndex + 1) % aliveClones.length;
    const chosen = aliveClones[this.confusionIndex];
    return { x: chosen.x, y: chosen.y };
  }

  // Clones die in one hit from any enemy projectile, weapon, or collision!
  override hitShadowCloneAt(
    px: number,
    py: number,
    hitRadius: number,
    callbacks?: {
      playSound?: (type: any) => void;
      spawnSparks?: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ): boolean {
    for (const clone of this.clones) {
      if (!clone.alive) continue;
      const dist = Math.hypot(px - clone.x, py - clone.y);
      if (dist <= this.radius * 0.88 + hitRadius) {
        clone.alive = false;
        this.smokePuffs.push({ x: clone.x, y: clone.y, radius: this.radius * 1.35, alpha: 1.0 });
        this.floatingTexts.push({
          text: '💨 CLONE POOF!',
          x: clone.x,
          y: clone.y - this.radius,
          alpha: 1.0,
          vy: -1.4,
          color: '#e2e8f0',
        });
        callbacks?.playSound?.('wall');
        callbacks?.spawnSparks?.(clone.x, clone.y, '#ffffff', 14);
        return true;
      }
    }
    return false;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);

    const innerLeft = 350;
    const innerRight = 930;
    const innerTop = 70;
    const innerBottom = 650;
    const cloneR = this.radius * 0.88;

    // Update Shadow Clones mirroring the main ball's movement
    for (const clone of this.clones) {
      if (!clone.alive) continue;

      if (clone.mirrorMode === 'horizontal') {
        clone.vx = this.vx;
        clone.vy = -this.vy;
      } else {
        clone.vx = -this.vx;
        clone.vy = this.vy;
      }

      clone.x += clone.vx;
      clone.y += clone.vy;

      if (clone.x - cloneR < innerLeft) clone.x = innerLeft + cloneR;
      if (clone.x + cloneR > innerRight) clone.x = innerRight - cloneR;
      if (clone.y - cloneR < innerTop) clone.y = innerTop + cloneR;
      if (clone.y + cloneR > innerBottom) clone.y = innerBottom - cloneR;
    }

    // Update flying kunai projectiles
    for (let i = this.kunaiProjectiles.length - 1; i >= 0; i--) {
      const k = this.kunaiProjectiles[i];
      k.prevX = k.x;
      k.prevY = k.y;
      k.x += k.vx * dt * 60;
      k.y += k.vy * dt * 60;
      k.life -= dt;
      pushProjectileTrail(k);
      if (k.life <= 0 || k.x < 340 || k.x > 940 || k.y < 60 || k.y > 660) {
        this.kunaiProjectiles.splice(i, 1);
      }
    }

    // Update ninja smoke puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const sp = this.smokePuffs[i];
      sp.radius += dt * 35;
      sp.alpha -= dt * 1.8;
      if (sp.alpha <= 0) {
        this.smokePuffs.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // 1. Check if opponent ball physically collides with any Shadow Clone (clone dies in one hit!)
    for (const clone of this.clones) {
      if (!clone.alive) continue;
      const distToOpp = Math.hypot(opponent.x - clone.x, opponent.y - clone.y);
      if (distToOpp <= opponent.radius + this.radius * 0.88) {
        this.hitShadowCloneAt(opponent.x, opponent.y, opponent.radius, callbacks);
        continue;
      }

      // 2. Alive clones occasionally throw weak projectiles (kunai) at the opponent
      clone.kunaiTimer -= dt;
      if (clone.kunaiTimer <= 0) {
        clone.kunaiTimer = 2.4;
        const targetPos = opponent.getTargetPosition(clone.x, clone.y);
        const angle = Math.atan2(targetPos.y - clone.y, targetPos.x - clone.x);
        const speed = 11.2;
        const spawn = clampProjectileSpawn(
          clone.x + Math.cos(angle) * (this.radius * 0.9),
          clone.y + Math.sin(angle) * (this.radius * 0.9)
        );
        this.kunaiProjectiles.push({
          x: spawn.x,
          y: spawn.y,
          prevX: clone.x,
          prevY: clone.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle,
          speed,
          damage: 1.5 + (this.level - 1) * 0.5,
          life: 2.5,
          trail: [{ x: clone.x, y: clone.y }],
        });
        this.playAbilityVoice();
        callbacks.spawnSparks(clone.x, clone.y, '#94a3b8', 5);
      }
    }

    // 3. Check kunai hits on opponent (or opponent's clones)
    for (let i = this.kunaiProjectiles.length - 1; i >= 0; i--) {
      const k = this.kunaiProjectiles[i];
      if (opponent.hitShadowCloneAt(k.x, k.y, 10, callbacks)) {
        this.kunaiProjectiles.splice(i, 1);
        continue;
      }

      const prevX = typeof k.prevX === 'number' ? k.prevX : k.x - k.vx;
      const prevY = typeof k.prevY === 'number' ? k.prevY : k.y - k.vy;
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, k.x, k.y);
      if (dist <= opponent.radius + Math.max(35, k.speed || 30)) {
        opponent.takeDamage(k.damage, this.color, 'KUNAI');
        this.recordDamageDealt(k.damage, callbacks);
        this.playAttackVoice();
        callbacks.spawnSparks(k.x, k.y, '#cbd5e1', 8);
        this.kunaiProjectiles.splice(i, 1);
      }
    }
  }

  private drawKunai(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 10;

    // POMMEL RING
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-11, 0, 2.4, 0, Math.PI * 2);
    ctx.stroke();

    // WRAPPED HANDLE
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-8.5, 0);
    ctx.lineTo(-2, 0);
    ctx.stroke();

    // DIAMOND KUNAI BLADE (~25px total length x 9px height)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(12.5, 0);
    ctx.lineTo(-1, -4.5);
    ctx.lineTo(-3.5, 0);
    ctx.lineTo(-1, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    // Draw flying kunai projectiles normalized without excessive scaling
    if (this.kunaiProjectiles.length === 0) return;
    ctx.save();
    for (const k of this.kunaiProjectiles) {
      drawArcadeCometTrail(ctx, (k as any).trail, '#fb923c', 7);

      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.rotate(k.angle);
      this.drawKunai(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw ninja smoke puffs
    ctx.save();
    for (const sp of this.smokePuffs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha * 0.7);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 2. Draw 2 Shadow Clones (slightly transparent copies with 🍥 emoji)
    const cloneR = this.radius * 0.88;
    for (const clone of this.clones) {
      if (!clone.alive) continue;
      ctx.save();
      ctx.globalAlpha = 0.52;

      const cGrad = ctx.createRadialGradient(
        clone.x - cloneR * 0.3,
        clone.y - cloneR * 0.3,
        cloneR * 0.1,
        clone.x,
        clone.y,
        cloneR
      );
      cGrad.addColorStop(0, '#ffffff');
      cGrad.addColorStop(0.25, '#fb923c');
      cGrad.addColorStop(1, '#0284c7');

      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(clone.x, clone.y, cloneR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 🍥 emoji & '1 HP' indicator on the Shadow Clone
      ctx.font = `${Math.round(cloneR * 0.58)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍥', clone.x, clone.y - cloneR * 0.2);

      ctx.font = '900 12px system-ui, sans-serif';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText('CLONE', clone.x, clone.y + cloneR * 0.34);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('CLONE', clone.x, clone.y + cloneR * 0.34);

      ctx.restore();
    }

    // 3. Draw main NinjaShadowBall
    super.draw(ctx);

    // 4. Draw physical Kunai weapon after super.draw(ctx) and before drawCenterIcon(ctx)
    const angle = Math.atan2(this.vy, this.vx) || 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.translate(this.radius + 10, 0);
    ctx.scale(1.3, 1.3);
    this.drawKunai(ctx);
    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  // Ninja/Speed Characters (Naruto, Sonic): Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 32; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
  }
}

/* ==========================================================================
   ANIME SUBCLASS 3: SuperSaiyanBall (💥) - Inspired by Goku
   - Has a 'charge ring' UI around the ball that takes 10 seconds to charge.
   - Once full, fires a massive, thick blue laser beam (Kamehameha) straight
     across the entire arena that deals devastating damage to anything caught in the beam.
   ========================================================================== */
export class Goku extends Ball {
  chargeTimer: number;
  chargeDuration: number;
  beamActiveTimer: number;
  beamMaxDuration: number;
  beamAngle: number;
  beamDamageTickTimer: number;
  auraPulse: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Blazing Super Saiyan gold & Kamehameha cyan with 💥 emoji in center
    super(x, y, radius, mass, '#facc15', '#0284c7', name, startingHealth, 'supersaiyan', '💥');
    this.chargeTimer = 0;
    this.chargeDuration = 10.0; // Takes 10 seconds to charge
    this.beamActiveTimer = 0;
    this.beamMaxDuration = 1.25;
    this.beamAngle = x < 640 ? 0 : Math.PI;
    this.beamDamageTickTimer = 0;
    this.auraPulse = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.chargeTimer = 0;
    this.beamActiveTimer = 0;
    this.beamAngle = x < 640 ? 0 : Math.PI;
    this.beamDamageTickTimer = 0;
    this.auraPulse = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.auraPulse += dt * 10;
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    if (this.beamActiveTimer > 0) {
      this.beamActiveTimer -= dt;
      this.beamDamageTickTimer -= dt;

      // Track target slightly while unleashing the massive Kamehameha across the arena
      const targetPos = opponent.getTargetPosition(this.x, this.y);
      const desiredAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
      let angleDiff = desiredAngle - this.beamAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.beamAngle += angleDiff * dt * 2.2;

      const beamLength = 960;
      const beamHalfWidth = 39;
      const x1 = this.x;
      const y1 = this.y;
      const x2 = this.x + Math.cos(this.beamAngle) * beamLength;
      const y2 = this.y + Math.sin(this.beamAngle) * beamLength;

      // Destroy any Shadow Clones caught in the beam
      for (let step = 60; step <= beamLength; step += 45) {
        const bx = this.x + Math.cos(this.beamAngle) * step;
        const by = this.y + Math.sin(this.beamAngle) * step;
        opponent.hitShadowCloneAt(bx, by, beamHalfWidth, callbacks);
      }

      // Destroy any Engineer turrets or Minefield mines caught in the beam
      if (opponent instanceof Engineer) {
        opponent.turrets = opponent.turrets.filter((t) => {
          const d = this.pointToSegmentDist(t.x, t.y, x1, y1, x2, y2);
          if (d <= beamHalfWidth + 18) {
            callbacks.spawnSparks(t.x, t.y, '#38bdf8', 10);
            return false;
          }
          return true;
        });
      }
      if (opponent instanceof Minefield) {
        opponent.mines = opponent.mines.filter((m) => {
          const d = this.pointToSegmentDist(m.x, m.y, x1, y1, x2, y2);
          if (d <= beamHalfWidth + 18) {
            callbacks.spawnSparks(m.x, m.y, '#38bdf8', 10);
            return false;
          }
          return true;
        });
      }

      // Check if opponent ball is caught in the massive blue laser beam
      const distToBeam = this.pointToSegmentDist(opponent.x, opponent.y, x1, y1, x2, y2);
      if (distToBeam <= opponent.radius + beamHalfWidth && this.beamDamageTickTimer <= 0) {
        this.beamDamageTickTimer = 0.14;
        // Deals devastating multi-tick damage across the beam duration (~8 ticks)
        const devastatingTick = 5.5 + (this.level - 1) * 1.5;
        opponent.takeDamage(devastatingTick, '#38bdf8', '💥 KAMEHAMEHA!');
        this.recordDamageDealt(devastatingTick, callbacks);
        opponent.vx += Math.cos(this.beamAngle) * 3.2;
        opponent.vy += Math.sin(this.beamAngle) * 3.2;
        this.playAttackVoice();
        callbacks.spawnSparks(opponent.x, opponent.y, '#38bdf8', 14);
        callbacks.spawnSparks(opponent.x, opponent.y, '#ffffff', 8);
      }

      if (this.beamActiveTimer <= 0) {
        this.chargeTimer = 0;
      }
    } else {
      // Charge up over 10 seconds
      this.chargeTimer = Math.min(this.chargeDuration, this.chargeTimer + dt);
      const targetPos = opponent.getTargetPosition(this.x, this.y);
      this.beamAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);

      if (this.chargeTimer >= this.chargeDuration) {
        this.beamActiveTimer = this.beamMaxDuration;
        this.beamDamageTickTimer = 0;
        this.playAbilityVoice();
        callbacks.playSound('explosion');
        callbacks.playSound('laser');
        callbacks.spawnShockwave?.(this.x, this.y, '#38bdf8', 215);
        callbacks.spawnSparks(this.x, this.y, '#facc15', 24);
      }
    }
  }

  private pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    const chargePct = Math.min(1, this.chargeTimer / this.chargeDuration);

    // 1. If firing Kamehameha: draw massive, thick blue laser beam straight across the entire arena!
    if (this.beamActiveTimer > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.beamAngle);

      const beamLength = 960;
      const pulse = Math.sin(this.auraPulse * 2.5) * 5;

      // Outer electric blue plasma aura beam
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.55)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 81 + pulse;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.5, 0);
      ctx.lineTo(beamLength, 0);
      ctx.stroke();

      // Thick bright cyan Kamehameha beam body
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 55 + pulse * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.5, 0);
      ctx.lineTo(beamLength, 0);
      ctx.stroke();

      // Blinding white-hot inner core beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.5, 0);
      ctx.lineTo(beamLength, 0);
      ctx.stroke();

      // Origin energy sphere at ball front
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.radius * 0.65, 0, 34 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Draw 'Charge Ring' UI around the SuperSaiyanBall (fills over 10 seconds)
    ctx.save();
    const ringRadius = this.radius + 9;

    // Background track of the Charge Ring UI
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Active charging progress arc (0 to 10s)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * chargePct;
    ctx.strokeStyle = this.beamActiveTimer > 0 ? '#ffffff' : chargePct > 0.8 ? '#38bdf8' : '#facc15';
    ctx.shadowColor = chargePct > 0.8 ? '#38bdf8' : '#facc15';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(this.x, this.y, ringRadius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();

    // 3. Draw base ball and centered 💥 emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 4: SoulReaperBall (💀) - Inspired by Ichigo
   - Every 5 seconds, fires a wide, crescent-shaped energy wave (Getsuga Tensho)
     that travels forward and penetrates through obstacles and clones.
   ========================================================================== */
export class Ichigo extends Ball {
  waveCooldown: number;
  waveTimer: number;
  aimAngle: number;
  crescentWaves: {
    id: number;
    x: number;
    y: number;
    prevX?: number;
    prevY?: number;
    vx: number;
    vy: number;
    angle: number;
    speed: number;
    radius: number;
    damage: number;
    life: number;
    hitTargets: Set<string>;
    trail?: { x: number; y: number }[];
  }[];
  nextWaveId: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Soul Reaper black-crimson reiatsu theme with 💀 emoji in center
    super(x, y, radius, mass, '#1e293b', '#ef4444', name, startingHealth, 'soulreaper', '💀');
    this.waveCooldown = 5.0; // Every 5 seconds
    this.waveTimer = 1.0;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.crescentWaves = [];
    this.nextWaveId = 1;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.waveTimer = 1.0;
    this.aimAngle = x < 640 ? 0 : Math.PI;
    this.crescentWaves = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);

    for (let i = this.crescentWaves.length - 1; i >= 0; i--) {
      const w = this.crescentWaves[i];
      w.prevX = w.x;
      w.prevY = w.y;
      w.x += w.vx * dt * 60;
      w.y += w.vy * dt * 60;
      w.life -= dt;
      pushProjectileTrail(w);
      // Penetrates through obstacles and clones across the entire arena!
      if (w.life <= 0 || w.x < 310 || w.x > 970 || w.y < 30 || w.y > 690) {
        this.crescentWaves.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const targetPos = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);

    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = this.waveCooldown; // Every 5 seconds
      const speed = 11.5;
      const waveDamage = 6.5 + this.roundElapsed * 0.16 + (this.level - 1) * 2.5;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(this.aimAngle) * (this.radius + 18),
        this.y + Math.sin(this.aimAngle) * (this.radius + 18)
      );
      this.crescentWaves.push({
        id: this.nextWaveId++,
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(this.aimAngle) * speed,
        vy: Math.sin(this.aimAngle) * speed,
        angle: this.aimAngle,
        speed,
        radius: Math.round((56 + (this.level - 1) * 8) * 1.3), // Wide crescent-shaped energy wave (+30%)
        damage: waveDamage,
        life: 3.5,
        hitTargets: new Set(),
        trail: [{ x: this.x, y: this.y }],
      });

      this.playAbilityVoice();
      callbacks.playSound('slice');
      callbacks.spawnSparks(this.x, this.y, '#ef4444', 18);
      callbacks.spawnShockwave?.(this.x, this.y, '#ef4444', 95);
    }

    // Update penetrating Getsuga Tensho waves:
    // Penetrates through obstacles (turrets, mines) and Shadow Clones without stopping!
    for (const w of this.crescentWaves) {
      // 1. Slice and destroy any Shadow Clones in the wide crescent path (wave continues!)
      opponent.hitShadowCloneAt(w.x, w.y, w.radius, callbacks);

      // 2. Penetrate and cleave through Engineer turrets & Minefield mines
      if (opponent instanceof Engineer) {
        opponent.turrets = opponent.turrets.filter((t) => {
          if (Math.hypot(t.x - w.x, t.y - w.y) <= w.radius + 12) {
            callbacks.spawnSparks(t.x, t.y, '#ef4444', 10);
            return false;
          }
          return true;
        });
      }
      if (opponent instanceof Minefield) {
        opponent.mines = opponent.mines.filter((m) => {
          if (Math.hypot(m.x - w.x, m.y - w.y) <= w.radius + 12) {
            callbacks.spawnSparks(m.x, m.y, '#ef4444', 10);
            return false;
          }
          return true;
        });
      }

      // 3. Check collision with opponent ball (wave penetrates right through!)
      if (!w.hitTargets.has('opponent')) {
        const prevX = typeof w.prevX === 'number' ? w.prevX : w.x - w.vx;
        const prevY = typeof w.prevY === 'number' ? w.prevY : w.y - w.vy;
        const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, w.x, w.y);
        if (dist <= opponent.radius + Math.max(w.radius * 0.85, Math.max(35, w.speed || 30))) {
          w.hitTargets.add('opponent');
          opponent.takeDamage(w.damage, '#ef4444', '💀 GETSUGA TENSHO!');
          this.recordDamageDealt(w.damage, callbacks);
          opponent.vx += Math.cos(w.angle) * 4.8;
          opponent.vy += Math.sin(w.angle) * 4.8;
          this.playAttackVoice();
          callbacks.playSound('crit');
          callbacks.spawnSparks(opponent.x, opponent.y, '#ef4444', 18);
          callbacks.spawnSparks(opponent.x, opponent.y, '#0f172a', 12);
        }
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.crescentWaves.length === 0) return;
    ctx.save();
    for (const w of this.crescentWaves) {
      drawArcadeCometTrail(ctx, (w as any).trail, '#ef4444', 12);

      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(w.angle);
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;

      // Normalized crescent energy arc (~24px radius, visibly smaller than characters)
      const r = Math.min(26, Math.max(18, w.radius * 0.32));

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.46, Math.PI * 0.46, false);
      ctx.quadraticCurveTo(r * 0.22, 0, Math.cos(-Math.PI * 0.46) * r, Math.sin(-Math.PI * 0.46) * r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner abyssal black spiritual core crescent
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(1.5, 0, r * 0.82, -Math.PI * 0.41, Math.PI * 0.41, false);
      ctx.quadraticCurveTo(r * 0.34, 0, 1.5 + Math.cos(-Math.PI * 0.41) * (r * 0.82), Math.sin(-Math.PI * 0.41) * (r * 0.82));
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw SoulReaperBall core
    super.draw(ctx);

    // 2. Draw physical Zangetsu oversized cleaver sword after super.draw(ctx) and before drawCenterIcon(ctx)
    const bladeAngle = Math.atan2(this.vy, this.vx) || 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(bladeAngle + 0.35);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(this.radius - 8, -3.5, 16, 7);
    ctx.strokeRect(this.radius - 8, -3.5, 16, 7);
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(this.radius + 7, -6);
    ctx.lineTo(this.radius + 48, -9);
    ctx.lineTo(this.radius + 58, 4);
    ctx.lineTo(this.radius + 7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Draw centered 💀 emoji + HP on top of sword
    this.drawCenterIcon(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 5: ThreeSwordBall (⚔️) - Inspired by Zoro
   - Permanent 180-degree damage cone facing its direction of movement.
   - Any enemy or projectile that enters this frontal arc takes continuous
     slashing damage and gets deflected away.
   ========================================================================== */
export class Zoro extends Ball {
  facingAngle: number;
  slashTickCooldown: number;
  slashFlashTimer: number;
  coneRadius: number;
  coneHalfArc: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Anime Swordmaster emerald core with ⚔️ crossed swords icon
    super(x, y, radius, mass, '#10b981', '#047857', name, startingHealth, 'threesword', '⚔️');
    this.facingAngle = x < 640 ? 0 : Math.PI;
    this.slashTickCooldown = 0;
    this.slashFlashTimer = 0;
    this.coneRadius = this.radius + 101;
    // Permanent 180-degree damage cone facing direction of movement (-90° to +90°)
    this.coneHalfArc = Math.PI / 2;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.facingAngle = x < 640 ? 0 : Math.PI;
    this.slashTickCooldown = 0;
    this.slashFlashTimer = 0;
    this.coneRadius = this.radius + 101;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > 0.15) {
      this.facingAngle = Math.atan2(this.vy, this.vx);
    }
    if (this.slashTickCooldown > 0) {
      this.slashTickCooldown = Math.max(0, this.slashTickCooldown - dt);
    }
    if (this.slashFlashTimer > 0) {
      this.slashFlashTimer = Math.max(0, this.slashFlashTimer - dt);
    }
    this.coneRadius = this.radius + 101 + (this.level - 1) * 18;
  }

  private isInsideFrontal180Arc(px: number, py: number, targetRadius: number = 0): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.coneRadius + targetRadius) return false;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - this.facingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const angularPadding = dist > 0 ? Math.asin(Math.min(1, targetRadius / dist)) : 0;
    return Math.abs(angleDiff) <= this.coneHalfArc + angularPadding;
  }

  // Permanent 180-degree damage cone facing direction of movement:
  // Any enemy or projectile that enters this frontal arc takes continuous slashing damage and gets deflected away!
  override updateSpecial(_dt: number, opponent: Ball, callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void }) {
    if (opponent.health <= 0 || this.health <= 0) return;

    // 1. Deflect away any enemy projectiles entering the permanent 180-degree frontal arc
    const deflectProjectileList = (list: { x: number; y: number; vx: number; vy: number; angle?: number }[]) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        if (this.isInsideFrontal180Arc(p.x, p.y, 8)) {
          // Deflect projectile away from ThreeSwordBall
          const outAngle = Math.atan2(p.y - this.y, p.x - this.x);
          const speed = Math.hypot(p.vx, p.vy) || 12;
          p.vx = Math.cos(outAngle) * speed;
          p.vy = Math.sin(outAngle) * speed;
          if (p.angle !== undefined) p.angle = outAngle;
          p.x = this.x + Math.cos(outAngle) * (this.coneRadius + 10);
          p.y = this.y + Math.sin(outAngle) * (this.coneRadius + 10);
          this.slashFlashTimer = 0.18;
          this.playAbilityVoice();
          callbacks.spawnSparks(p.x, p.y, '#ffffff', 10);
          callbacks.spawnSparks(p.x, p.y, '#10b981', 6);
        }
      }
    };

    if (opponent instanceof Sniper) deflectProjectileList(opponent.bullets);
    if (opponent instanceof Archer) deflectProjectileList(opponent.arrows);
    if (opponent instanceof Engineer) deflectProjectileList(opponent.projectiles);
    if (opponent instanceof DroneSwarm) deflectProjectileList(opponent.plasmaBolts);
    if (opponent instanceof Naruto) {
      deflectProjectileList(opponent.kunaiProjectiles);
      // Also slice any Shadow Clones that enter the 180-degree frontal cone
      for (const clone of opponent.clones) {
        if (clone.alive && this.isInsideFrontal180Arc(clone.x, clone.y, opponent.radius * 0.88)) {
          opponent.hitShadowCloneAt(clone.x, clone.y, 10, callbacks);
          this.slashFlashTimer = 0.2;
        }
      }
    }
    if (opponent instanceof Luffy && opponent.punchState === 'extending') {
      if (this.isInsideFrontal180Arc(opponent.fistX, opponent.fistY, 15)) {
        opponent.punchState = 'retracting';
        this.slashFlashTimer = 0.22;
        this.playAbilityVoice();
        callbacks.spawnSparks(opponent.fistX, opponent.fistY, '#ffffff', 12);
      }
    }

    // 2. Check if enemy ball enters the permanent 180-degree frontal arc:
    // Deals continuous slashing damage without pushing the enemy back!
    if (this.isInsideFrontal180Arc(opponent.x, opponent.y, opponent.radius)) {
      if (this.slashTickCooldown <= 0) {
        this.slashTickCooldown = 0.28;
        this.slashFlashTimer = 0.22;

        const slashDamage = 2.2 + this.roundElapsed * 0.08 + (this.level - 1) * 1.0;
        opponent.takeDamage(slashDamage, this.color, '⚔️ SANTORYU SLASH!');
        this.recordDamageDealt(slashDamage, callbacks);
        this.playAbilityVoice();
        this.playAttackVoice();
        callbacks.playSound('slice');

        callbacks.spawnSparks(opponent.x, opponent.y, '#ffffff', 14);
        callbacks.spawnSparks(opponent.x, opponent.y, '#10b981', 10);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw core ball first
    super.draw(ctx);

    // 2. Draw permanent 180-degree damage cone & 3 physical melee blades after super.draw(ctx) and before drawCenterIcon(ctx)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle);

    const isFlashing = this.slashFlashTimer > 0;
    const flashRatio = isFlashing ? this.slashFlashTimer / 0.22 : 0;

    // 180-degree frontal hemisphere sector (-Math.PI/2 to +Math.PI/2)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.coneRadius, -this.coneHalfArc, this.coneHalfArc);
    ctx.closePath();

    if (isFlashing) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + flashRatio * 0.3})`;
    } else {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    }
    ctx.fill();

    // 180-degree cone boundary & 3-Sword crescent slash lines
    ctx.strokeStyle = isFlashing ? '#ffffff' : 'rgba(5, 150, 105, 0.78)';
    ctx.lineWidth = isFlashing ? 4 : 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.coneRadius, -this.coneHalfArc, this.coneHalfArc);
    ctx.closePath();
    ctx.stroke();

    // 3 signature sword slash arcs inside the 180-degree frontal cone
    const slashRadii = [this.coneRadius * 0.55, this.coneRadius * 0.76, this.coneRadius * 0.94];
    for (const sr of slashRadii) {
      ctx.strokeStyle = isFlashing ? '#ffffff' : 'rgba(16, 185, 129, 0.42)';
      ctx.lineWidth = isFlashing ? 3.2 : 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, sr, -this.coneHalfArc * 0.92, this.coneHalfArc * 0.92);
      ctx.stroke();
    }

    // Draw 3 detailed protruding melee blades (brown handle, silver crossguard, sharp metallic blade) scaled 1.3x
    const bladeAngles = [-this.coneHalfArc * 0.65, 0, this.coneHalfArc * 0.65];
    for (const bAngle of bladeAngles) {
      ctx.save();
      ctx.rotate(bAngle - Math.PI / 2);
      const hStart = this.radius - 5.2;
      const gPos = hStart + 13;
      const bTip = this.radius + 47;

      // Brown handle
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#270e02';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(-3.9, -gPos, 7.8, 13, 2);
      ctx.fill();
      ctx.stroke();

      // Silver crossguard
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.rect(-11, -gPos - 2.9, 22, 4.2);
      ctx.fill();
      ctx.stroke();

      // Sharp metallic blade
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-5.5, -gPos - 2.9);
      ctx.lineTo(-5.9, -bTip + 13);
      ctx.lineTo(0, -bTip);
      ctx.lineTo(5.9, -bTip + 13);
      ctx.lineTo(5.5, -gPos - 2.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 3. Draw centered ⚔️ emoji + HP on top of the swords
    this.drawCenterIcon(ctx);
  }

  // Swordsman Characters: Push sharp directional slash blade sparks
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SlashSparkParticle(this.x, this.y, '#10b981'));
    }
  }
}

/* ==========================================================================
   ANIME SUBCLASS 6: LimitlessBall (♾️) - Inspired by Gojo
   - Visible 'Infinity' aura ring around the ball.
   - Any enemy ball or projectile that enters this ring has its velocity
     reduced by 90%, making it almost impossible to land a high-speed collision!
   ========================================================================== */
export class Gojo extends Ball {
  infinityRadius: number;
  ringPhase: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Six Eyes Azure & Hollow Purple theme with ♾️ emoji in center
    super(x, y, radius, mass, '#38bdf8', '#8b5cf6', name, startingHealth, 'limitless', '♾️');
    this.infinityRadius = this.radius + 107;
    this.ringPhase = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.infinityRadius = this.radius + 107;
    this.ringPhase = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.ringPhase += dt * 2.6;
    this.infinityRadius = this.radius + 107 + (this.level - 1) * 18;
  }

  override updateSpecial(_dt: number, opponent: Ball, _callbacks: { playSound: (type: any) => void; spawnSparks: (x: number, y: number, color: string, count?: number) => void; spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void }) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // 1. Reduce enemy ball velocity by 90% when inside the visible 'Infinity' aura ring!
    const distToEnemy = Math.hypot(opponent.x - this.x, opponent.y - this.y);
    if (distToEnemy <= this.infinityRadius + opponent.radius) {
      if (opponent.infinitySlowTimer <= 0) {
        this.playAbilityVoice();
      }
      opponent.infinitySlowTimer = 0.14;
      const oppSpeed = Math.hypot(opponent.vx, opponent.vy);
      // Immediately damp velocity by 90% (cap to 10% speed) inside Infinity
      const maxAllowedInInfinity = 1.65;
      if (oppSpeed > maxAllowedInInfinity) {
        opponent.vx = (opponent.vx / oppSpeed) * maxAllowedInInfinity;
        opponent.vy = (opponent.vy / oppSpeed) * maxAllowedInInfinity;
      } else {
        opponent.vx *= 0.10;
        opponent.vy *= 0.10;
      }
    }

    // 2. Reduce velocity of any enemy projectiles entering the 'Infinity' aura ring by 90%!
    const slowProjectileList = (list: { x: number; y: number; vx: number; vy: number; speed?: number; infinitySlowed?: boolean }[]) => {
      for (const p of list) {
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (d <= this.infinityRadius + 10) {
          if (!p.infinitySlowed) {
            p.infinitySlowed = true;
            p.vx *= 0.10;
            p.vy *= 0.10;
            if (p.speed !== undefined) p.speed *= 0.10;
            this.playAbilityVoice();
          }
        }
      }
    };

    if (opponent instanceof Sniper) slowProjectileList(opponent.bullets);
    if (opponent instanceof Archer) slowProjectileList(opponent.arrows);
    if (opponent instanceof Engineer) slowProjectileList(opponent.projectiles);
    if (opponent instanceof DroneSwarm) slowProjectileList(opponent.plasmaBolts);
    if (opponent instanceof Ichigo) slowProjectileList(opponent.crescentWaves);
    if (opponent instanceof Naruto) {
      slowProjectileList(opponent.kunaiProjectiles);
      for (const clone of opponent.clones) {
        if (clone.alive && Math.hypot(clone.x - this.x, clone.y - this.y) <= this.infinityRadius + opponent.radius) {
          clone.vx *= 0.10;
          clone.vy *= 0.10;
        }
      }
    }
    if (opponent instanceof Luffy && opponent.punchState === 'extending') {
      if (Math.hypot(opponent.fistX - this.x, opponent.fistY - this.y) <= this.infinityRadius + 14) {
        opponent.punchLength -= 1035 * 0.016; // Reduce extension velocity by 90%
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw visible 'Infinity' aura ring around LimitlessBall
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulseR = this.infinityRadius + Math.sin(this.ringPhase * 2) * 3;
    const infGrad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, pulseR);
    infGrad.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
    infGrad.addColorStop(0.65, 'rgba(139, 92, 246, 0.14)');
    infGrad.addColorStop(1, 'rgba(56, 189, 248, 0.34)');

    ctx.fillStyle = infGrad;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // Outer crystalline Infinity ring
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating spatial convergence dashed ring
    ctx.save();
    ctx.rotate(this.ringPhase);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, pulseR - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.restore();

    // 2. Draw core ball and centered ♾️ emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 7: KingOfCursesBall (🔪) - Inspired by Sukuna
   - Has an invisible 'domain' radius.
   - If the enemy stays within this radius for more than 2 seconds, they are
     instantly hit with a flurry of 5 rapid, unavoidable slash animations
     that deal heavy damage.
   ========================================================================== */
export class Sukuna extends Ball {
  domainRadius: number;
  domainExposureTimer: number;
  flurrySlashesRemaining: number;
  flurrySlashIntervalTimer: number;
  slashVisuals: {
    x: number;
    y: number;
    angle: number;
    length: number;
    alpha: number;
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Malevolent Shrine cursed crimson & black with 🔪 emoji in center
    super(x, y, radius, mass, '#dc2626', '#450a0a', name, startingHealth, 'kingofcurses', '🔪');
    // Invisible domain radius (+30% global scale)
    this.domainRadius = this.radius + 202;
    this.domainExposureTimer = 0;
    this.flurrySlashesRemaining = 0;
    this.flurrySlashIntervalTimer = 0;
    this.slashVisuals = [];
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.domainExposureTimer = 0;
    this.flurrySlashesRemaining = 0;
    this.flurrySlashIntervalTimer = 0;
    this.slashVisuals = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    for (let i = this.slashVisuals.length - 1; i >= 0; i--) {
      const sv = this.slashVisuals[i];
      sv.alpha -= dt * 3.2;
      if (sv.alpha <= 0) {
        this.slashVisuals.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // 1. Check invisible 'domain' radius exposure (> 2.0 seconds triggers 5 rapid unavoidable slashes)
    const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);
    if (dist <= this.domainRadius + opponent.radius) {
      this.domainExposureTimer += dt;
      if (this.domainExposureTimer >= 2.0 && this.flurrySlashesRemaining === 0) {
        this.domainExposureTimer = 0;
        this.flurrySlashesRemaining = 5;
        this.flurrySlashIntervalTimer = 0;
        this.playAbilityVoice();
        callbacks.spawnShockwave?.(opponent.x, opponent.y, '#dc2626', 120);
      }
    } else {
      this.domainExposureTimer = Math.max(0, this.domainExposureTimer - dt * 0.5);
    }

    // 2. Execute flurry of 5 rapid, unavoidable slash animations on the enemy
    if (this.flurrySlashesRemaining > 0) {
      this.flurrySlashIntervalTimer -= dt;
      if (this.flurrySlashIntervalTimer <= 0) {
        this.flurrySlashIntervalTimer = 0.085;
        this.flurrySlashesRemaining--;

        const slashAngles = [-0.65, 0.65, 0, -1.15, 1.15];
        const chosenAngle = slashAngles[this.flurrySlashesRemaining % slashAngles.length] + (Math.random() - 0.5) * 0.2;

        this.slashVisuals.push({
          x: opponent.x + (Math.random() - 0.5) * 16,
          y: opponent.y + (Math.random() - 0.5) * 16,
          angle: chosenAngle,
          length: opponent.radius * 3.1,
          alpha: 1.0,
        });

        // Also destroy any Shadow Clones inside the domain
        opponent.hitShadowCloneAt(opponent.x, opponent.y, 120, callbacks);

        const heavySlashDmg = 3.6 + this.roundElapsed * 0.08 + (this.level - 1) * 1.0;
        opponent.takeDamage(heavySlashDmg, '#dc2626', '🔪 CLEAVE!', true);
        this.recordDamageDealt(heavySlashDmg, callbacks);
        this.playAttackVoice();
        callbacks.playSound('slice');
        callbacks.spawnSparks(opponent.x, opponent.y, '#dc2626', 12);
        callbacks.spawnSparks(opponent.x, opponent.y, '#ffffff', 6);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // Note: The domain radius itself is invisible as specified!
    // Draw core ball with cursed tattoo rings and centered 🔪 emoji + HP
    super.draw(ctx);

    ctx.save();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    this.drawCenterIcon(ctx);

    // Draw the flurry of 5 rapid, unavoidable slash animations directly over the target
    ctx.save();
    for (const sv of this.slashVisuals) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sv.alpha);
      ctx.translate(sv.x, sv.y);
      ctx.rotate(sv.angle);

      // Outer crimson cursed energy slash
      ctx.strokeStyle = '#dc2626';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 9;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-sv.length / 2, 0);
      ctx.lineTo(sv.length / 2, 0);
      ctx.stroke();

      // Razor-thin white cleave core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-sv.length * 0.56, 0);
      ctx.lineTo(sv.length * 0.56, 0);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }
}

/* ==========================================================================
   ANIME SUBCLASS 8: WaterBreathingBall (🌊) - Inspired by Tanjiro
   - Leaves a trailing path of blue water canvas shapes as it moves.
   - If the enemy touches this water trail, they are slowed and take slight tick damage.
   ========================================================================== */
export class Tanjiro extends Ball {
  spawnTimer: number;
  tickCooldown: number;
  waterTrailShapes: {
    x: number;
    y: number;
    angle: number;
    radius: number;
    life: number;
    maxLife: number;
    swirlPhase: number;
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Water Breathing ocean blue & white foam crest with 🌊 emoji in center
    super(x, y, radius, mass, '#0284c7', '#38bdf8', name, startingHealth, 'waterbreathing', '🌊');
    this.spawnTimer = 0;
    this.tickCooldown = 0;
    this.waterTrailShapes = [];
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playLiquidCollisionSplash(1.0, 'tanjiro');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.spawnTimer = 0;
    this.tickCooldown = 0;
    this.waterTrailShapes = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.tickCooldown > 0) {
      this.tickCooldown = Math.max(0, this.tickCooldown - dt);
    }

    const speed = Math.hypot(this.vx, this.vy);
    this.spawnTimer += dt;
    if (speed > 0.5 && this.spawnTimer >= 0.10) {
      this.spawnTimer = 0;
      const moveAngle = Math.atan2(this.vy, this.vx);
      this.waterTrailShapes.push({
        x: this.x,
        y: this.y,
        angle: moveAngle,
        radius: Math.round((26 + (this.level - 1) * 4) * 1.3),
        life: 3.4,
        maxLife: 3.4,
        swirlPhase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = this.waterTrailShapes.length - 1; i >= 0; i--) {
      const ws = this.waterTrailShapes[i];
      ws.life -= dt;
      ws.swirlPhase += dt * 4;
      if (ws.life <= 0) {
        this.waterTrailShapes.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    _dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // Check if enemy touches any blue water canvas shape in the trail
    for (const ws of this.waterTrailShapes) {
      opponent.hitShadowCloneAt(ws.x, ws.y, ws.radius, callbacks);

      const dist = Math.hypot(opponent.x - ws.x, opponent.y - ws.y);
      if (dist <= ws.radius + opponent.radius) {
        // Slow the enemy
        opponent.waterSlowTimer = 0.25;
        opponent.vx *= 0.92;
        opponent.vy *= 0.92;

        // Deal slight tick damage
        if (this.tickCooldown <= 0) {
          this.tickCooldown = 0.42;
          const tickDmg = 1.5 + (this.level - 1) * 0.5;
          opponent.takeDamage(tickDmg, '#0284c7', '🌊 WATER TRAIL');
          this.recordDamageDealt(tickDmg, callbacks);
          this.playAbilityVoice();
          callbacks.spawnSparks(opponent.x, opponent.y, '#38bdf8', 8);
          callbacks.spawnSparks(opponent.x, opponent.y, '#e0f2fe', 5);
        }
        break;
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    if (this.waterTrailShapes.length === 0) return;
    ctx.save();
    for (const ws of this.waterTrailShapes) {
      const alpha = Math.min(1, ws.life / 0.8) * 0.82;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(ws.x, ws.y);
      ctx.rotate(ws.angle + Math.sin(ws.swirlPhase) * 0.2);

      // Deep ocean blue wave base shape
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, ws.radius, 0, Math.PI * 2);
      ctx.fill();

      // Lighter cyan inner wave crest crescent
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(2, 0, ws.radius * 0.76, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.closePath();
      ctx.fill();

      // White Ukiyo-e foam wave arcs
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, ws.radius * 0.85, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 9: ThunderFlashBall (⚡) - Inspired by Zenitsu
   - Moves at only 30% speed normally (sleeping).
   - Every 6 seconds, instantly teleports directly through the enemy ball,
     leaving a bright yellow lightning strike animation and dealing massive burst damage.
   ========================================================================== */
export class Zenitsu extends Ball {
  thunderTimer: number;
  thunderCooldown: number;
  sleepZTimer: number;
  lightningBolts: {
    points: { x: number; y: number }[];
    alpha: number;
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Thunder Breathing golden yellow & electric amber with ⚡ emoji in center
    super(x, y, radius, mass, '#facc15', '#ca8a04', name, startingHealth, 'thunderflash', '⚡');
    this.thunderTimer = 0;
    this.thunderCooldown = 6.0; // Every 6 seconds
    this.sleepZTimer = 0;
    this.lightningBolts = [];
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.thunderTimer = 0;
    this.sleepZTimer = 0;
    this.lightningBolts = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.sleepZTimer += dt;

    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.alpha -= dt * 1.9;
      if (bolt.alpha <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.thunderTimer += dt;
    if (this.thunderTimer >= this.thunderCooldown) {
      this.thunderTimer = 0;

      const startX = this.x;
      const startY = this.y;
      const dx = opponent.x - startX;
      const dy = opponent.y - startY;
      const angle = Math.atan2(dy, dx);

      // Teleport directly through the enemy ball to the far side!
      const rawDestX = opponent.x + Math.cos(angle) * (opponent.radius + this.radius + 95);
      const rawDestY = opponent.y + Math.sin(angle) * (opponent.radius + this.radius + 95);

      const destX = Math.max(350 + this.radius, Math.min(930 - this.radius, rawDestX));
      const destY = Math.max(70 + this.radius, Math.min(650 - this.radius, rawDestY));

      // Build bright yellow jagged lightning strike animation points from start -> opponent -> dest
      const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
      const segments = 10;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const baseX = startX + (destX - startX) * t;
        const baseY = startY + (destY - startY) * t;
        const perpX = -Math.sin(angle) * ((i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 14));
        const perpY = Math.cos(angle) * ((i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 14));
        points.push({ x: baseX + perpX, y: baseY + perpY });
      }
      points.push({ x: destX, y: destY });

      this.lightningBolts.push({ points, alpha: 1.0 });

      // Destroy any Shadow Clones along the lightning path
      opponent.hitShadowCloneAt(opponent.x, opponent.y, 90, callbacks);

      // Move ThunderFlashBall instantly to destination
      this.x = destX;
      this.y = destY;
      this.vx = Math.cos(angle) * 5.0;
      this.vy = Math.sin(angle) * 5.0;

      // Deal massive burst damage!
      const massiveBurst = 18 + this.roundElapsed * 0.35 + (this.level - 1) * 4;
      opponent.takeDamage(massiveBurst, '#facc15', '⚡ THUNDERCLAP & FLASH!', true);
      this.recordDamageDealt(massiveBurst, callbacks);

      this.playAbilityVoice();
      this.playAttackVoice();
      callbacks.playSound('explosion');
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#facc15', 145);
      callbacks.spawnSparks(opponent.x, opponent.y, '#fef08a', 28);
      callbacks.spawnSparks(destX, destY, '#facc15', 18);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw bright yellow lightning strike animation across the arena
    ctx.save();
    for (const bolt of this.lightningBolts) {
      if (bolt.points.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, bolt.alpha);

      // Outer golden-yellow electric glow
      ctx.strokeStyle = '#eab308';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      ctx.stroke();

      // Inner blinding white-yellow lightning core
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // 2. Draw ThunderFlashBall core and centered ⚡ emoji + HP
    super.draw(ctx);

    // 3. Draw sleeping 'Zzz' indicator while moving at 30% speed between 6s strikes
    if (this.thunderTimer < 5.4) {
      ctx.save();
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      const zOffset = Math.sin(this.sleepZTimer * 4) * 3;
      ctx.strokeText('Zzz...', this.x + this.radius * 0.75, this.y - this.radius * 0.85 + zOffset);
      ctx.fillText('Zzz...', this.x + this.radius * 0.75, this.y - this.radius * 0.85 + zOffset);
      ctx.restore();
    }
  }
}

/* ==========================================================================
   ANIME SUBCLASS 10: ScoutSpinnerBall (🗡️) - Inspired by Levi
   - When it collides with the enemy, instead of bouncing off, it latches onto
     the enemy and rapidly rotates around them for 2 seconds, dealing continuous
     'blade' damage before detaching.
   ========================================================================== */
export class Levi extends Ball {
  isLatched: boolean;
  latchTimer: number;
  latchCooldown: number;
  orbitAngle: number;
  bladeSpinAngle: number;
  bladeTickTimer: number;
  latchedTargetX: number;
  latchedTargetY: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Survey Corps emerald cloak & ODM steel with 🗡️ emoji in center
    super(x, y, radius, mass, '#059669', '#334155', name, startingHealth, 'scoutspinner', '🗡️');
    this.isLatched = false;
    this.latchTimer = 0;
    this.latchCooldown = 0;
    this.orbitAngle = 0;
    this.bladeSpinAngle = 0;
    this.bladeTickTimer = 0;
    this.latchedTargetX = x;
    this.latchedTargetY = y;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.isLatched = false;
    this.latchTimer = 0;
    this.latchCooldown = 0;
    this.orbitAngle = 0;
    this.bladeSpinAngle = 0;
    this.bladeTickTimer = 0;
  }

  canLatch(): boolean {
    return !this.isLatched && this.latchCooldown <= 0 && this.health > 0;
  }

  startLatch(
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    this.isLatched = true;
    this.latchTimer = 2.0; // Latches and rapidly rotates around enemy for 2 seconds
    this.bladeTickTimer = 0;
    this.orbitAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
    this.latchedTargetX = opponent.x;
    this.latchedTargetY = opponent.y;
    this.playAbilityVoice();
    callbacks.playSound('slice');
    callbacks.spawnSparks(opponent.x, opponent.y, '#e2e8f0', 14);
  }

  override update(dt: number, friction: number) {
    if (this.latchCooldown > 0) {
      this.latchCooldown = Math.max(0, this.latchCooldown - dt);
    }
    this.bladeSpinAngle += dt * (this.isLatched ? 28 : 6);
    super.update(dt, friction);
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) {
      this.isLatched = false;
      return;
    }

    if (this.isLatched) {
      this.latchTimer -= dt;
      this.bladeTickTimer -= dt;
      this.orbitAngle += dt * 18.5; // Rapidly rotates around the enemy!

      this.latchedTargetX = opponent.x;
      this.latchedTargetY = opponent.y;

      const orbitDist = opponent.radius + this.radius * 0.82;
      const nextX = opponent.x + Math.cos(this.orbitAngle) * orbitDist;
      const nextY = opponent.y + Math.sin(this.orbitAngle) * orbitDist;

      this.x = Math.max(350 + this.radius, Math.min(930 - this.radius, nextX));
      this.y = Math.max(70 + this.radius, Math.min(650 - this.radius, nextY));
      this.vx = -Math.sin(this.orbitAngle) * 12;
      this.vy = Math.cos(this.orbitAngle) * 12;

      // Deal continuous 'blade' damage while rapidly rotating around the enemy
      if (this.bladeTickTimer <= 0) {
        this.bladeTickTimer = 0.22;
        const bladeDmg = 2.0 + (this.level - 1) * 0.6;
        opponent.takeDamage(bladeDmg, this.color, '🗡️ SPIN SLICE!');
        this.recordDamageDealt(bladeDmg, callbacks);
        this.playAttackVoice();
        callbacks.spawnSparks(
          (this.x + opponent.x) / 2,
          (this.y + opponent.y) / 2,
          '#e2e8f0',
          8
        );
      }

      // Detach after 2 seconds
      if (this.latchTimer <= 0) {
        this.isLatched = false;
        this.latchCooldown = 1.6;
        const detachAngle = Math.atan2(this.y - opponent.y, this.x - opponent.x);
        this.vx = Math.cos(detachAngle) * 13.5;
        this.vy = Math.sin(detachAngle) * 13.5;
        opponent.vx -= Math.cos(detachAngle) * 5.0;
        opponent.vy -= Math.sin(detachAngle) * 5.0;
        callbacks.playSound('dash');
        callbacks.spawnShockwave?.(opponent.x, opponent.y, '#10b981', 80);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw core ball first
    super.draw(ctx);

    // 2. If latched onto enemy: draw ODM grapple wires and high-speed spinning blade vortex ring
    if (this.isLatched) {
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.latchedTargetX, this.latchedTargetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 3. Draw dual curved ODM steel blades rotating around ScoutSpinnerBall after super.draw(ctx) and before drawCenterIcon(ctx)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.bladeSpinAngle);

    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(this.radius - 5.2, -5.2);
      ctx.lineTo(this.radius + 34, -2.6);
      ctx.lineTo(this.radius + 42, 3.9);
      ctx.lineTo(this.radius - 5.2, 5.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 4. Draw centered 🗡️ emoji + HP on top of blades
    this.drawCenterIcon(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 11: StarPlatinumBall (⭐) - Inspired by Jotaro
   - Every 12 seconds, triggers a 'Time Stop'.
   - The enemy ball and all projectiles completely freeze in place for 2.5 seconds
     while this ball retains full movement to line up a massive collision.
   ========================================================================== */
export class Jotaro extends Ball {
  timeStopTimer: number;
  timeStopCooldown: number;
  activeTimeStopRemaining: number;
  clockHandAngle: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Star Platinum royal violet & Jotaro gold with ⭐ emoji in center
    super(x, y, radius, mass, '#7c3aed', '#facc15', name, startingHealth, 'starplatinum', '⭐');
    this.timeStopTimer = 0;
    this.timeStopCooldown = 12.0; // Every 12 seconds
    this.activeTimeStopRemaining = 0;
    this.clockHandAngle = 0;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.timeStopTimer = 0;
    this.activeTimeStopRemaining = 0;
    this.clockHandAngle = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.clockHandAngle += dt * (this.activeTimeStopRemaining > 0 ? 0.2 : 3.5);
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    if (this.activeTimeStopRemaining > 0) {
      this.activeTimeStopRemaining = Math.max(0, this.activeTimeStopRemaining - dt);
      opponent.timeStopFrozenTimer = this.activeTimeStopRemaining;

      // Subtle Stand guidance toward the frozen enemy during Time Stop to help line up a massive collision
      const dx = opponent.x - this.x;
      const dy = opponent.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > this.radius + opponent.radius) {
        const curSpeed = Math.max(10, Math.hypot(this.vx, this.vy));
        const desiredVx = (dx / dist) * curSpeed;
        const desiredVy = (dy / dist) * curSpeed;
        this.vx = this.vx * 0.94 + desiredVx * 0.06;
        this.vy = this.vy * 0.94 + desiredVy * 0.06;
      }
    } else {
      this.timeStopTimer += dt;
      if (this.timeStopTimer >= this.timeStopCooldown) {
        this.timeStopTimer = 0;
        this.activeTimeStopRemaining = 2.5; // Freeze enemy & all projectiles for 2.5 seconds!
        opponent.timeStopFrozenTimer = 2.5;

        this.playAbilityVoice();
        callbacks.playSound('teleport');
        callbacks.spawnShockwave?.(this.x, this.y, '#facc15', 220);
        callbacks.spawnShockwave?.(this.x, this.y, '#7c3aed', 160);
        callbacks.spawnSparks(this.x, this.y, '#facc15', 24);
        this.floatingTexts.push({
          text: '⭐ TIME STOP! (2.5s)',
          x: this.x,
          y: this.y - this.radius - 32,
          alpha: 1.0,
          color: '#facc15',
          vy: -1.2,
        });
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    if (this.activeTimeStopRemaining <= 0) return;
    // Draw negative-space Time Stop clockwork field over the arena
    ctx.save();
    ctx.fillStyle = 'rgba(76, 29, 149, 0.16)';
    ctx.fillRect(350, 70, 580, 580);

    // Golden clockwork dial in center of arena during Time Stop
    ctx.translate(640, 360);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 190, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 172, Math.sin(a) * 172);
      ctx.lineTo(Math.cos(a) * 188, Math.sin(a) * 188);
      ctx.stroke();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw Time Stop charge / active ring around StarPlatinumBall
    ctx.save();
    ctx.translate(this.x, this.y);
    const ringR = this.radius + 11;
    const progress =
      this.activeTimeStopRemaining > 0
        ? this.activeTimeStopRemaining / 2.5
        : Math.min(1, this.timeStopTimer / this.timeStopCooldown);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = this.activeTimeStopRemaining > 0 ? '#facc15' : '#a855f7';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = this.activeTimeStopRemaining > 0 ? 8 : 3;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Draw core ball and centered ⭐ emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 12: AlchemistBall (⚙️) - Inspired by Edward Elric
   - Every 4 seconds, raises a static, solid stone pillar (a grey canvas rectangle)
     from the arena floor.
   - These act as permanent walls that alter the arena's bounce angles and block projectiles.
   ========================================================================== */
export class EdwardElric extends Ball {
  static pillars: {
    x: number;
    y: number;
    width: number;
    height: number;
    transmuteFlash: number;
  }[] = [];
  pillarTimer: number;
  pillarCooldown: number;
  pillars: {
    x: number;
    y: number;
    width: number;
    height: number;
    transmuteFlash: number;
  }[];

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Fullmetal crimson cloak & steel automail with ⚙️ emoji in center
    super(x, y, radius, mass, '#b91c1c', '#64748b', name, startingHealth, 'alchemist', '⚙️');
    this.pillarTimer = 0;
    this.pillarCooldown = 4.0; // Every 4 seconds
    this.pillars = [];
    EdwardElric.pillars = this.pillars;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.04, 'engineer');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.pillarTimer = 0;
    this.pillars = [];
    EdwardElric.pillars = this.pillars;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    for (const p of this.pillars) {
      if (p.transmuteFlash > 0) {
        p.transmuteFlash = Math.max(0, p.transmuteFlash - dt * 2.2);
      }
    }
  }

  private resolveBallVsPillar(
    ball: Ball,
    pillar: { x: number; y: number; width: number; height: number },
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
    }
  ) {
    const halfW = pillar.width / 2;
    const halfH = pillar.height / 2;
    const left = pillar.x - halfW;
    const right = pillar.x + halfW;
    const top = pillar.y - halfH;
    const bottom = pillar.y + halfH;

    const closestX = Math.max(left, Math.min(ball.x, right));
    const closestY = Math.max(top, Math.min(ball.y, bottom));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.hypot(dx, dy);

    if (dist < ball.radius) {
      let nx = 0;
      let ny = 0;
      if (dist > 0.001) {
        nx = dx / dist;
        ny = dy / dist;
      } else {
        // Ball center is inside rectangle; push out along shortest axis
        const penLeft = Math.abs(ball.x - left);
        const penRight = Math.abs(right - ball.x);
        const penTop = Math.abs(ball.y - top);
        const penBottom = Math.abs(bottom - ball.y);
        const minPen = Math.min(penLeft, penRight, penTop, penBottom);
        if (minPen === penLeft) nx = -1;
        else if (minPen === penRight) nx = 1;
        else if (minPen === penTop) ny = -1;
        else ny = 1;
      }

      const overlap = ball.radius - dist + 1.5;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        ball.vx = (ball.vx - 2 * dot * nx) * 0.98;
        ball.vy = (ball.vy - 2 * dot * ny) * 0.98;
        callbacks.playSound('wall');
        callbacks.spawnSparks(closestX, closestY, '#94a3b8', 7);
      }
    }
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.pillarTimer += dt;
    if (this.pillarTimer >= this.pillarCooldown) {
      this.pillarTimer = 0;

      const isHorizontal = this.pillars.length % 2 === 0;
      const width = isHorizontal ? 99 : 47;
      const height = isHorizontal ? 47 : 99;

      // Spawn the stone pillar behind AlchemistBall's movement direction so it doesn't self-trap
      const moveAngle = Math.hypot(this.vx, this.vy) > 0.4 ? Math.atan2(this.vy, this.vx) : 0;
      const offsetDist = this.radius + Math.max(width, height) * 0.55 + 14;
      let px = this.x - Math.cos(moveAngle) * offsetDist;
      let py = this.y - Math.sin(moveAngle) * offsetDist;

      px = Math.max(385 + width / 2, Math.min(895 - width / 2, px));
      py = Math.max(105 + height / 2, Math.min(615 - height / 2, py));

      // Ensure it doesn't spawn directly on top of the opponent's center
      if (Math.hypot(px - opponent.x, py - opponent.y) < opponent.radius + 48) {
        px = 640 + (Math.random() - 0.5) * 260;
        py = 360 + (Math.random() - 0.5) * 260;
      }

      if (this.pillars.length >= 8) {
        this.pillars.shift();
      }

      this.pillars.push({
        x: px,
        y: py,
        width,
        height,
        transmuteFlash: 1.0,
      });

      this.playAbilityVoice();
      callbacks.spawnShockwave?.(px, py, '#f59e0b', 75);
      callbacks.spawnSparks(px, py, '#94a3b8', 14);
    }

    // 1. Solid stone pillars act as permanent walls that alter both balls' bounce angles
    for (const pillar of this.pillars) {
      this.resolveBallVsPillar(this, pillar, callbacks);
      this.resolveBallVsPillar(opponent, pillar, callbacks);
    }

    // 2. Solid stone pillars block projectiles!
    const pointHitsPillar = (x: number, y: number, pad = 6): boolean => {
      for (const p of this.pillars) {
        if (
          x >= p.x - p.width / 2 - pad &&
          x <= p.x + p.width / 2 + pad &&
          y >= p.y - p.height / 2 - pad &&
          y <= p.y + p.height / 2 + pad
        ) {
          callbacks.spawnSparks(x, y, '#94a3b8', 8);
          callbacks.playSound('wall');
          return true;
        }
      }
      return false;
    };

    const filterProjectiles = <T extends { x: number; y: number }>(arr: T[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (pointHitsPillar(arr[i].x, arr[i].y)) {
          arr.splice(i, 1);
        }
      }
    };

    if (opponent instanceof Sniper) filterProjectiles(opponent.bullets);
    if (opponent instanceof Archer) filterProjectiles(opponent.arrows);
    if (opponent instanceof Engineer) filterProjectiles(opponent.projectiles);
    if (opponent instanceof DroneSwarm) filterProjectiles(opponent.plasmaBolts);
    if (opponent instanceof Naruto) filterProjectiles(opponent.kunaiProjectiles);
    if (opponent instanceof Luffy && opponent.punchState === 'extending') {
      if (pointHitsPillar(opponent.fistX, opponent.fistY, 10)) {
        opponent.punchState = 'retracting';
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    // Draw raised static solid stone pillars (grey canvas rectangles) on the arena floor
    for (const p of this.pillars) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Golden alchemy transmutation circle glow when freshly raised
      if (p.transmuteFlash > 0) {
        ctx.save();
        ctx.globalAlpha = p.transmuteFlash;
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(p.width, p.height) * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Solid stone pillar shadow & bevel
      ctx.fillStyle = '#334155';
      ctx.fillRect(-p.width / 2 + 3, -p.height / 2 + 4, p.width, p.height);

      // Main grey canvas rectangle stone body
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

      // Chiseled stone highlight & alchemy seam lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-p.width / 2 + 4, -p.height / 2 + 4, p.width - 8, p.height - 8);
      ctx.restore();
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 13: ShinigamiNoteBall (📓) - Inspired by Death Note
   - Deals almost zero collision damage.
   - However, if this ball manages to avoid taking any damage for 20 seconds straight,
     it triggers an instant-kill 'Heart Attack' on the enemy ball, winning the round immediately.
   ========================================================================== */
export class LightYagami extends Ball {
  unharmedTimer: number;
  requiredSafeSeconds: number;
  heartAttackExecuted: boolean;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Death Note pitch black cover & crimson ink with 📓 emoji in center
    super(x, y, radius, mass, '#1e293b', '#e11d48', name, startingHealth, 'shinigaminote', '📓');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 20;
    this.unharmedTimer = 0;
    this.requiredSafeSeconds = 20.0; // 20 seconds straight without taking damage
    this.heartAttackExecuted = false;
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.unharmedTimer = 0;
    this.heartAttackExecuted = false;
  }

  override takeDamage(
    amount: number,
    attackerColor = '#ef4444',
    label?: string,
    bypassEarlyCap = false,
    attacker?: Ball | null
  ): number {
    // Taking any damage resets the 20-second Death Note inscription timer!
    if (this.unharmedTimer > 1.5) {
      this.floatingTexts.push({
        text: '📓 TIMER RESET!',
        x: this.x,
        y: this.y - this.radius - 28,
        alpha: 1.0,
        color: '#f43f5e',
        vy: -1.4,
      });
    }
    this.unharmedTimer = 0;
    return super.takeDamage(amount, attackerColor, label, bypassEarlyCap, attacker);
  }

  override updateSpecial(
    dt: number,
    opponent: Ball,
    callbacks: {
      playSound: (type: any) => void;
      spawnSparks: (x: number, y: number, color: string, count?: number) => void;
      spawnShockwave?: (x: number, y: number, color: string, maxRadius?: number) => void;
    }
  ) {
    if (this.health <= 0 || opponent.health <= 0 || this.heartAttackExecuted) return;

    this.unharmedTimer += dt;

    // If ShinigamiNoteBall avoids taking any damage for 20 seconds straight -> Instant-Kill 'Heart Attack'!
    if (this.unharmedTimer >= this.requiredSafeSeconds) {
      this.heartAttackExecuted = true;
      this.playAbilityVoice();
      callbacks.playSound('ko');
      callbacks.playSound('explosion');
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#e11d48', 230);
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#000000', 170);
      callbacks.spawnSparks(opponent.x, opponent.y, '#e11d48', 40);

      opponent.floatingTexts.push({
        text: '📓 HEART ATTACK! INSTANT KO!',
        x: opponent.x,
        y: opponent.y - opponent.radius - 38,
        alpha: 1.0,
        color: '#e11d48',
        vy: -1.2,
      });

      opponent.takeDamage(9999, '#e11d48', '📓 HEART ATTACK!', true);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw 20-second Death Note inscription countdown ring around ShinigamiNoteBall
    ctx.save();
    ctx.translate(this.x, this.y);
    const ringR = this.radius + 12;
    const progress = Math.min(1, this.unharmedTimer / this.requiredSafeSeconds);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = progress > 0.75 ? '#ef4444' : '#e11d48';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();

    // Countdown label above ball showing remaining seconds to Heart Attack
    const secsLeft = Math.max(0, Math.ceil(this.requiredSafeSeconds - this.unharmedTimer));
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe4e6';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeText(`📓 ${secsLeft}s`, 0, -this.radius - 20);
    ctx.fillText(`📓 ${secsLeft}s`, 0, -this.radius - 20);
    ctx.restore();

    // 2. Draw core ball and centered 📓 emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 14: OneForSmashBall (✊) - Inspired by Deku
   - Has the highest collision multiplier in the game, dealing catastrophic
     damage on impact.
   - However, takes 15% recoil damage to its own health bar every time it hits the enemy.
   ========================================================================== */
export class Deku extends Ball {
  bioLightningPhase: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // One For All Full Cowling emerald green & crimson belt with ✊ emoji in center
    super(x, y, radius, 48, '#10b981', '#047857', name, startingHealth, 'oneforsmash', '✊');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 48;
    this.bioLightningPhase = 0;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(1.08, 'allmight');
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    this.bioLightningPhase += dt * 14;
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw Full Cowling emerald bio-lightning arcs crackling around OneForSmashBall
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#6ee7b7';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.5;

    for (let i = 0; i < 4; i++) {
      const baseAngle = this.bioLightningPhase + (i * Math.PI) / 2;
      const r1 = this.radius + 3;
      const r2 = this.radius + 14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(baseAngle) * r1, Math.sin(baseAngle) * r1);
      ctx.lineTo(
        Math.cos(baseAngle + 0.22) * r2,
        Math.sin(baseAngle + 0.22) * r2
      );
      ctx.lineTo(
        Math.cos(baseAngle + 0.44) * (r1 + 4),
        Math.sin(baseAngle + 0.44) * (r1 + 4)
      );
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw core ball and centered ✊ emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   ANIME SUBCLASS 15: CapedBaldyBall (👊) - Inspired by Saitama
   - Moves incredibly slowly and has terrible acceleration.
   - However, if it manages to land a direct, high-speed collision on the enemy,
     it deals 9999 damage (Instant KO).
   ========================================================================== */
export class Saitama extends Ball {
  momentumCharge: number;

  constructor(x: number, y: number, radius: number, mass: number, _color: string, _glowColor: string, name: string, startingHealth = 100) {
    // Hero jumpsuit yellow & red gloves with 👊 emoji in center
    super(x, y, radius, 50, '#eab308', '#dc2626', name, startingHealth, 'capedbaldy', '👊');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 50;
    this.momentumCharge = 0;
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(0.84, 'titan');
  }

  override resetPosition(x: number, y: number, startingHealth?: number) {
    super.resetPosition(x, y, startingHealth);
    this.momentumCharge = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    // Terrible acceleration: slowly builds up momentum over time (~6.5 seconds to reach Serious Punch speed)
    if (this.timeStopFrozenTimer <= 0 && !this.isFrozen) {
      this.momentumCharge = Math.min(1.0, this.momentumCharge + dt * 0.16);
    }
  }

  isAtHighSpeed(): boolean {
    return this.momentumCharge >= 0.72 || Math.hypot(this.vx, this.vy) >= 6.8;
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw flowing white hero cape behind CapedBaldyBall
    const moveAngle = Math.hypot(this.vx, this.vy) > 0.1 ? Math.atan2(this.vy, this.vx) : 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(moveAngle + Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.65);
    ctx.lineTo(this.radius * 1.45, -this.radius * 0.92);
    ctx.lineTo(this.radius * 1.32, 0);
    ctx.lineTo(this.radius * 1.45, this.radius * 0.92);
    ctx.lineTo(0, this.radius * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. If charged up to high speed, draw crimson 'SERIOUS PUNCH READY' aura
    if (this.isAtHighSpeed()) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 9;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw core ball and centered 👊 emoji + HP
    super.draw(ctx);
  }
}

/* ==========================================================================
   HELPER FOR ABSORBING OR DEFLECTING ENEMY PROJECTILES
   Used by Rimuru (absorbs projectiles to heal), Yami (Dark Magic), Killua, etc.
   ========================================================================== */
function consumeEnemyProjectilesWithinRadius(
  defender: Ball,
  opponent: Ball,
  radius: number,
  onConsume: (px: number, py: number) => void
) {
  const filterArr = <T extends { x: number; y: number }>(arr: T[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (Math.hypot(arr[i].x - defender.x, arr[i].y - defender.y) <= radius) {
        const pt = arr[i];
        arr.splice(i, 1);
        onConsume(pt.x, pt.y);
      }
    }
  };
  if (opponent instanceof Sniper) filterArr(opponent.bullets);
  if (opponent instanceof Archer) filterArr(opponent.arrows);
  if (opponent instanceof Engineer) filterArr(opponent.projectiles);
  if (opponent instanceof DroneSwarm) filterArr(opponent.plasmaBolts);
  if (opponent instanceof Naruto) filterArr(opponent.kunaiProjectiles);
  if (opponent instanceof Ichigo) filterArr(opponent.crescentWaves);
  const anyOpp = opponent as unknown as { projectiles?: { x: number; y: number }[] };
  if (Array.isArray(anyOpp.projectiles)) {
    filterArr(anyOpp.projectiles);
  }
}

/* ==========================================================================
   BATCH 4 (FIRE & ICE): Natsu, Todoroki, Roy Mustang, Esdeath, Aokiji
   ========================================================================== */

// 16. NatsuBall (🐉) - Fairy Tail: Fire Dragon's Roar cone + Dragon Force scaling
export class Natsu extends Ball {
  roarTimer = 0;
  roarFlash = 0;
  roarAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#ef4444', '#f97316', name, hp, 'natsu', '🐉');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.roarTimer = 0;
    this.roarFlash = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.roarFlash > 0) this.roarFlash = Math.max(0, this.roarFlash - dt * 2.2);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.roarTimer += dt;
    if (this.roarTimer >= 3.5) {
      this.roarTimer = 0;
      this.roarFlash = 1.0;
      const target = opponent.getTargetPosition(this.x, this.y);
      this.roarAngle = Math.atan2(target.y - this.y, target.x - this.x);
      this.playAbilityVoice();
      callbacks.playSound('explosion');

      const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);
      const angleToOpp = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      let diff = angleToOpp - this.roarAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      if (dist <= 320 && Math.abs(diff) <= 0.65) {
        const missingHpRatio = 1 + (1 - this.health / this.maxHealth) * 0.8;
        const dmg = (10 + this.level * 2.5) * missingHpRatio;
        opponent.takeDamage(dmg, '#f97316', '🐉 FIRE DRAGON ROAR!');
        this.recordDamageDealt(dmg, callbacks);
        callbacks.spawnSparks(opponent.x, opponent.y, '#f97316', 22);
        callbacks.spawnShockwave?.(opponent.x, opponent.y, '#ef4444', 110);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    if (this.roarFlash > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.roarAngle);
      ctx.globalAlpha = this.roarFlash * 0.85;
      const grad = ctx.createLinearGradient(this.radius, 0, 310, 0);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#f97316');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.radius * 0.8, 0);
      ctx.arc(0, 0, 310, -0.52, 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    super.draw(ctx);
  }

  // Fire Characters (Natsu, Mustang): Push large, rising orange and grey circle particles (smoke and embers)
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
    for (let i = 0; i < 40; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
  }
}

// 17. TodorokiBall (🌓) - MHA: Half-Cold Half-Hot alternating Glacier Freeze & Prominence Burn
export class Todoroki extends Ball {
  cycleTimer = 0;
  nextIsIce = true;
  waveVisuals: { x: number; y: number; angle: number; isIce: boolean; alpha: number }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#38bdf8', '#ef4444', name, hp, 'todoroki', '🌓');
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playIceCollisionChime(1.05, 'todoroki');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.cycleTimer = 0;
    this.nextIsIce = true;
    this.waveVisuals = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    for (let i = this.waveVisuals.length - 1; i >= 0; i--) {
      this.waveVisuals[i].alpha -= dt * 1.8;
      if (this.waveVisuals[i].alpha <= 0) this.waveVisuals.splice(i, 1);
    }
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.cycleTimer += dt;
    if (this.cycleTimer >= 3.2) {
      this.cycleTimer = 0;
      const angle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const isIce = this.nextIsIce;
      this.nextIsIce = !this.nextIsIce;
      this.waveVisuals.push({ x: this.x, y: this.y, angle, isIce, alpha: 1.0 });
      this.playAbilityVoice();

      if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 290) {
        if (isIce) {
          opponent.isFrozen = true;
          opponent.frozenTimer = 1.6;
          const dmg = 6 + this.level * 1.5;
          opponent.takeDamage(dmg, '#38bdf8', '🧊 GLACIER WALL!');
          this.recordDamageDealt(dmg, callbacks);
          callbacks.playSound('freeze');
          callbacks.spawnSparks(opponent.x, opponent.y, '#bae6fd', 18);
        } else {
          const dmg = 11 + this.level * 2.2;
          opponent.takeDamage(dmg, '#ef4444', '🔥 FLASHFIRE FIST!');
          this.recordDamageDealt(dmg, callbacks);
          callbacks.playSound('explosion');
          callbacks.spawnSparks(opponent.x, opponent.y, '#f97316', 22);
        }
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    for (const w of this.waveVisuals) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, w.alpha);
      ctx.translate(w.x, w.y);
      ctx.rotate(w.angle);
      ctx.fillStyle = w.isIce ? 'rgba(56, 189, 248, 0.55)' : 'rgba(239, 68, 68, 0.6)';
      ctx.strokeStyle = w.isIce ? '#e0f2fe' : '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.radius, -18);
      ctx.lineTo(250, -52);
      ctx.lineTo(270, 0);
      ctx.lineTo(250, 52);
      ctx.lineTo(this.radius, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    super.draw(ctx);
    // Split half-ice / half-fire rim
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ice Characters (Aokiji, Todoroki): Push jagged cyan polygon shapes (shards) that explode outward and fade + rising embers
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 24; i++) {
      particles.push(new ShardParticle(this.x, this.y, '#38bdf8'));
    }
    for (let i = 0; i < 20; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
    for (let i = 0; i < 15; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
  }
}

// 18. RoyMustangBall (🔥) - FMA: Pinpoint Ignition Glove Snap Explosions
export class RoyMustang extends Ball {
  snapTimer = 0;
  blasts: { x: number; y: number; radius: number; alpha: number }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#1d4ed8', '#f97316', name, hp, 'mustang', '🔥');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.snapTimer = 0;
    this.blasts = [];
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      this.blasts[i].radius += dt * 110;
      this.blasts[i].alpha -= dt * 2.0;
      if (this.blasts[i].alpha <= 0) this.blasts.splice(i, 1);
    }
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.snapTimer += dt;
    if (this.snapTimer >= 3.0) {
      this.snapTimer = 0;
      const target = opponent.getTargetPosition(this.x, this.y);
      this.blasts.push({ x: target.x, y: target.y, radius: 18, alpha: 1.0 });
      this.playAbilityVoice();
      callbacks.playSound('explosion');
      callbacks.spawnSparks(this.x, this.y, '#fef08a', 8);

      if (Math.hypot(opponent.x - target.x, opponent.y - target.y) <= opponent.radius + 65) {
        const dmg = 9.5 + this.level * 2.0;
        opponent.takeDamage(dmg, '#f97316', '🔥 FLAME ALCHEMY SNAP!');
        this.recordDamageDealt(dmg, callbacks);
        callbacks.spawnShockwave?.(opponent.x, opponent.y, '#f97316', 115);
        callbacks.spawnSparks(opponent.x, opponent.y, '#ef4444', 24);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    for (const b of this.blasts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.alpha);
      const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, b.radius);
      g.addColorStop(0, '#fef08a');
      g.addColorStop(0.5, '#f97316');
      g.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    super.draw(ctx);
  }

  // Fire Characters (Natsu, Mustang): Push large, rising orange and grey circle particles (smoke and embers)
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
    for (let i = 0; i < 40; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
  }
}

// 19. EsdeathBall (🧊) - Akame ga Kill: Orbiting Icicle Spears & Mahapadma Freeze
export class Esdeath extends Ball {
  spearTimer = 0.7;
  mahapadmaTimer = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#0284c7', '#e0f2fe', name, hp, 'esdeath', '🧊');
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playIceCollisionChime(1.12, 'esdeath');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.spearTimer = 0.7;
    this.mahapadmaTimer = 0;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.spearTimer -= dt;
    this.mahapadmaTimer += dt;

    if (this.spearTimer <= 0) {
      this.spearTimer = 2.2;
      const t = opponent.getTargetPosition(this.x, this.y);
      const a = Math.atan2(t.y - this.y, t.x - this.x);
      const speed = 14;
      const damage = 5.5 + this.level * 1.5;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 14),
        this.y + Math.sin(a) * (this.radius + 14)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAbilityVoice();
    }

    if (this.mahapadmaTimer >= 10.0) {
      this.mahapadmaTimer = 0;
      opponent.timeStopFrozenTimer = 1.8;
      opponent.isFrozen = true;
      opponent.frozenTimer = 2.2;
      callbacks.playSound('freeze');
      callbacks.spawnShockwave?.(this.x, this.y, '#38bdf8', 210);
      this.floatingTexts.push({
        text: '🧊 MAHAPADMA!',
        x: this.x,
        y: this.y - this.radius - 30,
        alpha: 1,
        color: '#bae6fd',
        vy: -1.2,
      });
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#38bdf8', '🧊 ICE SPEAR');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#e0f2fe', 12);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#38bdf8', 9);

      const a = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-13, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }

  // Ice Characters (Aokiji, Todoroki, Esdeath): Push jagged cyan polygon shapes (shards) that explode outward and fade
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new ShardParticle(this.x, this.y, '#0284c7'));
    }
  }
}

// 20. AokijiBall (❄️) - One Piece: Ice Age Frost Trail & Pheasant Beak
export class Aokiji extends Ball {
  beakTimer = 0.9;
  icePatches: { x: number; y: number; life: number }[] = [];
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#0ea5e9', '#bae6fd', name, hp, 'aokiji', '❄️');
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playIceCollisionChime(1.0, 'aokiji');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.beakTimer = 0.9;
    this.icePatches = [];
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.beakTimer -= dt;
    if (Math.random() < 0.25) {
      this.icePatches.push({ x: this.x, y: this.y, life: 2.8 });
    }
    for (let i = this.icePatches.length - 1; i >= 0; i--) {
      const ip = this.icePatches[i];
      ip.life -= dt;
      if (Math.hypot(opponent.x - ip.x, opponent.y - ip.y) <= opponent.radius + 31) {
        opponent.waterSlowTimer = 0.25;
      }
      if (ip.life <= 0) this.icePatches.splice(i, 1);
    }

    if (this.beakTimer <= 0) {
      this.beakTimer = 3.8;
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const speed = 13;
      const damage = 8.5 + this.level * 2.0;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 14),
        this.y + Math.sin(a) * (this.radius + 14)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAbilityVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.isFrozen = true;
        opponent.frozenTimer = 1.5;
        opponent.takeDamage(p.damage, '#38bdf8', '❄️ PHEASANT BEAK!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('freeze');
        callbacks.spawnSparks(p.x, p.y, '#bae6fd', 18);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    for (const ip of this.icePatches) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, ip.life * 0.25);
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(ip.x, ip.y, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#0ea5e9', 10);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-14, -7);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-14, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }

  // Ice Characters (Aokiji, Todoroki): Push jagged cyan polygon shapes (shards) that explode outward and fade
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new ShardParticle(this.x, this.y, '#22d3ee'));
    }
  }
}

/* ==========================================================================
   BATCH 5 (ASSASSINS & SPEED): Killua, Koro-sensei, Yoruichi, Minato, Sonic
   ========================================================================== */

// 21. KilluaBall (⚡) - HxH: Godspeed Whirlwind (+35% speed, auto-zap & projectile parry)
export class Killua extends Ball {
  zapTimer = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#38bdf8', '#60a5fa', name, hp, 'killua', '⚡');
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.zapTimer += dt;

    // Godspeed Whirlwind: automatically intercepts enemy projectiles within 1.3x scaled radius
    consumeEnemyProjectilesWithinRadius(this, opponent, this.radius + 47, (px, py) => {
      callbacks.spawnSparks(px, py, '#38bdf8', 8);
      this.playAbilityVoice();
    });

    if (this.zapTimer >= 1.4 && Math.hypot(opponent.x - this.x, opponent.y - this.y) <= this.radius + opponent.radius + 124) {
      this.zapTimer = 0;
      const dmg = 4.5 + this.level * 1.2;
      opponent.takeDamage(dmg, '#38bdf8', '⚡ NARUKAMI ZAP!');
      this.recordDamageDealt(dmg, callbacks);
      this.playAttackVoice();
      callbacks.spawnSparks(opponent.x, opponent.y, '#93c5fd', 14);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    ctx.strokeStyle = '#93c5fd';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    super.draw(ctx);
  }

  // Ninja/Speed Characters: Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
    for (let i = 0; i < 20; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#38bdf8'));
    }
  }
}

// 22. KoroSenseiBall (🐙) - Assassination Classroom: Mach 20 Afterimages & Evasion
export class KoroSensei extends Ball {
  afterimages: { x: number; y: number; alpha: number }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#facc15', '#eab308', name, hp, 'korosensei', '🐙');
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (Math.random() < 0.45) {
      this.afterimages.push({ x: this.x, y: this.y, alpha: 0.55 });
    }
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= dt * 1.8;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    for (const a of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha * 0.45);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(a.x, a.y, this.radius * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    super.draw(ctx);
  }

  // Ninja/Speed Characters: Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
  }
}

// 23. YoruichiBall (🐈‍⬛) - Bleach: Shunpo Flash Step & Shunko Lightning Burst
export class Yoruichi extends Ball {
  shunpoTimer = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#9333ea', '#facc15', name, hp, 'yoruichi', '🐈‍⬛');
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.shunpoTimer += dt;
    if (this.shunpoTimer >= 3.5) {
      this.shunpoTimer = 0;
      const angle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const destX = Math.max(390, Math.min(890, opponent.x + Math.cos(angle) * (opponent.radius + this.radius + 12)));
      const destY = Math.max(110, Math.min(610, opponent.y + Math.sin(angle) * (opponent.radius + this.radius + 12)));
      this.x = destX;
      this.y = destY;
      const dmg = 8.5 + this.level * 2.0;
      opponent.takeDamage(dmg, '#facc15', '🐈‍⬛ SHUNKO RAIJIN!');
      this.recordDamageDealt(dmg, callbacks);
      this.playAbilityVoice();
      callbacks.playSound('teleport');
      callbacks.spawnShockwave?.(this.x, this.y, '#facc15', 110);
      callbacks.spawnSparks(opponent.x, opponent.y, '#c084fc', 18);
    }
  }

  // Ninja/Speed Characters: Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
  }
}

// 24. MinatoBall (🗡️) - Naruto: Flying Raijin Kunai Markers & Instant Rasengan Warp
export class Minato extends Ball {
  kunaiTimer = 0;
  warpTimer = 0;
  markedKunai: { x: number; y: number }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#facc15', '#38bdf8', name, hp, 'minato', '🗡️');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.kunaiTimer = 0;
    this.warpTimer = 0;
    this.markedKunai = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.kunaiTimer += dt;
    this.warpTimer += dt;

    if (this.kunaiTimer >= 2.0) {
      this.kunaiTimer = 0;
      if (this.markedKunai.length >= 4) this.markedKunai.shift();
      this.markedKunai.push({
        x: Math.max(390, Math.min(890, opponent.x + (Math.random() - 0.5) * 140)),
        y: Math.max(110, Math.min(610, opponent.y + (Math.random() - 0.5) * 140)),
      });
    }

    if (this.warpTimer >= 4.0 && this.markedKunai.length > 0) {
      this.warpTimer = 0;
      // Pick marked kunai closest to opponent
      let best = this.markedKunai[0];
      let bestD = Math.hypot(best.x - opponent.x, best.y - opponent.y);
      for (const k of this.markedKunai) {
        const d = Math.hypot(k.x - opponent.x, k.y - opponent.y);
        if (d < bestD) {
          best = k;
          bestD = d;
        }
      }
      this.x = best.x;
      this.y = best.y;
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      this.vx = Math.cos(a) * 15;
      this.vy = Math.sin(a) * 15;
      if (bestD <= opponent.radius + this.radius + 95) {
        const dmg = 10 + this.level * 2.2;
        opponent.takeDamage(dmg, '#38bdf8', '🗡️ FLYING RAIJIN RASENGAN!');
        this.recordDamageDealt(dmg, callbacks);
      }
      this.playAbilityVoice();
      callbacks.playSound('teleport');
      callbacks.spawnShockwave?.(this.x, this.y, '#facc15', 100);
      callbacks.spawnSparks(this.x, this.y, '#38bdf8', 18);
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    for (const k of this.markedKunai) {
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(-6, 4);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Ninja/Speed Characters: Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 30; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
  }
}

// 25. SonicBall (🥷) - OPM: Ten Shadows Burial & Exploding Shuriken
export class Sonic extends Ball {
  shurikenTimer = 0.7;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; rot: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#475569', '#a855f7', name, hp, 'sonic', '🥷');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.shurikenTimer = 0.7;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.shurikenTimer -= dt;
    if (this.shurikenTimer <= 0) {
      this.shurikenTimer = 2.3;
      const t = opponent.getTargetPosition(this.x, this.y);
      const a = Math.atan2(t.y - this.y, t.x - this.x);
      const speed = 15;
      const damage = 6.5 + this.level * 1.5;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 14),
        this.y + Math.sin(a) * (this.radius + 14)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage,
        rot: 0,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAbilityVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += dt * 22;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#a855f7', '🥷 WIND SHURIKEN!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('explosion');
        callbacks.spawnSparks(p.x, p.y, '#c084fc', 14);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#a855f7', 9);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4.5, -4.5);
        ctx.lineTo(13, 0);
        ctx.lineTo(4.5, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }

  // Ninja/Speed Characters (Naruto, Sonic): Push expanding white cloud particles to simulate a 'poof' smoke-bomb exit
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 32; i++) {
      particles.push(new CloudParticle(this.x, this.y));
    }
  }
}

/* ==========================================================================
   BATCH 6 (MAGIC & SUMMONERS): Megumin, Yami, Fushiguro, Lucy, Rimuru
   ========================================================================== */

// 26. MeguminBall (🧙‍♀️) - Konosuba: Continuous escalating Explosion casts without ever stopping!
export class Megumin extends Ball {
  chantTimer = 0;
  chantDuration = 4.2;
  hasCastExplosion = false;
  explosionHits = 0;
  explosionFlash = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#dc2626', '#facc15', name, hp, 'megumin', '🧙‍♀️');
    this.collisionDamageMultiplier = 1.0;
    this.mass = 28;
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.chantTimer = 0;
    this.hasCastExplosion = false;
    this.explosionHits = 0;
    this.explosionFlash = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.explosionFlash > 0) this.explosionFlash = Math.max(0, this.explosionFlash - dt * 1.4);
  }

  getNextExplosionDamage(): number {
    const nextHit = this.explosionHits + 1;
    // First hit deals 30 damage, then 27 base + continuous escalation (+6 per subsequent hit: 30, 33, 39, 45, 51...)
    return nextHit === 1 ? 30 : 27 + (nextHit - 1) * 6;
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.chantTimer += dt;

    if (this.chantTimer >= this.chantDuration) {
      this.chantTimer = 0;
      this.explosionHits += 1;
      this.explosionFlash = 1.0;
      this.screenShakeTimer = 0.85;
      // Never stop or zero velocity — Megumin keeps her full momentum!
      this.playAbilityVoice();
      callbacks.playSound('explosion');
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#facc15', Math.round(260 * 1.3));
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#ef4444', Math.round(200 * 1.3));
      callbacks.spawnSparks(opponent.x, opponent.y, '#fef08a', 55);

      // 30 damage on first hit, then 27 + continuous increase after each hit
      const explosionDmg =
        this.explosionHits === 1
          ? 30
          : 27 + (this.explosionHits - 1) * 6;
      const nextDmgPreview = 27 + this.explosionHits * 6;

      opponent.takeDamage(explosionDmg, '#ef4444', `🧙‍♀️ EXPLOSION #${this.explosionHits}!`, true, this);
      this.recordDamageDealt(explosionDmg, callbacks);
      this.floatingTexts.push({
        text: `🧙‍♀️ EXPLOSION #${this.explosionHits}! (-${explosionDmg} HP • NEXT: ${nextDmgPreview})`,
        x: this.x,
        y: this.y - this.radius - 38,
        alpha: 1.0,
        color: '#facc15',
        vy: -1.3,
      });
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    const p = Math.min(1, this.chantTimer / this.chantDuration);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 9;
    ctx.lineWidth = Math.round(4 * 1.3);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + Math.round((14 + p * 18) * 1.3), 0, Math.PI * 2 * p);
    ctx.stroke();
    ctx.restore();

    if (this.explosionFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.explosionFlash * 0.45;
      ctx.fillStyle = '#f97316';
      ctx.fillRect(350, 70, 580, 580);
      ctx.restore();
    }
    super.draw(ctx);
    if (this.explosionHits > 0) {
      ctx.save();
      ctx.font = `900 ${Math.round(11 * 1.3)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      const label = `💥 CASTS: ${this.explosionHits} (NEXT: ${this.getNextExplosionDamage()} DMG)`;
      ctx.strokeText(label, this.x, this.y - this.radius - 20);
      ctx.fillText(label, this.x, this.y - this.radius - 20);
      ctx.restore();
    }
  }

  // Fire Characters: Push large, rising orange and grey circle particles (smoke and embers)
  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
    for (let i = 0; i < 45; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
  }
}

// 27. YamiBall (🌑) - Black Clover: Dark Magic Projectile Black Hole & Dimension Slash
export class Yami extends Ball {
  slashTimer = 0;
  slashLine: { x1: number; y1: number; x2: number; y2: number; alpha: number } | null = null;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#1e1b4b', '#7e22ce', name, hp, 'yami', '🌑');
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.slashLine) {
      this.slashLine.alpha -= dt * 2.0;
      if (this.slashLine.alpha <= 0) this.slashLine = null;
    }
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    // Dark Magic Black Hole: absorbs nearby enemy projectiles
    consumeEnemyProjectilesWithinRadius(this, opponent, this.radius + 44, (px, py) => {
      callbacks.spawnSparks(px, py, '#a855f7', 6);
    });

    this.slashTimer += dt;
    if (this.slashTimer >= 4.5) {
      this.slashTimer = 0;
      this.slashLine = { x1: this.x, y1: this.y, x2: opponent.x, y2: opponent.y, alpha: 1.0 };
      const dmg = 11.5 + this.level * 2.2;
      opponent.takeDamage(dmg, '#7e22ce', '🌑 DIMENSION SLASH!', true);
      this.recordDamageDealt(dmg, callbacks);
      this.playAbilityVoice();
      callbacks.playSound('slice');
      callbacks.spawnSparks(opponent.x, opponent.y, '#c084fc', 20);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    if (this.slashLine) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.slashLine.alpha);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(this.slashLine.x1, this.slashLine.y1);
      ctx.lineTo(this.slashLine.x2, this.slashLine.y2);
      ctx.stroke();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }
    super.draw(ctx);
  }
}

// 28. FushiguroBall (🐺) - JJK: Summons Animal Canvas Shapes (Divine Dog & Nue) that Move at 30% Ball Speed & Evolve Shape Every 5 Hits
export class Fushiguro extends Ball {
  shadowHits = 0;
  evolutionStage = 0;
  shikigami: { x: number; y: number; vx: number; vy: number; kind: 'dog' | 'nue'; bitCooldown: number }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#0f172a', '#3b82f6', name, hp, 'fushiguro', '🐺');
    this.spawnShikigami(x, y);
  }

  private spawnShikigami(x: number, y: number) {
    this.shadowHits = 0;
    this.evolutionStage = 0;
    this.shikigami = [
      { x: x - 58, y: y - 52, vx: 1.5, vy: 1.5, kind: 'dog', bitCooldown: 0 },
      { x: x + 58, y: y + 52, vx: -1.5, vy: 1.5, kind: 'nue', bitCooldown: 0 },
    ];
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.spawnShikigami(x, y);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // Shadows move at 30% of Fushiguro ball's speed (with a minimum baseline so they still creep if Fushiguro is momentarily still)
    const ballSpeed = Math.max(7.5, Math.hypot(this.vx, this.vy));
    const baseShadowSpeed = ballSpeed * 0.3;
    const evoSizeBonus = this.evolutionStage * 9;

    for (const s of this.shikigami) {
      if (s.bitCooldown > 0) s.bitCooldown -= dt;
      const prevX = s.x;
      const prevY = s.y;
      const a = Math.atan2(opponent.y - s.y, opponent.x - s.x);
      const spd = baseShadowSpeed * (s.kind === 'nue' ? 1.06 : 1.0);
      s.vx = Math.cos(a) * spd;
      s.vy = Math.sin(a) * spd;
      s.x += s.vx;
      s.y += s.vy;

      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, s.x, s.y);
      if (dist <= opponent.radius + Math.max(35 + evoSizeBonus, spd || 30) && s.bitCooldown <= 0) {
        s.bitCooldown = Math.max(0.85, 1.4 - this.evolutionStage * 0.1);
        this.shadowHits += 1;

        const dmg = 3.5 + this.level * 1.0 + this.evolutionStage * 2.4;
        const dogLabel =
          this.evolutionStage >= 3
            ? '🐺 MAHORAGA ADAPTIVE SLASH!'
            : this.evolutionStage === 2
            ? '🐺 CERBERUS ABYSSAL FANG!'
            : this.evolutionStage === 1
            ? '🐺 TOTALITY WEREWOLF CLAW!'
            : '🐺 DIVINE DOG!';
        const nueLabel =
          this.evolutionStage >= 3
            ? '🦅 GARUDA SOVEREIGN TEMPEST!'
            : this.evolutionStage === 2
            ? '🦅 CHIMERA BEAST AGITO!'
            : this.evolutionStage === 1
            ? '🦅 GREAT THUNDERBIRD NUE!'
            : '🦅 NUE SHOCK!';

        opponent.takeDamage(dmg, this.evolutionStage >= 2 ? '#a855f7' : '#1e293b', s.kind === 'dog' ? dogLabel : nueLabel);
        this.recordDamageDealt(dmg, callbacks);
        this.playAttackVoice();
        callbacks.spawnSparks(
          opponent.x,
          opponent.y,
          this.evolutionStage >= 2 ? '#c084fc' : this.evolutionStage === 1 ? '#38bdf8' : '#60a5fa',
          10 + this.evolutionStage * 4
        );

        // Both shadows evolve their form & shape after every 5 hits!
        if (this.shadowHits % 5 === 0) {
          this.evolutionStage += 1;
          const evoTitle =
            this.evolutionStage === 1
              ? '🐺 SHADOW EVOLUTION I: TOTALITY & GREAT NUE!'
              : this.evolutionStage === 2
              ? '🐺 SHADOW EVOLUTION II: CERBERUS & AGITO CHIMERA!'
              : `🐺 SHADOW EVOLUTION ${this.evolutionStage}: SOVEREIGN BEASTS!`;

          this.floatingTexts.push({
            text: evoTitle,
            x: this.x,
            y: this.y - this.radius - 34,
            alpha: 1.0,
            color: '#a855f7',
            vy: -1.5,
          });

          callbacks.playSound('crit');
          for (const sh of this.shikigami) {
            callbacks.spawnShockwave?.(sh.x, sh.y, '#a855f7', 95 + this.evolutionStage * 18);
            callbacks.spawnSparks(sh.x, sh.y, '#c084fc', 18);
          }
        }
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Relative shape & scale evolution every 5 hits (scaled 1.3x)
    const scaleFactor = 1.3 * (1.0 + Math.min(1.4, this.evolutionStage * 0.28));
    const strokeCol =
      this.evolutionStage >= 3
        ? '#f43f5e'
        : this.evolutionStage === 2
        ? '#a855f7'
        : this.evolutionStage === 1
        ? '#38bdf8'
        : '#3b82f6';

    for (const s of this.shikigami) {
      const a = Math.atan2(s.vy, s.vx);
      ctx.save();
      ctx.translate(s.x, s.y);

      // Evolved shadow puddle / dharma wheel aura ring beneath shikigami
      if (this.evolutionStage > 0) {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Stage 3+: Eight-Handled Sword Divergent Sila Dharma Wheel spokes
        if (this.evolutionStage >= 3) {
          for (let sp = 0; sp < 8; sp++) {
            const sa = (sp * Math.PI) / 4 + this.roundElapsed * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * 23 * scaleFactor, Math.sin(sa) * 23 * scaleFactor);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      ctx.rotate(a);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.5;

      if (s.kind === 'dog') {
        if (this.evolutionStage === 0) {
          // Stage 0: Base Wolf Head Silhouette (Divine Dog)
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(3, -10);
          ctx.lineTo(-10, -14);
          ctx.lineTo(-6, -4);
          ctx.lineTo(-14, 0);
          ctx.lineTo(-6, 4);
          ctx.lineTo(-10, 14);
          ctx.lineTo(3, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (this.evolutionStage === 1) {
          // Stage 1 (5 Hits): Divine Dog: Totality (Bipedal Dire Werewolf with Outstretched Slash Claws & Twin Tails)
          ctx.beginPath();
          ctx.moveTo(22, 0); // Snout
          ctx.lineTo(8, -10);
          ctx.lineTo(16, -20); // Upper slash claw
          ctx.lineTo(0, -15);
          ctx.lineTo(-14, -18); // Swept ear
          ctx.lineTo(-10, -6);
          ctx.lineTo(-22, -9); // Twin tail 1
          ctx.lineTo(-15, 0);
          ctx.lineTo(-22, 9); // Twin tail 2
          ctx.lineTo(-10, 6);
          ctx.lineTo(-14, 18); // Swept ear
          ctx.lineTo(0, 15);
          ctx.lineTo(16, 20); // Lower slash claw
          ctx.lineTo(8, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(8, -4, 2.3, 0, Math.PI * 2);
          ctx.arc(8, 4, 2.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Stage 2+ (10+ Hits): Three-Headed Shadow Cerberus / Sovereign Beast with Jagged Mane & Triple Fangs
          ctx.beginPath();
          ctx.moveTo(26, 0); // Center jaw tip
          ctx.lineTo(12, -7);
          ctx.lineTo(22, -16); // Left head snout
          ctx.lineTo(4, -18);
          ctx.lineTo(-8, -24); // Outer horn crest
          ctx.lineTo(-12, -10);
          ctx.lineTo(-26, -14); // Shadow cape spike
          ctx.lineTo(-19, 0);
          ctx.lineTo(-26, 14); // Shadow cape spike
          ctx.lineTo(-12, 10);
          ctx.lineTo(-8, 24); // Outer horn crest
          ctx.lineTo(4, 18);
          ctx.lineTo(22, 16); // Right head snout
          ctx.lineTo(12, 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 3 pairs of glowing crimson eyes across the 3 Cerberus heads
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(12, -2.5, 2.2, 0, Math.PI * 2);
          ctx.arc(12, 2.5, 2.2, 0, Math.PI * 2);
          ctx.arc(10, -12, 2.0, 0, Math.PI * 2);
          ctx.arc(10, 12, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        if (this.evolutionStage === 0) {
          // Stage 0: Base Nue Winged Silhouette
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-2, -18);
          ctx.lineTo(-10, -4);
          ctx.lineTo(-15, 0);
          ctx.lineTo(-10, 4);
          ctx.lineTo(-2, 18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (this.evolutionStage === 1) {
          // Stage 1 (5 Hits): Great Thunderbird Nue (4 Swept Pinions + Forked Lightning Tail)
          ctx.beginPath();
          ctx.moveTo(20, 0); // Beak
          ctx.lineTo(4, -10);
          ctx.lineTo(2, -26); // Primary outer wingtip
          ctx.lineTo(-8, -14);
          ctx.lineTo(-14, -22); // Secondary pinion
          ctx.lineTo(-12, -5);
          ctx.lineTo(-24, -8); // Forked lightning tail top
          ctx.lineTo(-16, 0);
          ctx.lineTo(-24, 8); // Forked lightning tail bottom
          ctx.lineTo(-12, 5);
          ctx.lineTo(-14, 22); // Secondary pinion
          ctx.lineTo(-8, 14);
          ctx.lineTo(2, 26); // Primary outer wingtip
          ctx.lineTo(4, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Golden thunder crest
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(6, -14);
          ctx.lineTo(-4, 0);
          ctx.lineTo(6, 14);
          ctx.stroke();
        } else {
          // Stage 2+ (10+ Hits): Chimera Beast Agito (6 Seraphic Wings, Serpent Tail & Horned Crown)
          ctx.beginPath();
          ctx.moveTo(25, 0); // Crowned Dragon/Bird Head
          ctx.lineTo(14, -8);
          ctx.lineTo(10, -28); // Fore seraph wing
          ctx.lineTo(-2, -16);
          ctx.lineTo(-8, -30); // Mid seraph wing
          ctx.lineTo(-14, -12);
          ctx.lineTo(-28, -16); // Serpent tail whip
          ctx.lineTo(-20, 0);
          ctx.lineTo(-28, 16); // Serpent tail whip
          ctx.lineTo(-14, 12);
          ctx.lineTo(-8, 30); // Mid seraph wing
          ctx.lineTo(-2, 16);
          ctx.lineTo(10, 28); // Fore seraph wing
          ctx.lineTo(14, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Violet-gold Chimera core & lightning arcs
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(8, -18);
          ctx.lineTo(-6, 0);
          ctx.lineTo(8, 18);
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    super.draw(ctx);
  }
}

// 29. LucyBall (🗝️) - Fairy Tail: Celestial Spirit Gates & Starlight Barrage
export class Lucy extends Ball {
  starTimer = 0.7;
  gateAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#facc15', '#38bdf8', name, hp, 'lucy', '🗝️');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.starTimer = 0.7;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.gateAngle += dt * 2.5;
    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.starTimer = 2.1;
      const gatePos = clampProjectileSpawn(
        this.x + Math.cos(this.gateAngle) * (this.radius + 26),
        this.y + Math.sin(this.gateAngle) * (this.radius + 26)
      );
      const a = Math.atan2(opponent.y - gatePos.y, opponent.x - gatePos.x);
      const speed = 12.5;
      const damage = 5.5 + this.level * 1.4;
      this.projectiles.push({
        x: gatePos.x,
        y: gatePos.y,
        prevX: gatePos.x,
        prevY: gatePos.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage,
        trail: [],
      });
      this.playAbilityVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#facc15', '🗝️ URANO METRIA!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#fef08a', 12);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#facc15', 9);

      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }
}

// 30. RimuruBall (💧) - Slime: Predator Projectile Absorption & Black Lightning Spit
export class Rimuru extends Ball {
  absorbedCount = 0;
  spitTimer = 0.8;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#38bdf8', '#0284c7', name, hp, 'rimuru', '💧');
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playLiquidCollisionSplash(1.06, 'rimuru');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.absorbedCount = 0;
    this.spitTimer = 0.8;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    // Predator: absorbs enemy projectiles to heal and build charge!
    consumeEnemyProjectilesWithinRadius(this, opponent, this.radius + 55, (px, py) => {
      this.absorbedCount++;
      this.heal(4);
      this.playAbilityVoice();
      callbacks.spawnSparks(px, py, '#38bdf8', 10);
      this.floatingTexts.push({
        text: '💧 PREDATOR ABSORB!',
        x: this.x,
        y: this.y - this.radius - 26,
        alpha: 1,
        color: '#38bdf8',
        vy: -1.2,
      });
    });

    this.spitTimer -= dt;
    if (this.spitTimer <= 0) {
      this.spitTimer = 2.8;
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const speed = 13;
      const damage = 6 + this.absorbedCount * 2.5 + this.level * 1.5;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 14),
        this.y + Math.sin(a) * (this.radius + 14)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#38bdf8', '💧 WATER BLADE!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#bae6fd', 14);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, (p as any).trail, '#38bdf8', 9);

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);
  }
}

/* ==========================================================================
   BATCH 7 (SNIPERS & GUNNERS): Vash, Death The Kid, Sinon, Riza Hawkeye
   ========================================================================== */

// 32. VashBall (🔫) - Trigun: Detailed Silver Revolver & Ricocheting Silver Shots
export class Vash extends Ball {
  shotTimer = 0.6;
  aimAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; bounces: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#dc2626', '#facc15', name, hp, 'vash', '🔫');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 20;
    this.archetype = 'Ranged';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.shotTimer = 0.6;
    this.projectiles = [];
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#cbd5e1', 7);

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#e2e8f0';
      ctx.shadowBlur = 10;

      const grad = ctx.createLinearGradient(-12.5, -4, 12.5, 4);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(-12.5, -4, 25, 8);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-12.5, -4, 25, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw scaled detailed silver revolver (1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const gunX = this.radius / 1.3 + 8;

    // Silver Barrel
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.fillRect(gunX, -6, 28, 12);
    ctx.strokeRect(gunX, -6, 28, 12);

    // Revolver Cylinder
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(gunX - 8, -8, 12, 16);
    ctx.strokeRect(gunX - 8, -8, 12, 16);

    // Dark Grip
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(gunX - 11, 6, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    this.shotTimer -= dt;
    if (this.shotTimer <= 0) {
      this.shotTimer = 2.2;
      const fireSpeed = 16;
      const dmg = 6.0 + this.level * 1.5;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(this.aimAngle) * (this.radius + 22),
        this.y + Math.sin(this.aimAngle) * (this.radius + 22)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(this.aimAngle) * fireSpeed,
        vy: Math.sin(this.aimAngle) * fireSpeed,
        speed: fireSpeed,
        damage: dmg,
        bounces: 3,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
      callbacks.spawnSparks(this.x, this.y, '#e2e8f0', 8);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);

      if ((p.x <= 355 || p.x >= 925) && p.bounces > 0) {
        p.x = Math.max(356, Math.min(924, p.x));
        p.vx = -p.vx;
        p.bounces--;
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#fef08a', 6);
      }
      if ((p.y <= 75 || p.y >= 645) && p.bounces > 0) {
        p.y = Math.max(76, Math.min(644, p.y));
        p.vy = -p.vy;
        p.bounces--;
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#fef08a', 6);
      }

      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#dc2626', '🔫 RICOCHET REVOLVER SHOT!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#fef08a', 14);
      } else if (p.x < 330 || p.x > 950 || p.y < 50 || p.y > 670) {
        this.projectiles.splice(i, 1);
      }
    }
  }
}

// 33. DeathTheKidBall (💀) - Soul Eater: Symmetrical Dual Demon Twin Pistols
export class DeathKid extends Ball {
  twinTimer = 0.6;
  aimAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#0f172a', '#facc15', name, hp, 'deaththekid', '💀');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 22;
    this.archetype = 'Ranged';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.twinTimer = 0.6;
    this.projectiles = [];
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#facc15', 7);

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 11;

      const grad = ctx.createLinearGradient(-12.5, -4, 12.5, 4);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(-12.5, -4, 25, 8);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-12.5, -4, 25, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw dual scaled twin pistols (1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const px = this.radius / 1.3 - 2;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(px, side * ((this.radius / 1.3) * 0.72));

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.2;
      ctx.fillRect(0, -5, 25, 10);
      ctx.strokeRect(0, -5, 25, 10);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6, -3.5, 11, 7);
      ctx.restore();
    }
    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    this.twinTimer -= dt;
    if (this.twinTimer <= 0) {
      this.twinTimer = 2.2;
      const perpX = -Math.sin(this.aimAngle) * 24;
      const perpY = Math.cos(this.aimAngle) * 24;
      const fireSpeed = 17;
      const dmg = 4.0 + this.level * 1.1;
      const spawn1 = clampProjectileSpawn(
        this.x + perpX + Math.cos(this.aimAngle) * (this.radius + 18),
        this.y + perpY + Math.sin(this.aimAngle) * (this.radius + 18)
      );
      const spawn2 = clampProjectileSpawn(
        this.x - perpX + Math.cos(this.aimAngle) * (this.radius + 18),
        this.y - perpY + Math.sin(this.aimAngle) * (this.radius + 18)
      );

      this.projectiles.push(
        {
          x: spawn1.x,
          y: spawn1.y,
          prevX: this.x + perpX,
          prevY: this.y + perpY,
          vx: Math.cos(this.aimAngle) * fireSpeed,
          vy: Math.sin(this.aimAngle) * fireSpeed,
          speed: fireSpeed,
          damage: dmg,
          trail: [{ x: this.x + perpX, y: this.y + perpY }],
        },
        {
          x: spawn2.x,
          y: spawn2.y,
          prevX: this.x - perpX,
          prevY: this.y - perpY,
          vx: Math.cos(this.aimAngle) * fireSpeed,
          vy: Math.sin(this.aimAngle) * fireSpeed,
          speed: fireSpeed,
          damage: dmg,
          trail: [{ x: this.x - perpX, y: this.y - perpY }],
        }
      );
      this.playAttackVoice();
      callbacks.spawnSparks(this.x, this.y, '#facc15', 12);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#facc15', '💀 DEATH CANNON BLAST!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#facc15', 10);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }
}

// 34. SinonBall (🎯) - SAO: Hecate II Anti-Materiel Sniper with Laser Sight
export class Sinon extends Ball {
  hecateTimer = 0.8;
  aimAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#0d9488', '#2dd4bf', name, hp, 'sinon', '🎯');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 22;
    this.archetype = 'Ranged';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.hecateTimer = 0.8;
    this.projectiles = [];
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#2dd4bf', 11);

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 14;

      const grad = ctx.createLinearGradient(-20, -7, 20, 7);
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#0f766e');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(-20, -7, 40, 14);

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-20, -7, 40, 14);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw long scaled dark-green Hecate II sniper rifle (1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const rBase = this.radius / 1.3;
    const gunX = rBase + 6;
    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2.5;
    ctx.fillRect(gunX - 8, -6, 28, 12);
    ctx.strokeRect(gunX - 8, -6, 28, 12);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gunX + 20, -3.5, 25, 7);

    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(gunX + 45, -6, 8, 12);

    ctx.fillStyle = '#0f766e';
    ctx.fillRect(gunX + 6, -11, 14, 5);

    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    this.hecateTimer -= dt;
    if (this.hecateTimer <= 0) {
      this.hecateTimer = 3.2;
      const fireSpeed = 22;
      const dmg = 9.5 + this.level * 2.2;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(this.aimAngle) * (this.radius + 24),
        this.y + Math.sin(this.aimAngle) * (this.radius + 24)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(this.aimAngle) * fireSpeed,
        vy: Math.sin(this.aimAngle) * fireSpeed,
        speed: fireSpeed,
        damage: dmg,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
      callbacks.spawnSparks(spawn.x, spawn.y, '#2dd4bf', 14);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#2dd4bf', '🎯 HECATE II HEAVY BURST!');
        opponent.vx += p.vx * 0.45;
        opponent.vy += p.vy * 0.45;
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#5eead4', 18);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }
}

// 35. RizaHawkeyeBall (🦅) - FMA: Dark Grey Handgun & Rapid 3-Round Blue Burst
export class Hawkeye extends Ball {
  burstTimer = 0.7;
  aimAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#1e3a8a', '#93c5fd', name, hp, 'hawkeye', '🦅');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 22;
    this.archetype = 'Ranged';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.burstTimer = 0.7;
    this.projectiles = [];
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#3b82f6', 7);

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 10;

      const grad = ctx.createLinearGradient(-12.5, -4, 12.5, 4);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(-12.5, -4, 25, 8);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-12.5, -4, 25, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw scaled dark grey handgun (1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const gunX = this.radius / 1.3 + 8;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.fillRect(gunX - 4, -5, 22, 10);
    ctx.strokeRect(gunX - 4, -5, 22, 10);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gunX - 10, 0, 8, 9);

    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      this.burstTimer = 2.8;
      const dmg = 3.2 + this.level * 0.9;
      for (let k = 0; k < 3; k++) {
        const spd = 16 + k * 2.2;
        const spawn = clampProjectileSpawn(
          this.x + Math.cos(this.aimAngle) * (this.radius + 18),
          this.y + Math.sin(this.aimAngle) * (this.radius + 18)
        );
        this.projectiles.push({
          x: spawn.x,
          y: spawn.y,
          prevX: this.x,
          prevY: this.y,
          vx: Math.cos(this.aimAngle) * spd,
          vy: Math.sin(this.aimAngle) * spd,
          speed: spd,
          damage: dmg,
          trail: [{ x: this.x, y: this.y }],
        });
      }
      this.playAttackVoice();
      callbacks.spawnSparks(this.x, this.y, '#60a5fa', 10);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#60a5fa', '🦅 PINPOINT BURST SHOT!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('hit');
        callbacks.spawnSparks(p.x, p.y, '#bfdbfe', 8);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }
}

/* ==========================================================================
   BATCH 8 (HEAVY HITTERS): Escanor, Whitebeard, Kenpachi, All Might, Broly
   ========================================================================== */

// 36. EscanorBall (☀️) - Seven Deadly Sins: Divine Axe Rhitta, Growing Size & Cruel Sun
export class Escanor extends Ball {
  baseRadius: number;
  sunTimer = 0.8;
  aimAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 48, '#f59e0b', '#fef08a', name, hp, 'escanor', '☀️');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 48;
    this.baseRadius = this.radius;
    this.archetype = 'Fire';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.radius = this.baseRadius;
    this.mass = 48;
    this.sunTimer = 0.8;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const tPos = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(tPos.y - this.y, tPos.x - this.x);

    const sizeGrowth = 1.0 + (this.roundElapsed ?? 0) * 0.02;
    this.radius = this.baseRadius * sizeGrowth;
    this.mass = 48 * Math.pow(sizeGrowth, 2);

    this.sunTimer -= dt;
    if (this.sunTimer <= 0) {
      this.sunTimer = 3.2;
      const fireSpeed = 14;
      const dmg = 5.5 + this.level * 1.2;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(this.aimAngle) * (this.radius + 22),
        this.y + Math.sin(this.aimAngle) * (this.radius + 22)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(this.aimAngle) * fireSpeed,
        vy: Math.sin(this.aimAngle) * fireSpeed,
        speed: fireSpeed,
        damage: dmg,
        trail: [{ x: this.x, y: this.y }],
      });

      this.playAbilityVoice();
      callbacks.playSound('explosion');
      callbacks.spawnSparks(this.x, this.y, '#f59e0b', 12);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);

      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#f59e0b', '☀️ CRUEL SUN!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('explosion');
        callbacks.spawnShockwave?.(p.x, p.y, '#facc15', 169);
        callbacks.spawnSparks(p.x, p.y, '#fef08a', 20);
      } else if (p.x < 330 || p.x > 950 || p.y < 50 || p.y > 670) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  getSunshineMultiplier(): number {
    return 1.0 + Math.min(2.5, (this.roundElapsed ?? 0) * 0.06);
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#f59e0b', 12);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;

      // Normalized Cruel Sun fireball (visibly smaller than character radius)
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw scaled Divine Axe Rhitta (1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const axeX = this.radius / 1.3 + 8;

    ctx.fillStyle = '#ca8a04';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.8;
    ctx.fillRect(axeX - 5, -4, 28, 8);
    ctx.strokeRect(axeX - 5, -4, 28, 8);

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(axeX + 22, 0, 22, -Math.PI * 0.45, Math.PI * 0.45, false);
    ctx.lineTo(axeX + 14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();

    this.drawCenterIcon(ctx);
  }

  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'smoke'));
    }
    for (let i = 0; i < 45; i++) {
      particles.push(new RisingCircleParticle(this.x, this.y, 'ember'));
    }
  }
}

// 37. WhitebeardBall (🌊) - One Piece: Bisento & Screen-Shaking Air Fracture Quakes
export class Whitebeard extends Ball {
  quakeTimer = 0;
  crackVisualTimer = 0;
  aimAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 65, '#f8fafc', '#38bdf8', name, hp, 'whitebeard', '🌊');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 65;
    this.archetype = 'Void';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(0.88, 'whitebeard');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.quakeTimer = 0;
    this.crackVisualTimer = 0;
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.crackVisualTimer > 0) this.crackVisualTimer = Math.max(0, this.crackVisualTimer - dt * 1.8);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    this.quakeTimer += dt;
    if (this.quakeTimer >= 4.5) {
      this.quakeTimer = 0;
      this.crackVisualTimer = 1.2;
      this.screenShakeTimer = 0.8; // Screen shaking quake!

      const dmg = 9.5 + this.level * 2.2;
      opponent.takeDamage(dmg, '#38bdf8', '🌊 GURA GURA QUAKE!');
      this.recordDamageDealt(dmg, callbacks);

      // Heavily repels opponent
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      opponent.vx += Math.cos(a) * 18;
      opponent.vy += Math.sin(a) * 18;

      this.playAbilityVoice();
      callbacks.playSound('explosion');
      callbacks.spawnShockwave?.(this.x, this.y, '#ffffff', 312);
      callbacks.spawnSparks(opponent.x, opponent.y, '#e0f2fe', 26);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Glass-like air fracture lines during Quake
    if (this.crackVisualTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, this.crackVisualTimer);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.5;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + 0.2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const len = 143;
        const midX = this.x + Math.cos(a) * (len * 0.5) + (Math.random() - 0.5) * 26;
        const midY = this.y + Math.sin(a) * (len * 0.5) + (Math.random() - 0.5) * 26;
        ctx.lineTo(midX, midY);
        ctx.lineTo(this.x + Math.cos(a) * len, this.y + Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.restore();
    }

    super.draw(ctx);

    // Draw long white Bisento polearm extending from ball body (scaled 1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const bX = this.radius / 1.3 + 4;
    // Dark brown/red wooden shaft
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bX - 6, -3, 26, 6);

    // Gold Guard ring
    ctx.fillStyle = '#eab308';
    ctx.fillRect(bX + 20, -5, 4, 10);

    // Long curved silver Bisento blade
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX + 24, -4);
    ctx.quadraticCurveTo(bX + 38, -12, bX + 46, -18);
    ctx.quadraticCurveTo(bX + 36, 0, bX + 24, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

// 38. KenpachiBall (👹) - Bleach: Chipped Katana & Berserker HP Golden Aura
export class Kenpachi extends Ball {
  aimAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 55, '#ca8a04', '#facc15', name, hp, 'kenpachi', '👹');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 55;
    this.archetype = 'Slash';
  }

  override updateSpecial(dt: number, opponent: Ball, _callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);
  }

  getBerserkMultiplier(): number {
    const missingRatio = 1 - Math.max(0, this.health / Math.max(1, this.maxHealth));
    // Base 1.0 + up to 1.65 multiplier bonus as HP drops (Berserker)
    return 1.0 + missingRatio * 1.65;
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Golden aura gets brighter and wider as HP decreases!
    const hpLossRatio = 1 - Math.max(0, this.health / Math.max(1, this.maxHealth));
    if (hpLossRatio > 0.05) {
      ctx.save();
      const auraRadius = this.radius + 8 + hpLossRatio * 31;
      ctx.fillStyle = 'rgba(250, 204, 21, ' + (0.2 + hpLossRatio * 0.5) + ')';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    super.draw(ctx);

    // Draw jagged, chipped katana aiming at opponent (scaled 1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const kX = this.radius / 1.3 + 4;
    // Dark handle & guard
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(kX - 4, -2.5, 12, 5);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(kX + 8, -5, 3, 10);

    // Jagged, chipped katana blade
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(kX + 11, -3);
    ctx.lineTo(kX + 24, -3);
    ctx.lineTo(kX + 26, -1); // chip cutout
    ctx.lineTo(kX + 28, -3);
    ctx.lineTo(kX + 40, -3);
    ctx.lineTo(kX + 46, 0);
    ctx.lineTo(kX + 38, 3);
    ctx.lineTo(kX + 36, 1); // chip cutout
    ctx.lineTo(kX + 34, 3);
    ctx.lineTo(kX + 11, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

// 39. AllMightBall (💪) - MHA: United States of Smash Air Tornado Shockwave
export class AllMight extends Ball {
  airBlastTimer = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 58, '#facc15', '#2563eb', name, hp, 'allmight', '💪');
    this.collisionDamageMultiplier = 1.6;
    this.mass = 58;
    this.archetype = 'Default';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(1.0, 'allmight');
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.airBlastTimer += dt;
    if (this.airBlastTimer >= 3.5 && Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 338) {
      this.airBlastTimer = 0;
      const dmg = 8.5 + this.level * 2.0;
      opponent.takeDamage(dmg, '#facc15', '💪 UNITED STATES OF SMASH!');
      this.recordDamageDealt(dmg, callbacks);
      this.playAbilityVoice();
      callbacks.playSound('explosion');

      // Spawns massive golden air-pressure tornado / shockwave at impact point
      callbacks.spawnShockwave?.(this.x, this.y, '#facc15', 234);
      callbacks.spawnShockwave?.(this.x, this.y, '#ffffff', 169);
      callbacks.spawnSparks(opponent.x, opponent.y, '#fef08a', 24);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Glowing One For All gold/blue energy aura
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 7 + Math.sin(Date.now() * 0.012) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    super.draw(ctx);
  }
}

// 40. BrolyBall (🟢) - DBZ: Neon-Green Shield & Eraser Cannon Barrage
export class Broly extends Ball {
  orbTimer = 0.7;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 60, '#22c55e', '#bef264', name, hp, 'broly', '🟢');
    this.collisionDamageMultiplier = 1.5;
    this.mass = 60;
    this.archetype = 'Void';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playHeavyCollisionBoom(0.90, 'titan');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.orbTimer = 0.7;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      this.orbTimer = 2.4;
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const dmg = 7.5 + this.level * 1.8;

      // Fires Eraser Cannon green energy sphere barrage!
      for (let k = -1; k <= 1; k += 2) {
        const spreadA = a + k * 0.14;
        const fireSpeed = 13.5;
        const spawn = clampProjectileSpawn(
          this.x + Math.cos(spreadA) * (this.radius + 18),
          this.y + Math.sin(spreadA) * (this.radius + 18)
        );
        this.projectiles.push({
          x: spawn.x,
          y: spawn.y,
          prevX: this.x,
          prevY: this.y,
          vx: Math.cos(spreadA) * fireSpeed,
          vy: Math.sin(spreadA) * fireSpeed,
          speed: fireSpeed,
          damage: dmg,
          trail: [{ x: this.x, y: this.y }],
        });
      }

      this.playAbilityVoice();
      callbacks.playSound('explosion');
      callbacks.spawnSparks(this.x, this.y, '#22c55e', 14);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);

      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#22c55e', '🟢 ERASER CANNON!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.playSound('explosion');
        callbacks.spawnShockwave?.(p.x, p.y, '#4ade80', 117);
        callbacks.spawnSparks(p.x, p.y, '#bef264', 18);
      } else if (p.x < 330 || p.x > 950 || p.y < 50 || p.y > 670) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#22c55e', 11);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 14;

      // Normalized Eraser Cannon green energy sphere
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Pulsating neon-green energy shield
    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 6 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 9 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    super.draw(ctx);
  }
}

/* ==========================================================================
   BATCH 9 (WEIRD & STRATEGIC): Hisoka, Shikamaru, Kurapika, Shigaraki, Katakuri
   ========================================================================== */

// 41. HisokaBall (🃏) - HxH: Floating Playing Cards & Bungee Gum High-Speed Snap
export class Hisoka extends Ball {
  gumAttached = false;
  gumPullCooldown = 0;
  gumTargetX = 0;
  gumTargetY = 0;
  cardRotation = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#ec4899', '#f472b6', name, hp, 'hisoka', '🃏');
    this.archetype = 'Void';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.gumAttached = false;
    this.gumPullCooldown = 0;
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.cardRotation += dt * 3.0;
    this.gumAttached = true;
    this.gumTargetX = opponent.x;
    this.gumTargetY = opponent.y;
    this.gumPullCooldown += dt;

    const dx = this.x - opponent.x;
    const dy = this.y - opponent.y;
    const dist = Math.hypot(dx, dy);

    // Elastic Bungee Gum spring pull when stretched beyond 220px!
    if (dist > 220 && this.gumPullCooldown >= 2.8) {
      this.gumPullCooldown = 0;
      // Snaps both balls together at extreme speed for catastrophic collision damage
      opponent.vx += (dx / dist) * 18.0;
      opponent.vy += (dy / dist) * 18.0;
      this.vx -= (dx / dist) * 10.0;
      this.vy -= (dy / dist) * 10.0;
      this.playAbilityVoice();
      callbacks.playSound('hit');
      callbacks.spawnSparks((this.x + opponent.x) / 2, (this.y + opponent.y) / 2, '#f472b6', 18);
      this.floatingTexts.push({
        text: '🃏 BUNGEE GUM SNAP!',
        x: this.x,
        y: this.y - this.radius - 26,
        alpha: 1,
        color: '#f472b6',
        vy: -1.2,
      });
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    if (this.gumAttached) {
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.gumTargetX, this.gumTargetY);
      ctx.stroke();
      ctx.restore();
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw floating playing cards rotating around him (scaled 1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    for (let i = 0; i < 4; i++) {
      const a = this.cardRotation + (i * Math.PI) / 2;
      const cx = Math.cos(a) * (this.radius + 18);
      const cy = Math.sin(a) * (this.radius + 18);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a + Math.PI / 2);
      ctx.scale(1.3, 1.3);

      // Playing Card
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-5, -7, 10, 14);
      ctx.strokeRect(-5, -7, 10, 14);

      // Pink suit symbol
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

// 42. ShikamaruBall (♟️) - Naruto: Floor Shadow Tracking & Shadow Possession Bind
export class Shikamaru extends Ball {
  shadowTimer = 0;
  bindActiveTimer = 0;
  shadowTargetX = 0;
  shadowTargetY = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#1e293b', '#10b981', name, hp, 'shikamaru', '♟️');
    this.archetype = 'Void';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.shadowTimer = 0;
    this.bindActiveTimer = 0;
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.shadowTargetX = opponent.x;
    this.shadowTargetY = opponent.y;

    if (this.bindActiveTimer > 0) {
      this.bindActiveTimer -= dt;
      // Shadow Possession Bind: opponent is forced to mirror Shikamaru's velocity perfectly for 1.6s!
      opponent.vx = this.vx;
      opponent.vy = this.vy;
    } else {
      this.shadowTimer += dt;
      if (this.shadowTimer >= 4.2 && Math.hypot(opponent.x - this.x, opponent.y - this.y) <= 416) {
        this.shadowTimer = 0;
        this.bindActiveTimer = 1.6;
        const dmg = 6.5 + this.level * 1.5;
        opponent.takeDamage(dmg, '#0f172a', '♟️ SHADOW POSSESSION BIND!');
        this.recordDamageDealt(dmg, callbacks);
        this.playAbilityVoice();
        callbacks.spawnSparks(opponent.x, opponent.y, '#10b981', 14);
      }
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    // Black shadow line extending across the floor tracking the opponent
    ctx.save();
    ctx.strokeStyle = this.bindActiveTimer > 0 ? '#000000' : 'rgba(15, 23, 42, 0.65)';
    ctx.lineWidth = this.bindActiveTimer > 0 ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.shadowTargetX, this.shadowTargetY);
    ctx.stroke();
    ctx.restore();
  }
}

// 43. KurapikaBall (⛓️) - HxH: 5 Dragging Metallic Chains & Emperor Time HP Siphon
export class Kurapika extends Ball {
  chainAngle = 0;
  chainTick = 0;
  aimAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#dc2626', '#facc15', name, hp, 'kurapika', '⛓️');
    this.archetype = 'Slash';
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.chainAngle += dt * 4.5;
    this.chainTick -= dt;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);
    if (dist <= this.radius + opponent.radius + 70 && this.chainTick <= 0) {
      this.chainTick = 0.75;
      const dmg = 4.5 + this.level * 1.2;
      opponent.takeDamage(dmg, '#dc2626', '⛓️ CHAIN JAIL SIPHON!');

      // Siphons 4.5 health from the enemy directly into Kurapika's HP bar!
      this.health = Math.min(this.maxHealth, this.health + dmg);

      this.recordDamageDealt(dmg, callbacks);
      this.playAttackVoice();
      callbacks.playSound('hit');
      callbacks.spawnSparks(opponent.x, opponent.y, '#facc15', 14);
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    // Draw 5 metallic chains dragging / rotating around him (scaled 1.3x, flashing red Emperor Time)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.chainAngle);
    ctx.strokeStyle = this.chainTick > 0 ? '#ef4444' : '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.setLineDash([7, 5]);

    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
      ctx.lineTo(Math.cos(a) * (this.radius + 50), Math.sin(a) * (this.radius + 50));
      ctx.stroke();

      // Ring/hook tip on each chain
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (this.radius + 50), Math.sin(a) * (this.radius + 50), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.setLineDash([]);
    ctx.restore();

    super.draw(ctx);
    this.drawCenterIcon(ctx);
  }
}

// 44. ShigarakiBall (🖐️) - MHA: Pale Grey Hand, Touch Decay & Ground Puddles
export class Shigaraki extends Ball {
  puddles: { x: number; y: number; life: number }[] = [];
  puddleTimer = 0;
  aimAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#581c87', '#a855f7', name, hp, 'shigaraki', '🖐️');
    this.archetype = 'Void';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.puddles = [];
    this.puddleTimer = 0;
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;

    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);

    // Leaves dark purple decaying puddles on the floor
    this.puddleTimer += dt;
    if (this.puddleTimer >= 1.8) {
      this.puddleTimer = 0;
      if (this.puddles.length >= 6) this.puddles.shift();
      this.puddles.push({ x: this.x, y: this.y, life: 5.0 });
    }

    // Update decay puddles
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const pd = this.puddles[i];
      pd.life -= dt;
      if (Math.hypot(opponent.x - pd.x, opponent.y - pd.y) <= opponent.radius + 29) {
        opponent.decayTimer = 3.6;
      }
      if (pd.life <= 0) this.puddles.splice(i, 1);
    }

    // Any direct touch infects opponent with Decay (continuous 2.0 per tick damage for 3.6s)
    if (Math.hypot(opponent.x - this.x, opponent.y - this.y) <= this.radius + opponent.radius + 31) {
      if ((opponent.decayTimer ?? 0) <= 0.2) {
        this.playAbilityVoice();
        callbacks.spawnSparks(opponent.x, opponent.y, '#a855f7', 16);
      }
      opponent.decayTimer = 3.6;
    }
  }

  override drawBackground(ctx: CanvasRenderingContext2D) {
    for (const pd of this.puddles) {
      ctx.save();
      ctx.fillStyle = 'rgba(88, 28, 135, 0.45)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(pd.x, pd.y, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    super.draw(ctx);

    // Draw pale grey hand grabbing the front of his ball (scaled 1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const hX = this.radius / 1.3 - 4;
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8;

    // Palm base
    ctx.beginPath();
    ctx.arc(hX, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5 grasping fingers
    for (let k = -2; k <= 2; k++) {
      const fa = k * 0.35;
      ctx.beginPath();
      ctx.moveTo(hX, 0);
      ctx.lineTo(hX + Math.cos(fa) * 16, Math.sin(fa) * 16);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(hX + Math.cos(fa) * 16, Math.sin(fa) * 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.drawCenterIcon(ctx);
  }
}

// 45. KatakuriBall (🍩) - One Piece: Silver Mogura Trident & Future Sight Translucency Dodge
export class Katakuri extends Ball {
  dodgeCooldown = 0;
  isDodging = false;
  aimAngle = 0;

  constructor(x: number, y: number, radius: number, mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, mass, '#be185d', '#f43f5e', name, hp, 'katakuri', '🍩');
    this.archetype = 'Cyber';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playLiquidCollisionSplash(0.94, 'mochi');
  }

  override update(dt: number, friction: number) {
    super.update(dt, friction);
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
      if (this.dodgeCooldown < 2.8) {
        this.isDodging = false;
      }
    }
  }

  override updateSpecial(_dt: number, opponent: Ball, _callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    const t = opponent.getTargetPosition(this.x, this.y);
    this.aimAngle = Math.atan2(t.y - this.y, t.x - this.x);
  }

  override takeDamage(
    amount: number,
    attackerColor = '#ef4444',
    label?: string,
    bypassEarlyCap = false,
    attacker?: Ball | null
  ): number {
    if (attacker) {
      this.lastAttacker = attacker;
    } else if (this.currentOpponent) {
      this.lastAttacker = this.currentOpponent;
    }

    // Future Sight: Every 3.8 seconds, turns completely translucent (opacity 0.2) and negates attack!
    if (this.dodgeCooldown <= 0 && amount < 9000) {
      this.dodgeCooldown = 3.8;
      this.isDodging = true;
      this.playAbilityVoice();
      this.floatingTexts.push({
        text: '🍩 FUTURE SIGHT DODGE!',
        x: this.x,
        y: this.y - this.radius - 28,
        alpha: 1,
        color: '#f43f5e',
        vy: -1.4,
      });
      return 0; // Completely negates all incoming damage during dodge phase
    }
    return super.takeDamage(amount, attackerColor, label, bypassEarlyCap, attacker);
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }

    ctx.save();
    // Future Sight translucency (opacity 0.2 when dodging)
    if (this.isDodging) {
      ctx.globalAlpha = 0.25;
    }

    super.draw(ctx);

    // Draw silver trident (Mogura) aiming at opponent (scaled 1.3x)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.scale(1.3, 1.3);

    const tX = this.radius / 1.3 + 4;

    // Dark shaft
    ctx.fillStyle = '#881337';
    ctx.fillRect(tX - 4, -2.5, 20, 5);

    // Silver 3-pronged Trident head (Mogura)
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.8;

    // Center prong
    ctx.beginPath();
    ctx.moveTo(tX + 16, -2);
    ctx.lineTo(tX + 38, 0);
    ctx.lineTo(tX + 16, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top prong
    ctx.beginPath();
    ctx.moveTo(tX + 14, -6);
    ctx.lineTo(tX + 30, -12);
    ctx.lineTo(tX + 18, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom prong
    ctx.beginPath();
    ctx.moveTo(tX + 14, 6);
    ctx.lineTo(tX + 30, 12);
    ctx.lineTo(tX + 18, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.drawCenterIcon(ctx);
    ctx.restore();
  }
}

/* ==========================================================================
   BATCH 10 (MECHA & SCI-FI): Eva Unit-01, Gundam, Motoko, Spike, Edward
   ========================================================================== */

// 46. EvaUnit01Ball (👾) - Evangelion: Progressive Knife, A.T. Field & Low-HP Berserk Mode
export class EvaUnit01 extends Ball {
  atFieldFlash = 0;
  berserkTrail: { x: number; y: number }[] = [];

  constructor(x: number, y: number, radius: number, _mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 55, '#7e22ce', '#22c55e', name, hp, 'eva01', '👾');
    this.collisionDamageMultiplier = 1.3;
    this.mass = 55;
    this.archetype = 'Default';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(0.92, 'eva');
  }

  isBerserk(): boolean {
    return this.health <= this.maxHealth * 0.45;
  }

  override takeDamage(amount: number, attackerColor?: string, label?: string, bypass = false, attacker?: Ball | null) {
    this.atFieldFlash = 0.35;
    return super.takeDamage(amount, attackerColor, label, bypass, attacker);
  }

  override update(dt: number, friction: number) {
    if (this.atFieldFlash > 0) {
      this.atFieldFlash = Math.max(0, this.atFieldFlash - dt);
    }
    if (this.isBerserk()) {
      // Drops into Berserk Mode below 45% HP: blood-red aura, erratic motion trails, permanent 1.5x speed & collision damage multiplier
      this.color = '#991b1b';
      this.glowColor = '#dc2626';
      this.phaseDamageMultiplier = 1.5;
      this.vx *= 1.02;
      this.vy *= 1.02;
      this.berserkTrail.push({
        x: this.x + (Math.random() - 0.5) * 18,
        y: this.y + (Math.random() - 0.5) * 18,
      });
      if (this.berserkTrail.length > 14) {
        this.berserkTrail.shift();
      }
      if (Math.hypot(this.vx, this.vy) > 1.5) {
        this.trail.push({
          x: this.x + (Math.random() - 0.5) * 14,
          y: this.y + (Math.random() - 0.5) * 14,
          alpha: 0.85,
        });
      }
    } else {
      this.color = '#7e22ce';
      this.glowColor = '#22c55e';
      if (this.berserkTrail.length > 0) {
        this.berserkTrail.length = 0;
      }
    }
    super.update(dt, friction);
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    const berserk = this.isBerserk();

    // 1. Erratic blood-red motion trail in Berserk Mode
    if (berserk && this.berserkTrail.length >= 2) {
      drawArcadeCometTrail(ctx, this.berserkTrail, '#dc2626', 18);
    }

    // 2. Visible octagonal orange A.T. Field around Eva Unit-01 (flashes on impact; blood-red in Berserk Mode)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = berserk ? '#dc2626' : (this.atFieldFlash > 0 ? '#fde047' : '#f97316');
    ctx.fillStyle =
      this.atFieldFlash > 0
        ? 'rgba(251, 146, 60, 0.32)'
        : berserk
        ? 'rgba(220, 38, 38, 0.22)'
        : 'rgba(249, 115, 22, 0.14)';
    ctx.lineWidth = this.atFieldFlash > 0 ? 6.5 : 4.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = this.radius + 20 + (this.atFieldFlash > 0 ? 8 : 0);
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Draw base ball body
    super.draw(ctx);

    // 4. Draw silver combat-style Progressive Knife after super.draw(ctx) and before drawCenterIcon(ctx)
    const target = this.currentOpponent ? this.currentOpponent.getTargetPosition(this.x, this.y) : { x: this.x + 100, y: this.y };
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.scale(1.3, 1.3);
    const rBase = this.radius / 1.3;
    ctx.fillStyle = '#374151';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(rBase - 4, -4.5, 13, 9);
    ctx.strokeRect(rBase - 4, -4.5, 13, 9);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(rBase + 9, -6);
    ctx.lineTo(rBase + 30, -1.5);
    ctx.lineTo(rBase + 36, 0);
    ctx.lineTo(rBase + 28, 6);
    ctx.lineTo(rBase + 9, 6);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // 5. Draw center emoji & HP text on top of weapon
    this.drawCenterIcon(ctx);
  }

  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#facc15'));
    }
  }
}

// 47. GundamBall (🛡️) - Mobile Suit: Fires Pink Beam Rifle & Fin Funnels
export class Gundam extends Ball {
  beamTimer = 0.6;
  funnelAngle = 0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, _mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 32, '#2563eb', '#ec4899', name, hp, 'gundam', '🛡️');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 32;
    this.archetype = 'Ranged';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.0, 'gundam');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.beamTimer = 0.6;
    this.funnelAngle = 0;
    this.projectiles = [];
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.funnelAngle += dt * 2.5;
    this.beamTimer -= dt;

    if (this.beamTimer <= 0) {
      this.beamTimer = 2.1;
      const t = opponent.getTargetPosition(this.x, this.y);
      const a = Math.atan2(t.y - this.y, t.x - this.x);
      const speed = 16.5;
      const dmg = 6.5 + (this.level - 1) * 1.6;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 22),
        this.y + Math.sin(a) * (this.radius + 22)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage: dmg,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#ec4899', '🛡️ BEAM RIFLE!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#f472b6', 14);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#ec4899', 11);

      ctx.save();
      const angle = Math.atan2(p.vy, p.vx);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 14;

      // Normalized heavy 40x14px pink laser blast with glowing core and white border
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-20, -7, 40, 14);

      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(-15, -3.5, 30, 7);

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-20, -7, 40, 14);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Draw base ball body first
    super.draw(ctx);

    // 2. Draw white/grey Beam Rifle and 2 detached floating Fin Funnels after super.draw(ctx) and before drawCenterIcon(ctx)
    const target = this.currentOpponent ? this.currentOpponent.getTargetPosition(this.x, this.y) : { x: this.x + 100, y: this.y };
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.scale(1.3, 1.3);
    const rBase = this.radius / 1.3;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(rBase - 2, -6, 26, 12);
    ctx.strokeRect(rBase - 2, -6, 26, 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(rBase + 8, -4, 18, 8);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(rBase + 10, -9, 6, 4);
    ctx.restore();

    // 2 Detached Floating Fin Funnels orbiting Gundam (scaled 1.3x)
    for (let i = 0; i < 2; i++) {
      const fa = this.funnelAngle + i * Math.PI;
      const fx = this.x + Math.cos(fa) * (this.radius + 31);
      const fy = this.y + Math.sin(fa) * (this.radius + 31);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(fa + Math.PI / 2);
      ctx.scale(1.3, 1.3);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(6, 10);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw center emoji & HP text on top of weapon
    this.drawCenterIcon(ctx);
  }

  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#facc15'));
    }
  }
}

// 48. MotokoBall (👁️) - Ghost in the Shell: Thermoptic Camo & Tactical Ambush
export class Motoko extends Ball {
  camoCycleTimer = 0;
  shotTimer = 0.6;
  ambushMultiplier = 1.0;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; isAmbush?: boolean; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, _mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 30, '#6366f1', '#22d3ee', name, hp, 'motoko', '👁️');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 30;
    this.archetype = 'Ranged';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.08, 'tech');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.camoCycleTimer = 0;
    this.shotTimer = 0.6;
    this.ambushMultiplier = 1.0;
    this.projectiles = [];
  }

  override getTargetPosition(attackerX?: number, attackerY?: number): { x: number; y: number } {
    // Negates enemy auto-targeting while stealthed in Thermoptic Camouflage
    if (this.opticCamoTimer > 0) {
      return {
        x: 640 + Math.sin(performance.now() * 0.01) * 230,
        y: 360 + Math.cos(performance.now() * 0.01) * 230,
      };
    }
    return super.getTargetPosition(attackerX, attackerY);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.camoCycleTimer += dt;
    this.shotTimer -= dt;

    // Thermoptic Camouflage: Every 4.8s, turns translucent (0.15 alpha) for 2.4s and gains 2x damage ambush multiplier!
    if (this.camoCycleTimer >= 4.8) {
      this.camoCycleTimer = 0;
      this.opticCamoTimer = 2.4;
      this.ambushMultiplier = 2.0;
      this.playAbilityVoice();
    }

    // Fire SMG rounds every 2.0s
    if (this.shotTimer <= 0) {
      this.shotTimer = 2.0;
      const t = opponent.getTargetPosition(this.x, this.y);
      const a = Math.atan2(t.y - this.y, t.x - this.x);
      const speed = 17;
      const isAmbush = this.ambushMultiplier > 1;
      const dmg = (5.5 + (this.level - 1) * 1.4) * this.ambushMultiplier;
      this.ambushMultiplier = 1.0; // Reset after ambush shot
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 18),
        this.y + Math.sin(a) * (this.radius + 18)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage: dmg,
        isAmbush,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        const label = p.isAmbush ? '👁️ AMBUSH CRIT (2X)!' : '👁️ SMG BURST!';
        opponent.takeDamage(p.damage, '#22d3ee', label);
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#22d3ee', 12);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#22d3ee', 7);

      ctx.save();
      const angle = Math.atan2(p.vy, p.vx);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12.5, -4, 25, 8);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-12.5, -4, 25, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    ctx.save();
    if (this.opticCamoTimer > 0) {
      ctx.globalAlpha = 0.15; // 0.15 alpha translucent ball & weapon
    }
    // 1. Draw base ball body first
    super.draw(ctx);

    // 2. Draw compact grey submachine gun after super.draw(ctx) and before drawCenterIcon(ctx)
    const target = this.currentOpponent ? this.currentOpponent.getTargetPosition(this.x, this.y) : { x: this.x + 100, y: this.y };
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.scale(1.3, 1.3);
    const rBase = this.radius / 1.3;
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(rBase - 2, -5, 22, 10);
    ctx.strokeRect(rBase - 2, -5, 22, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rBase + 6, 2, 6, 10);
    ctx.restore();

    // 3. Draw center emoji & HP text on top of weapon
    this.drawCenterIcon(ctx);
    ctx.restore();

    // 4. Green digital wireframe glitches briefly flash on the canvas when stealthed
    if (this.opticCamoTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(
        this.x + Math.sin(performance.now() * 0.04) * 26 - 16,
        this.y + Math.cos(performance.now() * 0.03) * 26 - 10,
        32,
        20
      );
      ctx.strokeRect(
        this.x - Math.cos(performance.now() * 0.05) * 24 - 14,
        this.y + Math.sin(performance.now() * 0.04) * 20 - 6,
        28,
        12
      );
      ctx.restore();
    }
  }

  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#22d3ee'));
    }
  }
}

// 49. SpikeBall (🚬) - Cowboy Bebop: Jericho 941 & Jeet Kune Do Counter Stance
export class Spike extends Ball {
  shotTimer = 0.7;
  counterTimer = 0;
  isStanceActive = true;
  projectiles: { x: number; y: number; prevX?: number; prevY?: number; vx: number; vy: number; speed: number; damage: number; trail?: { x: number; y: number }[] }[] = [];

  constructor(x: number, y: number, radius: number, _mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 32, '#1d4ed8', '#facc15', name, hp, 'spike', '🚬');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 32;
    this.archetype = 'Ranged';
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.shotTimer = 0.7;
    this.counterTimer = 0;
    this.isStanceActive = true;
    this.projectiles = [];
  }

  override takeDamage(amount: number, color?: string, label?: string, bypass = false, attacker?: Ball | null): number {
    if (this.isStanceActive && attacker) {
      this.isStanceActive = false;
      this.floatingTexts.push({
        text: '🚬 JEET KUNE DO COUNTER! (0 DMG)',
        x: this.x,
        y: this.y - this.radius - 32,
        alpha: 1,
        color: '#60a5fa',
        vy: -1.5,
      });
      // Absorbs blow (0 damage) and reflects 1.8x collision force back at attacker!
      attacker.vx = -attacker.vx * 1.8;
      attacker.vy = -attacker.vy * 1.8;
      attacker.takeDamage(amount * 1.8, '#1d4ed8', '🚬 JEET KUNE DO REFLECT!', true, this);
      return 0;
    }
    return super.takeDamage(amount, color, label, bypass, attacker);
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.shotTimer -= dt;
    this.counterTimer += dt;

    // Flowing Jeet Kune Do counter stance
    if (this.counterTimer >= 3.2) {
      this.counterTimer = 0;
      this.isStanceActive = true;
    }

    if (this.shotTimer <= 0) {
      this.shotTimer = 2.4;
      const a = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      const speed = 16;
      const dmg = 5.0 + (this.level - 1) * 1.2;
      const spawn = clampProjectileSpawn(
        this.x + Math.cos(a) * (this.radius + 18),
        this.y + Math.sin(a) * (this.radius + 18)
      );
      this.projectiles.push({
        x: spawn.x,
        y: spawn.y,
        prevX: this.x,
        prevY: this.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        speed,
        damage: dmg,
        trail: [{ x: this.x, y: this.y }],
      });
      this.playAttackVoice();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const prevX = p.x;
      const prevY = p.y;
      p.prevX = prevX;
      p.prevY = prevY;
      p.x += p.vx;
      p.y += p.vy;
      pushProjectileTrail(p);
      const dist = sweptSegmentDistToPoint(opponent.x, opponent.y, prevX, prevY, p.x, p.y);
      if (dist <= opponent.radius + Math.max(35, p.speed || 30)) {
        this.projectiles.splice(i, 1);
        opponent.takeDamage(p.damage, '#3b82f6', '🚬 JERICHO 941!');
        this.recordDamageDealt(p.damage, callbacks);
        callbacks.spawnSparks(p.x, p.y, '#93c5fd', 10);
      } else if (p.x < 340 || p.x > 940 || p.y < 60 || p.y > 660) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  override drawProjectiles(ctx: CanvasRenderingContext2D) {
    if (this.projectiles.length === 0) return;
    ctx.save();
    for (const p of this.projectiles) {
      drawArcadeCometTrail(ctx, p.trail, '#facc15', 7);

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;

      const grad = ctx.createLinearGradient(-12.5, -4, 12.5, 4);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1d4ed8');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(-12.5, -4, 25, 8);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-12.5, -4, 25, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Jeet Kune Do subtle water-like blue aura ring
    if (this.isStanceActive) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 3.6;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 11 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw base ball body
    super.draw(ctx);

    // 3. Draw Silver Jericho 941 Pistol after super.draw(ctx) and before drawCenterIcon(ctx)
    const target = this.currentOpponent ? this.currentOpponent.getTargetPosition(this.x, this.y) : { x: this.x + 100, y: this.y };
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.scale(1.3, 1.3);
    const rBase = this.radius / 1.3;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(rBase - 2, -4.5, 24, 9);
    ctx.strokeRect(rBase - 2, -4.5, 24, 9);
    ctx.fillStyle = '#334155';
    ctx.fillRect(rBase + 2, 3, 6, 8);
    ctx.restore();

    // 4. Draw center emoji & HP text on top of weapon
    this.drawCenterIcon(ctx);
  }
}

// 50. EdwardHackerBall (💻) - Cowboy Bebop: Holographic Laptop & Wi-Fi Hacking Pulses!
export class Edward extends Ball {
  hackTimer = 0;
  pulseAnimTimer = 0;

  constructor(x: number, y: number, radius: number, _mass: number, _c: string, _g: string, name: string, hp = 100) {
    super(x, y, radius, 32, '#10b981', '#f97316', name, hp, 'edward', '💻');
    this.collisionDamageMultiplier = 0.1;
    this.mass = 32;
    this.archetype = 'Ranged';
  }

  override playCollisionVoice() {
    if (!this.canPlayCollisionVoice()) return;
    audioController.playMechaCollisionClank(1.18, 'tech');
  }

  override resetPosition(x: number, y: number, hp?: number) {
    super.resetPosition(x, y, hp);
    this.hackTimer = 0;
    this.pulseAnimTimer = 0;
  }

  override updateSpecial(dt: number, opponent: Ball, callbacks: any) {
    if (this.health <= 0 || opponent.health <= 0) return;
    this.hackTimer += dt;
    if (this.pulseAnimTimer > 0) this.pulseAnimTimer -= dt;

    // Emits expanding green Wi-Fi hacking pulse across arena every 5.0s!
    if (this.hackTimer >= 5.0) {
      this.hackTimer = 0;
      this.pulseAnimTimer = 0.85;
      opponent.hackedDisableTimer = 2.8; // Disables enemy weapons & special abilities for 2.8s!
      const dmg = 2.0; // Deals 2 damage
      opponent.takeDamage(dmg, '#10b981', '💻 SYSTEM HACKED!');
      this.recordDamageDealt(dmg, callbacks);
      this.playAbilityVoice();
      callbacks.spawnShockwave?.(opponent.x, opponent.y, '#10b981', 182);
      opponent.floatingTexts.push({
        text: '💻 ABILITIES DISABLED (2.8s)',
        x: opponent.x,
        y: opponent.y - opponent.radius - 30,
        alpha: 1,
        color: '#10b981',
        vy: -1.2,
      });
    }
  }

  override draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      super.draw(ctx);
      return;
    }
    // 1. Concentric green Wi-Fi hacking pulse arcs across arena
    if (this.pulseAnimTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = Math.max(0, this.pulseAnimTimer / 0.85);
      const r = (0.85 - this.pulseAnimTimer) * 420;
      for (let arcIdx = 0; arcIdx < 3; arcIdx++) {
        const arcR = Math.max(12, r - arcIdx * 28);
        ctx.beginPath();
        ctx.arc(this.x, this.y, arcR, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, arcR, Math.PI - Math.PI * 0.35, Math.PI + Math.PI * 0.35);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw base ball body first
    super.draw(ctx);

    // 3. Draw glowing green holographic keyboard/laptop floating in front of ball after super.draw(ctx) and before drawCenterIcon(ctx)
    const target = this.currentOpponent ? this.currentOpponent.getTargetPosition(this.x, this.y) : { x: this.x + 100, y: this.y };
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.scale(1.3, 1.3);
    const rBase = this.radius / 1.3;
    // Laptop screen
    ctx.fillStyle = 'rgba(16, 185, 129, 0.92)';
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1.8;
    ctx.fillRect(rBase + 5, -13, 6, 18);
    ctx.strokeRect(rBase + 5, -13, 6, 18);
    // Keyboard base
    ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
    ctx.fillRect(rBase + 1, 5, 16, 5);
    ctx.strokeRect(rBase + 1, 5, 16, 5);
    // Holographic keys
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rBase + 3, 6, 2.5, 2.5);
    ctx.fillRect(rBase + 8, 6, 2.5, 2.5);
    ctx.fillRect(rBase + 13, 6, 2.5, 2.5);
    ctx.restore();

    // 4. Draw center emoji & HP text on top of weapon
    this.drawCenterIcon(ctx);
  }

  override playDeathAnimation() {
    if (this.hasPlayedDeath) return;
    super.playDeathAnimation();
    for (let i = 0; i < 35; i++) {
      particles.push(new SquareSparkParticle(this.x, this.y, '#10b981'));
    }
  }
}

/* ==========================================================================
   FACTORY HELPER
   Instantiates correct Ball subclass based on selected BallTypeId
   ========================================================================== */
export function createBall(
  type: BallTypeId,
  x: number,
  y: number,
  radius: number,
  mass: number,
  color: string,
  glowColor: string,
  name: string,
  startingHealth: number
): Ball {
  switch (type) {
    // Batch 4
    case 'natsu':
      return new Natsu(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'todoroki':
      return new Todoroki(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'mustang':
      return new RoyMustang(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'esdeath':
      return new Esdeath(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'aokiji':
      return new Aokiji(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 5
    case 'killua':
      return new Killua(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'korosensei':
      return new KoroSensei(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'yoruichi':
      return new Yoruichi(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'minato':
      return new Minato(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'sonic':
      return new Sonic(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 6
    case 'megumin':
      return new Megumin(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'yami':
      return new Yami(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'fushiguro':
      return new Fushiguro(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'lucy':
      return new Lucy(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'rimuru':
      return new Rimuru(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 7
    case 'vash':
      return new Vash(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'deaththekid':
      return new DeathKid(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'sinon':
      return new Sinon(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'hawkeye':
      return new Hawkeye(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 8
    case 'escanor':
      return new Escanor(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'whitebeard':
      return new Whitebeard(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'kenpachi':
      return new Kenpachi(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'allmight':
      return new AllMight(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'broly':
      return new Broly(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 9
    case 'hisoka':
      return new Hisoka(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'shikamaru':
      return new Shikamaru(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'kurapika':
      return new Kurapika(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'shigaraki':
      return new Shigaraki(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'katakuri':
      return new Katakuri(x, y, radius, mass, color, glowColor, name, startingHealth);
    // Batch 10
    case 'eva01':
      return new EvaUnit01(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'gundam':
      return new Gundam(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'motoko':
      return new Motoko(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'spike':
      return new Spike(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'edward':
      return new Edward(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'starplatinum':
      return new Jotaro(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'alchemist':
      return new EdwardElric(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'shinigaminote':
      return new LightYagami(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'oneforsmash':
      return new Deku(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'capedbaldy':
      return new Saitama(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'limitless':
      return new Gojo(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'kingofcurses':
      return new Sukuna(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'waterbreathing':
      return new Tanjiro(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'thunderflash':
      return new Zenitsu(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'scoutspinner':
      return new Levi(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'quadblade':
      return new KnifeMaster(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'aura':
      return new MysticAura(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'venom':
      return new Venom(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'mathgrid':
      return new MathGrid(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'engineer':
      return new Engineer(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'rubberpirate':
      return new Luffy(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'ninjashadow':
      return new Naruto(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'supersaiyan':
      return new Goku(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'soulreaper':
      return new Ichigo(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'threesword':
      return new Zoro(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'sniper':
      return new Sniper(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'bow':
      return new Archer(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'blackhole':
      return new BlackHole(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'vampire':
      return new Vampire(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'mirror':
      return new Mirage(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'jackpot':
      return new Jackpot(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'frost':
      return new FrostNova(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'blink':
      return new Blink(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'trap':
      return new Minefield(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'inertia':
      return new Juggernaut(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'swarm':
      return new DroneSwarm(x, y, radius, mass, color, glowColor, name, startingHealth);
    case 'standard':
    default:
      return new Brawler(x, y, radius, mass, color, glowColor, name, startingHealth);
  }
}

export const BALL_VISUAL_META: Record<
  BallTypeId,
  { color: string; glowColor: string; emoji: string; speed: string; mass: string; libraryDescription: string }
> = (() => {
  const speedOverrides: Partial<Record<BallTypeId, string>> = {
    killua: '12.1 u/s (132% Godspeed)',
    korosensei: '12.1 u/s (132% Mach 20)',
    sonic: '12.1 u/s (132% Ninja)',
    yoruichi: '10.6 u/s (115% Shunpo)',
    minato: '10.6 u/s (115% Warp)',
    blink: '10.6 u/s (115% Phase)',
    thunderflash: '2.8 u/s (30% Sleep + 6s Blitz)',
    capedbaldy: '2.3–8.7 u/s (Slow Ramp)',
    megumin: '9.2 u/s (100% Unstoppable)',
    eva01: '9.2 u/s (13.6 u/s Berserk)',
    escanor: '9.2 u/s (High Noon Scaling)',
    whitebeard: '8.5 u/s (Heavy Titan)',
    allmight: '9.5 u/s (Smash Rush)',
    broly: '9.5 u/s (Berserker)',
    kenpachi: '9.4 u/s (Reiatsu Rush)',
    inertia: '9.0 u/s (Momentum Scaling)',
  };

  const massOverrides: Partial<Record<BallTypeId, string>> = {
    escanor: '32–64 kg (Noon Scaling)',
    inertia: '32–72 kg (Kinetic Capacitor)',
    whitebeard: '43 kg (Heavy)',
    allmight: '42 kg (Heavy)',
    broly: '40 kg (Heavy)',
    kenpachi: '38 kg (Bruiser)',
    oneforsmash: '36 kg (Impact)',
    capedbaldy: '48 kg (Unstoppable)',
  };

  const extraMechanicsSentence: Partial<Record<BallTypeId, string>> = {
    natsu: 'Each successful hit stokes his Dragon Force meter, increasing flame cone reach and burn tick potency as the battle escalates.',
    todoroki: 'Cycling between frost slowness and scorching fire lets him control arena spacing while punishing enemies caught in either elemental wave.',
    mustang: 'Because his flame alchemy locks directly onto the opponent’s coordinates, evasive movement right as the targeting reticle flashes is critical.',
    esdeath: 'Combining her orbiting ice spears with periodic cryo-freeze pulses allows her to shatter immobilized targets for bonus impact damage.',
    aokiji: 'Enemies crossing his frozen floor patches lose momentum, making them easy targets for his piercing Pheasant Beak projectile.',
    killua: 'His passive Godspeed aura automatically intercepts incoming projectiles and zaps close-range foes without interrupting his movement.',
    korosensei: 'High-velocity afterimages trail behind him across the arena, absorbing half of incoming collision damage while disorienting attackers.',
    yoruichi: 'By blinking directly behind the opponent every few seconds, she bypasses frontal defenses and detonates point-blank Shunko lightning.',
    minato: 'Marked kunai remain on the arena floor as warp beacons, letting him instantly teleport to ambush the enemy with a high-knockback Rasengan.',
    sonic: 'His four ninja mirages fan out around him while wind shuriken detonate on impact, overwhelming opponents from multiple angles.',
    megumin: 'Chants repeated cataclysmic Explosions every 4.2s — dealing 30 damage on the first hit and continuously increasing after each hit without ever slowing down.',
    yami: 'His dark gravity cloak devours enemy projectiles on contact while his Dimension Slash cuts straight across the entire arena.',
    fushiguro: 'His summoned Ten Shadows beasts independently hunt the opponent across the stage, applying constant pressure even while he dodges.',
    lucy: 'Orbiting golden spirit gates act as both rotating shields and starlight launchers that rain homing blasts onto the enemy.',
    rimuru: 'Every projectile absorbed by his Predator slime body restores health and charges a retaliatory Black Lightning discharge.',
    vash: 'His silver revolver rounds bounce multiple times off the arena walls, creating unpredictable crossfire trajectories.',
    deaththekid: 'Dual symmetrical laser blasts punish enemies in straight lines and scale in firing cadence as total damage accumulates.',
    sinon: 'Her Hecate II anti-materiel rifle tracks targets with a green laser sight before firing a high-velocity armor-piercing round.',
    hawkeye: 'Rapid three-round bursts shred clones and apply steady knockback to keep melee brawlers at bay.',
    escanor: 'As the match clock ticks toward High Noon, both his physical radius and collision power surge alongside his Cruel Sun fireballs.',
    whitebeard: 'His Gura Gura air-quakes violently shake the entire screen and hurl the opponent backward into the arena walls.',
    kenpachi: 'Taking damage only fuels his golden spiritual pressure, granting him progressively deadlier cleaver slashes at low health.',
    allmight: 'High-speed collisions unleash golden air-pressure shockwaves that send the enemy ricocheting across the stage.',
    broly: 'His volatile bio-energy shield damages nearby foes while launching multi-directional Eraser Cannon barrages.',
    hisoka: 'Once Bungee Gum tethers to the opponent, stretching the elastic line snaps both balls together for a brutal collision.',
    shikamaru: 'Catching the opponent with his extending floor shadow forces them to mirror his movement vectors while taking continuous shadow damage.',
    kurapika: 'Emperor Time empowers his five whirling chains to simultaneously snare the enemy and siphon health on every hit.',
    shigaraki: 'Any physical contact or step onto his spreading purple ground cracks inflicts a lingering four-second health decay.',
    katakuri: 'His Future Sight periodically turns his body intangible to phase cleanly through incoming collisions and projectiles.',
    eva01: 'Dropping below 45% HP shatters its restraints, triggering Berserk Mode with a 1.5x speed boost and savage melee strikes.',
    gundam: 'Two autonomous Fin Funnels orbit the mobile suit to zap nearby threats while its Beam Rifle fires high-energy pink blasts.',
    motoko: 'Thermoptic Camouflage renders her nearly invisible and scrambles enemy projectile lock-on until she strikes from stealth.',
    spike: 'Timing his martial arts counter stance reflects incoming collision force back at the attacker with a 1.8x damage multiplier.',
    edward: 'Digital hacking waves temporarily shut down the opponent’s special weapons, auras, and cooldown abilities for 2.8 seconds.',
    starplatinum: 'During the 2.5-second Time Stop, the enemy and all projectiles freeze solid, letting Jotaro line up a free full-speed smash.',
    alchemist: 'Solid stone pillars transmuted from the floor permanently narrow the arena and ricochet balls and projectiles at sharp angles.',
    shinigaminote: 'By focusing purely on evasion for 20 unharmed seconds, Light completes the name entry to trigger an unavoidable instant-KO Heart Attack.',
    oneforsmash: 'Massive kinetic multipliers make every collision devastating, though the user must manage the 15% self-recoil damage on impact.',
    capedbaldy: 'Though sluggish at first, building up sufficient velocity turns his next direct collision into an instant 9999-damage knockout.',
    limitless: 'Because the Infinity aura cuts incoming velocity by 90%, enemies must rely on ranged abilities or domain attacks to break through.',
    kingofcurses: 'Linger inside Sukuna’s Malevolent Shrine radius for more than two seconds and five unavoidable cleaving slashes will trigger.',
    waterbreathing: 'Flowing water rings linger behind Tanjiro, creating hazardous zones that slow enemy movement and deal steady tick damage.',
    thunderflash: 'While asleep he drifts at 30% speed, but every 6 seconds he wakes for an instantaneous lightning dash straight through the target.',
    scoutspinner: 'Latching onto the enemy prevents normal bounce separation, slicing them continuously with dual rotating blades for two seconds.',
    rubberpirate: 'Landing the long-range Gomu Gomu pistol deals rapid multi-hit damage before slingshotting Luffy directly into the target.',
    ninjashadow: 'Two shadow clones mirror his velocity, hurl kunai, and draw enemy projectile fire until popped by a single hit.',
    supersaiyan: 'Once the 10-second golden charge ring fills, the resulting Kamehameha beam sweeps across the entire arena for massive damage.',
    soulreaper: 'Crescent Getsuga Tensho waves slice cleanly through stone pillars, turrets, and clones without losing velocity.',
    threesword: 'His forward-facing 180-degree slash arc shreds enemies on contact and deflects incoming projectiles away.',
    standard: 'With no complex cooldowns to manage, Brawler relies on pure momentum, crisp wall rebounds, and heavy kinetic impact.',
    quadblade: 'Dealing 35 and 70 total damage upgrades the protruding knives in length and count, turning the ball into an 8-blade buzzsaw.',
    aura: 'Its pulsing resonance ring expands and deals higher tick damage as the round progresses, rewarding close-range hovering.',
    venom: 'Toxic contact poisons the opponent over time, scaling from 2 to 4 tick damage as total poison damage accumulates.',
    mathgrid: 'Colliding inside the center 3x3 tic-tac-toe grid claims cells and multiplies impact damage for strategic center-stage control.',
    engineer: 'Deployed turrets remain anchored on the arena floor and fire automated suppressing shots every two seconds.',
    sniper: 'Every 10 seconds the rifle upgrades its muzzle velocity, firing pointed golden bullets with white motion-blur trails.',
    bow: 'Accumulating 30 and 60 damage upgrades the recurve bow from single shots to twin spread arrows and rapid triple volleys.',
    blackhole: 'Its gravitational pull drags the opponent off course while the purple event horizon shears away health each second.',
    vampire: 'Thirty-five percent of all speed-based collision damage dealt is immediately siphoned back into Vampire’s own health pool.',
    mirror: 'An active holographic decoy mirrors its coordinates across the center of the arena to bait and confuse enemy attacks.',
    jackpot: 'Every collision spins the internal slot reels for a 20% chance to trigger a golden coin shower and bonus jackpot damage.',
    frost: 'Periodic 140px Frost Novas freeze nearby enemies solid, priming them to take +2 shatter damage on the next collision.',
    blink: 'Warping behind the opponent leaves an unstable quantum rift on the floor that damages enemies who pass through it.',
    trap: 'Armed proximity mines detonate with concussive knockback whenever the enemy ball rolls within trigger range.',
    inertia: 'Wall bounces and impacts charge its internal mass capacitor from 32 up to 72 kg for crushing momentum collisions.',
    swarm: 'Two autonomous micro-drones orbit the carrier and continuously fire plasma darts at the enemy from medium range.',
  };

  const map = {} as Record<
    BallTypeId,
    { color: string; glowColor: string; emoji: string; speed: string; mass: string; libraryDescription: string }
  >;
  for (const item of BALL_TYPES) {
    const sample = createBall(item.id, 0, 0, 20, 32, '#38bdf8', '#0284c7', item.name, 100);
    const extraSentence =
      extraMechanicsSentence[item.id] ||
      'Scales dynamically with match phases and momentum collisions across the arena.';
    map[item.id] = {
      color: sample.color,
      glowColor: sample.glowColor,
      emoji: sample.iconText,
      speed: speedOverrides[item.id] || '9.2 u/s (100% Standard)',
      mass: massOverrides[item.id] || `${Math.round(sample.mass)} kg`,
      libraryDescription: `${item.description} ${extraSentence}`,
    };
  }
  return map;
})();

/* ==========================================================================
   CIRCULAR PLAYER AVATAR PLACEHOLDER
   ========================================================================== */
function PlayerAvatar({
  name,
  color,
  isBot = false,
  ballType,
  abilityProgress = 1,
  abilityRemaining = 0,
  abilityActive = false,
  abilityStatusText,
}: {
  name: string;
  color: string;
  isBot?: boolean;
  ballType?: BallTypeId;
  abilityProgress?: number;
  abilityRemaining?: number;
  abilityActive?: boolean;
  abilityStatusText?: string;
}) {
  const initials = (name.trim() || (isBot ? 'AI' : 'P1')).slice(0, 2).toUpperCase();
  const clampedProgress = Math.max(0, Math.min(1, abilityProgress));
  const isReady = clampedProgress >= 0.99;
  const isLocked = abilityStatusText?.startsWith('LOCK') || abilityStatusText === 'KO';
  const pct = Math.round(clampedProgress * 100);
  const ringRadius = 24.5;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - clampedProgress);

  const fighterMeta = ballType ? BALL_VISUAL_META[ballType] : undefined;
  const fighterInfo = ballType ? BALL_TYPES.find((b) => b.id === ballType) : undefined;
  const ringStroke = isLocked
    ? '#ef4444'
    : abilityActive
    ? '#fbbf24'
    : isReady
    ? '#4ade80'
    : color;

  const displayStatus =
    abilityStatusText ||
    (isReady
      ? 'READY'
      : abilityRemaining > 0
      ? `${abilityRemaining.toFixed(1)}s`
      : `${pct}%`);

  const tooltipTitle = fighterInfo
    ? `${fighterInfo.name} (${fighterInfo.badge}) — Special Cooldown: ${displayStatus}`
    : `Special Ability Recharge: ${displayStatus}`;

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0 select-none">
      <div
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-slate-950"
        style={{
          boxShadow: isLocked
            ? '0 0 14px rgba(239, 68, 68, 0.5)'
            : abilityActive
            ? '0 0 20px rgba(251, 191, 36, 0.72)'
            : isReady
            ? '0 0 18px rgba(74, 222, 128, 0.6)'
            : `0 0 12px ${color}33`,
        }}
        title={tooltipTitle}
      >
        {/* Dynamic Visual Cooldown Progress Ring surrounding the character avatar */}
        <svg
          viewBox="0 0 56 56"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10"
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r={ringRadius}
            fill="none"
            stroke="rgba(15, 23, 42, 0.9)"
            strokeWidth="4.2"
          />
          <circle
            cx="28"
            cy="28"
            r={ringRadius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.24)"
            strokeWidth="3.4"
          />
          <circle
            cx="28"
            cy="28"
            r={ringRadius}
            fill="none"
            stroke={ringStroke}
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringDashOffset}
            style={{
              filter:
                isReady || abilityActive
                  ? `drop-shadow(0 0 4px ${ringStroke})`
                  : undefined,
            }}
            className="transition-[stroke-dashoffset,stroke] duration-75 ease-linear"
          />
        </svg>

        {/* Character Core Emblem inside Ring */}
        {fighterMeta ? (
          <div
            className="w-full h-full flex items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${fighterMeta.color}38, rgba(2, 6, 23, 0.96) 72%)`,
            }}
            aria-label={`${name} Avatar`}
          >
            <span className="text-lg sm:text-xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {fighterMeta.emoji}
            </span>
          </div>
        ) : (
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full p-2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={`${name} Avatar`}
          >
            <circle cx="24" cy="24" r="22" fill={color} fillOpacity="0.15" />
            <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            {isBot ? (
              <>
                <rect x="14" y="14" width="20" height="18" rx="4" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.8" />
                <circle cx="19" cy="21" r="2.5" fill="#ffffff" />
                <circle cx="29" cy="21" r="2.5" fill="#ffffff" />
                <line x1="18" y1="27" x2="30" y2="27" stroke={color} strokeWidth="2" strokeLinecap="round" />
                <line x1="24" y1="8" x2="24" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="8" r="2.5" fill="#ffffff" />
              </>
            ) : (
              <>
                <circle cx="24" cy="18" r="7.5" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="1.8" />
                <path d="M12 36c0-6 5.5-9 12-9s12 3 12 9" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="24" cy="18" r="4.5" fill={color} fillOpacity="0.75" />
              </>
            )}
          </svg>
        )}

        {/* Corner Monogram Badge */}
        <span
          className="absolute bottom-0.5 right-0.5 z-20 text-[8px] sm:text-[9px] font-black font-mono px-1 py-0.2 rounded-full border border-slate-900 leading-none shadow"
          style={{
            backgroundColor: color,
            color: '#020617',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Special Ability Cooldown Progress Bar & Status Beneath Character Avatar */}
      <div className="w-13 sm:w-15 flex flex-col items-center gap-0.5">
        <div
          className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} special ability recharge`}
        >
          <div
            className={`h-full transition-all duration-75 ease-linear rounded-full ${
              isReady || abilityActive ? 'animate-pulse' : ''
            }`}
            style={{
              width: `${pct}%`,
              backgroundColor: ringStroke,
              boxShadow:
                isReady || abilityActive ? `0 0 8px ${ringStroke}` : `0 0 6px ${color}`,
            }}
          />
        </div>
        <span
          className={`font-mono text-[8px] font-black uppercase leading-none tracking-wider tabular-nums ${
            isLocked
              ? 'text-rose-400'
              : abilityActive
              ? 'text-amber-300 animate-pulse'
              : isReady
              ? 'text-emerald-400'
              : 'text-slate-300'
          }`}
        >
          {displayStatus}
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   NAVIGATION MANAGER (Smooth CSS Fade-In & Slide-Up Screen Routing)
   ========================================================================== */
export type ScreenId =
  | 'splash-screen'
  | 'main-menu'
  | 'character-select'
  | 'library-screen'
  | 'game-screen';

export class NavigationManager {
  public currentScreen: ScreenId = 'splash-screen';
  private listeners: Set<(screen: ScreenId) => void> = new Set();

  public navigateTo(targetScreen: ScreenId): void {
    this.currentScreen = targetScreen;
    const allScreens: ScreenId[] = [
      'splash-screen',
      'main-menu',
      'character-select',
      'library-screen',
      'game-screen',
    ];
    if (typeof document !== 'undefined') {
      for (const id of allScreens) {
        const el = document.getElementById(id);
        if (el) {
          if (id === targetScreen) {
            el.classList.remove('view-hidden');
            el.classList.add('view-active');
          } else {
            el.classList.remove('view-active');
            el.classList.add('view-hidden');
          }
        }
      }
    }
    this.listeners.forEach((cb) => cb(targetScreen));
  }

  public subscribe(cb: (screen: ScreenId) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const navigationManager = new NavigationManager();

/* ==========================================================================
   GLOBAL FATALITY EXECUTION SYSTEM
   ========================================================================== */
type FatalityDispatcher = (
  deadBall: Ball,
  attacker: Ball | null,
  style: NonNullable<Ball['fatalityState']>['style'],
  finisherLabel: string
) => void;

let activeFatalityDispatcher: FatalityDispatcher | null = null;
let activeFatalityCompleteCallback: ((deadBall: Ball, winnerBall: Ball | null) => void) | null = null;
let activeResetArenaCallback: ((newP1Type: BallTypeId, newP2Type: BallTypeId) => void) | null = null;
let finisherTimeoutId: number | null = null;

export const damageTexts: DamageText[] = [];
export const floatingTexts: { text: string; x: number; y: number; alpha: number; color: string; vy: number }[] = [];

/**
 * Global Arena Reset Function: scrubs the Canvas engine clean between multi-round drafts
 * to prevent memory leaks and leftover hazards (Edward pillars, Minefield mines, particles, texts),
 * re-instantiates player1 and player2 with newly drafted BallTypeIds, resets round timer to 0.0,
 * and sets gameState = 'LAUNCH'.
 */
export function resetArenaForNewRound(newP1Type: BallTypeId, newP2Type: BallTypeId): void {
  globalParticlePool.clear();
  particles.length = 0;
  damageTexts.length = 0;
  floatingTexts.length = 0;
  EdwardElric.pillars.length = 0;
  Minefield.mines.length = 0;
  if (activeResetArenaCallback) {
    activeResetArenaCallback(newP1Type, newP2Type);
  }
}

// Global Action-Game Hitstop & Impact Frame Timers
let hitstopTimer = 0;
let impactFrameTimer = 0;

// Global Canvas Mouse Coordinates for Launch-Phase Direct Cursor Aiming
export const mousePos = { x: 0, y: 0 };
let hasMouseAimInput = false;
if (typeof window !== 'undefined') {
  (window as any).mousePos = mousePos;
  (window as any).resetArenaForNewRound = resetArenaForNewRound;
}

/**
 * Global function invoked when a ball's health reaches 0.
 * Stops the dead ball's movement and uses a switch statement on `attacker.constructor.name`
 * to determine which visual Canvas finisher animation plays, defaulting to the standard
 * 360-degree particle explosion.
 */
export function triggerFatality(deadBall: Ball, winnerBall?: Ball | null): void {
  // Trigger Hitstop (0.05s) and Impact Frames (2 frames) on Fatality execution
  hitstopTimer = 0.05;
  impactFrameTimer = 2;

  // 1. Mark deadBall as dead and stop movement immediately
  deadBall.isDead = true;
  deadBall.vx = 0;
  deadBall.vy = 0;
  deadBall.playDeathAnimation();

  const resolvedWinner = winnerBall ?? deadBall.lastAttacker ?? deadBall.currentOpponent ?? null;
  if (resolvedWinner) {
    resolvedWinner.vx = 0;
    resolvedWinner.vy = 0;
  }

  const archetype = resolvedWinner ? resolvedWinner.archetype : 'Default';
  audioController.playFatalitySound(archetype);
  const originalColor = deadBall.color;
  const originalRadius = deadBall.radius;
  const impactAngle = resolvedWinner
    ? Math.atan2(deadBall.y - resolvedWinner.y, deadBall.x - resolvedWinner.x)
    : Math.PI / 4;

  let style: NonNullable<Ball['fatalityState']>['style'] = 'explosion';
  let finisherLabel = '💥 ANNIHILATION!';
  let customRender: (ctx: CanvasRenderingContext2D, dt: number) => void = () => {};

  // 2. Switch statement based on winnerBall.archetype
  switch (archetype) {
    // =========================================================================
    // FIRE (Natsu, Mustang, Todoroki, Escanor, Megumin)
    // The dead ball turns black. Spawn 40 glowing orange and red particles that
    // drift upwards, shrinking as they fade (embers and ash).
    // =========================================================================
    case 'Fire': {
      style = 'inferno';
      finisherLabel = '🔥 BURNED TO ASH!';
      // Dead ball turns black
      deadBall.color = '#000000';
      deadBall.glowColor = '#1c1917';

      // Spawn 40 glowing orange and red particles that drift upwards, shrinking as they fade
      for (let i = 0; i < 40; i++) {
        const isEmber = Math.random() < 0.7;
        const pColor = isEmber
          ? Math.random() < 0.5
            ? '#f97316'
            : '#ef4444'
          : Math.random() < 0.5
          ? '#94a3b8'
          : '#64748b';
        const initialRadius = isEmber ? 4 + Math.random() * 5 : 7 + Math.random() * 6;
        const speedX = (Math.random() - 0.5) * 2.5;
        const speedY = -(2.0 + Math.random() * 3.5);

        particles.push({
          x: deadBall.x + (Math.random() - 0.5) * originalRadius * 1.4,
          y: deadBall.y + (Math.random() - 0.5) * originalRadius * 1.2,
          vx: speedX,
          vy: speedY,
          color: pColor,
          radius: initialRadius,
          opacity: 1.0,
          decay: 0.018 + Math.random() * 0.012,
          shrink: 0.08 + Math.random() * 0.06,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.radius = Math.max(0.5, (this.radius ?? 5) - (this.shrink ?? 0.08));
            this.opacity = Math.max(0, (this.opacity ?? 1) - (this.decay ?? 0.02));
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.fillStyle = this.color || '#f97316';
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, this.radius ?? 4), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          },
        });
      }

      let elapsed = 0;
      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;
        const charredOpacity = Math.max(0, 1 - elapsed / 1.35);
        if (charredOpacity > 0) {
          ctx.save();
          ctx.globalAlpha = charredOpacity;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(deadBall.x, deadBall.y, originalRadius * (0.85 + 0.15 * charredOpacity), 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(deadBall.x - originalRadius * 0.45, deadBall.y - originalRadius * 0.2);
          ctx.lineTo(deadBall.x + originalRadius * 0.1, deadBall.y + originalRadius * 0.15);
          ctx.lineTo(deadBall.x + originalRadius * 0.5, deadBall.y - originalRadius * 0.3);
          ctx.stroke();
          ctx.restore();
        }
      };
      break;
    }

    // =========================================================================
    // ICE (Aokiji, Esdeath)
    // The dead ball flashes solid cyan. Spawn 7 large, jagged polygon shapes that
    // explode outward with rotational velocity, leaving a fading mist trail.
    // =========================================================================
    case 'Ice': {
      style = 'ice_shatter';
      finisherLabel = '❄️ FROZEN SHATTER!';
      deadBall.color = '#06b6d4';
      deadBall.glowColor = '#22d3ee';

      // Spawn 7 large, jagged polygon shapes that explode outward with rotational velocity
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 4.5 + Math.random() * 4.5;
        const size = 18 + Math.random() * 12;
        let rotation = Math.random() * Math.PI * 2;
        const vRot = (Math.random() - 0.5) * 0.25;

        particles.push({
          x: deadBall.x,
          y: deadBall.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#06b6d4',
          opacity: 1.0,
          decay: 0.018,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.97;
            this.vy *= 0.97;
            rotation += vRot;
            this.opacity = Math.max(0, (this.opacity ?? 1) - (this.decay ?? 0.018));

            // Fading mist trail
            if (Math.random() < 0.6) {
              particles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: '#e0f2fe',
                radius: 5 + Math.random() * 6,
                opacity: 0.7,
                update() {
                  this.opacity = Math.max(0, (this.opacity ?? 0.7) - 0.035);
                  this.radius = (this.radius ?? 5) + 0.25;
                },
                draw(ctx: CanvasRenderingContext2D) {
                  if ((this.opacity ?? 0) <= 0) return;
                  ctx.save();
                  ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
                  ctx.fillStyle = this.color || '#e0f2fe';
                  ctx.beginPath();
                  ctx.arc(this.x, this.y, this.radius ?? 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                },
              });
            }
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.translate(this.x, this.y);
            ctx.rotate(rotation);
            ctx.fillStyle = '#67e8f9';
            ctx.strokeStyle = '#ecfeff';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.75, -size * 0.25);
            ctx.lineTo(size * 0.85, size * 0.75);
            ctx.lineTo(0, size * 0.5);
            ctx.lineTo(-size * 0.85, size * 0.7);
            ctx.lineTo(-size * 0.65, -size * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          },
        });
      }

      let elapsed = 0;
      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;
        if (elapsed < 0.12) {
          ctx.save();
          ctx.fillStyle = '#06b6d4';
          ctx.strokeStyle = '#cffafe';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(deadBall.x, deadBall.y, originalRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      };
      break;
    }

    // =========================================================================
    // SLASH (Zoro, Levi, Sukuna, Ichigo, Kenpachi)
    // Do not use particles. Instead, draw the dead ball split perfectly in half
    // along the angle of impact. The two semi-circles must slowly slide apart in
    // opposite directions with a glowing crimson edge before dissolving.
    // =========================================================================
    case 'Slash': {
      style = 'slash';
      finisherLabel = '⚔️ SLICED IN HALF!';
      let elapsed = 0;

      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;
        const alpha = Math.max(0, 1 - elapsed / 1.45);
        if (alpha <= 0) return;

        const slideDist = Math.min(58, elapsed * 42);
        const gapDist = Math.min(18, elapsed * 14);

        const drawHalf = (sign: 1 | -1, startArc: number, endArc: number) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(deadBall.x, deadBall.y);
          ctx.rotate(impactAngle);
          ctx.translate(sign * slideDist, sign * gapDist);

          ctx.fillStyle = originalColor;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.arc(0, 0, originalRadius, startArc, endArc);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crimson cut edge
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-originalRadius, 0);
          ctx.lineTo(originalRadius, 0);
          ctx.stroke();
          ctx.restore();
        };

        drawHalf(1, 0, Math.PI);
        drawHalf(-1, Math.PI, Math.PI * 2);
      };
      break;
    }

    // =========================================================================
    // VOID (Black Hole, Yami, Gojo, Rimuru, Shikamaru)
    // The dead ball violently implodes. Shrink its radius to 0 in 0.3 seconds
    // while spawning 36 dark purple particles that suck inward toward its center.
    // =========================================================================
    case 'Void': {
      style = 'singularity';
      finisherLabel = '🕳️ VOID IMPLOSION!';

      // Spawn 36 dark purple particles that suck inward toward center
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2 + Math.random() * 0.2;
        const startDist = 75 + Math.random() * 85;
        const startX = deadBall.x + Math.cos(angle) * startDist;
        const startY = deadBall.y + Math.sin(angle) * startDist;

        particles.push({
          x: startX,
          y: startY,
          targetX: deadBall.x,
          targetY: deadBall.y,
          vx: -Math.cos(angle) * 4.5,
          vy: -Math.sin(angle) * 4.5,
          color: Math.random() < 0.5 ? '#7e22ce' : '#a855f7',
          radius: 3 + Math.random() * 4,
          opacity: 1.0,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            const dx = (this.targetX ?? deadBall.x) - this.x;
            const dy = (this.targetY ?? deadBall.y) - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 8) {
              this.opacity = 0;
            } else {
              this.vx += (dx / dist) * 0.45;
              this.vy += (dy / dist) * 0.45;
            }
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.fillStyle = this.color || '#a855f7';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius ?? 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          },
        });
      }

      let elapsed = 0;
      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;
        // Shrink radius to 0 in 0.3 seconds
        const shrinkRatio = Math.max(0, 1 - elapsed / 0.3);
        const currentRadius = originalRadius * shrinkRatio;
        deadBall.radius = currentRadius;

        if (currentRadius > 0.5) {
          ctx.save();
          const grad = ctx.createRadialGradient(
            deadBall.x,
            deadBall.y,
            1,
            deadBall.x,
            deadBall.y,
            currentRadius
          );
          grad.addColorStop(0, '#000000');
          grad.addColorStop(0.6, '#3b0764');
          grad.addColorStop(1, '#7e22ce');
          ctx.fillStyle = grad;
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(deadBall.x, deadBall.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      };
      break;
    }

    // =========================================================================
    // LIGHTNING (Killua, Zenitsu, Yoruichi, Minato)
    // The dead ball flashes white/black. Draw 3 jagged yellow lines (lightning bolts)
    // striking it from above, followed by an explosion of 48 high-speed yellow spark particles.
    // =========================================================================
    case 'Lightning': {
      style = 'lightning';
      finisherLabel = '⚡ THUNDERBOLT OVERLOAD!';

      // Spawn an explosion of 48 high-speed yellow spark particles
      for (let i = 0; i < 48; i++) {
        const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
        const speed = 6.0 + Math.random() * 8.5;

        particles.push({
          x: deadBall.x,
          y: deadBall.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() < 0.5 ? '#facc15' : '#fef08a',
          radius: 2.5 + Math.random() * 3,
          opacity: 1.0,
          decay: 0.032,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.93;
            this.vy *= 0.93;
            this.opacity = Math.max(0, (this.opacity ?? 1) - (this.decay ?? 0.032));
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.strokeStyle = this.color || '#facc15';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5);
            ctx.stroke();
            ctx.restore();
          },
        });
      }

      let elapsed = 0;
      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;

        // Dead ball flashes white/black for 0.2s
        if (elapsed < 0.2) {
          const isWhiteFlash = Math.floor(elapsed / 0.03) % 2 === 0;
          ctx.save();
          ctx.fillStyle = isWhiteFlash ? '#ffffff' : '#000000';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(deadBall.x, deadBall.y, originalRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Draw 3 jagged yellow lines (lightning bolts) striking it from above
        if (elapsed < 0.45) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 0.2) / 0.25);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 6;
          ctx.lineJoin = 'miter';
          ctx.lineCap = 'round';

          for (let b = -1; b <= 1; b++) {
            ctx.beginPath();
            const topX = deadBall.x + b * 24;
            const topY = Math.max(40, deadBall.y - 260);
            ctx.moveTo(topX, topY);
            const segments = 7;
            for (let s = 1; s <= segments; s++) {
              const t = s / segments;
              const ny = topY + (deadBall.y - topY) * t;
              const jag = s === segments ? 0 : Math.sin(s * 11.7 + elapsed * 60 + b * 2) * 26;
              ctx.lineTo(deadBall.x + b * 8 * (1 - t) + jag, ny);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
      };
      break;
    }

    // =========================================================================
    // CYBER (Gundam, Eva-01, Edward)
    // Draw neon green grid lines over the dead ball, followed by high-frequency
    // square electrical sparks shooting out at right angles.
    // =========================================================================
    case 'Cyber': {
      style = 'beam';
      finisherLabel = '⚡ CYBERNETIC OVERCHARGE!';

      // Spawn high-frequency square electrical sparks shooting out at right angles
      const rightAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (let i = 0; i < 36; i++) {
        const baseAngle = rightAngles[i % 4];
        const angle = baseAngle + (Math.random() - 0.5) * 0.12;
        const speed = 4.5 + Math.random() * 5.5;
        const pSize = 5 + Math.random() * 5;

        particles.push({
          x: deadBall.x,
          y: deadBall.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() < 0.6 ? '#10b981' : '#34d399',
          size: pSize,
          opacity: 1.0,
          decay: 0.026,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.opacity = Math.max(0, (this.opacity ?? 1) - (this.decay ?? 0.026));
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.fillStyle = this.color || '#10b981';
            const sz = this.size ?? 5;
            ctx.fillRect(this.x - sz / 2, this.y - sz / 2, sz, sz);
            ctx.restore();
          },
        });
      }

      let elapsed = 0;
      customRender = (ctx: CanvasRenderingContext2D, dt: number) => {
        elapsed += dt;
        const alpha = Math.max(0, 1 - elapsed / 1.2);
        if (alpha <= 0) return;

        // Draw neon green grid lines over the dead ball
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#022c22';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(deadBall.x, deadBall.y, originalRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        const step = 8;
        for (let gx = -originalRadius + 4; gx < originalRadius; gx += step) {
          ctx.beginPath();
          ctx.moveTo(deadBall.x + gx, deadBall.y - originalRadius);
          ctx.lineTo(deadBall.x + gx, deadBall.y + originalRadius);
          ctx.stroke();
        }
        for (let gy = -originalRadius + 4; gy < originalRadius; gy += step) {
          ctx.beginPath();
          ctx.moveTo(deadBall.x - originalRadius, deadBall.y + gy);
          ctx.lineTo(deadBall.x + originalRadius, deadBall.y + gy);
          ctx.stroke();
        }
        ctx.restore();
      };
      break;
    }

    // =========================================================================
    // DEFAULT: A massive 360-degree blast of 48 glowing debris fragments
    // =========================================================================
    case 'Default':
    default: {
      style = 'explosion';
      finisherLabel = '💥 KO EXPLOSION!';

      // A massive 360-degree blast of 48 glowing debris fragments
      for (let i = 0; i < 48; i++) {
        const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const speed = 4.5 + Math.random() * 6.5;
        const color = ['#f59e0b', '#ef4444', '#38bdf8', '#8b5cf6', '#10b981'][i % 5];
        particles.push({
          x: deadBall.x,
          y: deadBall.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          radius: 4 + Math.random() * 5,
          opacity: 1.0,
          decay: 0.022,
          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.opacity = Math.max(0, (this.opacity ?? 1) - (this.decay ?? 0.022));
          },
          draw(ctx: CanvasRenderingContext2D) {
            if ((this.opacity ?? 0) <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity ?? 1);
            ctx.fillStyle = this.color || '#f59e0b';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius ?? 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          },
        });
      }
      break;
    }
  }

  deadBall.fatalityState = {
    style,
    timer: 0,
    maxTimer: 2.5,
    attackerX: resolvedWinner ? resolvedWinner.x : deadBall.x,
    attackerY: resolvedWinner ? resolvedWinner.y : deadBall.y,
    attackerColor: resolvedWinner ? resolvedWinner.color : deadBall.color,
    finisherLabel,
    render: customRender,
  };

  if (activeFatalityDispatcher) {
    activeFatalityDispatcher(deadBall, resolvedWinner, style, finisherLabel);
  }

  // Exact 2000ms cinematic delay before triggering round end callback
  if (finisherTimeoutId !== null) {
    clearTimeout(finisherTimeoutId);
    finisherTimeoutId = null;
  }
  finisherTimeoutId = window.setTimeout(() => {
    finisherTimeoutId = null;
    if (activeFatalityCompleteCallback) {
      activeFatalityCompleteCallback(deadBall, resolvedWinner);
    }
  }, 2000);
}

if (typeof window !== 'undefined') {
  (window as any).triggerFatality = triggerFatality;
}

/* ==========================================================================
   REACT APP COMPONENT
   ========================================================================== */
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // NavigationManager Screen State
  const [activeScreen, setActiveScreen] = useState<ScreenId>('splash-screen');

  // Pre-Match Lobby States
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [isAbilityReadyGlow, setIsAbilityReadyGlow] = useState<boolean>(true);
  const [selectedArenaId] = useState<string>('cyber-neon');
  const [selectedArenaChoice, setSelectedArenaChoice] = useState<string>('Default');
  const [startingHealth, setStartingHealth] = useState<number>(100);

  // Custom Player Names
  const [p1Name, setP1Name] = useState<string>('Player 1');
  const [p2Name, setP2Name] = useState<string>('Bot Alpha');

  // 'Play against Bot' Checkbox (Single-player mode)
  const [playAgainstBot, setPlayAgainstBot] = useState<boolean>(true);

  // Character Select State (All subclasses selectable)
  const [p1BallType, setP1BallType] = useState<BallTypeId>('quadblade');
  const [p2BallType, setP2BallType] = useState<BallTypeId>('blackhole');

  // Selection State Variables (Drafting Phase: explicit lock-in confirmations)
  const [p1Drafting, setP1Drafting] = useState<BallTypeId | null>(null);
  const [p2Drafting, setP2Drafting] = useState<BallTypeId | null>(null);
  const [p1Locked, setP1Locked] = useState<boolean>(false);
  const [p2Locked, setP2Locked] = useState<boolean>(false);

  // Character Library Overlay State
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [selectedLibraryChar, setSelectedLibraryChar] = useState<BallTypeId | null>(null);

  // Sync with NavigationManager & auto-transition from #splash-screen to #main-menu after 2 seconds
  useEffect(() => {
    navigationManager.navigateTo('splash-screen');
    const unsubscribe = navigationManager.subscribe((nextScreen) => {
      setActiveScreen(nextScreen);
      setIsLibraryOpen(nextScreen === 'library-screen');
    });
    const splashTimer = window.setTimeout(() => {
      if (navigationManager.currentScreen === 'splash-screen') {
        navigationManager.navigateTo('main-menu');
      }
    }, 2000);
    return () => {
      window.clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  // Match / HUD state
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Global Player 1 Score and Player 2 Score starting at 0
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [matchStatus, setMatchStatus] = useState<string>('WAITING IN LOBBY');
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);

  // Strategic Autobattler Launch Phase States
  const [matchPhase, setMatchPhase] = useState<'lobby' | 'launch' | 'battle'>('lobby');
  const [p1AimLocked, setP1AimLocked] = useState<boolean>(false);
  const [p2AimLocked, setP2AimLocked] = useState<boolean>(false);

  // Online Multiplayer (Native Browser WebSocket -> Cloudflare Durable Objects) States & Refs
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const isOnlineModeRef = useRef<boolean>(false);
  isOnlineModeRef.current = isOnlineMode;
  const [onlineStatus, setOnlineStatus] = useState<'idle' | 'connecting' | 'waiting' | 'matched' | 'disconnected'>('idle');
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const onlineRoomIdRef = useRef<string | null>(null);
  onlineRoomIdRef.current = onlineRoomId;
  const [onlineRole, setOnlineRole] = useState<'Player 1' | 'Player 2' | null>(null);
  const onlineRoleRef = useRef<'Player 1' | 'Player 2' | null>(null);
  onlineRoleRef.current = onlineRole;
  const [onlineOpponentDisconnected, setOnlineOpponentDisconnected] = useState<boolean>(false);
  const [onlineRematchRequested, setOnlineRematchRequested] = useState<boolean>(false);
  const [opponentRematchReady, setOpponentRematchReady] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingWsCallbacksRef = useRef<Map<string, (res: any) => void>>(new Map());
  const authoritativeLocalTargetRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    isDead?: boolean;
    receivedAt: number;
  } | null>(null);
  const remoteOpponentTargetRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    hitbox: number;
    parryActive?: boolean;
    dodgeActive?: boolean;
    isDead?: boolean;
    abilityProgress?: number;
    abilityRemaining?: number;
    abilityActive?: boolean;
    abilityStatusText?: string;
    receivedAt: number;
  } | null>(null);
  const pendingStartRoundRef = useRef<{ p1Angle: number; p2Angle: number; serverTime?: number } | null>(null);
  const pendingOpponentLockRef = useRef<{ role: string; angle: number } | null>(null);

  const closeWebSocketSafely = (ws: WebSocket | null) => {
    if (!ws) return;
    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client disconnect');
      }
    } catch {
      // Ignore WebSocket close errors
    }
  };

  const disconnectOnlineSocket = useCallback(() => {
    if (socketRef.current) {
      closeWebSocketSafely(socketRef.current);
      socketRef.current = null;
    }
    authoritativeLocalTargetRef.current = null;
    remoteOpponentTargetRef.current = null;
    pendingStartRoundRef.current = null;
    pendingOpponentLockRef.current = null;
    setOnlineStatus('idle');
    setOnlineRoomId(null);
    setOnlineRole(null);
    setOnlineOpponentDisconnected(false);
    setOnlineRematchRequested(false);
    setOpponentRematchReady(false);
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        closeWebSocketSafely(socketRef.current);
        socketRef.current = null;
      }
    };
  }, []);

  // Trigger refs for keyboard / UI buttons to lock angles, trigger Parries & trigger Dodge Dashes
  const lockP1Ref = useRef<(() => void) | null>(null);
  const lockP2Ref = useRef<(() => void) | null>(null);
  const parryP1Ref = useRef<(() => void) | null>(null);
  const parryP2Ref = useRef<(() => void) | null>(null);
  const dashP1Ref = useRef<(() => void) | null>(null);
  const dashP2Ref = useRef<(() => void) | null>(null);
  const p1BallRef = useRef<Ball | null>(null);
  const p2BallRef = useRef<Ball | null>(null);
  const gameStateRef = useRef<'LAUNCH' | 'PLAYING' | 'FINISHER' | 'MENU'>('MENU');

  // Dynamic Mid-Match Arena Evolution Mutators (prevents stagnant gameplay)
  const [activeMutator, setActiveMutator] = useState<{
    id: 'NONE' | 'OVERDRIVE_BOUNCE' | 'GRAVITY_WELL' | 'METEOR_SHOWER' | 'BLOODLUST_SURGE';
    name: string;
    desc: string;
    color: string;
  }>({
    id: 'NONE',
    name: 'STANDARD ARENA',
    desc: 'Evolution Mutator rotates every 10s',
    color: '#38bdf8',
  });

  // Fair Play & Transparency Shield Modal (addresses unfair bans & developer opacity)
  const [isFairPlayModalOpen, setIsFairPlayModalOpen] = useState<boolean>(false);

  // Anti-Toxicity Safe Chat Filter & Opponent Mute Controls
  const [isOpponentMuted, setIsOpponentMuted] = useState<boolean>(false);
  const isOpponentMutedRef = useRef<boolean>(false);
  isOpponentMutedRef.current = isOpponentMuted;
  const [isChatFilterEnabled, setIsChatFilterEnabled] = useState<boolean>(true);
  const isChatFilterEnabledRef = useRef<boolean>(true);
  isChatFilterEnabledRef.current = isChatFilterEnabled;
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<
    { id: number; sender: 'P1' | 'P2'; text: string; wasFiltered?: boolean }[]
  >([
    { id: 1, sender: 'P2', text: 'GL HF! Let’s have a clean match! 🤝' },
  ]);

  const sanitizeChatText = useCallback((raw: string): { text: string; wasFiltered: boolean } => {
    if (!isChatFilterEnabledRef.current) {
      return { text: raw.trim(), wasFiltered: false };
    }
    const toxicPatterns = /\b(ez|easy|noob|trash|garbage|uninstall|loser|idiot|stupid|dumb|hack|hacker|cheater|script|bot|suck|pathetic|cringe|free|L|ratio|kill|die|hate|wtf|stfu|shut up)\b/i;
    if (toxicPatterns.test(raw)) {
      const wholesomeReplacements = [
        'GG WP! Great match! 🤝',
        'Incredible parry timing, respect! 🛡️',
        'That velocity clash was intense! ⚡',
        'Fun round! Best of luck next launch! 🔥',
      ];
      const replacement = wholesomeReplacements[Math.floor(Math.random() * wholesomeReplacements.length)];
      return { text: replacement, wasFiltered: true };
    }
    return { text: raw.trim(), wasFiltered: false };
  }, []);

  const handleSendChatMessage = useCallback(
    (sender: 'P1' | 'P2', rawText: string, fromRemote: boolean = false) => {
      if (!rawText.trim()) return;
      if (fromRemote && isOpponentMutedRef.current) return;
      if (!fromRemote && !isOnlineModeRef.current && sender === 'P2' && isOpponentMutedRef.current) return;
      const { text, wasFiltered } = sanitizeChatText(rawText);
      const effectiveSender: 'P1' | 'P2' =
        !fromRemote && isOnlineModeRef.current
          ? onlineRoleRef.current === 'Player 2'
            ? 'P2'
            : 'P1'
          : sender;
      setChatMessages((prev) => [
        ...prev.slice(-4),
        { id: Date.now() + Math.random(), sender: effectiveSender, text, wasFiltered },
      ]);
      if (!fromRemote && isOnlineModeRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        sendWsEvent(socketRef.current, 'chat_message', { text });
      }
    },
    [sanitizeChatText]
  );

  // Emote Wheel & Visual/Audio Expressions System
  const EMOTE_PRESETS: {
    id: string;
    emoji: string;
    label: string;
    color: string;
    wave: OscillatorType;
    startFreq: number;
    endFreq: number;
    chordFreq: number;
  }[] = [
    { id: 'gg', emoji: '🤝', label: 'GG', color: '#38bdf8', wave: 'sine', startFreq: 523.25, endFreq: 783.99, chordFreq: 1046.5 },
    { id: 'nice', emoji: '🔥', label: 'Nice Shot!', color: '#f97316', wave: 'triangle', startFreq: 440, endFreq: 880, chordFreq: 659.25 },
    { id: 'clutch', emoji: '🛡️', label: 'Clutch Parry!', color: '#facc15', wave: 'triangle', startFreq: 920, endFreq: 1380, chordFreq: 1840 },
    { id: 'close', emoji: '⚡', label: 'Close One!', color: '#a855f7', wave: 'sine', startFreq: 660, endFreq: 1180, chordFreq: 880 },
    { id: 'haha', emoji: '😄', label: 'Haha!', color: '#10b981', wave: 'sine', startFreq: 480, endFreq: 720, chordFreq: 960 },
    { id: 'respect', emoji: '👑', label: 'Respect!', color: '#fbbf24', wave: 'triangle', startFreq: 587.33, endFreq: 880, chordFreq: 1174.66 },
  ];

  const [isEmoteWheelOpen, setIsEmoteWheelOpen] = useState<boolean>(false);
  const isEmoteWheelOpenRef = useRef<boolean>(false);
  isEmoteWheelOpenRef.current = isEmoteWheelOpen;
  const activeEmotesRef = useRef<
    {
      id: number;
      target: 'P1' | 'P2';
      emoji: string;
      label: string;
      color: string;
      createdAt: number;
      duration: number;
    }[]
  >([]);

  const HOTKEY_EMOTES: {
    keyNum: '1' | '2' | '3' | '4';
    emoji: string;
    label: string;
    color: string;
  }[] = [
    { keyNum: '1', emoji: '😡', label: 'Rage!', color: '#ef4444' },
    { keyNum: '2', emoji: '😂', label: 'Haha!', color: '#facc15' },
    { keyNum: '3', emoji: '🥶', label: 'Ice Cold!', color: '#38bdf8' },
    { keyNum: '4', emoji: '💀', label: 'RIP!', color: '#a855f7' },
  ];

  const triggerHotkeyEmote = useCallback(
    (
      emoji: string,
      label?: string,
      color: string = '#facc15',
      targetOverride?: 'P1' | 'P2',
      fromRemote: boolean = false
    ) => {
      if (fromRemote && isOpponentMutedRef.current) return;
      const targetPlayer: 'P1' | 'P2' =
        targetOverride ??
        (isOnlineModeRef.current
          ? onlineRoleRef.current === 'Player 2'
            ? 'P2'
            : 'P1'
          : 'P1');

      const targetBall = targetPlayer === 'P1' ? p1BallRef.current : p2BallRef.current;
      if (targetBall) {
        targetBall.activeEmote = { emoji, timer: 2.5 };
      }
      // Clear any overlapping preset bubble for the same target
      activeEmotesRef.current = activeEmotesRef.current.filter((em) => em.target !== targetPlayer);

      audioController.initOnStartMatch();
      if (soundEnabled) {
        audioController.synthesizeEnvelope('sine', 540, 860, 0.12, 0.2, 'exponential');
      }

      setChatMessages((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now() + Math.random(),
          sender: targetPlayer,
          text: label ? `${emoji} ${label}` : emoji,
        },
      ]);

      if (!fromRemote && isOnlineModeRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        sendWsEvent(socketRef.current, 'player_emote', { emoteId: `hotkey:${emoji}` });
      }
      void color;
    },
    [soundEnabled]
  );

  const triggerEmote = useCallback(
    (emoteId: string, targetOverride?: 'P1' | 'P2', fromRemote: boolean = false) => {
      if (fromRemote && isOpponentMutedRef.current) return;
      if (emoteId.startsWith('hotkey:')) {
        const emoji = emoteId.slice('hotkey:'.length) || '😂';
        const hk = HOTKEY_EMOTES.find((h) => h.emoji === emoji);
        triggerHotkeyEmote(emoji, hk?.label, hk?.color, targetOverride, fromRemote);
        return;
      }

      const preset = EMOTE_PRESETS.find((e) => e.id === emoteId) || EMOTE_PRESETS[0];
      const targetPlayer: 'P1' | 'P2' =
        targetOverride ??
        (isOnlineModeRef.current
          ? onlineRoleRef.current === 'Player 2'
            ? 'P2'
            : 'P1'
          : 'P1');

      const targetBall = targetPlayer === 'P1' ? p1BallRef.current : p2BallRef.current;
      if (targetBall) {
        targetBall.activeEmote = null;
      }

      audioController.initOnStartMatch();
      if (soundEnabled) {
        audioController.synthesizeEnvelope(preset.wave, preset.startFreq, preset.endFreq, 0.16, 0.24, 'exponential');
        window.setTimeout(() => {
          if (soundEnabled) {
            audioController.synthesizeEnvelope('sine', preset.chordFreq, preset.chordFreq * 1.12, 0.14, 0.16, 'exponential');
          }
        }, 70);
      }

      activeEmotesRef.current.push({
        id: Date.now() + Math.random(),
        target: targetPlayer,
        emoji: preset.emoji,
        label: preset.label,
        color: preset.color,
        createdAt: performance.now(),
        duration: 2400,
      });

      setChatMessages((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now() + Math.random(),
          sender: targetPlayer,
          text: `${preset.emoji} ${preset.label}`,
        },
      ]);

      if (!fromRemote) {
        setIsEmoteWheelOpen(false);
        if (isOnlineModeRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
          sendWsEvent(socketRef.current, 'player_emote', { emoteId: preset.id });
        }
      }
    },
    [soundEnabled, triggerHotkeyEmote]
  );

  // Tactical Ping System (1-Click Ping Mode ON by default during battle; Alt+Click anytime)
  const tacticalPingsRef = useRef<
    {
      id: number;
      x: number;
      y: number;
      createdAt: number;
      duration: number;
      color: string;
      label: string;
      sector: string;
    }[]
  >([]);
  const [showPingCorner, setShowPingCorner] = useState<boolean>(true);
  const [networkPingMs, setNetworkPingMs] = useState<number>(12);
  const [latestPingCallout, setLatestPingCallout] = useState<string | null>(null);

  // Measure live round-trip ping (ms) for the Corner Ping HUD
  useEffect(() => {
    if (!showPingCorner) return;
    let isMounted = true;

    const measureLatency = async () => {
      const sock = socketRef.current;
      if (sock && sock.readyState === WebSocket.OPEN) {
        const start = performance.now();
        const reqId = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const timeoutId = window.setTimeout(() => {
          pendingWsCallbacksRef.current.delete(reqId);
        }, 1500);
        pendingWsCallbacksRef.current.set(reqId, () => {
          window.clearTimeout(timeoutId);
          if (isMounted) {
            const rtt = Math.max(1, Math.round(performance.now() - start));
            setNetworkPingMs(rtt);
          }
        });
        sendWsEvent(sock, 'ping_check', Date.now(), reqId);
        return;
      }

      try {
        const start = performance.now();
        const res = await fetch(`${WORKER_HTTP_URL}/api/health`, { cache: 'no-store' });
        if (res.ok && isMounted) {
          const rtt = Math.max(1, Math.round(performance.now() - start));
          setNetworkPingMs(rtt);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    measureLatency();
    const intervalId = window.setInterval(measureLatency, 2000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [showPingCorner, isOnlineMode, onlineStatus]);

  // Database-Backed Account, Guest Flow & Coin Economy System (JWT + Cloudflare D1 + Web Crypto)
  const [coins, setCoins] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authScreenTab, setAuthScreenTab] = useState<'login' | 'register' | null>(null);
  const [username, setUsername] = useState<string>('Fighter');
  const [isGuestAccount, setIsGuestAccount] = useState<boolean>(true);
  const [unlockedBalls, setUnlockedBalls] = useState<string[]>([]);
  const unlockedBallsRef = useRef<string[]>([]);
  unlockedBallsRef.current = unlockedBalls;
  const [, setAuthToken] = useState<string | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const walletSocketRef = useRef<WebSocket | null>(null);
  const [authModalMode, setAuthModalMode] = useState<null | 'login' | 'register' | 'link'>(null);
  const [authFormUsername, setAuthFormUsername] = useState<string>('');
  const [authFormPassword, setAuthFormPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [purchaseErrorMsg, setPurchaseErrorMsg] = useState<string | null>(null);

  const triggerForfeitVictoryRef = useRef<(() => void) | null>(null);
  const arenaCenterTextsRef = useRef<
    { text: string; x: number; y: number; alpha: number; color: string; vy: number }[]
  >([]);

  const connectWalletSocket = useCallback(
    (displayName: string) => {
      const token = localStorage.getItem('authToken') || authTokenRef.current || '';
      if (!token) return;
      if (walletSocketRef.current) {
        closeWebSocketSafely(walletSocketRef.current);
        walletSocketRef.current = null;
      }
      const wsUrl = `${WORKER_WS_URL}/ws/wallet?token=${encodeURIComponent(token)}&username=${encodeURIComponent(displayName)}`;
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type?: string;
            payload?: any;
            requestId?: string;
          };
          if (msg.requestId && pendingWsCallbacksRef.current.has(msg.requestId)) {
            const cb = pendingWsCallbacksRef.current.get(msg.requestId);
            pendingWsCallbacksRef.current.delete(msg.requestId);
            if (cb) cb(msg.payload);
          }
          switch (msg.type) {
            case 'wallet_updated':
              if (typeof msg.payload === 'number') {
                setCoins(msg.payload);
              }
              break;
            case 'unlocked_balls_updated':
              if (Array.isArray(msg.payload)) {
                setUnlockedBalls(msg.payload);
              }
              break;
            case 'purchase_error':
              setPurchaseErrorMsg(msg.payload?.error || 'Insufficient coins.');
              audioController.synthesizeEnvelope('sawtooth', 180, 95, 0.25, 0.32);
              break;
          }
        } catch {
          // Ignore malformed JSON frames
        }
      };
      walletSocketRef.current = ws;
    },
    []
  );

  const applyAuthenticatedUser = useCallback(
    (
      token: string,
      user: {
        _id: string;
        username: string;
        coins: number;
        isGuest: boolean;
        unlockedBalls?: string[];
      }
    ) => {
      authTokenRef.current = token;
      setAuthToken(token);
      const cleanName = (user.username || 'Fighter').slice(0, 12);
      setUsername(cleanName);
      setP1Name(cleanName);
      setCoins(typeof user.coins === 'number' ? user.coins : 0);
      setIsGuestAccount(Boolean(user.isGuest));
      setUnlockedBalls(Array.isArray(user.unlockedBalls) ? user.unlockedBalls : []);
      try {
        localStorage.setItem('authToken', token);
        localStorage.setItem('playerUsername', cleanName);
      } catch {
        // Ignore storage errors
      }
      setIsLoggedIn(true);
      connectWalletSocket(cleanName);
    },
    [connectWalletSocket]
  );

  const ensureAuthToken = useCallback(async (): Promise<string> => {
    try {
      const stored = localStorage.getItem('authToken');
      if (stored) {
        authTokenRef.current = stored;
        return stored;
      }
    } catch {
      // Ignore storage errors
    }
    if (authTokenRef.current) {
      return authTokenRef.current;
    }
    try {
      const guestRes = await fetch(`${WORKER_HTTP_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (guestRes.ok) {
        const guestData = await guestRes.json();
        if (guestData?.token && guestData?.user) {
          applyAuthenticatedUser(guestData.token, guestData.user);
          return String(guestData.token);
        }
      }
    } catch {
      // Ignore network errors
    }
    return '';
  }, [applyAuthenticatedUser]);

  const syncUserProgress = useCallback(
    async (updates: { username?: string }) => {
      const token = localStorage.getItem('authToken') || authTokenRef.current;
      if (!token) return;
      try {
        const res = await fetch(`${WORKER_HTTP_URL}/api/auth/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            authTokenRef.current = data.token;
            setAuthToken(data.token);
            try {
              localStorage.setItem('authToken', data.token);
            } catch {
              // Ignore storage errors
            }
          }
        }
      } catch {
        // Ignore transient network errors
      }
    },
    []
  );

  const getCharacterUnlockCost = useCallback(
    (characterId: string): number => (characterId.trim() === 'capedbaldy' ? 9999 : 100),
    []
  );

  const handlePurchaseCharacter = useCallback(
    (characterId: string, cost?: number) => {
      const resolvedCost = cost ?? getCharacterUnlockCost(characterId);
      setPurchaseErrorMsg(null);
      const activeSocket =
        socketRef.current && socketRef.current.readyState === WebSocket.OPEN
          ? socketRef.current
          : walletSocketRef.current;
      if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
        setPurchaseErrorMsg('Connecting to server wallet...');
        return;
      }
      const reqId = `buy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      pendingWsCallbacksRef.current.set(reqId, (res: { ok?: boolean; error?: string }) => {
        if (res?.error) {
          setPurchaseErrorMsg(res.error);
          audioController.synthesizeEnvelope('sawtooth', 180, 95, 0.25, 0.32);
        } else {
          setPurchaseErrorMsg(null);
          audioController.synthesizeEnvelope('sine', 520, 780, 0.14, 0.25);
        }
      });
      sendWsEvent(activeSocket, 'purchase_character', { characterId, cost: resolvedCost }, reqId);
    },
    [getCharacterUnlockCost]
  );

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem('authToken');
      } catch {
        return;
      }
      if (!storedToken) return;
      try {
        const res = await fetch(`${WORKER_HTTP_URL}/api/auth/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${storedToken}` },
          cache: 'no-store',
        });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            applyAuthenticatedUser(storedToken, data.user);
            navigationManager.navigateTo('main-menu');
          }
        } else if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('authToken');
        }
      } catch {
        // Keep Auth screen visible if Worker is offline during startup
      }
    };
    void restoreSession();

    return () => {
      active = false;
      if (walletSocketRef.current) {
        closeWebSocketSafely(walletSocketRef.current);
        walletSocketRef.current = null;
      }
    };
  }, [applyAuthenticatedUser]);

  const handlePlayAsGuest = async () => {
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const guestRes = await fetch(`${WORKER_HTTP_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const guestData = await guestRes.json();
      if (!guestRes.ok) {
        setAuthError(guestData?.error || 'Failed to start guest session.');
      } else if (guestData?.token && guestData?.user) {
        localStorage.setItem('authToken', guestData.token);
        setIsLoggedIn(true);
        applyAuthenticatedUser(guestData.token, guestData.user);
        setAuthScreenTab(null);
        navigationManager.navigateTo('main-menu');
      }
    } catch {
      setAuthError('Network error while starting guest session.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthOverlaySubmit = async (
    mode: 'login' | 'register',
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();
    if (authLoading) return;
    if (!authFormUsername.trim() || !authFormPassword) {
      setAuthError('Please enter both username and password.');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      // Point directly to your Cloudflare Worker URL for Auth
      const endpoint = `${WORKER_HTTP_URL}/api/auth/${mode}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authFormUsername.trim(),
          password: authFormPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data?.error || 'Authentication failed.');
      } else if (data?.token && data?.user) {
        localStorage.setItem('authToken', data.token);
        setIsLoggedIn(true);
        applyAuthenticatedUser(data.token, data.user);
        setAuthFormUsername('');
        setAuthFormPassword('');
        setAuthScreenTab(null);
        navigationManager.navigateTo('main-menu');
      }
    } catch {
      setAuthError('Network error while contacting Cloudflare authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuthCredential = useCallback(
    async (credential: string) => {
      if (authLoading) return;
      setAuthError(null);
      setAuthLoading(true);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const currentToken = localStorage.getItem('authToken') || authTokenRef.current;
        if (currentToken) {
          headers.Authorization = `Bearer ${currentToken}`;
        }
        const res = await fetch(`${WORKER_HTTP_URL}/api/auth/google`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data?.error || 'Google authentication failed.');
        } else if (data?.token && data?.user) {
          applyAuthenticatedUser(data.token, data.user);
          setAuthModalMode(null);
          setAuthScreenTab(null);
          setAuthFormUsername('');
          setAuthFormPassword('');
          navigationManager.navigateTo('main-menu');
        }
      } catch {
        setAuthError('Network error while contacting Cloudflare authentication server.');
      } finally {
        setAuthLoading(false);
      }
    },
    [authLoading, applyAuthenticatedUser]
  );

  const handleUsernameChange = useCallback(
    (value: string) => {
      const sliced = value.slice(0, 12);
      setUsername(sliced);
      setP1Name(sliced.trim() || 'Fighter');
      try {
        localStorage.setItem('playerUsername', sliced);
      } catch {
        // Ignore localStorage access errors
      }
      if (sliced.trim().length >= 2) {
        syncUserProgress({ username: sliced.trim() });
      }
    },
    [syncUserProgress]
  );

  const handleSubmitAuthForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModalMode || authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint =
        authModalMode === 'login'
          ? `${WORKER_HTTP_URL}/api/auth/login`
          : authModalMode === 'link'
          ? `${WORKER_HTTP_URL}/api/auth/link`
          : `${WORKER_HTTP_URL}/api/auth/register`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const currentToken = localStorage.getItem('authToken') || authTokenRef.current;
      if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: authFormUsername.trim(),
          password: authFormPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data?.error || 'Authentication failed.');
      } else if (data?.token && data?.user) {
        localStorage.setItem('authToken', data.token);
        setIsLoggedIn(true);
        applyAuthenticatedUser(data.token, data.user);
        setAuthModalMode(null);
        setAuthFormUsername('');
        setAuthFormPassword('');
      }
    } catch {
      setAuthError('Network error while contacting authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Custom Private Lobby & Matchmaking UI State
  const [joinMethod, setJoinMethod] = useState<'menu' | 'create' | 'join'>('menu');
  const [customRoomId, setCustomRoomId] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isWaitingForFriend, setIsWaitingForFriend] = useState<boolean>(false);
  const [isMatchmakingSearching, setIsMatchmakingSearching] = useState<boolean>(false);

  // 3-Ball Draft & Coin Re-Roll State (Saitama stays locked out of free drafts until unlocked for 9,999 Coins)
  const [draftOptions, setDraftOptions] = useState<(typeof BALL_TYPES)[number][]>(() => {
    const pool = BALL_TYPES.filter((b) => b.id !== 'capedbaldy');
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  });
  const [isDraftLockedWaiting, setIsDraftLockedWaiting] = useState<boolean>(false);
  const [opponentDraftLocked, setOpponentDraftLocked] = useState<boolean>(false);
  const [rerollErrorFlash, setRerollErrorFlash] = useState<boolean>(false);
  const rerollFlashTimeoutRef = useRef<number | null>(null);

  const generateDraft = useCallback(() => {
    const hasSaitama = unlockedBallsRef.current.includes('capedbaldy');
    const pool = BALL_TYPES.filter((b) => b.id !== 'capedbaldy' || hasSaitama);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked3 = pool.slice(0, 3);
    setDraftOptions(picked3);
    return picked3;
  }, []);

  // Post-Round UI Overlay State
  const [roundOverlay, setRoundOverlay] = useState<{
    text: string;
    winnerPlayerLabel: string;
    winnerName: string;
    winnerSubClass: string;
    winnerEmoji: string;
    winnerColor: string;
    winnerBallColor: string;
    p1ScoreSnapshot?: number;
    p2ScoreSnapshot?: number;
    coinsEarned?: number;
  } | null>(null);

  // 3-Heart Multi-Round Match State & Round Over Overlay
  const [p1Hearts, setP1Hearts] = useState<number>(3);
  const p1HeartsRef = useRef<number>(3);
  p1HeartsRef.current = p1Hearts;
  const [p2Hearts, setP2Hearts] = useState<number>(3);
  const p2HeartsRef = useRef<number>(3);
  p2HeartsRef.current = p2Hearts;
  const [roundOverBanner, setRoundOverBanner] = useState<boolean>(false);
  const [uiGameState, setUiGameState] = useState<string>('menu');
  const triggerFinalVictoryRef = useRef<((winnerSide?: 'p1' | 'p2') => void) | null>(null);

  const setGameState = useCallback((nextState: string) => {
    setUiGameState(nextState);
    if (nextState === 'draft') {
      setIsMatchStarted(false);
      navigationManager.navigateTo('character-select');
    } else if (nextState === 'launch' || nextState === 'playing') {
      setIsMatchStarted(true);
      navigationManager.navigateTo('game-screen');
    } else if (nextState === 'menu') {
      setIsMatchStarted(false);
      navigationManager.navigateTo('main-menu');
    }
  }, []);

  const isDraftPhase = uiGameState === 'draft' || activeScreen === 'character-select';

  // Score tracking refs for instantaneous gameLoop callbacks
  const p1ScoreRef = useRef(p1Score);
  p1ScoreRef.current = p1Score;
  const p2ScoreRef = useRef(p2Score);
  p2ScoreRef.current = p2Score;

  // Counter-Pick / Change Balls State
  const [isChangingBalls, setIsChangingBalls] = useState<boolean>(false);
  const [roundKey, setRoundKey] = useState<number>(0);

  const roundTimeoutRef = useRef<number | null>(null);
  const resetRoundRef = useRef<(() => void) | null>(null);

  // Escalation Phase, Sudden Death Countdown & Ability/Dash Cooldown HUD States
  const [roundSeconds, setRoundSeconds] = useState<number>(0);
  const [isEscalated, setIsEscalated] = useState<boolean>(false);
  const [suddenDeathOverlay, setSuddenDeathOverlay] = useState<boolean>(false);
  const [suddenDeathCountdown, setSuddenDeathCountdown] = useState<number>(30);
  const [p1AbilityProgress, setP1AbilityProgress] = useState<number>(1);
  const [p2AbilityProgress, setP2AbilityProgress] = useState<number>(1);
  const [p1AbilityHud, setP1AbilityHud] = useState<{
    remaining: number;
    isActive: boolean;
    statusText: string;
  }>({ remaining: 0, isActive: false, statusText: 'READY' });
  const [p2AbilityHud, setP2AbilityHud] = useState<{
    remaining: number;
    isActive: boolean;
    statusText: string;
  }>({ remaining: 0, isActive: false, statusText: 'READY' });
  const [p1DashRemaining, setP1DashRemaining] = useState<number>(0);
  const [p2DashRemaining, setP2DashRemaining] = useState<number>(0);
  const suddenDeathTimerRef = useRef<number | null>(null);

  const selectedArena = ARENA_THEMES.find((a) => a.id === selectedArenaId) || ARENA_THEMES[0];

  // Sync sound toggle with the native Web Audio API AudioController
  useEffect(() => {
    audioController.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioController.setSoundEnabled(next);
      if (next) {
        audioController.initOnStartMatch();
      }
      return next;
    });
  }, []);

  const playSound = useCallback((type: ArenaSoundEffect) => {
    audioController.playEffect(type);
  }, []);

  // Strategic Autobattler Keyboard Listeners: Spacebar (Lock P1), Enter (Lock P2), Q (P1 Parry), E (P1 Dash), P or / (P2 Parry), O (P2 Dash), M (Mute Audio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (document.activeElement?.tagName || '').toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'SELECT' || targetTag === 'TEXTAREA') {
        return;
      }
      if ([' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.code === 'Space' || e.key === ' ') {
        if (isOnlineModeRef.current && onlineRoleRef.current === 'Player 2') {
          lockP2Ref.current?.();
        } else {
          lockP1Ref.current?.();
        }
      } else if (e.code === 'Enter' || e.key === 'Enter') {
        if (isOnlineModeRef.current && onlineRoleRef.current === 'Player 1') {
          lockP1Ref.current?.();
        } else {
          lockP2Ref.current?.();
        }
      } else if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
        if (isOnlineModeRef.current && onlineRoleRef.current === 'Player 2') {
          parryP2Ref.current?.();
        } else {
          parryP1Ref.current?.();
        }
      } else if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        if (isOnlineModeRef.current && onlineRoleRef.current === 'Player 2') {
          dashP2Ref.current?.();
        } else {
          dashP1Ref.current?.();
        }
      } else if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.code === 'Slash' || e.key === '/') {
        if (!isOnlineModeRef.current || onlineRoleRef.current === 'Player 2') {
          parryP2Ref.current?.();
        }
      } else if (e.code === 'KeyO' || e.key === 'o' || e.key === 'O') {
        if (!isOnlineModeRef.current || onlineRoleRef.current === 'Player 2') {
          dashP2Ref.current?.();
        }
      } else if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') {
        setIsEmoteWheelOpen((prev) => !prev);
      } else if (isEmoteWheelOpenRef.current && ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        const idx = Number(e.code.replace('Digit', '')) - 1;
        const preset = EMOTE_PRESETS[idx];
        if (preset) triggerEmote(preset.id);
      } else if (
        gameStateRef.current === 'PLAYING' &&
        (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code) || ['1', '2', '3', '4'].includes(e.key))
      ) {
        const keyNum = ['1', '2', '3', '4'].includes(e.key)
          ? e.key
          : e.code.replace('Digit', '');
        const hk = HOTKEY_EMOTES.find((h) => h.keyNum === keyNum);
        if (hk) {
          triggerHotkeyEmote(hk.emoji, hk.label, hk.color);
        }
      } else if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleToggleSound, triggerEmote, triggerHotkeyEmote]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderArena = (
    ctx: CanvasRenderingContext2D,
    _theme: ArenaTheme,
    width: number,
    height: number,
    arenaX: number,
    arenaY: number,
    arenaSize: number,
    wallThickness: number,
    innerLeft: number,
    innerRight: number,
    innerTop: number,
    innerBottom: number,
    isEscalated: boolean = false
  ) => {
    if (currentArena === 'Road') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(innerLeft + 32, innerTop);
      ctx.lineTo(innerLeft + 32, innerBottom);
      ctx.moveTo(innerRight - 32, innerTop);
      ctx.lineTo(innerRight - 32, innerBottom);
      ctx.stroke();

      const centerX = (innerLeft + innerRight) / 2;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.setLineDash([28, 18]);
      ctx.beginPath();
      ctx.moveTo(centerX, innerTop);
      ctx.lineTo(centerX, innerBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.save();
      if (isEscalated) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
      }
      ctx.strokeStyle = isEscalated ? '#7f1d1d' : '#334155';
      ctx.lineWidth = wallThickness;
      ctx.strokeRect(
        arenaX + wallThickness / 2,
        arenaY + wallThickness / 2,
        arenaSize - wallThickness,
        arenaSize - wallThickness
      );
      ctx.strokeStyle = isEscalated ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = isEscalated ? 4 : 2.5;
      ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
      ctx.restore();
      return;
    }

    if (currentArena === 'Ice') {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, width, height);

      const iceGrad = ctx.createLinearGradient(innerLeft, innerTop, innerRight, innerBottom);
      iceGrad.addColorStop(0, '#bae6fd');
      iceGrad.addColorStop(0.5, '#7dd3fc');
      iceGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = iceGrad;
      ctx.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(innerLeft + 45, innerTop + 60);
      ctx.lineTo(innerLeft + 160, innerTop + 130);
      ctx.lineTo(innerLeft + 210, innerTop + 220);
      ctx.moveTo(innerRight - 65, innerBottom - 70);
      ctx.lineTo(innerRight - 180, innerBottom - 150);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      if (isEscalated) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
      }
      ctx.strokeStyle = isEscalated ? '#7f1d1d' : '#0284c7';
      ctx.lineWidth = wallThickness;
      ctx.strokeRect(
        arenaX + wallThickness / 2,
        arenaY + wallThickness / 2,
        arenaSize - wallThickness,
        arenaSize - wallThickness
      );
      ctx.strokeStyle = isEscalated ? '#ef4444' : '#e0f2fe';
      ctx.lineWidth = isEscalated ? 4 : 2.5;
      ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
      ctx.restore();
      return;
    }

    // 1. Canvas background (outside the arena): light blue to simulate a sky
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(0, 0, width, height);

    // 2. Arena interior: clean, solid gray square
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

    // 3. Thick, dark border around the solid gray square arena (glows crimson red in Sudden Death)
    ctx.save();
    if (isEscalated) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
    }
    ctx.strokeStyle = isEscalated ? '#7f1d1d' : '#1e293b';
    ctx.lineWidth = wallThickness;
    ctx.lineJoin = 'miter';
    ctx.strokeRect(
      arenaX + wallThickness / 2,
      arenaY + wallThickness / 2,
      arenaSize - wallThickness,
      arenaSize - wallThickness
    );

    // Crisp inner & outer edge definition on the thick border
    ctx.strokeStyle = isEscalated ? '#ef4444' : '#0f172a';
    ctx.lineWidth = isEscalated ? 4 : 2.5;
    ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
    ctx.strokeRect(arenaX, arenaY, arenaSize, arenaSize);
    ctx.restore();
  };

  // Base ball radius (38.4) is multiplied by 1.3 inside the Ball constructor (38.4 * 1.3 = 49.92) while keeping arena size (620) unchanged
  const BASE_BALL_RADIUS = 38.4;

  const spawnTacticalPingMarker = useCallback(
    (
      pingX: number,
      pingY: number,
      sector: string,
      chosenColor: string,
      calloutAuthor: string,
      emitToOnline: boolean
    ) => {
      tacticalPingsRef.current.push({
        id: Date.now() + Math.random(),
        x: pingX,
        y: pingY,
        createdAt: performance.now(),
        duration: 2400, // 2.4s brief fading visual marker
        color: chosenColor,
        label: '📍 TACTICAL PING',
        sector,
      });

      // Spawn a subtle burst of tactical sonar particles at the ping location
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const speed = 2.5 + Math.random() * 3.5;
        particles.push({
          x: pingX,
          y: pingY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3.5,
          color: i % 2 === 0 ? chosenColor : '#ffffff',
          life: 1.0,
          decay: 0.025,
          type: 0,
        });
      }

      // Synthesized tactical sonar double-chime (respects global sound mute)
      audioController.initOnStartMatch();
      if (soundEnabled) {
        audioController.synthesizeEnvelope('sine', 1046, 1568, 0.11, 0.16, 'exponential');
        window.setTimeout(() => {
          if (soundEnabled) {
            audioController.synthesizeEnvelope('sine', 1568, 1760, 0.12, 0.1, 'exponential');
          }
        }, 75);
      }

      const calloutText = `📍 ${calloutAuthor.slice(0, 12)} pinged ${sector} (${Math.round(pingX)}, ${Math.round(pingY)})`;
      setLatestPingCallout(calloutText);

      if (emitToOnline && isOnlineModeRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
        sendWsEvent(socketRef.current, 'tactical_ping', {
          x: pingX,
          y: pingY,
          sector,
          color: chosenColor,
        });
      }
    },
    [soundEnabled]
  );

  const triggerTacticalPingAtClientCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const CANVAS_W = 1280;
      const CANVAS_H = 720;
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      const rawX = (clientX - rect.left) * scaleX;
      const rawY = (clientY - rect.top) * scaleY;

      // Clamp ping within the 620x620 arena interior bounds so it always highlights an actionable arena area
      const ARENA_SIZE = 620;
      const WALL_THICKNESS = 20;
      const innerLeft = (CANVAS_W - ARENA_SIZE) / 2 + WALL_THICKNESS;
      const innerRight = (CANVAS_W + ARENA_SIZE) / 2 - WALL_THICKNESS;
      const innerTop = (CANVAS_H - ARENA_SIZE) / 2 + WALL_THICKNESS;
      const innerBottom = (CANVAS_H + ARENA_SIZE) / 2 - WALL_THICKNESS;

      const pingX = Math.max(innerLeft + 24, Math.min(innerRight - 24, rawX));
      const pingY = Math.max(innerTop + 24, Math.min(innerBottom - 24, rawY));

      const centerX = (innerLeft + innerRight) / 2;
      const centerY = (innerTop + innerBottom) / 2;
      const distFromCenter = Math.hypot(pingX - centerX, pingY - centerY);
      const sector =
        distFromCenter < 110
          ? 'CENTER'
          : `${pingY < centerY ? 'NORTH' : 'SOUTH'}-${pingX < centerX ? 'WEST' : 'EAST'}`;

      const pingColors = ['#38bdf8', '#facc15', '#10b981', '#f43f5e'];
      const chosenColor = pingColors[tacticalPingsRef.current.length % pingColors.length];
      const authorName =
        isOnlineModeRef.current && onlineRoleRef.current === 'Player 2'
          ? (p2Name || 'Player 2')
          : (p1Name || 'Player 1');

      spawnTacticalPingMarker(pingX, pingY, sector, chosenColor, authorName, true);
    },
    [p1Name, p2Name, spawnTacticalPingMarker]
  );

  // Handle Alt+Click on #game-canvas to place a brief, fading Tactical Ping visual marker (normal clicks/taps never trigger ping)
  const handleCanvasTacticalPing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      triggerTacticalPingAtClientCoords(e.clientX, e.clientY);
    },
    [triggerTacticalPingAtClientCoords]
  );

  // Renders all active Tactical Pings on the canvas with expanding sonar rings, rotating crosshair & fading alpha
  const drawTacticalPings = useCallback((ctx: CanvasRenderingContext2D) => {
    const pings = tacticalPingsRef.current;
    if (pings.length === 0) return;

    const now = performance.now();
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      const elapsed = now - p.createdAt;
      if (elapsed >= p.duration) {
        pings.splice(i, 1);
        continue;
      }

      const progress = Math.max(0, Math.min(1, elapsed / p.duration));
      // Smooth fade-in during first 8%, then gradual fade-out to 0
      const fadeAlpha =
        progress < 0.08
          ? progress / 0.08
          : Math.max(0, Math.pow(1 - (progress - 0.08) / 0.92, 1.35));

      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      // 1. Dual Expanding Sonar Pulse Rings (scaled +30% to match larger entities)
      const pulse1 = ((elapsed / 650) % 1);
      const pulse2 = (((elapsed / 650) + 0.5) % 1);
      const maxRingR = 88;

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = fadeAlpha * (1 - pulse1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18 + pulse1 * maxRingR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = fadeAlpha * (1 - pulse2) * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18 + pulse2 * maxRingR, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Highlighted Area Zone Fill & Rotating Tactical Target Reticle
      ctx.globalAlpha = fadeAlpha * 0.22;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = fadeAlpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(elapsed * 0.0025);

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Tactical Corner Crosshair Ticks
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      const tickInner = 16;
      const tickOuter = 30;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * tickInner, Math.sin(a) * tickInner);
        ctx.lineTo(Math.cos(a) * tickOuter, Math.sin(a) * tickOuter);
        ctx.stroke();
      }
      ctx.restore();

      // High-contrast center bullseye dot
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // 3. Vertical Tactical Beacon Beam & Floating Sector Callout Tag
      const bounceOffset = Math.sin(elapsed * 0.012) * 6;
      const beaconTopY = p.y - 64 + bounceOffset;

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 12);
      ctx.lineTo(p.x, beaconTopY + 12);
      ctx.stroke();

      // Diamond pointer above ping center
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, beaconTopY + 14);
      ctx.lineTo(p.x - 9, beaconTopY + 2);
      ctx.lineTo(p.x, beaconTopY - 10);
      ctx.lineTo(p.x + 9, beaconTopY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Callout Pill Label
      const tagText = `${p.label} • ${p.sector}`;
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(tagText).width;
      const tagY = beaconTopY - 24;

      ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x - tw / 2 - 10, tagY - 11, tw + 20, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, p.x, tagY);

      ctx.restore();
    }
  }, []);

  // Renders floating animated preset Emote speech bubbles directly above the active player balls
  const drawActiveEmotes = useCallback((ctx: CanvasRenderingContext2D, p1Ball: Ball, p2Ball: Ball) => {
    const now = performance.now();

    const emotes = activeEmotesRef.current;
    if (emotes.length === 0) return;

    for (let i = emotes.length - 1; i >= 0; i--) {
      const em = emotes[i];
      const elapsed = now - em.createdAt;
      if (elapsed >= em.duration) {
        emotes.splice(i, 1);
        continue;
      }

      const ball = em.target === 'P1' ? p1Ball : p2Ball;
      const progress = Math.max(0, Math.min(1, elapsed / em.duration));
      const popScale =
        progress < 0.12
          ? 0.5 + (progress / 0.12) * 0.62
          : progress < 0.2
          ? 1.12 - ((progress - 0.12) / 0.08) * 0.12
          : 1.0;
      const alpha = progress > 0.78 ? Math.max(0, (1 - progress) / 0.22) : 1.0;
      const bobY = Math.sin(elapsed * 0.008) * 3.5;

      const bubbleX = Math.max(120, Math.min(1160, ball.x));
      const bubbleY = Math.max(46, ball.y - ball.radius - 42 + bobY);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(bubbleX, bubbleY);
      ctx.scale(popScale, popScale);

      const text = `${em.emoji} ${em.label}`;
      ctx.font = '900 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const w = Math.max(88, ctx.measureText(text).width + 26);
      const h = 34;

      ctx.shadowColor = em.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = em.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 12);
      ctx.fill();
      ctx.stroke();

      // Speech bubble pointer tail
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.moveTo(-7, h / 2 - 1);
      ctx.lineTo(0, h / 2 + 9);
      ctx.lineTo(7, h / 2 - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = em.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, h / 2);
      ctx.lineTo(0, h / 2 + 9);
      ctx.lineTo(7, h / 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 0, 1);
      ctx.restore();
    }
  }, []);

  // Static preview render when in lobby or waiting in online matchmaking queue (skipped when DraftScreen replaces Canvas)
  useEffect(() => {
    if (isDraftPhase) return;
    if (isMatchStarted && (!isOnlineMode || onlineStatus === 'matched')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const scaledEntityCtx = createScaledEntityContext(ctx, 1.0);

    const CANVAS_W = 1280;
    const CANVAS_H = 720;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const ARENA_SIZE = 620;
    const ARENA_X = (CANVAS_W - ARENA_SIZE) / 2;
    const ARENA_Y = (CANVAS_H - ARENA_SIZE) / 2;
    const WALL_THICKNESS = 20;

    const innerLeft = ARENA_X + WALL_THICKNESS;
    const innerRight = ARENA_X + ARENA_SIZE - WALL_THICKNESS;
    const innerTop = ARENA_Y + WALL_THICKNESS;
    const innerBottom = ARENA_Y + ARENA_SIZE - WALL_THICKNESS;

    renderArena(
      ctx,
      selectedArena,
      CANVAS_W,
      CANVAS_H,
      ARENA_X,
      ARENA_Y,
      ARENA_SIZE,
      WALL_THICKNESS,
      innerLeft,
      innerRight,
      innerTop,
      innerBottom
    );

    const previewP1 = createBall(
      p1BallType,
      innerLeft + ARENA_SIZE * 0.22,
      innerTop + (innerBottom - innerTop) * 0.5,
      BASE_BALL_RADIUS,
      32,
      '#38bdf8',
      '#0284c7',
      p1Name.trim() || 'Player 1',
      startingHealth
    );

    const previewP2 = createBall(
      p2BallType,
      innerRight - ARENA_SIZE * 0.22,
      innerTop + (innerBottom - innerTop) * 0.5,
      BASE_BALL_RADIUS,
      32,
      '#f97316',
      '#ea580c',
      p2Name.trim() || (playAgainstBot ? 'Bot (AI)' : 'Player 2'),
      startingHealth
    );

    previewP1.drawBackground(scaledEntityCtx);
    previewP2.drawBackground(scaledEntityCtx);

    previewP1.draw(ctx);
    previewP2.draw(ctx);
    drawTacticalPings(ctx);
    drawActiveEmotes(ctx, previewP1, previewP2);
  }, [isDraftPhase, isMatchStarted, isOnlineMode, onlineStatus, selectedArena, selectedArenaChoice, startingHealth, playAgainstBot, p1BallType, p2BallType, p1Name, p2Name, drawTacticalPings, drawActiveEmotes]);

  // Main Active Game Loop (ONLY runs after user enters Launch Phase and Canvas replaces DraftScreen)
  useEffect(() => {
    if (!isMatchStarted || isDraftPhase) return;
    if (isOnlineMode && onlineStatus !== 'matched') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;
    const scaledEntityCtx = createScaledEntityContext(ctx, 1.35);

    const CANVAS_W = 1280;
    const CANVAS_H = 720;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const ARENA_SIZE = 620;
    const ARENA_X = (CANVAS_W - ARENA_SIZE) / 2;
    const ARENA_Y = (CANVAS_H - ARENA_SIZE) / 2;
    const WALL_THICKNESS = 20;

    const innerLeft = ARENA_X + WALL_THICKNESS;
    const innerRight = ARENA_X + ARENA_SIZE - WALL_THICKNESS;
    const innerTop = ARENA_Y + WALL_THICKNESS;
    const innerBottom = ARENA_Y + ARENA_SIZE - WALL_THICKNESS;

    // Instantiate Player 1 and Player 2 with chosen subclasses, +20% base radius (38.4), and custom names
    let p1 = createBall(
      p1BallType,
      innerLeft + ARENA_SIZE * 0.22,
      innerTop + (innerBottom - innerTop) * 0.5,
      BASE_BALL_RADIUS,
      32,
      '#38bdf8',
      '#0284c7',
      p1Name.trim() || 'Player 1',
      startingHealth
    );

    let p2 = createBall(
      p2BallType,
      innerRight - ARENA_SIZE * 0.22,
      innerTop + (innerBottom - innerTop) * 0.5,
      BASE_BALL_RADIUS,
      32,
      '#f97316',
      '#ea580c',
      p2Name.trim() || (playAgainstBot ? 'Bot (AI)' : 'Player 2'),
      startingHealth
    );

    p1.currentOpponent = p2;
    p2.currentOpponent = p1;
    p1.launchAngle = 0;
    p2.launchAngle = Math.PI;
    p1BallRef.current = p1;
    p2BallRef.current = p2;
    gameStateRef.current = 'LAUNCH';
    const balls: Ball[] = [p1, p2];

    const updateAimFromClientCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos.x = (clientX - rect.left) * scaleX;
      mousePos.y = (clientY - rect.top) * scaleY;
      hasMouseAimInput = true;
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      updateAimFromClientCoords(e.clientX, e.clientY);
    };

    canvas.addEventListener('mousemove', handleCanvasMouseMove);

    setP1Hp(startingHealth);
    setP2Hp(startingHealth);
    setMatchPhase('launch');
    setP1AimLocked(false);
    setP2AimLocked(false);
    setMatchStatus('LAUNCH PHASE: LOCK ANGLES');
    setRoundOverlay(null);

    // Global Particle Engine: Reset particles array for the match/round
    particles.length = 0;
    const shockwaves: { x: number; y: number; radius: number; maxRadius: number; color: string; alpha: number }[] = [];

    const spawnSparks = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 3,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 20 + Math.random() * 15,
        });
      }
    };

    const spawnShockwave = (x: number, y: number, color: string, maxRadius = 80) => {
      shockwaves.push({
        x,
        y,
        radius: 12,
        maxRadius,
        color,
        alpha: 0.95,
      });
    };

    const triggerExplosionAnimation = (x: number, y: number, primaryColor: string) => {
      spawnShockwave(x, y, '#ffffff', 140);
      spawnShockwave(x, y, primaryColor, 180);
      spawnShockwave(x, y, '#ef4444', 210);

      for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 14;
        const colors = ['#ffffff', primaryColor, '#f43f5e', '#fbbf24', '#f97316'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 5,
          color: chosenColor,
          alpha: 1.0,
          life: 0,
          maxLife: 45 + Math.random() * 35,
        });
      }
    };

    // Connect global triggerFatality to this Canvas instance's particle & shockwave systems
    activeFatalityDispatcher = (deadBall, attacker, style, finisherLabel) => {
      const x = deadBall.x;
      const y = deadBall.y;
      const winColor = attacker ? attacker.color : deadBall.color;

      if (!deadBall.fatalityState) {
        deadBall.fatalityState = {
          style,
          timer: 0,
          maxTimer: 2.5,
          attackerX: attacker ? attacker.x : x,
          attackerY: attacker ? attacker.y : y,
          attackerColor: winColor,
          finisherLabel,
          render: () => {},
        };
      }

      deadBall.floatingTexts.push({
        text: finisherLabel,
        x,
        y: y - deadBall.radius - 36,
        alpha: 1.0,
        color: '#facc15',
        vy: -0.9,
      });

      switch (style) {
        case 'slash': {
          spawnShockwave(x, y, '#ef4444', 215);
          spawnShockwave(x, y, '#ffffff', 165);
          // Directional bisecting blade sparks along diagonal cuts
          for (let i = 0; i < 80; i++) {
            const diag = i % 2 === 0 ? Math.PI * 0.25 : Math.PI * 0.75;
            const spread = (Math.random() - 0.5) * 0.4;
            const dir = (i < 40 ? 1 : -1) * (8 + Math.random() * 24);
            particles.push({
              x,
              y,
              vx: Math.cos(diag + spread) * dir,
              vy: Math.sin(diag + spread) * dir,
              radius: 3 + Math.random() * 5.5,
              color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ef4444' : '#cbd5e1',
              alpha: 1.0,
              life: 0,
              maxLife: 100 + Math.random() * 50,
            });
          }
          break;
        }
        case 'beam': {
          spawnShockwave(x, y, '#38bdf8', 240);
          spawnShockwave(x, y, '#ffffff', 180);
          const beamAngle = attacker ? Math.atan2(y - attacker.y, x - attacker.x) : 0;
          for (let i = 0; i < 85; i++) {
            const a = beamAngle + (Math.random() - 0.5) * 0.75;
            const speed = 9 + Math.random() * 25;
            particles.push({
              x,
              y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              radius: 3.5 + Math.random() * 6,
              color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#38bdf8' : '#facc15',
              alpha: 1.0,
              life: 0,
              maxLife: 100 + Math.random() * 50,
            });
          }
          break;
        }
        case 'sniper': {
          spawnShockwave(x, y, '#facc15', 200);
          const shotAngle = attacker ? Math.atan2(y - attacker.y, x - attacker.x) : 0;
          // High-velocity exit cone behind the dead ball
          for (let i = 0; i < 75; i++) {
            const a = shotAngle + (Math.random() - 0.5) * 0.6;
            const speed = 10 + Math.random() * 26;
            particles.push({
              x,
              y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              radius: 3 + Math.random() * 5.5,
              color: i % 3 === 0 ? '#facc15' : i % 2 === 0 ? '#ef4444' : '#ffffff',
              alpha: 1.0,
              life: 0,
              maxLife: 95 + Math.random() * 45,
            });
          }
          break;
        }
        case 'lightning': {
          spawnShockwave(x, y, '#facc15', 230);
          spawnShockwave(x, y, '#38bdf8', 180);
          for (let i = 0; i < 85; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 24;
            particles.push({
              x,
              y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              radius: 3 + Math.random() * 5.5,
              color: i % 2 === 0 ? '#facc15' : '#bae6fd',
              alpha: 1.0,
              life: 0,
              maxLife: 100 + Math.random() * 50,
            });
          }
          break;
        }
        case 'ice_shatter': {
          spawnShockwave(x, y, '#38bdf8', 210);
          spawnShockwave(x, y, '#e0f2fe', 160);
          for (let i = 0; i < 85; i++) {
            particles.push(new ShardParticle(x, y, deadBall.color));
          }
          break;
        }
        case 'inferno': {
          spawnShockwave(x, y, '#f97316', 250);
          spawnShockwave(x, y, '#ef4444', 200);
          spawnShockwave(x, y, '#facc15', 150);
          for (let i = 0; i < 90; i++) {
            particles.push(new RisingCircleParticle(x, y, i % 2 === 0 ? 'ember' : 'smoke'));
          }
          break;
        }
        case 'singularity': {
          spawnShockwave(x, y, '#a855f7', 240);
          spawnShockwave(x, y, '#1e1b4b', 180);
          for (let i = 0; i < 90; i++) {
            particles.push(new VoidParticle(x, y, winColor));
          }
          break;
        }
        case 'curse_heart': {
          spawnShockwave(x, y, '#e11d48', 220);
          spawnShockwave(x, y, '#0f172a', 160);
          for (let i = 0; i < 80; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 16;
            particles.push({
              x,
              y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed - 2.5,
              radius: 3.5 + Math.random() * 5.5,
              color: i % 3 === 0 ? '#e11d48' : i % 2 === 0 ? '#1e293b' : '#f43f5e',
              alpha: 1.0,
              life: 0,
              maxLife: 100 + Math.random() * 50,
            });
          }
          break;
        }
        case 'colossal_smash': {
          p1.screenShakeTimer = 0.85;
          spawnShockwave(x, y, '#ffffff', 280);
          spawnShockwave(x, y, '#facc15', 230);
          spawnShockwave(x, y, '#ef4444', 180);
          for (let i = 0; i < 100; i++) {
            const a = (i / 100) * Math.PI * 2;
            const speed = 10 + Math.random() * 26;
            particles.push({
              x,
              y,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              radius: 4 + Math.random() * 7,
              color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#facc15' : winColor,
              alpha: 1.0,
              life: 0,
              maxLife: 110 + Math.random() * 50,
            });
          }
          break;
        }
        default: {
          triggerExplosionAnimation(x, y, deadBall.color);
          break;
        }
      }
    };

    let animationFrameId: number;
    let lastTime = performance.now();
    let isGameOver = false;

    // Strategic Autobattler & Launch Phase State
    let phase: 'launch' | 'battle' = 'launch';
    let gameState: 'LAUNCH' | 'PLAYING' | 'FINISHER' | 'MENU' = 'LAUNCH';
    let p1Angle = 0;
    let p2Angle = Math.PI;
    let p1IsLocked = false;
    let p2IsLocked = false;
    let launchCountdown: number | null = null;
    let botLockTimer = 1.0 + Math.random() * 0.7;
    let botAimSpread = (Math.random() - 0.5) * 0.55;

    let roundTimer = 0;
    let matchStartTime = performance.now();
    let isEscalated = false;
    let phase2Unlocked = false;
    let phase3Triggered = false;
    let overdriveTriggered = false;
    let overdriveFlashAlpha = 0;
    let lastDispatchedSecond = -1;
    let lastSuddenDeathSecond = -1;
    let lastP1AbilityKey = '';
    let lastP2AbilityKey = '';
    let lastP1DashTenth = -1;
    let lastP2DashTenth = -1;

    // Dynamic Mid-Match Arena Mutator State (rotates every 10s to eliminate stagnant gameplay)
    type MutatorType = 'NONE' | 'OVERDRIVE_BOUNCE' | 'GRAVITY_WELL' | 'METEOR_SHOWER' | 'BLOODLUST_SURGE';
    let currentMutatorId: MutatorType = 'NONE';
    let lastMutatorSlot = 0;
    let botParryCooldown = 2.4;
    let botDashCooldown = 3.2;
    let meteorSpawnTimer = 1.8;
    const arenaMeteors: { x: number; y: number; radius: number; fuse: number; maxFuse: number }[] = [];

    const MUTATOR_POOL: { id: MutatorType; name: string; desc: string; color: string }[] = [
      {
        id: 'OVERDRIVE_BOUNCE',
        name: '⚡ OVERDRIVE WALLS',
        desc: '1.22x Wall Restitution + +20% Velocity Cap',
        color: '#38bdf8',
      },
      {
        id: 'GRAVITY_WELL',
        name: '🌌 SINGULARITY VORTEX',
        desc: 'Center Gravity Well pulls fighters & shots inward',
        color: '#a855f7',
      },
      {
        id: 'METEOR_SHOWER',
        name: '☄️ ORBITAL METEOR STRIKES',
        desc: 'Dark-core meteors crash every 2s (Parryable!)',
        color: '#f97316',
      },
      {
        id: 'BLOODLUST_SURGE',
        name: '🩸 BLOODLUST OVERCHARGE',
        desc: '+35% Vampiric Lifesteal & Double Hit-Evolution Gain',
        color: '#f43f5e',
      },
    ];

    const NORMAL_BASE_SPEED = 19.5;
    const NORMAL_MIN_SPEED = 7.4;
    const BASE_FRICTION = 0.9988;
    const BASE_WALL_RESTITUTION = 0.985;
    const PHASE3_WALL_RESTITUTION = 1.18;
    const LAUNCH_SPEED = NORMAL_BASE_SPEED;

    let lastStateEmitTime = 0;
    let stateSeq = 0;
    const isOnlineActive = isOnlineModeRef.current;
    const localIsP1 = !isOnlineActive || onlineRoleRef.current !== 'Player 2';

    lockP1Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && !localIsP1) return;
      if (gameState === 'LAUNCH' && !p1IsLocked && !isGameOver) {
        p1.launchAngle = hasMouseAimInput
          ? Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x)
          : p1.launchAngle;
        p1Angle = p1.launchAngle;
        p1IsLocked = true;
        setP1AimLocked(true);
        audioController.playEffect('hit');
        spawnSparks(p1.x, p1.y, '#38bdf8', 14);
        spawnShockwave(p1.x, p1.y, '#38bdf8', 65);
        if (isOnlineActive) {
          setMatchStatus('ANGLE LOCKED · WAITING FOR OPPONENT...');
          sendWsEvent(socketRef.current, 'launch_lock', { angle: p1.launchAngle });
        }
      }
    };

    lockP2Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && localIsP1) return;
      if (gameState === 'LAUNCH' && !p2IsLocked && !isGameOver) {
        if ((!playAgainstBot || isOnlineActive) && hasMouseAimInput) {
          p2.launchAngle = Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x);
          p2Angle = p2.launchAngle;
        }
        p2IsLocked = true;
        setP2AimLocked(true);
        audioController.playEffect('hit');
        spawnSparks(p2.x, p2.y, '#f97316', 14);
        spawnShockwave(p2.x, p2.y, '#f97316', 65);
        if (isOnlineActive) {
          setMatchStatus('ANGLE LOCKED · WAITING FOR OPPONENT...');
          sendWsEvent(socketRef.current, 'launch_lock', { angle: p2.launchAngle });
        }
      }
    };

    const handleCanvasAimClick = (e: MouseEvent) => {
      if (e.altKey) return;
      if (gameState !== 'LAUNCH' || isGameOver) return;
      handleCanvasMouseMove(e);
      if (isOnlineActive) {
        if (localIsP1 && !p1IsLocked) {
          lockP1Ref.current?.();
        } else if (!localIsP1 && !p2IsLocked) {
          lockP2Ref.current?.();
        }
        return;
      }
      if (!p1IsLocked) {
        lockP1Ref.current?.();
      } else if (!p2IsLocked && !playAgainstBot) {
        lockP2Ref.current?.();
      }
    };

    let touchStartClientX = 0;
    let touchStartClientY = 0;
    let touchWasDragged = false;

    const handleCanvasTouchStart = (e: TouchEvent) => {
      if (gameState !== 'LAUNCH' || isGameOver) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartClientX = touch.clientX;
      touchStartClientY = touch.clientY;
      touchWasDragged = false;
      updateAimFromClientCoords(touch.clientX, touch.clientY);
      if (isOnlineActive) {
        if (localIsP1 && !p1IsLocked) {
          p1.launchAngle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
          p1Angle = p1.launchAngle;
        } else if (!localIsP1 && !p2IsLocked) {
          p2.launchAngle = Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x);
          p2Angle = p2.launchAngle;
        }
      } else if (!p1IsLocked) {
        p1.launchAngle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
        p1Angle = p1.launchAngle;
      } else if (!p2IsLocked && !playAgainstBot) {
        p2.launchAngle = Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x);
        p2Angle = p2.launchAngle;
      }
    };

    const handleCanvasTouchMove = (e: TouchEvent) => {
      if (gameState !== 'LAUNCH' || isGameOver) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (Math.hypot(touch.clientX - touchStartClientX, touch.clientY - touchStartClientY) > 12) {
        touchWasDragged = true;
      }
      updateAimFromClientCoords(touch.clientX, touch.clientY);
      if (isOnlineActive) {
        if (localIsP1 && !p1IsLocked) {
          p1.launchAngle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
          p1Angle = p1.launchAngle;
        } else if (!localIsP1 && !p2IsLocked) {
          p2.launchAngle = Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x);
          p2Angle = p2.launchAngle;
        }
      } else if (!p1IsLocked) {
        p1.launchAngle = Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x);
        p1Angle = p1.launchAngle;
      } else if (!p2IsLocked && !playAgainstBot) {
        p2.launchAngle = Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x);
        p2Angle = p2.launchAngle;
      }
    };

    const handleCanvasTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'LAUNCH' || isGameOver) return;
      const touch = e.changedTouches[0];
      if (touch) {
        updateAimFromClientCoords(touch.clientX, touch.clientY);
      }
      // If the user performed a quick tap (not a drag), lock the aim immediately;
      // if they dragged to aim, keep the trajectory pointed where they aimed so they can tap Lock Angle or tap again.
      if (!touchWasDragged) {
        if (isOnlineActive) {
          if (localIsP1 && !p1IsLocked) {
            lockP1Ref.current?.();
          } else if (!localIsP1 && !p2IsLocked) {
            lockP2Ref.current?.();
          }
        } else if (!p1IsLocked) {
          lockP1Ref.current?.();
        } else if (!p2IsLocked && !playAgainstBot) {
          lockP2Ref.current?.();
        }
      }
    };

    canvas.addEventListener('click', handleCanvasAimClick);
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: true });

    parryP1Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && !localIsP1) return;
      if (phase === 'battle' && gameState === 'PLAYING' && !isGameOver) {
        p1.triggerParry(performance.now(), {
          playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
          spawnSparks,
          spawnShockwave,
        });
      }
    };

    parryP2Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && localIsP1) return;
      if (phase === 'battle' && gameState === 'PLAYING' && !isGameOver) {
        p2.triggerParry(performance.now(), {
          playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
          spawnSparks,
          spawnShockwave,
        });
      }
    };

    dashP1Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && !localIsP1) return;
      if (phase === 'battle' && gameState === 'PLAYING' && !isGameOver) {
        p1.triggerDash({
          playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
          spawnSparks,
          spawnShockwave,
        });
      }
    };

    dashP2Ref.current = () => {
      audioController.initOnStartMatch();
      if (isOnlineActive && localIsP1) return;
      if (phase === 'battle' && gameState === 'PLAYING' && !isGameOver && (!playAgainstBot || isOnlineActive)) {
        p2.triggerDash({
          playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
          spawnSparks,
          spawnShockwave,
        });
      }
    };

    const drawTargetingArrow = (
      ball: Ball,
      angle: number,
      isLocked: boolean,
      isActiveAimer: boolean,
      color: string,
      glowColor: string,
      label: string,
      keyPrompt: string
    ) => {
      // Thick, glowing dotted trajectory line from the active aiming ball directly to the mouse cursor
      if (isActiveAimer && !isLocked) {
        const startX = ball.x + Math.cos(angle) * (ball.radius + 8);
        const startY = ball.y + Math.sin(angle) * (ball.radius + 8);
        const targetX = hasMouseAimInput ? mousePos.x : ball.x + Math.cos(angle) * 190;
        const targetY = hasMouseAimInput ? mousePos.y : ball.y + Math.sin(angle) * 190;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([2, 15]);
        ctx.lineDashOffset = -(performance.now() * 0.05);
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // High-contrast bright dotted core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing cursor reticle at mousePos
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(ball.x, ball.y);

      const beamLength = isLocked ? 175 : 130;
      if (isLocked || !isActiveAimer) {
        ctx.save();
        ctx.rotate(angle);
        ctx.strokeStyle = isLocked ? '#10b981' : color;
        ctx.lineWidth = isLocked ? 4.5 : 3.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([2, 12]);
        ctx.shadowColor = isLocked ? '#059669' : glowColor;
        ctx.shadowBlur = isLocked ? 12 : 6;
        ctx.beginPath();
        ctx.moveTo(ball.radius + 6, 0);
        ctx.lineTo(beamLength, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isLocked ? '#10b981' : color;
        ctx.beginPath();
        ctx.arc(beamLength, 0, isLocked ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.rotate(angle);

      const arrowStart = ball.radius + 8;
      const arrowEnd = ball.radius + 54;
      const headLength = 18;
      const headWidth = 14;

      ctx.shadowColor = isLocked ? '#059669' : glowColor;
      ctx.shadowBlur = isLocked ? 10 : 8;

      ctx.strokeStyle = isLocked ? '#10b981' : color;
      ctx.lineWidth = isLocked ? 5 : 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(arrowStart, 0);
      ctx.lineTo(arrowEnd - headLength + 4, 0);
      ctx.stroke();

      ctx.fillStyle = isLocked ? '#10b981' : color;
      ctx.beginPath();
      ctx.moveTo(arrowEnd, 0);
      ctx.lineTo(arrowEnd - headLength, -headWidth / 2);
      ctx.lineTo(arrowEnd - headLength + 4, 0);
      ctx.lineTo(arrowEnd - headLength, headWidth / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = isLocked ? 'rgba(16, 185, 129, 0.65)' : 'rgba(15, 23, 42, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius + 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      const badgeY = -ball.radius - 38;
      const badgeText = isLocked ? `✓ ${label} LOCKED` : keyPrompt;

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(badgeText).width;
      const padX = 10;
      const padY = 5;

      ctx.fillStyle = isLocked ? 'rgba(16, 185, 129, 0.95)' : 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isLocked ? '#10b981' : color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = isLocked ? '#10b981' : glowColor;
      ctx.shadowBlur = 5;

      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - padX, badgeY - padY - 2, textWidth + padX * 2, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(badgeText, 0, badgeY + 8 - padY);
      ctx.restore();

      ctx.restore();
    };

    const resetRound = () => {
      if (finisherTimeoutId !== null) {
        clearTimeout(finisherTimeoutId);
        finisherTimeoutId = null;
      }
      isGameOver = false;
      gameState = 'LAUNCH';
      phase = 'launch';
      hitstopTimer = 0;
      impactFrameTimer = 0;
      const overlayEl = document.getElementById('post-round-overlay');
      if (overlayEl) {
        overlayEl.classList.remove('view-active');
        overlayEl.classList.add('view-hidden');
      }
      setMatchPhase('launch');
      p1IsLocked = false;
      p2IsLocked = false;
      setP1AimLocked(false);
      setP2AimLocked(false);
      launchCountdown = null;
      botLockTimer = 1.0 + Math.random() * 0.7;
      botAimSpread = (Math.random() - 0.5) * 0.55;

      roundTimer = 0;
      matchStartTime = performance.now();
      isEscalated = false;
      phase2Unlocked = false;
      phase3Triggered = false;
      overdriveTriggered = false;
      overdriveFlashAlpha = 0;
      lastDispatchedSecond = -1;
      lastSuddenDeathSecond = -1;
      lastP1AbilityKey = '';
      lastP2AbilityKey = '';
      lastP1DashTenth = -1;
      lastP2DashTenth = -1;
      currentMutatorId = 'NONE';
      lastMutatorSlot = 0;
      arenaMeteors.length = 0;
      setActiveMutator({
        id: 'NONE',
        name: 'STANDARD ARENA',
        desc: 'Evolution Mutator rotates every 10s',
        color: '#38bdf8',
      });
      setIsEscalated(false);
      setRoundSeconds(0);
      setSuddenDeathOverlay(false);
      setSuddenDeathCountdown(30);
      setP1AbilityProgress(1);
      setP2AbilityProgress(1);
      setP1AbilityHud({ remaining: 0, isActive: false, statusText: 'READY' });
      setP2AbilityHud({ remaining: 0, isActive: false, statusText: 'READY' });
      setP1DashRemaining(0);
      setP2DashRemaining(0);
      if (suddenDeathTimerRef.current) {
        clearTimeout(suddenDeathTimerRef.current);
        suddenDeathTimerRef.current = null;
      }

      p1.resetPosition(
        innerLeft + ARENA_SIZE * 0.22,
        innerTop + (innerBottom - innerTop) * 0.5,
        startingHealth
      );
      p2.resetPosition(
        innerRight - ARENA_SIZE * 0.22,
        innerTop + (innerBottom - innerTop) * 0.5,
        startingHealth
      );
      p1.currentOpponent = p2;
      p2.currentOpponent = p1;
      p1.launchAngle = 0;
      p2.launchAngle = Math.PI;
      p1Angle = 0;
      p2Angle = Math.PI;
      remoteOpponentTargetRef.current = null;
      pendingStartRoundRef.current = null;
      pendingOpponentLockRef.current = null;
      lastStateEmitTime = 0;
      setOnlineRematchRequested(false);
      setOpponentRematchReady(false);

      particles.length = 0;
      shockwaves.length = 0;
      roundCoinsAwarded = false;

      setP1Hp(startingHealth);
      setP2Hp(startingHealth);
      setRoundOverlay(null);
      setMatchStatus('LAUNCH PHASE: LOCK ANGLES');
      playSound('start');
    };

    resetRoundRef.current = resetRound;

    activeResetArenaCallback = (newP1Type: BallTypeId, newP2Type: BallTypeId) => {
      if (finisherTimeoutId !== null) {
        clearTimeout(finisherTimeoutId);
        finisherTimeoutId = null;
      }
      // 1. Clear Arrays: globalParticlePool.clear() and flush active damageTexts & floatingTexts
      globalParticlePool.clear();
      particles.length = 0;
      shockwaves.length = 0;
      damageTexts.length = 0;
      floatingTexts.length = 0;
      arenaCenterTextsRef.current.length = 0;
      p1.damageTexts.length = 0;
      p1.floatingTexts.length = 0;
      p2.damageTexts.length = 0;
      p2.floatingTexts.length = 0;

      // 2. Clear Leftovers: explicitly destroy Edward pillars and Minefield mines
      EdwardElric.pillars.length = 0;
      Minefield.mines.length = 0;
      if (Array.isArray((p1 as any).pillars)) (p1 as any).pillars.length = 0;
      if (Array.isArray((p2 as any).pillars)) (p2 as any).pillars.length = 0;
      if (Array.isArray((p1 as any).mines)) (p1 as any).mines.length = 0;
      if (Array.isArray((p2 as any).mines)) (p2 as any).mines.length = 0;

      // 3. Respawn: Re-instantiate player1 and player2 using newly drafted BallTypeIds
      p1 = createBall(
        newP1Type,
        innerLeft + ARENA_SIZE * 0.22,
        innerTop + (innerBottom - innerTop) * 0.5,
        BASE_BALL_RADIUS,
        32,
        '#38bdf8',
        '#0284c7',
        p1Name.trim() || 'Player 1',
        startingHealth
      );
      p2 = createBall(
        newP2Type,
        innerRight - ARENA_SIZE * 0.22,
        innerTop + (innerBottom - innerTop) * 0.5,
        BASE_BALL_RADIUS,
        32,
        '#f97316',
        '#ea580c',
        p2Name.trim() || (playAgainstBot ? 'Bot (AI)' : 'Player 2'),
        startingHealth
      );
      p1.currentOpponent = p2;
      p2.currentOpponent = p1;
      p1.launchAngle = 0;
      p2.launchAngle = Math.PI;
      p1BallRef.current = p1;
      p2BallRef.current = p2;
      balls[0] = p1;
      balls[1] = p2;

      // 4. Reset round timer to 0.0 and set gameState = 'LAUNCH'
      roundTimer = 0.0;
      matchStartTime = performance.now();
      isGameOver = false;
      roundCoinsAwarded = false;
      gameState = 'LAUNCH';
      gameStateRef.current = 'LAUNCH';
      phase = 'launch';
      hitstopTimer = 0;
      impactFrameTimer = 0;
      p1IsLocked = false;
      p2IsLocked = false;
      p1Angle = 0;
      p2Angle = Math.PI;
      launchCountdown = null;
      remoteOpponentTargetRef.current = null;
      pendingStartRoundRef.current = null;
      pendingOpponentLockRef.current = null;
      lastStateEmitTime = 0;
      isEscalated = false;
      phase2Unlocked = false;
      phase3Triggered = false;
      overdriveTriggered = false;
      overdriveFlashAlpha = 0;
      lastDispatchedSecond = -1;
      lastSuddenDeathSecond = -1;
      arenaMeteors.length = 0;

      setRoundOverBanner(false);
      setRoundOverlay(null);
      setRoundSeconds(0);
      setIsEscalated(false);
      setSuddenDeathOverlay(false);
      setSuddenDeathCountdown(30);
      setMatchPhase('launch');
      setP1AimLocked(false);
      setP2AimLocked(false);
      setP1Hp(startingHealth);
      setP2Hp(startingHealth);
      setMatchStatus('LAUNCH PHASE: LOCK ANGLES');
    };

    // Server-Side Match Rewards: The server computes and saves +50 Coins (Win) or +10 Coins (Loss) in MongoDB and emits wallet_updated
    let roundCoinsAwarded = false;
    const awardMatchCoins = (winnerBall: Ball): number => {
      const isP1Winner = winnerBall === p1;
      const didLocalPlayerWin = isOnlineActive
        ? (localIsP1 ? isP1Winner : !isP1Winner)
        : isP1Winner;
      const reward = didLocalPlayerWin ? 50 : 10;
      if (!roundCoinsAwarded && !isOnlineActive && walletSocketRef.current?.readyState === WebSocket.OPEN) {
        roundCoinsAwarded = true;
        sendWsEvent(walletSocketRef.current, 'report_match_result', {
          winnerRole: isP1Winner ? 'Player 1' : 'Player 2',
          didWin: didLocalPlayerWin,
        });
      }
      return reward;
    };

    // Celebratory Fireworks Burst Generator (triggers when fatality effect finishes and during victory hop)
    let victoryFireworkCooldown = 0;
    const fireworkPalette = ['#facc15', '#38bdf8', '#f43f5e', '#a855f7', '#10b981', '#fb923c', '#ffffff'];
    const spawnFireworkBurst = (fx: number, fy: number, primaryColor?: string) => {
      const baseColor = primaryColor || fireworkPalette[Math.floor(Math.random() * fireworkPalette.length)];
      const secondaryColor = fireworkPalette[Math.floor(Math.random() * fireworkPalette.length)];
      spawnShockwave(fx, fy, baseColor, 110);
      spawnShockwave(fx, fy, '#ffffff', 65);

      const spokes = 28;
      for (let i = 0; i < spokes; i++) {
        const angle = (i / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
        const speed = 4.2 + Math.random() * 6.5;
        const colorChoice = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? baseColor : secondaryColor;
        particles.push({
          x: fx,
          y: fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          radius: 4.5 + Math.random() * 3.5,
          color: colorChoice,
          life: 1.0,
          decay: 0.011 + Math.random() * 0.008,
          type: i % 4 === 0 ? 3 : 0, // mix of glowing starburst squares and gravity arcs
        });
      }
      // Inner glittering gold sparks
      for (let j = 0; j < 10; j++) {
        particles.push(new SquareSparkParticle(fx, fy, baseColor));
      }
    };

    const handleMatchWin = (winner: Ball, _loser: Ball) => {
      if (isGameOver) return;
      isGameOver = true;
      setRoundOverBanner(false);

      p1.vx = 0;
      p1.vy = 0;
      p2.vx = 0;
      p2.vy = 0;

      const coinsEarned = awardMatchCoins(winner);

      // Activate Winner's Victory Hop Animation & Grand Fireworks Salvo right after fatality finishes!
      winner.startVictoryCelebration();
      victoryFireworkCooldown = 0.35;

      const burstOffsets = [
        { dx: 0, dy: -85, color: winner.color },
        { dx: -135, dy: -110, color: '#facc15' },
        { dx: 135, dy: -110, color: '#38bdf8' },
        { dx: -75, dy: -155, color: '#f43f5e' },
        { dx: 75, dy: -155, color: '#10b981' },
      ];
      for (const b of burstOffsets) {
        const bx = Math.max(innerLeft + 50, Math.min(innerRight - 50, winner.x + b.dx));
        const by = Math.max(innerTop + 50, Math.min(innerBottom - 50, winner.y + b.dy));
        spawnFireworkBurst(bx, by, b.color);
      }

      playSound('ko');
      playSound('crit');

      const isP1 = winner === p1;
      const winnerName = isP1
        ? (p1Name.trim() || 'Player 1')
        : (p2Name.trim() || (playAgainstBot ? 'Bot (AI)' : 'Player 2'));
      const winnerPlayerLabel = isP1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
      const winnerEmoji = winner.iconText || BALL_VISUAL_META[winner.type]?.emoji || '🏆';
      const winnerSubClass = BALL_TYPES.find((b) => b.id === winner.type)?.name || winner.name;
      const roundOverText = `Match Over! ${winnerName} Wins the Match!`;

      const nextP1 = isP1 ? p1ScoreRef.current + 1 : p1ScoreRef.current;
      const nextP2 = !isP1 ? p2ScoreRef.current + 1 : p2ScoreRef.current;
      setP1Score(nextP1);
      setP2Score(nextP2);

      setRoundOverlay({
        text: roundOverText,
        winnerPlayerLabel,
        winnerName,
        winnerSubClass,
        winnerEmoji,
        winnerColor: isP1 ? '#38bdf8' : '#f97316',
        winnerBallColor: winner.color,
        p1ScoreSnapshot: nextP1,
        p2ScoreSnapshot: nextP2,
        coinsEarned,
      });
      setMatchStatus(roundOverText);

      const overlayEl = document.getElementById('post-round-overlay');
      if (overlayEl) {
        overlayEl.classList.remove('view-hidden');
        overlayEl.classList.add('view-active');
      }

      if (roundTimeoutRef.current) {
        clearTimeout(roundTimeoutRef.current);
        roundTimeoutRef.current = null;
      }
    };

    triggerFinalVictoryRef.current = (winnerSide?: 'p1' | 'p2') => {
      const winnerBall =
        winnerSide === 'p1'
          ? p1
          : winnerSide === 'p2'
          ? p2
          : p1.health > 0
          ? p1
          : p2;
      const loserBall = winnerBall === p1 ? p2 : p1;
      gameState = 'MENU';
      gameStateRef.current = 'MENU';
      handleMatchWin(winnerBall, loserBall);
    };

    // Round End Trigger: when gameState === 'FINISHER' and the 2000ms delay finishes,
    // DO NOT show the final Victory Screen immediately. Instead, emit socket.emit('round_lost', { roomId, loserSide })
    // and show a brief 'ROUND OVER' text overlay.
    activeFatalityCompleteCallback = (deadBall, resolvedWinner) => {
      const finalWinner = resolvedWinner ?? deadBall.lastAttacker ?? (deadBall === p1 ? p2 : p1);
      const finalLoser = finalWinner === p1 ? p2 : p1;
      const loserSide: 'p1' | 'p2' = finalLoser === p1 ? 'p1' : 'p2';

      setRoundOverBanner(true);
      setMatchStatus('ROUND OVER');

      if (isOnlineActive && socketRef.current?.readyState === WebSocket.OPEN) {
        sendWsEvent(socketRef.current, 'round_lost', {
          roomId: onlineRoomIdRef.current,
          loserSide,
        });
      } else {
        const nextHearts =
          loserSide === 'p1'
            ? Math.max(0, p1HeartsRef.current - 1)
            : Math.max(0, p2HeartsRef.current - 1);
        if (loserSide === 'p1') {
          setP1Hearts(nextHearts);
        } else {
          setP2Hearts(nextHearts);
        }

        if (nextHearts > 0) {
          const isP1Win = finalWinner === p1;
          if (isP1Win) {
            setP1Score(p1ScoreRef.current + 1);
          } else {
            setP2Score(p2ScoreRef.current + 1);
          }
          if (roundTimeoutRef.current) {
            clearTimeout(roundTimeoutRef.current);
          }
          roundTimeoutRef.current = window.setTimeout(() => {
            setRoundOverBanner(false);
            setRoundOverlay(null);
            setP1Drafting(null);
            setP2Drafting(null);
            setP1Locked(false);
            setP2Locked(false);
            setIsDraftLockedWaiting(false);
            setIsChangingBalls(true);
            generateDraft();
            setGameState('draft');
          }, 1100);
        } else {
          if (roundTimeoutRef.current) {
            clearTimeout(roundTimeoutRef.current);
          }
          roundTimeoutRef.current = window.setTimeout(() => {
            setRoundOverBanner(false);
            gameState = 'MENU';
            gameStateRef.current = 'MENU';
            handleMatchWin(finalWinner, finalLoser);
          }, 900);
        }
      }
    };

    triggerForfeitVictoryRef.current = () => {
      if (gameState !== 'PLAYING' || isGameOver) return;

      const disconnectedBall = localIsP1 ? p2 : p1;
      const localWinnerBall = localIsP1 ? p1 : p2;

      // Forfeit State Trigger: instantly set the disconnected player's health to 0
      disconnectedBall.health = 0;
      disconnectedBall.isDead = true;
      disconnectedBall.lastAttacker = localWinnerBall;
      setP1Hp(p1.health);
      setP2Hp(p2.health);
      if (localIsP1) {
        setP2Hearts(0);
      } else {
        setP1Hearts(0);
      }

      // The Victory Override: force gameState into 'FINISHER', award 50 Coin win bonus, and trigger fatality
      gameState = 'FINISHER';
      gameStateRef.current = 'FINISHER';
      p1.vx = 0;
      p1.vy = 0;
      p2.vx = 0;
      p2.vy = 0;

      // UI Notification: floating text over the center of the arena in gold text
      arenaCenterTextsRef.current.push({
        text: 'OPPONENT FLED - FORFEIT VICTORY!',
        x: CANVAS_W / 2,
        y: CANVAS_H / 2,
        alpha: 1,
        vy: -24,
        color: '#facc15',
      });
      localWinnerBall.floatingTexts.push({
        text: 'OPPONENT FLED - FORFEIT VICTORY!',
        x: CANVAS_W / 2,
        y: CANVAS_H / 2 - 28,
        alpha: 1,
        vy: -0.6,
        color: '#facc15',
      });

      triggerFatality(disconnectedBall, localWinnerBall);
      window.setTimeout(() => {
        if (triggerFinalVictoryRef.current) {
          triggerFinalVictoryRef.current(localIsP1 ? 'p1' : 'p2');
        }
      }, 2050);
    };

    lastTime = performance.now();

    const gameLoop = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);
      gameStateRef.current = gameState;

      // Accurate Delta Time (dt): reflects real elapsed seconds, capped at 0.05s to prevent lag-spike glitches
      const rawDt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const dt = Math.min(0.05, Math.max(0, Number.isFinite(rawDt) ? rawDt : 0));

      p1.renderDt = dt;
      p2.renderDt = dt;

      // Explicit Game-End State Check: immediately enter FINISHER when either ball is eliminated
      if ((p1.health <= 0 || p2.health <= 0) && gameState === 'PLAYING') {
        if (isOnlineActive && socketRef.current?.readyState === WebSocket.OPEN) {
          const localBall = localIsP1 ? p1 : p2;
          sendWsEvent(socketRef.current, 'player_state', {
            room: onlineRoomIdRef.current,
            x: localBall.x,
            y: localBall.y,
            vx: 0,
            vy: 0,
            health: localBall.health,
            hitbox: localBall.effectiveHitRadius,
            isDead: localBall.health <= 0,
            seq: ++stateSeq,
          });
        }
        gameState = 'FINISHER';
        gameStateRef.current = 'FINISHER';
        const loser = p1.health <= 0 ? p1 : p2;
        const winner = loser === p1 ? p2 : p1;
        p1.vx = 0;
        p1.vy = 0;
        p2.vx = 0;
        p2.vy = 0;
        setP1Hp(p1.health);
        setP2Hp(p2.health);
        triggerFatality(loser, winner);
      }

      // Hitstop (Micro-pauses): When hitstopTimer > 0, decrement timer and skip physics updates (x and y movement) while continuing rendering
      const isHitstopActive = hitstopTimer > 0;
      if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
      }

      // Global Time Scale: 1.0x normally, jumps to 2.0x speed at 10.0s Overdrive
      let timeScale = 1.0;

      // Real-Time Wall Clock: decoupled from frame rate and capped dt so UI timer ticks 1s per real-world second
      if (gameState === 'PLAYING' && !isGameOver) {
        const roundElapsed = Math.max(0, (performance.now() - matchStartTime) / 1000);
        roundTimer = roundElapsed;
        const currentSec = Math.floor(roundElapsed);
        if (currentSec !== lastDispatchedSecond) {
          lastDispatchedSecond = currentSec;
          setRoundSeconds(currentSec);
        }

        // The 10-Second Overdrive Trigger: double game speed + massive audio/visual alert
        if (roundElapsed >= 10.0) {
          timeScale = 2.0;
          if (!overdriveTriggered) {
            overdriveTriggered = true;
            overdriveFlashAlpha = 0.4;
            audioController.playEffect('ko');
            audioController.playEffect('jackpot');
            setMatchStatus('⚡ OVERDRIVE: 2X SPEED!');
            spawnShockwave((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, '#ef4444', 340);
            spawnShockwave((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, '#facc15', 240);
            spawnSparks((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, '#f97316', 32);
          }
        }

        if (phase3Triggered) {
          const sdRemaining = Math.max(0, 30 - Math.floor(roundElapsed - 15.0));
          if (sdRemaining !== lastSuddenDeathSecond) {
            lastSuddenDeathSecond = sdRemaining;
            setSuddenDeathCountdown(sdRemaining);
            if (sdRemaining === 0 && p1.phaseDamageMultiplier < 3.0) {
              p1.phaseDamageMultiplier = 3.0;
              p2.phaseDamageMultiplier = 3.0;
              setMatchStatus('💀 FINAL CLIMAX · 3X DMG OVERDRIVE');
              playSound('explosion');
            }
          }
        }
      }

      if (gameState === 'MENU' || isGameOver) {
        p1.vx = 0;
        p1.vy = 0;
        p2.vx = 0;
        p2.vy = 0;

        // Guarantee the surviving winner performs the Victory Hop animation whenever the victory screen is active
        const survivingWinner = !p1.isDead && p2.isDead ? p1 : !p2.isDead && p1.isDead ? p2 : null;
        if (survivingWinner && !survivingWinner.isCelebratingVictory) {
          survivingWinner.startVictoryCelebration();
        }

        // Continuous celebratory fireworks while winner performs Victory Hop animation
        victoryFireworkCooldown -= dt;
        if (victoryFireworkCooldown <= 0) {
          victoryFireworkCooldown = 0.42;
          const activeWinner = survivingWinner ?? (!p1.isDead ? p1 : !p2.isDead ? p2 : p1);
          const fx = innerLeft + 75 + Math.random() * (innerRight - innerLeft - 150);
          const fy = innerTop + 65 + Math.random() * ((innerBottom - innerTop) * 0.55);
          spawnFireworkBurst(fx, fy);
          // Also pop golden sparkles around the hopping winner
          spawnSparks(
            activeWinner.x + (Math.random() - 0.5) * 50,
            (activeWinner.victoryBaseY ?? activeWinner.y) - 30 - Math.random() * 45,
            '#facc15',
            8
          );
        }
      } else if (gameState === 'LAUNCH') {
        p1.vx = 0;
        p1.vy = 0;
        p2.vx = 0;
        p2.vy = 0;

        if (isOnlineActive) {
          // Online Launch Phase: Local player tracks cursor for their own ball, emits launch_lock, and waits for server 'start_round'
          const localBall = localIsP1 ? p1 : p2;
          const remoteBall = localIsP1 ? p2 : p1;
          const localLocked = localIsP1 ? p1IsLocked : p2IsLocked;

          if (!localLocked) {
            localBall.launchAngle = hasMouseAimInput
              ? Math.atan2(mousePos.y - localBall.y, mousePos.x - localBall.x)
              : localIsP1
              ? 0
              : Math.PI;
            if (localIsP1) p1Angle = localBall.launchAngle;
            else p2Angle = localBall.launchAngle;
          }

          if (pendingOpponentLockRef.current) {
            const oppLock = pendingOpponentLockRef.current;
            pendingOpponentLockRef.current = null;
            remoteBall.launchAngle = oppLock.angle;
            if (localIsP1) {
              p2Angle = oppLock.angle;
              p2IsLocked = true;
              setP2AimLocked(true);
            } else {
              p1Angle = oppLock.angle;
              p1IsLocked = true;
              setP1AimLocked(true);
            }
          }

          if (pendingStartRoundRef.current) {
            const sr = pendingStartRoundRef.current;
            pendingStartRoundRef.current = null;
            p1.launchAngle = sr.p1Angle;
            p2.launchAngle = sr.p2Angle;
            p1Angle = sr.p1Angle;
            p2Angle = sr.p2Angle;
            p1IsLocked = true;
            p2IsLocked = true;
            setP1AimLocked(true);
            setP2AimLocked(true);

            p1.vx = Math.cos(p1.launchAngle) * LAUNCH_SPEED;
            p1.vy = Math.sin(p1.launchAngle) * LAUNCH_SPEED;
            p1.targetX = p1.x;
            p1.targetY = p1.y;
            p1.targetVx = p1.vx;
            p1.targetVy = p1.vy;
            p2.vx = Math.cos(p2.launchAngle) * LAUNCH_SPEED;
            p2.vy = Math.sin(p2.launchAngle) * LAUNCH_SPEED;
            p2.targetX = p2.x;
            p2.targetY = p2.y;
            p2.targetVx = p2.vx;
            p2.targetVy = p2.vy;

            phase = 'battle';
            gameState = 'PLAYING';
            roundTimer = 0;
            matchStartTime = performance.now();
            lastStateEmitTime = 0;
            isEscalated = false;
            phase2Unlocked = false;
            phase3Triggered = false;
            overdriveTriggered = false;
            overdriveFlashAlpha = 0;
            p1.phaseDamageMultiplier = 1.0;
            p2.phaseDamageMultiplier = 1.0;
            lastDispatchedSecond = -1;
            lastSuddenDeathSecond = -1;
            lastP1AbilityKey = '';
            lastP2AbilityKey = '';
            lastP1DashTenth = -1;
            lastP2DashTenth = -1;
            setIsEscalated(false);
            setRoundSeconds(0);
            setSuddenDeathOverlay(false);
            setSuddenDeathCountdown(30);
            const p1Info = p1.getSpecialCooldownInfo();
            const p2Info = p2.getSpecialCooldownInfo();
            setP1AbilityProgress(p1Info.progress);
            setP2AbilityProgress(p2Info.progress);
            setP1AbilityHud({
              remaining: p1Info.remainingSeconds,
              isActive: p1Info.isActive,
              statusText: p1Info.statusText,
            });
            setP2AbilityHud({
              remaining: p2Info.remainingSeconds,
              isActive: p2Info.isActive,
              statusText: p2Info.statusText,
            });
            setP1DashRemaining(0);
            setP2DashRemaining(0);
            setMatchPhase('battle');
            setMatchStatus('ONLINE BATTLE ACTIVE');
            playSound('start');
            playSound('dash');
            spawnShockwave(p1.x, p1.y, '#38bdf8', 110);
            spawnShockwave(p2.x, p2.y, '#f97316', 110);
            spawnSparks(p1.x, p1.y, '#ffffff', 20);
            spawnSparks(p2.x, p2.y, '#ffffff', 20);
          }
        } else {
          if (!p1IsLocked) {
            // Player 1 is aiming: launchAngle tracks the mouse cursor in real time
            p1.launchAngle = hasMouseAimInput
              ? Math.atan2(mousePos.y - p1.y, mousePos.x - p1.x)
              : 0;
            p1Angle = p1.launchAngle;
            if (!p2IsLocked) {
              p2.launchAngle = playAgainstBot
                ? Math.atan2(p1.y - p2.y, p1.x - p2.x) + botAimSpread
                : Math.PI;
              p2Angle = p2.launchAngle;
            }
          } else if (!p2IsLocked) {
            // Player 1 locked: Player 2's turn to aim (human P2 follows mousePos; Bot aims at P1)
            if (playAgainstBot) {
              p2.launchAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x) + botAimSpread;
            } else {
              p2.launchAngle = hasMouseAimInput
                ? Math.atan2(mousePos.y - p2.y, mousePos.x - p2.x)
                : Math.PI;
            }
            p2Angle = p2.launchAngle;
          }

          if (playAgainstBot && !p2IsLocked) {
            botLockTimer -= dt;
            if (botLockTimer <= 0) {
              lockP2Ref.current?.();
            }
          }

          if (p1IsLocked && p2IsLocked) {
            if (launchCountdown === null) {
              launchCountdown = 0.28;
            } else {
              launchCountdown -= dt;
              if (launchCountdown <= 0) {
                p1.vx = Math.cos(p1.launchAngle) * LAUNCH_SPEED;
                p1.vy = Math.sin(p1.launchAngle) * LAUNCH_SPEED;
                p2.vx = Math.cos(p2.launchAngle) * LAUNCH_SPEED;
                p2.vy = Math.sin(p2.launchAngle) * LAUNCH_SPEED;

                phase = 'battle';
                gameState = 'PLAYING';
                roundTimer = 0;
                matchStartTime = performance.now();
                isEscalated = false;
                phase2Unlocked = false;
                phase3Triggered = false;
                overdriveTriggered = false;
                overdriveFlashAlpha = 0;
                p1.phaseDamageMultiplier = 1.0;
                p2.phaseDamageMultiplier = 1.0;
                lastDispatchedSecond = -1;
                lastSuddenDeathSecond = -1;
                lastP1AbilityKey = '';
                lastP2AbilityKey = '';
                lastP1DashTenth = -1;
                lastP2DashTenth = -1;
                setIsEscalated(false);
                setRoundSeconds(0);
                setSuddenDeathOverlay(false);
                setSuddenDeathCountdown(30);
                const p1Info = p1.getSpecialCooldownInfo();
                const p2Info = p2.getSpecialCooldownInfo();
                setP1AbilityProgress(p1Info.progress);
                setP2AbilityProgress(p2Info.progress);
                setP1AbilityHud({
                  remaining: p1Info.remainingSeconds,
                  isActive: p1Info.isActive,
                  statusText: p1Info.statusText,
                });
                setP2AbilityHud({
                  remaining: p2Info.remainingSeconds,
                  isActive: p2Info.isActive,
                  statusText: p2Info.statusText,
                });
                setP1DashRemaining(0);
                setP2DashRemaining(0);
                setMatchPhase('battle');
                setMatchStatus('AUTOBATTLE ACTIVE');
                playSound('start');
                playSound('dash');
                spawnShockwave(p1.x, p1.y, '#38bdf8', 110);
                spawnShockwave(p2.x, p2.y, '#f97316', 110);
                spawnSparks(p1.x, p1.y, '#ffffff', 20);
                spawnSparks(p2.x, p2.y, '#ffffff', 20);
              }
            }
          }
        }
      } else if (gameState === 'PLAYING' && !isHitstopActive) {
        // Dynamic Mid-Match Arena Evolution Mutators every 10 seconds (prevents stagnant gameplay!)
        const mutatorSlot = Math.floor(roundTimer / 10);
        if (mutatorSlot >= 1 && mutatorSlot !== lastMutatorSlot && !isGameOver) {
          lastMutatorSlot = mutatorSlot;
          const nextMut = MUTATOR_POOL[(mutatorSlot - 1) % MUTATOR_POOL.length];
          currentMutatorId = nextMut.id;
          setActiveMutator(nextMut);
          setMatchStatus(`ARENA MUTATOR: ${nextMut.name}`);
          playSound('aura');
          spawnShockwave((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, nextMut.color, 260);
          p1.floatingTexts.push({
            text: nextMut.name,
            x: (innerLeft + innerRight) / 2,
            y: innerTop + 48,
            alpha: 1.0,
            color: nextMut.color,
            vy: -0.6,
          });
        }

        // Human-cadence AI Bot Parry & Dodge Dash (never uses unfair frame-perfect auto-parry!)
        if (playAgainstBot && !p2.isDead) {
          botParryCooldown -= dt * timeScale;
          botDashCooldown -= dt * timeScale;
          const distToP1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (botParryCooldown <= 0 && distToP1 < p1.radius + p2.radius + 58 && Math.random() < 0.08) {
            botParryCooldown = 2.6 + Math.random() * 1.4; // Natural human variance
            p2.triggerParry(performance.now(), { playSound, spawnSparks, spawnShockwave });
          } else if (
            botDashCooldown <= 0 &&
            p2.dodgeDashCooldownTimer <= 0 &&
            distToP1 < p1.radius + p2.radius + 110 &&
            Math.random() < 0.035
          ) {
            botDashCooldown = 3.8 + Math.random() * 2.0;
            p2.triggerDash({ playSound, spawnSparks, spawnShockwave });
          }
        }

        if (roundTimer >= 15.0 && !phase3Triggered && !isGameOver) {
          phase3Triggered = true;
          isEscalated = true;
          p1.phaseDamageMultiplier = 2.0;
          p2.phaseDamageMultiplier = 2.0;
          setIsEscalated(true);
          setSuddenDeathOverlay(true);
          const sdInitial = Math.max(0, 30 - Math.floor(roundTimer - 15.0));
          setSuddenDeathCountdown(sdInitial);
          lastSuddenDeathSecond = sdInitial;
          setMatchStatus('🔥 SUDDEN DEATH · 2X DMG · 1.5X SPD');
          playSound('explosion');
          spawnShockwave((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, '#ef4444', 320);
          spawnSparks((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, '#ef4444', 28);
          p1.floatingTexts.push({
            text: '🔥 SUDDEN DEATH! 2X DMG · 1.5X SPD',
            x: (innerLeft + innerRight) / 2,
            y: innerTop + 76,
            alpha: 1.0,
            color: '#ef4444',
            vy: -0.55,
          });
        }

        const mutatorSpeedBoost = currentMutatorId === 'OVERDRIVE_BOUNCE' ? 1.2 : 1.0;
        const currentSpeedCap = (phase3Triggered
          ? NORMAL_BASE_SPEED * 1.5
          : NORMAL_BASE_SPEED) * mutatorSpeedBoost;
        const currentMinSpeed = NORMAL_MIN_SPEED;
        // Physics Connection: Update friction calculation so it reads currentArena.
        // If set to 'Ice', apply a significantly lower friction coefficient so the balls slide much further.
        const isIceArena = currentArena === 'Ice';
        const currentFriction = isIceArena
          ? 0.9998 // Ice environment: extremely low friction drag so balls slide effortlessly
          : currentArena === 'Road'
          ? 0.9968
          : phase3Triggered
          ? 1.0
          : BASE_FRICTION;

        // Mutator 2: Singularity Gravity Well in Arena Center
        if (currentMutatorId === 'GRAVITY_WELL') {
          const cx = (innerLeft + innerRight) / 2;
          const cy = (innerTop + innerBottom) / 2;
          for (const b of balls) {
            if (b.isDead || b.timeStopFrozenTimer > 0) continue;
            const gdx = cx - b.x;
            const gdy = cy - b.y;
            const gDist = Math.hypot(gdx, gdy) || 1;
            if (gDist > 30 && gDist < 320) {
              const pull = (1 - gDist / 320) * 0.24 * timeScale;
              b.vx += (gdx / gDist) * pull;
              b.vy += (gdy / gDist) * pull;
            }
          }
        }

        // Mutator 3: Orbital Meteor Shower (dark core + 4px solid white stroke, +30% scaled radius = 73, parryable!)
        if (currentMutatorId === 'METEOR_SHOWER') {
          meteorSpawnTimer -= dt * timeScale;
          if (meteorSpawnTimer <= 0) {
            meteorSpawnTimer = 2.1;
            arenaMeteors.push({
              x: innerLeft + 85 + Math.random() * (innerRight - innerLeft - 170),
              y: innerTop + 85 + Math.random() * (innerBottom - innerTop - 170),
              radius: 73, // +30% scaled high-visibility meteor hazard (56 * 1.3)
              fuse: 1.15,
              maxFuse: 1.15,
            });
          }
          for (let mIdx = arenaMeteors.length - 1; mIdx >= 0; mIdx--) {
            const m = arenaMeteors[mIdx];
            m.fuse -= dt * timeScale;
            if (m.fuse <= 0) {
              spawnShockwave(m.x, m.y, '#f97316', 125);
              spawnSparks(m.x, m.y, '#f97316', 22);
              playSound('explosion');
              for (const b of balls) {
                if (b.isDead) continue;
                const bDist = Math.hypot(b.x - m.x, b.y - m.y);
                if (bDist <= m.radius + b.effectiveHitRadius) {
                  b.takeDamage(9, '#f97316', '☄️ METEOR STRIKE!');
                }
              }
              arenaMeteors.splice(mIdx, 1);
            }
          }
        } else if (arenaMeteors.length > 0) {
          arenaMeteors.length = 0;
        }

        if (isOnlineActive) {
          const localBall = localIsP1 ? p1 : p2;
          const remoteBall = localBall.currentOpponent ?? (localIsP1 ? p2 : p1);
          const authLocal = authoritativeLocalTargetRef.current;

          // Smoothly reconcile local ball toward 30Hz authoritative GameRoomDO state
          localBall.prevX = localBall.x;
          localBall.prevY = localBall.y;
          localBall.update(dt * timeScale, currentFriction);
          if (authLocal) {
            localBall.x += (authLocal.x - localBall.x) * (dt * 15);
            localBall.y += (authLocal.y - localBall.y) * (dt * 15);
            localBall.vx += (authLocal.vx - localBall.vx) * (dt * 15);
            localBall.vy += (authLocal.vy - localBall.vy) * (dt * 15);
            if (authLocal.health < localBall.health) {
              localBall.damageFlash = 0.25;
            }
            localBall.health = authLocal.health;
            if (localBall.health <= 0 || authLocal.isDead) {
              localBall.isDead = true;
            }
          }

          let abilityDamageDelta = 0;
          if (localBall.timeStopFrozenTimer <= 0 && localBall.hackedDisableTimer <= 0) {
            const remoteHpBefore = remoteBall.health;
            localBall.updateSpecial(dt * timeScale, remoteBall, {
              playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
              spawnSparks,
              spawnShockwave,
            });
            if (remoteBall.health < remoteHpBefore) {
              remoteBall.lastAttacker = localBall;
              abilityDamageDelta = Math.max(0, remoteHpBefore - remoteBall.health);
            }
          }

          // Remote opponent Linear Interpolation (Lerp) toward 30Hz GameRoomDO state
          const opponent = remoteBall;
          const remoteTarget = remoteOpponentTargetRef.current;
          const authoritativeRemoteHealth = remoteTarget ? remoteTarget.health : opponent.health;
          if (remoteTarget) {
            opponent.targetX = remoteTarget.x;
            opponent.targetY = remoteTarget.y;
            opponent.targetVx = remoteTarget.vx;
            opponent.targetVy = remoteTarget.vy;
          }

          opponent.prevX = opponent.x;
          opponent.prevY = opponent.y;

          opponent.x += (opponent.targetX - opponent.x) * (dt * 15);
          opponent.y += (opponent.targetY - opponent.y) * (dt * 15);
          opponent.vx += (opponent.targetVx - opponent.vx) * (dt * 15);
          opponent.vy += (opponent.targetVy - opponent.vy) * (dt * 15);

          const lerpedX = opponent.x;
          const lerpedY = opponent.y;
          const lerpedVx = opponent.vx;
          const lerpedVy = opponent.vy;

          opponent.update(dt * timeScale, currentFriction);
          opponent.x = lerpedX;
          opponent.y = lerpedY;
          opponent.vx = lerpedVx;
          opponent.vy = lerpedVy;

          if (opponent.timeStopFrozenTimer <= 0 && opponent.hackedDisableTimer <= 0) {
            const localHpBefore = localBall.health;
            opponent.updateSpecial(dt * timeScale, localBall, {
              playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
              spawnSparks,
              spawnShockwave,
            });
            if (localBall.health < localHpBefore) {
              localBall.lastAttacker = opponent;
            }
          }

          if (remoteTarget) {
            if (authoritativeRemoteHealth < opponent.health) {
              opponent.damageFlash = 0.25;
            }
            opponent.health = authoritativeRemoteHealth;
            if (opponent.health <= 0 || remoteTarget.isDead) {
              opponent.isDead = true;
            }
            if (remoteTarget.parryActive && opponent.parryActiveTimer <= 0) {
              opponent.parryActiveTimer = 0.15;
            }
          }

          // Sync ability triggers, defensive stances, and special ability damage to GameRoomDO at 20Hz
          const nowMs = performance.now();
          if (
            socketRef.current?.readyState === WebSocket.OPEN &&
            (abilityDamageDelta > 0 || nowMs - lastStateEmitTime >= 50)
          ) {
            lastStateEmitTime = nowMs;
            const localAbility = localBall.getSpecialCooldownInfo();
            sendWsEvent(socketRef.current, 'player_state', {
              room: onlineRoomIdRef.current,
              x: localBall.x,
              y: localBall.y,
              vx: localBall.vx,
              vy: localBall.vy,
              health: localBall.health,
              hitbox: localBall.effectiveHitRadius,
              parryActive: localBall.parryActiveTimer > 0,
              dodgeActive: localBall.dodgeInvulnTimer > 0,
              isDead: localBall.isDead,
              abilityDamageDelta: abilityDamageDelta > 0 ? abilityDamageDelta : undefined,
              abilityProgress: localAbility.progress,
              abilityRemaining: localAbility.remainingSeconds,
              abilityActive: localAbility.isActive,
              abilityStatusText: localAbility.statusText,
              seq: ++stateSeq,
            });
          }
        } else {
          p1.update(dt * timeScale, currentFriction);
          p2.update(dt * timeScale, currentFriction);

          // Subclass Special Mechanics (paused when frozen by StarPlatinumBall's Time Stop or disabled by Edward's Hack!)
          if (p1.timeStopFrozenTimer <= 0 && p1.hackedDisableTimer <= 0) {
            const p2HpBefore = p2.health;
            p1.updateSpecial(dt * timeScale, p2, {
              playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
              spawnSparks,
              spawnShockwave,
            });
            if (p2.health < p2HpBefore) {
              p2.lastAttacker = p1;
            }
          }
          if (p2.timeStopFrozenTimer <= 0 && p2.hackedDisableTimer <= 0) {
            const p1HpBefore = p1.health;
            p2.updateSpecial(dt * timeScale, p1, {
              playSound: (type: ArenaSoundEffect) => audioController.playEffect(type),
              spawnSparks,
              spawnShockwave,
            });
            if (p1.health < p1HpBefore) {
              p1.lastAttacker = p2;
            }
          }
        }

        // Universal Projectile Parry Deflector & Swept Projectile Lag Compensation:
        // Allows an active Parry Stance to deflect incoming projectiles back at the shooter!
        const checkProjectileParryAndSweptHit = (defender: Ball, shooter: Ball) => {
          const projList = (shooter as any).projectiles as any[] | undefined;
          if (!projList || !Array.isArray(projList)) return;
          for (let i = projList.length - 1; i >= 0; i--) {
            const proj = projList[i];
            if (!proj || typeof proj.x !== 'number' || typeof proj.y !== 'number') continue;
            const pRadius = (typeof proj.radius === 'number' ? proj.radius : 36) * 1.3;
            const distToDef = Math.hypot(proj.x - defender.x, proj.y - defender.y);
            if (defender.parryActiveTimer > 0 && distToDef <= defender.effectiveHitRadius + pRadius + 16) {
              defender.parryActiveTimer = 0;
              defender.parryCooldownTimer = 0.30;
              if (typeof proj.vx === 'number' && typeof proj.vy === 'number') {
                proj.vx = -proj.vx * 1.4;
                proj.vy = -proj.vy * 1.4;
              }
              shooter.takeDamage(6.5, '#facc15', '🛡️ SHOT PARRIED!', false, defender);
              defender.recordDamageDealt(6.5, { playSound, spawnSparks, spawnShockwave });
              defender.floatingTexts.push({
                text: '🛡️ PROJECTILE DEFLECTED!',
                x: defender.x,
                y: defender.y - defender.radius - 36,
                alpha: 1.0,
                color: '#facc15',
                vy: -1.5,
              });
              spawnShockwave(defender.x, defender.y, '#facc15', 95);
              spawnSparks(proj.x, proj.y, '#ffffff', 16);
              playSound('crit');
              projList.splice(i, 1);
            }
          }
        };
        checkProjectileParryAndSweptHit(p1, p2);
        checkProjectileParryAndSweptHit(p2, p1);

        const enforcePhaseVelocityBounds = (ball: Ball) => {
          if (isGameOver) return;
          if (ball.timeStopFrozenTimer > 0) return;
          if (ball instanceof Levi && ball.isLatched) return;

          let speedMult = 1.0;
          if (ball instanceof Zenitsu) {
            speedMult *= 0.30; // Sleeping 30% speed
          } else if (ball instanceof Saitama) {
            speedMult *= 0.25 + ball.momentumCharge * 0.70;
          } else if (ball instanceof Killua || ball instanceof KoroSensei || ball instanceof Sonic) {
            speedMult *= 1.32; // Assassins & Speedsters
          } else if (ball instanceof EvaUnit01 && ball.isBerserk()) {
            speedMult *= 1.5; // Eva Unit-01 Berserk Mode applies a permanent 1.5x speed multiplier!
          }
          if (ball.infinitySlowTimer > 0) {
            speedMult *= 0.10;
          } else if (ball.waterSlowTimer > 0) {
            speedMult *= 0.55;
          }

          const effectiveCap = currentSpeedCap * speedMult;
          const effectiveMin = currentMinSpeed * speedMult;

          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed > effectiveCap) {
            ball.vx = (ball.vx / speed) * effectiveCap;
            ball.vy = (ball.vy / speed) * effectiveCap;
          } else if (speed < effectiveMin && speed > 0.05) {
            ball.vx = (ball.vx / speed) * effectiveMin;
            ball.vy = (ball.vy / speed) * effectiveMin;
          }
        };

        if (isOnlineActive) {
          enforcePhaseVelocityBounds(localIsP1 ? p1 : p2);
        } else {
          enforcePhaseVelocityBounds(p1);
          enforcePhaseVelocityBounds(p2);
        }

        setP1Hp(p1.health);
        setP2Hp(p2.health);

        if (p1.health > 0 && p2.health > 0) {
        // Continuous Swept Collision Detection (CCD) + Velocity-Adaptive Hitbox Compensation:
        // Evaluates 4 sub-steps along the frame trajectory so high-speed balls never tunnel or miss hits
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.hypot(dx, dy);
        const minDist = p1.radius + p2.radius;
        const adaptiveMinDist = (p1.effectiveHitRadius + p2.effectiveHitRadius) * 0.94;

        if (dist >= minDist) {
          for (let step = 1; step <= 4; step++) {
            const t = step / 4;
            const s1x = p1.prevX + (p1.x - p1.prevX) * t;
            const s1y = p1.prevY + (p1.y - p1.prevY) * t;
            const s2x = p2.prevX + (p2.prevX ? (p2.x - p2.prevX) * t : 0);
            const s2y = p2.prevY + (p2.prevY ? (p2.y - p2.prevY) * t : 0);
            const subDx = s2x - s1x;
            const subDy = s2y - s1y;
            const subDist = Math.hypot(subDx, subDy);
            if (subDist < adaptiveMinDist && subDist > 0) {
              p1.x = s1x;
              p1.y = s1y;
              p2.x = s2x;
              p2.y = s2y;
              dx = subDx;
              dy = subDy;
              dist = Math.min(subDist, minDist - 0.5);
              break;
            }
          }
        }

        const eitherScoutLatched =
          (p1 instanceof Levi && p1.isLatched) ||
          (p2 instanceof Levi && p2.isLatched);

        if (dist < minDist && dist > 0 && !isGameOver && !eitherScoutLatched) {
          if (p1 instanceof Levi && p1.canLatch()) {
            p1.startLatch(p2, { playSound, spawnSparks, spawnShockwave });
          } else if (p2 instanceof Levi && p2.canLatch()) {
            p2.startLatch(p1, { playSound, spawnSparks, spawnShockwave });
          } else {
            const nx = dx / dist;
            const ny = dy / dist;
            const tx = -ny;
            const ty = nx;

            const overlap = minDist - dist;
            const totalMass = p1.mass + p2.mass;
            if (p2.timeStopFrozenTimer > 0) {
              p1.x -= nx * overlap;
              p1.y -= ny * overlap;
            } else if (p1.timeStopFrozenTimer > 0) {
              p2.x += nx * overlap;
              p2.y += ny * overlap;
            } else {
              p1.x -= nx * overlap * (p2.mass / totalMass);
              p1.y -= ny * overlap * (p2.mass / totalMass);
              p2.x += nx * overlap * (p1.mass / totalMass);
              p2.y += ny * overlap * (p1.mass / totalMass);
            }

            const speed1 = p1.timeStopFrozenTimer > 0 ? 0 : Math.hypot(p1.vx, p1.vy);
            const speed2 = p2.timeStopFrozenTimer > 0 ? 0 : Math.hypot(p2.vx, p2.vy);
            const relativeImpactSpeed = Math.hypot(
              (p1.timeStopFrozenTimer > 0 ? 0 : p1.vx) - (p2.timeStopFrozenTimer > 0 ? 0 : p2.vx),
              (p1.timeStopFrozenTimer > 0 ? 0 : p1.vy) - (p2.timeStopFrozenTimer > 0 ? 0 : p2.vy)
            );

            const v1n = p1.vx * nx + p1.vy * ny;
            const v1t = p1.vx * tx + p1.vy * ty;
            const v2n = p2.vx * nx + p2.vy * ny;
            const v2t = p2.vx * tx + p2.vy * ty;

            if (v1n - v2n > 0 || p1.timeStopFrozenTimer > 0 || p2.timeStopFrozenTimer > 0) {
            const m1 = p1.mass;
            const m2 = p2.mass;
            const restitution = 0.96;

            const v1nPost = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2) * restitution;
            const v2nPost = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2) * restitution;

            p1.vx = v1nPost * nx + v1t * tx;
            p1.vy = v1nPost * ny + v1t * ty;
            p2.vx = v2nPost * nx + v2t * tx;
            p2.vy = v2nPost * ny + v2t * ty;

            // Subtle velocity-damping friction mechanic on collision:
            // Only applies to balls moving faster than 15 u/s to prevent excessive ricochets
            const dampHighSpeedCollision = (b: Ball) => {
              if (b.isDead || b.timeStopFrozenTimer > 0) return;
              const postSpeed = Math.hypot(b.vx, b.vy);
              if (postSpeed > 15.0) {
                const dampedSpeed = 15.0 + (postSpeed - 15.0) * 0.74;
                const scale = dampedSpeed / postSpeed;
                b.vx *= scale;
                b.vy *= scale;
              }
            };
            dampHighSpeedCollision(p1);
            dampHighSpeedCollision(p2);

            if (relativeImpactSpeed > 0.8) {
              const resolveAttackDamage = (attacker: Ball, defender: Ball, speedScale: number = 1.0) => {
                const massFactor = Math.sqrt(attacker.mass / defender.mass);
                let finalDamage = relativeImpactSpeed * 1.5 * massFactor * speedScale * (attacker.collisionDamageMultiplier ?? 1.0);
                let color = '#ef4444';
                let label: string | undefined = undefined;
                let bypassEarlyCap = false;

                // LightYagami (📓): deals almost zero collision damage
                if (attacker instanceof LightYagami) {
                  finalDamage = 0.2;
                }

                // Escanor (☀️): Sunshine scaling increases collision power as roundTimer grows
                if (attacker instanceof Escanor) {
                  finalDamage *= attacker.getSunshineMultiplier();
                  label = '☀️ SUNSHINE!';
                }

                // Kenpachi (👹): Berserker unpatched slash scales with missing HP
                if (attacker instanceof Kenpachi) {
                  finalDamage *= attacker.getBerserkMultiplier();
                  label = '👹 ZARAKI SLASH!';
                }

                // EvaUnit01 (👾): Drops into Berserk Mode below 45% HP with a 1.5x speed and collision damage multiplier
                if (attacker instanceof EvaUnit01 && attacker.isBerserk()) {
                  finalDamage *= 1.5;
                  bypassEarlyCap = true;
                  label = '👾 EVA-01 BERSERK (1.5x)!';
                }

                // KoroSensei (🐙): Mach-20 afterimage halves incoming collision damage
                if (defender instanceof KoroSensei) {
                  finalDamage *= 0.55;
                }

                // Shigaraki (🖐️): Decays health on touch
                if (attacker instanceof Shigaraki || defender instanceof Shigaraki) {
                  const target = attacker instanceof Shigaraki ? defender : attacker;
                  target.decayTimer = 4.0;
                }

                // Spike (🚬): If hit physically while the blue Jeet Kune Do aura is active, he absorbs the blow,
                // takes zero damage, and instantly reflects 1.8x the collision force & damage back at the attacker!
                if (defender instanceof Spike && !(attacker instanceof Spike) && defender.isStanceActive) {
                  const reflectedDmg = Math.max(5, finalDamage * 1.8);
                  attacker.lastAttacker = defender;
                  attacker.vx = -attacker.vx * 1.8;
                  attacker.vy = -attacker.vy * 1.8;
                  attacker.takeDamage(reflectedDmg, '#38bdf8', '🚬 JEET KUNE DO 1.8x REFLECT!', true, defender);
                  defender.recordDamageDealt(reflectedDmg, { playSound, spawnSparks, spawnShockwave });
                  defender.floatingTexts.push({
                    text: '🚬 ZERO DMG ABSORB!',
                    x: defender.x,
                    y: defender.y - defender.radius - 32,
                    alpha: 1.0,
                    color: '#38bdf8',
                    vy: -1.4,
                  });
                  spawnShockwave(defender.x, defender.y, '#38bdf8', 120);
                  playSound('crit');
                  return;
                }

                // Jotaro (⭐): Massive collision bonus when striking a Time-Stopped enemy!
                if (attacker instanceof Jotaro && defender.timeStopFrozenTimer > 0) {
                  finalDamage *= 2.4;
                  bypassEarlyCap = true;
                  label = '⭐ ORA ORA SMASH!';
                  color = '#facc15';
                  playSound('explosion');
                  spawnShockwave(defender.x, defender.y, '#facc15', 130);
                }

                // Deku (✊): Highest collision multiplier in the game + 15% recoil
                if (attacker instanceof Deku) {
                  finalDamage = Math.max(26, finalDamage * 4.2);
                  bypassEarlyCap = true;
                  label = '✊ DETROIT SMASH!';
                  color = '#10b981';
                  playSound('explosion');
                  spawnShockwave(defender.x, defender.y, '#10b981', 155);
                  spawnSparks(defender.x, defender.y, '#6ee7b7', 26);

                  const recoilDamage = Math.max(1, Math.round(attacker.maxHealth * 0.15));
                  attacker.lastAttacker = defender;
                  attacker.health = Math.max(0, attacker.health - recoilDamage);
                  attacker.damageFlash = 0.25;
                  attacker.damageTexts.push(new DamageText(attacker.x, attacker.y, recoilDamage, '#10b981'));
                  attacker.floatingTexts.push({
                    text: '💥 15% RECOIL!',
                    x: attacker.x,
                    y: attacker.y - attacker.radius - 28,
                    alpha: 1.0,
                    color: '#f43f5e',
                    vy: -1.4,
                  });
                }

                // Saitama (👊): 9999 damage (Instant KO) on high-speed impact
                if (attacker instanceof Saitama) {
                  const attackerSpeed = attacker === p1 ? speed1 : speed2;
                  if (attacker.isAtHighSpeed() || attackerSpeed >= 6.5 || relativeImpactSpeed >= 11.5) {
                    finalDamage = 9999;
                    bypassEarlyCap = true;
                    label = '👊 SERIOUS PUNCH! 9999 KO!';
                    color = '#ef4444';
                    playSound('explosion');
                    playSound('ko');
                    spawnShockwave(defender.x, defender.y, '#ef4444', 240);
                    spawnShockwave(defender.x, defender.y, '#facc15', 180);
                    spawnSparks(defender.x, defender.y, '#facc15', 45);
                  } else {
                    attacker.momentumCharge = Math.max(0, attacker.momentumCharge - 0.25);
                  }
                }

                // MathGrid center grid multiplier
                if (attacker instanceof MathGrid && attacker.isInsideCenterGrid()) {
                  const mult = attacker.getCurrentMultiplier();
                  finalDamage *= mult;
                  if (mult > 1.0) {
                    label = `CENTER GRID ×${mult.toFixed(1)}`;
                    color = '#d97706';
                    playSound('crit');
                  }
                }

                // Jackpot
                if (attacker instanceof Jackpot) {
                  const roll = Math.random();
                  if (roll < 0.20) {
                    finalDamage += 3.0;
                    label = '🎰 JACKPOT!';
                    color = '#facc15';
                    playSound('jackpot');
                    spawnSparks(defender.x, defender.y, '#facc15', 20);
                  } else {
                    label = 'HIT';
                    color = '#94a3b8';
                  }
                }

                // Frost Shatter
                if (defender.isFrozen) {
                  defender.isFrozen = false;
                  defender.frozenTimer = 0;
                  finalDamage += 2.0;
                  label = 'SHATTER +2!';
                  color = '#38bdf8';
                  playSound('shatter');
                  spawnSparks(defender.x, defender.y, '#bae6fd', 16);
                  spawnShockwave(defender.x, defender.y, '#38bdf8', 70);
                }

                attacker.playAttackVoice();
                defender.lastAttacker = attacker;
                const appliedDamage = defender.takeDamage(
                  finalDamage,
                  attacker.color,
                  label,
                  bypassEarlyCap,
                  attacker
                );
                attacker.recordDamageDealt(finalDamage, { playSound, spawnSparks, spawnShockwave });
                if (currentMutatorId === 'BLOODLUST_SURGE' && appliedDamage > 0) {
                  attacker.heal(appliedDamage * 0.35);
                  attacker.recordDamageDealt(finalDamage, { playSound, spawnSparks, spawnShockwave });
                }

                if (attacker instanceof Vampire) {
                  attacker.heal(appliedDamage * 0.35);
                  playSound('siphon');
                  spawnSparks(attacker.x, attacker.y, '#ef4444', 8);
                }

                if (defender instanceof Juggernaut) {
                  defender.absorbKinetic(appliedDamage * 1.2);
                }
              };

              if (!isOnlineActive) {
                const p1SpecialBrawler = p1 instanceof Deku || (p1 instanceof Saitama && p1.isAtHighSpeed());
                const p2SpecialBrawler = p2 instanceof Deku || (p2 instanceof Saitama && p2.isAtHighSpeed());

                if (p1SpecialBrawler || p2SpecialBrawler) {
                  if (p1SpecialBrawler) resolveAttackDamage(p1, p2, 1.0);
                  if (p2SpecialBrawler) resolveAttackDamage(p2, p1, 1.0);
                  if (!p1SpecialBrawler && speed1 > speed2 + 0.15) resolveAttackDamage(p1, p2, 1.0);
                  if (!p2SpecialBrawler && speed2 > speed1 + 0.15) resolveAttackDamage(p2, p1, 1.0);
                } else if (speed1 > speed2 + 0.15) {
                  resolveAttackDamage(p1, p2, 1.0);
                } else if (speed2 > speed1 + 0.15) {
                  resolveAttackDamage(p2, p1, 1.0);
                } else {
                  resolveAttackDamage(p1, p2, 0.5);
                  resolveAttackDamage(p2, p1, 0.5);
                }
              }

              const clashX = (p1.x + p2.x) / 2;
              const clashY = (p1.y + p2.y) / 2;
              spawnSparks(clashX, clashY, '#ffffff', 14);
              spawnSparks(clashX, clashY, speed1 > speed2 ? '#38bdf8' : '#f97316', 8);
              spawnShockwave(clashX, clashY, '#ffffff');
              p1.playCollisionVoice();
              p2.playCollisionVoice();
            }
          }
          }
        }

        // Physics Connection: Update the boundary collision math so it reads currentArena.
        // If it is set to 'Ice', apply a significantly lower friction coefficient so the balls slide much further.
        const activeWallRestitution = currentMutatorId === 'OVERDRIVE_BOUNCE'
          ? 1.22
          : isIceArena
          ? 1.02
          : phase3Triggered
          ? PHASE3_WALL_RESTITUTION
          : BASE_WALL_RESTITUTION;
        const wallFriction = isIceArena ? 0.9995 : 0.98;

        const handleWallCollision = (ball: Ball) => {
          if (ball instanceof Juggernaut) {
            ball.absorbKinetic(12);
          }
          let collidedWithWall = false;
          if (ball.x - ball.radius < innerLeft) {
            ball.x = innerLeft + ball.radius;
            ball.vx = -ball.vx * activeWallRestitution;
            ball.vy *= wallFriction;
            collidedWithWall = true;
            spawnSparks(innerLeft, ball.y, isIceArena ? '#38bdf8' : ball.color, isIceArena ? 8 : 5);
            playSound('wall');
          }
          if (ball.x + ball.radius > innerRight) {
            ball.x = innerRight - ball.radius;
            ball.vx = -ball.vx * activeWallRestitution;
            ball.vy *= wallFriction;
            collidedWithWall = true;
            spawnSparks(innerRight, ball.y, isIceArena ? '#38bdf8' : ball.color, isIceArena ? 8 : 5);
            playSound('wall');
          }
          if (ball.y - ball.radius < innerTop) {
            ball.y = innerTop + ball.radius;
            ball.vy = -ball.vy * activeWallRestitution;
            ball.vy *= wallFriction;
            collidedWithWall = true;
            spawnSparks(ball.x, innerTop, isIceArena ? '#38bdf8' : ball.color, isIceArena ? 8 : 5);
            playSound('wall');
          }
          if (ball.y + ball.radius > innerBottom) {
            ball.y = innerBottom - ball.radius;
            ball.vy = -ball.vy * activeWallRestitution;
            ball.vy *= wallFriction;
            collidedWithWall = true;
            spawnSparks(ball.x, innerBottom, isIceArena ? '#38bdf8' : ball.color, isIceArena ? 8 : 5);
            playSound('wall');
          }

          // Subtle velocity-damping friction mechanic on wall collision:
          // Only applies to balls moving faster than 15 u/s to prevent excessive ricochets
          if (collidedWithWall && !ball.isDead && ball.timeStopFrozenTimer <= 0) {
            const wallPostSpeed = Math.hypot(ball.vx, ball.vy);
            if (wallPostSpeed > 15.0) {
              const dampedSpeed = 15.0 + (wallPostSpeed - 15.0) * 0.74;
              const scale = dampedSpeed / wallPostSpeed;
              ball.vx *= scale;
              ball.vy *= scale;
            }
          }
        };

        handleWallCollision(p1);
        handleWallCollision(p2);
        }

        // Animate .game-canvas-element border to pulse a soft blue glow when a player's ability is ready to be triggered
        const abilityReadyNow =
          !isGameOver &&
          gameState === 'PLAYING' &&
          (p1.isAbilityReady() || (!playAgainstBot && p2.isAbilityReady()));
        canvas.classList.toggle('ability-ready-pulse', abilityReadyNow);
        setIsAbilityReadyGlow((prev) => (prev !== abilityReadyNow ? abilityReadyNow : prev));

        // Update Character Avatar Special Ability Cooldown Ring & Bar Progress (throttled per % or 0.1s / state change)
        const remoteCooldownTarget = isOnlineActive ? remoteOpponentTargetRef.current : null;
        const p1Info =
          isOnlineActive && !localIsP1 && remoteCooldownTarget && typeof remoteCooldownTarget.abilityProgress === 'number'
            ? {
                progress: remoteCooldownTarget.abilityProgress,
                remainingSeconds: remoteCooldownTarget.abilityRemaining ?? 0,
                isActive: Boolean(remoteCooldownTarget.abilityActive),
                statusText: remoteCooldownTarget.abilityStatusText || 'READY',
              }
            : p1.getSpecialCooldownInfo();
        const p2Info =
          isOnlineActive && localIsP1 && remoteCooldownTarget && typeof remoteCooldownTarget.abilityProgress === 'number'
            ? {
                progress: remoteCooldownTarget.abilityProgress,
                remainingSeconds: remoteCooldownTarget.abilityRemaining ?? 0,
                isActive: Boolean(remoteCooldownTarget.abilityActive),
                statusText: remoteCooldownTarget.abilityStatusText || 'READY',
              }
            : p2.getSpecialCooldownInfo();

        const p1Key = `${Math.round(p1Info.progress * 100)}|${p1Info.statusText}|${p1Info.isActive ? 1 : 0}`;
        const p2Key = `${Math.round(p2Info.progress * 100)}|${p2Info.statusText}|${p2Info.isActive ? 1 : 0}`;
        if (p1Key !== lastP1AbilityKey) {
          lastP1AbilityKey = p1Key;
          setP1AbilityProgress(p1Info.progress);
          setP1AbilityHud({
            remaining: p1Info.remainingSeconds,
            isActive: p1Info.isActive,
            statusText: p1Info.statusText,
          });
        }
        if (p2Key !== lastP2AbilityKey) {
          lastP2AbilityKey = p2Key;
          setP2AbilityProgress(p2Info.progress);
          setP2AbilityHud({
            remaining: p2Info.remainingSeconds,
            isActive: p2Info.isActive,
            statusText: p2Info.statusText,
          });
        }

        // Update Character Overlay Dodge Dash Countdown (throttled at 0.1s resolution)
        const p1DashTenth = Math.max(0, Math.ceil(p1.dodgeDashCooldownTimer * 10));
        const p2DashTenth = Math.max(0, Math.ceil(p2.dodgeDashCooldownTimer * 10));
        if (p1DashTenth !== lastP1DashTenth) {
          lastP1DashTenth = p1DashTenth;
          setP1DashRemaining(p1DashTenth / 10);
        }
        if (p2DashTenth !== lastP2DashTenth) {
          lastP2DashTenth = p2DashTenth;
          setP2DashRemaining(p2DashTenth / 10);
        }
      } else if (gameState === 'FINISHER') {
        // Physics Lock: skip elastic collisions, weapon firing, and movement while fatality & particles continue rendering
        p1.vx = 0;
        p1.vy = 0;
        p2.vx = 0;
        p2.vy = 0;
      }

      // Dynamic Canvas Zoom on Fatality: Slightly zoom camera (1.05x) in on the dead ball's (x, y) coordinates
      const deadFocusBall =
        gameState === 'FINISHER'
          ? p1.isDead
            ? p1
            : p2.isDead
            ? p2
            : null
          : null;
      if (deadFocusBall) {
        ctx.save();
        ctx.translate(deadFocusBall.x, deadFocusBall.y);
        ctx.scale(1.05, 1.05);
        ctx.translate(-deadFocusBall.x, -deadFocusBall.y);
      }

      // Apply screen-shaking quake offset if Whitebeard (or Megumin Explosion) triggered a quake!
      const isShaking = p1.screenShakeTimer > 0 || p2.screenShakeTimer > 0;
      if (isShaking) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      }

      // The Rendering Switch: Inside the main requestAnimationFrame loop, before drawing any balls or particles,
      // create an updateArena() function. Use a switch(currentArena) statement to draw the correct background environment
      // (e.g., drawing a dark grey rectangle with a dashed yellow line for 'Road', or a light blue background for 'Ice').
      const updateArena = () => {
        switch (currentArena) {
          case 'Road': {
            // Dark night-sky canvas background outside arena
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Dark grey asphalt rectangle interior
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

            ctx.save();
            // Road shoulders (solid white lane boundary markings)
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(innerLeft + 32, innerTop);
            ctx.lineTo(innerLeft + 32, innerBottom);
            ctx.moveTo(innerRight - 32, innerTop);
            ctx.lineTo(innerRight - 32, innerBottom);
            ctx.stroke();

            // Dashed yellow center dividing line
            const centerX = (innerLeft + innerRight) / 2;
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 6;
            ctx.setLineDash([28, 18]);
            ctx.beginPath();
            ctx.moveTo(centerX, innerTop);
            ctx.lineTo(centerX, innerBottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Guardrail and hazard curb border (glows crimson red during Sudden Death)
            ctx.save();
            if (isEscalated) {
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 18;
            }
            ctx.strokeStyle = isEscalated ? '#7f1d1d' : '#334155';
            ctx.lineWidth = WALL_THICKNESS;
            ctx.strokeRect(
              ARENA_X + WALL_THICKNESS / 2,
              ARENA_Y + WALL_THICKNESS / 2,
              ARENA_SIZE - WALL_THICKNESS,
              ARENA_SIZE - WALL_THICKNESS
            );
            ctx.strokeStyle = isEscalated ? '#ef4444' : '#f59e0b'; // Hazard warning edge
            ctx.lineWidth = isEscalated ? 4 : 2.5;
            ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
            ctx.restore();
            break;
          }

          case 'Ice': {
            // Tundra canvas background outside arena
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Light blue ice rink interior
            const iceGrad = ctx.createLinearGradient(innerLeft, innerTop, innerRight, innerBottom);
            iceGrad.addColorStop(0, '#bae6fd');
            iceGrad.addColorStop(0.5, '#7dd3fc');
            iceGrad.addColorStop(1, '#38bdf8');
            ctx.fillStyle = iceGrad;
            ctx.fillRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

            // Frost shimmer & jagged ice crack lines
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(innerLeft + 45, innerTop + 60);
            ctx.lineTo(innerLeft + 160, innerTop + 130);
            ctx.lineTo(innerLeft + 210, innerTop + 220);
            ctx.moveTo(innerRight - 65, innerBottom - 70);
            ctx.lineTo(innerRight - 180, innerBottom - 150);
            ctx.lineTo(innerRight - 220, innerBottom - 260);
            ctx.moveTo(innerLeft + 120, innerBottom - 80);
            ctx.lineTo(innerLeft + 250, innerBottom - 160);
            ctx.stroke();

            // Glossy ice center circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc((innerLeft + innerRight) / 2, (innerTop + innerBottom) / 2, 85, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Crystalline cyan glacier border walls (glows crimson red during Sudden Death)
            ctx.save();
            if (isEscalated) {
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 18;
            }
            ctx.strokeStyle = isEscalated ? '#7f1d1d' : '#0284c7';
            ctx.lineWidth = WALL_THICKNESS;
            ctx.strokeRect(
              ARENA_X + WALL_THICKNESS / 2,
              ARENA_Y + WALL_THICKNESS / 2,
              ARENA_SIZE - WALL_THICKNESS,
              ARENA_SIZE - WALL_THICKNESS
            );
            ctx.strokeStyle = isEscalated ? '#ef4444' : '#e0f2fe';
            ctx.lineWidth = isEscalated ? 4 : 2.5;
            ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);
            ctx.restore();
            break;
          }

          case 'Default':
          default: {
            renderArena(
              ctx,
              selectedArena,
              CANVAS_W,
              CANVAS_H,
              ARENA_X,
              ARENA_Y,
              ARENA_SIZE,
              WALL_THICKNESS,
              innerLeft,
              innerRight,
              innerTop,
              innerBottom,
              isEscalated
            );
            break;
          }
        }
      };

      // 1. Render Arena Environment before drawing any balls or particles
      updateArena();

      // 1b. Render Active Arena Evolution Mutator Visuals (+30% scaled Gravity Vortex / Orbital Meteors / Overdrive Rim)
      if (currentMutatorId === 'GRAVITY_WELL') {
        const cx = (innerLeft + innerRight) / 2;
        const cy = (innerTop + innerBottom) / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(cx, cy, 143 + Math.sin(roundTimer * 4) * 15.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(cx, cy, 31.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = '#a855f7';
        ctx.stroke();
        ctx.restore();
      } else if (currentMutatorId === 'METEOR_SHOWER' && arenaMeteors.length > 0) {
        ctx.save();
        for (const m of arenaMeteors) {
          const progress = 1 - Math.max(0, m.fuse / m.maxFuse);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fill();

          // Dark core meteor descending (+30% scaled hazard with 4px solid white stroke)
          const coreR = Math.max(24, m.radius * progress);
          ctx.fillStyle = '#090d16';
          ctx.beginPath();
          ctx.arc(m.x, m.y, coreR, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
        ctx.restore();
      } else if (currentMutatorId === 'OVERDRIVE_BOUNCE') {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(innerLeft + 2, innerTop + 2, innerRight - innerLeft - 4, innerBottom - innerTop - 4);
        ctx.restore();
      }

      // 2. Render Subclass Background Elements & Items at +30% Scale (1.3x)
      balls.forEach((ball) => {
        ball.drawBackground(scaledEntityCtx);
      });

      // 3. Render Expanding Shockwaves (unconditionally updated and drawn every frame)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 5;
        sw.alpha -= 0.035;
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Global Particle Engine: Update, draw, and strictly enforce aggressive per-frame garbage collection
      globalParticlePool.updateAndDraw(ctx, dt * timeScale);
      particles = particles.filter((p: any) => p.opacity > 0 && p.life > 0);

      // 5. Render Fix: Render Player 1 and Player 2 base balls (with Ball's built-in victory hop animation or fatality visual)
      balls.forEach((ball) => {
        if (!ball.isDead) {
          if (ball.updateVictoryAnimation(dt * timeScale)) {
            // Trigger landing dust/gold spark ring each time the winner bounces on the arena floor
            const floorY = ball.victoryBaseY ?? ball.y;
            spawnShockwave(ball.x, floorY + ball.radius * 0.7, '#facc15', ball.radius + 26);
            spawnSparks(ball.x, floorY + ball.radius * 0.6, '#facc15', 8);
          }
          ball.drawVictoryAnimation(ctx, dt * timeScale);
        } else if (ball.drawDeadFatality) {
          ball.drawDeadFatality(ctx, dt * timeScale);
        }
      });

      if (isShaking) {
        ctx.restore();
      }

      // 6. Render normalized Player 1 and Player 2 projectiles without compounded canvas scaling
      p1.drawProjectiles(ctx);
      p2.drawProjectiles(ctx);
      balls.forEach((ball) => {
        if (ball !== p1 && ball !== p2) {
          ball.drawProjectiles(ctx);
        }
      });

      // 6b. Render Fading Tactical Ping Markers (Alt+Click on Canvas) & Floating Emote Speech Bubbles
      drawTacticalPings(ctx);
      drawActiveEmotes(ctx, p1, p2);

      // 6c. Render Floating Arena Center Notifications (e.g., 'OPPONENT FLED - FORFEIT VICTORY!')
      for (let i = arenaCenterTextsRef.current.length - 1; i >= 0; i--) {
        const notice = arenaCenterTextsRef.current[i];
        notice.y += notice.vy * dt;
        notice.alpha -= dt * 0.35;
        if (notice.alpha <= 0) {
          arenaCenterTextsRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, notice.alpha));
        ctx.font = 'italic 900 32px Impact, "Arial Black", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#000000';
        ctx.shadowColor = 'rgba(250, 204, 21, 0.75)';
        ctx.shadowBlur = 16;
        ctx.strokeText(notice.text, notice.x, notice.y);
        ctx.fillStyle = notice.color || '#facc15';
        ctx.fillText(notice.text, notice.x, notice.y);
        ctx.restore();
      }

      // 7. During Launch Phase: Render Real-Time Mouse Trajectory Dotted Line & Targeting Arrows
      if (gameState === 'LAUNCH') {
        const p1AimingNow = isOnlineActive ? (localIsP1 && !p1IsLocked) : !p1IsLocked;
        const p2AimingNow = isOnlineActive
          ? (!localIsP1 && !p2IsLocked)
          : (p1IsLocked && !p2IsLocked && !playAgainstBot);
        drawTargetingArrow(
          p1,
          p1.launchAngle,
          p1IsLocked,
          p1AimingNow,
          '#38bdf8',
          '#0284c7',
          (p1Name.trim() || 'PLAYER 1').toUpperCase(),
          p1IsLocked
            ? '✓ LOCKED'
            : isOnlineActive && !localIsP1
            ? 'OPPONENT AIMING...'
            : '[CLICK / SPACE TO LOCK]'
        );
        drawTargetingArrow(
          p2,
          p2.launchAngle,
          p2IsLocked,
          p2AimingNow,
          '#f97316',
          '#ea580c',
          (p2Name.trim() || (playAgainstBot ? 'BOT (AI)' : 'PLAYER 2')).toUpperCase(),
          isOnlineActive
            ? (p2IsLocked ? '✓ LOCKED' : !localIsP1 ? '[CLICK / SPACE TO LOCK]' : 'OPPONENT AIMING...')
            : playAgainstBot
            ? (p2IsLocked ? '✓ BOT LOCKED' : 'BOT TARGETING...')
            : p2IsLocked
            ? '✓ LOCKED'
            : p2AimingNow
            ? '[CLICK / ENTER TO LOCK]'
            : 'WAITING FOR P1...'
        );
      }

      // Restore Dynamic Canvas Zoom after Fatality scene rendering
      if (deadFocusBall) {
        ctx.restore();
      }

      // 7b. Overdrive Visual Warning: Red/Orange Radial Screen Flash (globalAlpha = 0.4) & Permanent Pulsing Top-Center Banner
      if (overdriveFlashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(0.4, overdriveFlashAlpha));
        const flashGrad = ctx.createRadialGradient(
          CANVAS_W / 2,
          CANVAS_H / 2,
          60,
          CANVAS_W / 2,
          CANVAS_H / 2,
          CANVAS_W * 0.65
        );
        flashGrad.addColorStop(0, '#f97316');
        flashGrad.addColorStop(0.55, '#ef4444');
        flashGrad.addColorStop(1, 'rgba(185, 28, 28, 0.95)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.restore();
        overdriveFlashAlpha = Math.max(0, overdriveFlashAlpha - dt * 0.85);
      }

      if (overdriveTriggered && gameState === 'PLAYING' && !isGameOver) {
        const pulseScale = 1 + Math.sin(performance.now() * 0.012) * 0.08;
        ctx.save();
        ctx.translate(CANVAS_W / 2, innerTop + 102);
        ctx.scale(pulseScale, pulseScale);
        ctx.font = 'italic 900 34px Impact, "Arial Black", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 18;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#facc15';
        ctx.strokeText('OVERDRIVE: 2X SPEED!', 0, 0);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('OVERDRIVE: 2X SPEED!', 0, 0);
        ctx.restore();
      }

      // 8. Impact Frames (Inverted Colors): On a massive hit or Instant KO (e.g., Saitama or Light Yagami),
      // fill the entire canvas with pure white (#ffffff) or pure black (#000000) and draw the characters
      // in high-contrast inverted silhouettes for 2 frames.
      if (impactFrameTimer > 0) {
        const isWhiteBgFrame = impactFrameTimer >= 2;
        const bgColor = isWhiteBgFrame ? '#ffffff' : '#000000';
        const fgColor = isWhiteBgFrame ? '#000000' : '#ffffff';
        impactFrameTimer = Math.max(0, impactFrameTimer - 1);

        ctx.save();
        if (deadFocusBall) {
          ctx.translate(deadFocusBall.x, deadFocusBall.y);
          ctx.scale(1.05, 1.05);
          ctx.translate(-deadFocusBall.x, -deadFocusBall.y);
        }

        // Fill entire canvas with pure white (#ffffff) or pure black (#000000)
        ctx.fillStyle = bgColor;
        ctx.fillRect(-120, -120, CANVAS_W + 240, CANVAS_H + 240);

        // High-contrast arena frame & radial anime impact speed lines
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(innerLeft, innerTop, innerRight - innerLeft, innerBottom - innerTop);

        const impactFocus =
          deadFocusBall ??
          (p1.damageFlash >= p2.damageFlash ? p1 : p2);
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = 3.5;
        const rayCount = 28;
        for (let r = 0; r < rayCount; r++) {
          const rayAngle = (r / rayCount) * Math.PI * 2 + (isWhiteBgFrame ? 0 : 0.08);
          const innerRay = impactFocus.radius * 1.45 + (r % 3) * 18;
          const outerRay = 780;
          ctx.beginPath();
          ctx.moveTo(
            impactFocus.x + Math.cos(rayAngle) * innerRay,
            impactFocus.y + Math.sin(rayAngle) * innerRay
          );
          ctx.lineTo(
            impactFocus.x + Math.cos(rayAngle) * outerRay,
            impactFocus.y + Math.sin(rayAngle) * outerRay
          );
          ctx.stroke();
        }
        ctx.restore();

        // Draw characters and their weapons/projectiles in high-contrast inverted silhouettes
        ctx.save();
        ctx.filter = isWhiteBgFrame
          ? 'grayscale(100%) contrast(1000%) brightness(0%)'
          : 'invert(100%) grayscale(100%) contrast(1000%) brightness(200%)';
        balls.forEach((ball) => {
          ball.drawBackground(scaledEntityCtx);
          if (!ball.isDead) {
            ball.drawVictoryAnimation(ctx, 0);
          } else if (ball.drawDeadFatality) {
            ball.drawDeadFatality(ctx, 0);
          }
          ball.drawProjectiles(ctx);
        });
        ctx.restore();

        // Crisp high-contrast silhouette core & rim guarantee even if canvas filter is unsupported
        balls.forEach((ball) => {
          ctx.save();
          ctx.fillStyle = fgColor;
          ctx.strokeStyle = bgColor;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = bgColor;
          ctx.font = `900 ${Math.round(28.6)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.iconText || '⚔️', ball.x, ball.y - 6);
          ctx.restore();
        });

        ctx.restore();
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('click', handleCanvasAimClick);
      canvas.removeEventListener('touchstart', handleCanvasTouchStart);
      canvas.removeEventListener('touchmove', handleCanvasTouchMove);
      canvas.removeEventListener('touchend', handleCanvasTouchEnd);
      p1BallRef.current = null;
      p2BallRef.current = null;
      gameStateRef.current = 'MENU';
      activeFatalityCompleteCallback = null;
      activeFatalityDispatcher = null;
      triggerForfeitVictoryRef.current = null;
      if (finisherTimeoutId !== null) {
        clearTimeout(finisherTimeoutId);
        finisherTimeoutId = null;
      }
      if (roundTimeoutRef.current) {
        clearTimeout(roundTimeoutRef.current);
        roundTimeoutRef.current = null;
      }
      if (suddenDeathTimerRef.current) {
        clearTimeout(suddenDeathTimerRef.current);
        suddenDeathTimerRef.current = null;
      }
    };
  }, [roundKey, isMatchStarted, isDraftPhase, isOnlineMode, onlineStatus, playAgainstBot, playSound, selectedArena, startingHealth, p1BallType, p2BallType, p1Name, p2Name]);

  const handleStartMatch = () => {
    if (finisherTimeoutId !== null) {
      clearTimeout(finisherTimeoutId);
      finisherTimeoutId = null;
    }
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
    if (suddenDeathTimerRef.current) {
      clearTimeout(suddenDeathTimerRef.current);
      suddenDeathTimerRef.current = null;
    }
    setIsEscalated(false);
    setRoundSeconds(0);
    setSuddenDeathOverlay(false);
    setSuddenDeathCountdown(30);
    setP1AbilityProgress(1);
    setP2AbilityProgress(1);
    setP1DashRemaining(0);
    setP2DashRemaining(0);
    setIsChangingBalls(false);
    hitstopTimer = 0;
    impactFrameTimer = 0;
    // Initialize AudioContext strictly after the match starts
    audioController.initOnStartMatch();
    playSound('start');
    setRoundOverlay(null);
    setMatchPhase('launch');
    setP1AimLocked(false);
    setP2AimLocked(false);
    setMatchStatus('LAUNCH PHASE: LOCK ANGLES');
    setRoundKey((prev) => prev + 1);
    setGameState('launch');
  };

  const attachOnlineSocketListeners = (
    ws: WebSocket,
    _options?: {
      isCustomLobby?: boolean;
      initialBallType?: BallTypeId;
      initialName?: string;
      initialArena?: string;
    }
  ) => {
    ws.onmessage = (event: MessageEvent) => {
      let msg: { type?: string; payload?: any; requestId?: string };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (msg.requestId && pendingWsCallbacksRef.current.has(msg.requestId)) {
        const cb = pendingWsCallbacksRef.current.get(msg.requestId);
        pendingWsCallbacksRef.current.delete(msg.requestId);
        if (cb) cb(msg.payload);
      }

      const data = msg.payload;
      switch (msg.type) {
        case 'waiting_for_opponent': {
          setOnlineStatus('waiting');
          setMatchStatus('IN QUEUE · WAITING FOR OPPONENT...');
          break;
        }

        case 'match_found': {
          const resolvedRoomId = data?.room || data?.roomId || '';
          const resolvedRole: 'Player 1' | 'Player 2' =
            data?.role === 'p1' || data?.role === 'Player 1' || data?.playerRole === 'p1'
              ? 'Player 1'
              : 'Player 2';
          setOnlineRoomId(resolvedRoomId);
          setOnlineRole(resolvedRole);
          setOnlineOpponentDisconnected(false);
          setOnlineRematchRequested(false);
          setOpponentRematchReady(false);
          setLobbyError(null);
          setIsWaitingForFriend(false);
          setIsMatchmakingSearching(false);
          setIsDraftLockedWaiting(false);
          setOpponentDraftLocked(false);
          setJoinMethod('menu');
          authoritativeLocalTargetRef.current = null;
          remoteOpponentTargetRef.current = null;
          pendingStartRoundRef.current = null;
          pendingOpponentLockRef.current = null;

          if (data?.arena) {
            currentArena = data.arena;
            setSelectedArenaChoice(data.arena);
            if (typeof window !== 'undefined') {
              (window as any).currentArena = currentArena;
            }
          }
          if (typeof data?.startingHealth === 'number') {
            setStartingHealth(data.startingHealth);
            setP1Hp(data.startingHealth);
            setP2Hp(data.startingHealth);
          }
          if (data?.p1Username || data?.p1Info) {
            setP1Name(data.p1Username || data.p1Info?.name || 'Player 1');
            if (data.p1Info?.ballType) {
              setP1BallType(data.p1Info.ballType);
            }
          }
          if (data?.p2Username || data?.p2Info) {
            setP2Name(data.p2Username || data.p2Info?.name || 'Player 2');
            if (data.p2Info?.ballType) {
              setP2BallType(data.p2Info.ballType);
            }
          }
          setP1Hearts(3);
          setP2Hearts(3);
          setRoundOverBanner(false);

          setOnlineStatus('matched');
          setMatchStatus(`MATCHED (${resolvedRoomId}) · YOU ARE ${resolvedRole.toUpperCase()}`);
          setIsOnlineMode(true);
          setPlayAgainstBot(false);
          setP2Drafting(null);
          setP1Locked(false);
          setP2Locked(false);
          setIsChangingBalls(false);
          const initialOnlineDraft = generateDraft();
          setP1Drafting(initialOnlineDraft[0]?.id ?? null);
          setGameState('draft');

          // Transition seamlessly from MatchmakerDO socket to dedicated GameRoomDO WebSocket
          if (resolvedRoomId) {
            const token = localStorage.getItem('authToken') || authTokenRef.current || '';
            closeWebSocketSafely(ws);
            const roomWs = new WebSocket(
              `${WORKER_WS_URL}/ws/room/${encodeURIComponent(resolvedRoomId)}?token=${encodeURIComponent(token)}`
            );
            socketRef.current = roomWs;
            attachOnlineSocketListeners(roomWs);
          }
          break;
        }

        case 'opponent_draft_locked': {
          if (!data?.ballId) return;
          setOpponentDraftLocked(true);
          if (data.playerSide === 'p1') {
            setP1BallType(data.ballId);
          } else {
            setP2BallType(data.ballId);
          }
          break;
        }

        case 'enter_launch_phase': {
          setIsDraftLockedWaiting(false);
          setOpponentDraftLocked(false);
          setIsMatchmakingSearching(false);
          setIsWaitingForFriend(false);
          setRoundOverBanner(false);

          if (data?.hearts) {
            if (typeof data.hearts.p1 === 'number') setP1Hearts(data.hearts.p1);
            if (typeof data.hearts.p2 === 'number') setP2Hearts(data.hearts.p2);
          }
          if (data?.p1Character) setP1BallType(data.p1Character);
          if (data?.p2Character) setP2BallType(data.p2Character);
          if (data?.p1Username || data?.p1Info?.name) {
            setP1Name(data.p1Username || data.p1Info?.name || 'Player 1');
          }
          if (data?.p2Username || data?.p2Info?.name) {
            setP2Name(data.p2Username || data.p2Info?.name || 'Player 2');
          }
          if (data?.arena) {
            currentArena = data.arena;
            setSelectedArenaChoice(data.arena);
            if (typeof window !== 'undefined') {
              (window as any).currentArena = currentArena;
            }
          }
          if (typeof data?.startingHealth === 'number') {
            setStartingHealth(data.startingHealth);
            setP1Hp(data.startingHealth);
            setP2Hp(data.startingHealth);
          }

          resetArenaForNewRound(
            data?.p1Character || p1BallType,
            data?.p2Character || p2BallType
          );

          setIsEscalated(false);
          setRoundSeconds(0);
          setSuddenDeathOverlay(false);
          setSuddenDeathCountdown(30);
          setP1AbilityProgress(1);
          setP2AbilityProgress(1);
          setP1DashRemaining(0);
          setP2DashRemaining(0);
          setIsChangingBalls(false);
          hitstopTimer = 0;
          impactFrameTimer = 0;
          setRoundOverlay(null);
          setMatchPhase('launch');
          setP1AimLocked(false);
          setP2AimLocked(false);
          setIsOnlineMode(true);
          setPlayAgainstBot(false);
          setOnlineStatus('matched');
          setRoundKey((prev) => prev + 1);
          setGameState('launch');
          break;
        }

        case 'fighter_updated': {
          if (data?.arena) {
            currentArena = data.arena;
            setSelectedArenaChoice(data.arena);
            if (typeof window !== 'undefined') {
              (window as any).currentArena = currentArena;
            }
          }
          if (typeof data?.startingHealth === 'number') {
            setStartingHealth(data.startingHealth);
            setP1Hp(data.startingHealth);
            setP2Hp(data.startingHealth);
          }
          if (data?.p1Info) {
            setP1Name(data.p1Info.name || 'Player 1');
            setP1BallType(data.p1Info.ballType || 'quadblade');
          }
          if (data?.p2Info) {
            setP2Name(data.p2Info.name || 'Player 2');
            setP2BallType(data.p2Info.ballType || 'blackhole');
          }
          break;
        }

        case 'lobby_error': {
          const errorText = typeof data === 'string' ? data : data?.message || 'Unable to join lobby';
          setLobbyError(errorText);
          setIsWaitingForFriend(false);
          break;
        }

        case 'lobby_created': {
          setLobbyError(null);
          setIsWaitingForFriend(true);
          if (data?.roomId) {
            setOnlineRoomId(data.roomId);
          }
          break;
        }

        case 'opponent_launch_locked': {
          pendingOpponentLockRef.current = data;
          break;
        }

        case 'start_round': {
          if (data?.hearts) {
            if (typeof data.hearts.p1 === 'number') setP1Hearts(data.hearts.p1);
            if (typeof data.hearts.p2 === 'number') setP2Hearts(data.hearts.p2);
          }
          authoritativeLocalTargetRef.current = null;
          remoteOpponentTargetRef.current = null;
          pendingStartRoundRef.current = data;
          break;
        }

        case 'game_state': {
          // 30Hz authoritative broadcast from GameRoomDO
          const isP2 = onlineRoleRef.current === 'Player 2';
          const localSnap = isP2 ? data?.p2 : data?.p1;
          const oppSnap = isP2 ? data?.p1 : data?.p2;
          const nowPerf = performance.now();

          if (localSnap) {
            const localBall = isP2 ? p2BallRef.current : p1BallRef.current;
            if (localBall) {
              localBall.targetX = localSnap.x;
              localBall.targetY = localSnap.y;
              localBall.targetVx = localSnap.vx;
              localBall.targetVy = localSnap.vy;
            }
            authoritativeLocalTargetRef.current = {
              x: localSnap.x,
              y: localSnap.y,
              vx: localSnap.vx,
              vy: localSnap.vy,
              health: localSnap.health,
              isDead: localSnap.isDead,
              receivedAt: nowPerf,
            };
          }

          if (oppSnap) {
            const opponent = isP2 ? p1BallRef.current : p2BallRef.current;
            if (opponent) {
              opponent.targetX = oppSnap.x;
              opponent.targetY = oppSnap.y;
              opponent.targetVx = oppSnap.vx;
              opponent.targetVy = oppSnap.vy;
            }
            remoteOpponentTargetRef.current = {
              ...oppSnap,
              receivedAt: nowPerf,
            };
          }
          break;
        }

        case 'opponent_state': {
          if (!data) break;
          const opponent =
            onlineRoleRef.current === 'Player 2' ? p1BallRef.current : p2BallRef.current;
          if (opponent) {
            opponent.targetX = data.x;
            opponent.targetY = data.y;
            opponent.targetVx = data.vx;
            opponent.targetVy = data.vy;
          }
          remoteOpponentTargetRef.current = {
            ...data,
            receivedAt: performance.now(),
          };
          break;
        }

        case 'opponent_rematch_ready': {
          setOpponentRematchReady(true);
          break;
        }

        case 'rematch_started': {
          setOnlineRematchRequested(false);
          setOpponentRematchReady(false);
          setP1Hearts(3);
          setP2Hearts(3);
          setRoundOverBanner(false);
          if (resetRoundRef.current) {
            resetRoundRef.current();
          }
          break;
        }

        case 'start_new_draft': {
          if (data?.hearts) {
            if (typeof data.hearts.p1 === 'number') setP1Hearts(data.hearts.p1);
            if (typeof data.hearts.p2 === 'number') setP2Hearts(data.hearts.p2);
          }
          if (data?.winnerSide === 'p1') {
            setP1Score((prev) => prev + 1);
          } else if (data?.winnerSide === 'p2') {
            setP2Score((prev) => prev + 1);
          }
          setRoundOverBanner(false);
          setRoundOverlay(null);
          setP2Drafting(null);
          setP1Locked(false);
          setP2Locked(false);
          setIsDraftLockedWaiting(false);
          setOpponentDraftLocked(false);
          setIsChangingBalls(true);
          if (data?.hearts) {
            setMatchStatus(
              `ROUND ${data.roundNumber ?? ''} DRAFT · HEARTS P1: ${data.hearts.p1} ❤️ | P2: ${data.hearts.p2} ❤️`
            );
          }
          const nextOnlineDraft = generateDraft();
          setP1Drafting(nextOnlineDraft[0]?.id ?? null);
          setGameState('draft');
          break;
        }

        case 'match_over': {
          if (data?.hearts) {
            if (typeof data.hearts.p1 === 'number') setP1Hearts(data.hearts.p1);
            if (typeof data.hearts.p2 === 'number') setP2Hearts(data.hearts.p2);
          }
          setRoundOverBanner(false);
          const champ = data?.winnerUsername || data?.winnerRole || 'Winner';
          setMatchStatus(`MATCH OVER · ${String(champ).toUpperCase()} WINS THE SERIES!`);
          if (triggerFinalVictoryRef.current) {
            triggerFinalVictoryRef.current(
              data?.winnerSide ||
                (data?.winnerRole === 'Player 1' ? 'p1' : 'p2')
            );
          }
          break;
        }

        case 'opponent_chat': {
          const oppSender = onlineRoleRef.current === 'Player 1' ? 'P2' : 'P1';
          handleSendChatMessage(oppSender, data?.text || '', true);
          break;
        }

        case 'opponent_ping': {
          if (isOpponentMutedRef.current || !data) return;
          spawnTacticalPingMarker(
            data.x,
            data.y,
            data.sector || 'ARENA',
            data.color || '#f97316',
            data.senderName || 'Opponent',
            false
          );
          break;
        }

        case 'opponent_emote': {
          if (!data) break;
          const oppTarget: 'P1' | 'P2' =
            data.senderRole === 'Player 1'
              ? 'P1'
              : data.senderRole === 'Player 2'
              ? 'P2'
              : onlineRoleRef.current === 'Player 1'
              ? 'P2'
              : 'P1';
          triggerEmote(data.emoteId, oppTarget, true);
          break;
        }

        case 'wallet_updated': {
          if (typeof data === 'number') {
            setCoins(data);
          }
          break;
        }

        case 'unlocked_balls_updated': {
          if (Array.isArray(data)) {
            setUnlockedBalls(data);
          }
          break;
        }

        case 'purchase_error': {
          setPurchaseErrorMsg(data?.error || 'Insufficient coins.');
          audioController.synthesizeEnvelope('sawtooth', 180, 95, 0.25, 0.32);
          break;
        }

        case 'opponent_disconnected': {
          setOnlineOpponentDisconnected(true);
          setMatchStatus('OPPONENT FLED - FORFEIT VICTORY!');
          if (gameStateRef.current === 'PLAYING' && triggerForfeitVictoryRef.current) {
            triggerForfeitVictoryRef.current();
          }
          break;
        }
      }
    };

    ws.onclose = () => {
      if (socketRef.current === ws && isOnlineModeRef.current) {
        setOnlineStatus('disconnected');
      }
    };
  };

  const handleSubmitCustomLobby = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedRoom = customRoomId.trim();
    if (!trimmedRoom) {
      setLobbyError('Please enter a Room ID');
      return;
    }

    audioController.initOnStartMatch();
    setLobbyError(null);

    const token = await ensureAuthToken();
    const localDisplayName = (username.trim() || p1Name.trim() || 'Fighter').slice(0, 12);
    const chosenBallType = p1Drafting || p1BallType;

    let ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      disconnectOnlineSocket();
      const wsUrl = `${WORKER_WS_URL}/ws/matchmaker?token=${encodeURIComponent(token)}&username=${encodeURIComponent(localDisplayName)}&ballType=${encodeURIComponent(chosenBallType)}&arena=${encodeURIComponent(selectedArenaChoice || 'Default')}&startingHealth=${startingHealth}&customLobby=true`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      attachOnlineSocketListeners(ws, { isCustomLobby: true });
    }

    const emitLobbyAction = () => {
      if (joinMethod === 'create') {
        sendWsEvent(ws, 'create_custom_lobby', {
          roomId: trimmedRoom,
          password: customPassword,
          username: localDisplayName,
          name: localDisplayName,
          ballType: chosenBallType,
          arena: selectedArenaChoice || 'Default',
          startingHealth,
        });
      } else if (joinMethod === 'join') {
        sendWsEvent(ws, 'join_custom_lobby', {
          roomId: trimmedRoom,
          password: customPassword,
          username: localDisplayName,
          name: localDisplayName,
          ballType: chosenBallType,
        });
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      emitLobbyAction();
    } else {
      ws.onopen = emitLobbyAction;
    }
  };

  const handleStartOnlineMatch = async () => {
    const chosenBallType = p1Drafting || p1BallType;
    if (onlineRole === 'Player 2') {
      setP2BallType(chosenBallType);
    } else {
      setP1BallType(chosenBallType);
    }

    const arenaSelectElem = document.getElementById('arena-select') as HTMLSelectElement | null;
    const chosenArena = (arenaSelectElem && arenaSelectElem.value) || selectedArenaChoice || 'Default';
    currentArena = chosenArena;
    setSelectedArenaChoice(chosenArena);
    if (typeof window !== 'undefined') {
      (window as any).currentArena = currentArena;
    }

    // If already matched and waiting in draft lock
    if (socketRef.current?.readyState === WebSocket.OPEN && onlineStatus === 'matched' && onlineRoomId) {
      audioController.initOnStartMatch();
      playSound('hit');
      const playerSide = onlineRole === 'Player 2' ? 'p2' : 'p1';
      const localDisplayName = (username.trim() || p1Name.trim() || 'Fighter').slice(0, 12);
      sendWsEvent(socketRef.current, 'lock_draft', {
        roomId: onlineRoomId,
        playerSide,
        ballId: chosenBallType,
        username: localDisplayName,
        name: localDisplayName,
        arena: chosenArena,
        startingHealth,
      });
      setMatchStatus('DRAFT LOCKED · WAITING FOR OPPONENT...');
      return;
    }

    const token = await ensureAuthToken();
    disconnectOnlineSocket();

    // Reset round states
    if (finisherTimeoutId !== null) { clearTimeout(finisherTimeoutId); finisherTimeoutId = null; }
    if (roundTimeoutRef.current) { clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
    if (suddenDeathTimerRef.current) { clearTimeout(suddenDeathTimerRef.current); suddenDeathTimerRef.current = null; }

    audioController.initOnStartMatch();
    playSound('start');
    setIsEscalated(false);
    setRoundSeconds(0);
    setSuddenDeathOverlay(false);
    setSuddenDeathCountdown(30);
    setP1AbilityProgress(1);
    setP2AbilityProgress(1);
    setP1DashRemaining(0);
    setP2DashRemaining(0);
    setIsChangingBalls(false);
    hitstopTimer = 0;
    impactFrameTimer = 0;
    setRoundOverlay(null);
    setMatchPhase('launch');
    setP1AimLocked(false);
    setP2AimLocked(false);
    setIsOnlineMode(true);
    setPlayAgainstBot(false);
    setOnlineStatus('connecting');
    setMatchStatus('CONNECTING TO CLOUDFLARE EDGE...');
    setIsMatchStarted(true);
    navigationManager.navigateTo('game-screen');

    const localDisplayName = (username.trim() || p1Name.trim() || 'Fighter').slice(0, 12);

    // Connect to the Cloudflare Matchmaker Durable Object via WebSocket
    const wsUrl = `${WORKER_WS_URL}/ws/matchmaker?token=${encodeURIComponent(token)}&username=${encodeURIComponent(localDisplayName)}&ballType=${encodeURIComponent(chosenBallType)}&arena=${encodeURIComponent(chosenArena)}&startingHealth=${startingHealth}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setOnlineStatus((prev) => (prev === 'matched' ? 'matched' : 'waiting'));
      setMatchStatus('IN QUEUE · WAITING FOR OPPONENT...');
    };

    attachOnlineSocketListeners(ws, {
      isCustomLobby: false,
      initialBallType: chosenBallType,
      initialName: localDisplayName,
      initialArena: chosenArena,
    });
  };

  // 'Next Round': instantly resets the positions and starts the launch phase with the same balls
  const handleNextRound = () => {
    audioController.initOnStartMatch();
    if (isOnlineMode) {
      setOnlineRematchRequested(true);
      sendWsEvent(socketRef.current, 'request_rematch');
      return;
    }
    setRoundOverlay(null);
    setIsChangingBalls(false);
    const overlayEl = document.getElementById('post-round-overlay');
    if (overlayEl) {
      overlayEl.classList.remove('view-active');
      overlayEl.classList.add('view-hidden');
    }
    navigationManager.navigateTo('game-screen');
    if (resetRoundRef.current) {
      resetRoundRef.current();
    }
  };

  // 'Change Balls': smoothly transitions back to DraftScreen while keeping the current score intact
  const handleChangeBalls = () => {
    setRoundOverlay(null);
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
    setIsDraftLockedWaiting(false);
    setOpponentDraftLocked(false);
    setIsChangingBalls(true);
    generateDraft();
    setGameState('draft');
  };

  const handleConfirmNewBalls = () => {
    audioController.initOnStartMatch();
    playSound('start');
    setRoundOverBanner(false);
    resetArenaForNewRound(p1BallType, p2BallType);
    setIsChangingBalls(false);
    setRoundOverlay(null);
    setRoundKey((prev) => prev + 1);
    setGameState('launch');
  };

  const handleCancelChangeBalls = () => {
    setIsChangingBalls(false);
    setRoundOverBanner(false);
    setGameState('launch');
    if (resetRoundRef.current) {
      resetRoundRef.current();
    }
  };

  // 'Quit to Menu': completely resets the scores and returns to #main-menu
  const handleQuitToMenu = () => {
    disconnectOnlineSocket();
    setIsOnlineMode(false);
    setIsMatchmakingSearching(false);
    setIsWaitingForFriend(false);
    setIsDraftLockedWaiting(false);
    setOpponentDraftLocked(false);
    setRoundOverBanner(false);
    setP1Hearts(3);
    setP2Hearts(3);
    setJoinMethod('menu');
    setLobbyError(null);
    if (finisherTimeoutId !== null) {
      clearTimeout(finisherTimeoutId);
      finisherTimeoutId = null;
    }
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
      roundTimeoutRef.current = null;
    }
    if (suddenDeathTimerRef.current) {
      clearTimeout(suddenDeathTimerRef.current);
      suddenDeathTimerRef.current = null;
    }
    setP1Score(0);
    setP2Score(0);
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
    setIsChangingBalls(false);
    setRoundOverlay(null);
    setMatchPhase('lobby');
    setP1AimLocked(false);
    setP2AimLocked(false);
    setIsEscalated(false);
    setRoundSeconds(0);
    setSuddenDeathOverlay(false);
    setSuddenDeathCountdown(30);
    setP1AbilityProgress(1);
    setP2AbilityProgress(1);
    setP1DashRemaining(0);
    setP2DashRemaining(0);
    setMatchStatus('WAITING IN LOBBY');
    setGameState('menu');
  };

  const handleReturnToLobby = () => {
    handleQuitToMenu();
  };

  // Main Menu Navigation Actions:
  // Main Menu -> Matchmaking Spinner -> (WebSocket receives match_found) -> Draft Screen -> (WebSocket receives enter_launch_phase) -> Canvas Gameplay
  const handleOpenOnlineMultiplayer = async () => {
    audioController.initOnStartMatch();
    disconnectOnlineSocket();
    setIsOnlineMode(true);
    setPlayAgainstBot(false);
    setLobbyError(null);
    setIsWaitingForFriend(false);
    setIsDraftLockedWaiting(false);
    setRoundOverBanner(false);
    setP1Hearts(3);
    setP2Hearts(3);
    setIsMatchmakingSearching(true);
    setOnlineStatus('connecting');
    setMatchStatus('SEARCHING FOR OPPONENT...');

    const token = await ensureAuthToken();
    const resolvedName = (username.trim() || (p1Name === 'Player 1' || !p1Name.trim() ? 'Fighter' : p1Name.trim())).slice(0, 12);
    setP1Name(resolvedName);
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
    setIsChangingBalls(false);

    const chosenArena = selectedArenaChoice || 'Default';
    const wsUrl = `${WORKER_WS_URL}/ws/matchmaker?token=${encodeURIComponent(token)}&username=${encodeURIComponent(resolvedName)}&ballType=${encodeURIComponent(p1BallType)}&arena=${encodeURIComponent(chosenArena)}&startingHealth=${startingHealth}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setOnlineStatus((prev) => (prev === 'matched' ? 'matched' : 'waiting'));
      setMatchStatus('IN QUEUE · WAITING FOR OPPONENT...');
    };

    attachOnlineSocketListeners(ws, {
      isCustomLobby: false,
      initialName: resolvedName,
      initialArena: chosenArena,
    });
  };

  const handleOpenLocalMultiplayer = () => {
    audioController.initOnStartMatch();
    disconnectOnlineSocket();
    setIsOnlineMode(false);
    setPlayAgainstBot(false);
    setIsMatchmakingSearching(false);
    setIsDraftLockedWaiting(false);
    setRoundOverBanner(false);
    setP1Hearts(3);
    setP2Hearts(3);
    if (p2Name === 'Bot Alpha' || !p2Name.trim()) {
      setP2Name('Player 2');
    }
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
    setIsChangingBalls(false);
    generateDraft();
    setGameState('draft');
  };

  const handleOpenVsBot = () => {
    audioController.initOnStartMatch();
    disconnectOnlineSocket();
    setIsOnlineMode(false);
    setPlayAgainstBot(true);
    setIsMatchmakingSearching(false);
    setIsDraftLockedWaiting(false);
    setRoundOverBanner(false);
    setP1Hearts(3);
    setP2Hearts(3);
    if (p2Name === 'Player 2' || !p2Name.trim()) {
      setP2Name('Bot Alpha');
    }
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
    setIsChangingBalls(false);
    generateDraft();
    setGameState('draft');
  };

  const handleOpenCharacterLibrary = () => {
    setSelectedLibraryChar(null);
    setIsLibraryOpen(true);
    navigationManager.navigateTo('library-screen');
  };

  // Coin Re-roll Mechanic (Cost: 25 Coins — verified & deducted on the server, synced via wallet_updated)
  const handleRerollDraft = () => {
    if (isDraftLockedWaiting) return;
    audioController.initOnStartMatch();

    const triggerInsufficientFlash = () => {
      setRerollErrorFlash(true);
      if (rerollFlashTimeoutRef.current !== null) {
        window.clearTimeout(rerollFlashTimeoutRef.current);
      }
      rerollFlashTimeoutRef.current = window.setTimeout(() => {
        setRerollErrorFlash(false);
      }, 650);
      audioController.synthesizeEnvelope('sawtooth', 180, 95, 0.25, 0.32);
    };

    if (coins < 25) {
      triggerInsufficientFlash();
      return;
    }

    const activeSocket =
      socketRef.current && socketRef.current.readyState === WebSocket.OPEN
        ? socketRef.current
        : walletSocketRef.current;

    if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
      const reqId = `reroll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      pendingWsCallbacksRef.current.set(reqId, (res: { ok?: boolean; error?: string }) => {
        if (res?.error) {
          triggerInsufficientFlash();
        } else {
          playSound('hit');
          const refreshed3 = generateDraft();
          if (isOnlineMode) {
            setP1Drafting(refreshed3[0]?.id ?? null);
          }
        }
      });
      sendWsEvent(activeSocket, 'reroll_draft', {}, reqId);
    } else {
      triggerInsufficientFlash();
    }
  };

  const emitDraftSocketEvent = useCallback((type: string, payload?: unknown) => {
    return sendWsEvent(socketRef.current, type, payload);
  }, []);

  const handleDraftSelectPreview = useCallback((side: 'p1' | 'p2', ballId: string) => {
    audioController.initOnStartMatch();
    playSound('hit');
    if (side === 'p1') {
      setP1Drafting(ballId as BallTypeId);
    } else {
      setP2Drafting(ballId as BallTypeId);
    }
  }, [playSound]);

  const handleLocalLockPlayer = useCallback(
    (side: 'p1' | 'p2', ballId: string) => {
      audioController.initOnStartMatch();
      playSound('hit');
      const chosenId = ballId as BallTypeId;
      if (side === 'p1') {
        setP1Drafting(chosenId);
        setP1Locked(true);
        setP1BallType(chosenId);
        if (playAgainstBot) {
          const botPool = BALL_TYPES.filter((b) => b.id !== 'capedbaldy');
          const randomBotCard = botPool[Math.floor(Math.random() * botPool.length)];
          setP2Drafting(randomBotCard.id);
          setP2Locked(true);
          setP2BallType(randomBotCard.id);
        }
      } else {
        setP2Drafting(chosenId);
        setP2Locked(true);
        setP2BallType(chosenId);
      }
    },
    [playAgainstBot, playSound]
  );

  const handleResetLocalDraft = useCallback(() => {
    setP1Drafting(null);
    setP2Drafting(null);
    setP1Locked(false);
    setP2Locked(false);
  }, []);

  const handleOnlineLockStarted = useCallback(
    (ballId: string) => {
      audioController.initOnStartMatch();
      playSound('hit');
      const chosenId = ballId as BallTypeId;
      setP1Drafting(chosenId);
      setP1Locked(true);
      setIsDraftLockedWaiting(true);
      if (onlineRole === 'Player 2') {
        setP2BallType(chosenId);
      } else {
        setP1BallType(chosenId);
      }
      currentArena = selectedArenaChoice || 'Default';
      if (typeof window !== 'undefined') {
        (window as any).currentArena = currentArena;
      }
      setMatchStatus('DRAFT LOCKED · WAITING FOR OPPONENT...');
    },
    [onlineRole, playSound, selectedArenaChoice]
  );

  // Library / Roster Card Click Handler
  const handleSelectCharacterCard = (ballId: BallTypeId) => {
    audioController.initOnStartMatch();
    if (!p1Locked) {
      setP1Drafting(ballId);
      playSound('hit');
    } else if (!p2Locked) {
      setP2Drafting(ballId);
      playSound('hit');
    }
  };

  // Loops through the character array (BALL_TYPES) and generates a div card for each ball inside .roster-grid
  const renderCharacterCards = (mode: 'select' | 'library' = 'select') => {
    const isP2TurnHover = mode === 'select' && p1Locked && !p2Locked;
    return BALL_TYPES.map((b) => {
      const meta = BALL_VISUAL_META[b.id];
      const isP1 = mode === 'select' && p1Drafting === b.id;
      const isP2 = mode === 'select' && p2Drafting === b.id;
      const isLibraryActive = mode === 'library' && selectedLibraryChar === b.id;

      let stateClasses = '';
      let inlineBorderStyle: React.CSSProperties = {};

      if (mode === 'select') {
        if (isP1 && isP2) {
          stateClasses = 'bg-purple-950/55 shadow-[0_0_20px_rgba(168,85,247,0.55)] ring-2 ring-purple-400/60';
          inlineBorderStyle = { borderColor: '#a855f7' };
        } else if (isP1) {
          stateClasses = `bg-sky-950/55 shadow-[0_0_20px_rgba(56,189,248,0.6)] ring-2 ring-sky-400/60 ${
            p1Locked ? 'ring-sky-400' : ''
          }`;
          inlineBorderStyle = { borderColor: '#38bdf8' };
        } else if (isP2) {
          stateClasses = `bg-orange-950/55 shadow-[0_0_20px_rgba(249,115,22,0.6)] ring-2 ring-orange-400/60 ${
            p2Locked ? 'ring-orange-400' : ''
          }`;
          inlineBorderStyle = { borderColor: '#f97316' };
        }
      } else if (isLibraryActive) {
        stateClasses = 'bg-sky-950/55 shadow-[0_0_18px_rgba(56,189,248,0.5)] ring-2 ring-sky-400/50';
        inlineBorderStyle = { borderColor: '#38bdf8' };
      }

      return (
        <div
          key={b.id}
          onClick={() => {
            if (mode === 'library') {
              setSelectedLibraryChar(b.id);
            } else {
              handleSelectCharacterCard(b.id);
            }
          }}
          title={`${b.name} — ${b.badge}`}
          style={inlineBorderStyle}
          className={`character-card ${isP2TurnHover ? 'p2-hover' : ''} relative rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer select-none ${stateClasses}`}
        >
          {/* Active Player Markers */}
          {mode === 'select' && isP1 && (
            <span className="absolute top-1 left-1.5 text-[9px] font-black uppercase text-sky-300 leading-tight drop-shadow">
              {p1Locked ? 'P1 ✓' : 'P1'}
            </span>
          )}
          {mode === 'select' && isP2 && (
            <span className="absolute top-1 right-1.5 text-[9px] font-black uppercase text-orange-300 leading-tight drop-shadow">
              {p2Locked ? 'P2 ✓' : 'P2'}
            </span>
          )}

          {/* CSS circle matching the ball's color with the emoji centered */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md border border-white/25 shrink-0"
            style={{ backgroundColor: meta.color }}
          >
            <span className="leading-none select-none">{meta.emoji}</span>
          </div>

          {/* Character's short name directly underneath the circle */}
          <span className="font-bold text-xs text-white text-center mt-1.5 leading-tight truncate max-w-full">
            {b.name}
          </span>
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white"
    >
      {/* Top Header */}
      <header className="w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="fighting-header text-xl md:text-2xl tracking-wider text-white whitespace-nowrap shrink-0">
              BALL VS BALL ONLINE
            </h1>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
              {isOnlineMode
                ? `Online Matchmaking${onlineRoomId ? ` · ${onlineRoomId} (${onlineRole})` : ''}`
                : playAgainstBot
                ? 'vs Bot'
                : 'Local Multiplayer'}{' '}
              · 67 Fighters
            </span>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFairPlayModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 transition text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
              title="Fair Play Rules, Anti-Macro Protection & Patch Transparency"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fair Play &amp; Patch Notes</span>
            </button>

            {activeScreen !== 'main-menu' && activeScreen !== 'splash-screen' && (
              <button
                onClick={handleReturnToLobby}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 border border-white/10 transition text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                title="Return to Main Menu"
              >
                <Settings2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Main Menu</span>
              </button>
            )}

            <button
              onClick={handleToggleSound}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/10 transition cursor-pointer"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/10 transition hidden sm:inline-flex cursor-pointer"
              title="Toggle Fullscreen"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Persistent Glowing Coin Counter in Top-Right Corner of React UI */}
            <div
              id="hud-coin-counter"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 border-2 font-mono font-black text-xs sm:text-sm tracking-wider select-none shrink-0"
              style={{
                color: '#facc15',
                borderColor: '#facc15',
                boxShadow: '0 0 18px rgba(250, 204, 21, 0.45), inset 0 0 10px rgba(250, 204, 21, 0.2)',
                textShadow: '0 0 10px rgba(250, 204, 21, 0.65)',
              }}
              title="Persistent Coin Balance (+50 Coins for a Win · +10 Coins for a Loss)"
              aria-label={`Coins: ${coins}`}
            >
              <Coins
                className="w-4 h-4 shrink-0"
                style={{
                  color: '#facc15',
                  filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.85))',
                }}
              />
              <span className="tabular-nums">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* FAIR PLAY, ANTI-CHEAT & TRANSPARENCY MODAL */}
      {isFairPlayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="fighting-glass-panel w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="fighting-header text-xl sm:text-2xl text-white">
                    FAIR PLAY SHIELD &amp; DEVELOPER TRANSPARENCY
                  </h2>
                  <p className="text-xs text-slate-400">
                    Open competitive integrity rules, zero false-positive bans &amp; anti-toxicity safeguards
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFairPlayModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30 space-y-1.5">
                <span className="text-sky-400 font-black uppercase tracking-wider block">
                  1. 120Hz Swept Hit Detection &amp; Adaptive Hitboxes
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Eliminates ghost hits and rigid hitbox misses via 4-step continuous swept collision interpolation and velocity-adaptive hitbox expansion (+0–11px based on ball speed).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-1.5">
                <span className="text-amber-400 font-black uppercase tracking-wider block">
                  2. Anti-Auto-Parry Validation (Press Q / P)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Timed Parries reflect 55% collision damage and deflect projectiles. Deterministic cadence checks block inhuman spam (&lt;145ms) or fixed-interval auto-parry macros with a 2.8s shield lockout.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/30 space-y-1.5">
                <span className="text-purple-400 font-black uppercase tracking-wider block">
                  3. Dynamic Arena Mutators &amp; Zero Cash-Grabs
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Every 10s in battle, live Arena Mutators (Overdrive Walls, Singularity Vortex, Orbital Meteors, Bloodlust Surge) evolve the match alongside hit-based scaling. All 67 classes are 100% free.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-1.5">
                <span className="text-emerald-400 font-black uppercase tracking-wider block">
                  4. Zero False-Positive Bans &amp; Safe Chat
                </span>
                <p className="text-slate-300 leading-relaxed">
                  We never issue opaque automated account bans for lag spikes or rapid clicking—macro detection only triggers a transparent 2.8s in-round parry cooldown. Includes 1-click Opponent Mute &amp; Auto-Toxicity Chat Filter.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN VIEW CONTAINERS MANAGED BY NavigationManager */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
        {/* 0. THE AUTH SCREEN: Glassmorphism Authentication Overlay before rendering Main Menu */}
        {!isLoggedIn && (
          <div
            id="auth-overlay"
            className="fighting-backdrop fixed inset-0 top-[56px] w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-4 sm:p-6 z-50 bg-slate-950/85 backdrop-blur-xl"
          >
            <div className="fighting-glass-panel w-full max-w-lg rounded-2xl p-7 sm:p-10 border border-sky-400/35 shadow-[0_0_60px_rgba(14,165,233,0.22)] flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-400/50 flex items-center justify-center shadow-[0_0_32px_rgba(56,189,248,0.35)]">
                <Zap className="w-8 h-8 text-sky-400" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
                  Secure Arena Account &amp; Economy
                </p>
                <h2 className="fighting-header text-3xl sm:text-5xl text-white">
                  BALL VS BALL
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Sign in, create an account, or jump right into the arena as a guest. Your coins and unlocked fighters sync securely with the server.
                </p>
              </div>

              {/* Three Primary Authentication Buttons: 'Login', 'Create Account', 'Play as Guest' */}
              <div className="w-full flex flex-col gap-3">
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => {
                    setAuthError(null);
                    if (authScreenTab === 'login' && authFormUsername.trim() && authFormPassword) {
                      void handleAuthOverlaySubmit('login');
                    } else {
                      setAuthScreenTab('login');
                    }
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                    authScreenTab === 'login'
                      ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.6)]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-400/45 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => {
                    setAuthError(null);
                    if (authScreenTab === 'register' && authFormUsername.trim() && authFormPassword) {
                      void handleAuthOverlaySubmit('register');
                    } else {
                      setAuthScreenTab('register');
                    }
                  }}
                  className={`w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                    authScreenTab === 'register'
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-400/45 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account</span>
                </button>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handlePlayAsGuest}
                  className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.45)] hover:shadow-[0_0_40px_rgba(250,204,21,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Play as Guest</span>
                </button>

                <div className="w-full flex items-center gap-3 my-1">
                  <div className="h-px flex-1 bg-white/15" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    or
                  </span>
                  <div className="h-px flex-1 bg-white/15" />
                </div>

                <GoogleLoginButton
                  label="signin_with"
                  disabled={authLoading}
                  onCredential={handleGoogleAuthCredential}
                  onConfigOrNetworkError={(msg) => setAuthError(msg)}
                />
              </div>

              {/* Credentials Form for Login or Create Account */}
              {authScreenTab && (
                <form
                  onSubmit={(e) => void handleAuthOverlaySubmit(authScreenTab, e)}
                  className="w-full p-4 rounded-xl bg-slate-950/90 border border-sky-500/40 flex flex-col gap-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-300">
                      {authScreenTab === 'login' ? 'Account Login' : 'Create New Account'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthScreenTab(null);
                        setAuthError(null);
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    value={authFormUsername}
                    onChange={(e) => setAuthFormUsername(e.target.value)}
                    placeholder="Username (2-12 chars)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-sky-400"
                  />
                  <input
                    type="password"
                    required
                    value={authFormPassword}
                    onChange={(e) => setAuthFormPassword(e.target.value)}
                    placeholder="Password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-sky-400"
                  />
                  {authError && (
                    <p className="text-xs font-bold text-rose-400">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {authLoading
                      ? 'Authenticating...'
                      : authScreenTab === 'login'
                      ? 'Confirm Login'
                      : 'Confirm Create Account'}
                  </button>
                </form>
              )}

              {!authScreenTab && authError && (
                <p className="text-xs font-bold text-rose-400">{authError}</p>
              )}
            </div>
          </div>
        )}

        {/* 1. #splash-screen: Dark screen with game title that shows for 2 seconds on load, then fades out */}
        <div
          id="splash-screen"
          onClick={() => navigationManager.navigateTo('main-menu')}
          className={`fighting-backdrop inset-0 w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-6 z-40 select-none ${
            isLoggedIn && activeScreen === 'splash-screen' ? 'view-active' : 'view-hidden'
          }`}
        >
          <div className="flex flex-col items-center text-center gap-5 max-w-xl">
            <div className="w-20 h-20 rounded-full bg-sky-500/15 border-2 border-sky-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.4)] animate-pulse">
              <Zap className="w-10 h-10 text-sky-400" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-sky-400 font-bold block">
                HIGH-VELOCITY ARENA AUTOBATTLER
              </span>
              <h1 className="fighting-header text-5xl sm:text-7xl text-white">
                BALL VS BALL
              </h1>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-sky-400 to-orange-400 animate-pulse w-full" />
            </div>
          </div>
        </div>

        {/* 2. #main-menu: Fighting-game Glassmorphism hub (revealed when isLoggedIn === true) */}
        <div
          id="main-menu"
          className={`fighting-backdrop inset-0 w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-4 sm:p-6 z-30 ${
            isLoggedIn && activeScreen === 'main-menu' ? 'view-active' : 'view-hidden'
          }`}
        >
          <div className="fighting-glass-panel w-full max-w-xl rounded-2xl p-7 sm:p-10 flex flex-col items-center text-center gap-7">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
                Arena Combat Circuit · 67 Fighters
              </p>
              <h2 className="fighting-header text-4xl sm:text-5xl text-white">
                BALL VS BALL
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Choose your duel format or inspect every fighter&apos;s signature weapon, physics profile, and finisher.
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col items-start gap-2.5 text-left">
              <div className="w-full flex items-center justify-between px-1">
                <label
                  htmlFor="main-menu-username"
                  className="text-[11px] font-black uppercase tracking-widest text-sky-400"
                >
                  Fighter Username (Max 12 Chars)
                </label>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isGuestAccount
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {isGuestAccount ? 'Guest Account' : 'Verified Account'}
                </span>
              </div>
              <input
                id="main-menu-username"
                type="text"
                maxLength={12}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter username..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/85 border border-sky-500/40 text-white font-bold text-sm tracking-wide placeholder:text-slate-500 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all"
              />

              <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-0.5">
                {isGuestAccount ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthFormUsername(username.startsWith('Guest_') ? '' : username);
                      setAuthFormPassword('');
                      setAuthModalMode(authModalMode === 'link' ? null : 'link');
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 transition cursor-pointer"
                  >
                    Link Account (Save Progress)
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    Progress synced to database ({coins} Coins)
                  </span>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthScreenTab(null);
                      setIsLoggedIn(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/30 transition cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              </div>

              {authModalMode && (
                <form
                  onSubmit={handleSubmitAuthForm}
                  className="w-full mt-1 p-3.5 rounded-xl bg-slate-950/95 border border-sky-500/40 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-300">
                      {authModalMode === 'login'
                        ? 'Log In to Account'
                        : authModalMode === 'link'
                        ? 'Link Guest Account'
                        : 'Register New Account'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthModalMode(null)}
                      className="text-[11px] text-slate-400 hover:text-white font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    required
                    value={authFormUsername}
                    onChange={(e) => setAuthFormUsername(e.target.value)}
                    placeholder="Username (2-12 chars)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                  />
                  <input
                    type="password"
                    required
                    value={authFormPassword}
                    onChange={(e) => setAuthFormPassword(e.target.value)}
                    placeholder="Password (min 4 chars)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                  />
                  {authError && (
                    <p className="text-[11px] font-bold text-rose-400">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-slate-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {authLoading
                      ? 'Saving...'
                      : authModalMode === 'login'
                      ? 'Log In'
                      : authModalMode === 'link'
                      ? 'Link & Keep Coins'
                      : 'Create Account'}
                  </button>

                  {authModalMode === 'link' && (
                    <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 text-center">
                        Or link with Google to keep your coins
                      </span>
                      <GoogleLoginButton
                        label="continue_with"
                        disabled={authLoading}
                        onCredential={handleGoogleAuthCredential}
                        onConfigOrNetworkError={(msg) => setAuthError(msg)}
                      />
                    </div>
                  )}
                </form>
              )}
            </div>

            {isMatchmakingSearching ? (
              <div className="fighting-glass-panel w-full rounded-2xl p-6 sm:p-8 border border-emerald-500/40 bg-slate-950/90 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-emerald-400/25 border-t-emerald-400 animate-spin shadow-[0_0_25px_rgba(16,185,129,0.45)]" />
                <div className="space-y-1.5">
                  <p className="text-base sm:text-lg font-black uppercase tracking-wider text-emerald-300">
                    Searching for opponent...
                  </p>
                  <p className="text-xs text-slate-300 max-w-sm">
                    Connecting to the live matchmaking queue. The 3-Ball Draft Screen will open automatically as soon as an opponent is found!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnectOnlineSocket();
                    setIsMatchmakingSearching(false);
                    setIsOnlineMode(false);
                  }}
                  className="mt-1 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/15 hover:border-rose-400/60 transition cursor-pointer"
                >
                  Cancel Matchmaking
                </button>
              </div>
            ) : joinMethod === 'menu' ? (
              <div className="w-full flex flex-col gap-3">
                {/* 1. Play Random */}
                <button
                  type="button"
                  onClick={handleOpenOnlineMultiplayer}
                  className="w-full py-4 px-6 rounded-xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 text-slate-950 shadow-[0_0_32px_rgba(16,185,129,0.45)] hover:shadow-[0_0_46px_rgba(16,185,129,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
                >
                  <Globe className="w-5 h-5" />
                  <span className="fighting-header text-lg tracking-wider text-slate-950" style={{ textShadow: 'none' }}>
                    PLAY RANDOM
                  </span>
                </button>

                {/* 2. Create Private Lobby */}
                <button
                  type="button"
                  onClick={() => {
                    audioController.initOnStartMatch();
                    setLobbyError(null);
                    setIsWaitingForFriend(false);
                    setJoinMethod('create');
                  }}
                  className="w-full py-3.5 px-6 rounded-xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 text-slate-950 shadow-[0_0_28px_rgba(168,85,247,0.4)] hover:shadow-[0_0_42px_rgba(168,85,247,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="fighting-header text-lg tracking-wider text-slate-950" style={{ textShadow: 'none' }}>
                    CREATE PRIVATE LOBBY
                  </span>
                </button>

                {/* 3. Join Private Lobby */}
                <button
                  type="button"
                  onClick={() => {
                    audioController.initOnStartMatch();
                    setLobbyError(null);
                    setIsWaitingForFriend(false);
                    setJoinMethod('join');
                  }}
                  className="w-full py-3.5 px-6 rounded-xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 shadow-[0_0_28px_rgba(250,204,21,0.4)] hover:shadow-[0_0_42px_rgba(250,204,21,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-5 h-5" />
                  <span className="fighting-header text-lg tracking-wider text-slate-950" style={{ textShadow: 'none' }}>
                    JOIN PRIVATE LOBBY
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
                  {/* Local Multiplayer */}
                  <button
                    type="button"
                    onClick={handleOpenLocalMultiplayer}
                    className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800 text-sky-300 border border-sky-500/35 hover:border-sky-400 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Local 2P</span>
                  </button>

                  {/* vs Bot */}
                  <button
                    type="button"
                    onClick={handleOpenVsBot}
                    className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800 text-orange-300 border border-orange-500/35 hover:border-orange-400 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Bot className="w-4 h-4 text-orange-400" />
                    <span>vs Bot</span>
                  </button>

                  {/* Character Library */}
                  <button
                    type="button"
                    onClick={handleOpenCharacterLibrary}
                    className="py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/15 hover:border-sky-400/70 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Library</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Custom Lobby Glassmorphism Input Modal ('create' or 'join') */
              <form
                onSubmit={handleSubmitCustomLobby}
                className="fighting-glass-panel w-full rounded-2xl p-5 sm:p-6 border border-sky-500/35 bg-slate-950/80 flex flex-col gap-4 text-left"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-sky-400 font-bold block">
                      {joinMethod === 'create' ? 'HOST CUSTOM ROOM' : 'CONNECT TO FRIEND'}
                    </span>
                    <h3 className="fighting-header text-xl sm:text-2xl text-white">
                      {joinMethod === 'create' ? 'CREATE PRIVATE LOBBY' : 'JOIN PRIVATE LOBBY'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectOnlineSocket();
                      setIsWaitingForFriend(false);
                      setLobbyError(null);
                      setJoinMethod('menu');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/15 cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>

                {isWaitingForFriend ? (
                  <div className="py-6 px-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-11 h-11 rounded-full border-3 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-300">
                        Waiting for friend...
                      </p>
                      <p className="text-xs text-slate-300">
                        Room ID:{' '}
                        <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-white/15">
                          {customRoomId.trim()}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 pt-1">
                        Share this Room ID{customPassword ? ' and password' : ''} with your friend. You will automatically proceed to the Draft Screen as soon as they join!
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="custom-room-id-input"
                        className="block text-[11px] font-mono uppercase tracking-wider text-sky-300 font-bold"
                      >
                        Room ID *
                      </label>
                      <input
                        id="custom-room-id-input"
                        type="text"
                        required
                        maxLength={24}
                        value={customRoomId}
                        onChange={(e) => {
                          setCustomRoomId(e.target.value);
                          if (lobbyError) setLobbyError(null);
                        }}
                        placeholder="e.g. arena-duel-99"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/95 border border-sky-500/40 focus:border-sky-400 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="custom-room-password-input"
                        className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold"
                      >
                        Password <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="custom-room-password-input"
                        type="password"
                        maxLength={32}
                        value={customPassword}
                        onChange={(e) => {
                          setCustomPassword(e.target.value);
                          if (lobbyError) setLobbyError(null);
                        }}
                        placeholder="Leave blank for no password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/95 border border-white/15 focus:border-sky-400 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none shadow-inner"
                      />
                    </div>
                  </>
                )}

                {lobbyError && (
                  <div
                    role="alert"
                    className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold tracking-wide text-center shadow-[0_0_18px_rgba(244,63,94,0.25)]"
                  >
                    ⚠️ {lobbyError}
                  </div>
                )}

                {!isWaitingForFriend && (
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 text-slate-950 shadow-[0_0_28px_rgba(56,189,248,0.45)] hover:shadow-[0_0_38px_rgba(56,189,248,0.75)] transition cursor-pointer"
                  >
                    {joinMethod === 'create' ? 'Submit · Create Lobby' : 'Submit · Join Lobby'}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* 3. #character-select: Dedicated DraftScreen Component replacing the Canvas during the draft phase */}
        <div
          id="character-select"
          className={`inset-0 w-full min-h-[calc(100vh-56px)] ${
            activeScreen === 'character-select' ? 'view-active' : 'view-hidden'
          }`}
        >
          {isDraftPhase && (
            <DraftScreen
              balls={BALL_TYPES}
              visualMeta={BALL_VISUAL_META}
              draftPoolIds={draftOptions.map((d) => d.id)}
              unlockedBalls={unlockedBalls}
              coins={coins}
              isOnlineMode={isOnlineMode}
              playAgainstBot={playAgainstBot}
              onlineRoomId={onlineRoomId || ''}
              onlineRole={onlineRole}
              username={username}
              p1Name={p1Name}
              p2Name={p2Name}
              onChangeP1Name={setP1Name}
              onChangeP2Name={setP2Name}
              p1Hearts={p1Hearts}
              p2Hearts={p2Hearts}
              p1Drafting={p1Drafting}
              p2Drafting={p2Drafting}
              p1Locked={p1Locked}
              p2Locked={p2Locked}
              isDraftLockedWaiting={isDraftLockedWaiting}
              opponentDraftLocked={opponentDraftLocked}
              selectedArenaChoice={selectedArenaChoice}
              onChangeArena={(nextArena) => {
                setSelectedArenaChoice(nextArena);
                currentArena = nextArena;
                if (typeof window !== 'undefined') {
                  (window as any).currentArena = currentArena;
                }
              }}
              startingHealth={startingHealth}
              onChangeStartingHealth={setStartingHealth}
              rerollErrorFlash={rerollErrorFlash}
              onRerollDraft={handleRerollDraft}
              onSelectPreview={handleDraftSelectPreview}
              onLocalLockPlayer={handleLocalLockPlayer}
              onResetLocalDraft={handleResetLocalDraft}
              onEnterArena={() => {
                if (isChangingBalls) {
                  handleConfirmNewBalls();
                } else {
                  handleStartMatch();
                }
              }}
              onOnlineLockStarted={handleOnlineLockStarted}
              emitWsEvent={emitDraftSocketEvent}
              onBack={() => {
                if (isChangingBalls && !isOnlineMode) {
                  handleCancelChangeBalls();
                } else {
                  handleQuitToMenu();
                }
              }}
              onOpenLibrary={handleOpenCharacterLibrary}
            />
          )}
        </div>

        {/* 4. #library-screen: Two-pane Glassmorphism Character Library */}
        <div
          id="library-screen"
          className={`fighting-backdrop inset-0 w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-3 sm:p-6 z-30 ${
            activeScreen === 'library-screen' ? 'view-active' : 'view-hidden'
          }`}
        >
          <div className="fighting-glass-panel w-full max-w-5xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4 my-auto">
            {/* Top Bar with Title & 'Back to Lobby' Button */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="fighting-header text-2xl sm:text-3xl text-white">
                  CHARACTER LIBRARY
                </h2>
                <p className="text-xs text-slate-300">
                  Click any character in the roster to inspect their base stats and abilities.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLibraryOpen(false);
                  if (uiGameState === 'draft') {
                    navigationManager.navigateTo('character-select');
                  } else {
                    setGameState('menu');
                  }
                }}
                className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 hover:border-sky-400 transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                {uiGameState === 'draft' ? 'Back to Draft' : 'Back to Lobby'}
              </button>
            </div>

            {/* Two-Pane Split Layout: Left Pane (The Roster) & Right Pane (The Details) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Left Pane (The Roster): Reuses the exact 5-column .roster-grid */}
              <div className="md:col-span-7 flex flex-col">
                <div className="roster-grid rounded-xl bg-slate-950/55 border border-white/10">
                  {renderCharacterCards('library')}
                </div>
              </div>

              {/* Right Pane (The Details) */}
              <div className="md:col-span-5 rounded-xl bg-slate-950/60 border border-white/10 p-5 flex flex-col justify-center min-h-[320px]">
                {selectedLibraryChar && (() => {
                  const info = BALL_TYPES.find((b) => b.id === selectedLibraryChar);
                  const meta = BALL_VISUAL_META[selectedLibraryChar];
                  if (!info || !meta) return null;
                  return (
                    <div className="flex flex-col items-center text-center gap-4">
                      {/* Enlarged Emoji inside Colored Circle */}
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl border-2 border-white/30"
                        style={{
                          backgroundColor: meta.color,
                          boxShadow: `0 0 30px ${meta.color}66`,
                        }}
                      >
                        <span className="leading-none select-none">{meta.emoji}</span>
                      </div>

                      {/* Character Name & Subtitle */}
                      <div>
                        <h3 className="fighting-header text-3xl text-white">
                          {info.name.toUpperCase()}
                        </h3>
                        <p className="mt-1 text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                          {info.badge}
                        </p>
                      </div>

                      {/* Base Stats (Speed, Mass) */}
                      <div className="w-full grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-slate-900/75 border border-white/10 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Speed
                          </span>
                          <span className="text-xs sm:text-sm font-mono tabular-nums font-extrabold text-sky-300">
                            {meta.speed}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/75 border border-white/10 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Mass
                          </span>
                          <span className="text-xs sm:text-sm font-mono tabular-nums font-extrabold text-amber-300">
                            {meta.mass}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-left bg-slate-900/60 border border-white/10 rounded-xl p-3.5">
                        {meta.libraryDescription}
                      </p>

                      {/* Server-Verified Character Unlock / Purchase */}
                      <div className="w-full pt-1 flex flex-col gap-1.5">
                        {unlockedBalls.includes(info.id) ? (
                          <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase tracking-wider text-center">
                            ✓ Character Unlocked in Database
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handlePurchaseCharacter(info.id, getCharacterUnlockCost(info.id))
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] transition cursor-pointer tabular-nums"
                          >
                            🪙 Purchase Character (Cost:{' '}
                            {getCharacterUnlockCost(info.id).toLocaleString()} Coins)
                          </button>
                        )}
                        {purchaseErrorMsg && (
                          <span className="text-[11px] font-bold text-rose-400">
                            {purchaseErrorMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 5. #game-screen: Contains the Canvas and the in-game UI */}
        <div
          id="game-screen"
          aria-label="Square Arena Game Stage"
          className={`inset-0 w-full min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 z-20 ${
            activeScreen === 'game-screen' ? 'view-active' : 'view-hidden'
          }`}
        >
          {/* Top Scoreboard & Health Bar Indicator HUD (Hidden on compact mobile during active match where Profile Cards are shown) */}
          <div className={`w-full max-w-[1120px] mb-2 ${isMatchStarted ? 'hidden sm:flex' : 'flex'} flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs`}>
            {/* Player 1 Health, 3-Heart HUD & Class Badge */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span>
              <div>
                <div className="flex items-center gap-1 mb-0.5" aria-label={`Player 1 Hearts: ${p1Hearts} of 3`}>
                  {[0, 1, 2].map((idx) => {
                    const isFilled = idx < p1Hearts;
                    return (
                      <Heart
                        key={idx}
                        className={`w-3.5 h-3.5 transition-all duration-200 ${
                          isFilled
                            ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.75)]'
                            : 'text-slate-600 fill-transparent opacity-60'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sky-400 truncate max-w-[110px]" title={p1Name || 'Player 1'}>
                    {p1Name || 'Player 1'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-mono">
                    {BALL_TYPES.find((b) => b.id === p1BallType)?.name}
                  </span>
                  {isMatchStarted && matchPhase === 'launch' && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      p1AimLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 animate-pulse'
                    }`}>
                      {p1AimLocked ? 'LOCKED' : 'AIMING'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full transition-all duration-150 ${p1Hp / startingHealth < 0.28 ? 'bg-red-500' : p1Hp / startingHealth < 0.6 ? 'bg-amber-400' : 'bg-sky-400'}`}
                      style={{ width: `${Math.max(0, (p1Hp / startingHealth) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">{Math.ceil(p1Hp)} / {startingHealth} HP</span>
                </div>
              </div>
              <span className="ml-2 font-mono text-xs px-2.5 py-1 rounded-lg bg-sky-950/90 border border-sky-500/40 text-sky-300 font-extrabold tracking-wide shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                SCORE: {p1Score}
              </span>
            </div>

            {/* Match Status, Global Match Score Banner & Global HUD Sound Toggle */}
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 font-mono text-xs font-black text-white px-3 py-0.5 rounded-lg bg-slate-950/90 border border-slate-700/80 shadow-inner">
                  <span className="text-sky-400">{(p1Name || 'P1').slice(0, 10)} {p1Score}</span>
                  <span className="text-slate-600 font-normal">:</span>
                  <span className="text-orange-400">{(p2Name || (playAgainstBot ? 'BOT' : 'P2')).slice(0, 10)} {p2Score}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isMatchStarted && matchPhase === 'battle' && (
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        isEscalated || suddenDeathOverlay
                          ? 'bg-rose-950/90 text-rose-300 border-rose-500/70 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isEscalated || suddenDeathOverlay
                        ? `🔥 SD 0:${String(suddenDeathCountdown).padStart(2, '0')}`
                        : `⏱️ ${Math.floor(roundSeconds / 60)}:${String(roundSeconds % 60).padStart(2, '0')}`}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold tracking-wider uppercase ${
                    isEscalated || suddenDeathOverlay
                      ? 'text-rose-400 font-black animate-pulse'
                      : matchPhase === 'launch'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}>
                    {matchStatus}
                  </span>
                </div>
              </div>

              {/* Global HUD Sound Toggle Button */}
              <button
                type="button"
                id="hud-sound-toggle"
                onClick={handleToggleSound}
                aria-label={soundEnabled ? 'Mute All Synthesized Audio Effects' : 'Unmute All Synthesized Audio Effects'}
                title="Toggle Global Synthesized Sound Effects [Key M]"
                className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition cursor-pointer select-none shadow-sm ${
                  soundEnabled
                    ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                <span>{soundEnabled ? 'SFX: ON' : 'MUTED'}</span>
              </button>
            </div>

            {/* Player 2 Health, 3-Heart HUD & Class Badge */}
            <div className="flex items-center gap-2.5 flex-row-reverse text-right">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316]"></span>
              <div>
                <div className="flex items-center gap-1 mb-0.5 justify-end" aria-label={`Player 2 Hearts: ${p2Hearts} of 3`}>
                  {[0, 1, 2].map((idx) => {
                    const isFilled = idx < p2Hearts;
                    return (
                      <Heart
                        key={idx}
                        className={`w-3.5 h-3.5 transition-all duration-200 ${
                          isFilled
                            ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.75)]'
                            : 'text-slate-600 fill-transparent opacity-60'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="font-bold text-orange-400 truncate max-w-[110px]" title={p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}>
                    {p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-950 border border-orange-500/30 text-orange-300 font-mono">
                    {BALL_TYPES.find((b) => b.id === p2BallType)?.name}
                  </span>
                  {isMatchStarted && matchPhase === 'launch' && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      p2AimLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-orange-500/20 text-orange-300 animate-pulse'
                    }`}>
                      {p2AimLocked ? 'LOCKED' : (playAgainstBot ? 'AI AIMING' : 'AIMING')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-row-reverse">
                  <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full transition-all duration-150 ${p2Hp / startingHealth < 0.28 ? 'bg-red-500' : p2Hp / startingHealth < 0.6 ? 'bg-amber-400' : 'bg-orange-400'}`}
                      style={{ width: `${Math.max(0, (p2Hp / startingHealth) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">{Math.ceil(p2Hp)} / {startingHealth} HP</span>
                </div>
              </div>
              <span className="mr-2 font-mono text-xs px-2.5 py-1 rounded-lg bg-orange-950/90 border border-orange-500/40 text-orange-300 font-extrabold tracking-wide shadow-[0_0_12px_rgba(249,115,22,0.25)]">
                SCORE: {p2Score}
              </span>
            </div>
          </div>

          {/* Responsive Stage & HUD Container */}
          <div className="relative w-full max-w-[1120px] mx-auto flex flex-col items-center justify-center">
            {/* IN-MATCH PLAYER PROFILES OVERLAY (TOP-LEFT & TOP-RIGHT; 2-col bar above canvas on mobile phones so it never blocks the arena) */}
            {isMatchStarted && (
              <div className="w-full grid grid-cols-2 gap-1.5 mb-1.5 sm:mb-0 sm:flex sm:items-start sm:justify-between sm:absolute sm:inset-x-0 sm:top-0 sm:p-3.5 pointer-events-none z-10">
                {/* Player 1 Profile + Under-Profile Message Bar & Messages (Top-Left Corner) */}
                <div className="pointer-events-auto flex flex-col items-start gap-1 w-full sm:w-auto sm:max-w-[300px]">
                  <div 
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 p-1.5 sm:p-2 pr-2 sm:pr-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-sky-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.2)] transition-all hover:border-sky-400/60"
                    aria-label="Player 1 Profile"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-0.5" aria-label={`Player 1 Hearts: ${p1Hearts} of 3`}>
                        {[0, 1, 2].map((idx) => {
                          const isFilled = idx < p1Hearts;
                          return (
                            <Heart
                              key={idx}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
                                isFilled
                                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                                  : 'text-slate-600 fill-transparent opacity-60'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <PlayerAvatar 
                        name={p1Name || 'Player 1'} 
                        color="#38bdf8" 
                        ballType={p1BallType}
                        abilityProgress={matchPhase === 'battle' ? p1AbilityProgress : 1}
                        abilityRemaining={matchPhase === 'battle' ? p1AbilityHud.remaining : 0}
                        abilityActive={matchPhase === 'battle' ? p1AbilityHud.isActive : false}
                        abilityStatusText={matchPhase === 'battle' ? p1AbilityHud.statusText : 'READY'}
                      />
                    </div>

                    <div className="min-w-0 flex-1 pr-0.5 sm:pr-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase font-mono px-1 sm:px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          P1
                        </span>
                        <span className="text-[11px] sm:text-sm font-black text-white truncate max-w-[68px] sm:max-w-[125px]" title={p1Name || 'Player 1'}>
                          {p1Name || 'Player 1'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-sky-950/90 border border-sky-500/30 text-sky-300 truncate max-w-[75px] sm:max-w-none">
                          {BALL_TYPES.find((b) => b.id === p1BallType)?.name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-200 tabular-nums">
                          {Math.ceil(p1Hp)}/{startingHealth}
                        </span>
                      </div>
                      {/* Player 1 Current HP Bar */}
                      <div
                        className="mt-1 w-full sm:min-w-[125px] h-2 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden shadow-inner"
                        role="progressbar"
                        aria-valuenow={Math.max(0, Math.ceil(p1Hp))}
                        aria-valuemin={0}
                        aria-valuemax={startingHealth}
                        aria-label="Player 1 HP"
                      >
                        <div
                          className="h-full transition-all duration-150 ease-out rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, (p1Hp / Math.max(1, startingHealth)) * 100))}%`,
                            backgroundColor:
                              p1Hp / Math.max(1, startingHealth) > 0.5
                                ? '#22c55e'
                                : p1Hp / Math.max(1, startingHealth) > 0.25
                                ? '#f59e0b'
                                : '#ef4444',
                            boxShadow:
                              p1Hp / Math.max(1, startingHealth) > 0.5
                                ? '0 0 8px rgba(34, 197, 94, 0.7)'
                                : p1Hp / Math.max(1, startingHealth) > 0.25
                                ? '0 0 8px rgba(245, 158, 11, 0.7)'
                                : '0 0 8px rgba(239, 68, 68, 0.85)',
                          }}
                        />
                      </div>
                      {/* Dash / Dodge Ability Cooldown Countdown on Character Overlay */}
                      {matchPhase === 'battle' && (
                        <div className="mt-1 w-full sm:min-w-[125px]" aria-label="Player 1 Dash Cooldown">
                          <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-mono font-black uppercase leading-none mb-0.5">
                            <span className={`flex items-center gap-0.5 ${p1DashRemaining <= 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
                              <Zap className="w-2.5 h-2.5" />
                              <span>DODGE</span>
                            </span>
                            <span className={`tabular-nums ${p1DashRemaining <= 0 ? 'text-emerald-400 animate-pulse' : 'text-amber-300'}`}>
                              {p1DashRemaining <= 0 ? 'READY' : `${p1DashRemaining.toFixed(1)}s`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-75 ease-linear rounded-full ${
                                p1DashRemaining <= 0 ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, ((3.0 - p1DashRemaining) / 3.0) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pl-1.5 sm:pl-3.5 border-l border-slate-800 text-right shrink-0">
                      <span className="text-[7px] sm:text-[8px] uppercase font-extrabold tracking-widest text-slate-400 block leading-tight">SCORE</span>
                      <span className="text-lg sm:text-3xl font-black font-mono text-sky-400 leading-none">
                        {p1Score}
                      </span>
                    </div>
                  </div>

                  {/* Message Bar Directly Under Player 1 Profile */}
                  {(!isOnlineMode || onlineRole !== 'Player 2') && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage('P1', chatInput);
                        setChatInput('');
                        const inputEl = e.currentTarget.querySelector('input');
                        inputEl?.blur();
                      }}
                      className="flex items-center gap-1 w-full p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-sky-500/30 shadow-lg"
                      aria-label="Player 1 Message Bar"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        maxLength={60}
                        placeholder="Message..."
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-base sm:text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 border border-sky-500/40 font-bold text-[10px] uppercase tracking-wider cursor-pointer flex-shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  )}

                  {/* Sent Messages Displayed Directly Under Player 1 Profile */}
                  {chatMessages.some((m) => m.sender === 'P1') && (
                    <div className="flex flex-col items-start gap-1 w-full" aria-label="Player 1 Sent Messages">
                      {chatMessages
                        .filter((m) => m.sender === 'P1')
                        .slice(-3)
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className="max-w-full px-2.5 py-1 rounded-xl rounded-tl-sm bg-slate-950/90 backdrop-blur-md border border-sky-500/40 text-sky-100 text-[11px] shadow-[0_4px_14px_rgba(0,0,0,0.6)] break-words"
                          >
                            <span className="font-black text-sky-400 mr-1">{p1Name || 'P1'}:</span>
                            <span>{msg.text}</span>
                            {msg.wasFiltered && (
                              <span className="ml-1 text-[9px] text-emerald-400 font-mono">(Filtered ✓)</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Center Round Timer, Sudden Death Countdown Timer, Active Mutator & In-Canvas Sound Toggle */}
                <div className="hidden sm:flex flex-col items-center gap-1.5 pointer-events-auto">
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-2xl backdrop-blur-md border shadow-lg transition-all ${
                      matchPhase === 'battle' && (isEscalated || suddenDeathOverlay)
                        ? 'bg-rose-950/90 border-rose-500/80 text-rose-100 shadow-[0_0_24px_rgba(239,68,68,0.55)]'
                        : 'bg-slate-950/85 border-slate-800 text-slate-200'
                    }`}
                  >
                    {matchPhase === 'battle' && (
                      <>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isEscalated || suddenDeathOverlay
                              ? 'bg-rose-500 animate-ping'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="font-mono text-sm font-black tracking-widest">
                          {Math.floor(roundSeconds / 60)}:{String(roundSeconds % 60).padStart(2, '0')}
                        </span>
                        <span className="text-slate-700">|</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className={`flex items-center gap-1 text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        soundEnabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                      title="Mute / Unmute All Synthesized Audio Effects [Key M]"
                    >
                      {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-rose-400" />}
                      <span>{soundEnabled ? 'Audio ON' : 'Audio Muted'}</span>
                    </button>
                  </div>

                  {/* Sudden Death Countdown Timer HUD (appears at 15s mark) */}
                  {matchPhase === 'battle' && (isEscalated || suddenDeathOverlay) && (
                    <div
                      className="w-56 px-3 py-1.5 rounded-xl bg-rose-950/95 border border-rose-500/80 shadow-[0_0_25px_rgba(239,68,68,0.55)] flex flex-col gap-1"
                      role="timer"
                      aria-label="Sudden Death Countdown Timer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-200 animate-pulse">
                          <span>🔥</span>
                          <span>{suddenDeathCountdown > 0 ? 'SUDDEN DEATH' : 'FINAL CLIMAX'}</span>
                        </span>
                        <span className="font-mono text-sm font-black text-white tracking-wider">
                          {suddenDeathCountdown > 0
                            ? `0:${String(suddenDeathCountdown).padStart(2, '0')}`
                            : 'MAX'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-rose-950 border border-rose-500/40 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, (suddenDeathCountdown / 30) * 100))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-rose-300">
                        <span>{suddenDeathCountdown > 0 ? '2× DAMAGE' : '3× DAMAGE'}</span>
                        <span>1.5× SPEED SURGE</span>
                      </div>
                    </div>
                  )}

                  {matchPhase === 'battle' && (
                    <div
                      className="px-2.5 py-0.5 rounded-lg bg-slate-950/90 border text-[10px] font-black uppercase tracking-wider shadow"
                      style={{ borderColor: `${activeMutator.color}66`, color: activeMutator.color }}
                      title={activeMutator.desc}
                    >
                      {activeMutator.name}
                    </div>
                  )}
                </div>

                {/* Player 2 Profile + Under-Profile Message Bar & Messages (Top-Right Corner - Mirrored) */}
                <div className="pointer-events-auto flex flex-col items-end gap-1 w-full sm:w-auto sm:max-w-[300px]">
                  <div 
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-start flex-row-reverse gap-1.5 sm:gap-3 p-1.5 sm:p-2 pl-2 sm:pl-4 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-orange-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(249,115,22,0.2)] text-right transition-all hover:border-orange-400/60"
                    aria-label="Player 2 Profile"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-0.5" aria-label={`Player 2 Hearts: ${p2Hearts} of 3`}>
                        {[0, 1, 2].map((idx) => {
                          const isFilled = idx < p2Hearts;
                          return (
                            <Heart
                              key={idx}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
                                isFilled
                                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                                  : 'text-slate-600 fill-transparent opacity-60'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <PlayerAvatar 
                        name={p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')} 
                        color="#f97316" 
                        isBot={playAgainstBot}
                        ballType={p2BallType}
                        abilityProgress={matchPhase === 'battle' ? p2AbilityProgress : 1}
                        abilityRemaining={matchPhase === 'battle' ? p2AbilityHud.remaining : 0}
                        abilityActive={matchPhase === 'battle' ? p2AbilityHud.isActive : false}
                        abilityStatusText={matchPhase === 'battle' ? p2AbilityHud.statusText : 'READY'}
                      />
                    </div>

                    <div className="min-w-0 flex-1 pl-0.5 sm:pl-1">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] sm:text-sm font-black text-white truncate max-w-[68px] sm:max-w-[125px]" title={p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}>
                          {p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase font-mono px-1 sm:px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {playAgainstBot ? 'AI' : 'P2'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1 mt-0.5">
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-200 tabular-nums">
                          {Math.ceil(p2Hp)}/{startingHealth}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-orange-950/90 border border-orange-500/30 text-orange-300 truncate max-w-[75px] sm:max-w-none">
                          {BALL_TYPES.find((b) => b.id === p2BallType)?.name}
                        </span>
                      </div>
                      {/* Player 2 Current HP Bar (Mirrored Right-to-Left) */}
                      <div
                        className="mt-1 w-full sm:min-w-[125px] h-2 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden shadow-inner flex justify-end"
                        role="progressbar"
                        aria-valuenow={Math.max(0, Math.ceil(p2Hp))}
                        aria-valuemin={0}
                        aria-valuemax={startingHealth}
                        aria-label="Player 2 HP"
                      >
                        <div
                          className="h-full transition-all duration-150 ease-out rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, (p2Hp / Math.max(1, startingHealth)) * 100))}%`,
                            backgroundColor:
                              p2Hp / Math.max(1, startingHealth) > 0.5
                                ? '#22c55e'
                                : p2Hp / Math.max(1, startingHealth) > 0.25
                                ? '#f59e0b'
                                : '#ef4444',
                            boxShadow:
                              p2Hp / Math.max(1, startingHealth) > 0.5
                                ? '0 0 8px rgba(34, 197, 94, 0.7)'
                                : p2Hp / Math.max(1, startingHealth) > 0.25
                                ? '0 0 8px rgba(245, 158, 11, 0.7)'
                                : '0 0 8px rgba(239, 68, 68, 0.85)',
                          }}
                        />
                      </div>
                      {/* Dash / Dodge Ability Cooldown Countdown on Character Overlay */}
                      {matchPhase === 'battle' && (
                        <div className="mt-1 w-full sm:min-w-[125px]" aria-label="Player 2 Dash Cooldown">
                          <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-mono font-black uppercase leading-none mb-0.5">
                            <span className={`tabular-nums ${p2DashRemaining <= 0 ? 'text-emerald-400 animate-pulse' : 'text-amber-300'}`}>
                              {p2DashRemaining <= 0 ? 'READY' : `${p2DashRemaining.toFixed(1)}s`}
                            </span>
                            <span className={`flex items-center gap-0.5 ${p2DashRemaining <= 0 ? 'text-orange-300' : 'text-slate-400'}`}>
                              <span>{playAgainstBot ? 'AI DODGE' : 'DODGE'}</span>
                              <Zap className="w-2.5 h-2.5" />
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden flex justify-end">
                            <div
                              className={`h-full transition-all duration-75 ease-linear rounded-full ${
                                p2DashRemaining <= 0 ? 'bg-orange-400 shadow-[0_0_8px_#fb923c]' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, ((3.0 - p2DashRemaining) / 3.0) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pr-1.5 sm:pr-3.5 border-r border-slate-800 text-left shrink-0">
                      <span className="text-[7px] sm:text-[8px] uppercase font-extrabold tracking-widest text-slate-400 block leading-tight">SCORE</span>
                      <span className="text-lg sm:text-3xl font-black font-mono text-orange-400 leading-none">
                        {p2Score}
                      </span>
                    </div>
                  </div>

                  {/* Message Bar Directly Under Player 2 Profile (when local player is P2 online) */}
                  {isOnlineMode && onlineRole === 'Player 2' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage('P2', chatInput);
                        setChatInput('');
                        const inputEl = e.currentTarget.querySelector('input');
                        inputEl?.blur();
                      }}
                      className="flex items-center gap-1 w-full p-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-orange-500/30 shadow-lg"
                      aria-label="Player 2 Message Bar"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        maxLength={60}
                        placeholder="Message..."
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-base sm:text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-400"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 text-orange-300 border border-orange-500/40 font-bold text-[10px] uppercase tracking-wider cursor-pointer flex-shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  )}

                  {/* Sent Messages Displayed Directly Under Player 2 Profile */}
                  {chatMessages.some((m) => m.sender === 'P2') && (!isOpponentMuted || (isOnlineMode && onlineRole === 'Player 2')) && (
                    <div className="flex flex-col items-end gap-1 w-full text-right" aria-label="Player 2 Sent Messages">
                      {chatMessages
                        .filter((m) => m.sender === 'P2')
                        .slice(-3)
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className="max-w-full px-2.5 py-1 rounded-xl rounded-tr-sm bg-slate-950/90 backdrop-blur-md border border-orange-500/40 text-orange-100 text-[11px] shadow-[0_4px_14px_rgba(0,0,0,0.6)] break-words"
                          >
                            <span className="font-black text-orange-400 mr-1">
                              {p2Name || (playAgainstBot ? 'AI' : 'P2')}:
                            </span>
                            <span>{msg.text}</span>
                            {msg.wasFiltered && (
                              <span className="ml-1 text-[9px] text-emerald-400 font-mono">(Filtered ✓)</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile-Only Compact Round Timer & Mutator Status Strip */}
            {isMatchStarted && (
              <div className="flex sm:hidden w-full items-center justify-between gap-2 px-2.5 py-1 mb-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEscalated || suddenDeathOverlay ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-mono font-black text-white">
                    {matchPhase === 'battle'
                      ? `${Math.floor(roundSeconds / 60)}:${String(roundSeconds % 60).padStart(2, '0')}`
                      : 'LAUNCH PHASE'}
                  </span>
                  {matchPhase === 'battle' && (
                    <span
                      className="px-1.5 py-0.2 rounded font-black uppercase border"
                      style={{ borderColor: `${activeMutator.color}66`, color: activeMutator.color }}
                    >
                      {activeMutator.name}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono font-bold flex items-center gap-1"
                >
                  {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-rose-400" />}
                  <span>{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
                </button>
              </div>
            )}

            {/* Canvas Container with Locked 16:9 Aspect Ratio (Canvas unmounted during DraftScreen phase) */}
            <div className="relative w-full aspect-[16/9] max-h-[min(74vh,660px)] mx-auto flex items-center justify-center">
              {!isDraftPhase && (
                <canvas
                  ref={canvasRef}
                  id="game-canvas"
                  onMouseDown={handleCanvasTacticalPing}
                  title="Alt+Click on the arena to place a Tactical Ping marker"
                  className={`game-canvas-element ${
                    isAbilityReadyGlow ? 'ability-ready-pulse' : ''
                  } w-full h-full aspect-[16/9] max-h-[min(74vh,660px)] object-contain rounded-xl border border-sky-500/30 bg-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.2),0_20px_40px_rgba(0,0,0,0.9)] touch-none block`}
                />
              )}

              {/* CORNER NETWORK PING INDICATOR (Shown in corner, ON by default) */}
              {showPingCorner && (
                <div
                  className="pointer-events-none select-none absolute bottom-2.5 right-2.5 z-25 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-lg font-mono text-[10px] sm:text-[11px] font-bold tracking-wider"
                  aria-label="Network Ping Indicator"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      networkPingMs < 60
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : networkPingMs < 120
                        ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                        : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    }`}
                  />
                  <span className="text-slate-400">PING:</span>
                  <span
                    className={
                      networkPingMs < 60
                        ? 'text-emerald-300'
                        : networkPingMs < 120
                        ? 'text-amber-300'
                        : 'text-rose-400'
                    }
                  >
                    {networkPingMs} ms
                  </span>
                </div>
              )}

              {/* ONLINE MATCHMAKING QUEUE & DISCONNECT OVERLAY */}
              {isOnlineMode && (onlineStatus === 'connecting' || onlineStatus === 'waiting' || onlineOpponentDisconnected) && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <div className="fighting-glass-panel w-full max-w-md rounded-2xl p-4 sm:p-6 text-center flex flex-col items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-400/50 flex items-center justify-center animate-pulse">
                      <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                    </div>
                    <h3 className="fighting-header text-xl sm:text-2xl text-white">
                      {onlineOpponentDisconnected
                        ? 'OPPONENT DISCONNECTED'
                        : onlineStatus === 'connecting'
                        ? 'CONNECTING TO SERVER...'
                        : 'WAITING FOR OPPONENT...'}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xs">
                      {onlineOpponentDisconnected
                        ? 'Your opponent left the match room. Return to menu or requeue for a new opponent.'
                        : 'You are in the live matchmaking queue. The duel will begin automatically as soon as a second player connects.'}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      {onlineOpponentDisconnected && (
                        <button
                          type="button"
                          onClick={handleStartOnlineMatch}
                          className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                        >
                          Find New Match
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleQuitToMenu}
                        className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
                      >
                        Cancel &amp; Quit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BRIEF 'ROUND OVER' TEXT OVERLAY AFTER 2000ms FINISHER DELAY */}
              {roundOverBanner && (
                <div
                  id="round-over-banner"
                  className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm rounded-xl pointer-events-none select-none"
                >
                  <div className="fighting-glass-panel px-8 py-6 rounded-2xl border-2 border-amber-400/60 shadow-[0_0_50px_rgba(250,204,21,0.45)] text-center flex flex-col items-center gap-2 animate-pulse">
                    <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-amber-300">
                      NEXT ROUND PREPARING
                    </span>
                    <h2
                      className="fighting-header text-4xl sm:text-6xl tracking-wider text-white"
                      style={{
                        textShadow: '0 0 28px rgba(250, 204, 21, 0.85), 0 4px 12px rgba(0, 0, 0, 0.95)',
                      }}
                    >
                      ROUND OVER
                    </h2>
                  </div>
                </div>
              )}

              {/* 2000ms POST-ROUND VICTORY SCREEN (Glassmorphism + Fade-in + Glowing 'PLAYER X WINS!' + 3x Emoji + Pulsing 'REMATCH') */}
              <div
                id="post-round-overlay"
                className={`absolute inset-0 z-30 flex items-center justify-center bg-slate-950/35 rounded-xl p-2 sm:p-6 select-none overflow-y-auto ${
                  roundOverlay && !isChangingBalls ? 'view-active pointer-events-auto' : 'view-hidden pointer-events-none'
                }`}
              >
                {roundOverlay && !isChangingBalls && (
                  <div className="victory-screen-enter fighting-glass-panel w-full max-w-md rounded-2xl p-4 sm:p-7 text-center flex flex-col items-center gap-2.5 sm:gap-4 my-auto">
                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-amber-300 font-bold">
                      KNOCKOUT · VICTORY
                    </span>

                    {/* Large, Glowing 'PLAYER X WINS!' Banner */}
                    <h2
                      className="fighting-header text-2xl sm:text-5xl tracking-wider leading-none"
                      style={{
                        color: roundOverlay.winnerColor,
                        textShadow: `0 0 28px ${roundOverlay.winnerColor}aa, 0 0 10px ${roundOverlay.winnerColor}88, 0 4px 12px rgba(0, 0, 0, 0.95)`,
                      }}
                    >
                      {roundOverlay.winnerPlayerLabel}
                    </h2>

                    {/* Winning Ball's Emoji Displayed at 3x Scale */}
                    <div className="my-1 sm:my-4 flex flex-col items-center justify-center gap-2 sm:gap-4">
                      <div
                        className="w-16 h-16 sm:w-28 sm:h-28 rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl"
                        style={{
                          backgroundColor: roundOverlay.winnerBallColor || roundOverlay.winnerColor,
                          boxShadow: `0 0 42px ${roundOverlay.winnerColor}80, inset 0 0 18px rgba(255,255,255,0.25)`,
                        }}
                      >
                        <span
                          className="leading-none select-none inline-block"
                          style={{ fontSize: '1.15rem', transform: 'scale(2.6)' }}
                          aria-label={`${roundOverlay.winnerSubClass} winner icon`}
                        >
                          {roundOverlay.winnerEmoji}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide">
                        {roundOverlay.winnerName} · {roundOverlay.winnerSubClass}
                      </p>
                      {typeof roundOverlay.coinsEarned === 'number' && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border font-mono text-xs font-black tracking-wider"
                          style={{
                            color: '#facc15',
                            borderColor: 'rgba(250, 204, 21, 0.6)',
                            boxShadow: '0 0 16px rgba(250, 204, 21, 0.35)',
                          }}
                        >
                          <Coins className="w-3.5 h-3.5" style={{ color: '#facc15' }} />
                          <span>+{roundOverlay.coinsEarned} COINS</span>
                        </div>
                      )}
                    </div>

                    {/* Current Match Scoreboard */}
                    <div className="w-full p-2.5 sm:p-3.5 rounded-xl bg-slate-950/65 border border-white/10 text-xs">
                      <div className="grid grid-cols-2 gap-3 divide-x divide-white/10">
                        <div>
                          <span className="text-slate-400 block text-[11px] font-bold truncate mb-0.5" title={p1Name || 'Player 1'}>
                            {p1Name || 'Player 1'}
                          </span>
                          <span className="text-xl sm:text-3xl font-mono tabular-nums font-black text-sky-400">
                            {roundOverlay.p1ScoreSnapshot ?? p1Score}
                          </span>
                        </div>
                        <div className="pl-3">
                          <span className="text-slate-400 block text-[11px] font-bold truncate mb-0.5" title={p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}>
                            {p2Name || (playAgainstBot ? 'Bot (AI)' : 'Player 2')}
                          </span>
                          <span className="text-xl sm:text-3xl font-mono tabular-nums font-black text-orange-400">
                            {roundOverlay.p2ScoreSnapshot ?? p2Score}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Large Pulsing 'REMATCH' + Secondary Controls */}
                    <div className="w-full flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleNextRound}
                        disabled={isOnlineMode && onlineRematchRequested}
                        className="rematch-pulse-btn w-full py-3 sm:py-4 px-5 sm:px-6 rounded-xl font-black text-base sm:text-lg uppercase tracking-widest bg-gradient-to-r from-sky-400 via-cyan-300 to-orange-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-70"
                      >
                        <RotateCcw className="w-5 h-5 stroke-[2.75]" />
                        <span className="fighting-header text-lg sm:text-xl tracking-widest text-slate-950" style={{ textShadow: 'none' }}>
                          {isOnlineMode
                            ? onlineRematchRequested
                              ? 'WAITING FOR OPPONENT...'
                              : opponentRematchReady
                              ? 'ACCEPT REMATCH!'
                              : 'REMATCH'
                            : 'REMATCH'}
                        </span>
                      </button>

                      <div className={`grid ${isOnlineMode ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                        {!isOnlineMode && (
                          <button
                            type="button"
                            onClick={handleChangeBalls}
                            className="py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/15 hover:border-sky-400/60 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Users className="w-4 h-4 text-sky-400" />
                            <span>Change Balls</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleQuitToMenu}
                          className="py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-rose-950/50 hover:bg-rose-900/75 text-rose-200 border border-rose-500/35 hover:border-rose-400/70 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Quit to Menu</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RADIAL EMOTE WHEEL OVERLAY (Toggle with Key T or Emote Wheel Button) */}
              {isMatchStarted && isEmoteWheelOpen && (
                <div
                  className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] rounded-xl"
                  onClick={() => setIsEmoteWheelOpen(false)}
                >
                  <div
                    className="relative w-64 h-64 sm:w-72 sm:h-72 scale-90 sm:scale-100 rounded-full bg-slate-950/90 border-2 border-sky-400/50 shadow-[0_0_45px_rgba(56,189,248,0.35)] flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Quick Emote Wheel"
                  >
                    <button
                      type="button"
                      onClick={() => setIsEmoteWheelOpen(false)}
                      className="w-20 h-20 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/20 flex flex-col items-center justify-center text-center cursor-pointer transition"
                    >
                      <span className="text-lg leading-none">🎭</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 mt-1">
                        Close [T]
                      </span>
                    </button>

                    {EMOTE_PRESETS.map((em, idx) => {
                      const angle = (idx / EMOTE_PRESETS.length) * Math.PI * 2 - Math.PI / 2;
                      const radiusPx = 96;
                      const offsetX = Math.cos(angle) * radiusPx;
                      const offsetY = Math.sin(angle) * radiusPx;
                      return (
                        <button
                          key={em.id}
                          type="button"
                          onClick={() => triggerEmote(em.id)}
                          style={{
                            transform: `translate(${offsetX}px, ${offsetY}px)`,
                            borderColor: `${em.color}88`,
                          }}
                          className="absolute w-22 py-1.5 px-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border-2 shadow-lg flex flex-col items-center justify-center gap-0.5 hover:scale-110 active:scale-95 transition cursor-pointer"
                          title={`Send ${em.label} [Key ${idx + 1}]`}
                        >
                          <span className="text-xl leading-none">{em.emoji}</span>
                          <span className="text-[10px] font-black text-white whitespace-nowrap">
                            {em.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BATTLE PHASE SKILL-BASED PARRY & DODGE DASH CONTROLS (Thumb-friendly bar below canvas on mobile, bottom overlay on desktop) */}
            {isMatchStarted && matchPhase === 'battle' && !roundOverlay && (
              <div className="w-full mt-2 sm:mt-0 sm:w-auto sm:absolute sm:bottom-3 sm:inset-x-4 pointer-events-none flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-20">
                {(!isOnlineMode || onlineRole !== 'Player 2') ? (
                  <div className="pointer-events-auto flex items-center gap-2 flex-1 sm:flex-initial">
                    <button
                      type="button"
                      onClick={() => parryP1Ref.current?.()}
                      className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-950/90 hover:bg-sky-950 text-sky-300 border border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-95 transition cursor-pointer select-none"
                      title="Timed 0.28s Parry Stance — Anti-Macro Protected"
                    >
                      🛡️ P1 Parry <span className="hidden sm:inline">[Key Q]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dashP1Ref.current?.()}
                      className={`flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider border active:scale-95 transition cursor-pointer select-none font-mono tabular-nums ${
                        p1DashRemaining <= 0
                          ? 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                          : 'bg-slate-950/90 text-amber-300 border-amber-500/40 opacity-85'
                      }`}
                      title="Evasive Dodge Dash with brief i-frames (3.0s Cooldown) [Key E]"
                    >
                      {p1DashRemaining <= 0 ? (
                        <>
                          💨 P1 Dodge <span className="hidden sm:inline">[Key E]</span>
                        </>
                      ) : (
                        `⏳ Dodge ${p1DashRemaining.toFixed(1)}s`
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {isOnlineMode && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      <span>{onlineRole === 'Player 1' ? 'YOU: P1' : onlineRole === 'Player 2' ? 'YOU: P2' : 'ONLINE'}</span>
                    </span>
                  </div>
                )}

                {(!isOnlineMode || onlineRole === 'Player 2') && !playAgainstBot && (
                  <div className="pointer-events-auto flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <button
                      type="button"
                      onClick={() => dashP2Ref.current?.()}
                      className={`flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider border active:scale-95 transition cursor-pointer select-none font-mono tabular-nums ${
                        p2DashRemaining <= 0
                          ? 'bg-orange-950/90 hover:bg-orange-900 text-orange-200 border-orange-400/60 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                          : 'bg-slate-950/90 text-amber-300 border-amber-500/40 opacity-85'
                      }`}
                      title="Evasive Dodge Dash with brief i-frames (3.0s Cooldown) [Key O / E]"
                    >
                      {p2DashRemaining <= 0 ? '💨 P2 Dodge' : `⏳ Dodge ${p2DashRemaining.toFixed(1)}s`}
                    </button>
                    <button
                      type="button"
                      onClick={() => parryP2Ref.current?.()}
                      className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-950/90 hover:bg-orange-950 text-orange-300 border border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.25)] active:scale-95 transition cursor-pointer select-none"
                      title="Timed 0.28s Parry Stance — Anti-Macro Protected"
                    >
                      🛡️ P2 Parry
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LAUNCH PHASE INTERACTIVE ANGLE LOCK OVERLAY (Thumb-friendly bar below canvas on mobile, bottom overlay on desktop) */}
            {isMatchStarted && (!isOnlineMode || onlineStatus === 'matched') && matchPhase === 'launch' && !roundOverlay && (
              <div className="w-full mt-2 sm:mt-0 sm:w-auto sm:absolute sm:bottom-4 sm:inset-x-4 pointer-events-none flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-20">
                <button
                  type="button"
                  onClick={() => lockP1Ref.current?.()}
                  disabled={p1AimLocked || (isOnlineMode && onlineRole === 'Player 2')}
                  className={`pointer-events-auto flex-1 sm:flex-initial min-h-[42px] px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer select-none shadow-lg ${
                    p1AimLocked
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : isOnlineMode && onlineRole === 'Player 2'
                      ? 'bg-sky-950/75 text-sky-300 border border-sky-500/30 cursor-default'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95'
                  }`}
                >
                  <span>
                    {p1AimLocked
                      ? '✓ P1 Angle Locked'
                      : isOnlineMode && onlineRole === 'Player 2'
                      ? 'P1 Aiming...'
                      : '🎯 Lock P1 Angle'}
                  </span>
                </button>

                <div className="hidden sm:flex flex-col items-center bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-xl border border-amber-500/30 text-center shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
                    {isOnlineMode ? `ONLINE LAUNCH · ${onlineRole?.toUpperCase() || ''}` : 'TOUCH OR MOUSE AIM ACTIVE'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isOnlineMode
                      ? 'Drag or move cursor to aim · Tap or Space to lock & wait for opponent'
                      : 'Drag or move cursor to aim · Tap or Space/Enter to lock'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => lockP2Ref.current?.()}
                  disabled={p2AimLocked || playAgainstBot || (isOnlineMode && onlineRole === 'Player 1')}
                  className={`pointer-events-auto flex-1 sm:flex-initial min-h-[42px] px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer select-none shadow-lg ${
                    p2AimLocked
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : playAgainstBot || (isOnlineMode && onlineRole === 'Player 1')
                      ? 'bg-orange-950/80 text-orange-300 border border-orange-500/30 cursor-default'
                      : 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95'
                  }`}
                >
                  <span>
                    {p2AimLocked
                      ? (playAgainstBot ? '✓ Bot Angle Locked' : '✓ P2 Angle Locked')
                      : isOnlineMode && onlineRole === 'Player 1'
                      ? 'P2 Aiming...'
                      : playAgainstBot
                      ? 'Bot Auto-Aiming...'
                      : '🎯 Lock P2 Angle'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ANTI-TOXICITY SAFE CHAT FILTER, TACTICAL PING CALLOUTS, EMOTE WHEEL & QUICK EXPRESSIONS BAR */}
          <div className="w-full max-w-[1120px] mt-2 px-3 py-2 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEmoteWheelOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider border transition cursor-pointer ${
                  isEmoteWheelOpen
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/40'
                }`}
                title="Open Radial Emote Wheel [Key T]"
              >
                🎭 Emote Wheel [T]
              </button>
              <button
                type="button"
                onClick={() => setShowPingCorner((prev) => !prev)}
                title="Toggle the live network Ping (ms) counter in the corner of the arena"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition cursor-pointer ${
                  showPingCorner
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
              >
                {showPingCorner ? `📶 Ping: ${networkPingMs} ms (ON)` : '📶 Ping HUD: OFF'}
              </button>
              {latestPingCallout && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold truncate max-w-[230px]">
                  {latestPingCallout}
                </span>
              )}
              {HOTKEY_EMOTES.map((hk) => (
                <button
                  key={hk.keyNum}
                  type="button"
                  onClick={() => triggerHotkeyEmote(hk.emoji, hk.label, hk.color)}
                  style={{ borderColor: `${hk.color}66` }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border text-[11px] font-bold transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1"
                  title={`Trigger ${hk.emoji} ${hk.label} [Key ${hk.keyNum} during match]`}
                >
                  <span>{hk.emoji}</span>
                  <span className="text-[9px] font-mono text-slate-400">[{hk.keyNum}]</span>
                </button>
              ))}
              {EMOTE_PRESETS.map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => triggerEmote(em.id)}
                  style={{ borderColor: `${em.color}55` }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border text-[11px] font-semibold transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  title={`Trigger ${em.label} visual & audio emote`}
                >
                  {em.emoji} {em.label}
                </button>
              ))}
            </div>

            {/* Opponent Mute & Toxicity Filter Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChatFilterEnabled((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  isChatFilterEnabled
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Automatically scrubs toxic phrases into friendly sportsmanship messages"
              >
                {isChatFilterEnabled ? '🛡️ Toxicity Filter: ON' : 'Toxicity Filter: OFF'}
              </button>

              <button
                type="button"
                onClick={() => setIsOpponentMuted((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  isOpponentMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Mute all opponent chat & emotes"
              >
                {isOpponentMuted ? '🔇 Opponent Muted' : '🔊 Mute Opponent'}
              </button>
            </div>
          </div>
        </div>

        {/* Clean, Boilerplate-Free HTML Section Immediately Below Canvas */}
        <section 
          className="w-full max-w-[1120px] mx-auto px-4 py-8 md:py-10"
          aria-label="Ball VS Ball Controls and Mechanics Guide"
        >
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400 mb-2">
              Strategic Autobattler System
            </p>
            <h2 className="fighting-header text-3xl sm:text-4xl text-white mb-2">
              LAUNCH PHASE &amp; ESCALATION MECHANICS
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Lock your trajectory with <strong>Spacebar</strong> (Player 1) and <strong>Enter</strong> (Player 2 / Bot). Balls launch 30% slower for tactical spacing. At the <strong>15-second mark</strong>, the arena enters <strong>Sudden Death</strong>: balls gain a <strong>1.5x velocity surge</strong>, collision damage is <strong>doubled</strong>, and arena walls glow red!
            </p>
          </div>

          {/* Roster Cards Grid: Featured Classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {/* Jotaro */}
            <article className="bg-slate-900/70 border border-purple-500/25 rounded-xl p-5 hover:border-purple-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Jotaro</h3>
                  <p className="text-xs text-purple-400 font-mono">Jotaro • 12s Time Stop (2.5s Freeze)</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Every 12 seconds, triggers a Time Stop that completely freezes the enemy ball and all projectiles in place for 2.5 seconds while retaining full movement to line up a massive collision!
              </p>
            </article>

            {/* Edward Elric */}
            <article className="bg-slate-900/70 border border-slate-500/25 rounded-xl p-5 hover:border-slate-400/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/20">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Edward Elric</h3>
                  <p className="text-xs text-slate-300 font-mono">Edward Elric • Solid Stone Pillars</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Every 4 seconds, raises a static, solid stone pillar (grey canvas rectangle) from the arena floor. These act as permanent walls that alter bounce angles and block projectiles!
              </p>
            </article>

            {/* Light Yagami */}
            <article className="bg-slate-900/70 border border-rose-500/25 rounded-xl p-5 hover:border-rose-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Light Yagami</h3>
                  <p className="text-xs text-rose-400 font-mono">Death Note • 20s Unharmed Heart Attack</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Deals almost zero collision damage, but if it manages to avoid taking any damage for 20 seconds straight, it triggers an instant-kill Heart Attack on the enemy ball!
              </p>
            </article>

            {/* Deku */}
            <article className="bg-slate-900/70 border border-emerald-500/25 rounded-xl p-5 hover:border-emerald-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Deku</h3>
                  <p className="text-xs text-emerald-400 font-mono">Deku • Max Smash + 15% Recoil</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Has the highest collision multiplier in the game, dealing catastrophic damage on impact, but takes 15% recoil damage to its own health bar every time it hits the enemy!
              </p>
            </article>

            {/* Saitama */}
            <article className="bg-slate-900/70 border border-amber-500/25 rounded-xl p-5 hover:border-amber-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Saitama</h3>
                  <p className="text-xs text-amber-400 font-mono">Saitama • 9999 Instant KO</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Moves incredibly slowly and has terrible acceleration, but if it manages to land a direct, high-speed collision on the enemy, it deals 9999 damage (Instant KO)!
              </p>
            </article>

            {/* Engineer */}
            <article className="bg-slate-900/70 border border-amber-500/25 rounded-xl p-5 hover:border-amber-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Engineer</h3>
                  <p className="text-xs text-amber-400 font-mono">Static Turret Builder</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Drops a static grey square Turret on the arena floor every 5 seconds. Turrets cannot move and automatically shoot low-damage projectiles at the opponent every 2 seconds.
              </p>
            </article>

            {/* Gojo */}
            <article className="bg-slate-900/70 border border-violet-500/25 rounded-xl p-5 hover:border-violet-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Orbit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Gojo</h3>
                  <p className="text-xs text-violet-400 font-mono">Gojo • Infinity 90% Slow Aura</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Projects a visible Infinity aura ring. Any enemy ball or projectile entering this ring has its velocity reduced by 90%, making it almost impossible to land a high-speed collision!
              </p>
            </article>

            {/* Sukuna */}
            <article className="bg-slate-900/70 border border-red-500/25 rounded-xl p-5 hover:border-red-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Sukuna</h3>
                  <p className="text-xs text-red-400 font-mono">Sukuna • Invisible Domain Flurry</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Projects an invisible domain radius. If the enemy stays within this radius for more than 2 seconds, they are instantly hit with 5 rapid, unavoidable slash animations for heavy damage!
              </p>
            </article>

            {/* Tanjiro */}
            <article className="bg-slate-900/70 border border-sky-500/25 rounded-xl p-5 hover:border-sky-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Tanjiro</h3>
                  <p className="text-xs text-sky-400 font-mono">Tanjiro • Flowing Water Trail</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Leaves a trailing path of blue water canvas shapes as it moves. Enemies touching this water trail are slowed and take slight continuous tick damage!
              </p>
            </article>

            {/* Zenitsu */}
            <article className="bg-slate-900/70 border border-yellow-500/25 rounded-xl p-5 hover:border-yellow-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Zenitsu</h3>
                  <p className="text-xs text-yellow-400 font-mono">Zenitsu • 6s Lightning Teleport</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Moves at only 30% speed normally (sleeping), but every 6 seconds instantly teleports directly through the enemy ball, leaving a bright yellow lightning strike and dealing massive burst damage!
              </p>
            </article>

            {/* Levi */}
            <article className="bg-slate-900/70 border border-emerald-500/25 rounded-xl p-5 hover:border-emerald-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Levi</h3>
                  <p className="text-xs text-emerald-400 font-mono">Levi • 2s Rotational Blade Latch</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                When it collides with the enemy, instead of bouncing off, it latches onto the enemy and rapidly rotates around them for 2 seconds, dealing continuous blade damage before detaching!
              </p>
            </article>

            {/* Luffy */}
            <article className="bg-slate-900/70 border border-rose-500/25 rounded-xl p-5 hover:border-rose-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Luffy</h3>
                  <p className="text-xs text-rose-400 font-mono">Luffy • Stretch Punch & Slingshot</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Every 4 seconds, shoots a stretching fist (a canvas line with a circle at the end) directly at the enemy. On hit, deals multiple rapid ticks of damage and slingshots to the enemy&apos;s location!
              </p>
            </article>

            {/* Naruto */}
            <article className="bg-slate-900/70 border border-orange-500/25 rounded-xl p-5 hover:border-orange-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Naruto</h3>
                  <p className="text-xs text-orange-400 font-mono">Naruto • 2 Shadow Clones & Kunai</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Upon spawning, creates 2 slightly transparent Shadow Clones that mirror movement and throw weak kunai projectiles. Clones die in one hit, but confuse enemy projectile targeting!
              </p>
            </article>

            {/* Goku */}
            <article className="bg-slate-900/70 border border-sky-500/25 rounded-xl p-5 hover:border-sky-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Goku</h3>
                  <p className="text-xs text-sky-400 font-mono">Goku • 10s Charge Kamehameha</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Features a 10-second charge ring UI around the ball. Once full, fires a massive, thick blue laser beam (Kamehameha) straight across the entire arena dealing devastating damage!
              </p>
            </article>

            {/* Ichigo */}
            <article className="bg-slate-900/70 border border-red-500/25 rounded-xl p-5 hover:border-red-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Ichigo</h3>
                  <p className="text-xs text-red-400 font-mono">Ichigo • Piercing Getsuga Tensho</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Every 5 seconds, fires a wide, crescent-shaped energy wave (Getsuga Tensho) that travels forward and penetrates through obstacles and clones!
              </p>
            </article>

            {/* Zoro */}
            <article className="bg-slate-900/70 border border-emerald-500/25 rounded-xl p-5 hover:border-emerald-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Zoro</h3>
                  <p className="text-xs text-emerald-400 font-mono">Zoro • 180° Deflecting Slash Cone</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Projects a permanent 180-degree damage cone facing its direction of movement. Any enemy or projectile entering this frontal arc takes continuous slashing damage and gets deflected away!
              </p>
            </article>

            {/* Black Hole */}
            <article className="bg-slate-900/70 border border-violet-500/25 rounded-xl p-5 hover:border-violet-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Orbit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Black Hole</h3>
                  <p className="text-xs text-violet-400 font-mono">Gravitational Singularity</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Calculates distance to the opponent every frame, exerting an inescapable gravitational suction field.
              </p>
              <div className="p-2.5 rounded-lg bg-violet-950/40 border border-violet-500/20 text-xs text-violet-200">
                <strong className="text-white">Unique Trait:</strong> The closer the opponent gets, the exponentially stronger they are sucked toward the singularity.
              </div>
            </article>

            {/* Vampire */}
            <article className="bg-slate-900/70 border border-red-500/25 rounded-xl p-5 hover:border-red-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Vampire</h3>
                  <p className="text-xs text-red-400 font-mono">50% Life-Steal</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Enveloped in a crimson blood mist with siphoning runes that harvest kinetic life on impact.
              </p>
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                <strong className="text-white">Unique Trait:</strong> Restores its own HP by 50% of the damage dealt on collision (capped at max starting health).
              </div>
            </article>

            {/* Mirage */}
            <article className="bg-slate-900/70 border border-indigo-500/25 rounded-xl p-5 hover:border-indigo-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Mirage</h3>
                  <p className="text-xs text-indigo-400 font-mono">Intangible Decoy Clone</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Spawns an intangible holographic clone on the opposite side of the arena that mirrors movements.
              </p>
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                <strong className="text-white">Unique Trait:</strong> The decoy clone deals no damage and passes through objects, serving as a tactical visual mind game.
              </div>
            </article>

            {/* Jackpot */}
            <article className="bg-slate-900/70 border border-amber-500/25 rounded-xl p-5 hover:border-amber-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Jackpot</h3>
                  <p className="text-xs text-amber-400 font-mono">777 Slot Machine RNG</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                A high-stakes meme ball. Rolls a slot machine check on every collision.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200">
                <strong className="text-white">Unique Trait:</strong> 80% chance to deal only 1 damage; 20% chance to trigger a massive 50 damage Jackpot!
              </div>
            </article>

            {/* Venom */}
            <article className="bg-slate-900/70 border border-emerald-500/25 rounded-xl p-5 hover:border-emerald-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Venom</h3>
                  <p className="text-xs text-emerald-400 font-mono">Poison Puddles (4s)</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Drops static green poison puddles every 0.5s that persist for 4 seconds, dealing continuous tick damage.
              </p>
            </article>

            {/* Math Grid */}
            <article className="bg-slate-900/70 border border-yellow-500/25 rounded-xl p-5 hover:border-yellow-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Grid3X3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Math Grid</h3>
                  <p className="text-xs text-yellow-400 font-mono">3x3 Tic-Tac-Toe Grid</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Fixed 3x3 grid in arena center with 1x-5x multipliers. Collision damage is multiplied by cell stood on.
              </p>
            </article>

            {/* Sniper */}
            <article className="bg-slate-900/70 border border-sky-500/25 rounded-xl p-5 hover:border-sky-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Sniper</h3>
                  <p className="text-xs text-sky-400 font-mono">Scaling Rifle Projectiles</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Charges over match duration, firing high-velocity projectiles targeted at the opponent.
              </p>
            </article>

            {/* Knife Master */}
            <article className="bg-slate-900/70 border border-cyan-500/25 rounded-xl p-5 hover:border-cyan-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Knife Master</h3>
                  <p className="text-xs text-cyan-400 font-mono">4 Cross-Rotating Blades</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                4 detailed knives continuously rotate around the ball, slicing opponents on contact without physical knockback.
              </p>
            </article>

            {/* Mystic Aura */}
            <article className="bg-slate-900/70 border border-purple-500/25 rounded-xl p-5 hover:border-purple-500/40 transition">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Mystic Aura</h3>
                  <p className="text-xs text-purple-400 font-mono">Pulsing Field (&gt;1s Tick)</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Emits an oscillating aura ring. Opponents trapped inside for &gt;1 second take continuous passive tick damage.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p className="max-w-7xl mx-auto px-4">
          © {new Date().getFullYear()} Ball VS Ball Online • Pure HTML5 Canvas 2D Physics Brawler
        </p>
      </footer>
    </div>
  );
}
