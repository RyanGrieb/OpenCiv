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
		city.lockCitizenAtTile(tile);
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
