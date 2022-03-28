package me.rhin.openciv.game.map.road;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.events.type.RoadConstructedEvent;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class Road implements Listener {

	private Tile originTile;
	private Tile targetTile;
	private Tile prevTile;
	private RoadPart roadPart;

	public Road(Tile originTile) {
		this.originTile = originTile;

		Civilization.getInstance().getEventManager().addListener(this);

		// Now figure out what direction were going in.

		// LOGGER.info("Setting road!");

		// FIXME: Account for if the road is being set not by anything.

		ArrayList<Road> openAdjRoads = new ArrayList<>();
		Tile adjCityTile = null;
		Tile prevTile = null;
		Tile targetTile = null;

		// 1. Prioritize open roads
		// 2. Prioritize cities
		// 3. Prioritize other roads
		// 4. Set horizontal road

		for (Tile adjTile : originTile.getAdjTiles()) {
			if (adjTile.getRoad() != null && adjTile.getRoad().isOpen()) {
				openAdjRoads.add(adjTile.getRoad());
			}

			if (adjTile.getCity() != null)
				adjCityTile = adjTile;
		}

		if (openAdjRoads.size() > 0) {
			// FIXME: Account for multiple roads
			prevTile = openAdjRoads.get(0).getOriginTile();
		} else if (adjCityTile != null) {
			prevTile = adjCityTile;
		}

		// TODO: Set target tile if were nearby a road with a null target or city
		for (Tile adjTile : originTile.getAdjTiles()) {
			if (adjTile.equals(prevTile))
				continue;
			if (adjTile.getRoad() != null && adjTile.getRoad().isOpen() || adjTile.getCity() != null)
				targetTile = adjTile;
		}

		this.prevTile = prevTile;
		this.targetTile = targetTile;
		// LOGGER.info("We initalizing ourselfs: [" + originTile.getGridX() + "," +
		// originTile.getGridY() + "]");

		// LOGGER.info(prevTile + "," + targetTile);
		// LOGGER.info("--------------------------");
		defineRoadEnum();

		Civilization.getInstance().getEventManager().fireEvent(new RoadConstructedEvent(this));
	}

	@EventHandler
	public void onRoadConstructed(Road road) {
		if (road.getOriginTile().equals(originTile))
			return;

		// Reset our direction based on what we got going on
		boolean adjRoad = false;
		for (Tile adjTile : road.getOriginTile().getAdjTiles())
			if (originTile.equals(adjTile))
				adjRoad = true;

		if (!adjRoad || (prevTile != null && targetTile != null))
			return;

		// LOGGER.info("Called");
		// LOGGER.info("We are: [" + originTile.getGridX() + "," + originTile.getGridY()
		// + "]");

		if (targetTile == null)
			targetTile = road.getOriginTile();
		else if (prevTile == null)
			prevTile = road.getOriginTile();

		// LOGGER.info(prevTile + "," + targetTile);
		// LOGGER.info("=======================");

		defineRoadEnum();
		originTile.applyRoad();
	}

	public Tile getTargetTile() {
		return targetTile;
	}

	public Tile getPrevTile() {
		return prevTile;
	}

	public RoadPart getRoadPart() {
		return roadPart;
	}

	public Tile getOriginTile() {
		return originTile;
	}

	public boolean isOpen() {
		return prevTile == null || targetTile == null;
	}

	private void defineRoadEnum() {
		int prevTileIndex = -1;
		int targetTileIndex = -1;

		for (int i = 0; i < originTile.getAdjTiles().length; i++) {
			if (originTile.getAdjTiles()[i].equals(prevTile))
				prevTileIndex = i;
		}

		for (int i = 0; i < originTile.getAdjTiles().length; i++) {
			if (originTile.getAdjTiles()[i].equals(targetTile))
				targetTileIndex = i;
		}

		if (prevTile == null) {
			prevTileIndex = 5; // Default to a horizontal axis.
		}

		// Just set our index to the opposite side of the previous tile
		if (targetTile == null) {
			switch (prevTileIndex) {
			case 0:
				targetTileIndex = 3;
				break;
			case 1:
				targetTileIndex = 4;
				break;
			case 2:
				targetTileIndex = 5;
				break;
			case 3:
				targetTileIndex = 0;
				break;
			case 4:
				targetTileIndex = 1;
				break;
			case 5:
				targetTileIndex = 2;
				break;
			}
		}

		this.roadPart = RoadPart.fetchRoadPart(prevTileIndex, targetTileIndex);
		// LOGGER.info(prevTile + "," + targetTile);

		// if (prevTile != null)
		// LOGGER.info("prev:" + prevTile.getGridX() + "," + prevTile.getGridY());
		// if (targetTile != null)
		// LOGGER.info("target:" + targetTile.getGridX() + "," + targetTile.getGridY());

		// LOGGER.info(prevTileIndex + "," + targetTileIndex);
		// LOGGER.info("Setting ourselfs +[" + originTile.getGridX() + "," +
		// originTile.getGridY() + "]" + " TO: "
		// + roadPart.name());
		// LOGGER.info("***************");
	}
}
