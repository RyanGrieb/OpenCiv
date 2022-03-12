package me.rhin.openciv.game.city.building.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.city.wonders.Wonder;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.GuildsTech;
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
	public TextureEnum getTexture() {
		return TextureEnum.BUILDING_MACHU_PICCHU;
	}

	@Override
	public boolean meetsProductionRequirements() {

		boolean adjMountain = false;

		for (Tile adjTile : city.getTile().getAdjTiles()) {
			if (adjTile.containsTileType(TileType.MOUNTAIN))
				adjMountain = true;
		}

		return city.getPlayerOwner().getResearchTree().hasResearched(GuildsTech.class)
				&& !Civilization.getInstance().getGame().getWonders().isBuilt(getClass()) && adjMountain;
	}

	@Override
	public String getDesc() {
		return "A world wonder of the Medieval\nera.\nCity must adjacent to a mountain.\n\n+1 Heritage\n+5 Gold\n+50% gold from trade";
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
