package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public class LockedCitizenWorker extends CitizenWorker {

	public LockedCitizenWorker(City city, Tile tile) {
		super(city, tile);
	}

	@Override
	public void onClick() {
		city.setCitizenTileWorker(new AssignedCitizenWorker(city, tile));
		city.updateWorkedTiles();
		city.getPlayerOwner().updateOwnedStatlines(false);
	}
	
	@Override
	public boolean isValidTileWorker() {
		return true;
	}

	@Override
	public WorkerType getWorkerType() {
		return WorkerType.LOCKED;
	}
}