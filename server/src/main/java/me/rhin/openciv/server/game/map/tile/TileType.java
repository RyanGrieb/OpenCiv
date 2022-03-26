package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import me.rhin.openciv.server.game.map.tile.improvement.ChopImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.ClearImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.FarmImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.FarmOceanImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.FortImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.LumberMillImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.MineImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.PastureImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.PlantationImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.QuarryImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.RoadImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public enum TileType implements Comparable<TileType> {

	CITY(TileLayer.TOP) {
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			return statLine;
		}
	},
	GRASS(TileLayer.BASE) {
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmImprovement());
		}
	},
	GRASS_HILL(TileLayer.BASE, TileProperty.HILL) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 2);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.GRASS_HILL_MINE, 5));
			improvements.add(new FarmImprovement());
			return improvements;
		}
	},
	PLAINS(TileLayer.BASE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmImprovement());
		}
	},
	PLAINS_HILL(TileLayer.BASE, TileProperty.HILL) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 2);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.PLAINS_HILL_MINE, 5));
			improvements.add(new FarmImprovement());
			return improvements;
		}
	},
	DESERT(TileLayer.BASE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			return statLine;
		}
	},
	FLOODPLAINS(TileLayer.BASE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmImprovement());
		}
	},
	DESERT_HILL(TileLayer.BASE, TileProperty.HILL) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 2);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.DESERT_HILL_MINE, 5));
			return improvements;
		}
	},
	TUNDRA(TileLayer.BASE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			return statLine;
		}
	},
	TUNDRA_HILL(TileLayer.BASE, TileProperty.HILL) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 2);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.TUNDRA_HILL_MINE, 5));
			return improvements;
		}
	},
	OCEAN(TileLayer.BASE, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}
	},
	SHALLOW_OCEAN(TileLayer.BASE, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}
	},
	MOUNTAIN(TileLayer.HIGH) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 1000000;
		}
	},
	FOREST(TileLayer.HIGH) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new ChopImprovement(3));
			improvements.add(new LumberMillImprovement(TileType.LUMBERMILL, 5));
			return improvements;
		}
	},
	JUNGLE(TileLayer.HIGH) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}

		@Override
		public float getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new ClearImprovement(3));
			return improvements;
		}
	},
	HORSES(TileLayer.MIDDLE, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new PastureImprovement(TileType.HORSES_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.PLAINS, TileType.TUNDRA };
		}
	},
	CATTLE(TileLayer.MIDDLE, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new PastureImprovement(TileType.CATTLE_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL };
		}
	},
	SHEEP(TileLayer.MIDDLE, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new PastureImprovement(TileType.SHEEP_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS_HILL, TileType.PLAINS_HILL, TileType.TUNDRA_HILL };
		}
	},
	IRON(TileLayer.MIDDLE, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.IRON_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	COPPER(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.COPPER_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	COTTON(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new PlantationImprovement(TileType.COTTON_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.PLAINS, TileType.DESERT, TileType.FLOODPLAINS };
		}
	},
	ORANGES(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 1);
			statLine.setValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new PlantationImprovement(TileType.ORANGES_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.PLAINS };
		}
	},
	GEMS(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 3);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.GEMS_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	MARBLE(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new QuarryImprovement(TileType.MARBLE_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	FISH(TileLayer.MIDDLE, TileProperty.RESOURCE, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmOceanImprovement(TileType.FISH_IMPROVED));
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.SHALLOW_OCEAN };
		}
	},
	CRABS(TileLayer.MIDDLE, TileProperty.LUXURY, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.GOLD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmOceanImprovement(TileType.CRABS_IMPROVED));
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.SHALLOW_OCEAN };
		}
	},
	WHALES(TileLayer.MIDDLE, TileProperty.LUXURY, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.GOLD_GAIN, 1);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmOceanImprovement(TileType.WHALES_IMPROVED));
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.SHALLOW_OCEAN };
		}
	},
	PEARLS(TileLayer.MIDDLE, TileProperty.LUXURY, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new FarmOceanImprovement(TileType.PEARLS_IMPROVED));
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.SHALLOW_OCEAN };
		}
	},
	SILVER(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.SILVER_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	GOLD(TileLayer.MIDDLE, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.GOLD_IMPROVED, 5));
			return improvements;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS, TileType.GRASS_HILL, TileType.PLAINS, TileType.PLAINS_HILL,
					TileType.TUNDRA, TileType.TUNDRA_HILL, TileType.DESERT, TileType.DESERT_HILL };
		}
	},
	FARM(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}
	},
	GEMS_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 3);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	MARBLE_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 2);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	FISH_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}
	},
	CRABS_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 1);
			statLine.addValue(Stat.FOOD_GAIN, 2);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	WHALES_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 2);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	PEARLS_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT, TileProperty.WATER) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 1);
			statLine.addValue(Stat.GOLD_GAIN, 3);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	SILVER_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 2);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	GOLD_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 2);
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	COTTON_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 4);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	ORANGES_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 3);
			statLine.addValue(Stat.FOOD_GAIN, 2);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	IRON_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	},
	COPPER_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			statLine.addValue(Stat.GOLD_GAIN, 2);
			statLine.addValue(Stat.MORALE_TILE, 10);
			return statLine;
		}
	},
	GRASS_HILL_MINE(TileLayer.BASE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	},
	PLAINS_HILL_MINE(TileLayer.BASE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	},
	TUNDRA_HILL_MINE(TileLayer.BASE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	},
	DESERT_HILL_MINE(TileLayer.BASE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	},
	HORSES_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 2);
			// statLine.addValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}
	},
	CATTLE_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}
	},
	SHEEP_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}
	},
	LUMBERMILL(TileLayer.HIGH, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 2);
			statLine.addValue(Stat.GOLD_GAIN, 1);
			return statLine;
		}
	},
	FORT(TileLayer.MIDDLE) {
		@Override
		public StatLine getStatLine() {
			return new StatLine();
		}

		@Override
		public float getMovementCost() {
			return 0.5f;
		}
	},
	ST_HELENS(TileLayer.HIGH, TileProperty.NATURAL_WONDER) {

		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.HERITAGE_GAIN, 3);
			statLine.addValue(Stat.GOLD_GAIN, 4);
			statLine.addValue(Stat.FOOD_GAIN, 2);
			return statLine;
		}

		@Override
		public TileType[] getSpawnTileTypes() {
			return new TileType[] { TileType.GRASS };
		}

		@Override
		public float getMovementCost() {
			return 1000000;
		}
	},
	BARBARIAN_CAMP(TileLayer.MIDDLE) {
		@Override
		public StatLine getStatLine() {
			return new StatLine();
		}
	},
	RUINS(TileLayer.LOW) {
		@Override
		public StatLine getStatLine() {
			return new StatLine();
		}
	},
	ROAD(TileLayer.LOW) {
		@Override
		public StatLine getStatLine() {
			return new StatLine();
		}

		@Override
		public float getMovementCost() {
			return 0.5f;
		}
	},;

	public enum TileLayer {
		BASE,
		LOW,
		MIDDLE,
		HIGH,
		TOP,
		RIVER;
	}

	public enum TileProperty {
		WATER,
		LUXURY,
		RESOURCE,
		IMPROVEMENT,
		HILL,
		NATURAL_WONDER;
	}

	private TileLayer tileLayer;
	private TileProperty[] tileProperties;

	TileType(TileLayer tileLayer, TileProperty... tileProperties) {
		this.tileLayer = tileLayer;
		this.tileProperties = tileProperties;
	}

	public static ArrayList<TileType> getTilesOfProperty(TileProperty... tileProperty) {

		ArrayList<TileType> tileTypes = new ArrayList<>();

		for (TileType tileType : values()) {
			if (tileType.hasProperty(tileProperty))
				tileTypes.add(tileType);
		}

		return tileTypes;
	}

	public abstract StatLine getStatLine();

	public List<TileImprovement> getImprovements() {
		return null;
	}

	public float getMovementCost() {
		return 1;
	}

	public int getID() {
		for (int i = 0; i < values().length; i++) {
			if (values()[i].equals(this))
				return i;
		}

		return -1;
	}

	public TileLayer getTileLayer() {
		return tileLayer;
	}

	public TileProperty[] getProperties() {
		return tileProperties;
	}

	public List<TileProperty> getPropertiesList() {
		return Arrays.asList(tileProperties);
	}

	public boolean hasProperty(TileProperty... targetProperties) {
		if (tileProperties == null)
			return false;

		for (TileProperty tileProperty : tileProperties) {
			for (TileProperty targetProperty : targetProperties)
				if (tileProperty == targetProperty)
					return true;
		}
		return false;
	}

	public static TileType getRandomLandLuxuryTile() {
		ArrayList<TileType> luxuryTypes = new ArrayList<>();
		for (TileType type : values()) {
			if (type.hasProperty(TileProperty.LUXURY))
				luxuryTypes.add(type);
		}

		Random rnd = new Random();

		return luxuryTypes.get(rnd.nextInt(luxuryTypes.size()));
	}

	public static TileType getRandomResourceTile() {
		ArrayList<TileType> resourceTypes = new ArrayList<>();
		for (TileType type : values()) {
			if (type.hasProperty(TileProperty.RESOURCE))
				resourceTypes.add(type);
		}

		Random rnd = new Random();

		return resourceTypes.get(rnd.nextInt(resourceTypes.size()));
	}

	public TileImprovement getImprovement(String improvementName) {
		if (improvementName.equals("road"))
			return new RoadImprovement();
//FIXME: Do this a better way?`
		if (improvementName.equals("fort"))
			return new FortImprovement();

		for (TileImprovement tileImprovement : getImprovements()) {
			if (tileImprovement.getName().equals(improvementName))
				return tileImprovement;
		}

		return null;
	}

	/**
	 * Returns the tile types that specific tile spawns in
	 * 
	 * @return
	 */
	public TileType[] getSpawnTileTypes() {
		return null;
	}
}