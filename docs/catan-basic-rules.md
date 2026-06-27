# Catan Basic Rules Reference

This document captures the base Catan rules and board objects for the standard game.
It intentionally omits Longest Road, Largest Army, and victory point scoring for now.

## Scope

- Base game only.
- No extensions, expansions, scenarios, Seafarers, Cities & Knights, or custom maps.
- Rules are described at the level needed to identify valid board state, legal object types, and common game mechanics.

## Board Structure

The standard board is made from 19 terrain hexes arranged in rows of:

- 3 hexes
- 4 hexes
- 5 hexes
- 4 hexes
- 3 hexes

Each terrain hex has vertices and edges:

- Vertices can hold settlements or cities.
- Edges can hold roads.
- Hex centers can hold number tokens, except the desert.
- The robber occupies exactly one terrain hex.

The board is surrounded by sea frame pieces. Ports are placed on sea edges adjacent to land vertices.

## Valid Terrain Tile Types

| Tile type | Produces | Standard count |
| --- | --- | ---: |
| Hills | Brick | 3 |
| Forest | Lumber | 4 |
| Mountains | Ore | 3 |
| Fields | Grain | 4 |
| Pasture | Wool | 4 |
| Desert | Nothing | 1 |

Only resource-producing terrain hexes receive number tokens. The desert has no number token.

## Valid Resource Types

The base game has five resource card types:

- Brick
- Lumber
- Ore
- Grain
- Wool

Resources are produced when a dice roll matches a number token on a hex that is adjacent to a player's settlement or city, unless the robber is on that hex.

## Number Tokens

Valid number tokens are:

- 2
- 3
- 4
- 5
- 6
- 8
- 9
- 10
- 11
- 12

The number 7 is not a terrain production token. Rolling a 7 activates the robber flow instead of resource production.

Standard token distribution:

| Number | Count |
| --- | ---: |
| 2 | 1 |
| 3 | 2 |
| 4 | 2 |
| 5 | 2 |
| 6 | 2 |
| 8 | 2 |
| 9 | 2 |
| 10 | 2 |
| 11 | 2 |
| 12 | 1 |

## Valid Board Object Types

At the board-recognition level, valid physical board objects are:

| Object type | Owner | Location |
| --- | --- | --- |
| Settlement | Player | Vertex |
| City | Player | Vertex |
| Road | Player | Edge |
| Robber | Neutral | Terrain hex |
| Number token | Neutral | Resource-producing terrain hex |
| Port | Neutral | Coastal sea edge with two adjacent coastal vertices |

### Settlement

A settlement is a player-owned piece placed on a vertex.

Placement constraints:

- Must be on a land vertex.
- Must connect to one of the player's roads during normal building.
- Cannot be adjacent to another settlement or city on a neighboring vertex.
- During setup placement, it does not need to connect to a road already on the board.

Production behavior:

- Produces 1 resource when an adjacent hex produces.

### City

A city is a player-owned upgrade placed on a vertex already occupied by that player's settlement.

Placement constraints:

- Must replace one of the player's own settlements.
- Cannot be placed on an empty vertex.
- Cannot be placed on another player's settlement.

Production behavior:

- Produces 2 resources when an adjacent hex produces.

### Road

A road is a player-owned piece placed on an edge.

Placement constraints:

- Must be on an edge between two vertices.
- Must connect to one of the player's existing roads, settlements, or cities during normal building.
- Cannot be placed on an edge that already contains a road.
- Cannot pass through another player's settlement or city.

### Robber

The robber is a neutral object occupying one terrain hex.

Robber rules:

- Starts on the desert.
- Moves when a 7 is rolled.
- Blocks resource production from the occupied hex.
- Occupies exactly one hex at a time.

## Ports

Ports allow maritime trade. Each port is associated with two adjacent coastal vertices.

Valid port types:

| Port type | Trade rate | Standard count |
| --- | --- | ---: |
| Generic | 3:1 | 4 |
| Brick | 2:1 brick | 1 |
| Lumber | 2:1 lumber | 1 |
| Ore | 2:1 ore | 1 |
| Grain | 2:1 grain | 1 |
| Wool | 2:1 wool | 1 |

A player can use a port if they own a settlement or city on one of that port's two coastal vertices.

## Player-Owned Piece Limits

Each player has a fixed supply of pieces:

| Object type | Count per player |
| --- | ---: |
| Settlement | 5 |
| City | 4 |
| Road | 15 |

Upgrading a settlement to a city returns the settlement to the player's available supply.

## Build Costs

| Build action | Cost |
| --- | --- |
| Road | 1 brick, 1 lumber |
| Settlement | 1 brick, 1 lumber, 1 grain, 1 wool |
| City | 3 ore, 2 grain |
| Development card | 1 ore, 1 grain, 1 wool |

Development cards are part of the base game, but their scoring and achievement effects are outside the scope of this document for now.

## Development Cards

Base-game development card categories that can matter before scoring are:

- Knight
- Road Building
- Year of Plenty
- Monopoly

Victory Point development cards are part of the base game, but they are intentionally omitted for now along with victory point scoring.

## Dice and Production

Each normal turn includes a dice roll using two six-sided dice.

Production rules:

- Rolls from 2 through 12 are possible.
- A roll matching a number token causes adjacent settlements and cities to produce resources.
- A settlement produces 1 matching resource.
- A city produces 2 matching resources.
- A hex occupied by the robber produces no resources.
- A roll of 7 does not produce resources.

## Trade Types

Valid trade categories in the base game:

- Domestic trade between players.
- Maritime trade at the default 4:1 rate.
- Maritime trade at a 3:1 generic port.
- Maritime trade at a 2:1 resource-specific port.

## Setup Rules

The base setup places initial settlements and roads in two placement rounds.

Initial placement constraints:

- Each player places one settlement and one adjacent road in the first round.
- Each player places a second settlement and one adjacent road in the second round.
- The distance rule applies to all settlements during setup.
- Setup settlements do not need to connect to previous roads.

The second setup settlement grants starting resources from each adjacent resource-producing terrain hex.

## Common State Validations

A valid base Catan board state should satisfy:

- Exactly 19 terrain hexes.
- Exactly 1 desert hex.
- Exactly 18 number tokens.
- No number token on the desert.
- Exactly 1 robber.
- The robber is on a terrain hex.
- Settlements and cities are only on vertices.
- Roads are only on edges.
- No vertex has more than one settlement or city.
- No edge has more than one road.
- No settlement or city is adjacent to another settlement or city.
- Ports are only on coastal positions.
- Port types are one of the valid generic or resource-specific types.

## Out of Scope for Now

- Longest Road.
- Largest Army.
- Victory point scoring.
- Winner detection.
- Expansion-specific tiles, ports, cards, ships, commodities, fish, barbarians, or scenarios.
