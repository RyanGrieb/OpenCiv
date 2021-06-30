package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import me.rhin.openciv.server.game.map.tile.improvement.ChopImprovement;
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
			return Arrays.asList(new TileImprovement(TileType.FARM, 5));
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
			return Arrays.asList(new TileImprovement(TileType.FARM, 5));
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
	FOREST(TileLayer.MIDDLE) {
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
	JUNGLE(TileLayer.MIDDLE) {
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
	HORSES(TileLayer.HIGH, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}
	},
	IRON(TileLayer.HIGH, TileProperty.RESOURCE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
		}
	},
	COPPER(TileLayer.HIGH, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}
	},
	COTTON(TileLayer.HIGH, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 2);
			return statLine;
		}
	},
	GEMS(TileLayer.HIGH, TileProperty.LUXURY) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.GOLD_GAIN, 3);
			return statLine;
		}

		@Override
		public List<TileImprovement> getImprovements() {
			return Arrays.asList(new TileImprovement(TileType.GEMS_IMPROVED, 5));
		}
	},
	FARM(TileLayer.HIGH, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.FOOD_GAIN, 1);
			return statLine;
		}
	},
	GEMS_IMPROVED(TileLayer.HIGH, TileProperty.IMPROVEMENT) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.addValue(Stat.GOLD_GAIN, 3);
			statLine.addValue(Stat.PRODUCTION_GAIN, 3);
			return statLine;
		}
	};

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

	public boolean hasProperty(TileProperty targetProperty) {
		if (tileProperties == null)
			return false;

		for (TileProperty tileProperty : tileProperties)
			if (tileProperty == targetProperty)
				return true;

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