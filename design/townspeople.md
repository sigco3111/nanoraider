# NanoRaider - The Outpost & Townspeople System

## Overview

When a hero dies, two outcomes are possible:

- **Survived:** The hero's story doesn't end — they join your outpost as a named resident with a specific role, granting permanent bonuses to all future runs.
- **Graveyard:** Most heroes die. Their run still contributes to meta-progression (AP, boss readiness bank), but they don't make it to the outpost.

**Core Philosophy:**
- The townsperson IS the actual hero — their name, stats, and level are preserved.
- Each outpost role is filled once, permanently. First hero to earn a role claims it forever. Pokédex feel — collect them all.
- No prerequisite chains. Any pre-raid role can be unlocked on any run. Raid-gated roles just require defeating that raid first.
- The outpost grows over time. A full outpost (8 residents) represents a complete legacy.

---

## The 8 Townsperson Roles

Roles are grouped by **raid gate** — the progression barrier required before a hero can earn that role.

### Outpost Residents (No Raid Required)

| Role | Primary Gate | Conditions | Bonuses |
|------|-------------|------------|---------|
| **Battlemaster** | War ≥ 55% | war ≥ 55, daring ≥ 30 | +5 energy, +8% combat |
| **Lorekeeper** | Wit ≥ 55% | wit ≥ 55, MF readiness ≥ 25 | +5 energy, +5% boss readiness, 1.5x study |
| **Quartermaster** | Wealth ≥ 55% | wealth ≥ 55, gold ≥ 400 at death | +5 energy, +40g start, 6% vendor discount |
| **Trailblazer** | Daring ≥ 55 | daring ≥ 55, war ≥ 25 | +5 energy, +5% combat, 6% recipe discount |
| **Herald** | Renown ≥ 50 | renown ≥ 50, wealth ≥ 15 | +5 energy, +25g start, 4% vendor discount |

### Molten Fury Veterans (Must Defeat Molten Fury)

| Role | Primary Gate | Conditions | Bonuses |
|------|-------------|------------|---------|
| **Forgemaster** | Readiness + balance | defeated MF, MF readiness ≥ 60, wit ≥ 25, war ≥ 25 | +8 energy, 8% purple craft, 6% recipe discount, broker tier 2 |
| **Warchief** | War + Daring post-raid | defeated MF, war ≥ 45, daring ≥ 45, renown ≥ 25 | +8 energy, +12% combat, +5% boss readiness |

### Eternal Throne Champions (Must Defeat Eternal Throne)

| Role | Primary Gate | Conditions | Bonuses |
|------|-------------|------------|---------|
| **Siegebreaker** | Broad mastery | defeated ET, war ≥ 20, wit ≥ 20, wealth ≥ 15, daring ≥ 50, renown ≥ 30, ET readiness ≥ 70 | +12 energy, +10% combat, +8% boss readiness, 2.5x study, 6% purple craft, raid provisioner |

### Total Stacked Bonuses (All 8 Filled)

- **Energy:** +53 (base 50 + 53 = 103 before AP upgrades)
- **Start Gold:** +65g
- **Combat:** +35%
- **Boss Readiness Start:** +18%
- **Knowledge Multiplier:** 2.5x (max)
- **Vendor Discount:** 10%
- **Recipe Discount:** 12%
- **Purple Craft:** 14%
- **Broker Tier:** 2
- **Raid Provisioner:** unlocked

---

## Death Resolution

On hero death, the system evaluates townsperson eligibility in order of raid gate (highest gate wins), then by how many conditions were satisfied.

**Only one role can be claimed per death.** The hero claims the highest-gate role they qualify for.

**Priority rule:** eternal_throne > molten_fury > none. Within the same gate, the role with the highest check score (most conditions passed) wins.

**Already filled roles are skipped.** If the Battlemaster slot is taken, a war-focused hero won't earn it again — but they might still qualify for Trailblazer or Warchief.

### Narrative

- **Survived → Outpost:** "Hero Survived! [Name] joins the outpost as [Role]." Death screen shows hero identity (name, level, stats), their role's lore, and why they earned it.
- **Graveyard:** "Your hero falls. Their journey ends at the graveyard." Death screen shows the near-miss hint if applicable.

---

## Role Design Principles

### MMO Readability First

Role names and conditions should be readable in 2 seconds by ex-MMO players.

- **Name like a group role:** Battlemaster, Lorekeeper, Warchief — not abstract metaphors.
- **Gating is a career arc:** Pre-raid roles are achievable from run 1. Post-raid roles require genuine raid execution. The Siegebreaker is a genuinely rare achievement.
- **Conditions reward disproportionate behavior:** Not "high total actions" but "this build clearly dominated this run." War ≥ 55% means you genuinely committed to the War triangle corner.
- **Bonuses reinforce identity:** Battlemaster gets combat bonus. Lorekeeper gets study multiplier. Quartermaster gets vendor discount. The reward makes you better at exactly what that role is known for.

### No Prerequisite Chains

Unlike the old tier system, there are no "unlock X before Y" requirements. Any pre-raid role can be earned from run 1. This means:

- New players can immediately aim for a specific role that matches their playstyle.
- Veteran players aren't locked into an artificial unlock order.
- The only "progression" is natural: raid roles require defeating raids.

### Role Scarcity Creates Stakes

Each role slot filled permanently changes the goal landscape. Once the Battlemaster is claimed by "Thordak the Reckless (Lv 8, Day 11)," every subsequent war-focused hero is aiming for Trailblazer or Warchief instead. The outpost evolves run by run.

---

## Building the Outpost: Recommended Paths

### Early Runs (No Raids Yet)

Focus on the five pre-raid roles. Each is achievable with a focused 1-run strategy:

- **Battlemaster run:** Stack war activities, take risks for daring. Dangerous dungeons push both.
- **Lorekeeper run:** Study boss repeatedly, invest all actions in wit-building activities.
- **Quartermaster run:** Farm gold aggressively, spend nothing — hold ≥ 400g at death.
- **Trailblazer run:** Take the riskiest options. Daring ≥ 55 comes from consistently choosing dangerous paths.
- **Herald run:** Host guild meetings, social activities, maintain wealth baseline.

After all 5 pre-raid slots are filled, the outpost energy bonus alone is +25 (base 50 → 75), plus starting gold, combat bonuses, and study multipliers that meaningfully accelerate every future run.

### Mid-Game (Post-Molten Fury)

With a full set of pre-raid outpost bonuses active, raid runs become much more viable. Two additional slots unlock:

- **Forgemaster:** Requires deep MF preparation (readiness ≥ 60) plus balanced wit/war. Rewards crafting investment.
- **Warchief:** Requires MF defeat plus high war, daring, and renown. A combat-dominant post-raid hero.

### Endgame (Post-Eternal Throne)

The **Siegebreaker** slot is the apex achievement — broad mastery across all dimensions plus ET defeat. Only one hero ever fills this role.

---

## The Outpost Screen

The outpost collection screen groups residents by raid gate. Each card shows:

**Filled slot:** Hero name, level, day reached, role description, lore, and full bonus breakdown.

**Vacant slot:** Role name, unlock hint, and bonus teaser. No spoilers on exact conditions until earned.

---

## Design Principles

1. **Your hero is the reward** — The townsperson is the actual run's hero, not an abstraction. Their name and story persist.
2. **Permanence creates meaning** — Slots fill once. Every resident has a story. "The Forgemaster slot was claimed by Irina Ashblade on run 14" is a richer hook than "+8% purple craft."
3. **Failure goes to the graveyard** — Most heroes die anonymously. Surviving to the outpost is genuinely special, not guaranteed.
4. **Raid gates replace tiers** — Natural progression through content, not artificial prerequisite chains.
5. **Bonuses compound into power** — A full outpost transforms every run. Early outposts provide incremental edges; a complete outpost makes late-game runs dramatically stronger.

---

## Key Takeaway

When "Mira the Relentless" (Lv 9, War 58%, Daring 41) dies after clearing Dungeon Blackrock on Day 11, she doesn't vanish — she walks to your outpost and becomes the Battlemaster. Her name is on the board. Her stats are on the card. Future heroes are stronger because of what she did. The graveyard is the default; the outpost is the exception. Build it one legend at a time.

# Brainstorm by me the human about the actual content

## TOWNSPEOPLE

FOR MOLTEN FURY

- Tank leader: high daring, renown, #dungeons completed, stamina
- Healer leader: high renown, #dungeons completed, spirit
- DPS leader: high renown, #dungeons completed, power
- Raid leader: high daring, renown, #dungeons completed

- Alchemist:
- Enchanter:

- Anvil
- Armorcrafter
- Weaponsmith

## INVENTORY

- Consumables
- Paper doll for gear
- Crafting materials
- Attunement items

## ACTIVITIES

Brainstorm of any MMO activities I can think of

- Quest: +gold +xp
- Farm gold: +gold
- Grind mobs: +xp
- Dungeon
- Raid
- Level profession
- Craft gear
- Farm resource: +profession +gold
- Study bosses
- Practice rotation
- Theorycraft
- Scam
- RMT
- Enhance gear
- AH flip/Trading: +renown +/-gold
- PVP
- Guild management
- Banter in global chat: +renown

- Kill rare
- 