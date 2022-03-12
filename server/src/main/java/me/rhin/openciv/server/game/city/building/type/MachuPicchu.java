package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.research.type.GuildsTech;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class MachuPicchu extends Building implements Wonder {

	public MachuPicchu(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);
		statLine.addValue(Stat.GOLD_GAIN, 5);

		return statLine;
	}

	@Override
	public void create() {
		super.create();

		city.getStatLine().addModifier(Stat.TRADE_GOLD_MODIFIER, 0.5F);
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean adjMountain = false;

		for (Tile adjTile : city.getTile().getAdjTiles()) {
			if (adjTile.containsTileType(TileType.MOUNTAIN))
				adjMountain = true;
		}

		return city.getPlayerOwner().getResearchTree().hasResearched(GuildsTech.class)
				&& !Server.getInstance().getInGameState().getWonders().isBuilt(getClass()) && adjMountain;
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return 300;
	}

	@Override
	public String getName() {
		return "Machu Picchu";
	}

}
