package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import me.rhin.openciv.server.game.map.tile.improvement.ChopImprovement;
import me.rhin.openciv.server.game.map.tile.improvement.MineImprovement;
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
			return Arrays.asList(new TileImprovement(TileType.FARM, 5));
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
		public int getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.GRASS_HILL_MINE, 5));
			improvements.add(new TileImprovement(TileType.FARM, 5));
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
			return Arrays.asList(new TileImprovement(TileType.FARM, 5));
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
		public int getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new MineImprovement(TileType.PLAINS_HILL_MINE, 5));
			improvements.add(new TileImprovement(TileType.FARM, 5));
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
			return Arrays.asList(new TileImprovement(TileType.FARM, 5));
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
		public int getMovementCost() {
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
		public int getMovementCost() {
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
	MOUNTAIN(TileLayer.MIDDLE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			return statLine;
		}

		@Override
		public int getMovementCost() {
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
		public int getMovementCost() {
			return 2;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			ArrayList<TileImprovement> improvements = new ArrayList<>();
			improvements.add(new ChopImprovement(3));
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
		public int getMovementCost() {
			return 2;
		}
	},
	HORSES(TileLayer.MIDDLE, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
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
			improvements.add(new MineImprovement(TileType.COTTON_IMPROVED, 5));
			return improvements;
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
			return statLine;
		}
	},
	COTTON_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 3);
			return statLine;
		}
	},
	IRON_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}
	},
	COPPER_IMPROVED(TileLayer.MIDDLE, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.PRODUCTION_GAIN, 1);
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
	;

	public enum TileLayer {
		BASE,
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
		HILL;
	}

	private TileLayer tileLayer;
	private TileProperty[] tileProperties;

	TileType(TileLayer tileLayer, TileProperty... tileProperties) {
		this.tileLayer = tileLayer;
		this.tileProperties = tileProperties;
	}

	public abstract StatLine getStatLine();

	public List<TileImprovement> getImprovements() {
		return null;
	}

	public int getMovementCost() {
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

	TileImprovement getImprovement(String improvementName) {
		for (TileImprovement tileImprovement : getImprovements()) {
			if (tileImprovement.getName().equals(improvementName))
				return tileImprovement;
		}

		return null;
	}
}