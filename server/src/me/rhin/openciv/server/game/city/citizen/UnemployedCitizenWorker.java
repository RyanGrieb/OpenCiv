package me.rhin.openciv.server.game.city.citizen;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;

public class UnemployedCitizenWorker extends CitizenWorker {

	public UnemployedCitizenWorker(City city) {
		super(city);
	}

	@Override
	public void onClick() {

	}

	@Override
	public WorkerType getWorkerType() {
		return WorkerType.UNEMPLOYED;
	}
}
