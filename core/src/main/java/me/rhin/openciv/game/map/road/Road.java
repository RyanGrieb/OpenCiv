package me.rhin.openciv.game.map.road;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.listener.RoadConstructedListener;

public class Road implements RoadConstructedListener {

	private Tile originTile;
	private Tile targetTile;
	private Tile prevTile;
	private RoadPart roadPart;

	public Road(Tile originTile) {
		this.originTile = originTile;

		Civilization.getInstance().getEventManager().addListener(RoadConstructedListener.class, this);

		// Now figure out what direction were going in.

		//System.out.println("Setting road!");

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
		//System.out.println("We initalizing ourselfs: [" + originTile.getGridX() + "," + originTile.getGridY() + "]");

		//System.out.println(prevTile + "," + targetTile);
		//System.out.println("--------------------------");
		defineRoadEnum();

		Civilization.getInstance().getEventManager().fireEvent(new RoadConstructedEvent(this));
	}

	@Override
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

		//System.out.println("Called");
		//System.out.println("We are: [" + originTile.getGridX() + "," + originTile.getGridY() + "]");

		if (targetTile == null)
			targetTile = road.getOriginTile();
		else if (prevTile == null)
			prevTile = road.getOriginTile();

		//System.out.println(prevTile + "," + targetTile);
		//System.out.println("=======================");

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
		//System.out.println(prevTile + "," + targetTile);

		//if (prevTile != null)
		//	System.out.println("prev:" + prevTile.getGridX() + "," + prevTile.getGridY());
		//if (targetTile != null)
		//	System.out.println("target:" + targetTile.getGridX() + "," + targetTile.getGridY());

		//System.out.println(prevTileIndex + "," + targetTileIndex);
		//System.out.println("Setting ourselfs +[" + originTile.getGridX() + "," + originTile.getGridY() + "]" + " TO: "
		//		+ roadPart.name());
		//System.out.println("***************");
	}
}
