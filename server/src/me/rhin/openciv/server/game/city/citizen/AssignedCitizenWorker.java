package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public class AssignedCitizenWorker extends CitizenWorker {

	public AssignedCitizenWorker(City city, Tile tile) {
		super(city, tile);
	}

	@Override
	public void onClick() {
		city.removeCitizenWorkerFromTile(tile);
	}

	@Override
	public boolean isValidTileWorker() {
		return true;
	}

	@Override
	public WorkerType getWorkerType() {
		return WorkerType.ASSIGNED;
	}
}
