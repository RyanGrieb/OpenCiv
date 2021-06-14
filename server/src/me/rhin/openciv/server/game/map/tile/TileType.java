package me.rhin.openciv.server.game.map.tile;

import java.util.ArrayList;
import java.util.Random;

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
	},
	PLAINS(TileLayer.BASE) {
		@Override
		public StatLine getStatLine() {
			StatLine statLine = new StatLine();
			statLine.setValue(Stat.FOOD_GAIN, 1);
			statLine.setValue(Stat.PRODUCTION_GAIN, 1);
			return statLine;
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
	};

	public enum TileLayer {
		BASE, MIDDLE, HIGH, TOP, RIVER;
	}

	public enum TileProperty {
		WATER, LUXURY, RESOURCE, HILL;
	}

	private TileLayer tileLayer;
	private TileProperty[] tileProperties;

	TileType(TileLayer tileLayer, TileProperty... tileProperties) {
		this.tileLayer = tileLayer;
		this.tileProperties = tileProperties;
	}

	public abstract StatLine getStatLine();

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
}