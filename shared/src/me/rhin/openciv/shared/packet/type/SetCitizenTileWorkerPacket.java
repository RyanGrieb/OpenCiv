package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class SetCitizenTileWorkerPacket extends Packet {

	// FIXME: Is this the right spot to put this enum?
	public enum WorkerType {
		ASSIGNED, LOCKED, CITY_CENTER, UNEMPLOYED, EMPTY;
	}

	private String cityName;
	private int workerType;
	private int gridX, gridY;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("workerType", workerType);
		json.writeValue("cityName", cityName);
		json.writeValue("gridX", gridX);
		json.writeValue("gridY", gridY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.workerType = jsonData.getInt("workerType");
		this.cityName = jsonData.getString("cityName");
		this.gridX = jsonData.getInt("gridX");
		this.gridY = jsonData.getInt("gridY");
	}

	public int getGridX() {
		return gridX;
	}

	public int getGridY() {
		return gridY;
	}

	public WorkerType getWorkerType() {
		return WorkerType.values()[workerType];
	}

	public String getCityName() {
		return cityName;
	}

	public void setWorker(WorkerType workerType, String cityName, int gridX, int gridY) {
		this.workerType = workerType.ordinal();
		this.cityName = cityName;
		this.gridX = gridX;
		this.gridY = gridY;
	}
}
