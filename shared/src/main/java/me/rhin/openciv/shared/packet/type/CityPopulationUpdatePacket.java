package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

/**
 * Packet that updates other players of a change in city population. DOES NOT,
 * get sent to the owner of that city.
 * 
 * @author Ryan
 *
 */
public class CityPopulationUpdatePacket extends Packet {

	private String cityName;
	private int population;

	@Override
	public void write(Json json) {
		super.write(json);
		json.writeValue("cityName", cityName);
		json.writeValue("population", population);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.cityName = jsonData.getString("cityName");
		this.population = jsonData.getInt("population");
	}

	public void setCity(String cityName, int population) {
		this.cityName = cityName;
		this.population = population;
	}

	public String getCityName() {
		return cityName;
	}

	public int getPopulation() {
		return population;
	}

}
