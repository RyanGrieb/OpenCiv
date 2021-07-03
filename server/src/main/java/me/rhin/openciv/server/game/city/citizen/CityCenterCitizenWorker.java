package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public class CityCenterCitizenWorker extends CitizenWorker {

	public CityCenterCitizenWorker(City city, Tile tile) {
		super(city, tile);
	}

	@Override
	public void onClick() {
		// Do nothing, since the city center tile cannot me modified.
	}

	@Override
	public boolean isValidTileWorker() {
		return true;
	}

	@Override
	public WorkerType getWorkerType() {
		return WorkerType.CITY_CENTER;
	}
}
