package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public class EmptyCitizenWorker extends CitizenWorker {

	public EmptyCitizenWorker(City city, Tile tile) {
		super(city, tile);
	}

	@Override
	public void onClick() {
		// TODO: Take any unemployed citizens away. If not, take away any unlocked tiles
		// first from the city. If not possible, take any locked away.
		//Set the tile to a locked citizen worker
		//Update & send the statline to the player.
	}
	
	@Override
	public boolean isValidTileWorker() {
		return false;
	}

	@Override
	public WorkerType getWorkerType() {
		return WorkerType.EMPTY;
	}
}
