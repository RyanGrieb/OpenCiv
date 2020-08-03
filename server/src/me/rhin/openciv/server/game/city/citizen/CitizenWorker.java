package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public abstract class CitizenWorker {

	protected City city;
	protected Tile tile;

	public CitizenWorker(City city) {
		this.city = city;
	}

	public CitizenWorker(City city, Tile tile) {
		this.city = city;
		this.tile = tile;
	}

	public abstract void onClick();
	public abstract boolean isValidTileWorker();
	
	public abstract WorkerType getWorkerType();

	public Tile getTile() {
		return tile;
	}
}
